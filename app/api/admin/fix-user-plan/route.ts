/**
 * API Route: Fix User Plan
 * 
 * 修复用户权限等级（仅用于开发环境）
 * 
 * POST /api/admin/fix-user-plan
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
    try {
        // 仅允许在开发环境使用
        if (process.env.NODE_ENV === 'production') {
            return NextResponse.json<ApiResponse<null>>(
                {
                    success: false,
                    error: '此功能仅在开发环境可用',
                },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { username, phone, newPlan } = body

        if (!username && !phone) {
            return NextResponse.json<ApiResponse<null>>(
                {
                    success: false,
                    error: '必须提供用户名或手机号',
                },
                { status: 400 }
            )
        }

        if (!newPlan) {
            return NextResponse.json<ApiResponse<null>>(
                {
                    success: false,
                    error: '必须提供新的权限等级',
                },
                { status: 400 }
            )
        }

        // 查找用户
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    username ? { username } : {},
                    phone ? { phone } : {},
                ].filter(obj => Object.keys(obj).length > 0),
            },
        })

        if (!user) {
            return NextResponse.json<ApiResponse<null>>(
                {
                    success: false,
                    error: '用户不存在',
                },
                { status: 404 }
            )
        }

        // 更新用户权限
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                plan: newPlan,
            },
        })

        return NextResponse.json<ApiResponse<any>>({
            success: true,
            data: {
                id: updatedUser.id,
                username: updatedUser.username,
                phone: updatedUser.phone,
                email: updatedUser.email,
                plan: updatedUser.plan,
                credits: updatedUser.credits,
            },
            message: `用户权限已更新为 ${newPlan}`,
        })
    } catch (error) {
        console.error('修复用户权限错误:', error)
        const errorMessage = error instanceof Error ? error.message : '未知错误'

        return NextResponse.json<ApiResponse<null>>(
            {
                success: false,
                error: errorMessage,
            },
            { status: 500 }
        )
    }
}
