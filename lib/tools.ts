import { FunctionDeclaration } from "@google/genai";

// --- tool definitions ---

export const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "fetchMarketDetails",
    description: "Fetches detailed pricing, availability, and title from a specific product URL using the Skeptek Python Engine. Use this when you have a URL but need verification.",
    parameters: {
      type: "OBJECT" as any,
      properties: {
        url: { type: "STRING" as any, description: "The direct product URL to scrape" }
      },
      required: ["url"]
    }
  },
  {
    name: "fetchReddit",
    description: "Searches Reddit for discussions about a product to gauge community sentiment and find real user reviews.",
    parameters: {
      type: "OBJECT" as any,
      properties: {
        query: { type: "STRING" as any, description: "Product name or specific question to search on Reddit" }
      },
      required: ["query"]
    }
  },
  {
    name: "fetchYouTube",
    description: "Searches YouTube for video reviews and extracts transcripts to find audio insights.",
    parameters: {
      type: "OBJECT" as any,
      properties: {
        query: { type: "STRING" as any, description: "Product name or specific question to search on YouTube" }
      },
      required: ["query"]
    }
  },
  // gemini native grounding is configured separately in the request config, not as a function declaration.
];

// --- tool implementation interfaces ---

export interface ToolCalls {
    fetchMarketDetails: (url: string) => Promise<any>;
    fetchReddit: (query: string) => Promise<any>;
    fetchYouTube: (query: string) => Promise<any>;
}
