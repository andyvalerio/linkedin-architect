import { Vendor } from "../types";
import { GeminiProvider } from "./geminiProvider";
import { OpenAIProvider } from "./openaiProvider";
import { LLMProvider } from "./llmProvider";

const providers: Record<Vendor, LLMProvider> = {
    [Vendor.GEMINI]: new GeminiProvider(),
    [Vendor.OPENAI]: new OpenAIProvider()
};

export const getProvider = (vendor: Vendor): LLMProvider => {
    return providers[vendor];
};

export const getAvailableVendors = (): { id: Vendor; name: string }[] => {
    return [
        { id: Vendor.GEMINI, name: "Gemini" },
        { id: Vendor.OPENAI, name: "OpenAI" }
    ];
};
