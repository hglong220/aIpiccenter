/**
 * 测试代理服务器的认证方式
 * 尝试不同的认证格式和配置
 */

const http = require('http');
const net = require('net');
const { URL } = require('url');

const PROXY_HOST = '34.87.103.25';
const PROXY_PORT = 3128;

console.log('========================================');
console.log('代理认证测试');
console.log('========================================\n');
console.log(`代理主机: ${PROXY_HOST}`);
console.log(`代理端口: ${PROXY_PORT}\n`);

// 测试不同的认证方式
const authTests = [
  { name: '无认证', auth: null },
  // 常见的默认用户名密码组合
  { name: 'admin:admin', auth: 'admin:admin' },
  { name: 'user:user', auth: 'user:user' },
  { name: 'proxy:proxy', auth: 'proxy:proxy' },
  { name: 'squid:squid', auth: 'squid:squid' },
  { name: 'test:test', auth: 'test:test' },
];

async function testAuth(authName, authString) {
  return new Promise((resolve) => {
    const authHeader = authString 
      ? `Basic ${Buffer.from(authString).toString('base64')}`
      : null;
    
    const options = {
      hostname: PROXY_HOST,
      port: PROXY_PORT,
      method: 'CONNECT',
      path: 'www.google.com:443',
      headers: {},
    };
    
    if (authHeader) {
      options.headers['Proxy-Authorization'] = authHeader;
    }
    
    const req = http.request(options);
    
    req.on('connect', (res, socket, head) => {
      socket.destroy();
      console.log(`   ✅ ${authName}: 成功 (状态码: ${res.statusCode})`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      if (err.code === 'ECONNRESET') {
        console.log(`   ❌ ${authName}: 连接被重置`);
      } else {
        console.log(`   ❌ ${authName}: ${err.message}`);
      }
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      console.log(`   ⏱️  ${authName}: 超时`);
      resolve(false);
    });
    
    req.end();
  });
}

async function testDirectConnect() {
  return new Promise((resolve) => {
    console.log('测试直接 TCP CONNECT（不使用 HTTP CONNECT）...');
    const socket = new net.Socket();
    
    socket.once('connect', () => {
      // 发送原始 CONNECT 请求
      socket.write(`CONNECT www.google.com:443 HTTP/1.1\r\n`);
      socket.write(`Host: www.google.com:443\r\n`);
      socket.write(`\r\n`);
      
      let response = '';
      socket.on('data', (data) => {
        response += data.toString();
        if (response.includes('\r\n\r\n')) {
          socket.destroy();
          if (response.includes('200')) {
            console.log('   ✅ 直接 CONNECT 成功');
            console.log(`   响应: ${response.split('\r\n')[0]}\n`);
            resolve(true);
          } else {
            console.log('   ❌ 直接 CONNECT 失败');
            console.log(`   响应: ${response.substring(0, 200)}\n`);
            resolve(false);
          }
        }
      });
    });
    
    socket.once('error', (err) => {
      console.log(`   ❌ 连接错误: ${err.message}\n`);
      resolve(false);
    });
    
    socket.setTimeout(5000, () => {
      socket.destroy();
      console.log('   ⏱️  超时\n');
      resolve(false);
    });
    
    socket.connect(PROXY_PORT, PROXY_HOST);
  });
}

async function runTests() {
  console.log('1. 测试不同的认证方式...\n');
  let successAuth = null;
  
  for (const test of authTests) {
    const result = await testAuth(test.name, test.auth);
    if (result && !successAuth) {
      successAuth = test.auth;
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // 短暂延迟
  }
  
  console.log('\n2. 测试直接 TCP CONNECT...\n');
  await testDirectConnect();
  
  console.log('========================================');
  console.log('测试总结');
  console.log('========================================\n');
  
  if (successAuth) {
    console.log(`✅ 找到有效的认证方式: ${successAuth}`);
    console.log(`\n请使用以下格式设置环境变量:`);
    const [user, pass] = successAuth.split(':');
    console.log(`$env:HTTPS_PROXY="http://${user}:${pass}@${PROXY_HOST}:${PROXY_PORT}"`);
    console.log(`$env:HTTP_PROXY="http://${user}:${pass}@${PROXY_HOST}:${PROXY_PORT}"`);
    console.log(`$env:GEMINI_PROXY_URL="http://${user}:${pass}@${PROXY_HOST}:${PROXY_PORT}"\n`);
  } else {
    console.log('❌ 未找到有效的认证方式');
    console.log('\n可能的原因:');
    console.log('  1. 代理服务器需要特定的用户名和密码（请联系代理提供商）');
    console.log('  2. 代理服务器只允许特定的 IP 地址访问');
    console.log('  3. 代理服务器配置不正确');
    console.log('  4. 代理服务器可能需要其他认证方式（如 NTLM）\n');
    console.log('建议:');
    console.log('  - 联系代理服务提供商获取正确的认证信息');
    console.log('  - 检查代理服务器是否允许您的 IP 地址访问');
    console.log('  - 确认代理服务器类型和配置\n');
  }
  
  console.log('========================================');
}

runTests().catch(console.error);

