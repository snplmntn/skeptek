import { geminiFlash, geminiGroundingModel } from '../gemini';
import { AgentState, RedditData } from './scout-types';
import { withRetry } from '../retry';

/**
 * the reddit scout (grounded via gemini 2.5):
 * uses native gemini grounding (googlesearch) to find and summarize reddit threads.
 * hive mind aware - uses canonical name if available.
 */
export async function redditScout(input: AgentState | string): Promise<RedditData | null> {
  // hive mind logic: determine the best query
  const query = typeof input === 'string' 
      ? input 
      : (input.canonicalName || input.initialQuery);

  console.log(`[Reddit Scout] Grounding Search for: ${query}`);
  
  try {
    // query optimization (anti-tunneling)
    // simplify "apple 2025 macbook pro with the m5 chip" to "macbook pro m5 reddit"
    const optimizedQuery = await withRetry(async () => {
        const res = await geminiFlash.generateContent({
             contents: [{ role: "user", parts: [{ text: `Convert this product name into a short, effective Reddit search query (3-5 keywords max): "${query}"` }] }]
        });
        const text = res.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || query;
        // fix: remove markdown (**, *, _, etc) and quotes
        return text.replace(/["*_]/g, ''); 
    }, { maxRetries: 2 });

    console.log(`[Reddit Scout] 🎯 Optimized Query: "${optimizedQuery}"`);

    // hybrid search (python microservice + gemini analysis)
    // we use the python backend to perform a "headless manual search" which guarantees real urls.
    // then we feed those urls/titles to gemini to analyze.

    try {
        console.log(`[Reddit Scout] Engaging Python Microservice for: "${optimizedQuery}"`);
        
        // 1. Call Local Tool
        const searchRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/tools/reddit_search`, {
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

        // 2. scrape the top 2 threads for real comments
        // we use the /scrape endpoint to get the actual discussion text.
        const topThreads = threads.slice(0, 2);
        const scrapedContents = await Promise.all(topThreads.map(async (t: any) => {
            try {
                const scrapeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/scrape?url=${encodeURIComponent(t.url)}`);
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
             // fallback to title-based inference if scraping fails
             validScrapes.push(...threads.slice(0, 3).map((t: any) => ({ title: t.title, url: t.url, text: "Content unavailable." })));
        }

        // 3. analyze scraped content with gemini
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
        
        // robust json extraction
        try {
            // 1. strip markdown
            if (text.includes("```")) {
                text = text.replace(/```json/g, "").replace(/```/g, "").trim();
            }
            // 2. find json boundaries
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
                text = text.substring(start, end + 1);
            }
            
            const json = JSON.parse(text);
            
            // attach verified sources
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
        // fallback to generic return
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
