import { geminiFlash } from '../gemini';
import { withRetry } from '../retry';
import * as cheerio from 'cheerio';

export interface ReviewData {
  summary: string;
  pros: string[];
  cons: string[];
  reviewerScore?: number;
  source: string;
  url: string;
}

/**
 * Review Scout - Dual Mode:
 * Mode A: Specific URL scraping
 * Mode B: Search trusted review sites
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
 * Mode A: Scrape a specific URL for review content
 */
async function scrapeSpecificUrl(url: string): Promise<ReviewData | null> {
  console.log(`[Review Scout] Scraping URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract text content (remove scripts, styles)
    $('script, style, nav, footer, header').remove();
    const textContent = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000);

    // Use Gemini to extract structured review data
    const prompt = `
      Extract a product review from this webpage content:
      
      ${textContent}
      
      Return JSON:
      {
        "summary": "Brief review summary",
        "pros": ["pro1", "pro2"],
        "cons": ["con1", "con2"],
        "reviewerScore": number (0-10, null if not found)
      }
    `;

    const result = await geminiFlash.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const text = result.response.text();
    const json = JSON.parse(text);

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
 * Mode B: Search trusted review sites
 */
async function searchReviewSites(productName: string): Promise<ReviewData | null> {
  console.log(`[Review Scout] Searching review sites for: ${productName}`);
  
  try {
    const result = await withRetry(
      async () => {
        const prompt = `
          Search trusted review sites (Rtings, TheVerge, Wirecutter, CNET) for professional reviews of: "${productName}".
          
          Extract:
          1. Summary of the review
          2. Pros and Cons
          3. Reviewer score (if available)
          4. Source URL
          
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

        return await geminiFlash.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }] as any,
          generationConfig: { 
             // responseMimeType: "application/json" // incompatible with tools in some versions
          }
        });
      },
      {
        maxRetries: 2,
        baseDelay: 1000
      }
    );

    const text = result.response.text();
    // Manual JSON extraction
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    
    return JSON.parse(text.substring(start, end + 1));

  } catch (error: any) {
    console.error(`[Review Scout] Failed:`, error.message);
    return null;
  }
}
