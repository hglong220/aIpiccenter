require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDbStatus() {
  try {
    const chatMessageCount = await prisma.chatMessage.count();
    const chatSessionCount = await prisma.chatSession.count();
    
    const ftsRecords = await prisma.$queryRawUnsafe(`SELECT count(*) as count FROM chat_message_fts;`);
    const ftsCount = ftsRecords.length > 0 ? (ftsRecords[0].count || ftsRecords[0]['count(*)']) : 0;

    console.log('--- 数据库状态 ---');
    console.log(`ChatSession 数量: ${chatSessionCount}`);
    console.log(`ChatMessage 数量: ${chatMessageCount}`);
    console.log(`FTS 索引记录数量: ${ftsCount}`);

    if (chatMessageCount === 0) {
      console.warn('警告: ChatMessage 表中没有记录。请尝试发送一些聊天消息。');
    }
    if (ftsCount === 0 && chatMessageCount > 0) {
      console.warn('警告: ChatMessage 表中有记录，但 FTS 索引中没有。可能是 FTS 索引更新失败。');
    }
    if (chatSessionCount === 0) {
      console.warn('警告: ChatSession 表中没有记录。请创建新的聊天会话。');
    }

  } catch (e) {
    console.error('查询数据库失败:', e);
    if (e.message.includes('no such table: chat_message_fts')) {
      console.error('错误: chat_message_fts 表不存在。请确保 FTS 索引已通过 ensureFtsIndexed 函数创建。');
    }
    if (e.message.includes('no such table: ChatMessage')) {
      console.error('错误: ChatMessage 表不存在。请运行 Prisma 迁移 (npx prisma migrate dev)。');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDbStatus();
