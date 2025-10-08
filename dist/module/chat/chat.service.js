import prisma from '../../config/database.js';
import pythonBackendService from '../../services/python-backend.service.js';
import cacheService from '../../services/cache.service.js';
import { AppError } from '../../middleware/error.middleware.js';
import crypto from 'crypto';
// Type guards for agentic mode responses
function isUploadAndChatResponse(response) {
    return 'document_id' in response && 'agent_response' in response;
}
function isAgentChatResponse(response) {
    return 'session_id' in response && !('document_id' in response);
}
// Helper functions to extract data from different response types
function getResponseText(response) {
    try {
        let mainResponse = '';
        if (isUploadAndChatResponse(response)) {
            // agent_response is a string containing the full formatted response
            mainResponse = response.agent_response || '';
        }
        else if (isAgentChatResponse(response)) {
            mainResponse = response.response || '';
        }
        else {
            mainResponse = response.response || '';
        }
        // If main response is empty, try to extract from intermediate_steps
        if (!mainResponse || (typeof mainResponse === 'string' && mainResponse.trim() === '')) {
            const metadata = getMetadata(response);
            if (metadata.intermediate_steps && Array.isArray(metadata.intermediate_steps)) {
                const firstStep = metadata.intermediate_steps[0];
                if (firstStep && firstStep.result) {
                    mainResponse = firstStep.result;
                }
            }
        }
        // Handle different response formats
        if (typeof mainResponse === 'string') {
            return mainResponse;
        }
        else if (typeof mainResponse === 'object' && mainResponse !== null) {
            // If response is an object, try to extract text content
            if (mainResponse.answer) {
                // RAG chat response format
                let content = mainResponse.answer;
                if (mainResponse.sources) {
                    content += '\n\n**Sources:**\n' + mainResponse.sources;
                }
                return content;
            }
            else if (mainResponse.response) {
                // Nested response format
                return typeof mainResponse.response === 'string' ? mainResponse.response : JSON.stringify(mainResponse.response);
            }
            else {
                // Fallback: stringify the object
                return JSON.stringify(mainResponse);
            }
        }
        return mainResponse?.toString() || '';
    }
    catch (error) {
        console.error('Error extracting response text:', error);
        console.error('Response object:', JSON.stringify(response, null, 2));
        return '';
    }
}
function getSessionId(response) {
    if (isUploadAndChatResponse(response)) {
        return response.session_id;
    }
    else if (isAgentChatResponse(response)) {
        return response.session_id;
    }
    return undefined;
}
function getDocumentId(response) {
    if (isUploadAndChatResponse(response)) {
        return response.document_id;
    }
    return undefined;
}
// Simplified metadata 
function getSimplifiedMetadata(response) {
    const baseMetadata = {
        tools_used: [],
    };
    // Extract tools with details from intermediate_steps
    const fullMetadata = getMetadata(response);
    const intermediateSteps = fullMetadata.intermediate_steps || [];
    const toolsWithDetails = intermediateSteps.map((step) => {
        const toolInfo = {
            tool: step.tool || 'unknown',
        };
        // Extract query_time and chunks info from result
        if (step.result) {
            if (typeof step.result === 'object') {
                if (step.result.query_time !== undefined) {
                    toolInfo.query_time = step.result.query_time;
                }
                if (step.result.chunks_used !== undefined) {
                    toolInfo.chunks_used = step.result.chunks_used;
                }
                if (step.result.total_chunks !== undefined) {
                    toolInfo.total_chunks = step.result.total_chunks;
                }
            }
        }
        return toolInfo;
    });
    // Fallback to simple tool names if no detailed tools found
    if (toolsWithDetails.length > 0) {
        baseMetadata.tools_used = toolsWithDetails;
    }
    else {
        // Extract tools_used based on response type
        let simpleTools = [];
        if (isUploadAndChatResponse(response)) {
            simpleTools = response.tools_used || [];
        }
        else if (isAgentChatResponse(response)) {
            simpleTools = response.tools_used || [];
        }
        baseMetadata.tools_used = simpleTools.map((tool) => ({ tool }));
    }
    // Add document_id for upload responses
    if (isUploadAndChatResponse(response)) {
        baseMetadata.document_id = response.document_id;
    }
    // Calculate totals for all tools
    let totalQueryTime = 0;
    let maxTotalChunks = 0;
    toolsWithDetails.forEach((tool) => {
        if (tool.query_time)
            totalQueryTime += tool.query_time;
        if (tool.total_chunks)
            maxTotalChunks = Math.max(maxTotalChunks, tool.total_chunks);
    });
    if (totalQueryTime > 0) {
        baseMetadata.total_query_time = Number(totalQueryTime.toFixed(2));
    }
    if (maxTotalChunks > 0) {
        baseMetadata.total_chunks = maxTotalChunks;
    }
    return baseMetadata;
}
// Full metadata for internal processing 
function getMetadata(response) {
    if (isUploadAndChatResponse(response)) {
        return {
            tools_used: response.tools_used,
            intermediate_steps: response.intermediate_steps,
            raw_results: response.raw_results,
            language_info: response.language_info,
            deduplication_info: response.deduplication_info,
            storage_url: response.storage_url,
        };
    }
    else if (isAgentChatResponse(response)) {
        return {
            tools_used: response.tools_used,
            intermediate_steps: response.intermediate_steps,
            raw_results: response.raw_results,
            language_info: response.language_info,
        };
    }
    return {};
}
class ChatService {
    async createConversation(userId, title, mode, documentId, documentName, sessionId, clientProvidedId) {
        try {
            const conversationData = {
                userId,
                title,
                mode,
                documentId: documentId || null,
                documentName: documentName || null,
                sessionId: sessionId || null,
            };
            // If a client-provided ID is given, use it when creating the conversation
            if (clientProvidedId) {
                conversationData.id = clientProvidedId;
            }
            else {
                conversationData.id = crypto.randomUUID();
            }
            const conversation = await prisma.conversation.create({
                data: conversationData,
            });
            return conversation;
        }
        catch (error) {
            // Handle unique constraint violation (duplicate ID)
            if (error.code === 'P2002' && error.meta?.target?.includes('id')) {
                // ID already exists, try with a new one
                console.warn('Client ID collision, generating new ID');
                const conversationData = {
                    userId,
                    title,
                    mode,
                    documentId: documentId || null,
                    documentName: documentName || null,
                    sessionId: sessionId || null,
                    id: crypto.randomUUID(), // Generate new ID
                };
                const conversation = await prisma.conversation.create({
                    data: conversationData,
                });
                return conversation;
            }
            throw error;
        }
    }
    async sendMessage(userId, conversationId, message, mode, file, inputLanguage, outputLanguage) {
        // First, ensure conversation exists and belongs to user
        const conversation = await prisma.conversation.findFirst({
            where: { id: conversationId, userId },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                    take: 20,
                },
            },
        });
        if (!conversation) {
            // This should rarely happen with the new flow, but handle it gracefully
            console.error(`Conversation ${conversationId} not found for user ${userId}`);
            throw new AppError('Conversation not found. Please create a new conversation.', 404);
        }
        // Check cache (only for non-file queries)
        if (!file) {
            const cachedResponse = await cacheService.getAIResponse(message, mode);
            if (cachedResponse) {
                // Save user message
                const userMessage = await prisma.message.create({
                    data: {
                        id: crypto.randomUUID(),
                        conversationId,
                        role: 'USER',
                        content: message,
                        attachments: [],
                    },
                });
                const assistantMessage = await prisma.message.create({
                    data: {
                        id: crypto.randomUUID(),
                        conversationId,
                        role: 'ASSISTANT',
                        content: getResponseText(cachedResponse),
                        metadata: {
                            cached: true,
                            ...getSimplifiedMetadata(cachedResponse)
                        },
                        attachments: [],
                    },
                });
                await prisma.conversation.update({
                    where: { id: conversationId },
                    data: { lastMessageAt: new Date() },
                });
                return {
                    message: assistantMessage,
                    conversation: {
                        id: conversationId,
                        sessionId: getSessionId(cachedResponse),
                        documentId: getDocumentId(cachedResponse)
                    }
                };
            }
        }
        let aiResponse;
        // Handle different scenarios based on mode and file
        if (file && mode === 'AGENTIC') {
            aiResponse = await pythonBackendService.agentUploadAndChat(file.buffer, file.fileName, message, conversation.sessionId || undefined, inputLanguage, outputLanguage);
            const updateData = {};
            const docId = getDocumentId(aiResponse);
            if (docId) {
                updateData.documentId = docId;
                updateData.documentName = file.fileName;
            }
            const newSessionId = getSessionId(aiResponse);
            if (newSessionId) {
                updateData.sessionId = newSessionId;
            }
            if (Object.keys(updateData).length > 0) {
                await prisma.conversation.update({
                    where: { id: conversationId },
                    data: updateData,
                });
            }
        }
        else if (conversation.documentId && mode === 'AGENTIC') {
            const sessionId = conversation.sessionId;
            aiResponse = await pythonBackendService.agentChat(message, sessionId || undefined, conversation.documentId);
            const newSessionId = getSessionId(aiResponse);
            if (newSessionId && newSessionId !== sessionId) {
                await prisma.conversation.update({
                    where: { id: conversationId },
                    data: { sessionId: newSessionId },
                });
            }
        }
        else if (mode === 'AGENTIC') {
            const sessionId = conversation.sessionId;
            aiResponse = await pythonBackendService.agentChat(message, sessionId || undefined);
            const newSessionId = getSessionId(aiResponse);
            if (newSessionId && newSessionId !== sessionId) {
                await prisma.conversation.update({
                    where: { id: conversationId },
                    data: { sessionId: newSessionId },
                });
            }
        }
        else {
            // Normal chat mode
            aiResponse = await pythonBackendService.chat(message);
        }
        // Cache the response
        if (!file) {
            await cacheService.cacheAIResponse(message, mode, aiResponse);
        }
        // Save user message
        const userMessage = await prisma.message.create({
            data: {
                id: crypto.randomUUID(),
                conversationId,
                role: 'USER',
                content: message,
                attachments: file ? [file.fileName] : [],
            },
        });
        // Extract and validate response text
        const responseText = getResponseText(aiResponse);
        const messageContent = responseText || 'AI response received but content could not be extracted.';
        // Save assistant message
        const assistantMessage = await prisma.message.create({
            data: {
                id: crypto.randomUUID(),
                conversationId,
                role: 'ASSISTANT',
                content: messageContent,
                metadata: {
                    ...getSimplifiedMetadata(aiResponse),
                    document_id: conversation.documentId || getDocumentId(aiResponse),
                },
                attachments: [],
            },
        });
        // Update conversation timestamp
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() },
        });
        // Clear cache
        await cacheService.clearUserCache(userId);
        return {
            message: assistantMessage,
            conversation: {
                id: conversationId,
                sessionId: getSessionId(aiResponse),
                documentId: getDocumentId(aiResponse)
            }
        };
    }
    async getConversations(userId) {
        // Check cache
        const cached = await cacheService.getUserData(`conversations:${userId}`);
        if (cached)
            return cached;
        const conversations = await prisma.conversation.findMany({
            where: { userId },
            orderBy: { lastMessageAt: 'desc' },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
        // Cache for 30 minutes
        await cacheService.cacheUserData(`conversations:${userId}`, conversations, 1800);
        return conversations;
    }
    async getConversationMessages(userId, conversationId) {
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                userId,
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!conversation) {
            throw new AppError('Conversation not found', 404);
        }
        return conversation;
    }
    async deleteConversation(userId, conversationId) {
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                userId,
            },
        });
        if (!conversation) {
            throw new AppError('Conversation not found', 404);
        }
        await prisma.conversation.delete({
            where: { id: conversationId },
        });
        // Clear cache
        await cacheService.clearUserCache(userId);
    }
    async deleteAllConversations(userId) {
        // Delete all conversations for the user
        const result = await prisma.conversation.deleteMany({
            where: {
                userId,
            },
        });
        // Clear cache
        await cacheService.clearUserCache(userId);
        return {
            deletedCount: result.count,
        };
    }
    // Get conversation info including document
    async getConversationInfo(userId, conversationId) {
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                userId,
            },
            select: {
                id: true,
                title: true,
                mode: true,
                documentId: true,
                documentName: true,
                sessionId: true,
                createdAt: true,
            },
        });
        if (!conversation) {
            throw new AppError('Conversation not found', 404);
        }
        return conversation;
    }
    /**
     * Share or unshare a conversation
     */
    async shareConversation(userId, conversationId, share, req) {
        // Verify conversation exists and belongs to user
        const conversation = await prisma.conversation.findFirst({
            where: {
                id: conversationId,
                userId,
            },
        });
        if (!conversation) {
            throw new AppError('Conversation not found', 404);
        }
        if (share) {
            // Check if link already exists
            let existingLink = await prisma.sharedLink.findFirst({
                where: {
                    userId,
                    conversationId,
                },
            });
            if (!existingLink) {
                // Generate random hash using crypto
                const hashedLink = crypto.randomBytes(8).toString('hex');
                existingLink = await prisma.sharedLink.create({
                    data: {
                        hashedLink,
                        userId,
                        conversationId,
                    },
                });
            }
            // Update conversation sharing status
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { isShared: true },
            });
            // Update user sharing enabled status
            await prisma.user.update({
                where: { id: userId },
                data: { shareEnabled: true },
            });
            return {
                link: `${req.protocol}://${req.get('host')}/api/v1/chat/shared/${existingLink.hashedLink}`,
            };
        }
        else {
            // Disable sharing
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { isShared: false },
            });
            // Delete the shared link
            await prisma.sharedLink.deleteMany({
                where: {
                    userId,
                    conversationId,
                },
            });
            return { message: 'Sharing disabled' };
        }
    }
    /**
     * Get shared conversation by hash link
     */
    async getSharedConversation(shareLink) {
        // Find the shared link
        const linkDoc = await prisma.sharedLink.findUnique({
            where: { hashedLink: shareLink },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        shareEnabled: true,
                    },
                },
                conversation: {
                    include: {
                        messages: {
                            orderBy: { createdAt: 'asc' },
                            select: {
                                id: true,
                                role: true,
                                content: true,
                                createdAt: true,
                                attachments: true,
                            },
                        },
                    },
                },
            },
        });
        if (!linkDoc) {
            throw new AppError('Invalid share link', 404);
        }
        if (!linkDoc.user.shareEnabled) {
            throw new AppError('Sharing is disabled for this user', 403);
        }
        if (!linkDoc.conversation) {
            throw new AppError('Shared conversation not found', 404);
        }
        if (!linkDoc.conversation.isShared) {
            throw new AppError('This conversation is no longer shared', 403);
        }
        // Check if link is expired
        if (linkDoc.expiresAt && linkDoc.expiresAt < new Date()) {
            throw new AppError('Share link has expired', 403);
        }
        // Check view limits
        if (linkDoc.maxViews && linkDoc.viewCount >= linkDoc.maxViews) {
            throw new AppError('Share link view limit exceeded', 403);
        }
        // Increment view count
        await prisma.sharedLink.update({
            where: { id: linkDoc.id },
            data: { viewCount: linkDoc.viewCount + 1 },
        });
        return {
            userName: linkDoc.user.name || linkDoc.user.email,
            conversation: {
                id: linkDoc.conversation.id,
                title: linkDoc.conversation.title,
                mode: linkDoc.conversation.mode,
                createdAt: linkDoc.conversation.createdAt,
                messages: linkDoc.conversation.messages,
            },
            shareInfo: {
                viewCount: linkDoc.viewCount + 1,
                maxViews: linkDoc.maxViews,
                expiresAt: linkDoc.expiresAt,
            },
        };
    }
}
export default new ChatService();
//# sourceMappingURL=chat.service.js.map