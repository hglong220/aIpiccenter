/**
 * 修复管理员账号权限
 * 
 * 将指定用户的 plan 从 'enterprise' 更改为 'admin'
 */

const http = require('http');

// 要修复的用户信息
const USERNAME = 'admin';
const PHONE = '13800138000';

console.log('🔧 正在修复管理员账号权限...\n');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/fix-user-plan',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const result = JSON.parse(data);

            if (result.success) {
                console.log('✅ 管理员权限修复成功！\n');
                console.log('📝 账号信息：');
                console.log(`   用户名: ${result.data.username}`);
                console.log(`   手机号: ${result.data.phone}`);
                console.log(`   权限等级: ${result.data.plan} (已更新为 admin)`);
                console.log(`   信用点: ${result.data.credits}`);
                console.log('\n🎉 现在可以使用以下方式登录后台：');
                console.log('   1. 访问 http://localhost:3000/');
                console.log('   2. 选择"密码登录"');
                console.log(`   3. 用户名: ${USERNAME} (或手机号: ${PHONE})`);
                console.log('   4. 密码: admin123');
                console.log('   5. 登录后访问 http://localhost:3000/admin\n');
            } else {
                console.log('❌ 修复失败:', result.error);
            }
        } catch (error) {
            console.log('响应数据:', data);
            console.error('解析响应失败:', error);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ 请求失败:', error.message);
    console.log('\n⚠️  请确保开发服务器正在运行 (npm run dev)');
    console.log('   然后再次运行此脚本\n');
});

req.write(JSON.stringify({
    username: USERNAME,
    phone: PHONE,
    newPlan: 'admin'
}));
req.end();
