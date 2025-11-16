/**
 * 分享项目API
 * GET /api/projects/shared/[shareToken] - 通过分享token获取项目
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    // 通过分享token获取项目
    const project = await prisma.project.findUnique({
      where: { shareToken: params.shareToken },
      include: {
        files: {
          include: {
            file: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        generations: {
          include: {
            generation: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })

    if (!project) {
      return NextResponse.json({ success: false, error: '项目不存在' }, { status: 404 })
    }

    if (!project.isPublic) {
      return NextResponse.json({ success: false, error: '项目未公开' }, { status: 403 })
    }

    // 检查分享链接是否过期
    if (project.shareExpiresAt && project.shareExpiresAt < new Date()) {
      return NextResponse.json({ success: false, error: '分享链接已过期' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        description: project.description,
        coverImage: project.coverUrl,
        files: project.files.map((pf) => ({
          id: pf.file.id,
          originalFilename: pf.file.originalFilename,
          url: pf.file.url,
          fileType: pf.file.fileType,
        })),
        generations: project.generations.map((pg) => ({
          id: pg.generation.id,
          type: pg.generation.type,
          prompt: pg.generation.prompt,
          imageUrl: pg.generation.imageUrl,
          videoUrl: pg.generation.videoUrl,
        })),
      },
    })
  } catch (error) {
    console.error('[Shared Project] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

