import { prisma } from '@/lib/prisma'

export async function ensureFtsIndexed() {
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
