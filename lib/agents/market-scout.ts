import { geminiFlash, geminiGroundingModel } from '../gemini';
import { MarketData } from './scout-types';
import { withRetry } from '../retry';
import { checkLinkValidity } from '../link-verifier';
import { reviewScout } from './review-scout'; // SOTA 2026

/**
 * The Market Scout (Grounded):
 * Uses Gemini with Google Search Grounding to find accurate specs and pricing.
 * SOTA 2026: Includes exponential backoff retry for resilience.
 */
export async function marketScout(query: string): Promise<MarketData | null> {
  console.log(`[Market Scout] Grounding Search for: ${query}`);
  
  // SOTA 2026: Direct URL Handling (Anti-Hallucination)
  // If the query is a specific URL, we MUST trust the page content (via Python Scraper)
  // over a generic Google Search which might pick up "Recommended Products" sidebars.
  if (query.startsWith('http://') || query.startsWith('https://')) {
       console.log(`[Market Scout] detected URL. Delegating to Review Scout for specific scrape...`);
       const scraped = await reviewScout(query);
       
        if (scraped && scraped.productName) {
            const lowerName = scraped.productName.toLowerCase();
            const isInvalid = lowerName.includes("not found") || 
                             lowerName.includes("data retrieval error") || 
                             lowerName.includes("bot check") ||
                             scraped.productName.length < 3;

            if (!isInvalid) {
                console.log(`[Market Scout] ✅ Scraper Identity Confirmed: "${scraped.productName}"`);
                return {
                    title: scraped.productName,
                    price: scraped.price || 'Check Site', // SOTA 2026: Use scraper data
                    specs: {
                        Source: scraped.source,
                        Summary: scraped.summary
                    },
                    productUrl: query,
                    launchDate: 'Unknown', // Hard to parse from raw HTML
                    supersededBy: undefined
                };
            }
            console.warn(`[Market Scout] 🚨 Scraper returned invalid identity: "${scraped.productName}". Ignoring.`);
        }
        console.warn(`[Market Scout] Scraper failed to identify product. Falling back to Search Grounding.`);
  }

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
          5. RELEASE INFO: When was this product first released (Year)? 
          6. ALTERNATIVES: Is there a newer model or direct successor available now (Jan 2026)?
          7. MSRP: What was the original launch price (MSRP)?
          8. COMPETITION: What is the typical price range for similar competitor products?
          
          IMPORTANT: FORMATTING (Few-Shot Examples)
          - Price: "~$1200" (NOT "Approx. $1200 USD")
          - Price: "$450 - $600" (NOT "$450 to $600 depending on condition")
          - Specs Source: "Google Search"
          - Specs Summary: "M1 Chip, 8GB RAM, 256GB SSD" (Keep it comma separated, < 10 words)

          Return JSON:
          {
            "title": string,
            "price": string,
            "specs": { "Source": "Google Search", "Summary": string },
            "productUrl": string,
            "launchDate": string (e.g., "Nov 2020"),
            "supersededBy": string | null (Name of newer model if any),
            "msrp": string | null,
            "competitorPriceRange": string | null
          }
        `;

        // SOTA: Use Google Search Grounding
       return await geminiGroundingModel.generateContent({
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

    const text = result.text || "";
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error("No JSON found in response");
    const jsonStr = text.substring(start, end + 1);
    const json = JSON.parse(jsonStr);
    
    // SOTA 2026: Active URL Verification
    // Ensure the "View Deal" link is actually alive (prevent 404s).
    if (json.productUrl) {
        // Use Global Link Verifier (Python Backend capable)
        const isAlive = await checkLinkValidity(json.productUrl);
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
    return {
      title: query,
      price: 'Unknown',
      specs: {},
      productUrl: '',
      isRateLimited: error.status === 429 || error.message?.includes('429')
    } as MarketData;
  }
}

