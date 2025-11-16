/**
 * 统一搜索API（综合搜索）
 * GET /api/search?q=query&type=all|files|projects|chats&limit=20
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenFromCookies, verifyToken } from '@/lib/auth'

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

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')?.trim()
    const searchType = searchParams.get('type') || 'all' // all, files, projects, chats
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), MAX_RESULTS)

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          files: [],
          projects: [],
          chats: [],
        },
      })
    }

    const results: {
      files: any[]
      projects: any[]
      chats: any[]
    } = {
      files: [],
      projects: [],
      chats: [],
    }

    // 搜索文件
    if (searchType === 'all' || searchType === 'files') {
      // 使用PostgreSQL全文搜索
      const { ensureFtsIndexed } = await import('@/lib/fts')
      await ensureFtsIndexed()
      
      // 搜索文件名和文件内容（元数据中的提取文本）
      const files = await prisma.file.findMany({
        where: {
          userId: decoded.id,
          status: 'ready',
          OR: [
            { originalFilename: { contains: query, mode: 'insensitive' } },
            { filename: { contains: query, mode: 'insensitive' } },
            // 搜索文件元数据中的提取文本
            {
              metadata: {
                extractedText: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            },
          ],
        },
        include: {
          metadata: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      })

      results.files = files.map((file) => ({
        id: file.id,
        filename: file.originalFilename,
        fileType: file.fileType,
        size: file.size,
        previewUrl: file.previewUrl,
        createdAt: file.createdAt.toISOString(),
      }))
    }

    // 搜索项目
    if (searchType === 'all' || searchType === 'projects') {
      const projects = await prisma.project.findMany({
        where: {
          userId: decoded.id,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          _count: {
            select: {
              files: true,
              generations: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: limit,
      })

      results.projects = projects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        coverUrl: project.coverUrl,
        fileCount: project._count.files,
        generationCount: project._count.generations,
        createdAt: project.createdAt.toISOString(),
      }))
    }

    // 搜索聊天记录
    if (searchType === 'all' || searchType === 'chats') {
      const { ensureFtsIndexed } = await import('@/lib/fts')
      await ensureFtsIndexed()
      
      try {
        // 使用PostgreSQL的相似度搜索（pg_trgm）
        const ftsChatMessages = await prisma.$queryRawUnsafe(`
          SELECT 
            cm.id,
            cm."chatId",
            cm.content,
            cm."createdAt",
            cs.title,
            similarity(cm.content, $1::text) as similarity
          FROM "ChatMessage" cm
          INNER JOIN "ChatSession" cs ON cm."chatId" = cs.id
          WHERE cs."userId" = $2::text
            AND cm.content ILIKE $3::text
          ORDER BY similarity DESC, cm."createdAt" DESC
          LIMIT $4::integer
        `, query, decoded.id, `%${query}%`, limit) as any[]
        
        const results_chats = ftsChatMessages.map((m: any) => ({
          chatId: m.chatId,
          messageId: m.id,
          content: m.content,
          highlight: m.content.replace(
            new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
            '<mark>$1</mark>'
          ),
          title: m.title,
          similarity: m.similarity,
          createdAt: m.createdAt.toISOString(),
        }))

        results.chats = results_chats
      } catch (error) {
        // 如果全文搜索失败，回退到普通搜索
        console.warn('[Search] FTS search failed, using fallback:', error)
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
          take: limit,
        })

        results.chats = chatMessages.map((m) => ({
          chatId: m.chatId,
          messageId: m.id,
          content: m.content,
          highlight: m.content.replace(
            new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
            '<mark>$1</mark>'
          ),
          title: m.chat.title,
          createdAt: m.createdAt.toISOString(),
        }))
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error('统一搜索失败:', error)
    return NextResponse.json(
      { success: false, error: '服务器异常，请稍后再试' },
      { status: 500 }
    )
  }
}

