/**
 * 自动修复代理连接问题
 * 检测代理是否可用，如果不可用则自动禁用代理配置
 */

const fs = require('fs');
const path = require('path');
const { fetch, ProxyAgent } = require('undici');
require('dotenv').config({ path: '.env.local' });

// 获取代理URL
function getProxyUrl() {
  return (
    process.env.GEMINI_PROXY_URL ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    null
  );
}

// 测试代理连接
async function testProxyConnection(proxyUrl, timeout = 5000) {
  try {
    const agent = new ProxyAgent(proxyUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch('http://httpbin.org/ip', {
      dispatcher: agent,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function autoFixProxy() {
  console.log('========================================');
  console.log('🔧 自动代理修复工具');
  console.log('========================================\n');

  const envFile = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envFile)) {
    console.log('❌ 未找到 .env.local 文件');
    console.log('   请先创建 .env.local 文件');
    return;
  }

  // 读取当前配置
  let content = fs.readFileSync(envFile, 'utf-8');
  const proxyUrl = getProxyUrl();

  if (!proxyUrl) {
    console.log('✅ 未配置代理，无需修复');
    return;
  }

  console.log(`📋 当前代理配置: ${proxyUrl}\n`);

  // 测试代理连接
  console.log('🔌 正在测试代理连接（5秒超时）...');
  const isAvailable = await testProxyConnection(proxyUrl, 5000);

  if (isAvailable) {
    console.log('✅ 代理连接正常，无需修复\n');
    return;
  }

  console.log('❌ 代理连接失败\n');
  console.log('💡 检测到代理服务器不可用，建议禁用代理配置');
  console.log('   如果您的网络可以直接访问 Google API，可以禁用代理\n');

  // 询问是否自动禁用
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('是否自动禁用代理配置？(y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        // 注释掉所有代理配置
        const newContent = content
          .split('\n')
          .map(line => {
            if (line.match(/^\s*(GEMINI_PROXY_URL|HTTPS_PROXY|HTTP_PROXY)=/)) {
              return `# ${line.trim()} # Auto-disabled: proxy connection failed`;
            }
            return line;
          })
          .join('\n');

        fs.writeFileSync(envFile, newContent, 'utf-8');
        
        console.log('\n✅ 代理配置已自动禁用（已注释）');
        console.log('   请重启开发服务器以使更改生效');
        console.log('   如果网络允许，现在应该可以直接访问 Google API\n');
      } else {
        console.log('\n⚠️  代理配置保持不变');
        console.log('   如果代理持续失败，请手动检查代理服务器状态\n');
      }
      
      rl.close();
      resolve();
    });
  });
}

// 如果直接运行此脚本
if (require.main === module) {
  autoFixProxy().catch(console.error);
}

module.exports = { autoFixProxy };

