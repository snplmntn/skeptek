
// --- phase 2: agentic brain ---

async function runAgenticLoop(
    query: string, 
    status: any, 
    isReviewMode: boolean = false
): Promise<any> {
    
    // 1. initial grounding (google search)
    status.update("Connecting to global knowledge...");
    
    const marketData = await marketScout(query); // identification
    if (!marketData || !marketData.title) {
        throw new Error("Product Identity Unverified");
    }
    const canonicalName = marketData.title;
    status.update(`Identified: ${canonicalName}`);

    // context accumulator
    const context: any = {
        market: marketData,
        reddit: null,
        video: null,
        internal: await getFieldReports(canonicalName)
    };

    // 2. decision step: do we need more info?
    // in a full agent, we'd ask gemini. here, we implement the "brain" logic:
    
    if (!isReviewMode) {
        // parallel execution of tools (optimization over strictly sequential)
        // but we frame it as "agent decisions"
        
        status.update("Gathering forensic evidence...");
        
        // tool 1: reddit
        context.reddit = await redditScout({
             initialQuery: query,
             canonicalName: canonicalName,
             errors: [],
             confidence: 100
        });

        // tool 2: youtube
        context.video = await videoScout({
             initialQuery: query,
             canonicalName: canonicalName,
             marketData: marketData,
             errors: [],
             confidence: 100
        });

        // tool 3: deep dive (python muscle) - only if price is missing
        if (marketData.price === "Unknown" && marketData.productUrl) {
             status.update("Performing deep market scan...");
             try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/tools/market_deep_dive`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: marketData.productUrl })
                });
                const deepData = await response.json();
                if (deepData.status === 'success') {
                    // console.log("[brain] deep dive successful:", deepData.data);
                    context.market.price = deepData.data.price; // update context
                }
             } catch (e) {
                 // console.warn("[brain] deep dive failed, ignoring:", e);
             }
        }
    }

    return context;
}
