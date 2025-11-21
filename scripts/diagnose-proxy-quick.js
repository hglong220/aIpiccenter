/**
 * 快速代理诊断工具
 * 快速检测代理连接问题并提供解决方案
 */

const { fetch, ProxyAgent } = require('undici');
require('dotenv').config({ path: '.env.local' });

const PROXY_URL = 
  process.env.GEMINI_PROXY_URL || 
  process.env.HTTPS_PROXY || 
  process.env.HTTP_PROXY || 
  null;

// 提取代理信息
function parseProxyUrl(url) {
  if (!url) return null;
  const match = url.match(/:\/\/(?:([^:@]+):([^@]+)@)?([^:@]+):(\d+)/);
  if (!match) return null;
  return {
    username: match[1] || null,
    password: match[2] ? '***' : null,
    host: match[3],
    port: match[4],
    full: url,
  };
}

async function quickDiagnose() {
  console.log('========================================');
  console.log('🔍 快速代理诊断工具');
  console.log('========================================\n');

  if (!PROXY_URL) {
    console.log('❌ 未配置代理');
    console.log('\n请在 .env.local 中设置以下环境变量之一:');
    console.log('  - GEMINI_PROXY_URL=http://proxy-server:port');
    console.log('  - HTTPS_PROXY=http://proxy-server:port');
    console.log('  - HTTP_PROXY=http://proxy-server:port');
    console.log('\n如果需要认证，使用格式:');
    console.log('  - GEMINI_PROXY_URL=http://username:password@proxy-server:port');
    return;
  }

  const proxyInfo = parseProxyUrl(PROXY_URL);
  console.log('📋 当前代理配置:');
  console.log(`   完整URL: ${PROXY_URL}`);
  if (proxyInfo) {
    console.log(`   服务器: ${proxyInfo.host}:${proxyInfo.port}`);
    if (proxyInfo.username) {
      console.log(`   认证: ${proxyInfo.username}:${proxyInfo.password}`);
    } else {
      console.log(`   认证: 无`);
    }
  }
  console.log('');

  // 测试 1: 基本连接测试（快速）
  console.log('🔌 测试 1: 基本连接测试（5秒超时）...');
  try {
    const agent = new ProxyAgent(PROXY_URL);
    const startTime = Date.now();
    const response = await fetch('http://httpbin.org/ip', {
      dispatcher: agent,
      signal: AbortSignal.timeout(5000),
    });
    const endTime = Date.now();
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ 连接成功！`);
      console.log(`   响应时间: ${endTime - startTime}ms`);
      console.log(`   代理IP: ${data.origin}\n`);
    } else {
      console.log(`⚠️  连接成功但返回错误状态码: ${response.status}\n`);
    }
  } catch (error) {
    const errorMsg = error.message || String(error);
    console.log(`❌ 连接失败: ${errorMsg}\n`);
    
    // 提供针对性的诊断建议
    if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('fetch failed')) {
      console.log('💡 诊断建议:');
      console.log('   1. 代理服务器可能未运行或已关闭');
      console.log('   2. 代理地址或端口可能错误');
      console.log('   3. 防火墙可能阻止了连接');
      console.log('   4. 代理可能需要认证（用户名/密码）');
      console.log('');
      console.log('🔧 解决方案:');
      if (proxyInfo && !proxyInfo.username) {
        console.log(`   - 如果代理需要认证，使用格式:`);
        console.log(`     GEMINI_PROXY_URL=http://user:pass@${proxyInfo.host}:${proxyInfo.port}`);
      }
      console.log(`   - 测试代理服务器: Test-NetConnection -ComputerName ${proxyInfo?.host || 'N/A'} -Port ${proxyInfo?.port || 'N/A'}`);
      console.log(`   - 使用curl测试: curl -x ${PROXY_URL} https://www.google.com`);
      console.log(`   - 检查代理服务器是否正常运行`);
    } else if (errorMsg.includes('timeout') || errorMsg.includes('AbortError')) {
      console.log('💡 诊断建议:');
      console.log('   1. 代理服务器响应超时');
      console.log('   2. 网络延迟过高');
      console.log('   3. 代理服务器负载过高');
      console.log('');
      console.log('🔧 解决方案:');
      console.log('   - 检查网络连接');
      console.log('   - 尝试更换代理服务器');
      console.log('   - 检查代理服务器状态');
    } else if (errorMsg.includes('ECONNRESET')) {
      console.log('💡 诊断建议:');
      console.log('   1. 代理服务器需要认证');
      console.log('   2. 代理服务器配置限制了来源IP');
      console.log('   3. SSL/TLS握手失败');
      console.log('');
      console.log('🔧 解决方案:');
      if (proxyInfo && !proxyInfo.username) {
        console.log(`   - 添加认证信息: GEMINI_PROXY_URL=http://user:pass@${proxyInfo.host}:${proxyInfo.port}`);
      }
      console.log('   - 检查代理服务器日志');
      console.log('   - 确认你的IP地址在代理允许列表中');
    }
    console.log('');
  }

  // 测试 2: HTTPS连接测试（如果基本测试成功）
  console.log('🌐 测试 2: HTTPS连接测试（Google）...');
  try {
    const agent = new ProxyAgent(PROXY_URL);
    const startTime = Date.now();
    const response = await fetch('https://www.google.com', {
      dispatcher: agent,
      signal: AbortSignal.timeout(10000),
    });
    const endTime = Date.now();
    
    if (response.ok) {
      console.log(`✅ HTTPS连接成功！`);
      console.log(`   响应时间: ${endTime - startTime}ms`);
      console.log(`   状态码: ${response.status}\n`);
      console.log('🎉 代理配置正常，可以正常使用！\n');
    } else {
      console.log(`⚠️  HTTPS连接成功但返回状态码: ${response.status}\n`);
    }
  } catch (error) {
    const errorMsg = error.message || String(error);
    console.log(`❌ HTTPS连接失败: ${errorMsg}\n`);
  }

  console.log('========================================');
  console.log('📝 诊断完成');
  console.log('========================================');
  console.log('\n💡 提示:');
  console.log('   - 如果所有测试都失败，请检查代理服务器状态');
  console.log('   - 如果代理需要认证，确保在URL中包含用户名和密码');
  console.log('   - 如果网络允许，可以临时禁用代理进行测试');
  console.log('   - 查看详细日志: node scripts/test-current-proxy.js');
}

quickDiagnose().catch(console.error);

