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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const hasUrl = config.context && urlRegex.test(config.context);

  const activeDocs = documents.filter(doc => doc.isActive);

  const systemInstruction = `You are a professional LinkedIn content writer and editor.
  Your task is to produce clear, engaging, and credible LinkedIn content that maintains a professional tone while remaining readable and compelling.

  KNOWLEDGE CORPUS:
  - You have been provided with documents. These are your primary sources of inspiration.
  - Always prioritize data, quotes, and frameworks found in the attached documents.
  - If a document contradicts general knowledge, follow the document's perspective.

  PERSONA & TONE:
  - Strictly adhere to: "${config.personality}".

  INCREMENTAL UPDATES:
  - If a "CURRENT DRAFT" is provided, treat the request as a refinement.
  - Improve the existing text based on the "KEY ARGUMENTS / REFINEMENT INSTRUCTIONS".
  - Preserve the sections of the original draft that you're not explicitly instructed to change.

  URL HANDLING:
  - If a URL is provided in the context, use the Google Search tool to browse the page and absorb the content before writing.

  OUTPUT FORMAT:
  - Use spacing and short paragraphs for readability.
  `;

  const userPromptText = `
  TASK: ${config.currentDraft ? "Refine and update the existing" : "Write a new"} LinkedIn ${config.postType}.

  ${config.currentDraft ? `CURRENT DRAFT TO REFINE:\n"""\n${config.currentDraft}\n"""\n` : ""}

  CONTEXT FOR RESPONSE:
  ${config.context || "No specific post context provided. Produce a well-reasoned thought leadership post."}

  KEY ARGUMENTS / REFINEMENT INSTRUCTIONS:
  ${config.braindump || "Identify a clear, valuable angle using the Knowledge Corpus."}

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
    model: config.model || 'gemini-2.5-flash',
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
};