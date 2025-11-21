/**
 * 限流系统
 * 支持IP限流、用户级限流
 */

import { LRUCache } from 'lru-cache'

interface RateLimitConfig {
  windowMs: number // 时间窗口（毫秒）
  maxRequests: number // 最大请求数
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: Date
  retryAfter?: number // 秒
}

// IP限流缓存
const ipLimiter = new LRUCache<string, { count: number; resetTime: number }>({
  max: 10000,
  ttl: 60 * 1000, // 1分钟TTL
})

// 用户限流缓存
const userLimiter = new LRUCache<string, { count: number; resetTime: number }>({
  max: 10000,
  ttl: 60 * 1000,
})

/**
 * IP限流
 */
export function checkIPRateLimit(
  ip: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 100 }
): RateLimitResult {
  const now = Date.now()
  const key = `ip:${ip}`
  
  const record = ipLimiter.get(key)
  
  if (!record || now > record.resetTime) {
    // 创建新记录
    const newRecord = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    ipLimiter.set(key, newRecord)
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: new Date(newRecord.resetTime),
    }
  }
  
  // 检查是否超过限制
  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(record.resetTime),
      retryAfter,
    }
  }
  
  // 增加计数
  record.count++
  ipLimiter.set(key, record)
  
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: new Date(record.resetTime),
  }
}

/**
 * 用户限流
 */
export function checkUserRateLimit(
  userId: string,
  config: RateLimitConfig = { windowMs: 60000, maxRequests: 200 }
): RateLimitResult {
  const now = Date.now()
  const key = `user:${userId}`
  
  const record = userLimiter.get(key)
  
  if (!record || now > record.resetTime) {
    const newRecord = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    userLimiter.set(key, newRecord)
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: new Date(newRecord.resetTime),
    }
  }
  
  if (record.count >= config.maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000)
    return {
      allowed: false,
      remaining: 0,
      resetTime: new Date(record.resetTime),
      retryAfter,
    }
  }
  
  record.count++
  userLimiter.set(key, record)
  
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: new Date(record.resetTime),
  }
}

/**
 * 获取客户端IP
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

/**
 * 限流中间件
 */
export function rateLimitMiddleware(
  request: Request,
  userId?: string,
  ipConfig?: RateLimitConfig,
  userConfig?: RateLimitConfig
): { allowed: boolean; error?: string; retryAfter?: number } {
  const ip = getClientIP(request)
  
  // IP限流
  const ipResult = checkIPRateLimit(ip, ipConfig)
  if (!ipResult.allowed) {
    return {
      allowed: false,
      error: `IP请求过于频繁，请 ${ipResult.retryAfter} 秒后重试`,
      retryAfter: ipResult.retryAfter,
    }
  }
  
  // 用户限流
  if (userId) {
    const userResult = checkUserRateLimit(userId, userConfig)
    if (!userResult.allowed) {
      return {
        allowed: false,
        error: `请求过于频繁，请 ${userResult.retryAfter} 秒后重试`,
        retryAfter: userResult.retryAfter,
      }
    }
  }
  
  return { allowed: true }
}

