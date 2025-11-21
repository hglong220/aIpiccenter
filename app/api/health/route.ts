/**
 * 健康检查API
 * GET /api/health
 */

import { NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/prisma'
import { checkRedisHealth } from '@/lib/redis'

export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error'; message?: string }> = {}
  let overallStatus = 'ok'

  // 数据库连接检查
  const dbHealthy = await checkDatabaseHealth()
  if (dbHealthy) {
    checks.database = { status: 'ok' }
  } else {
    checks.database = {
      status: 'error',
      message: 'Database connection failed',
    }
    overallStatus = 'error'
  }

  // Redis 连接检查
  const redisHealthy = await checkRedisHealth()
  if (redisHealthy) {
    checks.redis = { status: 'ok' }
  } else {
    checks.redis = {
      status: 'error',
      message: 'Redis connection failed',
    }
    overallStatus = 'error'
  }

  // 环境变量检查
  const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL', 'REDIS_URL']
  const missingEnvVars: string[] = []
  
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missingEnvVars.push(envVar)
    }
  })

  if (missingEnvVars.length > 0) {
    checks.environment = {
      status: 'error',
      message: `Missing environment variables: ${missingEnvVars.join(', ')}`,
    }
    overallStatus = 'error'
  } else {
    checks.environment = { status: 'ok' }
  }

  // 内存使用检查
  const memoryUsage = process.memoryUsage()
  const memoryUsageMB = {
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
  }

  checks.memory = {
    status: memoryUsageMB.heapUsed > 500 ? 'error' : 'ok',
    message: `Heap used: ${memoryUsageMB.heapUsed}MB / ${memoryUsageMB.heapTotal}MB`,
  }

  if (memoryUsageMB.heapUsed > 500) {
    overallStatus = 'error'
  }

  const statusCode = overallStatus === 'ok' ? 200 : 503

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
      memory: memoryUsageMB,
      uptime: process.uptime(),
    },
    { status: statusCode }
  )
}

