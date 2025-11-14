/**
 * 测试当前配置的代理连接
 * 快速诊断代理问题
 */

const { fetch, ProxyAgent } = require('undici');
require('dotenv').config({ path: '.env.local' });

const PROXY_URL = 
  process.env.GEMINI_PROXY_URL || 
  process.env.HTTPS_PROXY || 
  process.env.HTTP_PROXY || 
  null;

async function testProxy() {
  console.log('========================================');
  console.log('代理连接诊断工具');
  console.log('========================================\n');

  if (!PROXY_URL) {
    console.log('❌ 未配置代理');
    console.log('请在 .env.local 中设置以下环境变量之一:');
    console.log('  - GEMINI_PROXY_URL=http://proxy-server:port');
    console.log('  - HTTPS_PROXY=http://proxy-server:port');
    console.log('  - HTTP_PROXY=http://proxy-server:port');
    return;
  }

  console.log(`当前代理配置: ${PROXY_URL}\n`);

  // 测试 1: 基本连接测试
  console.log('测试 1: 基本 HTTP 连接...');
  try {
    const agent = new ProxyAgent(PROXY_URL);
    const response = await fetch('http://httpbin.org/ip', {
      dispatcher: agent,
      signal: AbortSignal.timeout(10000),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ HTTP 连接成功`);
      console.log(`   代理 IP: ${data.origin}\n`);
    } else {
      console.log(`⚠️  HTTP 返回状态码: ${response.status}\n`);
    }
  } catch (error) {
    console.log(`❌ HTTP 连接失败: ${error.message}\n`);
  }

  // 测试 2: HTTPS 连接测试
  console.log('测试 2: HTTPS 连接（Google）...');
  try {
    const agent = new ProxyAgent(PROXY_URL);
    const startTime = Date.now();
    const response = await fetch('https://www.google.com', {
      dispatcher: agent,
      signal: AbortSignal.timeout(15000),
    });
    const endTime = Date.now();
    
    if (response.ok) {
      console.log(`✅ HTTPS 连接成功`);
      console.log(`   响应时间: ${endTime - startTime}ms`);
      console.log(`   状态码: ${response.status}\n`);
    } else {
      console.log(`⚠️  HTTPS 返回状态码: ${response.status}\n`);
    }
  } catch (error) {
    console.log(`❌ HTTPS 连接失败: ${error.message}`);
    
    if (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED')) {
      console.log('\n可能的原因:');
      console.log('  1. 代理服务器未运行或已关闭');
      console.log('  2. 代理地址或端口错误');
      console.log('  3. 防火墙阻止了连接');
      console.log('  4. 代理服务器需要认证（用户名/密码）');
      console.log('\n解决方案:');
      console.log('  - 检查代理服务器是否正常运行');
      console.log('  - 验证代理地址和端口是否正确');
      console.log('  - 如果代理需要认证，使用格式: http://username:password@host:port');
      console.log('  - 测试代理: curl -x ' + PROXY_URL + ' https://www.google.com');
    } else if (error.message.includes('ECONNRESET') || error.message.includes('connection closed')) {
      console.log('\n可能的原因:');
      console.log('  1. 代理服务器需要认证');
      console.log('  2. 代理服务器配置限制了来源 IP');
      console.log('  3. SSL/TLS 握手失败');
      console.log('\n解决方案:');
      console.log('  - 如果代理需要认证，添加用户名和密码');
      console.log('  - 检查代理服务器日志');
      console.log('  - 确认你的 IP 地址在代理允许列表中');
    } else if (error.message.includes('timeout') || error.message.includes('AbortError')) {
      console.log('\n可能的原因:');
      console.log('  1. 代理服务器响应超时');
      console.log('  2. 网络延迟过高');
      console.log('  3. 代理服务器负载过高');
      console.log('\n解决方案:');
      console.log('  - 检查网络连接');
      console.log('  - 尝试更换代理服务器');
      console.log('  - 增加超时时间');
    }
    console.log('');
  }

  // 测试 3: Gemini API 端点测试
  console.log('测试 3: Gemini API 端点连接...');
  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    console.log('⚠️  未配置 GOOGLE_GEMINI_API_KEY，跳过此测试\n');
  } else {
    try {
      const agent = new ProxyAgent(PROXY_URL);
      const model = process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.5-flash';
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_GEMINI_API_KEY}`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'test' }],
          }],
        }),
        dispatcher: agent,
        signal: AbortSignal.timeout(15000),
      });
      
      if (response.ok) {
        console.log(`✅ Gemini API 连接成功\n`);
      } else {
        const errorText = await response.text();
        console.log(`⚠️  Gemini API 返回状态码: ${response.status}`);
        console.log(`   错误信息: ${errorText.substring(0, 200)}\n`);
      }
    } catch (error) {
      console.log(`❌ Gemini API 连接失败: ${error.message}\n`);
    }
  }

  console.log('========================================');
  console.log('诊断完成');
  console.log('========================================');
}

testProxy().catch(console.error);

