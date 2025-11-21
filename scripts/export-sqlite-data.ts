/**
 * 导出 SQLite 数据为 JSON
 * 
 * 使用方法:
 * 1. 临时修改 .env 中的 DATABASE_URL 指向 SQLite
 * 2. 运行: npx tsx scripts/export-sqlite-data.ts
 * 3. 数据将导出到 scripts/sqlite-export.json
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

// 临时使用 SQLite
const sqlitePrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db',
    },
  },
})

async function main() {
  console.log('📤 开始导出 SQLite 数据...\n')

  try {
    // 检查 SQLite 连接
    await sqlitePrisma.$queryRaw`SELECT 1`
    console.log('✅ SQLite 连接成功\n')
  } catch (error) {
    console.error('❌ SQLite 连接失败:', error)
    process.exit(1)
  }

  const exportData: any = {}

  // 导出所有表的数据
  console.log('📋 导出用户数据...')
  exportData.users = await sqlitePrisma.user.findMany()
  console.log(`  导出 ${exportData.users.length} 条用户记录`)

  console.log('📋 导出订单数据...')
  exportData.orders = await sqlitePrisma.order.findMany()
  console.log(`  导出 ${exportData.orders.length} 条订单记录`)

  console.log('📋 导出生成记录...')
  exportData.generations = await sqlitePrisma.generation.findMany()
  console.log(`  导出 ${exportData.generations.length} 条生成记录`)

  console.log('📋 导出文件数据...')
  exportData.files = await sqlitePrisma.file.findMany()
  console.log(`  导出 ${exportData.files.length} 条文件记录`)

  console.log('📋 导出项目数据...')
  exportData.projects = await sqlitePrisma.project.findMany()
  console.log(`  导出 ${exportData.projects.length} 条项目记录`)

  console.log('📋 导出聊天会话...')
  exportData.chatSessions = await sqlitePrisma.chatSession.findMany()
  console.log(`  导出 ${exportData.chatSessions.length} 条聊天会话`)

  console.log('📋 导出聊天消息...')
  exportData.chatMessages = await sqlitePrisma.chatMessage.findMany()
  console.log(`  导出 ${exportData.chatMessages.length} 条聊天消息`)

  // 保存到文件
  const exportPath = path.join(process.cwd(), 'scripts', 'sqlite-export.json')
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf-8')

  console.log(`\n✅ 数据导出完成！`)
  console.log(`📁 导出文件: ${exportPath}`)
  console.log(`\n下一步：`)
  console.log(`1. 确保 PostgreSQL 数据库已配置`)
  console.log(`2. 运行: npx tsx scripts/import-to-postgresql.ts`)
}

main()
  .catch((error) => {
    console.error('导出失败:', error)
    process.exit(1)
  })
  .finally(async () => {
    await sqlitePrisma.$disconnect()
  })

