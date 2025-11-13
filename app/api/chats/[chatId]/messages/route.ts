import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

/**
 * 保存消息到指定会话
 * POST /api/chats/[chatId]/messages
 */
export async function POST(
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
    const body = await request.json()

    const { role, content, imagePath } = body

    if (!role || !content) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 })
    }

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

    // 如果是第一条用户消息，自动设置会话标题
    if (role === 'user' && !session.title) {
      const title = content.substring(0, 50).trim()
      await prisma.chatSession.update({
        where: { id: chatId },
        data: { title },
      })
    }

    // 保存消息
    const message = await prisma.chatMessage.create({
      data: {
        chatId,
        role,
        content,
        imagePath: imagePath || null,
      },
    })

    // 更新会话的更新时间
    await prisma.chatSession.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        sender: message.role === 'user' ? 'user' : 'assistant',
        text: message.content,
        timestamp: message.createdAt.toISOString(),
        status: 'sent',
        images: message.imagePath ? [message.imagePath] : undefined,
      },
    })
  } catch (error) {
    console.error('保存消息失败:', error)
    return NextResponse.json(
      { error: '保存消息失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

