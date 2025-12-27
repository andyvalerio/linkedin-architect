
import { GoogleGenAI } from "@google/genai";
import { UploadedDocument, GenerationConfig } from "../types";

export interface GeneratedResponse {
  text: string;
  sources: { title: string; uri: string }[];
}

export interface ModelInfo {
  name: string;
  displayName: string;
  description: string;
}

/**
 * Dynamically fetches all models available to the current API key.
 */
export const fetchAvailableModels = async (): Promise<ModelInfo[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const models: ModelInfo[] = [];
  
  try {
    const modelList = await ai.models.list();
    
    for await (const model of modelList) {
      if (model.supportedActions?.includes('generateContent')) {
        models.push({
          name: model.name,
          displayName: model.displayName || model.name.replace('models/', ''),
          description: model.description || 'No description available.'
        });
      }
    }
    
    return models;
  } catch (error) {
    console.error("Error listing models:", error);
    throw error;
  }
};

export const generateLinkedInContent = async (
  config: GenerationConfig,
  documents: UploadedDocument[]
): Promise<GeneratedResponse> => {
  // Always create a new instance right before use to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const hasUrl = config.context && urlRegex.test(config.context);

  const activeDocs = documents.filter(doc => doc.isActive);

  const systemInstruction = `You are an elite LinkedIn Ghostwriter and Content Architect. 
  Your mission is to craft viral-potential content that maintains professional integrity while being deeply engaging.

  KNOWLEDGE CORPUS:
  - You have been provided with documents. These are your primary sources of truth. 
  - ALWAYS prioritize data, quotes, and frameworks found in the attached documents.
  - If a document contradicts general knowledge, use the document's perspective.

  PERSONA & TONE:
  - Strictly adhere to: "${config.personality}".
  - Never use "I hope this finds you well" or corporate clichés.
  - Use high-impact hooks and "broetry" (short, punchy sentences) when appropriate for the post format.

  URL HANDLING:
  - If a URL is provided in the context, use the Google Search tool to browse the page and summarize its core arguments before writing.

  OUTPUT FORMAT:
  - Start with a strong "Hook".
  - Use whitespace for readability.
  - End with a strategic "Call to Action" (CTA).
  `;

  const userPromptText = `
  TASK: Write a LinkedIn ${config.postType}.

  CONTEXT FOR RESPONSE:
  ${config.context || "No specific post context provided. Generate an original thought leadership piece."}

  KEY ARGUMENTS / BRAINDUMP:
  ${config.braindump || "Use the Knowledge Corpus to find the most interesting angle."}

  STRATEGY:
  Ensure the tone is "${config.personality}". 
  If writing a comment, keep it under 100 words. If a post, make it insightful and detailed.
  `;

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
      thinkingConfig: { thinkingBudget: 0 } // Default behavior
    }
  });

  const text = response.text || "No response generated.";
  const sources: { title: string; uri: string }[] = [];

  // Extract grounding citations if Google Search was used
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
};
