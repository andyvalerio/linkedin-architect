export enum Vendor {
  GOOGLE = 'google',
  OPENAI = 'openai'
}

export interface ModelInfo {
  name: string;
  displayName: string;
  description: string;
}

export enum KnowledgeMode {
  CONTEXT = 'context',
  RAG = 'rag'
}

export interface Chunk {
  id: string;
  documentId: string;
  text: string;
  metadata?: any;
}

export interface UploadedDocument {
  id: string;
  name: string;
  mimeType: string;
  data: string; // Base64 string (optional now, but kept for compatibility)
  parsedText?: string;
  isActive: boolean;
  size: number;
  knowledgeMode: KnowledgeMode;
  isIndexed?: boolean;
}

export enum PostType {
  POST = 'Post (Long Form)',
  COMMENT = 'Comment (Short Form)'
}

export interface GenerationConfig {
  context: string;
  personality: string;
  braindump: string;
  postType: PostType;
  model: string;
  currentDraft?: string;
}