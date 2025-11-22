/**
 * API: Admin API Keys
 * 管理API密钥
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
        const providerId = searchParams.get('providerId')

        const where: any = {}
        if (providerId) {
            where.providerId = providerId
        }

        const keys = await prisma.aPIKey.findMany({
            where,
            include: {
                provider: {
                    select: {
                        id: true,
                        name: true,
                        displayName: true,
                    },
                },
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' },
            ],
        })

        // 隐藏完整的API密钥，只显示部分
        const maskedKeys = keys.map((key) => ({
            ...key,
            apiKey: maskAPIKey(key.apiKey),
        }))

        return NextResponse.json({
            success: true,
            data: { keys: maskedKeys },
        })
    } catch (error) {
        console.error('获取API密钥列表错误:', error)
        return NextResponse.json(
            { success: false, error: '获取API密钥列表失败' },
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
        const {
            providerId,
            name,
            apiKey,
            endpoint,
            priority,
            weight,
            maxRequestsPerMinute,
        } = body

        if (!providerId || !name || !apiKey) {
            return NextResponse.json(
                { success: false, error: '缺少必填字段' },
                { status: 400 }
            )
        }

        // TODO: 加密API密钥
        const encryptedKey = apiKey

        const key = await prisma.aPIKey.create({
            data: {
                providerId,
                name,
                apiKey: encryptedKey,
                endpoint,
                priority: priority || 50,
                weight: weight || 1,
                maxRequestsPerMinute,
            },
        })

        return NextResponse.json({
            success: true,
            data: {
                key: {
                    ...key,
                    apiKey: maskAPIKey(key.apiKey),
                },
            },
        })
    } catch (error) {
        console.error('创建API密钥错误:', error)
        return NextResponse.json(
            { success: false, error: '创建API密钥失败' },
            { status: 500 }
        )
    }
}

function maskAPIKey(key: string): string {
    if (key.length <= 8) {
        return '****'
    }
    return key.substring(0, 4) + '****' + key.substring(key.length - 4)
}
