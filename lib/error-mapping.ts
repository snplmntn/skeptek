export function getFriendlyErrorMessage(error: string): { title: string; message: string; isTechnical: boolean, originalError: string } {
  const err = (error || "").toLowerCase();
  
  // Google Generative AI Errors
  if (err.includes('googlegenerativeai')) {
      return {
          title: "AI Service Busy",
          message: "The AI analysis service is currently experiencing high traffic or is unavailable. Please try again in a moment.",
          isTechnical: true,
          originalError: error
      };
  }

  // 403: Usually Quota or Billing, or Missing Key. To a user, this is a "System" issue.
  if (err.includes('403') || err.includes('forbidden') || err.includes('api key')) {
    return {
      title: "Service Unavailable",
      message: "The analysis system is currently offline. Please try again later.",
      isTechnical: true,
      originalError: error
    };
  }
  
  // 429: Rate Limiting
  if (err.includes('429') || err.includes('quota') || err.includes('rate limit') || err.includes('resource exhausted')) {
    return {
      title: "High Demand",
      message: "We're experiencing a surge in searches right now. Please wait a moment and try again.",
      isTechnical: true, // It is technical, but temporary
      originalError: error
    };
  }
  
  // Network / Fetch
  if (err.includes('network') || err.includes('fetch') || err.includes('connection') || err.includes('upstream')) {
    return {
      title: "Connection Lost",
      message: "Please check your internet connection and try again.",
      isTechnical: true,
      originalError: error
    };
  }
  
  // Safety / Policy
  if (err.includes('safety') || err.includes('policy') || err.includes('blocked') || err.includes('harmful')) {
    return {
      title: "Analysis Skipped",
      message: "We couldn't process this image due to safety guidelines. Please try a different product image.",
      isTechnical: false, // Not a technical glitch, but a policy enforcement
      originalError: error
    };
  }

  // Fallback for generic empty data or unknowns
  if (err.includes('no data') || err.includes('insufficient')) {
     return {
        title: "No Clear Results",
        message: "We couldn't find enough verifiable reviews for this specific product to form a safe verdict.",
        isTechnical: false,
        originalError: error
     };
  }

  // Default Catch-All
  return {
    title: "Something Went Wrong",
    message: "An unexpected error occurred. Please try again.",
    isTechnical: true,
    originalError: error
  };
}
