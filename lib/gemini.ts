import { GoogleGenAI } from "@google/genai";

// initialized with api key (google ai gateway)
export const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

// export model names for consistency
export const MODEL_FLASH = "gemini-3-flash-preview"; 
export const MODEL_PRO = "gemini-3-pro-preview";

// helper to keep similar api surface for easier refactoring
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

// grounding model (gemini 3 flash)
export const geminiGroundingModel = {
    generateContent: async (params: any) => {
        return await genAI.models.generateContent({
            model: MODEL_FLASH, 
            ...params
        });
    }
};
