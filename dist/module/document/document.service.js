import prisma from '../../config/database.js';
import pythonBackend from '../../services/python-backend.service.js';
import { AppError } from '../../middleware/error.middleware.js';
class DocumentService {
    async listTemplates() {
        return pythonBackend.listTemplates();
    }
    async getTemplateSchema(templateName) {
        return pythonBackend.getTemplateSchema(templateName);
    }
    async getTemplateInfo(templateName) {
        return pythonBackend.getTemplateInfo(templateName);
    }
    async getTemplateCriticalFields(templateName) {
        return pythonBackend.getTemplateCriticalFields(templateName);
    }
    async generateDocument(userId, templateName, data, format = 'pdf') {
        const result = await pythonBackend.generateDocument(templateName, data);
        const document = await prisma.document.create({
            data: {
                userId,
                title: `Document ${new Date().toISOString()}`,
                content: result.document_content || '',
                format,
                fileUrl: '',
                prompt: JSON.stringify(data),
                generatedBy: 'legal-ai-python-backend',
                metadata: { template_name: templateName, generated_content: result.document_content },
            },
        });
        return {
            document,
            downloadUrl: '',
        };
    }
    async getUserDocuments(userId) {
        const documents = await prisma.document.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                format: true,
                fileUrl: true,
                createdAt: true,
            },
        });
        return documents;
    }
    async getDocument(userId, documentId) {
        const document = await prisma.document.findFirst({
            where: {
                id: documentId,
                userId,
            },
        });
        if (!document) {
            throw new AppError('Document not found', 404);
        }
        return document;
    }
    async deleteDocument(userId, documentId) {
        const document = await prisma.document.findFirst({
            where: {
                id: documentId,
                userId,
            },
        });
        if (!document) {
            throw new AppError('Document not found', 404);
        }
        await prisma.document.delete({
            where: { id: documentId },
        });
    }
}
export default new DocumentService();
//# sourceMappingURL=document.service.js.map