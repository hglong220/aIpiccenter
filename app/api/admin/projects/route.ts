/**
 * API: Admin Projects
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

        const projects = await prisma.project.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        phone: true,
                    },
                },
                _count: {
                    select: {
                        files: true,
                        generations: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        })

        return NextResponse.json({
            success: true,
            data: { projects },
        })
    } catch (error) {
        console.error('获取项目列表错误:', error)
        return NextResponse.json(
            { success: false, error: '获取项目列表失败' },
            { status: 500 }
        )
    }
}
