export function getFriendlyErrorMessage(error: string): { title: string; message: string; isTechnical: boolean, originalError: string } {
  const err = (error || "").toLowerCase();
  
  // google generative ai errors
  if (err.includes('googlegenerativeai')) {
      return {
          title: "AI Service Busy",
          message: "The AI analysis service is currently experiencing high traffic or is unavailable. Please try again in a moment.",
          isTechnical: true,
          originalError: error
      };
  }

  // 403: usually quota or billing, or missing key. to a user, this is a "system" issue.
  if (err.includes('403') || err.includes('forbidden') || err.includes('api key')) {
    return {
      title: "Service Unavailable",
      message: "The analysis system is currently offline. Please try again later.",
      isTechnical: true,
      originalError: error
    };
  }
  
  // 429: rate limiting
  if (err.includes('429') || err.includes('quota') || err.includes('rate limit') || err.includes('resource exhausted')) {
    return {
      title: "High Demand",
      message: "We're experiencing a surge in searches right now. Please wait a moment and try again.",
      isTechnical: true, // it is technical, but temporary
      originalError: error
    };
  }
  
  // network / fetch
  if (err.includes('network') || err.includes('fetch') || err.includes('connection') || err.includes('upstream')) {
    return {
      title: "Connection Lost",
      message: "Please check your internet connection and try again.",
      isTechnical: true,
      originalError: error
    };
  }
  
  // safety / policy
  if (err.includes('safety') || err.includes('policy') || err.includes('blocked') || err.includes('harmful')) {
    return {
      title: "Analysis Skipped",
      message: "We couldn't process this image due to safety guidelines. Please try a different product image.",
      isTechnical: false, // not a technical glitch, but a policy enforcement
      originalError: error
    };
  }

  // fallback for generic empty data or unknowns
  if (err.includes('no data') || err.includes('insufficient')) {
     return {
        title: "No Clear Results",
        message: "We couldn't find enough verifiable reviews for this specific product to form a safe verdict.",
        isTechnical: false,
        originalError: error
     };
  }

  // default catch-all
  return {
    title: "Something Went Wrong",
    message: "An unexpected error occurred. Please try again.",
    isTechnical: true,
    originalError: error
  };
}
