/**
 * 创建测试管理员账号（简化版）
 * 
 * 通过 API 端点创建测试账号
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/create-test-user',
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
        console.log('\n✅ 测试管理员账号创建成功！\n');
        console.log('📝 登录信息：');
        console.log(`   手机号: ${result.data.user.phone}`);
        console.log(`   用户名: ${result.data.user.username || '未设置'}`);
        console.log(`   信用点: ${result.data.user.credits}`);
        console.log(`   订阅计划: ${result.data.user.plan}`);
        console.log('\n⚠️  重要提示：');
        console.log('   1. 登录时需要使用验证码');
        console.log('   2. 验证码会在控制台输出（开发环境）');
        console.log('   3. 访问 http://localhost:3000/auth 进行登录');
        console.log('   4. 输入手机号，点击"发送验证码"');
        console.log('   5. 在终端查看验证码并输入\n');
        console.log('💡 提示：您也可以直接使用以下 Token 登录（通过浏览器控制台）：');
        console.log(`   localStorage.setItem('auth_token', '${result.data.token}');`);
        console.log(`   localStorage.setItem('auth_user', JSON.stringify(${JSON.stringify(result.data.user)}));`);
        console.log('   然后刷新页面即可\n');
      } else {
        console.log('❌ 创建失败:', result.error);
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

req.write(JSON.stringify({}));
req.end();
























