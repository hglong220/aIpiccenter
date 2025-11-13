import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

const MAX_RESULTS = 20

async function ensureFtsIndexed() {
  await prisma.$executeRawUnsafe(
    `CREATE VIRTUAL TABLE IF NOT EXISTS chat_message_fts USING FTS5(content, chatId, messageId, createdAt UNINDEXED);`
  )

  await prisma.$executeRawUnsafe(`
    INSERT INTO chat_message_fts (content, chatId, messageId, createdAt)
    SELECT m.content, m.chatId, m.id, strftime('%Y-%m-%dT%H:%M:%S', m.createdAt)
    FROM ChatMessage m
    WHERE NOT EXISTS (
      SELECT 1 FROM chat_message_fts f WHERE f.messageId = m.id
    )
  `)
}

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

    const likeQuery = `${query.replace(/['"]/g, '')}*`

    const rows = await prisma.$queryRawUnsafe<
      Array<{
        chatId: string
        messageId: string
        content: string
        snippet: string
        createdAt: string
      }>
    >(
      `
      SELECT m.chatId,
             m.id            AS messageId,
             m.content       AS content,
             snippet(chat_message_fts, 0, '<mark>', '</mark>', '...', 10) AS snippet,
             m.createdAt     AS createdAt
      FROM chat_message_fts
      JOIN ChatMessage m ON m.id = chat_message_fts.messageId
      JOIN ChatSession s ON s.id = m.chatId
      WHERE s.userId = ? AND chat_message_fts MATCH ?
      ORDER BY m.createdAt DESC
      LIMIT ?
      `,
      decoded.id,
      likeQuery,
      MAX_RESULTS
    )

    const results = rows.map((row) => ({
      chatId: row.chatId,
      messageId: row.messageId,
      content: row.content,
      highlight: row.snippet || row.content,
      createdAt: new Date(row.createdAt).toISOString(),
    }))

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








