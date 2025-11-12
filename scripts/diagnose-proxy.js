/**
 * 代理诊断脚本
 * 详细诊断代理连接问题
 */

const { fetch, ProxyAgent } = require('undici');
const net = require('net');

// 从环境变量读取代理配置，如果没有则使用默认值
const PROXY_URL = 
  process.env.GEMINI_PROXY_URL || 
  process.env.HTTPS_PROXY || 
  process.env.HTTP_PROXY || 
  'http://34.87.103.25:3128'; // 默认使用新加坡IP

// 解析代理URL以获取主机和端口
const proxyMatch = PROXY_URL.match(/^https?:\/\/([^:]+):(\d+)/);
const PROXY_HOST = proxyMatch ? proxyMatch[1] : '34.87.103.25';
const PROXY_PORT = proxyMatch ? parseInt(proxyMatch[2]) : 3128;

async function testTcpConnection(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = 5000;

    socket.setTimeout(timeout);
    
    socket.once('connect', () => {
      socket.destroy();
      resolve({ success: true, message: 'TCP 连接成功' });
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve({ success: false, message: 'TCP 连接超时' });
    });

    socket.once('error', (err) => {
      resolve({ success: false, message: `TCP 连接错误: ${err.message}` });
    });

    try {
      socket.connect(port, host);
    } catch (err) {
      resolve({ success: false, message: `连接失败: ${err.message}` });
    }
  });
}

async function testHttpProxy() {
  console.log('========================================');
  console.log('代理诊断工具');
  console.log('========================================\n');

  console.log(`代理地址: ${PROXY_URL}`);
  console.log(`代理主机: ${PROXY_HOST}`);
  console.log(`代理端口: ${PROXY_PORT}\n`);

  // 1. 测试 TCP 连接
  console.log('1. 测试 TCP 连接...');
  const tcpResult = await testTcpConnection(PROXY_HOST, PROXY_PORT);
  if (tcpResult.success) {
    console.log(`   ✅ ${tcpResult.message}\n`);
  } else {
    console.log(`   ❌ ${tcpResult.message}\n`);
    console.log('   可能的原因:');
    console.log('     - 代理服务器未运行');
    console.log('     - 防火墙阻止连接');
    console.log('     - 网络不可达');
    console.log('     - 端口被占用或关闭\n');
    return;
  }

  // 2. 测试 HTTP 代理
  console.log('2. 测试 HTTP 代理连接...');
  try {
    const agent = new ProxyAgent(PROXY_URL);
    const startTime = Date.now();
    
    const response = await fetch('https://www.google.com', {
      dispatcher: agent,
      signal: AbortSignal.timeout(10000),
    });
    
    const endTime = Date.now();
    
    if (response.ok) {
      console.log(`   ✅ HTTP 代理连接成功`);
      console.log(`   ✅ 状态码: ${response.status}`);
      console.log(`   ✅ 响应时间: ${endTime - startTime}ms\n`);
      console.log('✅ 代理配置正常，可以正常使用！\n');
    } else {
      console.log(`   ⚠️  HTTP 代理返回错误状态码: ${response.status}\n`);
    }
  } catch (error) {
    console.log(`   ❌ HTTP 代理连接失败: ${error.message}\n`);
    console.log('   可能的原因:');
    console.log('     - 代理服务器需要认证');
    console.log('     - 代理服务器配置错误');
    console.log('     - SSL/TLS 握手失败');
    console.log('     - 代理服务器不支持 HTTPS 连接\n');
  }

  // 3. 测试 Gemini API 端点
  console.log('3. 测试 Gemini API 端点连接...');
  try {
    const agent = new ProxyAgent(PROXY_URL);
    const startTime = Date.now();
    
    const response = await fetch('https://generativelanguage.googleapis.com', {
      dispatcher: agent,
      signal: AbortSignal.timeout(10000),
      method: 'HEAD',
    });
    
    const endTime = Date.now();
    
    if (response.ok || response.status === 405) { // 405 Method Not Allowed 也算成功
      console.log(`   ✅ Gemini API 端点可达`);
      console.log(`   ✅ 状态码: ${response.status}`);
      console.log(`   ✅ 响应时间: ${endTime - startTime}ms\n`);
    } else {
      console.log(`   ⚠️  Gemini API 端点返回状态码: ${response.status}\n`);
    }
  } catch (error) {
    console.log(`   ❌ Gemini API 端点连接失败: ${error.message}\n`);
  }

  console.log('========================================');
  console.log('诊断完成');
  console.log('========================================\n');

  console.log('建议:');
  console.log('1. 如果 TCP 连接失败，请联系代理服务提供商');
  console.log('2. 如果 HTTP 代理失败但 TCP 成功，检查代理配置');
  console.log('3. 确保代理服务器支持 HTTPS 连接');
  console.log('4. 检查防火墙和网络设置\n');
}

testHttpProxy().catch(console.error);


