export interface AgentChatRequest {
  message: string;
  document_id?: string;
  session_id?: string;
  input_language?: string;
  output_language?: string;
}

export interface LanguageInfo {
  detected_input?: string;
  detected_output?: string;
  [key: string]: any;
}

export interface AgentChatResponse {
  response: string;
  session_id: string;          
  tools_used: string[];
  intermediate_steps: any[];
  raw_results: any[];
  language_info?: {
  detected_input?: string;
  detected_output?: string;
  };
}

export interface UploadAndChatResponse {
  document_id: string;           
  storage_url: string;
  agent_response: string;  // The formatted response string with translations
  session_id: string;       
  tools_used: string[];
  intermediate_steps: any[];
  raw_results: any[];
  language_info?: any;
  deduplication_info?: any;
}

export interface ChatRequest {
  prompt: string;
  history?: Array<{role: string; content: string}>;
  summary?: string | null; 
}

export interface ChatResponse {
  response: string;
  updated_summary?: string;
}

export interface TranslateRequest {
  text: string;
  source_lang?: string;
  target_lang?: string;
}

export interface TranslateResponse {
  translated_text: string;
}

export interface DetectLanguageRequest {
  text: string;
}

export interface DetectLanguageResponse {
  input_detection: {
    language: string;
    confidence: number;
    method: string;
    supported: boolean;
    display_name: string;
    alternatives: any[];
  };
  suggested_output: {
    language: string;
    display_name: string;
  };
}


export interface DocGenRequest {
  template_name: string;
  data: Record<string, any>;
}

export interface DocGenResponse {
  document_content: string;
}

export interface TemplateInfo {
  name: string;
  display_name?: string;
  description?: string;
  category?: string;
}

export interface TemplateListResponse {
  templates: TemplateInfo[];
  total: number;
}

export interface TemplateSchemaField {
  name: string;
  type: string;
  required: boolean;
  critical: boolean;
  description?: string;
  default?: any;
  examples?: any[];
}

export interface TemplateSchemaResponse {
  template_name: string;
  critical_fields: TemplateSchemaField[];
  optional_fields: TemplateSchemaField[];
  all_fields: TemplateSchemaField[];
}

export interface TemplateMetadata {
  title?: string;
  description?: string;
  category?: string;
  version?: string;
  author?: string;
  [key: string]: any;
}

export interface TemplateDetailResponse {
  template_name: string;
  metadata: TemplateMetadata;
  schema: TemplateSchemaResponse;
}

export interface TemplateCriticalFieldsResponse {
  template_name: string;
  critical_fields: string[];
}
