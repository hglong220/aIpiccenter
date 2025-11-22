/**
 * API: Admin Feedback
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

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

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
        })

        if (!user || user.plan !== 'admin') {
            return NextResponse.json(
                { success: false, error: '权限不足' },
                { status: 403 }
            )
        }

        const feedbacks = await prisma.feedback.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        phone: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        })

        return NextResponse.json({
            success: true,
            data: { feedbacks },
        })
    } catch (error) {
        console.error('获取反馈列表错误:', error)
        return NextResponse.json(
            { success: false, error: '获取反馈列表失败' },
            { status: 500 }
        )
    }
}
