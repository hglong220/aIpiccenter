import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'
import { ensureFtsIndexed } from '@/lib/fts'

const MAX_RESULTS = 20

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookies(request)
    if (!token) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: '认证失效，请重新登录' },
        { status: 401 }
      )
    }

    const query = request.nextUrl.searchParams.get('q')?.trim()
    if (!query) {
      return NextResponse.json({
        success: true,
        data: {
          results: [],
        },
      })
    }

    if (query.length < 2) {
      return NextResponse.json(
        { success: false, error: '请输入至少 2 个字符进行搜索' },
        { status: 400 }
      )
    }

    await ensureFtsIndexed()

    // PostgreSQL: 使用ILIKE进行不区分大小写的搜索
    const chatMessages = await prisma.chatMessage.findMany({
      where: {
        chat: {
          userId: decoded.id,
        },
        content: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        chat: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: MAX_RESULTS,
    })

    const results = chatMessages.map((m) => {
      // 高亮搜索关键词
      const highlight = m.content.replace(
        new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
        '<mark>$1</mark>'
      )

      return {
        chatId: m.chatId,
        messageId: m.id,
        content: m.content,
        highlight: highlight,
        createdAt: m.createdAt.toISOString(),
        title: m.chat.title,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        results,
      },
    })
  } catch (error) {
    console.error('聊天搜索失败:', error)
    return NextResponse.json(
      { success: false, error: '服务器异常，请稍后再试' },
      { status: 500 }
    )
  }
}










