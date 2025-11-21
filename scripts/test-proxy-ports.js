/**
 * 测试代理服务器的常见端口
 * 帮助找到正确的代理端口
 */

const { fetch, ProxyAgent } = require('undici');

const PROXY_HOST = '47.79.137.153';
const COMMON_PORTS = [3128, 8080, 1080, 7890, 8888, 10808, 10809, 1080, 8118, 8123];

async function testPort(host, port) {
  const proxyUrl = `http://${host}:${port}`;
  
  try {
    const agent = new ProxyAgent(proxyUrl);
    const response = await fetch('http://httpbin.org/ip', {
      dispatcher: agent,
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, proxyIp: data.origin };
    }
    return { success: false, error: `HTTP ${response.status}` };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testAllPorts() {
  console.log('========================================');
  console.log('代理端口扫描工具');
  console.log('========================================\n');
  console.log(`测试服务器: ${PROXY_HOST}`);
  console.log(`测试端口: ${COMMON_PORTS.join(', ')}\n`);
  console.log('正在扫描...\n');

  const results = [];

  for (const port of COMMON_PORTS) {
    process.stdout.write(`测试端口 ${port}... `);
    const result = await testPort(PROXY_HOST, port);
    
    if (result.success) {
      console.log(`✅ 成功！代理IP: ${result.proxyIp}`);
      results.push({ port, success: true, proxyIp: result.proxyIp });
    } else {
      console.log(`❌ 失败: ${result.error}`);
    }
  }

  console.log('\n========================================');
  console.log('扫描结果');
  console.log('========================================\n');

  if (results.length === 0) {
    console.log('❌ 未找到可用的代理端口\n');
    console.log('可能的原因:');
    console.log('1. 代理服务未运行');
    console.log('2. 防火墙阻止了连接');
    console.log('3. 代理端口不在常见端口列表中');
    console.log('4. 代理需要认证');
    console.log('\n建议:');
    console.log('- 检查服务器上是否运行了代理服务');
    console.log('- 检查防火墙规则是否允许这些端口');
    console.log('- 联系服务器管理员确认代理端口');
  } else {
    console.log('✅ 找到以下可用的代理端口:\n');
    results.forEach(({ port, proxyIp }) => {
      console.log(`  端口 ${port}: http://${PROXY_HOST}:${port}`);
      console.log(`  代理IP: ${proxyIp}\n`);
    });
    console.log('\n请在 .env.local 中配置:');
    console.log(`GEMINI_PROXY_URL=http://${PROXY_HOST}:${results[0].port}`);
  }
}

testAllPorts().catch(console.error);

