import { GoogleGenAI } from "@google/genai";

const projectId = process.env.GOOGLE_CLOUD_PROJECT || "skeptek-hackathon";
const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";

console.log(`[Gemini] Initializing Vertex AI Client for project: ${projectId} (${location})`);

export const genAI = new GoogleGenAI({
  // vertexai: true, // Disabled: User lacks ADC. Falling back to Google AI gateway with API Key.
  apiKey: process.env.GOOGLE_API_KEY,
  // project: projectId,
  // location: location,
});

// SOTA 2026: Export Model Names for consistency
export const MODEL_FLASH = "gemini-3-flash-preview"; 
export const MODEL_PRO = "gemini-3-pro-preview";

// Helper to keep similar API surface for easier refactoring, 
// though we will update agents to use the new signature.
export const geminiFlash = {
    generateContent: async (params: any) => {
        return await genAI.models.generateContent({
            model: MODEL_FLASH,
            ...params
        });
    }
};

export const geminiPro = {
    generateContent: async (params: any) => {
        return await genAI.models.generateContent({
            model: MODEL_PRO,
            ...params
        });
    }
};

// SOTA 2026: Grounding Model (Gemini 3 Flash)
// User Note: Gemini 3 supports grounding!
export const geminiGroundingModel = {
    generateContent: async (params: any) => {
        return await genAI.models.generateContent({
            model: "gemini-3-flash-preview", 
            ...params
        });
    }
};
