/**
 * 初始化数据库表结构
 * 
 * 如果表不存在，手动创建表
 */

const { PrismaClient } = require('../lib/generated/prisma/client');
const prisma = new PrismaClient();

async function initDatabase() {
  try {
    console.log('\n=== 初始化数据库表结构 ===\n');

    // 尝试查询 User 表
    try {
      const count = await prisma.user.count();
      console.log(`✅ User 表已存在，当前有 ${count} 条记录`);
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log('❌ User 表不存在，需要创建表结构');
        console.log('\n请运行以下命令创建表：');
        console.log('npx prisma db push --force-reset');
        console.log('\n或者删除数据库文件后重新创建：');
        console.log('1. 删除 prisma/dev.db');
        console.log('2. 运行: npm run db:push\n');
        process.exit(1);
      } else {
        throw error;
      }
    }

    // 检查其他表
    const tables = ['VerificationCode', 'Order', 'Generation', 'Session'];
    for (const table of tables) {
      try {
        const count = await prisma[table.toLowerCase()].count();
        console.log(`✅ ${table} 表已存在，当前有 ${count} 条记录`);
      } catch (error) {
        console.log(`⚠️  ${table} 表可能不存在`);
      }
    }

    console.log('\n✅ 数据库表结构检查完成\n');
  } catch (error) {
    console.error('❌ 数据库初始化错误:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initDatabase();
































































