import * as cheerio from 'cheerio';

interface TranscriptItem {
    text: string;
    duration: number;
    offset: number;
}

/**
 * Fetches the transcript for a given YouTube video ID.
 * SOTA 2026: Scraping-based approach to bypass API quotas.
 */
export async function fetchTranscript(videoId: string): Promise<string> {
    try {
        console.log(`[YouTube Transcript] Fetching transcript for: ${videoId}`);
        
        // 1. Fetch Video Page
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
            return "";
        }

        // 3. Find English Track (priority: manual > auto-generated)
        const tracks = playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;
        const englishTrack = tracks.find((t: any) => t.languageCode === 'en' && !t.kind) || 
                           tracks.find((t: any) => t.languageCode === 'en') ||
                           tracks[0];

        if (!englishTrack?.baseUrl) {
             return "";
        }

        // 4. Fetch Transcript Data
        const transcriptResponse = await fetch(englishTrack.baseUrl + '&fmt=json3');
        if (!transcriptResponse.ok) {
            throw new Error("Failed to fetch transcript data");
        }

        const transcriptData = await transcriptResponse.json();
        
        // 5. Parse and Flatten
        if (!transcriptData.events) return "";

        const lines = transcriptData.events
            .filter((e: any) => e.segs)
            .map((e: any) => e.segs.map((s: any) => s.utf8).join(' '))
            .join(' ')
            .replace(/\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        console.log(`[YouTube Transcript] Successfully fetched ${lines.length} chars for ${videoId}`);
        return lines;

    } catch (error) {
        console.error(`[YouTube Transcript] Error for ${videoId}:`, error);
        return "";
    }
}
