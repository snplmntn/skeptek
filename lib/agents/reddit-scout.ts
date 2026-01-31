import { geminiFlash, geminiGroundingModel } from '../gemini';
import { AgentState, RedditData } from './scout-types';
import { withRetry } from '../retry';

/**
 * The Reddit Scout (Grounded via Gemini 2.5):
 * Uses Native Gemini Grounding (googleSearch) to find and summarize Reddit threads.
 * SOTA 2026: Hive Mind Aware - uses canonical name if available.
 */
export async function redditScout(input: AgentState | string): Promise<RedditData | null> {
  // Hive Mind Logic: Determine the best query
  const query = typeof input === 'string' 
      ? input 
      : (input.canonicalName || input.initialQuery);

  console.log(`[Reddit Scout] Grounding Search for: ${query}`);
  
  try {
    // SOTA 2026: Query Optimization (Anti-Tunneling)
    // Simplify "Apple 2025 MacBook Pro with the M5 chip" to "MacBook Pro M5 Reddit"
    const optimizedQuery = await withRetry(async () => {
        const res = await geminiFlash.generateContent({
             contents: [{ role: "user", parts: [{ text: `Convert this product name into a short, effective Reddit search query (3-5 keywords max): "${query}"` }] }]
        });
        const text = res.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || query;
        // Fix: Remove markdown (**, *, _, etc) and quotes
        return text.replace(/["*_]/g, ''); 
    }, { maxRetries: 2 });

    console.log(`[Reddit Scout] 🎯 Optimized Query: "${optimizedQuery}"`);

    // SOTA 2026: HYBRID SEARCH (Python Microservice + Gemini Analysis)
    // We use the Python backend to perform a "Headless Manual Search" which guarantees real URLs.
    // Then we feed those URLs/Titles to Gemini to analyze.

    try {
        console.log(`[Reddit Scout] Engaging Python Microservice for: "${optimizedQuery}"`);
        
        // 1. Call Local Tool
        const searchRes = await fetch('http://localhost:8000/tools/reddit_search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: optimizedQuery })
        });
        
        const searchData = await searchRes.json();
        const threads = searchData.data || [];
        
        console.log(`[Reddit Scout] Microservice found ${threads.length} threads.`);
        
        if (threads.length === 0) {
             console.warn("[Reddit Scout] No threads found via Python. Falling back to generic search.");
             return {
                threadTitle: "Search Results",
                comments: [],
                sentimentCount: { positive: 0, neutral: 0, negative: 0 },
                botProbability: 0,
                searchSuggestions: [],
                sources: [{
                    title: "Reddit Search Results",
                    url: `https://www.google.com/search?q=site:reddit.com+${encodeURIComponent(optimizedQuery)}`,
                    snippet: "Click to explore discussions"
                }]
            };
        }

        // 2. Scrape the Top 2 Threads for REAL Comments
        // We use the /scrape endpoint to get the actual discussion text.
        const topThreads = threads.slice(0, 2);
        const scrapedContents = await Promise.all(topThreads.map(async (t: any) => {
            try {
                const scrapeRes = await fetch(`http://localhost:8000/scrape?url=${encodeURIComponent(t.url)}`);
                const scrapeData = await scrapeRes.json();
                return {
                    title: t.title,
                    url: t.url,
                    text: scrapeData.text ? scrapeData.text.slice(0, 8000) : "", // efficient context window
                };
            } catch (e) {
                console.warn(`[Reddit Scout] Failed to scrape ${t.url}`, e);
                return null;
            }
        }));

        const validScrapes = scrapedContents.filter((s: any) => s && s.text && s.text.length > 100);

        if (validScrapes.length === 0) {
             console.warn("[Reddit Scout] Scraped content empty. Using titles only (Fallback).");
             // Fallback to title-based inference if scraping fails
             validScrapes.push(...threads.slice(0, 3).map((t: any) => ({ title: t.title, url: t.url, text: "Content unavailable." })));
        }

        // 3. Analyze Scraped Content with Gemini
        const prompt = `
          Analyze these Reddit discussions about "${optimizedQuery}":
          
          ${validScrapes.map((s: any) => `
          --- THREAD: ${s.title} ---
          URL: ${s.url}
          CONTENT:
          ${s.text}
          ---------------------------
          `).join('\n')}
          
          TASK:
          1. Infer the general user sentiment.
          2. Extract 3-4 EXACT, VERBATIM QUOTES from users.
          3. Sourcing: Attach the correct "sourceUrl" to each quote if possible, or I will map it later.
          
          OUTPUT JSON:
          {
            "threadTitle": "Consensus from ${validScrapes.length} threads",
            "comments": ["Exact quote 1", "Exact quote 2"],
            "sentimentCount": { "positive": 0, "neutral": 0, "negative": 0 },
            "botProbability": 0,
            "sources": [
                { "title": "Thread Title", "url": "URL", "snippet": "Context" }
            ]
          }
        `;
        
        const result = await withRetry(async () => {
             return await geminiFlash.generateContent({
                  contents: [{ role: "user", parts: [{ text: prompt }] }],
                  generationConfig: { responseMimeType: "application/json" }
             });
        }, { maxRetries: 2 });
        
        let text = result.text || "{}";
        
        // Robust JSON Extraction (SOTA 2026)
        try {
            // 1. Strip Markdown
            if (text.includes("```")) {
                text = text.replace(/```json/g, "").replace(/```/g, "").trim();
            }
            // 2. Find JSON boundaries
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
                text = text.substring(start, end + 1);
            }
            
            const json = JSON.parse(text);
            
            // Attach VERIFIED sources
            json.sources = threads.slice(0, 4).map((t: any) => ({
                title: t.title,
                url: t.url,
                snippet: "Verified Thread"
            }));
            
            return json;
        } catch (e) {
            console.warn(`[Reddit Scout] JSON Parse Failed for text: "${text.slice(0, 50)}..."`, e);
            throw new Error("Invalid JSON from Gemini"); // Trigger fallback
        }

    } catch (err) {
        console.error("Reddit Scout Microservice Error:", err);
        // Fallback to generic return
         return {
            threadTitle: "Analysis Failed",
            comments: ["Could not retrieve Reddit data."],
            sentimentCount: { positive: 0, neutral: 0, negative: 0 },
            botProbability: 0,
            searchSuggestions: [],
            sources: [{
                title: "Reddit Search Results",
                url: `https://www.google.com/search?q=site:reddit.com+${encodeURIComponent(optimizedQuery)}`,
                snippet: "Fallback Source"
            }]
        };
    }
  } catch (error: any) {
      console.error(`[Reddit Scout] Top-Level Error:`, error.message);
      return null;
  }
}
