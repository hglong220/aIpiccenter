/**
 * 数据库迁移脚本：SQLite → PostgreSQL
 * 
 * 使用方法:
 * 1. 确保 PostgreSQL 数据库已创建并配置好 DATABASE_URL
 * 2. 运行: npx tsx scripts/migrate-to-postgresql.ts
 * 
 * 此脚本会：
 * 1. 检查 PostgreSQL 连接
 * 2. 运行 Prisma 迁移
 * 3. 如果存在 SQLite 数据库，导出数据并导入到 PostgreSQL
 */

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 开始数据库迁移：SQLite → PostgreSQL\n')

  // 1. 检查 PostgreSQL 连接
  console.log('📡 检查 PostgreSQL 连接...')
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log('✅ PostgreSQL 连接成功\n')
  } catch (error) {
    console.error('❌ PostgreSQL 连接失败:', error)
    console.error('\n请确保：')
    console.error('1. PostgreSQL 服务正在运行')
    console.error('2. DATABASE_URL 环境变量已正确配置')
    console.error('3. 数据库用户有足够的权限')
    process.exit(1)
  }

  // 2. 运行 Prisma 迁移
  console.log('📦 运行 Prisma 迁移...')
  try {
    execSync('npx prisma migrate dev --name init_postgresql', {
      stdio: 'inherit',
      env: process.env,
    })
    console.log('✅ Prisma 迁移完成\n')
  } catch (error) {
    console.error('❌ Prisma 迁移失败:', error)
    process.exit(1)
  }

  // 3. 检查是否存在 SQLite 数据库
  const sqlitePath = path.join(process.cwd(), 'prisma', 'dev.db')
  const sqliteExists = fs.existsSync(sqlitePath)

  if (sqliteExists) {
    console.log('📥 检测到 SQLite 数据库，开始数据迁移...')
    console.log('⚠️  注意：数据迁移需要手动执行，请参考以下步骤：\n')
    console.log('方法1：使用 Prisma Studio')
    console.log('  1. 运行: npx prisma studio (SQLite)')
    console.log('  2. 导出数据为 JSON')
    console.log('  3. 切换到 PostgreSQL 数据库')
    console.log('  4. 导入数据\n')
    console.log('方法2：使用 SQL 导出/导入')
    console.log('  1. 使用 sqlite3 导出: sqlite3 prisma/dev.db .dump > sqlite_dump.sql')
    console.log('  2. 手动转换 SQL 语法（SQLite → PostgreSQL）')
    console.log('  3. 导入到 PostgreSQL: psql $DATABASE_URL < converted_dump.sql\n')
    console.log('方法3：使用数据迁移工具')
    console.log('  运行: npx tsx scripts/export-sqlite-data.ts')
    console.log('  然后: npx tsx scripts/import-to-postgresql.ts\n')
  } else {
    console.log('ℹ️  未检测到 SQLite 数据库，跳过数据迁移\n')
  }

  // 4. 生成 Prisma Client
  console.log('🔨 生成 Prisma Client...')
  try {
    execSync('npx prisma generate', {
      stdio: 'inherit',
      env: process.env,
    })
    console.log('✅ Prisma Client 生成完成\n')
  } catch (error) {
    console.error('❌ Prisma Client 生成失败:', error)
    process.exit(1)
  }

  console.log('✅ 数据库迁移完成！')
  console.log('\n下一步：')
  console.log('1. 如果存在 SQLite 数据，请按照上述方法迁移数据')
  console.log('2. 运行: npm run dev 启动开发服务器')
  console.log('3. 访问: http://localhost:3000/api/health 检查健康状态')
}

main()
  .catch((error) => {
    console.error('迁移失败:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

