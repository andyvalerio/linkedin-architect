export interface UploadedDocument {
  id: string;
  name: string;
  mimeType: string;
  data: string; // Base64 string
  isActive: boolean;
  size: number;
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