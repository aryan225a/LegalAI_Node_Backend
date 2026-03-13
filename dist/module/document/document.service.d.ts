declare class DocumentService {
    listTemplates(): Promise<import("../../types/python-backend.types.js").TemplateListResponse>;
    getTemplateSchema(templateName: string): Promise<import("../../types/python-backend.types.js").TemplateSchemaResponse>;
    getTemplateInfo(templateName: string): Promise<import("../../types/python-backend.types.js").TemplateDetailResponse>;
    getTemplateCriticalFields(templateName: string): Promise<import("../../types/python-backend.types.js").TemplateCriticalFieldsResponse>;
    generateDocument(userId: string, templateName: string, data: Record<string, any>, format?: string): Promise<{
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
        downloadUrl: string;
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