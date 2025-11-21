import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { ensureFtsIndexed } from '@/lib/fts'

/**
 * 更新消息
 * PATCH /api/chats/[chatId]/messages/[messageId]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { chatId: string; messageId: string } }
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

    const { chatId, messageId } = params
    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: '缺少内容字段' }, { status: 400 })
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

    // 验证消息是否存在且属于该会话
    const message = await prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        chatId,
      },
    })

    if (!message) {
      return NextResponse.json({ error: '消息不存在' }, { status: 404 })
    }

    // 只允许编辑用户消息
    if (message.role !== 'user') {
      return NextResponse.json({ error: '只能编辑用户消息' }, { status: 403 })
    }

    // 更新消息
    const updatedMessage = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { content },
    })

    // 更新 FTS 索引
    await ensureFtsIndexed()
    await prisma.$executeRawUnsafe(
      `UPDATE chat_message_fts SET content = ? WHERE messageId = ?`,
      content,
      messageId
    )

    // 更新会话的更新时间
    await prisma.chatSession.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedMessage.id,
        sender: updatedMessage.role === 'user' ? 'user' : 'assistant',
        text: updatedMessage.content,
        timestamp: updatedMessage.createdAt.toISOString(),
        status: 'sent',
      },
    })
  } catch (error) {
    console.error('更新消息失败:', error)
    return NextResponse.json(
      { error: '更新消息失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

