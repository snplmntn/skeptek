import { geminiFlash } from '../gemini';
import { AgentState, VideoData } from './scout-types';
import { withRetry } from '../retry';

/**
 * The Video Scout (Grounded):
 * Uses Gemini Grounding (Google Search) to find YouTube Video Reviews.
 * SOTA 2026: Hive Mind Aware - uses canonical name if available.
 */
export async function videoScout(input: AgentState | string): Promise<VideoData[]> {
  // Hive Mind Logic: Determine the best query
  const query = typeof input === 'string' 
      ? input 
      : (input.canonicalName || input.initialQuery);
      
  console.log(`[Video Scout] Grounding Search for: ${query}`);
  
  try {
    const result = await withRetry(
      async () => {
        const prompt = `
          Find video reviews for: "${query}".
          
          SEARCH STRATEGY:
          1. Look for YouTube links (youtube.com/watch, youtu.be).
          2. Look for "Video" sections in Google Search results.
          3. Look for Reddit threads that might *contain* video links (e.g. "Review of InPlay GS650").
          
          STRICT GROUNDING RULES:
          1. **NO INVENTION**: You must ONLY use links/IDs that appear in the search results.
          2. **Link Extraction**: If you see a Google Redirect (vertexaisearch...), trust it if the context implies it's a video.
          3. **Title Match**: The title must closely match the product.
          
          Format:
          [
            {
              "id": "11_CHAR_ID",
              "title": "Actual Title Found",
              "url": "https://www.youtube.com/watch?v=..."
            }
          ]
        `;

        // Strategy Pivot: Remove strict 'site:youtube.com' to allow finding videos via other platforms/aggregators
        return await geminiFlash.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          tools: [{ googleSearch: {} }] as any, 
        });
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        onRetry: (attempt, delay) => {
          console.warn(`[Video Scout] Retry ${attempt}/3 after ${Math.round(delay)}ms`);
        }
      }
    );

    const text = result.response.text();
    console.log(`[Video Scout] Raw Output:`, text.substring(0, 500) + "...");

    // Manual Robust JSON Extraction
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) return [];
    
    const jsonStr = text.substring(start, end + 1);
    const rawVideos = JSON.parse(jsonStr);

    // VALIDATION: Filter out hallucinated/invalid IDs
    const ytIdRegex = /^[a-zA-Z0-9_-]{11}$/;
    
    // Aggressive filtering patterns for known hallucinated placeholders
    const placeholderPatterns = [
        'vid_', 'actual_id', '11_CHAR', 'REAL_11', 'youtube_id', 'video_id', 'INSERT_ID', 'example', '12345678901', '1234567890'
    ];
    
    // Track seen IDs to prevent duplicates within the same result set
    const seenIds = new Set<string>();

    const videos = rawVideos.filter((v: any) => {
        const id = v.id;
        
        // 1. Structural Validation (Relaxed for SOTA 2026 Redirect handling)
        if (!id || typeof id !== 'string') {
             return false; // Only completely invalid types
        }
        
        // If it's a redirect URL or weird ID, we might need different logic, 
        // but for now let's just ensure it's not a glaring placeholder.
        const isPlaceholder = placeholderPatterns.some(pattern => id.toLowerCase().includes(pattern.toLowerCase()));
        if (isPlaceholder) {
          console.warn(`[Video Scout] Placeholder ID detected: ${id}`);
          return false;
        }

        // 3. Deduplication
        if (seenIds.has(id)) {
            return false;
        }
        
        // 4. Product Relevance (Strict)
        const productKeywords = query.toLowerCase().split(' ').filter(w => w.length > 2);
        const titleLower = (v.title || '').toLowerCase();
        
        const hasProductMention = productKeywords.some(keyword => titleLower.includes(keyword));
        
        if (!hasProductMention) {
          console.warn(`[Video Scout] Title lacks product mention: "${v.title}"`);
          return false;
        }

        seenIds.add(id);
        return true;
    });

    const enrichedVideos = videos.map((v: any) => ({
      id: v.id,
      title: v.title,
      url: v.url || `https://www.youtube.com/watch?v=${v.id}`,
      thumbnail: `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`,
      moment: "0:00",
      tag: "Review",
      tagType: "warning" as const
    }));

    console.log(`[Video Scout] Validated ${enrichedVideos.length}/${rawVideos.length} videos`);
    return enrichedVideos;

  } catch (error: any) {
    console.error(`[Video Scout] Failed after retries:`, {
      query,
      error: error.message,
      status: error.status
    });
    return [];
  }
}
