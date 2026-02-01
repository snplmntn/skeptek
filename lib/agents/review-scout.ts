import { geminiFlash, geminiGroundingModel } from '../gemini';
import { withRetry } from '../retry';
import { checkLinkValidity } from '../link-verifier';
import * as cheerio from 'cheerio';

export interface ReviewData {
  summary: string;
  pros: string[];
  cons: string[];
  reviewerScore?: number;
  source: string;
  url: string;
  userReviews?: string[];
  productName?: string; 
  price?: string; // capture price during scrape
}

/**
 * review scout - dual mode:
 * mode a: specific url scraping
 * mode b: search trusted review sites
 */
export async function reviewScout(input: string): Promise<ReviewData | null> {
  const isUrl = input.startsWith('http://') || input.startsWith('https://');
  
  if (isUrl) {
    return await scrapeSpecificUrl(input);
  } else {
    return await searchReviewSites(input);
  }
}

/**
 * mode a: scrape a specific url for review content
 */
async function scrapeSpecificUrl(url: string): Promise<ReviewData | null> {
  console.log(`[Review Scout] Scraping URL: ${url}`);
  
  try {
    let html = "";
    let usedBackend = false;

    // hybrid scraping architecture
    // 1. attempt high-fidelity scrape via python/playwright microservice (if running)
    try {
        console.log(`[Review Scout] 🚀 Attempting High-Fidelity Scrape via localhost:8000...`);
        const scraperRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/scrape?url=${encodeURIComponent(url)}`, {
             method: 'GET',
             headers: { 'Content-Type': 'application/json' },
             signal: AbortSignal.timeout(45000) // 45s timeout for scraper (Auto-Scroll is slow)
        });
        
        if (scraperRes.ok) {
             const data = await scraperRes.json();
             // debug: log the backend response
             console.log(`[Review Scout] Backend Response: ${data.text?.substring(0, 150)}...`);
             
             if (data.html) {
                 html = data.html;
                 usedBackend = true;
                 console.log(`[Review Scout] ✅ High-Fidelity Scrape Successful!`);
             }
        }
    } catch (e) {
        console.warn(`[Review Scout] ⚠️ Scraper Microservice unavailable (Timeout/Error). Falling back.`);
    }

    // 2. fallback: standard fetch (low-fidelity)
    if (!usedBackend) {
        html = await withRetry(async () => {
            const res = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                }
            });
            if (res.ok) return await res.text();
            return "";
        }, { maxRetries: 2, baseDelay: 1000 });
    }

    // 3. fallback: gemini url grounding (if fetch failed or blocked)
    if (!html || html.length < 500) {
         console.log(`[Review Scout] 🌍 Fetch failed/blocked. Asking Gemini to read the link via Google Search...`);
         const prompt = `
             Search for the specific details of this URL: "${url}"
             
             TASK:
             1. Find the product name and current price.
             2. Extract any review summary from the search result or cached page.
             
             Return JSON:
             {
                "productName": "string",
                "price": "string",
                "summary": "string",
                "pros": [], "cons": [], "reviewerScore": null
             }
         `;
         try {
             const result = await geminiFlash.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                tools: [
                    { googleSearch: {} },
                    { url_context: {} } // direct browser-level url access
                ] as any,
             });
             
             const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
             const start = text.indexOf('{');
             const end = text.lastIndexOf('}');
             if (start !== -1 && end !== -1) {
                  const json = JSON.parse(text.substring(start, end + 1));
                  // identity verification
                  if (json.productName && !json.productName.toLowerCase().includes("not found") && json.productName.length > 2) {
                      return { ...json, source: 'Gemini Search', url: url };
                  }
             }
         } catch (geminiErr) {
             console.warn("[Review Scout] Gemini Fallback Failed:", geminiErr);
         }
    }

    // if we still have no html, we cannot proceed with cheerio parsing
    if (!html) return null;

    const $ = cheerio.load(html);
    
    // extract text content (remove scripts, styles)
    $('script, style, nav, footer, header').remove();
    // common selectors for e-commerce sites (shopee, amazon, bestbuy)
    const reviewSelectors = [
      '.shopee-product-rating__main', 
      '.review-text', 
      '.user-review', 
      '.comment-content',
      '[data-hook="review-body"]'
    ];
    
    let specificReviewText = "";
    reviewSelectors.forEach(sel => {
        $(sel).each((_, el) => {
            specificReviewText += $(el).text() + "\n";
        });
    });

    // fallback to body if no specific reviews found
    const textContent = (specificReviewText.length > 100 ? specificReviewText : $('body').text())
        .replace(/\s+/g, ' ').trim().slice(0, 8000); // Increased limit for reviews

    // use gemini to extract structured review data
    const prompt = `
      Analyze this webpage content which is likely a product page or a review.
      
      ${textContent}
      
      TASK:
      1. IDENTIFY the specific Product Name exactly as written on the page.
      2. EXTRACT the Price (current selling price).
      3. Extract review details.
      
      Return JSON:
      {
        "productName": "Exact Product Name",
        "price": "Current Price (e.g. $100 or P5000)",
        "summary": "Brief review summary",
        "pros": ["pro1", "pro2"],
        "cons": ["con1", "con2"],
        "reviewerScore": number (0-10, null if not found),
        "userReviews": ["Extract up to 3 direct quotes from user reviews found in the page"]
      }
    `;

    const result = await withRetry(async () => {
         return await geminiFlash.generateContent({
           contents: [{ role: "user", parts: [{ text: prompt }] }],
           generationConfig: { responseMimeType: "application/json" }
         });
    }, {
        maxRetries: 3,
        baseDelay: 2000
    });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // robust extraction: find { and } to handle potential markdown backticks
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1) throw new Error("No JSON object found in response");
    
    const jsonStr = text.substring(startIdx, endIdx + 1);
    const json = JSON.parse(jsonStr);

    // anti-hallucination identity validation
    if (!json.productName || json.productName.toLowerCase().includes("not found") || json.productName.length < 3) {
        console.warn(`[Review Scout] 🚨 Scraper failed to identify a real product (Got: "${json.productName}"). Aborting.`);
        return null;
    }

    // price fallback (deep grounding)
    // if we have a product name but no price, ask gemini specifically for the price.
    if (!json.price || json.price.toLowerCase().includes("not specified") || json.price === "0" || json.price.includes("Check Site")) {
        console.log(`[Review Scout] 🏷️ Price missing from DOM. Attempting Deep Grounding for: ${json.productName}`);
        try {
            const priceRes = await geminiFlash.generateContent({
                contents: [{ role: "user", parts: [{ text: `Find the current MSRP or typical selling price for: "${json.productName}". Return just the number or a short price range (e.g. "$1,599" or "P12,000").` }] }],
                tools: [{ googleSearch: {} }] as any,
            });
            const priceText = priceRes.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (priceText && priceText.length < 20) {
                console.log(`[Review Scout] ✅ Price Grounded: ${priceText}`);
                json.price = priceText;
            }
        } catch (e) {
            console.warn("[Review Scout] Price Grounding failed:", e);
        }
    }

    const isValid = await checkLinkValidity(url);
    if (!isValid) return null;

    return {
      ...json,
      source: new URL(url).hostname,
      url: url
    };

  } catch (error: any) {
    console.error(`[Review Scout] Failed to scrape URL:`, error.message);
    return null;
  }
}

/**
 * mode b: search trusted review sites
 */
async function searchReviewSites(productName: string): Promise<ReviewData | null> {
  console.log(`[Review Scout] Searching review sites for: ${productName}`);
  
  try {
    const prompt = `
      Search trusted review sites (Rtings, TheVerge, Wirecutter, CNET) for professional reviews of: "${productName}".
      
      Extract:
      1. Summary of the review
      2. Pros and Cons
      3. Reviewer score (if available)
      4. Source URL
      
      ANTI-HALLUCINATION: IF NO RELEVANT REVIEWS ARE FOUND IN EXPLICIT SEARCH RESULTS, RETURN NULL. DO NOT INVENT A REVIEW.
      
      Return JSON:
      {
        "summary": string,
        "pros": string[],
        "cons": string[],
        "reviewerScore": number | null,
        "source": string,
        "url": string
      }
    `;

    const result = await withRetry(async () => {
         return await geminiGroundingModel.generateContent({
           contents: [{ role: "user", parts: [{ text: prompt }] }],
           tools: [{ googleSearch: {} }] as any,
         });
    }, {
         maxRetries: 3,
         baseDelay: 2000 // Wait longer for API quota
    });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const grounding = result.candidates?.[0]?.groundingMetadata;
    if (!grounding) {
        console.warn(`[Review Scout] ⚠️ No Grounding Metadata found.`);
    }
    // manual json extraction
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    
    const jsonStr = text.substring(start, end + 1);
    const json = JSON.parse(jsonStr);

    // zero-trust verification (backend specialist)
    console.log(`[Review Scout] Verifying source URL: ${json.url}`);
    const isValid = await checkLinkValidity(json.url);
    if (!isValid) {
        console.warn(`[Review Scout] 🚨 Rejected hallucinated/dead review URL: ${json.url}`);
        return null;
    }

    return json;

  } catch (error: any) {
    console.error(`[Review Scout] Failed:`, error.message);
    return null;
  }
}
