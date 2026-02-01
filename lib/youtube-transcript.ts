import * as cheerio from 'cheerio';

export interface TranscriptItem {
    text: string;
    duration: number;
    offset: number;
}

/**
 * fetches the transcript for a given youtube video id.
 * scraping-based approach to bypass api quotas.
 * now: returns structured data with timestamps for deep forensics.
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptItem[] | null> {
    // 1. try python microservice (reliable api wrapper)
    try {
        // console.log(`[youtube transcript] 🐍 calling python service for: ${videoId}`);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/transcript?video_id=${videoId}`, {
             signal: AbortSignal.timeout(10000) // 10s timeout
        });
        
        if (res.ok) {
            const data = await res.json();
            if (data.transcript && Array.isArray(data.transcript)) {
                // console.log(`[youtube transcript] ✅ python service returned ${data.transcript.length} lines.`);
                return data.transcript.map((t: any) => ({
                    text: t.text,
                    duration: (t.duration || 0) * 1000,
                    offset: (t.start || 0) * 1000
                }));
            }
        }
    } catch (e) {
        // console.warn(`[youtube transcript] python service unavailable/failed. falling back to node scraper.`);
    }

    try {
        // console.log(`[youtube transcript] 🌍 fetching transcript via node scraper for: ${videoId}`);
        
        // 2. fallback: fetch video page (legacy node scraper)
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

        // 2. extract ytinitialplayerresponse
        let playerResponse: any = null;
        $('script').each((i, el) => {
            const content = $(el).html() || '';
            if (content.includes('ytInitialPlayerResponse = ')) {
                const match = content.match(/ytInitialPlayerResponse = (\{.*?\});/);
                if (match) {
                    try {
                        playerResponse = JSON.parse(match[1]);
                    } catch (e) {
                        console.error("[youtube transcript] failed to parse player response json");
                    }
                }
            }
        });

        if (!playerResponse) {
            // alternative: check for var ytinitialplayerresponse
            const match = html.match(/var ytInitialPlayerResponse = (\{.*?\});/);
            if (match) {
                playerResponse = JSON.parse(match[1]);
            }
        }

        if (!playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
            console.warn(`[youtube transcript] no captions found for video: ${videoId}`);
            return null;
        }

        // 3. find english track (priority: manual > auto-generated)
        const tracks = playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;
        const englishTrack = tracks.find((t: any) => t.languageCode === 'en' && !t.kind) || 
                           tracks.find((t: any) => t.languageCode === 'en') ||
                           tracks[0];

        if (!englishTrack?.baseUrl) {
             return null;
        }

        // 4. fetch transcript data
        const transcriptResponse = await fetch(englishTrack.baseUrl + '&fmt=json3');
        if (!transcriptResponse.ok) {
            throw new Error("Failed to fetch transcript data");
        }

        const transcriptData = await transcriptResponse.json();
        
        // 5. parse into structured items
        if (!transcriptData.events) return null;

        const items: TranscriptItem[] = transcriptData.events
            .filter((e: any) => e.segs)
            .map((e: any) => ({
                text: e.segs.map((s: any) => s.utf8).join(' ').trim(),
                duration: e.dDurationMs || 0,
                offset: e.tStartMs || 0
            }))
            .filter((i: TranscriptItem) => i.text.length > 0);

        // console.log(`[youtube transcript] successfully fetched ${items.length} segments for ${videoId}`);
        return items;

    } catch (error) {
        console.error(`[youtube transcript] error for ${videoId}:`, error);
        return null;
    }
}
