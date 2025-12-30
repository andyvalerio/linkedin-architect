import { Vendor } from "../types";
import { GoogleProvider } from "./googleProvider";
import { OpenAIProvider } from "./openaiProvider";
import { LLMProvider } from "./llmProvider";

const providers: Record<Vendor, LLMProvider> = {
    [Vendor.GOOGLE]: new GoogleProvider(),
    [Vendor.OPENAI]: new OpenAIProvider()
};

export const getProvider = (vendor: Vendor): LLMProvider => {
    return providers[vendor];
};

export const getAvailableVendors = (): { id: Vendor; name: string }[] => {
    return [
        { id: Vendor.GOOGLE, name: "Google Gemini" },
        { id: Vendor.OPENAI, name: "OpenAI" }
    ];
};
