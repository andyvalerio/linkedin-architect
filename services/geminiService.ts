import { GoogleGenAI } from "@google/genai";
import { UploadedDocument, GenerationConfig } from "../types";

declare global {
  interface Window {
    aistudio?: {
      openSelectKey: () => Promise<void>;
      hasSelectedApiKey: () => Promise<boolean>;
    };
  }
}

export const generateLinkedInContent = async (
  config: GenerationConfig,
  documents: UploadedDocument[]
): Promise<string> => {
  // Helper to create the AI client. 
  // We create it inside the function to ensure we capture the latest process.env.API_KEY
  // which might change after the user selects a key via window.aistudio.openSelectKey().
  const createClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Core generation logic
  const performGeneration = async (client: GoogleGenAI) => {
    const activeDocs = documents.filter(doc => doc.isActive);

    const systemInstruction = `You are an expert LinkedIn Ghostwriter. 
    Your goal is to write high-engagement, professional, yet authentic content.
    
    RULES:
    1. Adopt the persona described in the "Personality" section specifically.
    2. Use the "Braindump" as the core idea/direction for the content.
    3. Use the "Context" (Post/Article to answer) to ground your response if provided.
    4. CRITICAL: Use the attached documents as your primary KNOWLEDGE CORPUS. Prioritize facts, statistics, and viewpoints found in these documents over general training data. If a document contradicts general knowledge, follow the document.
    5. Formatting: Use short paragraphs, line breaks, and clear hooks. Avoid hashtags unless requested.
    `;

    const userPromptText = `
    TASK: Write a LinkedIn ${config.postType}.

    ---
    CONTEXT (The post/article we are responding to or referencing):
    ${config.context || "N/A"}
    ---

    ---
    PERSONALITY (Tone, Voice, Style):
    ${config.personality || "Professional, insightful, and concise."}
    ---

    ---
    BRAINDUMP (Specific ideas, arguments, or points to include):
    ${config.braindump}
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

    const response = await client.models.generateContent({
      model: config.model,
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7, // Balance creativity with adherence to facts
      }
    });

    return response.text || "No response generated.";
  };

  try {
    // Attempt 1
    const ai = createClient();
    return await performGeneration(ai);
  } catch (error: any) {
    console.error("Gemini API Error (Attempt 1):", error);

    const errorMessage = error.message || JSON.stringify(error);
    
    // Handle "Requested entity was not found" (404)
    // This typically means the API key is missing or not associated with a project.
    if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("404")) {
      if (window.aistudio) {
        console.log("Triggering API key selection...");
        try {
          await window.aistudio.openSelectKey();
          // Retry with fresh client to pick up new key
          const ai = createClient();
          return await performGeneration(ai);
        } catch (retryError) {
          console.error("Gemini API Error (Retry):", retryError);
          throw retryError;
        }
      }
    }

    throw new Error(`Failed to generate content: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};