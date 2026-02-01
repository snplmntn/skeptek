
/**
 * zero-trust link verification utility.
 * prevents hallucinations by confirming urls exist before returning them.
 * 
 * strategies:
 * 1. youtube: uses oembed endpoint (definitive check for video existence).
 * 2. reddit: uses .json endpoint (definitive check for thread existence).
 * 3. general: uses head request.
 */

export async function checkLinkValidity(url: string | undefined): Promise<boolean> {
    if (!url) return false;
    
    // quick regex validation first
    if (!/^(https?:\/\/)/i.test(url)) return false;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout

    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();

        // ---------------------------------------------------------
        // strategy 1: youtube (oembed - fast & reliable)
        // ---------------------------------------------------------
        if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
            const response = await fetch(oembedUrl, { signal: controller.signal });
            clearTimeout(timeout);
            return response.ok; 
        }

        // ---------------------------------------------------------
        // strategy 2: python backend (reliable)
        // ---------------------------------------------------------
        try {
             // console.log(`[linkverifier] 🐍 verifying via python: ${url}`);
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
                 
                 if (data.reason && data.reason.includes("404")) return false;
             }
        } catch (pyErr) {
        }

        // ---------------------------------------------------------
        // strategy 3: reddit (.json check - legacy fallback)
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
                
                // strict mode
                // we do not accept 403/429 as "valid" anymore because it masks hallucinations.
                // if node fetch is blocked, we must rely on strategy 2 (python/selenium).
                // if python failed earlier, we accept that we cannot verify this link.
                return false;
        }

        // ---------------------------------------------------------
        // strategy 4: general fallback (head)
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
            // retry with get range
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
 * validates a list of items with url property in parallel.
 * limits concurrency to avoid flooding.
 */
export async function filterValidLinks<T extends { url: string }>(items: T[]): Promise<T[]> {
    if (!items || items.length === 0) return [];

    // process in batches of 5 to respect rate limits
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
