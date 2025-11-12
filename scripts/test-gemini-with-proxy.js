/**
 * 测试 Gemini API 调用（带代理）
 * 用于验证代理配置是否正确
 */

const { fetch, ProxyAgent } = require('undici');

const PROXY_URL = process.env.GEMINI_PROXY_URL || 
                  process.env.HTTPS_PROXY || 
                  process.env.HTTP_PROXY || 
                  'http://34.87.103.25:3128'; // 默认使用新加坡IP

const API_KEY = process.env.GOOGLE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const MODEL = process.env.GOOGLE_GEMINI_MODEL || 'gemini-1.5-flash';
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function testGeminiAPI() {
  console.log('========================================');
  console.log('Gemini API 测试（带代理）');
  console.log('========================================\n');

  // 检查 API Key
  if (!API_KEY || API_KEY === 'your-gemini-api-key') {
    console.log('❌ 错误: 未配置 GOOGLE_GEMINI_API_KEY');
    console.log('   请在环境变量中设置 API Key\n');
    return;
  }

  console.log(`API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 4)}`);
  console.log(`模型: ${MODEL}`);
  console.log(`代理: ${PROXY_URL}\n`);

  try {
    // 创建代理 agent
    const agent = new ProxyAgent(PROXY_URL);
    console.log('✅ 代理 Agent 创建成功\n');

    // 准备请求
    const requestBody = {
      contents: [
        {
          parts: [{ text: 'Hello, say hi in one sentence.' }],
        },
      ],
    };

    const apiUrl = `${API_ENDPOINT}?key=${API_KEY}`;
    console.log(`请求 URL: ${API_ENDPOINT}?key=***\n`);

    console.log('正在发送请求...\n');

    const startTime = Date.now();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      dispatcher: agent,
      signal: AbortSignal.timeout(30000), // 30秒超时
    });
    const endTime = Date.now();

    console.log(`响应状态: ${response.status} ${response.statusText}`);
    console.log(`响应时间: ${endTime - startTime}ms\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ API 调用失败');
      console.log(`错误内容: ${errorText.substring(0, 500)}\n`);
      
      if (response.status === 401) {
        console.log('可能的原因: API Key 无效或已过期');
      } else if (response.status === 403) {
        console.log('可能的原因: API Key 没有权限访问此 API');
      } else if (response.status >= 500) {
        console.log('可能的原因: Google 服务器错误');
      }
      return;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('\n')
      .trim();

    console.log('✅ API 调用成功！\n');
    console.log('响应内容:');
    console.log(text || '(无文本响应)');
    console.log('\n✅ 代理配置正常，Gemini API 可以正常使用！\n');

  } catch (error) {
    console.log('❌ 请求失败');
    console.log(`错误: ${error.message}\n`);

    if (error.name === 'AbortError') {
      console.log('可能的原因:');
      console.log('  - 请求超时（30秒）');
      console.log('  - 代理服务器响应慢');
      console.log('  - 网络连接不稳定');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('可能的原因:');
      console.log('  - 代理服务器拒绝连接');
      console.log('  - 代理地址或端口错误');
    } else if (error.message.includes('fetch failed')) {
      console.log('可能的原因:');
      console.log('  - 代理服务器不可用');
      console.log('  - SSL/TLS 握手失败');
      console.log('  - 代理服务器需要认证');
    } else {
      console.log('可能的原因:');
      console.log('  - 网络连接问题');
      console.log('  - 代理配置错误');
    }
  }

  console.log('========================================');
}

testGeminiAPI().catch(console.error);


