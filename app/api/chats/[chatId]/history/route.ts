import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

/**
 * 获取指定会话的消息历史
 * GET /api/chats/[chatId]/history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 })
    }

    const { chatId } = params

    // 验证会话是否属于当前用户
    const session = await prisma.chatSession.findFirst({
      where: {
        id: chatId,
        userId: decoded.id,
      },
    })

    if (!session) {
      return NextResponse.json({ error: '会话不存在或无权限访问' }, { status: 404 })
    }

    // 获取会话的所有消息
    const messages = await prisma.chatMessage.findMany({
      where: {
        chatId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // 格式化消息
    const formattedMessages = messages.map((msg) => {
      let images: string[] | undefined = undefined
      if (msg.imagePath) {
        try {
          // 尝试解析为 JSON 数组（图像数组）
          const parsed = JSON.parse(msg.imagePath)
          if (Array.isArray(parsed)) {
            images = parsed
          } else {
            // 如果不是数组，可能是单个图像路径
            images = [msg.imagePath]
          }
        } catch {
          // 如果解析失败，作为单个图像路径处理
          images = [msg.imagePath]
        }
      }
      
      return {
        id: msg.id,
        sender: msg.role === 'user' ? 'user' : 'assistant',
        text: msg.content,
        timestamp: msg.createdAt.toISOString(),
        status: 'sent' as const,
        images,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: session.id,
          title: session.title,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        },
        messages: formattedMessages,
      },
    })
  } catch (error) {
    console.error('获取会话历史失败:', error)
    return NextResponse.json(
      { error: '获取会话历史失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

