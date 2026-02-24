export interface RetryConfig {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  retryableStatusCodes: number[]
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function calculateBackoff(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number
): number {
  // Exponential backoff with jitter
  const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs)
  const jitter = delay * 0.1 * Math.random() // 10% jitter
  return Math.floor(delay + jitter)
}

export function isRetryable(
  statusCode: number | undefined,
  config: RetryConfig = DEFAULT_CONFIG
): boolean {
  if (!statusCode) return true // Network errors are retryable
  return config.retryableStatusCodes.includes(statusCode)
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Check if we should retry
      const statusCode = (error as { statusCode?: number }).statusCode
      if (!isRetryable(statusCode, finalConfig) || attempt === finalConfig.maxRetries) {
        throw lastError
      }

      const delay = calculateBackoff(attempt, finalConfig.baseDelayMs, finalConfig.maxDelayMs)
      console.warn(
        `Attempt ${attempt + 1} failed. Retrying in ${delay}ms... (${lastError.message})`
      )
      await sleep(delay)
    }
  }

  throw lastError ?? new Error('Max retries exceeded')
}
