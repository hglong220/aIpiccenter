/**
 * 重试工具函数
 * 用于文件处理等操作的自动重试机制
 */

export interface RetryOptions {
  maxRetries?: number
  retryDelay?: number // 毫秒
  exponentialBackoff?: boolean
  onRetry?: (attempt: number, error: Error) => void
}

/**
 * 重试函数执行
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    onRetry,
  } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // 最后一次尝试失败，抛出错误
      if (attempt === maxRetries) {
        throw lastError
      }

      // 调用重试回调
      onRetry?.(attempt + 1, lastError)

      // 计算延迟时间（指数退避）
      const delay = exponentialBackoff
        ? retryDelay * Math.pow(2, attempt)
        : retryDelay

      console.log(
        `[Retry] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms...`,
        lastError.message
      )

      // 等待后重试
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // 理论上不会到达这里
  throw lastError || new Error('Retry failed')
}

/**
 * 判断错误是否可重试
 */
export function isRetryableError(error: Error): boolean {
  // 网络错误
  if (error.message.includes('ECONNRESET') || 
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('ENOTFOUND')) {
    return true
  }

  // 5xx 服务器错误
  if (error.message.includes('500') || 
      error.message.includes('502') ||
      error.message.includes('503') ||
      error.message.includes('504')) {
    return true
  }

  // 429 限流错误
  if (error.message.includes('429')) {
    return true
  }

  // 其他错误默认不可重试
  return false
}

/**
 * 带条件判断的重试
 */
export async function retryIf<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: Error) => boolean,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    onRetry,
  } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // 检查是否应该重试
      if (!shouldRetry(lastError)) {
        throw lastError
      }

      // 最后一次尝试失败，抛出错误
      if (attempt === maxRetries) {
        throw lastError
      }

      // 调用重试回调
      onRetry?.(attempt + 1, lastError)

      // 计算延迟时间
      const delay = exponentialBackoff
        ? retryDelay * Math.pow(2, attempt)
        : retryDelay

      console.log(
        `[Retry] Attempt ${attempt + 1}/${maxRetries} failed (retryable), retrying in ${delay}ms...`,
        lastError.message
      )

      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Retry failed')
}

