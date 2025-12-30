import OpenAI from "openai";
import { UploadedDocument, GenerationConfig, ModelInfo, KnowledgeMode, Vendor } from "../types";
import { LLMProvider, GeneratedResponse } from "./llmProvider";
import { getSystemInstruction, getUserPrompt, formatDocumentContext } from "./promptUtils";
import { ragService } from "./ragService";

export class OpenAIProvider implements LLMProvider {
    async fetchModels(apiKey: string): Promise<ModelInfo[]> {
        const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

        try {
            const response = await openai.models.list();
            return response.data
                .filter(model => model.id.startsWith("gpt-"))
                .map(model => ({
                    name: model.id,
                    displayName: model.id,
                    description: `OpenAI model ${model.id}`
                }));
        } catch (error) {
            console.error("Error listing OpenAI models:", error);
            throw error;
        }
    }

    async generateContent(
        apiKey: string,
        config: GenerationConfig,
        documents: UploadedDocument[]
    ): Promise<GeneratedResponse> {
        const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

        const activeDocs = documents.filter(doc => doc.isActive);
        const ragDocs = activeDocs.filter(doc => doc.knowledgeMode === KnowledgeMode.RAG);
        const contextDocs = activeDocs.filter(doc => doc.knowledgeMode === KnowledgeMode.CONTEXT);

        const systemInstruction = getSystemInstruction(config.personality);

        // Construct full user prompt with context and RAG chunks
        let fullUserPrompt = "";

        // Add Context documents
        contextDocs.forEach(doc => {
            fullUserPrompt += `\n--- DOCUMENT: ${doc.name} ---\n${doc.parsedText || ""}\n`;
        });

        // Add RAG chunks
        if (ragDocs.length > 0) {
            const queryEmbeddings = await this.generateEmbeddings(apiKey, [config.braindump || config.context]);
            const relevantChunks = await ragService.searchSimilar(queryEmbeddings[0], Vendor.OPENAI);

            if (relevantChunks.length > 0) {
                fullUserPrompt += "\n\nRELEVANT KNOWLEDGE CHUNKS:\n";
                relevantChunks.forEach(chunk => {
                    fullUserPrompt += `[From ${chunk.documentId}]: ${chunk.text}\n`;
                });
            }
        }

        fullUserPrompt += getUserPrompt(config);

        const response = await openai.chat.completions.create({
            model: config.model,
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: fullUserPrompt }
            ],
        });

        const text = response.choices[0]?.message?.content || "No response generated.";

        return { text, sources: [] }; // OpenAI chat completions don't provide grounding sources as easily
    }

    async generateEmbeddings(apiKey: string, chunks: string[]): Promise<number[][]> {
        const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

        try {
            const response = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: chunks,
            });
            return response.data.map(item => item.embedding);
        } catch (error) {
            console.error("Error generating OpenAI embeddings:", error);
            throw error;
        }
    }
}
