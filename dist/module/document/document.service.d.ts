import { type ConvertFormat } from './document-converter.js';
declare class DocumentService {
    listTemplates(): Promise<import("../../types/python-backend.types.js").TemplateListResponse>;
    getTemplateSchema(templateName: string): Promise<import("../../types/python-backend.types.js").TemplateSchemaResponse>;
    getTemplateInfo(templateName: string): Promise<import("../../types/python-backend.types.js").TemplateDetailResponse>;
    getTemplateCriticalFields(templateName: string): Promise<import("../../types/python-backend.types.js").TemplateCriticalFieldsResponse>;
    generateDocument(userId: string, templateName: string, data: Record<string, any>, format?: ConvertFormat): Promise<{
        document: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            format: string;
            userId: string;
            title: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            content: string;
            fileUrl: string | null;
            prompt: string | null;
            generatedBy: string | null;
        };
        fileBuffer: Buffer<ArrayBufferLike>;
        mimeType: string;
        extension: string;
        generationStatus: "error" | "complete" | "incomplete";
        completionPercentage: number;
        missingFields: string[];
        warning: string | null;
    }>;
    getDocumentFile(userId: string, documentId: string): Promise<{
        buffer: Buffer;
        mimeType: string;
        extension: string;
        title: string;
    }>;
    getUserDocuments(userId: string): Promise<{
        id: string;
        createdAt: Date;
        format: string;
        title: string;
        fileUrl: string | null;
    }[]>;
    getDocument(userId: string, documentId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        format: string;
        userId: string;
        title: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        content: string;
        fileUrl: string | null;
        prompt: string | null;
        generatedBy: string | null;
    }>;
    deleteDocument(userId: string, documentId: string): Promise<void>;
}
declare const _default: DocumentService;
export default _default;
//# sourceMappingURL=document.service.d.ts.map