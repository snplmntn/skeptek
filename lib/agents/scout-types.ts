export interface VideoData {
  id: string; // YouTube ID
  title: string;
  url: string;
  thumbnail: string;
  moment: string; // e.g., "02:45"
  tag: string; // e.g., "✅ Confirmed"
  tagType: 'success' | 'warning' | 'alert';
  transcript?: string; // SOTA 2026: Transcription-derived text
}

export interface ScoutResult {
  source: 'google' | 'reddit' | 'youtube';
  data: any; // Flexible to accommodate different scraper outputs
  confidence: number;
}

export interface MarketData {
  title: string;
  price: string;
  specs: Record<string, string>;
  imageUrl?: string;
  productUrl: string;
}

export interface RedditData {
  threadTitle: string;
  comments: string[]; // Raw text of top comments
  sentimentCount: {
    positive: number;
    negative: number;
    neutral: number;
  },
  sources?: { title: string; url: string }[];
  botProbability?: number;
  authenticityFlags?: string[];
}

/**
 * SOTA 2026: Hive Mind Shared State
 * Used to pass context between agents in the DAG.
 */
export interface AgentState {
    initialQuery: string;
    canonicalName?: string; // The verified product name found by Market Scout
    marketData?: MarketData | null;
    socialData?: RedditData | null;
    videoData?: VideoData[];
    errors: string[];
}
