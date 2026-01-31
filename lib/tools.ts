import { FunctionDeclaration } from "@google/genai";

// --- TOOL DEFINITIONS ---

export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "fetchMarketDetails",
    description: "Fetches detailed pricing, availability, and title from a specific product URL using the Skeptek Python Engine. Use this when you have a URL but need verification.",
    parameters: {
      type: "OBJECT",
      properties: {
        url: { type: "STRING", description: "The direct product URL to scrape" }
      },
      required: ["url"]
    }
  },
  {
    name: "fetchReddit",
    description: "Searches Reddit for discussions about a product to gauge community sentiment and find real user reviews.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Product name or specific question to search on Reddit" }
      },
      required: ["query"]
    }
  },
  {
    name: "fetchYouTube",
    description: "Searches YouTube for video reviews and extracts transcripts to find audio insights.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Product name to search on YouTube" }
      },
      required: ["query"]
    }
  },
  // Gemini Native Grounding is configured separately in the request config, not as a function declaration.
];

// --- TOOL IMPLEMENTATION INTERFACES ---

export interface ToolCalls {
    fetchMarketDetails: (url: string) => Promise<any>;
    fetchReddit: (query: string) => Promise<any>;
    fetchYouTube: (query: string) => Promise<any>;
}
