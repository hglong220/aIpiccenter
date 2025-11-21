/**
 * API Route: WeChat Pay Notify
 * 
 * POST /api/payment/wechat/notify
 * 微信支付回调接口
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseNotifyXml, verifySign, generateNotifyResponse } from '@/lib/wechat-pay'

const WECHAT_PAY_API_KEY = process.env.WECHAT_PAY_API_KEY || ''

export async function POST(request: NextRequest) {
  try {
    // 读取 XML 数据
    const xml = await request.text()

    // 解析 XML
    const notifyData = await parseNotifyXml(xml)

    // 验证签名
    const sign = notifyData.sign
    const notifyDataForSign: Record<string, string> = {}
    for (const [key, value] of Object.entries(notifyData)) {
      if (key !== 'sign') {
        notifyDataForSign[key] = String(value)
      }
    }

    const isValid = verifySign(notifyDataForSign, sign, WECHAT_PAY_API_KEY)

    if (!isValid) {
      console.error('微信支付回调签名验证失败')
      return new NextResponse(generateNotifyResponse('FAIL', '签名验证失败'), {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
        },
      })
    }

    // 验证返回码
    if (notifyData.return_code !== 'SUCCESS') {
      console.error('微信支付回调返回码失败:', notifyData.return_msg)
      return new NextResponse(generateNotifyResponse('FAIL', notifyData.return_msg), {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
        },
      })
    }

    // 验证业务结果
    if (notifyData.result_code !== 'SUCCESS') {
      console.error('微信支付业务结果失败:', notifyData.err_code_des)
      return new NextResponse(generateNotifyResponse('FAIL', notifyData.err_code_des), {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
        },
      })
    }

    // 查找订单
    const order = await prisma.order.findFirst({
      where: {
        wechatOrderId: notifyData.out_trade_no,
      },
      include: {
        user: true,
      },
    })

    if (!order) {
      console.error('订单不存在:', notifyData.out_trade_no)
      return new NextResponse(generateNotifyResponse('FAIL', '订单不存在'), {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
        },
      })
    }

    // 检查订单是否已处理
    if (order.paymentStatus === 'paid') {
      return new NextResponse(generateNotifyResponse('SUCCESS'), {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
        },
      })
    }

    // 验证金额
    const totalFee = parseInt(notifyData.total_fee as string)
    if (order.amount !== totalFee) {
      console.error('订单金额不匹配:', order.amount, totalFee)
      return new NextResponse(generateNotifyResponse('FAIL', '订单金额不匹配'), {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
        },
      })
    }

    // 更新订单状态
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'paid',
        transactionId: notifyData.transaction_id as string,
        paidAt: new Date(),
      },
    })

    // 更新用户信用点和订阅计划
    await prisma.user.update({
      where: { id: order.userId },
      data: {
        credits: {
          increment: order.credits,
        },
        plan: order.planId,
        planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 天后到期
      },
    })

    // 返回成功响应
    return new NextResponse(generateNotifyResponse('SUCCESS'), {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    })
  } catch (error) {
    console.error('处理微信支付回调错误:', error)
    return new NextResponse(generateNotifyResponse('FAIL', '处理失败'), {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    })
  }
}

