export interface VideoData {
  id: string; // YouTube ID
  title: string;
  url: string;
  thumbnail: string;
  moment: string; // e.g., "02:45"
  tag: string; // e.g., "✅ Confirmed"
  tagType: 'success' | 'warning' | 'alert';
  transcript?: string; // transcription-derived text
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
  launchDate?: string; // track product age
  supersededBy?: string; // track newer alternatives
  msrp?: string; // original launch price
  competitorPriceRange?: string; // market context
  isRateLimited?: boolean; // flag if data fetch was throttled
}

export interface RedditData {
  threadTitle: string;
  comments: string[]; // Raw text of top comments
  sentimentCount: {
    positive: number;
    negative: number;
    neutral: number;
  },
  sources?: { title: string; url: string; snippet?: string }[];
  botProbability?: number;
  searchSuggestions?: string[];
  authenticityFlags?: string[];
}

/**
 * Used to pass context between agents in the DAG.
 */
export interface AgentState {
    initialQuery: string;
    canonicalName?: string; // The verified product name found by Market Scout
    // standard metadata | null;
    socialData?: RedditData | null;
    videoData?: VideoData[];
    errors: string[];
    confidence: number; // 0-100 score of data integrity
}
