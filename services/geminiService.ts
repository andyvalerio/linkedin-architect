
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
 * Iterates through the AsyncIterable returned by the SDK to avoid Pager errors.
 */
export const fetchAvailableModels = async (): Promise<ModelInfo[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const models: ModelInfo[] = [];
  
  try {
    // Await the models.list() call as it returns a Promise<Pager<Model>> which is the async iterable.
    const modelList = await ai.models.list();
    
    for await (const model of modelList) {
      // Only include models that support content generation.
      // Fix: Use 'supportedActions' which is the correct property name in the @google/genai SDK.
      if (model.supportedActions?.includes('generateContent')) {
        models.push({
          // The API returns 'models/name', we store the full string for the API call
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
  const createClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const hasUrl = config.context && urlRegex.test(config.context);

  const performGeneration = async (client: GoogleGenAI) => {
    const activeDocs = documents.filter(doc => doc.isActive);

    const systemInstruction = `You are an expert LinkedIn Ghostwriter. 
    Your goal is to write high-engagement, professional, yet authentic content.
    
    RULES:
    1. Adopt the persona described in the "Personality" section specifically.
    2. Use the "Braindump" as the core idea/direction for the content if provided.
    3. Use the "Context" (Post/Article to answer) to ground your response if provided.
    4. CRITICAL: Use the attached documents as your primary KNOWLEDGE CORPUS. Prioritize facts, statistics, and viewpoints found in these documents over general training data.
    5. URL HANDLING: If the "Context" contains a URL, use the Google Search tool to read the content of that page and understand the topic. Use the information found at that URL as the context to answer.
    6. Formatting: Use short paragraphs, line breaks, and clear hooks. Avoid hashtags unless requested.
    7. If no Braindump is provided, use the Context and your Personality description to generate the most relevant and high-quality post or comment possible.
    `;

    const userPromptText = `
    TASK: Write a LinkedIn ${config.postType}.

    ---
    CONTEXT (The post/article/URL we are responding to):
    ${config.context || "N/A"}
    ---

    ---
    PERSONALITY (Tone, Voice, Style):
    ${config.personality || "Professional, insightful, and concise."}
    ---

    ---
    BRAINDUMP (Specific ideas, arguments, or points to include):
    ${config.braindump || "N/A - Generate a high-quality response based on the Context and Personality provided."}
    ---
    `;

    const parts: any[] = [];

    activeDocs.forEach(doc => {
      parts.push({
        inlineData: {
          mimeType: doc.mimeType,
          data: doc.data
        }
      });
    });

    parts.push({ text: userPromptText });

    const tools = hasUrl ? [{ googleSearch: {} }] : undefined;

    // Updated contents structure to match recommended pattern { parts: [...] }
    const response = await client.models.generateContent({
      model: config.model,
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        tools: tools,
      }
    });

    const text = response.text || "No response generated.";

    const sources: { title: string; uri: string }[] = [];
    const candidates = response.candidates;
    if (candidates && candidates[0]) {
        const groundingMetadata = candidates[0].groundingMetadata;
        if (groundingMetadata && groundingMetadata.groundingChunks) {
            groundingMetadata.groundingChunks.forEach((chunk: any) => {
                if (chunk.web && chunk.web.uri) {
                    sources.push({
                        title: chunk.web.title || "Source",
                        uri: chunk.web.uri
                    });
                }
            });
        }
    }

    return { text, sources };
  };

  try {
    const ai = createClient();
    return await performGeneration(ai);
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);

    const errorMessage = error.message || JSON.stringify(error);
    
    if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("404")) {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        await aistudio.openSelectKey();
        try {
          const ai = createClient();
          return await performGeneration(ai);
        } catch (retryError: any) {
          throw new Error(`Retry failed after key selection: ${retryError.message}`);
        }
      }
    }

    throw new Error(errorMessage);
  }
};
