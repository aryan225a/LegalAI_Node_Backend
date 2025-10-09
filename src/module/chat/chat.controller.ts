import type { Response } from 'express';
import type { NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware.js';
import chatService from './chat.service.js';
import type { Multer } from 'multer';
import { z } from 'zod';

// Extend AuthRequest to include file property for multer
interface AuthRequestWithFile extends AuthRequest {
  file?: Express.Multer.File;
}

class ChatController {
  /**
   * Create a new conversation
   * - NORMAL mode: Simple chat, no session_id or document required
   * - AGENTIC mode: AI agent with tools, uses session_id, document is optional
   */
  async createConversation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const userId = req.user.id;
        const { id, title, mode, documentId, documentName, sessionId } = req.body;

        // Validation
        if (!mode || !['NORMAL', 'AGENTIC'].includes(mode)) {
            return res.status(400).json({
                success: false,
                message: 'Mode is required and must be either NORMAL or AGENTIC',
            });
          }

        // Use provided title or generate a default one
        const conversationTitle = title || `${mode} Chat - ${new Date().toLocaleString()}`;

        const conversation = await chatService.createConversation(
            userId, 
            conversationTitle, 
            mode, 
            documentId, 
            documentName, 
            sessionId,
            id  // Pass the client-provided ID
        );

        res.status(201).json({
            success: true,
            data: conversation,
        });
        }
        catch (error) {
            next(error);
      }
  }

  /**
   * Send a message in a conversation
   * - NORMAL mode: Simple chat response
   * - AGENTIC mode: AI agent with tools, maintains session_id, can include document for context
   * - File upload: Supported in AGENTIC mode for document analysis
   * 
   * Request format:
   * - Content-Type: multipart/form-data (when sending file)
   * - Content-Type: application/json (when no file)
   * 
   * Body fields:
   * - message: string (required)
   * - mode: 'NORMAL' | 'AGENTIC' (required)
   * - file: File (optional, for AGENTIC mode)
   */
  async sendMessage(req: AuthRequestWithFile, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;
      
      // Handle both JSON and form-data
      const message = req.body?.message;
      const mode = req.body?.mode;
      const inputLanguage = req.body?.input_language;
      const outputLanguage = req.body?.output_language;
      
      // Validation
      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: 'Conversation ID is required',
        });
      }

      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required',
        });
      }

      if (!mode || !['NORMAL', 'AGENTIC'].includes(mode)) {
        return res.status(400).json({
          success: false,
          message: 'Mode is required and must be either NORMAL or AGENTIC',
        });
      }
      
      const file = req.file
        ? { buffer: req.file.buffer, fileName: req.file.originalname }
        : undefined;

      const result = await chatService.sendMessage(
        userId,
        conversationId,
        message,
        mode,
        file,
        inputLanguage,
        outputLanguage
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getConversations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const conversations = await chatService.getConversations(userId);

      res.status(200).json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      next(error);
    }
  }

  async getConversationMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;
      
      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: 'Conversation ID is required',
        });
      }

      const conversation = await chatService.getConversationMessages(
        userId,
        conversationId
      );

      res.status(200).json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  }

  async getConversationInfo(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;
      
      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: 'Conversation ID is required',
        });
      }

      const info = await chatService.getConversationInfo(userId, conversationId);

      res.status(200).json({
        success: true,
        data: info,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteConversation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;
      
      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: 'Conversation ID is required',
        });
      }

      await chatService.deleteConversation(userId, conversationId);

      res.status(200).json({
        success: true,
        message: 'Conversation deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAllConversations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const result = await chatService.deleteAllConversations(userId);

      res.status(200).json({
        success: true,
        message: `${result.deletedCount} conversation(s) deleted successfully`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Share a conversation - creates or manages sharing link
   */
  async shareConversation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;

      // Validation with zod
      const shareSchema = z.object({
        share: z.boolean()
      });

      const parseResult = shareSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          message: 'share must be true or false',
        });
      }

      const { share } = parseResult.data;

      if (!conversationId) {
        return res.status(400).json({
          success: false,
          message: 'Conversation ID is required',
        });
      }

      const result = await chatService.shareConversation(userId, conversationId, share, req);

      if (share) {
        res.status(200).json({
          success: true,
          data: {
            link: result.link,
            message: 'Conversation shared successfully',
          },
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'Conversation sharing disabled',
        });
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get shared conversation by secure link (no authentication required)
   */
  async getSharedConversation(req: AuthRequest | any, res: Response, next: NextFunction) {
    try {
      const { shareLink } = req.params;

      if (!shareLink) {
        return res.status(400).json({
          success: false,
          message: 'Share link is required',
        });
      }

      const result = await chatService.getSharedConversation(shareLink);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ChatController();