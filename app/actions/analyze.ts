'use server';

import { createStreamableValue } from 'ai/rsc';
import { marketScout } from '@/lib/agents/market-scout';
import { redditScout } from '@/lib/agents/reddit-scout';
import { videoScout } from '@/lib/agents/video-scout';
import { reviewScout } from '@/lib/agents/review-scout';
import { geminiPro, geminiFlash } from '@/lib/gemini';
import { createClient } from '@/utils/supabase/server';
import { getCachedProduct, setCachedProduct, getFieldReports, normalizeQuery } from '@/lib/cache';
import { awardXP } from '@/app/actions/gamification';

/**
 * The Orchestrator (Server Action)
 * This functions as the "Brain" that coordinates the "Fan-Out".
 */
export async function analyzeProduct(rawQuery: string, options?: { isReviewMode?: boolean }) {
  const supabase = await createClient(); // Authenticated Client
  const query = sanitizeInput(rawQuery);
  // Create a stream to send updates to the client
  const status = createStreamableValue("Starting Research...");
  const result = createStreamableValue<any>(null); // Final JSON payload

  // We don't await this immediately so we can return the stream to the client
  (async () => {
    try {
        // 2026 HIVE MIND ORCHESTRATION (DAG)

        // 0. INTENT DETECTION: Is this a comparison?
        const comparisonMarkers = [' vs ', ' versus ', ' or ', ' compare '];
        const splitRegex = new RegExp(comparisonMarkers.join('|'), 'gi');
        
        // Check if at least one marker exists
        if (comparisonMarkers.some(m => query.toLowerCase().includes(m))) {
            const candidates = query.split(splitRegex).map(s => s.trim()).filter(s => s.length > 0);
            const items = Array.from(new Set(candidates)).slice(0, 4); // Limit to 4

            if (items.length > 1) {
                status.update(`Comparing ${items.length} products...`);
                // @ts-ignore
                await handleComparison(items, status, result); 
                return;
            }
        }
        
        // --- 0.5. CACHE CHECK (SOTA Optimization) ---
        // SOTA: If in Review Mode, we SKIP CACHE to ensure we aren't loading old "Simulated" data.
        // We want a fresh identity check for the reviewer.
        const shouldSkipCache = options?.isReviewMode;
        
        const cachedData = !shouldSkipCache ? await getCachedProduct(query) : null;
        
        if (cachedData) {
             status.update("Retrieving saved analysis...");
             await new Promise(r => setTimeout(r, 400)); // Slight delay for UX (don't flash too fast)
             result.done(cachedData);
             status.done("Complete (Cached)");
             return;
        }

        // --- 0.7. URL DETECTION (Specific Review Mode) ---
        let reviewScoutData = null;
        let mainProductQuery = query;

        if (query.startsWith('http://') || query.startsWith('https://')) {
            status.update("Reading page content...");
            const scraped = await reviewScout(query);
            if (scraped && scraped.summary) {
                 reviewScoutData = scraped;
            }
        }

        // --- STANDARD SINGLE PRODUCT FLOW ---
        // Node 1: Market Scout (The Leader) - Establishes canonical identity
        status.update("Identifying product details...");
        const marketData = await marketScout(mainProductQuery);
      
      // ERROR HANDLING (Groundedness)
      if (!marketData || (marketData.isRateLimited && marketData.price === 'Unknown')) {
          const errorMsg = marketData?.isRateLimited 
            ? "Market Scout Rate Limited (429). Forensics stalled." 
            : "Product not identified. Insufficient market ground-truth.";
          
          console.error(`[Brain] Critical Failure: ${errorMsg}`);
          status.update(`Analysis Failed: ${marketData?.isRateLimited ? 'System Busy' : 'Product Not Found'}`);
          result.done({ 
              isError: true, 
              error: errorMsg,
              isRateLimited: marketData?.isRateLimited
          });
          status.done("Insufficient Data");
          return;
      }

      // Update State with Canonical Name
      const canonicalName = marketData?.title || mainProductQuery;
      console.log(`[Hive Mind] Canonical Name established: "${canonicalName}" (Original: "${query}")`);

      // Node 2 & 3: Social & Internal Scouts (The Followers) - Context-aware search
      status.update("Analyzing reviews and videos...");
      
      // Trigger Scouts in Parallel
      const isReviewMode = options?.isReviewMode;
      
      let redditData, videoData, professionalReview;
      
      if (!isReviewMode) {
          // Full Forensic Mode
          [redditData, videoData, professionalReview] = await Promise.all([
            redditScout({ initialQuery: mainProductQuery, canonicalName, marketData: marketData, errors: [], confidence: 100 }),
            videoScout({ initialQuery: mainProductQuery, canonicalName, marketData: marketData, errors: [], confidence: 100 }),
            !reviewScoutData ? reviewScout(canonicalName) : Promise.resolve(reviewScoutData)
          ]);
      } else {
          // Review Mode: Skip external forensics, we only need internal context
          status.update("Skipping external search (Review Mode active)...");
          redditData = null;
          videoData = null;
          professionalReview = null;
      }

      // Always check internal reports
      const fieldReports = await getFieldReports(canonicalName);

      console.log("--- [DEBUG] Market Scout Data ---");
      console.dir(marketData, { depth: null, colors: true });
      if (!isReviewMode) {
          console.log("--- [DEBUG] Reddit Scout Data ---");
          console.dir(redditData, { depth: null, colors: true });
      }
      console.log("--- [DEBUG] Field Reports ---");
      console.log(`Found ${fieldReports.length} internal community reports`);

      // ERROR HANDLING
      const hasReddit = redditData && redditData.comments && redditData.comments.length > 0;
      const hasVideo = videoData && videoData.length > 0;
      const hasReview = professionalReview && professionalReview.summary;
  
      if (!isReviewMode && !hasReddit && !hasVideo && !hasReview) {
          console.warn("--- [WARNING] No forensic data found. Proceeding with Market Data only. ---");
      }
      
      status.update("Analyzing Data...");
      
      // 2. The Synthesis (Fan-In)
      const prompt = `
        Analyze this product: "${canonicalName}"
        
        [Market Data]
        ${JSON.stringify(marketData || "No market data found")}
        
        ${!isReviewMode ? `
        [Reddit/Community Feed]
        ${JSON.stringify(redditData || "No community data found")}
        
        [Video Reviews]
        ${JSON.stringify(videoData || "No video reviews found")}
        
        [Professional Review Data]
        ${JSON.stringify(professionalReview || "No professional review found")}
        ` : '[Review Mode Active: External Research Skipped]'}
        
        [Community Reviews (INTERNAL - HIGH TRUST)]
        ${JSON.stringify(fieldReports)}

        [MARKET CONTEXT for FAIRNESS]
        - A "Good Deal" isn't just cheap; it's GOOD QUALITY for the price.
        - IF Trust Score < 40 (Dangerous/Trash): Fair Value is $0 - $10 (It is e-waste).
        - IF Trust Score < 60 (Mediocre): Fair Value should be 50% of typical market price.
        - IF Trust Score > 85 (Top Tier): Fair Value can command a premium.
        
        [BOT/SPAM DETECTION]
        - Reddit Scout Bot Probability: ${redditData?.botProbability || 0}%
        - IF Bot Probability > 70%: DEDUCT 15 points from Trust Score and flag as "Suspicious Community Activity".

        [CHRONOLOGICAL CONTEXT (SOTA 2026)]
        - CURRENT DATE: January 29, 2026.
        - Evaluate the product's "Launch Date" (${marketData?.launchDate || 'Unknown'}).
        - IF the product is > 3 years old and a successor exists (${marketData?.supersededBy || 'None'}), it is "Legacy Hardware".
        - REDUCE Trust Score by 10 if it is legacy but priced like current-gen.
        - RECOMMEND "AVOID" or "CONSIDER" if a newer alternative offers better bang-for-buck.

        [CONFIDENCE & HALLUCINATION PREVENTION]
        - Has Reddit Data? ${hasReddit ? 'YES' : 'NO'}
        - Has Video Data? ${hasVideo ? 'YES' : 'NO'}
        - Has Review Data? ${hasReview ? 'YES' : 'NO'}
        - INTERNAL DATA: ${fieldReports.length} reports.
        - IMPORTANT: If forensics (Reddit/Video/Review) are NO, you MUST set "isLowConfidence": true and a lower "confidence" score (e.g. 40-60).
        - If all data is present, "confidence" should be 90-100.
        - DO NOT GUESS SPECIFICATIONS. If [Market Data] has empty specs, say "Specifications Unavailable".
        - DO NOT GUESS PRICING. If [Market Data] price is "Unknown", set "currentPrice": 0 and "isFair": false.

        TASK:
        You are "The Judge". 
        1. Identify the product.
        2. Give a **Trust Score (0-100)**:
           ${isReviewMode ? '- START at 85 (Baseline for verification).' : '- START at 75.'} 
           ${isReviewMode ? '- Since we are in Review Mode, rely on specifications and market reputation.' : 
           `- DEDUCT -20 for major failure reports (explosions, DOAs) in Reddit/Video data.
           - DEDUCT -10 for "generic/rebrand" accusations.
           - ADD +10 for consistent praise from reputable reviewers.`}
           - ADJUST based on Internal Field Reports (if many users Agree/Disagree).
           - IF FORENSIC DATA IS MISSING AND PRODUCT IS OLD: DEDUCT -15 for "Lack of Current Verification".
        3. List 3 key Pros and 3 key Cons.
        4. Determine the **Product Category** (e.g., "Smartphone", "Audio", "Kitchen", "Beauty", "Gaming", "Other").
        5. Write a "Verdict" (2 sentences max).
        6. **Make a Recommendation**: ONE WORD (BUY, CONSIDER, or AVOID).
        7. **Calculate Fairness**:
           - Use the logic above. If the product is "garantisabog" (explosive) or terrible quality, its "Fair Value" is near zero, making the current price "Unfair" (Overpriced).
        8. **Audio Insights**: Extract 2-3 specific insights/quotes derived from video transcripts.

        Schema:
        {
          "type": "single",
          "productName": string,
          "category": string,
          "score": number,
          "confidence": number,
          "isLowConfidence": boolean,
          "recommendation": "BUY" | "CONSIDER" | "AVOID", 
          "verdict": string,
          "pros": string[],
          "cons": string[],
          "audioInsights": [
             { "quote": string, "timestamp": string, "sentiment": "positive" | "negative", "topic": string }
          ],
          "priceAnalysis": {
            "currentPrice": number, 
            "fairValueMin": number, 
            "fairValueMax": number, 
            "isFair": boolean,
            "sourceUrl": string 
          }
        }
      `;

      console.log("--- [DEBUG] Gemini Brain Prompt ---");
      // console.log(prompt); // Reduced log noise

      status.update("Finalizing verdict...");
      
      let finalJson;
      try {
        const model = geminiFlash; 
        
        // SOTA 2026: Use Native JSON Mode (Structured Output)
        // Now with enhanced Audio Analysis
        const aiResult = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        });
        const text = aiResult.response.text();
        
        // Robust JSON extraction
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start === -1 || end === -1) throw new Error("No JSON found in response");
        const jsonStr = text.substring(start, end + 1);
        
        finalJson = JSON.parse(jsonStr);

        // [CRITICAL] Override AI-hallucinated URL with the REAL scraped market URL
        if (finalJson.priceAnalysis && marketData && marketData.productUrl) {
            console.log(`[Judge] Injecting real market URL: ${marketData.productUrl}`);
            finalJson.priceAnalysis.sourceUrl = marketData.productUrl;
        }

        console.log("--- [DEBUG] Gemini Brain Output ---");
        console.dir(finalJson, { depth: null, colors: true });
      } catch (err: any) {
        console.warn("⚠️ Inference Failed:", err.message);
        
        // PRODUCTION MODE: No Simulation. Fail gracefully.
        status.update("Analysis Failed: AI Service Unavailable");
        result.done({ 
            isError: true, 
            error: "Unable to complete forensic analysis. Please try again later."
        });
        status.done("System Error");
        return; 
      }

      // Attach the "Visual Proof" (scraped data) to the final result
      const fullReport = {
        ...finalJson,
        sources: {
            market: marketData,
            reddit: redditData,
            video: videoData,
            review: professionalReview
        }
      };

      // Push final result and close streams
      result.done(fullReport);
      
      // SOTA: Save to Cache (Async, non-blocking)
      setCachedProduct(query, fullReport.productName, fullReport.category, fullReport).catch(err => console.error("Cache Write Failed", err));

      // GAMIFICATION: Award XP for Analysis
      awardXP(25).catch(err => console.error("XP Award Failed", err));

    // HACKATHON: Push to Supabase Realtime Feed
      try {
          // Data Sufficiency Check: Only save if we have REAL forensic data (Reddit comments or Videos)
          // preventing "hallucinated" or "low confidence" scores from polluting the Watchtower.
          const hasForensicData = ((redditData?.comments?.length ?? 0) > 0) || ((videoData?.length ?? 0) > 0);

          if (!fullReport.isSimulated && hasForensicData) {
             await supabase.from('scans').insert({
                product_name: finalJson.productName,
                trust_score: finalJson.score,
                verdict: finalJson.verdict,
                status: finalJson.score >= 80 ? 'verified' : finalJson.score >= 50 ? 'caution' : 'rejected',
                category: finalJson.category // New Field
             });
             console.log(`[Watchtower] Scan saved: ${finalJson.productName} (${finalJson.score})`);
          } else {
             console.log(`[Watchtower] Skipped saving: ${fullReport.isSimulated ? 'Simulated' : 'Insufficient Data'}`);
          }
      } catch (dbErr) {
          console.error("Failed to push to Supabase", dbErr);
      }

      status.done("Complete");

    } catch (e) {
      console.error(e);
      status.update("Analysis Error: " + (e as Error).message);
      // Return structured error instead of null so client can handle it gracefully
      result.done({ isError: true, error: (e as Error).message });
      status.done();
    }
  })();

  return {
    status: status.value,
    result: result.value
  };
}

// --- COMPARISON HANDLER ---
// --- COMPARISON HANDLER (Multi-Item) ---
async function handleComparison(items: string[], status: any, result: any) {
    status.update(`Comparing ${items.length} products...`);
    
    interface ComparisonScoutResult {
        originalQuery: string;
        market: any;
        reddit: any;
        video: any;
        fullData?: any;
    }

    try {
        const scoutResults: ComparisonScoutResult[] = [];
        
        // 1. Check Cache for each item
        const itemsToFetch: { item: string, index: number }[] = [];
        const cachedResults: (any | null)[] = new Array(items.length).fill(null);

        for (let i = 0; i < items.length; i++) {
            const cached = await getCachedProduct(items[i]);
            if (cached) {
                cachedResults[i] = cached;
                status.update(`Found details for ${items[i]}`);
            } else {
                itemsToFetch.push({ item: items[i], index: i });
            }
        }

        // 2. Fetch missing items
        for (const { item } of itemsToFetch) {
             status.update(`Finding details for ${item}...`);
             const market = await marketScout(item);
             
             if (!market) {
                 throw new Error(`Unable to identify "${item}". Full analysis requires a verified product identity.`);
             }
             
             // Proceed with social and video scouts for verified products
             const reddit = await redditScout({ 
                 initialQuery: item, 
                 canonicalName: market.title, 
                 errors: [],
                 confidence: 100
             });
             
             const video = await videoScout({ 
                 initialQuery: item, 
                 canonicalName: market.title, 
                 marketData: market, 
                 errors: [],
                 confidence: 100
             });
             
             // Push to a temporary holding structure
             scoutResults.push({
                 originalQuery: item,
                 market,
                 reddit,
                 video
             });
        }
        
        status.update("Building comparison matrix...");

        // Construct Dynamic Prompt Context
        let promptProductContext = "";
        
        // Merge Cached and Fresh Data
        items.forEach((item, index) => {
            const cached = cachedResults[index];
            if (cached) {
                promptProductContext += `
                --- PRODUCT ${index + 1}: "${cached.productName}" (FROM CACHE) ---
                - Score: ${cached.score}
                - Verdict: ${cached.verdict}
                - Specs: ${JSON.stringify(cached.sources?.market?.specs || {})}
                \n`;
            } else {
                // Find the fresh scout result
                const fresh = scoutResults.find(s => s.originalQuery === item);
                if (fresh) {
                    promptProductContext += `
                    --- PRODUCT ${index + 1}: "${fresh.market?.title || fresh.originalQuery}" ---
                    - Detected Price: ${fresh.market?.price || 'Unknown'}
                    - Specs: ${JSON.stringify(fresh.market?.specs || {})}
                    - Sentiment: ${JSON.stringify(fresh.reddit?.sentimentCount || {})}
                    - Key Reddit Comments: ${JSON.stringify((fresh.reddit?.comments || []).slice(0,3))}
                    \n`;
                }
            }
        });

        // Generate Dynamic Schema based on N items
        const schemaProductPlaceholders = items.map((_, i) => `
                  { 
                    "id": "p${i+1}", 
                    "name": "Product ${i+1} Name", 
                    "score": 0, 
                    "isWinner": boolean,
                    "recommendation": "BUY" | "CONSIDER" | "AVOID",
                    "verdictType": "positive" | "caution" | "alert",
                    "verdict": "string",
                    "details": {
                        "trustScore": { "score": 0, "label": "string" },
                        "sentiment": { "positive": 0, "neutral": 0, "negative": 0 },
                        "pros": ["string"],
                        "cons": ["string"]
                    }
                  }`).join(',');

        const prompt = `
            COMPARE THESE ${items.length} PRODUCTS HEAD-TO-HEAD:
            
            ${promptProductContext}

            TASK:
            Create a "Versus Arena" comparison dataset for ALL ${items.length} PRODUCTS.
            
            1. Assign a "Trust Score" (0-10) for each.
            2. Determine a SINGLE WINNER (The "Top Choice").
            3. Provide a short "Win Reason".
            4. Assign a "Recommendation" (BUY, CONSIDER, or AVOID).
            5. Assign a "Verdict Type" (positive, caution, or alert).
            6. Write a "Verdict" summary (2 sentences) explaining the recommendation.
            7. Compare them across 3-4 distinct categories (e.g. Build Quality, Performance, Value). Scores 0-10.
            
            Response JSON Schema:
            {
               "type": "comparison",
               "title": "${items.join(' vs ')}",
               "winReason": string,
               "products": [
                  ${schemaProductPlaceholders}
               ],
               "differences": [
                  { "category": string, "scores": { "p1": number, "p2": number, ${items.map((_, i) => `"p${i+1}": number`).join(', ')} } }
               ]
            }
        `;

        const aiResult = await geminiFlash.generateContent({
             contents: [{ role: "user", parts: [{ text: prompt }] }],
             generationConfig: { responseMimeType: "application/json" }
        });

        let json = JSON.parse(aiResult.response.text());
        
        // Ensure ID consistency and Inject Sources
        if (json.products && Array.isArray(json.products)) {
             json.products.forEach((p: any, i: number) => {
                 p.id = `p${i+1}`; // Enforce IDs p1, p2, p3... match the index order
                 
                 const cached = cachedResults[i];
                 const fresh = scoutResults.find(s => s.originalQuery === items[i]);

                 if (cached) {
                     p.sources = cached.sources;
                 } else if (fresh) {
                     p.sources = {
                         market: fresh.market,
                         reddit: fresh.reddit,
                         video: fresh.video?.map((v: any) => ({
                             ...v,
                             videoId: v.id // Map 'id' to 'videoId' for frontend compatibility
                         }))
                     };
                 }
             });
        }

        result.done(json);
        status.done("Complete");

    } catch (e: any) {
        console.error("Comparison Failed", e);

        // Explicitly handle Rate Limit (429) to show UI error instead of fallback
        if (e.message?.includes('429') || e.status === 429) {
            result.done({ 
                error: "System Overload (Rate Limit 429). Please try again in 30 seconds.", 
                isError: true 
            });
            status.done("System Error");
            return;
        }

        // PRODUCTION: Return strict error
         result.done({
             error: "Comparison failed. Unable to verify product data.",
             isError: true
         });
         status.done("System Error");
    }
}

// --- SECURITY HELPERS ---
function sanitizeInput(input: string): string {
  // Remove control characters and limit length to prevent injection attacks
  return input.replace(/[\x00-\x1F\x7F]/g, "").slice(0, 500);
}

// --- VISUAL ANALYSIS (HACKATHON) ---
export async function analyzeImage(formData: FormData) {
  try {
    const file = formData.get("image") as File;
    
    // 1. Security: File Validation
    if (!file) return { success: false, error: "No image file provided" };
    if (!file.type.startsWith("image/")) return { success: false, error: "Invalid file type. Only images are allowed." };
    if (file.size > 5 * 1024 * 1024) return { success: false, error: "File too large. Max 5MB." }; // Max 5MB

    // Convert to base64 for Gemini
    const arrayBuffer = await file.arrayBuffer();
    const imageData = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Analyze this image for product details.
      1. IDENTIFY the main product shown (Brand and Model Name).
      2. If it's a generic/dropshipping product, verify if it looks like a known "scam" or "low effort" listing.
      3. Return ONLY a JSON object:
      {
        "productName": "string",
        "isScamLikely": boolean,
        "scamReason": "string (optional)"
      }
    `;

    const result = await geminiFlash.generateContent([
      {
        inlineData: {
          data: imageData,
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Extract JSON
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1) throw new Error("Could not parse visual analysis");
    
    const json = JSON.parse(text.substring(start, end + 1));
    
    // SOTA: Visual Match with Cache
    // Try to find if we've already analyzed this product textually
    const cached = await getCachedProduct(json.productName);
    if (cached) {
         return {
             success: true,
             data: {
                 ...json,
                 cachedAnalysis: cached // Pass this back so frontend can show "Deep Analysis Available"
             }
         };
    }

    // HACKATHON: Skipped pushing visual scan to Supabase to prevent duplicates.
    // The actual "Judge" analysis (analyzeProduct) triggered by the frontend will handle the trusted DB insert.

    return {
      success: true,
      data: json,
    };
  } catch (error: any) {
    console.error("Gemini Vision Analysis Error:", error);

    // RATE LIMIT (429) FALL BACK - PRODUCTION Strict Mode
    if (error.message?.includes('429') || error.message?.includes('Quota exceeded') || error.status === 429) {
         return {
             success: false,
             error: "Visual Analysis unavailable (Rate Limit). Please try again later."
         };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Visual Analysis Failed",
    };
  }
}
