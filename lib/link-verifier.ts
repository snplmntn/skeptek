
/**
 * Zero-Trust Link Verification Utility.
 * SOTA 2026: Prevents hallucinations by confirming URLs exist before returning them.
 * 
 * STRATEGIES:
 * 1. YouTube: Uses oEmbed endpoint (Definitive check for video existence).
 * 2. Reddit: Uses .json endpoint (Definitive check for thread existence).
 * 3. General: Uses HEAD request.
 */

export async function checkLinkValidity(url: string | undefined): Promise<boolean> {
    if (!url) return false;
    
    // Quick Regex Validation first
    if (!/^(https?:\/\/)/i.test(url)) return false;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout

    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();

        // ---------------------------------------------------------
        // STRATEGY 1: YOUTUBE (oEmbed - FAST & RELIABLE)
        // ---------------------------------------------------------
        if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
            const response = await fetch(oembedUrl, { signal: controller.signal });
            clearTimeout(timeout);
            return response.ok; 
        }

        // ---------------------------------------------------------
        // STRATEGY 2: PYTHON BACKEND (SOTA 2026 - RELIABLE)
        // ---------------------------------------------------------
        try {
             // console.log(`[LinkVerifier] 🐍 Verifying via Python: ${url}`);
             const pyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/verify`, {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ url }),
                 signal: AbortSignal.timeout(15000) // 15s for Selenium to load
             });
             
             if (pyRes.ok) {
                 const data = await pyRes.json();
                 clearTimeout(timeout);
                 if (data.valid) return true;
                 
                 // If Python explicitly says "Invalid" (404), trust it.
                 if (data.reason && data.reason.includes("404")) return false;
             }
        } catch (pyErr) {
             // Backend down or timeout? Fallback to legacy checks.
             // console.warn("[LinkVerifier] Python verification failed, falling back.");
        }

        // ---------------------------------------------------------
        // STRATEGY 3: REDDIT (.json check - LEGACY FALLBACK)
        // ---------------------------------------------------------
        if (hostname.includes('reddit.com') && url.includes('/comments/')) {
                const jsonUrl = urlObj.pathname.endsWith('.json') 
                    ? url 
                    : `${urlObj.origin}${urlObj.pathname}.json${urlObj.search}`;
                
                const response = await fetch(jsonUrl, { 
                    method: 'GET',
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
                    signal: controller.signal 
                });
                
                clearTimeout(timeout);
                if (response.ok) return true;
                
                // SOTA 2026: Strict Mode
                // We DO NOT accept 403/429 as "Valid" anymore because it masks hallucinations.
                // If Node fetch is blocked, we must rely on Strategy 2 (Python/Selenium).
                // If Python failed earlier, we accept that we cannot verify this link.
                return false;
        }

        // ---------------------------------------------------------
        // STRATEGY 4: GENERAL FALLBACK (HEAD)
        // ---------------------------------------------------------
        try {
            const response = await fetch(url, {
                method: 'HEAD',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Skeptek/AI-Agent'
                },
                signal: controller.signal
            });
            clearTimeout(timeout);
            if (response.status === 404 || response.status === 410) return false;
            return true;
        } catch (headError) {
            if (controller.signal.aborted) throw headError;
            // Retry with GET Range
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Skeptek/AI-Agent',
                    'Range': 'bytes=0-10' 
                },
                signal: controller.signal
            });
            clearTimeout(timeout);
            return response.ok;
        }

    } catch (error) {
        clearTimeout(timeout);
        return false;
    }
}

/**
 * Validates a list of items with URL property in parallel.
 * Limits concurrency to avoid flooding.
 */
export async function filterValidLinks<T extends { url: string }>(items: T[]): Promise<T[]> {
    if (!items || items.length === 0) return [];

    // Process in batches of 5 to respect rate limits
    const BATCH_SIZE = 5;
    const validItems: T[] = [];

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(batch.map(async (item) => {
            const isValid = await checkLinkValidity(item.url);
            return isValid ? item : null;
        }));
        validItems.push(...results.filter((item) => item !== null) as T[]);
    }
    
    return validItems;
}
