import { geminiFlash } from '../gemini';
import { AgentState, RedditData } from './scout-types';
import { withRetry } from '../retry';

/**
 * The Reddit Scout (Grounded):
 * Uses Gemini to search Reddit specifically and summarize the sentiment.
 * SOTA 2026: Hive Mind Aware - uses canonical name if available.
 */
export async function redditScout(input: AgentState | string): Promise<RedditData | null> {
  // Hive Mind Logic: Determine the best query
  const query = typeof input === 'string' 
      ? input 
      : (input.canonicalName || input.initialQuery);

  console.log(`[Reddit Scout] Grounding Search for: ${query}`);
  
  try {
    const result = await withRetry(
      async () => {


        const prompt = `
          Search Reddit for discussions/reviews about: "${query}".
          
          CRITICAL:
          1. ONLY use data from actual 'reddit.com' search results.
          2. YOU MUST CITE YOUR SOURCES. For every sentiment/comment extracted, include the URL of the thread in the "sources" array.
          3. IF NO REDDIT THREADS ARE FOUND, return empty sources and null comments.
          
          Return JSON:
          {
            "threadTitle": "Summary of Reddit Consensus",
            "comments": string[], 
            "sentimentCount": { "positive": 0, "neutral": 0, "negative": 0 },
            "sources": { "title": string, "url": string }[] 
          }
        `;

        return await geminiFlash.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }] as any, 
        });
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: (attempt, delay) => {
          console.warn(`[Reddit Scout] Retry ${attempt}/3 after ${Math.round(delay)}ms`);
        }
      }
    );

    const text = result.response.text();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error("No JSON found in response");
    const jsonStr = text.substring(start, end + 1);
    const json = JSON.parse(jsonStr);

    // DEBUG: Log raw sources before filtering
    console.log(`[Reddit Scout] Raw Sources found: ${json.sources?.length || 0}`);
    if (json.sources) console.dir(json.sources, { depth: null });

    // ANTI-HALLUCINATION: Filter sources that are not from reddit.com
    // NOTE: We must allow 'vertexaisearch' and 'google' because Grounding API returns redirect URLs.
    if (json.sources && Array.isArray(json.sources)) {
        json.sources = json.sources.filter((s: any) => {
            if (!s.url) return false;
            const url = s.url.toLowerCase();
            return url.includes('reddit.com') || 
                   url.includes('vertexaisearch') || 
                   url.includes('google.com');
        });
    }

    return json;

  } catch (error: any) {
    console.error(`[Reddit Scout] Failed after retries:`, {
      query,
      error: error.message,
      status: error.status
    });
    return null;
  }
}
