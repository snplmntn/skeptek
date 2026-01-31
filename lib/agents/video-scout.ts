import { geminiFlash, geminiGroundingModel } from '../gemini';
import { AgentState, VideoData } from './scout-types';
import { withRetry } from '../retry';
import { filterValidLinks } from '../link-verifier';

// SOTA 2026: Enhanced fetch with robust error handling for Python/Node Microservices
async function fetchTranscript(videoId: string): Promise<any[]> {
    try {
        // 1. Python Service (Primary)
        try {
             const pyRes = await fetch(`http://localhost:8000/transcript?video_id=${videoId}`, {
                 signal: AbortSignal.timeout(10000) // 10s timeout
             });
             
             const text = await pyRes.text(); // Read raw first
             
             if (pyRes.ok) {
                 try {
                     const data = JSON.parse(text);
                     if (data.transcript) {
                         console.log(`[YouTube Transcript] ✅ Success via Python for ${videoId} (${data.transcript.length} segments)`);
                         return data.transcript;
                     } else {
                         console.warn(`[YouTube Transcript] 🐍 Python returned OK but missing transcript:`, data);
                     }
                 } catch (parseErr) {
                     console.warn(`[YouTube Transcript] 🐍 Python returned invalid JSON: ${text.substring(0, 50)}...`);
                 }
             } else {
                 console.warn(`[YouTube Transcript] 🐍 Python Error (${pyRes.status}): ${text.substring(0, 200)}`);
             }
        } catch (pyErr: any) {
             console.warn(`[YouTube Transcript] Python Service connection failed: ${pyErr.message}`);
        }

        // 2. Node.js Fallback (Youtube-Transcript-Dist - Unofficial)
        console.log(`[YouTube Transcript] 🌍 Fetching transcript via Node Scraper for: ${videoId}`);
        
        let getSubtitles;
        try {
             // Safe Import for CommonJS/ESM Interop
             const scraperModule = await import('youtube-captions-scraper');
             // @ts-ignore
             getSubtitles = scraperModule.getSubtitles || scraperModule.default?.getSubtitles || scraperModule.default;
        } catch (importErr) {
             console.error("[YouTube Transcript] Failed to import node scraper:", importErr);
             return [];
        }

        if (typeof getSubtitles !== 'function') {
             console.error("[YouTube Transcript] scraper.getSubtitles is not a function:", getSubtitles);
             return [];
        }
        
        // This library often throws, so we wrap it
        let subtitles = [];
        try {
             subtitles = await getSubtitles({
                videoID: videoId,
                lang: 'en'
            });
        } catch (scraperInternalErr: any) {
             console.warn(`[YouTube Transcript] Node Scraper Internal Crash: ${scraperInternalErr.message}`);
             return [];
        }
        
        return subtitles;

    } catch (error: any) {
        console.error(`[YouTube Transcript] Error for ${videoId}: ${error.message}`);
        // Return null so we can filter it out gracefully
        return [];
    }
}


// SOTA 2026: Official YouTube Data API v3 Integration
async function searchYouTubeApi(query: string): Promise<any[] | null> {
    const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;
    // SOTA: Google Search Tool is powerful, but API is ground truth.
    if (!apiKey) return null;

    try {
        console.log(`[Video Scout] 📡 Calling YouTube API v3 for: "${query}"`);
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5&key=${apiKey}`);
        
        if (!res.ok) {
            console.warn(`[Video Scout] YouTube API Error: ${res.status} ${res.statusText}`);
            return null; 
        }

        const data = await res.json();
        if (!data.items || data.items.length === 0) return [];

        return data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            author: item.snippet.channelTitle, 
            description: item.snippet.description
        }));
    } catch (e) {
        console.error("YouTube API Exception", e);
        return null;
    }
}



/**
 * The Video Scout (Grounded):
 * Uses Gemini Grounding (Google Search) to find YouTube Video Reviews.
 * SOTA 2026: Hive Mind Aware - uses canonical name if available.
 * NOW: Fetches transcripts for deeper audio-level forensics.
 */
export async function videoScout(input: AgentState | string): Promise<VideoData[]> {
  // Hive Mind Logic: Determine the best query
  const query = typeof input === 'string' 
      ? input 
      : (input.canonicalName || input.initialQuery);
      
  console.log(`[Video Scout] Grounding Search for: ${query}`);
  
  try {
    let rawVideos: any[] = [];
    
    // 1. Try Official API
    const apiResults = await searchYouTubeApi(query);
    if (apiResults && apiResults.length > 0) {
        console.log(`[Video Scout] ✅ Found ${apiResults.length} videos via Official API.`);
        rawVideos = apiResults;
    } 

    // 2. Fallback to Gemini Grounding (Search Tool)
    if (rawVideos.length === 0) {
        try {
            const result = await withRetry(
              async () => {
                const prompt = `
                  Find video reviews for: "${query}".
                  
                  SEARCH STRATEGY:
                  1. USE THE GOOGLE SEARCH TOOL. This is mandatory.
                  2. Look for YouTube links (youtube.com/watch, youtu.be) in the search results.
                  3. Look for "Video" sections in Google Search results.
                  
                  STRICT GROUNDING RULES:
                  1. **NO INVENTION**: You must ONLY use links/IDs that appear in the provided Google Search results.
                  2. **Link Extraction**: Trust the Search Tool's output.
                  3. **Title Match**: The title must closely match the product.
                  4. **ANTI-HALLUCINATION**: IF NO VIDEO LINKS ARE FOUND IN THE SEARCH RESULTS, RETURN []. DO NOT MAKE UP IDs.
                  
                  Format:
                  [
                    {
                      "id": "11_CHAR_ID",
                      "title": "Actual Title Found",
                      "url": "https://www.youtube.com/watch?v=..."
                    }
                  ]
                `;

                // Verify with Gemini 2.5 (Grounding)
                return await geminiGroundingModel.generateContent({
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

            const text = result.text || "";
            // Check Grounding (SOTA 2026 Verification)
            const grounding = result.candidates?.[0]?.groundingMetadata;
            if (!grounding) {
                console.warn(`[Video Scout] ⚠️ No Grounding Metadata found for "${query}". Potential Hallucination Risk.`);
            } else {
                const chunks = grounding.groundingChunks?.length || 0;
                console.log(`[Video Scout] Grounding verified: ${chunks} chunks.`);
            }

            console.log(`[Video Scout] Raw Output:`, text.substring(0, 500) + "...");

            const start = text.indexOf('[');
            const end = text.lastIndexOf(']');
            if (start !== -1 && end !== -1) {
                const jsonStr = text.substring(start, end + 1);
                rawVideos = JSON.parse(jsonStr);
            }
        } catch (geminiError) {
            console.error("[Video Scout] Gemini Fallback Failed:", geminiError);
        }
    }

    // VALIDATION: Filter out hallucinated/invalid IDs
    const ytIdRegex = /^[a-zA-Z0-9_-]{11}$/;
    
    // Aggressive filtering patterns for known hallucinated placeholders
    const placeholderPatterns = [
        'vid_', 'actual_id', '11_CHAR', 'REAL_11', 'youtube_id', 'video_id', 'INSERT_ID', 'example', '12345678901', '1234567890'
    ];
    
    // Track seen IDs to prevent duplicates within the same result set
    const seenIds = new Set<string>();

    const validatedVideos = rawVideos.filter((v: any) => {
        const id = v.id;
        
        // 1. Structural Validation (Relaxed for SOTA 2026 Redirect handling)
        if (!id || typeof id !== 'string') {
             return false; // Only completely invalid types
        }
        
        // 2. Placeholder Check
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

    // Zero-Trust Verification (Backend Specialist)
    console.log(`[Video Scout] verifying ${validatedVideos.length} links...`);
    const verifiedVideos = await filterValidLinks(validatedVideos);
    console.log(`[Video Scout] Zero-Trust Result: ${verifiedVideos.length} valid links.`);

    if (verifiedVideos.length === 0) {
        console.warn(`[Video Scout] No valid videos found. Returning [].`);
        return [];
    }

    // Node 2.5: Deep Video Forensics (Parallel)
    // SOTA: Only fetch for top 2 to preserve performance and latency
    console.log(`[Video Scout] Deep Forensics on top ${Math.min(2, verifiedVideos.length)} videos...`);
    
    const enrichedVideos = await Promise.all(verifiedVideos.map(async (v: any, index: number) => {
      // Limit to top 2 for deep analysis to save time
      if (index >= 2) return {
          id: v.id,
          title: v.title,
          url: v.url || `https://www.youtube.com/watch?v=${v.id}`,
          thumbnail: `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`,
          moment: "0:00",
          tag: "Video Review",
          tagType: "warning" as const
      };


      // PARALLEL: Fetch Transcript AND Visual Insight (only for #1 video to save overhead)
      const transcriptPromise = fetchTranscript(v.id);
      
      // Phase 3: Visual Insight (The "Eyes")
      // Only run on the FIRST video to be efficient.
      const visionPromise = (index === 0) ? getVideoInsight(v.url || `https://www.youtube.com/watch?v=${v.id}`) : Promise.resolve(null);

      const [transcriptItems, visualData] = await Promise.all([transcriptPromise, visionPromise]);

      let forensics = null;

      if (transcriptItems) {
          // Perform Forensic Analysis on the Transcript
          forensics = await analyzeTranscript(v.title, transcriptItems);
      }
      
      // Merge Visual Insight into Forensics
      if (visualData) {
          if (!forensics) forensics = {};
          
          forensics.visual = {
              holdingProduct: visualData.reviewerHoldingProduct,
              defectsDetected: !!visualData.visualDefects,
              defectDescription: visualData.visualDefects,
              angryFace: visualData.angryFaceDetected
          };
          
          // Boost tag if visual defects found
          if (visualData.visualDefects && visualData.visualDefects !== "None") {
              forensics.defectFound = true; 
              forensics.defectType = `Visual: ${visualData.visualDefects}`;
          }
      }

      return {
        id: v.id,
        title: v.title,
        url: v.url || `https://www.youtube.com/watch?v=${v.id}`,
        thumbnail: `https://img.youtube.com/vi/${v.id}/mqdefault.jpg`,
        moment: forensics?.keyMoment || "0:00",
        tag: forensics?.defectFound ? "Defect Detected" : "Forensic Verified",
        tagType: (forensics?.defectFound ? "alert" : (transcriptItems ? "success" : "warning")) as "alert" | "success" | "warning",
        forensics: forensics
      };
    }));

    console.log(`[Video Scout] Validated & Enriched ${enrichedVideos.length}/${rawVideos.length} videos`);
    
    // SOTA 2026: Quality Sorting & Limiting (Top 4)
    // Priority: Defect Detected > Verified Transcript > Google Rank
    const sortedVideos = enrichedVideos.sort((a, b) => {
        const score = (v: any) => {
            if (v.forensics?.defectFound) return 3; // Top Priority
            if (v.tagType === 'success') return 2;  // Valid Transcript
            return 1; // Basic Match
        };
        return score(b) - score(a);
    });

    return sortedVideos.slice(0, 4);

  } catch (error: any) {
    console.error(`[Video Scout] Failed after retries:`, {
      query,
      error: error.message,
      status: error.status
    });
    return [];
  }
}

/**
 * Deep Forensic Analysis of Transcript
 * Scans for defects, failures, and key moments.
 */
async function analyzeTranscript(productName: string, items: any[]): Promise<any> {
    try {
        // 1. Prepare Context (Limit to ~15k chars to fit in Flash window quickly)
        const fullText = items.map(i => `[${Math.floor(i.offset / 1000)}s] ${i.text}`).join('\n').slice(0, 15000);
        
        const prompt = `
            Analyze this video transcript for product "${productName}".
            
            TASKS:
            1. DETECT DEFECTS: Look for mentions of "breaking", "fail", "wobble", "disconnect", "bad quality", "return", "dead pixel", "issue".
            2. EXTRACT MOMENT: Find the ONE most critical segment (timestamp + quote).
            3. SUMMARY: Brief 1-sentence thought on the video's sentiment.
            
            IMPORTANT: FORMATTING (Few-Shot Examples)
            - Defect Type: "Hinge wobble" (Short, < 5 words)
            - Key Moment: "3:45" (M:SS format only)
            - Key Quote: "The screen flickers when..." (Keep under 100 chars)

            TRANSCRIPT:
            ${fullText}
            
            RETURN JSON:
            {
               "defectFound": boolean,
               "defectType": string | null,
               "keyMoment": string (format "M:SS"),
               "keyQuote": string,
               "sentiment": "positive" | "semineutral" | "negative"
            }
        `;

        const result = await geminiFlash.generateContent({
             contents: [{ role: "user", parts: [{ text: prompt }] }],
             generationConfig: { responseMimeType: "application/json" }
        });

        const text = result.text || "{}";
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start === -1) return null;
        
        return JSON.parse(text.substring(start, end + 1));

    } catch (e) {
        console.error("[Video Scout] Forensics Failed:", e);
        return null;
    }
}

/**
 * Phase 3: Visual Insight (Python Muscle)
 * Downloads video and uses Gemini Vision to detect physical defects/reactions.
 */
export async function getVideoInsight(videoUrl: string): Promise<any> {
    try {
        const res = await fetch('http://localhost:8000/tools/video_insight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: videoUrl }),
            signal: AbortSignal.timeout(60000) // 60s timeout for download
        });
        
        if (!res.ok) return null;
        const json = await res.json();
        return json.status === 'success' ? json.data : null;
    } catch (e) {
        console.warn("[Video Scout] Visual Insight Failed:", e);
        return null;
    }
}
