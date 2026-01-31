/**
 * SOTA 2026: Exponential Backoff Retry Logic
 * Implements resilient retry strategy for AI API calls with:
 * - Exponential backoff with jitter
 * - Retry-After header support
 * - Configurable retry conditions
 */

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryableStatuses?: number[];
  onRetry?: (attempt: number, delay: number, error: any) => void;
}

const DEFAULT_RETRYABLE_STATUSES = [429, 500, 502, 503, 504];

/**
 * Wraps an async function with exponential backoff retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    retryableStatuses = DEFAULT_RETRYABLE_STATUSES,
    onRetry
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Check if error is retryable
      const status = error.status || error.response?.status || error.code;
      const message = error.message || JSON.stringify(error);
      
      const isRateLimit = status === 429 || 
                          message.includes('429') || 
                          message.includes('Resource exhausted') ||
                          message.includes('Quota exceeded');

      const isRetryable = isRateLimit || (status && retryableStatuses.includes(status));
      
      if (!isRetryable) {
        throw error;
      }

      // Calculate delay
      let delay: number;
      
      // Honor Retry-After header if present
      const retryAfter = error.response?.headers?.['retry-after'];
      if (retryAfter) {
        delay = parseInt(retryAfter) * 1000;
      } else {
        // Exponential backoff: 2^attempt * baseDelay
        const exponentialDelay = baseDelay * Math.pow(2, attempt);
        // Add jitter (random 0-1000ms) to prevent thundering herd
        const jitter = Math.random() * 1000;
        delay = Math.min(exponentialDelay + jitter, maxDelay);
      }

      // Callback for logging/monitoring
      if (onRetry) {
        onRetry(attempt + 1, delay, error);
      }

      console.warn(
        `[Retry] Attempt ${attempt + 1}/${maxRetries} failed (${status}). ` +
        `Retrying in ${Math.round(delay)}ms...`
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(error: any): boolean {
  const status = error.status || error.response?.status;
  return status === 429;
}

/**
 * Check if an error is a server error (5xx)
 */
export function isServerError(error: any): boolean {
  const status = error.status || error.response?.status;
  return status >= 500 && status < 600;
}
