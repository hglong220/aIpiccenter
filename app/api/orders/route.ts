/**
 * API Route: Get User Orders
 * 
 * GET /api/orders
 * Headers: { Authorization: Bearer <token> }
 * Query: ?page=1&limit=10
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromHeader, verifyToken } from '@/lib/auth'
import type { ApiResponse, Order } from '@/types'

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json<ApiResponse<Order[]>>(
        {
          success: false,
          error: '未提供认证令牌',
        },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<Order[]>>(
        {
          success: false,
          error: '认证令牌无效或已过期',
        },
        { status: 401 }
      )
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // 查询订单
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          userId: decoded.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.order.count({
        where: {
          userId: decoded.id,
        },
      }),
    ])

    return NextResponse.json<ApiResponse<{
      orders: Order[]
      total: number
      page: number
      limit: number
      totalPages: number
    }>>({
      success: true,
      data: {
        orders: orders.map(order => ({
          id: order.id,
          userId: order.userId,
          planId: order.planId,
          planName: order.planName,
          amount: order.amount / 100, // 转换回元
          credits: order.credits,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          wechatOrderId: order.wechatOrderId || undefined,
          transactionId: order.transactionId || undefined,
          paidAt: order.paidAt?.toISOString(),
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('获取订单列表错误:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'

    return NextResponse.json<ApiResponse<Order[]>>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

