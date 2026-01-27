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
          Find grounded video reviews for: "${query}" on YouTube.
          
          STRICT GROUNDING RULES:
          1. **Use Search Results**: You must ONLY use data that appears in the Google Search results.
          2. **Extract Real IDs**: multiple search results might be YouTube videos.
             - Look for "youtube.com/watch?v=..."
             - Look for "youtu.be/..."
             - Look for Google redirects (vertexaisearch...)
          3. **No Invention**: If you cannot find a link in the results, DO NOT invent one.
          
          Format:
          [
            {
              "id": "11_CHAR_ID",
              "title": "Exact Title from Search Result",
              "url": "Original URL found"
            }
          ]
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

    console.log(`[Video Scout] Validated ${videos.length}/${rawVideos.length} videos`);
    return videos;

  } catch (error: any) {
    console.error(`[Video Scout] Failed after retries:`, {
      query,
      error: error.message,
      status: error.status
    });
    return [];
  }
}
