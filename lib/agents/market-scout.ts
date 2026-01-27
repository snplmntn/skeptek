import { geminiFlash } from '../gemini';
import { MarketData } from './scout-types';
import { withRetry } from '../retry';

/**
 * The Market Scout (Grounded):
 * Uses Gemini with Google Search Grounding to find accurate specs and pricing.
 * SOTA 2026: Includes exponential backoff retry for resilience.
 */
export async function marketScout(query: string): Promise<MarketData | null> {
  console.log(`[Market Scout] Grounding Search for: ${query}`);
  
  try {
    const result = await withRetry(
      async () => {
        const prompt = `
          Find current market data for: "${query}".
          Specifics needed:
          1. Correct Product Name.
          2. Current Price (approximate in USD).
          3. Key technical specs (brief summary).
          4. A link to the official page or a major retailer.
          
          Return JSON:
          {
            "title": string,
            "price": string,
            "specs": { "Source": "Google Search", "Summary": string },
            "productUrl": string
          }
        `;

        // SOTA: Use Google Search Grounding
        return await geminiFlash.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }] as any, // Type assertion for SDK compatibility
        });
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: (attempt, delay, error) => {
          console.warn(`[Market Scout] Retry ${attempt}/3 after ${Math.round(delay)}ms`);
        }
      }
    );

    const text = result.response.text();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error("No JSON found in response");
    const jsonStr = text.substring(start, end + 1);
    const json = JSON.parse(jsonStr);
    
    return json;

  } catch (error: any) {
    console.error(`[Market Scout] Failed after retries:`, {
      query,
      error: error.message,
      status: error.status
    });
    
    // Fallback if all retries exhausted
    return {
       title: query,
       price: "Unknown",
       specs: { Source: "Fallback", Summary: "Could not retrieve live data." },
       productUrl: ""
    };
  }
}
