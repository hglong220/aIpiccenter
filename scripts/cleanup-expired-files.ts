/**
 * 文件生命周期管理脚本
 * 清理过期文件、临时文件等
 * 
 * 运行方式:
 * - 开发: npx tsx scripts/cleanup-expired-files.ts
 * - 生产: 添加到 cron job 或定时任务
 */

import { prisma } from '../lib/prisma'
import { createStorageProvider, getStorageConfig } from '../lib/storage'

async function cleanupExpiredFiles() {
  console.log('开始清理过期文件...')

  const storage = createStorageProvider(getStorageConfig())
  const now = new Date()

  try {
    // 1. 清理已过期的文件
    const expiredFiles = await prisma.file.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
        status: {
          not: 'deleted',
        },
      },
    })

    console.log(`找到 ${expiredFiles.length} 个过期文件`)

    for (const file of expiredFiles) {
      try {
        // 删除存储中的文件
        await storage.delete(file.storagePath)
        
        // 删除预览和缩略图
        if (file.thumbnailUrl) {
          await storage.delete(`thumbnails/${file.filename}`)
        }
        if (file.previewUrl) {
          await storage.delete(`covers/${file.filename}`)
        }

        // 更新数据库状态
        await prisma.file.update({
          where: { id: file.id },
          data: { status: 'deleted' },
        })

        console.log(`已删除过期文件: ${file.originalFilename}`)
      } catch (error) {
        console.error(`删除文件失败 ${file.id}:`, error)
      }
    }

    // 2. 清理超过保留期的临时文件
    const retentionDays = 7 // 默认保留7天
    const retentionDate = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000)

    const oldTempFiles = await prisma.file.findMany({
      where: {
        status: {
          in: ['failed', 'uploading'],
        },
        createdAt: {
          lte: retentionDate,
        },
      },
    })

    console.log(`找到 ${oldTempFiles.length} 个超过保留期的临时文件`)

    for (const file of oldTempFiles) {
      try {
        await storage.delete(file.storagePath)
        await prisma.file.delete({
          where: { id: file.id },
        })
        console.log(`已删除临时文件: ${file.originalFilename}`)
      } catch (error) {
        console.error(`删除临时文件失败 ${file.id}:`, error)
      }
    }

    // 3. 清理过期的签名URL
    const expiredSignedUrls = await prisma.signedUrl.findMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    })

    console.log(`找到 ${expiredSignedUrls.length} 个过期的签名URL`)

    await prisma.signedUrl.deleteMany({
      where: {
        expiresAt: {
          lte: now,
        },
      },
    })

    console.log('已清理所有过期的签名URL')

    // 4. 清理未完成的分片上传（超过24小时）
    const staleChunkDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const staleFiles = await prisma.file.findMany({
      where: {
        status: 'uploading',
        createdAt: {
          lte: staleChunkDate,
        },
      },
      include: {
        chunks: true,
      },
    })

    console.log(`找到 ${staleFiles.length} 个未完成的上传`)

    for (const file of staleFiles) {
      try {
        // 删除所有分片
        for (const chunk of file.chunks) {
          await storage.delete(`temp/${file.id}/${chunk.chunkIndex}`)
        }

        // 删除文件记录
        await prisma.file.delete({
          where: { id: file.id },
        })

        console.log(`已清理未完成的上传: ${file.originalFilename}`)
      } catch (error) {
        console.error(`清理未完成上传失败 ${file.id}:`, error)
      }
    }

    console.log('文件清理完成！')
  } catch (error) {
    console.error('清理文件时发生错误:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// 运行清理
cleanupExpiredFiles()

