/**
 * 系统监控API
 * GET /api/admin/monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRedisHealth } from '@/lib/redis'
import { checkDatabaseHealth } from '@/lib/prisma'
import { getErrorStats } from '@/lib/error-logger'
import os from 'os'

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json(
        { success: false, error: '未授权' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: '令牌无效' },
        { status: 401 }
      )
    }

    // 检查是否为管理员
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { plan: true },
    })

    if (!user || user.plan !== 'admin') {
      return NextResponse.json(
        { success: false, error: '权限不足' },
        { status: 403 }
      )
    }

    // 系统信息
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptime: process.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2),
      },
      cpu: {
        count: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown',
      },
    }

    // 数据库健康检查
    const dbHealthy = await checkDatabaseHealth()

    // Redis健康检查
    const redisHealthy = await checkRedisHealth()

    // 数据库统计
    const dbStats = {
      users: await prisma.user.count(),
      files: await prisma.file.count(),
      projects: await prisma.project.count(),
      generations: await prisma.generation.count(),
      aiTasks: await prisma.aITask.count({
        where: { status: { in: ['pending', 'running'] } },
      }),
    }

    // 错误统计
    const errorStats = await getErrorStats(7)

    // API使用统计（最近24小时）
    const last24h = new Date()
    last24h.setHours(last24h.getHours() - 24)

    const apiStats = {
      generations: await prisma.generation.count({
        where: { createdAt: { gte: last24h } },
      }),
      uploads: await prisma.file.count({
        where: { createdAt: { gte: last24h } },
      }),
      aiTasks: await prisma.aITask.count({
        where: { createdAt: { gte: last24h } },
      }),
    }

    return NextResponse.json({
      success: true,
      data: {
        system: systemInfo,
        health: {
          database: dbHealthy,
          redis: redisHealthy,
          overall: dbHealthy && redisHealthy,
        },
        database: dbStats,
        api: apiStats,
        errors: errorStats,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('获取监控数据失败:', error)
    return NextResponse.json(
      { success: false, error: '获取监控数据失败' },
      { status: 500 }
    )
  }
}

