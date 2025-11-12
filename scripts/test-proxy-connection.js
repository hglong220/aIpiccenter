/**
 * 测试代理连接脚本
 * 验证代理服务器是否可以正常连接
 * 
 * 使用方法:
 *   - 设置环境变量: $env:HTTPS_PROXY="http://34.87.103.25:3128"
 *   - 运行: npm run test-proxy
 */

const { fetch, ProxyAgent } = require('undici');

// 从环境变量读取代理配置，如果没有则使用默认值
const PROXY_URL = 
  process.env.GEMINI_PROXY_URL || 
  process.env.HTTPS_PROXY || 
  process.env.HTTP_PROXY || 
  'http://34.87.103.25:3128'; // 默认使用新加坡IP

const TEST_URL = 'https://www.google.com';

async function testProxy() {
  console.log('========================================');
  console.log('代理连接测试');
  console.log('========================================\n');

  console.log(`代理地址: ${PROXY_URL}`);
  console.log(`测试 URL: ${TEST_URL}\n`);

  // 先测试 HTTP 连接
  console.log('1. 测试 HTTP 连接（不使用 HTTPS）...');
  try {
    const agent = new ProxyAgent(PROXY_URL);
    const startTime = Date.now();
    const httpResponse = await fetch('http://httpbin.org/ip', {
      dispatcher: agent,
      signal: AbortSignal.timeout(10000),
    });
    const endTime = Date.now();
    
    if (httpResponse.ok) {
      const data = await httpResponse.json();
      console.log(`   ✅ HTTP 代理连接成功！`);
      console.log(`   状态码: ${httpResponse.status}`);
      console.log(`   响应时间: ${endTime - startTime}ms`);
      console.log(`   代理 IP: ${data.origin}\n`);
    } else {
      console.log(`   ⚠️  HTTP 代理返回错误状态码: ${httpResponse.status}\n`);
    }
  } catch (error) {
    console.log(`   ❌ HTTP 代理连接失败: ${error.message}\n`);
  }

  // 再测试 HTTPS 连接
  console.log('2. 测试 HTTPS 连接...');
  try {
    // 创建代理 agent
    const agent = new ProxyAgent(PROXY_URL);
    
    console.log('正在测试 HTTPS 代理连接...\n');

    const startTime = Date.now();
    const response = await fetch(TEST_URL, {
      dispatcher: agent,
      signal: AbortSignal.timeout(15000), // 15秒超时
    });
    const endTime = Date.now();

    if (response.ok) {
      console.log('   ✅ HTTPS 代理连接成功！');
      console.log(`   状态码: ${response.status}`);
      console.log(`   响应时间: ${endTime - startTime}ms\n`);
      console.log('✅ 代理配置正常，可以正常访问 Google API。');
    } else {
      console.log(`   ⚠️  HTTPS 代理返回错误状态码: ${response.status}`);
    }
  } catch (error) {
    console.log('   ❌ HTTPS 代理连接失败！');
    console.log(`   错误: ${error.message}\n`);
    
    if (error.name === 'AbortError') {
      console.log('可能的原因:');
      console.log('  - 代理服务器响应超时');
      console.log('  - 网络连接问题');
      console.log('  - 代理服务器可能需要认证');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('可能的原因:');
      console.log('  - 代理服务器未运行');
      console.log('  - 代理地址或端口错误');
    } else if (error.message.includes('fetch failed') || error.message.includes('ECONNRESET')) {
      console.log('可能的原因:');
      console.log('  - 代理服务器需要认证（用户名/密码）');
      console.log('  - 代理服务器不支持 HTTPS CONNECT 方法');
      console.log('  - SSL/TLS 握手失败');
      console.log('  - 代理服务器配置错误');
      console.log('\n建议:');
      console.log('  如果代理需要认证，请使用格式:');
      console.log('  http://username:password@34.87.103.25:3128');
    } else {
      console.log('可能的原因:');
      console.log('  - 代理服务器不可用');
      console.log('  - 网络防火墙阻止连接');
      console.log('  - 代理服务器配置错误');
    }
  }

  console.log('\n========================================');
}

// 运行测试
testProxy().catch(console.error);


