/**
 * 创建测试管理员账号
 * 
 * 这个脚本用于快速创建测试账号，绕过验证码验证
 * 仅用于开发环境测试
 */

require('dotenv').config({ path: '.env.local' });

// 使用动态导入来加载 Prisma Client
async function createTestAdmin() {
  try {
    // 动态导入 Prisma Client
    const { PrismaClient } = await import('../lib/generated/prisma/client.js');
    const bcrypt = await import('bcryptjs');
    
    const prisma = new PrismaClient();

    console.log('\n=== 创建测试管理员账号 ===\n');

    // 测试账号信息
    const adminPhone = '13800138000';
    const adminUsername = 'admin';
    const adminPassword = 'admin123';
    const adminEmail = 'admin@aipiccenter.com';

    // 检查账号是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: adminPhone },
          { username: adminUsername },
        ],
      },
    });

    if (existingUser) {
      console.log('⚠️  测试账号已存在');
      console.log(`   手机号: ${existingUser.phone}`);
      console.log(`   用户名: ${existingUser.username || '未设置'}`);
      console.log(`   信用点: ${existingUser.credits}`);
      
      // 更新信用点和管理员标记
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          credits: 1000,
          plan: 'enterprise',
        },
      });
      
      console.log('\n✅ 已更新信用点和管理员信息');
      console.log('\n📝 登录信息：');
      console.log(`   手机号: ${adminPhone}`);
      console.log(`   用户名: ${adminUsername}`);
      console.log(`   密码: ${adminPassword}`);
      console.log('\n⚠️  重要提示：');
      console.log('   登录时需要使用验证码，验证码会在控制台输出\n');
      
      await prisma.$disconnect();
      return;
    }

    // 加密密码
    const hashedPassword = await bcrypt.default.hash(adminPassword, 10);

    // 创建管理员账号
    const admin = await prisma.user.create({
      data: {
        phone: adminPhone,
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        credits: 1000, // 给予 1000 个信用点用于测试
        plan: 'enterprise', // 企业版计划
        planExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1年后过期
      },
    });

    console.log('✅ 测试管理员账号创建成功！\n');
    console.log('📝 登录信息：');
    console.log(`   手机号: ${adminPhone}`);
    console.log(`   用户名: ${adminUsername}`);
    console.log(`   密码: ${adminPassword}`);
    console.log(`   邮箱: ${adminEmail}`);
    console.log(`   信用点: ${admin.credits}`);
    console.log(`   订阅计划: ${admin.plan}`);
    console.log('\n⚠️  重要提示：');
    console.log('   1. 登录时需要使用验证码');
    console.log('   2. 验证码会在控制台输出（开发环境）');
    console.log('   3. 访问 http://localhost:3000/ 进行登录');
    console.log('   4. 输入手机号，点击"发送验证码"');
    console.log('   5. 在终端查看验证码并输入\n');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ 创建测试账号失败:', error);
    process.exit(1);
  }
}

// 运行脚本
createTestAdmin();
