import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { ensureFtsIndexed } from '@/lib/fts'

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

    const { role, content, imagePath, fileId } = body

    if (!role || !content) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 })
    }

    // 如果提供了fileId，验证文件存在且属于当前用户
    let finalImagePath = imagePath || null
    if (fileId) {
      const file = await prisma.file.findFirst({
        where: {
          id: fileId,
          userId: decoded.id,
          status: 'ready',
        },
      })

      if (!file) {
        return NextResponse.json({ error: '文件不存在或无权限访问' }, { status: 404 })
      }

      // 使用文件的存储URL或预览URL
      finalImagePath = file.thumbnailUrl || file.previewUrl || file.storageUrl || `/storage/${file.storagePath}`
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

    // Ensure FTS table exists before any write operations
    await ensureFtsIndexed()

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
        imagePath: finalImagePath, // 支持文件ID解析后的路径或直接路径
      },
    })

    // The manual FTS insert is now handled by ensureFtsIndexed, so this is no longer needed.

    // 更新会话的更新时间
    await prisma.chatSession.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    })

    // 如果消息包含文件，获取文件详细信息
    let fileInfo = null
    if (fileId) {
      const file = await prisma.file.findUnique({
        where: { id: fileId },
        include: { metadata: true },
      })
      if (file) {
        fileInfo = {
          id: file.id,
          filename: file.originalFilename,
          fileType: file.fileType,
          url: file.storageUrl || `/storage/${file.storagePath}`,
          thumbnailUrl: file.thumbnailUrl,
          previewUrl: file.previewUrl,
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        sender: message.role === 'user' ? 'user' : 'assistant',
        text: message.content,
        timestamp: message.createdAt.toISOString(),
        status: 'sent',
        images: message.imagePath ? [message.imagePath] : undefined,
        file: fileInfo, // 文件详细信息
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

