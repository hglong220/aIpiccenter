/**
 * 统一错误处理系统
 * 提供友好的用户错误提示和诊断建议
 */

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public userMessage: string,
    public suggestion?: string,
    public retryable: boolean = false
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export interface ErrorResponse {
  error: string
  suggestion?: string
  code: number
  retryable: boolean
}

/**
 * 统一的API错误处理
 */
export function handleAPIError(error: unknown): ErrorResponse {
  // 自定义API错误
  if (error instanceof APIError) {
    return {
      error: error.userMessage,
      suggestion: error.suggestion,
      code: error.statusCode,
      retryable: error.retryable
    }
  }
  
  // 标准错误
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    // 连接拒绝
    if (message.includes('econnrefused') || message.includes('fetch failed')) {
      return {
        error: '无法连接到AI服务',
        suggestion: '请检查网络连接或稍后再试',
        code: 503,
        retryable: true
      }
    }
    
    // 超时
    if (message.includes('timeout') || message.includes('abort')) {
      return {
        error: '请求超时',
        suggestion: '请求时间过长，请尝试简化问题或稍后再试',
        code: 504,
        retryable: true
      }
    }
    
    // 配额限制
    if (message.includes('quota') || message.includes('rate limit')) {
      return {
        error: 'API使用配额已达上限',
        suggestion: '请稍后再试或联系管理员升级配额',
        code: 429,
        retryable: true
      }
    }
    
    // 认证错误
    if (message.includes('unauthorized') || message.includes('auth')) {
      return {
        error: '身份验证失败',
        suggestion: '请重新登录后重试',
        code: 401,
        retryable: false
      }
    }
    
    // API Key错误
    if (message.includes('api key') || message.includes('invalid key')) {
      return {
        error: 'API密钥配置错误',
        suggestion: '请联系管理员检查API密钥配置',
        code: 500,
        retryable: false
      }
    }
    
    // 内容违规
    if (message.includes('content policy') || message.includes('safety')) {
      return {
        error: '内容不符合安全策略',
        suggestion: '请修改您的输入内容后重试',
        code: 400,
        retryable: false
      }
    }
    
    // 余额不足
    if (message.includes('insufficient') || message.includes('credit')) {
      return {
        error: '信用点不足',
        suggestion: '请充值后继续使用',
        code: 402,
        retryable: false
      }
    }
  }
  
  // 默认错误
  return {
    error: '服务暂时不可用',
    suggestion: '我们正在处理这个问题，请稍后再试',
    code: 500,
    retryable: true
  }
}

/**
 * 日志记录（开发环境详细，生产环境简化）
 */
export function logError(
  context: string,
  error: unknown,
  metadata?: Record<string, any>
) {
  const isDev = process.env.NODE_ENV === 'development'
  
  if (isDev) {
    console.error(`[${context}] Error:`, error)
    if (metadata) {
      console.error(`[${context}] Metadata:`, metadata)
    }
    if (error instanceof Error && error.stack) {
      console.error(`[${context}] Stack:`, error.stack)
    }
  } else {
    // 生产环境：只记录关键信息
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[${context}] ${message}`)
  }
}

/**
 * 创建带有友好错误提示的API错误
 */
export function createAPIError(
  message: string,
  statusCode: number,
  userMessage: string,
  suggestion?: string,
  retryable: boolean = false
): APIError {
  return new APIError(message, statusCode, userMessage, suggestion, retryable)
}

