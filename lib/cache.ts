/**
 * 统一缓存管理系统
 * 支持Redis和内存缓存
 */

// 动态导入Redis（可选依赖）
let redis: any = null
try {
  // 尝试导入redis模块
  const redisModule = require('./redis')
  redis = redisModule.redis
} catch (e) {
  // Redis不可用，使用内存缓存
  console.warn('[Cache] Redis not available, using memory cache only')
}

// 内存缓存（当Redis不可用时使用）
class MemoryCache {
  private cache = new Map<string, { data: any; expiry: number }>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // 每分钟清理一次过期缓存
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
  }

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return item.data as T
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    this.cache.set(key, {
      data: value,
      expiry: Date.now() + ttl * 1000
    })
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.cache.clear()
  }
}

// 全局内存缓存实例
const memoryCache = new MemoryCache()

/**
 * 通用缓存获取函数
 * @param key 缓存键
 * @param fetcher 数据获取函数
 * @param ttl 过期时间（秒），默认1小时
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600
): Promise<T> {
  try {
    // 优先使用Redis
    if (redis) {
      const cached = await redis.get(key)
      if (cached) {
        try {
          return JSON.parse(cached) as T
        } catch (e) {
          console.warn('[Cache] Failed to parse cached data:', e)
        }
      }
      
      // 缓存未命中，执行fetcher
      const data = await fetcher()
      
      // 异步写入缓存（不等待）
      redis.setex(key, ttl, JSON.stringify(data)).catch(err => {
        console.warn('[Cache] Failed to set cache:', err)
      })
      
      return data
    }
  } catch (e) {
    console.warn('[Cache] Redis error, fallback to memory cache:', e)
  }
  
  // Redis不可用，使用内存缓存
  const cached = await memoryCache.get<T>(key)
  if (cached !== null) {
    return cached
  }
  
  const data = await fetcher()
  await memoryCache.set(key, data, ttl)
  return data
}

/**
 * 删除缓存
 */
export async function deleteCache(key: string): Promise<void> {
  try {
    if (redis) {
      await redis.del(key)
    }
    await memoryCache.del(key)
  } catch (e) {
    console.warn('[Cache] Failed to delete cache:', e)
  }
}

/**
 * 批量删除缓存（支持通配符）
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    if (redis) {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    }
  } catch (e) {
    console.warn('[Cache] Failed to delete cache pattern:', e)
  }
}

/**
 * 缓存键生成器
 */
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  chatSession: (chatId: string) => `chat:${chatId}`,
  chatMessages: (chatId: string) => `chat:${chatId}:messages`,
  userCredits: (userId: string) => `credits:${userId}`,
  generations: (userId: string, page: number = 1) => `generations:${userId}:${page}`,
  orders: (userId: string, page: number = 1) => `orders:${userId}:${page}`,
  file: (fileId: string) => `file:${fileId}`,
  projectFiles: (projectId: string) => `project:${projectId}:files`,
}

