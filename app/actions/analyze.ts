'use server';

import crypto from 'crypto';

import { createStreamableValue } from 'ai/rsc';
import { marketScout } from '@/lib/agents/market-scout';
import { redditScout } from '@/lib/agents/reddit-scout';
import { videoScout } from '@/lib/agents/video-scout';
import { reviewScout } from '@/lib/agents/review-scout';
import { geminiPro, geminiFlash } from '@/lib/gemini';
import { createClient } from '@/utils/supabase/server';
import { getCachedProduct, setCachedProduct, getFieldReports, normalizeQuery } from '@/lib/cache';
import { awardXP } from '@/app/actions/gamification';
import { JUDGE_SYSTEM_INSTRUCTION, JUDGE_SCHEMA } from '@/lib/prompts/judge-system';

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
        // hive mind orchestration (dag)

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
        
        // --- 0.5. cache check (optimization) ---
        // if in review mode, we skip cache to ensure we aren't loading old "simulated" data.
        // We want a fresh identity check for the reviewer.
        const isReviewMode = options?.isReviewMode;
        const shouldSkipCache = isReviewMode;
        
        const cachedData = !shouldSkipCache ? await getCachedProduct(query) : null;
        
        if (cachedData) {
             status.update("Restoring previous analysis...");
             await new Promise(r => setTimeout(r, 400)); // Slight delay for UX
             result.done(cachedData);
             status.done("Complete");
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

        // --- AGENTIC BRAIN EXECUTION (Phase 2) ---
        // Node 1: Market Scout (The Leader) - Establishes canonical identity
        status.update("Identifying product details...");
        const marketData = await marketScout(mainProductQuery);
      
      // ERROR HANDLING (Groundedness)
      const isBotBlocked = marketData?.title?.includes("Robot Check") || 
                           marketData?.title?.includes("Data Retrieval Error") ||
                           marketData?.title?.includes("Access Denied") ||
                           marketData?.title?.toLowerCase().includes("not found");

      if (!marketData || (marketData.isRateLimited && marketData.price === 'Unknown') || isBotBlocked || !marketData.title || marketData.title.length < 3) {
          const errorMsg = isBotBlocked
            ? "Access Denied (Bot Protection) or Product Not Found. Unable to verify identity."
            : marketData?.isRateLimited 
                ? "Market Scout Rate Limited (429). Forensics stalled." 
                : "Product not identified. Insufficient market ground-truth.";
          
          console.error(`[Brain] Critical Failure: ${errorMsg}`);
          status.update("Analysis Halted");
          result.done({ 
              isError: true, 
              error: errorMsg,
              isRateLimited: marketData?.isRateLimited,
              isBotBlocked: isBotBlocked 
          });
          status.done(isBotBlocked ? "Access Denied" : "Insufficient Data");
          return;
      }

      // Update State with Canonical Name
      const canonicalName = marketData?.title || mainProductQuery;
      console.log(`[Hive Mind] Canonical Name established: "${canonicalName}" (Original: "${query}")`);

      // ---------------------------------------------------------
      // canonical cache layer (layer 2)
      // We found the "Real Name". Check if we have analyzed this real name before.
      // ---------------------------------------------------------
      if (!isReviewMode) {
          const cachedCanonical = await getCachedProduct(canonicalName);
          if (cachedCanonical) {
              console.log(`[Cache] CANONICAL HIT found for "${canonicalName}"! Splicing into current session.`);
              
              // ALIASING: Save the user's "messy" query as an alias to this clean data
              // So next time "Macbook M1" hits Layer 1 instantly.
              setCachedProduct(query, cachedCanonical.productName, cachedCanonical.category, cachedCanonical, 'alias').catch(e => console.error("Alias Cache Failed", e));

              status.update("Restoring previous analysis (Canonical Match)...");
              await new Promise(r => setTimeout(r, 400));
              result.done(cachedCanonical);
              status.done("Complete");
              return;
          }
      }

      // Node 2 & 3: Agentic Scout Dispatch (The Followers)
      status.update("Agentically gathering evidence...");
      
      // Initialize Data Buckets
      let redditData: any = null;
      let videoData: any = null;
      let professionalReview: any = null;

      if (!isReviewMode) {
          // PHASE 2: "Brain + Muscle" Logic
          // 1. Trigger Social & Video Scouts (Parallel for speed, but theoretically can be sequential if we used Tools)
          const [reddit, video, review] = await Promise.all([
             redditScout({ initialQuery: mainProductQuery, canonicalName, marketData: marketData, errors: [], confidence: 100 }),
             videoScout({ initialQuery: mainProductQuery, canonicalName, marketData: marketData, errors: [], confidence: 100 }),
             !reviewScoutData ? reviewScout(canonicalName) : Promise.resolve(reviewScoutData)
          ]);
          redditData = reddit;
          videoData = video;
          professionalReview = review;

          // 2. Decide if "Deep Dive" is needed (If price unconfirmed)
          if (marketData.price === "Unknown" && marketData.productUrl) {
               status.update("Price unconfirmed. Engaging Python Deep Scout...");
               try {
                  // Call Python Microservice
                  const deepRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/tools/market_deep_dive`, {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ url: marketData.productUrl })
                  });
                  const deepData = await deepRes.json();
                  
                  if (deepData.status === 'success' && deepData.data.price !== 'Unknown') {
                      console.log(`[Brain] Deep Dive Fixed Price: ${deepData.data.price}`);
                      marketData.price = deepData.data.price; // Patch the market data
                  }
               } catch (err) {
                   console.warn("[Brain] Python Deep Scout failed/unavailable:", err);
               }
          }
      } else {
          // Review Mode: Skip external forensics
          status.update("Skipping external search (Review Mode active)...");
      }

      // Always check internal reports
      const fieldReports = await getFieldReports(canonicalName);

      console.log("--- [DEBUG] Market Scout Data ---");
      console.dir(marketData, { depth: null, colors: true });
      if (!isReviewMode) {
          console.log("--- [DEBUG] Reddit Scout Data ---");
          console.dir(redditData, { depth: null, colors: true });
          console.log("--- [DEBUG] Review Scout Data (Scraped URL) ---");
          console.dir(reviewScoutData, { depth: null, colors: true });
      }
      console.log("--- [DEBUG] Field Reports ---");
      console.log(`Found ${fieldReports.length} internal community reports`);

      // retry logic (before failing)
      // If we found NO Reddit or Video data, it might be a canonical name mismatch.
      // Retry ONCE with the raw initial query or a simplified version.
      if (!isReviewMode) {
          const hasRedditInitial = redditData && redditData.comments && redditData.comments.length > 0;
          const hasVideoInitial = videoData && videoData.length > 0;
          
          if (!hasRedditInitial && !hasVideoInitial) {
               console.warn("[Brain] ⚠️ No forensic data found on first pass. Attempting RETRY with simplified query...");
               status.update("Refining search strategy (Retry)...");
               
               // Fallback: Use the clean Market Title if available, otherwise the initial query.
               // This fixes issues where the initial query is a URL which fails in Reddit/Video search.
               const retryQuery = marketData?.title || mainProductQuery; 
               
               console.log(`[Brain] 🔄 Retrying with optimized query: "${retryQuery}"`);

               const [redditRetry, videoRetry] = await Promise.all([
                    redditScout({ initialQuery: retryQuery, canonicalName: retryQuery, marketData: marketData, errors: [], confidence: 100 }),
                    videoScout({ initialQuery: retryQuery, canonicalName: retryQuery, marketData: marketData, errors: [], confidence: 100 })
               ]);
               
               // Update if retry found something
               if (redditRetry && redditRetry.comments && redditRetry.comments.length > 0) {
                   console.log(`[Brain] ✅ Reddit Retry Successful: Found ${redditRetry.comments.length} threads.`);
                   redditData = redditRetry;
               }
               if (videoRetry && videoRetry.length > 0) {
                   console.log(`[Brain] ✅ Video Retry Successful: Found ${videoRetry.length} videos.`);
                   videoData = videoRetry;
               }
          }
      }

      // error handling (zero-tolerance policy)
      const hasReddit = redditData && redditData.comments && redditData.comments.length > 0;
      const hasVideo = videoData && videoData.length > 0;
      const hasReview = professionalReview && professionalReview.summary;
  
      // safeguard: abort if no independent data found.
      // We assume 'reviewScoutData' (URL scrape) is NOT an independent review.
      if (!isReviewMode && !hasReddit && !hasVideo && (!hasReview || !!reviewScoutData)) {
          console.error("[Brain] 🚨 Safeguard Triggered: No valid forensic data found.");
          status.update("Analyses Aborted: Insufficient Evidence.");
          result.done({ 
              isError: true, 
              error: "Safeguard: No verified community discussions or video evidence found for this specific query. Verdict generation halted to maintain zero-hallucination standards.",
              insufficientData: true 
          });
          status.done("No Evidence Found");
          return;
      }
      
      status.update("Analyzing forensic data...");
      
      // 2. The Synthesis (Fan-In) - System Instruction Mode
      
      // parse price for fairness check
      let numericPrice = 0;
      if (marketData && marketData.price) {
          const match = marketData.price.match(/[\d,.]+/);
          if (match) {
             numericPrice = parseFloat(match[0].replace(/,/g, ''));
          }
      }

      const userContext = `
        PRODUCT QUERY: "${canonicalName}"
        
        [Market Data]
        ${JSON.stringify(marketData || "No market data found")}
        DETECTED_NUMERIC_PRICE (Use this for 'currentPrice'): ${numericPrice > 0 ? numericPrice : "Unknown"}
        
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

        [CONTEXTUAL METADATA]
        - Current Date: January 29, 2026
        - Reddit Bot Prob: ${redditData?.botProbability || 0}%
        - Internal Reports: ${fieldReports.length}
        - Review Mode: ${isReviewMode}
      `;

      console.log("--- [DEBUG] Gemini Brain Prompt (System Instruction Mode) ---");

      console.log("--- [DEBUG] Gemini Brain Prompt ---");
      // console.log(prompt); // Reduced log noise

      status.update("Finalizing verdict...");
      
      let finalJson;
      try {
        const model = geminiFlash; 
        
        // use native json mode (structured output)
        // Now with enhanced Audio Analysis
        // use native json mode (structured output) + system instruction
        const aiResult = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: userContext }] }],
          config: {
            systemInstruction: JUDGE_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseSchema: JUDGE_SCHEMA
          }
        });
        const text = aiResult.text || "";
        
        // Robust JSON extraction
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start === -1 || end === -1) throw new Error("No JSON found in response");
        const jsonStr = text.substring(start, end + 1);
        
        finalJson = JSON.parse(jsonStr);

        // [CRITICAL] Override AI-hallucinated URL with the REAL market URL
        if (finalJson.priceAnalysis) {
             const isUrlInput = query.startsWith('http://') || query.startsWith('https://');
             
             if (isUrlInput) {
                  // If user provided a link, ALWAYS use it (even if we had to verify details externally)
                  console.log(`[Judge] Preserving User Input URL: ${query}`);
                  finalJson.priceAnalysis.sourceUrl = query;
             } else if (marketData && marketData.productUrl) {
                  console.log(`[Judge] Injecting real market URL: ${marketData.productUrl}`);
                  finalJson.priceAnalysis.sourceUrl = marketData.productUrl;
             }
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
      
      // Data Sufficiency Check (Shared for Cache & DB)
      // Only save if we have REAL forensic data (Reddit comments or Videos)
      const hasForensicData = ((redditData?.comments?.length ?? 0) > 0) || ((videoData?.length ?? 0) > 0);

      // save to cache (async, non-blocking) - if sufficient data
      if (!fullReport.isSimulated && hasForensicData && !fullReport.isError) {
           setCachedProduct(query, fullReport.productName, fullReport.category, fullReport).catch(err => console.error("Cache Write Failed", err));
      } else {
           console.log(`[Cache] Skipped saving: Insufficient Data/Simulated`);
      }

      // GAMIFICATION: Award XP for Analysis
      awardXP(25, supabase).catch(err => console.error("XP Award Failed", err));

    // HACKATHON: Push to Supabase Realtime Feed
      try {
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

        // 2. Fetch missing items (Parallel Execution)
        if (itemsToFetch.length > 0) {
            status.update(`Accessing Market Data...`);
            
            const parallelResults = await Promise.allSettled(itemsToFetch.map(async ({ item }) => {
                 try {
                     const market = await marketScout(item);
                     
                     if (!market) {
                         console.warn(`[Comparison] Market Scout failed for ${item}`);
                         return null;
                     }
                     
                     // Parallel Sub-Agents
                     const [reddit, video] = await Promise.all([
                         redditScout({ 
                             initialQuery: item, 
                             canonicalName: market.title, 
                             errors: [],
                             confidence: 100
                         }),
                         videoScout({ 
                             initialQuery: item, 
                             canonicalName: market.title, 
                             marketData: market, 
                             errors: [],
                             confidence: 100
                         })
                     ]);
                     
                     return {
                         originalQuery: item,
                         market,
                         reddit,
                         video
                     } as ComparisonScoutResult;
                 } catch (err) {
                     console.error(`[Comparison] Failed to auto-scout ${item}`, err);
                     return null;
                 }
            }));

            // Collect successful results
            parallelResults.forEach(res => {
                if (res.status === 'fulfilled' && res.value) {
                    scoutResults.push(res.value);
                }
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
                    "price": "string", 
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
            
            CRITICAL CONSISTENCY RULES:
            - IF Trust Score >= 9.0 THEN Recommdendation MUST be 'BUY'.
            - IF Trust Score < 6.0 THEN Recommdendation MUST be 'AVOID'.
            - IF isWinner is TRUE THEN Recommendation MUST be 'BUY' (unless there is a fatal flaw).
            - Do NOT give a "CONSIDER" rating to a product with a score > 8.5.
            
            IMPORTANT: PRICE FORMATTING (Few-Shot Examples)
            You MUST keep the 'price' field extremely short (under 15 chars) to fit the UI card.
            - Bad: "$450 - $649 USD (Refurbished only)"
            - Good: "$450 - $649"
            - Bad: "approx. $1200 depending on storage"
            - Good: "~$1200"
            - Bad: "Discontinued (Used: $300)"
            - Good: "Used: ~$300"
            
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

        const text = aiResult.text || "";
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        
        if (start === -1 || end === -1) {
            throw new Error("No JSON found in comparison response: " + text.substring(0, 100));
        }

        const jsonStr = text.substring(start, end + 1);
        let json = JSON.parse(jsonStr);
        
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
        
        // cache the comparison result
        const comparisonKey = items.sort().join(','); // Normalized key: "a,b"
        setCachedProduct(comparisonKey, json.title, "Comparison", json, 'compare').catch(e => console.error("Failed to cache comparison", e));

        // cache warming (extract individual products from the comparison json)
        // The comparison JSON has `products: [{ name, score, verdict, ... }]`
        // We can save these as valid "individual" cache entries!
        if (json.products && Array.isArray(json.products)) {
             json.products.forEach((p: any) => {
                 // We need to map the Comparison Product Schema to the Standard Product Schema
                 // distinct schemas (Judge vs Comparison).
                 // Standard Schema has: { productName, score, verdict, priceAnalysis, ... }
                 // Comparison Schema has: { name, score, verdict, details... }
                 // They are close enough to be useful!
                 
                 // Parse Price if available
                 let numericPrice = 0;
                 if (p.price) {
                      const match = p.price.toString().match(/[\d,.]+/);
                      if (match) numericPrice = parseFloat(match[0].replace(/,/g, ''));
                 }

                 const warmPayload = {
                     productName: p.name,
                     score: p.score,
                     verdict: p.verdict,
                     category: "comparison-derived",
                     priceAnalysis: {
                         currentPrice: numericPrice,
                         currency: "$", // Assumption for now
                         priceStatus: "Normal"
                     },
                     // Map other fields as best as possible
                     pros: p.details?.pros || [],
                     cons: p.details?.cons || [],
                     sources: p.sources // We injected this earlier!
                 };
                 
                 // Save to cache using the Product Name
                 // Use type='canonical' to indicate it came from a high-trust comparison
                 setCachedProduct(p.name, p.name, "comparison-derived", warmPayload, 'canonical').catch(e => console.error("Cache Warming Failed", e));
                 console.log(`[Hive Mind] Warmed cache for "${p.name}"`);
             });
        }

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
    const buffer = Buffer.from(arrayBuffer);
    
    // 1.5 check visual cache
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    const cacheKey = `visual:${hash}`;
    
    // Check Cache
    const cachedVisual = await getCachedProduct(cacheKey);
    if (cachedVisual) {
         console.log(`[Visual] Cache HIT for hash ${hash}`);
         return {
             success: true,
             data: cachedVisual
         };
    }

    const imageData = buffer.toString("base64");

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

    const text = result.text || "";
    
    // Extract JSON
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1) throw new Error("Could not parse visual analysis");
    
    const json = JSON.parse(text.substring(start, end + 1));
    
    // visual match with cache
    // Try to find if we've already analyzed this product textually
    const cached = await getCachedProduct(json.productName);
    
    const finalData = {
         ...json,
         cachedAnalysis: cached // Pass this back so frontend can show "Deep Analysis Available"
    };

    // save to visual cache
    // We save the RESULT of the image analysis, keyed by the image hash.
    setCachedProduct(cacheKey, json.productName, "visual-scan", finalData, 'visual').catch(e => console.error("Visual Cache Failed", e));
    
    // warm the text cache?
    // If the image analysis was high confidence ("AirPods Pro"), users might search for it.
    // But the payload here is thin ({productName, isScamLikely}). 
    // It's not the full "Judge" report. So we probably SHOULDN'T overwrite the main text cache 
    // with this thin data, UNLESS we want to store it as a "stub".
    // Decision: Only cache the Visual Result (Hash -> Name) for now, as per plan "Visual Scans -> Cache Key: Hash".
    // The "Side-Effect" in plan said: "Once... full analysis is complete... SAVE to text-based cache".
    // But here we only do the "Identity" step. We don't do the full analysis yet.
    // So we just cache the Identity.

    return {
      success: true,
      data: finalData, // Return the data
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
