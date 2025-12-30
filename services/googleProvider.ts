import { GoogleGenAI } from "@google/genai";
import { UploadedDocument, GenerationConfig, ModelInfo } from "../types";
import { LLMProvider, GeneratedResponse } from "./llmProvider";
import { getSystemInstruction, getUserPrompt } from "./promptUtils";

export class GoogleProvider implements LLMProvider {
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
            console.error("Error listing Google models:", error);
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

        const systemInstruction = getSystemInstruction(config.personality);
        const userPromptText = getUserPrompt(config);

        const parts: any[] = [];

        // Add RAG documents
        activeDocs.forEach(doc => {
            parts.push({
                inlineData: {
                    mimeType: doc.mimeType,
                    data: doc.data
                }
            });
        });

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
}
