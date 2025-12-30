import OpenAI from "openai";
import { UploadedDocument, GenerationConfig, ModelInfo } from "../types";
import { LLMProvider, GeneratedResponse } from "./llmProvider";
import { getSystemInstruction, getUserPrompt, formatDocumentContext } from "./promptUtils";

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

        const systemInstruction = getSystemInstruction(config.personality);
        const documentContext = formatDocumentContext(documents);
        const userPromptText = getUserPrompt(config, documentContext);

        const response = await openai.chat.completions.create({
            model: config.model,
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: userPromptText }
            ],
        });

        const text = response.choices[0]?.message?.content || "No response generated.";

        return { text, sources: [] }; // OpenAI chat completions don't provide grounding sources as easily as Gemini's search tool
    }
}
