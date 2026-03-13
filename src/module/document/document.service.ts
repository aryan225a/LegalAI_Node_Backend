import prisma from '../../config/database.js';
import pythonBackend from '../../services/python-backend.service.js';
import { AppError } from '../../middleware/error.middleware.js';
import type { DocGenResponse } from '../../types/python-backend.types.js';

class DocumentService {
  async listTemplates() {
    return pythonBackend.listTemplates();
  }

  async getTemplateSchema(templateName: string) {
    return pythonBackend.getTemplateSchema(templateName);
  }

  async getTemplateInfo(templateName: string) {
    return pythonBackend.getTemplateInfo(templateName);
  }

  async getTemplateCriticalFields(templateName: string) {
    return pythonBackend.getTemplateCriticalFields(templateName);
  }

  async generateDocument(
    userId: string,
    templateName: string,
    data: Record<string, any>,
    format: string = 'pdf'
  ) {
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

  async getUserDocuments(userId: string) {
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

  async getDocument(userId: string, documentId: string) {
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

  async deleteDocument(userId: string, documentId: string) {
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