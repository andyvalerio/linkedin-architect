import { GoogleGenAI } from "@google/genai";
import { UploadedDocument, GenerationConfig, ModelInfo, KnowledgeMode, Vendor } from "../types";
import { LLMProvider, GeneratedResponse } from "./llmProvider";
import { getSystemInstruction, getUserPrompt } from "./promptUtils";
import { ragService } from "./ragService";

export class GeminiProvider implements LLMProvider {
    async fetchModels(apiKey: string): Promise<ModelInfo[]> {
        const ai = new GoogleGenAI({ apiKey });
        const models: ModelInfo[] = [];

        try {
            const modelList = await ai.models.list();

            for await (const model of modelList) {
                if (model.supportedActions?.includes('generateContent') && model.name) {
                    models.push({
                        name: model.name,
                        displayName: model.displayName || model.name.replace('models/', ''),
                        description: model.description || 'No description available.'
                    });
                }
            }

            return models;
        } catch (error) {
            console.error("Error listing Gemini models:", error);
            throw error;
        }
    }

    async generateContent(
        apiKey: string,
        config: GenerationConfig,
        documents: UploadedDocument[]
    ): Promise<GeneratedResponse> {
        const ai = new GoogleGenAI({ apiKey });

        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const hasUrl = config.context && urlRegex.test(config.context);

        const activeDocs = documents.filter(doc => doc.isActive);
        const ragDocs = activeDocs.filter(doc => doc.knowledgeMode === KnowledgeMode.RAG);
        const contextDocs = activeDocs.filter(doc => doc.knowledgeMode === KnowledgeMode.CONTEXT);

        const systemInstruction = getSystemInstruction(config.personality);
        const userPromptText = getUserPrompt(config);

        const parts: any[] = [];

        // Add Context documents (Full text or Multimedia)
        contextDocs.forEach(doc => {
            if (doc.parsedText) {
                parts.push({ text: `--- DOCUMENT: ${doc.name} ---\n${doc.parsedText}\n` });
            } else {
                parts.push({
                    inlineData: {
                        mimeType: doc.mimeType,
                        data: doc.data
                    }
                });
            }
        });

        // Add RAG chunks if needed
        if (ragDocs.length > 0) {
            const queryEmbeddings = await this.generateEmbeddings(apiKey, [config.braindump || config.context]);
            const relevantChunks = await ragService.searchSimilar(queryEmbeddings[0], Vendor.GEMINI);

            if (relevantChunks.length > 0) {
                let ragContext = "\n\nRELEVANT KNOWLEDGE CHUNKS:\n";
                relevantChunks.forEach(chunk => {
                    ragContext += `[From ${chunk.documentId}]: ${chunk.text}\n`;
                });
                parts.push({ text: ragContext });
            }
        }

        // Add prompt
        parts.push({ text: userPromptText });

        const response = await ai.models.generateContent({
            model: config.model,
            contents: { parts: parts },
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.8,
                tools: hasUrl ? [{ googleSearch: {} }] : undefined,
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        const text = response.text || "No response generated.";
        const sources: { title: string; uri: string }[] = [];

        if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
                if (chunk.web) {
                    sources.push({
                        title: chunk.web.title || "Web Source",
                        uri: chunk.web.uri
                    });
                }
            });
        }

        return { text, sources };
    }

    async generateEmbeddings(apiKey: string, chunks: string[]): Promise<number[][]> {
        const ai = new GoogleGenAI({ apiKey });

        try {
            const results = await Promise.all(chunks.map(text =>
                ai.models.embedContent({
                    model: "text-embedding-004",
                    contents: [{ parts: [{ text }] }]
                })
            ));
            return results.map(r => {
                const values = r.embeddings?.[0]?.values;
                return values ? Array.from(values) : [];
            });
        } catch (error) {
            console.error("Error generating Gemini embeddings:", error);
            throw error;
        }
    }
}
