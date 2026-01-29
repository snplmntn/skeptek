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
    
    // SOTA 2026: Active URL Verification
    // Ensure the "View Deal" link is actually alive (prevent 404s).
    if (json.productUrl) {
        const isAlive = await checkUrlAvailability(json.productUrl);
        if (!isAlive) {
            console.warn(`[Market Scout] URL Dead/Unreachable (${json.productUrl}). Falling back to Search.`);
            json.productUrl = `https://www.google.com/search?q=${encodeURIComponent(json.title + " buy")}`;
        }
    }

    return json;

  } catch (error: any) {
    console.error(`[Market Scout] Failed after retries:`, {
      query,
      error: error.message,
      status: error.status
    });
    
    // Strict Mode: No fallback data.
    return null;
  }
}

/**
 * Verifies if a URL is reachable (returns 2xx/3xx).
 * Uses a short timeout to avoid stalling the pipeline.
 */
async function checkUrlAvailability(url: string): Promise<boolean> {
  if (!url || !url.startsWith('http')) return false;
  
  try {
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s Timeout
     
     const res = await fetch(url, { 
         method: 'HEAD', 
         signal: controller.signal,
         headers: {
             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
         }
     });
     
     clearTimeout(timeoutId);
     
     // 405 Method Not Allowed might happen for HEAD on some servers, try GET if that happens?
     // Actually, if 405, it implies existence. 
     // We mostly care about 404.
     if (res.status === 405) return true; 

     return res.ok; // 200-299 is ok.
  } catch (error) {
    // If HEAD fails (e.g. network error, timeout, or blocked), proceed with caution.
    // If it's a timeout, maybe the server is slow.
    // Given the user wants to "ensure availability", conservative is better.
    // But some valid sites block HEAD.
    console.log(`[Market Scout] URL Check warning: ${error}`);
    return false;
  }
}
