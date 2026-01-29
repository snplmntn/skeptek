import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY || "";
console.log("Gemini API Key Status:", apiKey ? "Loaded (" + apiKey.substring(0, 4) + "...)" : "MISSING");
const genAI = new GoogleGenerativeAI(apiKey);

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

// The Flash model is used for high-volume text processing (Scouts)
// SOTA 2026: gemini-2.5-flash provides Multimodal Vision support
export const geminiFlash = genAI.getGenerativeModel({ 
  model: "gemini-3-flash-preview", 
  safetySettings,
  generationConfig: {
    temperature: 0.7, 
    maxOutputTokens: 8192,
  }
});

// The Pro model is used for deep reasoning (The Judge) -> Using 3-flash as superior model
export const geminiPro = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview", 
  safetySettings,
  generationConfig: {
    temperature: 0.4, 
  }
});
