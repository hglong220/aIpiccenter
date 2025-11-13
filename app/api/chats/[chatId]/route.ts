import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

/**
 * 删除会话
 * DELETE /api/chats/[chatId]
 */
export async function DELETE(
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

    // 删除会话（级联删除消息）
    await prisma.chatSession.delete({
      where: { id: chatId },
    })

    return NextResponse.json({
      success: true,
      message: '会话已删除',
    })
  } catch (error) {
    console.error('删除会话失败:', error)
    return NextResponse.json(
      { error: '删除会话失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * 更新会话（重命名、星标等）
 * PATCH /api/chats/[chatId]
 */
export async function PATCH(
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

    // 更新会话
    const updatedSession = await prisma.chatSession.update({
      where: { id: chatId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.isStarred !== undefined && { isStarred: body.isStarred }),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedSession.id,
        title: updatedSession.title,
        isStarred: updatedSession.isStarred,
        updatedAt: updatedSession.updatedAt,
      },
    })
  } catch (error) {
    console.error('更新会话失败:', error)
    return NextResponse.json(
      { error: '更新会话失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

