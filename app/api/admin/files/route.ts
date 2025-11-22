/**
 * API: Admin Files
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
        const status = searchParams.get('status')
        const fileType = searchParams.get('fileType')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')
        const skip = (page - 1) * limit

        const where: any = {}
        if (status && status !== 'all') where.status = status
        if (fileType && fileType !== 'all') where.fileType = fileType

        const [files, total, totalSize] = await Promise.all([
            prisma.file.findMany({
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
            prisma.file.count({ where }),
            prisma.file.aggregate({
                _sum: { size: true },
            }),
        ])

        return NextResponse.json({
            success: true,
            data: {
                files,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
                totalSize: totalSize._sum.size || 0,
            },
        })
    } catch (error) {
        console.error('获取文件列表错误:', error)
        return NextResponse.json(
            { success: false, error: '获取文件列表失败' },
            { status: 500 }
        )
    }
}
