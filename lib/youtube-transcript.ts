import * as cheerio from 'cheerio';

export interface TranscriptItem {
    text: string;
    duration: number;
    offset: number;
}

/**
 * Fetches the transcript for a given YouTube video ID.
 * SOTA 2026: Scraping-based approach to bypass API quotas.
 * NOW: Returns structured data with timestamps for deep forensics.
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptItem[] | null> {
    // 1. SOTA 2026: Try Python Microservice (Reliable API Wrapper)
    try {
        console.log(`[YouTube Transcript] 🐍 Calling Python Service for: ${videoId}`);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/transcript?video_id=${videoId}`, {
             signal: AbortSignal.timeout(10000) // 10s timeout
        });
        
        if (res.ok) {
            const data = await res.json();
            if (data.transcript && Array.isArray(data.transcript)) {
                console.log(`[YouTube Transcript] ✅ Python Service returned ${data.transcript.length} lines.`);
                return data.transcript.map((t: any) => ({
                    text: t.text,
                    duration: (t.duration || 0) * 1000,
                    offset: (t.start || 0) * 1000
                }));
            }
        }
    } catch (e) {
        console.warn(`[YouTube Transcript] Python Service unavailable/failed. Falling back to Node scraper.`);
    }

    try {
        console.log(`[YouTube Transcript] 🌍 Fetching transcript via Node Scraper for: ${videoId}`);
        
        // 2. Fallback: Fetch Video Page (Legacy Node Scraper)
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const response = await fetch(videoUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch video page: ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // 2. Extract ytInitialPlayerResponse
        let playerResponse: any = null;
        $('script').each((i, el) => {
            const content = $(el).html() || '';
            if (content.includes('ytInitialPlayerResponse = ')) {
                const match = content.match(/ytInitialPlayerResponse = (\{.*?\});/);
                if (match) {
                    try {
                        playerResponse = JSON.parse(match[1]);
                    } catch (e) {
                        console.error("[YouTube Transcript] Failed to parse player response JSON");
                    }
                }
            }
        });

        if (!playerResponse) {
            // Alternative: check for var ytInitialPlayerResponse
            const match = html.match(/var ytInitialPlayerResponse = (\{.*?\});/);
            if (match) {
                playerResponse = JSON.parse(match[1]);
            }
        }

        if (!playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
            console.warn(`[YouTube Transcript] No captions found for video: ${videoId}`);
            return null;
        }

        // 3. Find English Track (priority: manual > auto-generated)
        const tracks = playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;
        const englishTrack = tracks.find((t: any) => t.languageCode === 'en' && !t.kind) || 
                           tracks.find((t: any) => t.languageCode === 'en') ||
                           tracks[0];

        if (!englishTrack?.baseUrl) {
             return null;
        }

        // 4. Fetch Transcript Data
        const transcriptResponse = await fetch(englishTrack.baseUrl + '&fmt=json3');
        if (!transcriptResponse.ok) {
            throw new Error("Failed to fetch transcript data");
        }

        const transcriptData = await transcriptResponse.json();
        
        // 5. Parse into Structured Items
        if (!transcriptData.events) return null;

        const items: TranscriptItem[] = transcriptData.events
            .filter((e: any) => e.segs)
            .map((e: any) => ({
                text: e.segs.map((s: any) => s.utf8).join(' ').trim(),
                duration: e.dDurationMs || 0,
                offset: e.tStartMs || 0
            }))
            .filter((i: TranscriptItem) => i.text.length > 0);

        console.log(`[YouTube Transcript] Successfully fetched ${items.length} segments for ${videoId}`);
        return items;

    } catch (error) {
        console.error(`[YouTube Transcript] Error for ${videoId}:`, error);
        return null;
    }
}
