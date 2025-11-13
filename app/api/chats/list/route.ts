import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

/**
 * 获取用户的聊天会话列表
 * GET /api/chats/list
 */
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 })
    }

    // 获取用户的会话列表，按更新时间倒序
    const sessions = await prisma.chatSession.findMany({
      where: {
        userId: decoded.id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // 只获取最后一条消息用于预览
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    })

    // 格式化返回数据
    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      title: session.title || (session.messages[0]?.content?.substring(0, 30) || '新对话'),
      isStarred: session.isStarred,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      lastMessage: session.messages[0]?.content || null,
      messageCount: session._count.messages,
    }))

    return NextResponse.json({
      success: true,
      data: formattedSessions,
    })
  } catch (error) {
    console.error('获取会话列表失败:', error)
    return NextResponse.json(
      { error: '获取会话列表失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

