/**
 * Redis Client with Connection Pooling
 * 
 * Singleton pattern for Redis client to avoid multiple instances
 * Supports connection pooling and graceful shutdown
 */

import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

function createRedisClient(): Redis {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000)
      return delay
    },
    reconnectOnError: (err) => {
      const targetError = 'READONLY'
      if (err.message.includes(targetError)) {
        // Only reconnect when the error contains "READONLY"
        return true
      }
      return false
    },
  })

  client.on('error', (err) => {
    console.error('Redis Client Error:', err)
  })

  client.on('connect', () => {
    console.log('Redis Client Connected')
  })

  client.on('ready', () => {
    console.log('Redis Client Ready')
  })

  return client
}

export const redis =
  globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
}

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    await redis.quit()
  })
}

// Health check helper
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const result = await redis.ping()
    return result === 'PONG'
  } catch (error) {
    console.error('Redis health check failed:', error)
    return false
  }
}

