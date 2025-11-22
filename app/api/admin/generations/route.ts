/**
 * API: Admin Generations
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

        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const where: any = {}
        if (type && type !== 'all') where.type = type
        if (status && status !== 'all') where.status = status

        const [generations, total] = await Promise.all([
            prisma.generation.findMany({
                where,
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
                skip,
                take: limit,
            }),
            prisma.generation.count({ where }),
        ])

        return NextResponse.json({
            success: true,
            data: {
                generations,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        })
    } catch (error) {
        console.error('获取生成记录错误:', error)
        return NextResponse.json(
            { success: false, error: '获取生成记录失败' },
            { status: 500 }
        )
    }
}
