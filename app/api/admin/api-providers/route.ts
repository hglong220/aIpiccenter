/**
 * API: Admin API Providers
 * 管理AI提供商
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

        const providers = await prisma.aIProvider.findMany({
            include: {
                _count: {
                    select: { apiKeys: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json({
            success: true,
            data: { providers },
        })
    } catch (error) {
        console.error('获取提供商列表错误:', error)
        return NextResponse.json(
            { success: false, error: '获取提供商列表失败' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
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

        const body = await request.json()
        const { name, type, displayName, description, config } = body

        if (!name || !type || !displayName) {
            return NextResponse.json(
                { success: false, error: '缺少必填字段' },
                { status: 400 }
            )
        }

        const provider = await prisma.aIProvider.create({
            data: {
                name,
                type,
                displayName,
                description,
                config: config ? JSON.stringify(config) : null,
            },
        })

        return NextResponse.json({
            success: true,
            data: { provider },
        })
    } catch (error: any) {
        console.error('创建提供商错误:', error)
        if (error.code === 'P2002') {
            return NextResponse.json(
                { success: false, error: '提供商名称已存在' },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { success: false, error: '创建提供商失败' },
            { status: 500 }
        )
    }
}
