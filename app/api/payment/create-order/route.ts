/**
 * API Route: Create Payment Order
 * 
 * POST /api/payment/create-order
 * Body: { planId: string, planName: string, amount: number, credits: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromHeader, verifyToken } from '@/lib/auth'
import { createUnifiedOrder } from '@/lib/wechat-pay'
import type { ApiResponse, CreateOrderRequest, Order } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const authHeader = request.headers.get('authorization')
    const token = getTokenFromHeader(authHeader)

    if (!token) {
      return NextResponse.json<ApiResponse<Order>>(
        {
          success: false,
          error: '未提供认证令牌',
        },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json<ApiResponse<Order>>(
        {
          success: false,
          error: '认证令牌无效或已过期',
        },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    })

    if (!user) {
      return NextResponse.json<ApiResponse<Order>>(
        {
          success: false,
          error: '用户不存在',
        },
        { status: 404 }
      )
    }

    // 解析请求体
    const body: CreateOrderRequest = await request.json()
    const { planId, planName, amount, credits } = body

    // 验证输入
    if (!planId || !planName || !amount || !credits) {
      return NextResponse.json<ApiResponse<Order>>(
        {
          success: false,
          error: '计划ID、计划名称、金额和信用点是必需的',
        },
        { status: 400 }
      )
    }

    if (amount <= 0 || credits <= 0) {
      return NextResponse.json<ApiResponse<Order>>(
        {
          success: false,
          error: '金额和信用点必须大于0',
        },
        { status: 400 }
      )
    }

    // 生成订单号
    const outTradeNo = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 创建订单
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        planId,
        planName,
        amount: Math.round(amount * 100), // 转换为分
        credits,
        paymentMethod: 'wechat',
        paymentStatus: 'pending',
        wechatOrderId: outTradeNo,
      },
    })

    // 获取客户端 IP
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1'

    // 调用微信支付统一下单（H5 支付）
    const payResult = await createUnifiedOrder({
      outTradeNo,
      body: `AI Pic Center - ${planName}`,
      totalFee: order.amount,
      spbillCreateIp: clientIp,
      tradeType: 'H5', // 使用 H5 支付
    })

    if (payResult.error) {
      // 更新订单状态为失败
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'failed' },
      })

      return NextResponse.json<ApiResponse<Order>>(
        {
          success: false,
          error: payResult.error,
        },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse<Order & { payUrl?: string }>>({
      success: true,
      data: {
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
        payUrl: payResult.mwebUrl, // H5 支付 URL
      },
      message: '订单创建成功',
    })
  } catch (error) {
    console.error('创建订单错误:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'

    return NextResponse.json<ApiResponse<Order>>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

