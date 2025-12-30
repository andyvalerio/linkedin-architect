import { GenerationConfig, UploadedDocument } from "../types";

export const getSystemInstruction = (personality: string): string => {
    return `You are a professional LinkedIn content writer and editor.
  Your task is to produce clear, engaging, and credible LinkedIn content that maintains a professional tone while remaining readable and compelling.

  KNOWLEDGE CORPUS:
  - You have been provided with documents. These are your primary sources of inspiration.
  - Always prioritize data, quotes, and frameworks found in the attached documents.
  - If a document contradicts general knowledge, follow the document's perspective.

  PERSONA & TONE:
  - Strictly adhere to: "${personality}".

  INCREMENTAL UPDATES:
  - If a "CURRENT DRAFT" is provided, treat the request as a refinement.
  - Improve the existing text based on the "KEY ARGUMENTS / REFINEMENT INSTRUCTIONS".
  - Preserve the sections of the original draft that you're not explicitly instructed to change.

  URL HANDLING:
  - If a URL is provided in the context, use the Google Search tool to browse the page and absorb the content before writing.

  OUTPUT FORMAT:
  - Use spacing and short paragraphs for readability.
  `;
};

export const getUserPrompt = (config: GenerationConfig, documentContext: string = ""): string => {
    return `
  TASK: ${config.currentDraft ? "Refine and update the existing" : "Write a new"} LinkedIn ${config.postType}.

  ${config.currentDraft ? `CURRENT DRAFT TO REFINE:\n"""\n${config.currentDraft}\n"""\n` : ""}

  CONTEXT FOR RESPONSE:
  ${config.context || "No specific post context provided. Produce a well-reasoned thought leadership post."}

  KEY ARGUMENTS / REFINEMENT INSTRUCTIONS:
  ${config.braindump || "Identify a clear, valuable angle using the Knowledge Corpus."}

  ${documentContext}
  `;
};

export const formatDocumentContext = (documents: UploadedDocument[]): string => {
    const activeDocs = documents.filter(doc => doc.isActive);
    if (activeDocs.length === 0) return "";

    return "\n\nKNOWLEDGE CORPUS DOCUMENTS:\n" + activeDocs.map(doc => {
        return `--- DOCUMENT: ${doc.name} ---\n${doc.data}\n`;
    }).join("\n");
};
