/**
 * 详细代理测试脚本
 * 测试多种连接方式以诊断问题
 */

const { fetch, ProxyAgent } = require('undici');
const net = require('net');
const http = require('http');

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

async function testTcpConnection() {
  return new Promise((resolve) => {
    console.log('1. 测试 TCP 连接...');
    const socket = new net.Socket();
    const timeout = 5000;

    socket.setTimeout(timeout);
    
    socket.once('connect', () => {
      socket.destroy();
      console.log('   ✅ TCP 连接成功\n');
      resolve(true);
    });

    socket.once('timeout', () => {
      socket.destroy();
      console.log('   ❌ TCP 连接超时\n');
      resolve(false);
    });

    socket.once('error', (err) => {
      console.log(`   ❌ TCP 连接错误: ${err.message}\n`);
      resolve(false);
    });

    try {
      socket.connect(PROXY_PORT, PROXY_HOST);
    } catch (err) {
      console.log(`   ❌ 连接失败: ${err.message}\n`);
      resolve(false);
    }
  });
}

async function testHttpProxy() {
  console.log('2. 测试 HTTP 代理（使用 undici ProxyAgent）...');
  try {
    const agent = new ProxyAgent(PROXY_URL);
    const startTime = Date.now();
    
    const response = await fetch('http://httpbin.org/ip', {
      dispatcher: agent,
      signal: AbortSignal.timeout(10000),
    });
    
    const endTime = Date.now();
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ HTTP 代理连接成功`);
      console.log(`   ✅ 状态码: ${response.status}`);
      console.log(`   ✅ 响应时间: ${endTime - startTime}ms`);
      console.log(`   ✅ 响应 IP: ${data.origin}\n`);
      return true;
    } else {
      console.log(`   ⚠️  HTTP 代理返回错误状态码: ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ HTTP 代理连接失败: ${error.message}`);
    console.log(`   ❌ 错误类型: ${error.name || error.constructor.name}\n`);
    return false;
  }
}

async function testHttpsProxy() {
  console.log('3. 测试 HTTPS 代理（使用 undici ProxyAgent）...');
  try {
    const agent = new ProxyAgent(PROXY_URL);
    const startTime = Date.now();
    
    const response = await fetch('https://httpbin.org/ip', {
      dispatcher: agent,
      signal: AbortSignal.timeout(10000),
    });
    
    const endTime = Date.now();
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ HTTPS 代理连接成功`);
      console.log(`   ✅ 状态码: ${response.status}`);
      console.log(`   ✅ 响应时间: ${endTime - startTime}ms`);
      console.log(`   ✅ 响应 IP: ${data.origin}\n`);
      return true;
    } else {
      console.log(`   ⚠️  HTTPS 代理返回错误状态码: ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ HTTPS 代理连接失败: ${error.message}`);
    console.log(`   ❌ 错误类型: ${error.name || error.constructor.name}\n`);
    return false;
  }
}

async function testGoogleApi() {
  console.log('4. 测试 Google API 端点连接...');
  try {
    const agent = new ProxyAgent(PROXY_URL);
    const startTime = Date.now();
    
    const response = await fetch('https://generativelanguage.googleapis.com', {
      dispatcher: agent,
      signal: AbortSignal.timeout(10000),
      method: 'HEAD',
    });
    
    const endTime = Date.now();
    
    if (response.ok || response.status === 405) {
      console.log(`   ✅ Google API 端点可达`);
      console.log(`   ✅ 状态码: ${response.status}`);
      console.log(`   ✅ 响应时间: ${endTime - startTime}ms\n`);
      return true;
    } else {
      console.log(`   ⚠️  Google API 端点返回状态码: ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Google API 端点连接失败: ${error.message}\n`);
    return false;
  }
}

async function testDirectConnection() {
  console.log('5. 测试直接连接（不使用代理）...');
  try {
    const startTime = Date.now();
    
    const response = await fetch('https://httpbin.org/ip', {
      signal: AbortSignal.timeout(10000),
    });
    
    const endTime = Date.now();
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ 直接连接成功`);
      console.log(`   ✅ 状态码: ${response.status}`);
      console.log(`   ✅ 响应时间: ${endTime - startTime}ms`);
      console.log(`   ✅ 响应 IP: ${data.origin}\n`);
      return true;
    } else {
      console.log(`   ⚠️  直接连接返回错误状态码: ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ 直接连接失败: ${error.message}\n`);
    return false;
  }
}

async function runTests() {
  console.log('========================================');
  console.log('详细代理诊断测试');
  console.log('========================================\n');
  console.log(`代理地址: ${PROXY_URL}`);
  console.log(`代理主机: ${PROXY_HOST}`);
  console.log(`代理端口: ${PROXY_PORT}\n`);

  const results = {
    tcp: await testTcpConnection(),
    http: await testHttpProxy(),
    https: await testHttpsProxy(),
    google: await testGoogleApi(),
    direct: await testDirectConnection(),
  };

  console.log('========================================');
  console.log('测试结果汇总');
  console.log('========================================\n');
  console.log(`TCP 连接:        ${results.tcp ? '✅ 成功' : '❌ 失败'}`);
  console.log(`HTTP 代理:       ${results.http ? '✅ 成功' : '❌ 失败'}`);
  console.log(`HTTPS 代理:      ${results.https ? '✅ 成功' : '❌ 失败'}`);
  console.log(`Google API:      ${results.google ? '✅ 成功' : '❌ 失败'}`);
  console.log(`直接连接:        ${results.direct ? '✅ 成功' : '❌ 失败'}`);
  console.log('');

  // 分析结果
  if (results.tcp && !results.http && !results.https) {
    console.log('诊断: TCP 连接成功，但 HTTP/HTTPS 代理失败');
    console.log('可能的原因:');
    console.log('  1. 代理服务器需要认证（用户名/密码）');
    console.log('  2. 代理服务器不支持 CONNECT 方法');
    console.log('  3. 代理服务器配置错误');
    console.log('  4. SSL/TLS 握手失败');
  } else if (!results.tcp) {
    console.log('诊断: TCP 连接失败');
    console.log('可能的原因:');
    console.log('  1. 防火墙阻止连接');
    console.log('  2. 代理服务器未运行');
    console.log('  3. 网络不可达');
  } else if (results.http && !results.https) {
    console.log('诊断: HTTP 代理成功，但 HTTPS 代理失败');
    console.log('可能的原因:');
    console.log('  1. 代理服务器不支持 HTTPS');
    console.log('  2. SSL/TLS 证书问题');
  } else if (results.http && results.https) {
    console.log('✅ 代理配置正常，可以正常使用！');
  }

  console.log('\n========================================');
}

runTests().catch(console.error);


