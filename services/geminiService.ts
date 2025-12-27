
import { GoogleGenAI } from "@google/genai";
import { UploadedDocument, GenerationConfig } from "../types";

// The window.aistudio object is assumed to be globally available with the AIStudio type.
// We access it via type assertion to avoid property declaration conflicts.

export interface GeneratedResponse {
  text: string;
  sources: { title: string; uri: string }[];
}

export const generateLinkedInContent = async (
  config: GenerationConfig,
  documents: UploadedDocument[]
): Promise<GeneratedResponse> => {
  // Always create a new GoogleGenAI instance right before making an API call 
  // to ensure it uses the most up-to-date API key.
  const createClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Check for URL in context to decide if we need search
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const hasUrl = config.context && urlRegex.test(config.context);

  // Core generation logic
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

    // Prepare content parts
    const parts: any[] = [];

    // Add active documents as inline data parts
    activeDocs.forEach(doc => {
      parts.push({
        inlineData: {
          mimeType: doc.mimeType,
          data: doc.data
        }
      });
    });

    // Add the text prompt
    parts.push({ text: userPromptText });

    // Configure tools - Enable Google Search if a URL is detected.
    // Google Search is only supported with specific models.
    const tools = hasUrl ? [{ googleSearch: {} }] : undefined;

    const response = await client.models.generateContent({
      model: config.model,
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        tools: tools,
      }
    });

    // Extract text directly from the text property (not a method).
    const text = response.text || "No response generated.";

    // Extract grounding sources from groundingMetadata if googleSearch was used
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
    console.error("Gemini API Error:", error);

    const errorMessage = error.message || JSON.stringify(error);
    
    // If the request fails with "Requested entity was not found.", it may mean an API key reset is needed.
    if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("404")) {
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        console.log("Triggering API key selection due to 404 error...");
        try {
          // Open the key selection dialog.
          await aistudio.openSelectKey();
          // Assume the key selection was successful and retry immediately with a fresh client.
          const ai = createClient();
          return await performGeneration(ai);
        } catch (retryError) {
          console.error("Gemini API Error (Retry after key selection):", retryError);
          throw retryError;
        }
      }
    }

    throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};
