import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

/**
 * 创建新的聊天会话
 * POST /api/chats/new
 */
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const title = body.title || null

    // 创建新会话
    const chatSession = await prisma.chatSession.create({
      data: {
        userId: decoded.id,
        title,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: chatSession.id,
        title: chatSession.title,
        createdAt: chatSession.createdAt,
        updatedAt: chatSession.updatedAt,
        messageCount: chatSession.messages.length,
      },
    })
  } catch (error) {
    console.error('创建聊天会话失败:', error)
    return NextResponse.json(
      { error: '创建会话失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

