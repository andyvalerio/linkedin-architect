import { UploadedDocument, GenerationConfig, ModelInfo } from "../types";

export interface GeneratedResponse {
    text: string;
    sources: { title: string; uri: string }[];
}

export interface LLMProvider {
    fetchModels(apiKey: string): Promise<ModelInfo[]>;
    generateContent(
        apiKey: string,
        config: GenerationConfig,
        documents: UploadedDocument[]
    ): Promise<GeneratedResponse>;
    generateEmbeddings(apiKey: string, chunks: string[]): Promise<number[][]>;
}
