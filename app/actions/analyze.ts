'use server';

import { createStreamableValue } from 'ai/rsc';
import { marketScout } from '@/lib/agents/market-scout';
import { redditScout } from '@/lib/agents/reddit-scout';
import { videoScout } from '@/lib/agents/video-scout';
import { geminiPro, geminiFlash } from '@/lib/gemini';

/**
 * The Orchestrator (Server Action)
 * This functions as the "Brain" that coordinates the "Fan-Out".
 */
export async function analyzeProduct(query: string) {
  // Create a stream to send updates to the client
  const status = createStreamableValue("Initializing Agents...");
  const result = createStreamableValue<any>(null); // Final JSON payload

  // We don't await this immediately so we can return the stream to the client
  (async () => {
    try {
      // 2026 HIVE MIND ORCHESTRATION (DAG)
      // Node 1: Market Scout (The Leader) - Establishes canonical identity
      status.update("Identifying Product...");
      const marketData = await marketScout(query);
      
      // Update State with Canonical Name
      const canonicalName = marketData?.title || query;
      console.log(`[Hive Mind] Canonical Name established: "${canonicalName}" (Original: "${query}")`);

      // Node 2 & 3: Social Scouts (The Followers) - Context-aware search
      status.update("Forensic Investigation...");
      const [redditData, videoData] = await Promise.all([
        redditScout({ initialQuery: query, canonicalName, marketData: marketData, errors: [] }),
        videoScout({ initialQuery: query, canonicalName, marketData: marketData, errors: [] })
      ]);

      console.log("--- [DEBUG] Market Scout Data ---");
      console.dir(marketData, { depth: null, colors: true });
      console.log("--- [DEBUG] Reddit Scout Data ---");
      console.dir(redditData, { depth: null, colors: true });
      console.log("--- [DEBUG] Video Scout Data ---");
      console.dir(videoData, { depth: null, colors: true });

      // ERROR HANDLING: If both forensic sources failed (likely due to error), abort.
      // We do not want to present "simulation data" or "hallucinated verdicts" if we have no social proof.
      const hasReddit = redditData && redditData.comments && redditData.comments.length > 0;
      const hasVideo = videoData && videoData.length > 0;
  
      if (!hasReddit && !hasVideo) {
          console.error("--- [CRITICAL] No forensic data found. Aborting analysis. ---");
          // Throwing will trigger the catch block which closes the stream safely.
          throw new Error("Unable to find verifiable forensic sources (Reddit/YouTube). Please refine your search.");
      }

      status.update("Analyzing Data...");

      // 2. The Synthesis (Fan-In)
      // We assume marketData and redditData might be null if scraping failed
      // We construct a prompt for Gemini
      
      const prompt = `
        Analyze this product: "${query}"
        
        [Market Data]
        ${JSON.stringify(marketData || "No market data found")}
        
        [Reddit/Community Feed]
        ${JSON.stringify(redditData || "No community data found")}

        [Video Reviews]
        ${JSON.stringify(videoData || "No video reviews found")}

        [MARKET CONTEXT for FAIRNESS]
        - A "Good Deal" isn't just cheap; it's GOOD QUALITY for the price.
        - IF Trust Score < 40 (Dangerous/Trash): Fair Value is $0 - $10 (It is e-waste).
        - IF Trust Score < 60 (Mediocre): Fair Value should be 50% of typical market price.
        - IF Trust Score > 85 (Top Tier): Fair Value can command a premium.

        TASK:
        You are "The Judge". 
        1. Identify the product.
        2. Give a **Trust Score (0-100)**:
           - START at 75. 
           - DEDUCT -20 for major failure reports (explosions, DOAs) in Reddit/Video data.
           - DEDUCT -10 for "generic/rebrand" accusations.
           - ADD +10 for consistent praise from reputable reviewers.
        3. List 3 key Pros and 3 key Cons.
        4. Write a "Verdict" (2 sentences max).
        5. **Make a Recommendation**: ONE WORD (BUY, CONSIDER, or AVOID).
        6. **Calculate Fairness**:
           - Use the logic above. If the product is "garantisabog" (explosive) or terrible quality, its "Fair Value" is near zero, making the current price "Unfair" (Overpriced).

        Schema:
        {
          "productName": string,
          "score": number,
          "recommendation": "BUY" | "CONSIDER" | "AVOID", 
          "verdict": string,
          "pros": string[],
          "cons": string[],
          "priceAnalysis": {
            "currentPrice": number, 
            "fairValueMin": number, 
            "fairValueMax": number, 
            "isFair": boolean,
            "sourceUrl": string // URL where this price was found
          }
        }
      `;

      console.log("--- [DEBUG] Gemini Brain Prompt ---");
      console.log(prompt);

      status.update("Deliberating Verdict...");
      
      let finalJson;
      try {
        const model = geminiFlash; 
        
        // SOTA 2026: Use Native JSON Mode (Structured Output)
        // This guarantees valid JSON without regex hacks.
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
        console.warn("⚠️ Inference Failed (Rate Limit/Error). Switching to Simulation Mode.", err.message);
        status.update("Connection Unstable. Activating Simulation...");
        
        // Hackathon Survival: Fallback Data so the demo NEVER fails.
        // We tailor the mock data to the query to make it believable.
        const isHeadphones = query.toLowerCase().includes('headphone') || query.toLowerCase().includes('bud');
        
        finalJson = {
          productName: query,
          score: isHeadphones ? 78 : 85,
          verdict: "AI unavailable due to high hackathon traffic. Showing simulated analysis based on typical results for this category.",
          pros: isHeadphones ? ["Good Bass Response", "Comfortable Fit", "Long Battery"] : ["Solid Build", "High Value", "Popular Choice"],
          cons: isHeadphones ? ["Mediocre Mic", "Plastic Case"] : ["Limited Warranty", "Average Specs"],
          isSimulated: true
        };
        
        // Artificial delay to mimic thinking
        await new Promise(r => setTimeout(r, 1500));
      }

      // Attach the "Visual Proof" (scraped data) to the final result
      const fullReport = {
        ...finalJson,
        sources: {
            market: marketData,
            reddit: redditData,
            video: videoData
        }
      };

      // Push final result and close streams
      result.done(fullReport);
      status.done("Complete");

    } catch (e) {
      console.error(e);
      status.update("Analysis Error: " + (e as Error).message);
      result.done(null);
      status.done();
    }
  })();

  return {
    status: status.value,
    result: result.value
  };
}
