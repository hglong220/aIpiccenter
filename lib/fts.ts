import { prisma } from '@/lib/prisma'

/**
 * 确保全文搜索索引已创建
 * 注意：PostgreSQL使用pg_trgm扩展进行全文搜索，而不是FTS5
 */
export async function ensureFtsIndexed() {
  try {
    // PostgreSQL: 创建pg_trgm扩展（如果不存在）
    await prisma.$executeRawUnsafe(`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
    `)

    // PostgreSQL: 创建GIN索引用于全文搜索（如果不存在）
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_chat_message_content_gin 
      ON "ChatMessage" USING gin(content gin_trgm_ops);
    `)
  } catch (error) {
    // 如果扩展创建失败（可能没有权限），继续使用普通搜索
    console.warn('FTS索引创建失败，将使用普通搜索:', error)
  }
}
