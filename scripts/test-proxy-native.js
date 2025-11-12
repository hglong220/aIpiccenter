/**
 * 使用原生 Node.js 模块测试代理连接
 * 用于诊断 undici ProxyAgent 无法连接的问题
 */

const http = require('http');
const https = require('https');
const net = require('net');
const { URL } = require('url');

const PROXY_URL = 
  process.env.GEMINI_PROXY_URL || 
  process.env.HTTPS_PROXY || 
  process.env.HTTP_PROXY || 
  'http://34.87.103.25:3128';

// 解析代理 URL
const proxyUrl = new URL(PROXY_URL);
const PROXY_HOST = proxyUrl.hostname;
const PROXY_PORT = parseInt(proxyUrl.port || '3128');
const PROXY_AUTH = proxyUrl.username && proxyUrl.password 
  ? Buffer.from(`${proxyUrl.username}:${proxyUrl.password}`).toString('base64')
  : null;

console.log('========================================');
console.log('原生 Node.js 代理测试');
console.log('========================================\n');
console.log(`代理地址: ${PROXY_URL}`);
console.log(`代理主机: ${PROXY_HOST}`);
console.log(`代理端口: ${PROXY_PORT}`);
console.log(`需要认证: ${PROXY_AUTH ? '是' : '否'}\n`);

// 测试 1: TCP 连接
function testTcpConnection() {
  return new Promise((resolve) => {
    console.log('1. 测试 TCP 连接...');
    const socket = new net.Socket();
    socket.setTimeout(5000);
    
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
    
    socket.connect(PROXY_PORT, PROXY_HOST);
  });
}

// 测试 2: HTTP CONNECT 方法（用于 HTTPS 代理）
function testHttpConnect() {
  return new Promise((resolve) => {
    console.log('2. 测试 HTTP CONNECT 方法...');
    
    const connectOptions = {
      hostname: PROXY_HOST,
      port: PROXY_PORT,
      method: 'CONNECT',
      path: 'www.google.com:443',
      headers: {},
    };
    
    if (PROXY_AUTH) {
      connectOptions.headers['Proxy-Authorization'] = `Basic ${PROXY_AUTH}`;
    }
    
    const req = http.request(connectOptions);
    
    req.on('connect', (res, socket, head) => {
      console.log(`   ✅ CONNECT 成功，状态码: ${res.statusCode}`);
      socket.destroy();
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ CONNECT 失败: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log('   ❌ CONNECT 超时');
      resolve(false);
    });
    
    req.end();
  });
}

// 测试 3: HTTP GET 通过代理
function testHttpProxy() {
  return new Promise((resolve) => {
    console.log('3. 测试 HTTP GET 通过代理...');
    
    const options = {
      hostname: PROXY_HOST,
      port: PROXY_PORT,
      method: 'GET',
      path: 'http://httpbin.org/ip',
      headers: {},
    };
    
    if (PROXY_AUTH) {
      options.headers['Proxy-Authorization'] = `Basic ${PROXY_AUTH}`;
    }
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`   ✅ HTTP GET 成功，状态码: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log(`   ✅ 代理 IP: ${json.origin}\n`);
        } catch (e) {
          console.log(`   响应: ${data.substring(0, 200)}\n`);
        }
        resolve(true);
      });
    });
    
    req.on('error', (err) => {
      console.log(`   ❌ HTTP GET 失败: ${err.message}\n`);
      resolve(false);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log('   ❌ HTTP GET 超时\n');
      resolve(false);
    });
    
    req.end();
  });
}

// 测试 4: HTTPS 通过代理
function testHttpsProxy() {
  return new Promise((resolve) => {
    console.log('4. 测试 HTTPS 通过代理（使用 CONNECT）...');
    
    // 首先建立 CONNECT 隧道
    const connectOptions = {
      hostname: PROXY_HOST,
      port: PROXY_PORT,
      method: 'CONNECT',
      path: 'httpbin.org:443',
      headers: {},
    };
    
    if (PROXY_AUTH) {
      connectOptions.headers['Proxy-Authorization'] = `Basic ${PROXY_AUTH}`;
    }
    
    const connectReq = http.request(connectOptions);
    
    connectReq.on('connect', (res, socket, head) => {
      if (res.statusCode === 200) {
        console.log(`   ✅ CONNECT 隧道建立成功`);
        
        // 通过隧道发送 HTTPS 请求
        const httpsOptions = {
          hostname: 'httpbin.org',
          port: 443,
          path: '/ip',
          method: 'GET',
        };
        
        const httpsReq = https.request(httpsOptions, (httpsRes) => {
          let data = '';
          httpsRes.on('data', (chunk) => { data += chunk; });
          httpsRes.on('end', () => {
            console.log(`   ✅ HTTPS 请求成功，状态码: ${httpsRes.statusCode}`);
            try {
              const json = JSON.parse(data);
              console.log(`   ✅ 代理 IP: ${json.origin}\n`);
            } catch (e) {
              console.log(`   响应: ${data.substring(0, 200)}\n`);
            }
            socket.destroy();
            resolve(true);
          });
        });
        
        httpsReq.on('error', (err) => {
          console.log(`   ❌ HTTPS 请求失败: ${err.message}\n`);
          socket.destroy();
          resolve(false);
        });
        
        httpsReq.setTimeout(10000, () => {
          httpsReq.destroy();
          socket.destroy();
          console.log('   ❌ HTTPS 请求超时\n');
          resolve(false);
        });
        
        httpsReq.end();
      } else {
        console.log(`   ❌ CONNECT 失败，状态码: ${res.statusCode}\n`);
        socket.destroy();
        resolve(false);
      }
    });
    
    connectReq.on('error', (err) => {
      console.log(`   ❌ CONNECT 错误: ${err.message}\n`);
      resolve(false);
    });
    
    connectReq.setTimeout(10000, () => {
      connectReq.destroy();
      console.log('   ❌ CONNECT 超时\n');
      resolve(false);
    });
    
    connectReq.end();
  });
}

async function runTests() {
  const results = {
    tcp: await testTcpConnection(),
    connect: await testHttpConnect(),
    http: await testHttpProxy(),
    https: await testHttpsProxy(),
  };
  
  console.log('========================================');
  console.log('测试结果汇总');
  console.log('========================================\n');
  console.log(`TCP 连接:     ${results.tcp ? '✅ 成功' : '❌ 失败'}`);
  console.log(`HTTP CONNECT: ${results.connect ? '✅ 成功' : '❌ 失败'}`);
  console.log(`HTTP GET:     ${results.http ? '✅ 成功' : '❌ 失败'}`);
  console.log(`HTTPS:        ${results.https ? '✅ 成功' : '❌ 失败'}\n`);
  
  if (results.tcp && !results.connect) {
    console.log('诊断: TCP 连接成功，但 CONNECT 方法失败');
    console.log('可能的原因:');
    console.log('  - 代理服务器不支持 CONNECT 方法');
    console.log('  - 代理服务器需要认证');
    console.log('  - 代理服务器配置错误\n');
  } else if (results.tcp && results.connect && !results.https) {
    console.log('诊断: CONNECT 成功，但 HTTPS 请求失败');
    console.log('可能的原因:');
    console.log('  - SSL/TLS 握手失败');
    console.log('  - 证书验证问题\n');
  } else if (results.tcp && results.connect && results.https) {
    console.log('✅ 代理服务器工作正常！');
    console.log('undici ProxyAgent 可能无法使用此代理的原因:');
    console.log('  - undici 的 ProxyAgent 实现可能有问题');
    console.log('  - 可能需要更新 undici 版本');
    console.log('  - 可能需要使用其他代理库\n');
  }
  
  console.log('========================================');
}

runTests().catch(console.error);

