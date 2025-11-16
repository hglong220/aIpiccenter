/**
 * 导入数据到 PostgreSQL
 * 
 * 使用方法:
 * 1. 确保 PostgreSQL 数据库已创建并配置好 DATABASE_URL
 * 2. 确保已运行 export-sqlite-data.ts 导出数据
 * 3. 运行: npx tsx scripts/import-to-postgresql.ts
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('📥 开始导入数据到 PostgreSQL...\n')

  // 1. 检查 PostgreSQL 连接
  console.log('📡 检查 PostgreSQL 连接...')
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ PostgreSQL 连接成功\n')
  } catch (error) {
    console.error('❌ PostgreSQL 连接失败:', error)
    process.exit(1)
  }

  // 2. 读取导出文件
  const exportPath = path.join(process.cwd(), 'scripts', 'sqlite-export.json')
  if (!fs.existsSync(exportPath)) {
    console.error(`❌ 导出文件不存在: ${exportPath}`)
    console.error('请先运行: npx tsx scripts/export-sqlite-data.ts')
    process.exit(1)
  }

  const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf-8'))
  console.log('✅ 读取导出文件成功\n')

  // 3. 导入数据（按依赖顺序）
  try {
    // 导入用户（必须先导入，因为其他表依赖它）
    if (exportData.users && exportData.users.length > 0) {
      console.log(`📥 导入 ${exportData.users.length} 条用户记录...`)
      for (const user of exportData.users) {
        await prisma.user.upsert({
          where: { id: user.id },
          update: user,
          create: user,
        })
      }
      console.log('✅ 用户数据导入完成\n')
    }

    // 导入订单
    if (exportData.orders && exportData.orders.length > 0) {
      console.log(`📥 导入 ${exportData.orders.length} 条订单记录...`)
      for (const order of exportData.orders) {
        await prisma.order.upsert({
          where: { id: order.id },
          update: order,
          create: order,
        })
      }
      console.log('✅ 订单数据导入完成\n')
    }

    // 导入生成记录
    if (exportData.generations && exportData.generations.length > 0) {
      console.log(`📥 导入 ${exportData.generations.length} 条生成记录...`)
      for (const generation of exportData.generations) {
        await prisma.generation.upsert({
          where: { id: generation.id },
          update: generation,
          create: generation,
        })
      }
      console.log('✅ 生成记录导入完成\n')
    }

    // 导入文件
    if (exportData.files && exportData.files.length > 0) {
      console.log(`📥 导入 ${exportData.files.length} 条文件记录...`)
      for (const file of exportData.files) {
        await prisma.file.upsert({
          where: { id: file.id },
          update: file,
          create: file,
        })
      }
      console.log('✅ 文件数据导入完成\n')
    }

    // 导入项目
    if (exportData.projects && exportData.projects.length > 0) {
      console.log(`📥 导入 ${exportData.projects.length} 条项目记录...`)
      for (const project of exportData.projects) {
        await prisma.project.upsert({
          where: { id: project.id },
          update: project,
          create: project,
        })
      }
      console.log('✅ 项目数据导入完成\n')
    }

    // 导入聊天会话
    if (exportData.chatSessions && exportData.chatSessions.length > 0) {
      console.log(`📥 导入 ${exportData.chatSessions.length} 条聊天会话...`)
      for (const session of exportData.chatSessions) {
        await prisma.chatSession.upsert({
          where: { id: session.id },
          update: session,
          create: session,
        })
      }
      console.log('✅ 聊天会话导入完成\n')
    }

    // 导入聊天消息
    if (exportData.chatMessages && exportData.chatMessages.length > 0) {
      console.log(`📥 导入 ${exportData.chatMessages.length} 条聊天消息...`)
      for (const message of exportData.chatMessages) {
        await prisma.chatMessage.upsert({
          where: { id: message.id },
          update: message,
          create: message,
        })
      }
      console.log('✅ 聊天消息导入完成\n')
    }

    console.log('✅ 所有数据导入完成！')
  } catch (error) {
    console.error('❌ 导入失败:', error)
    process.exit(1)
  }
}

main()
  .catch((error) => {
    console.error('导入失败:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

