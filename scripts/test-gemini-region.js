/**
 * 测试 Google Gemini API 是否在新加坡地区被禁用
 * 通过代理测试 API 端点访问
 */

const { fetch, ProxyAgent } = require('undici');

const PROXY_URL = 
  process.env.GEMINI_PROXY_URL || 
  process.env.HTTPS_PROXY || 
  process.env.HTTP_PROXY || 
  'http://34.87.103.25:3128';

const MODEL = process.env.GOOGLE_GEMINI_MODEL || 'gemini-1.5-flash';
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

async function testGeminiRegion() {
  console.log('========================================');
  console.log('测试 Google Gemini API 地区限制');
  console.log('========================================\n');

  console.log(`代理地址: ${PROXY_URL}`);
  console.log(`API 端点: ${API_ENDPOINT}\n`);

  try {
    const agent = new ProxyAgent(PROXY_URL);
    console.log('✅ 代理 Agent 创建成功\n');

    // 测试 1: 检查 API 端点是否可达
    console.log('1. 测试 API 端点连接...');
    try {
      const response = await fetch(API_ENDPOINT, {
        dispatcher: agent,
        method: 'OPTIONS', // 使用 OPTIONS 方法测试端点
        signal: AbortSignal.timeout(10000),
      });
      
      console.log(`   状态码: ${response.status}`);
      if (response.status === 200 || response.status === 405) {
        console.log('   ✅ API 端点可达\n');
      } else {
        console.log(`   ⚠️  端点返回状态码: ${response.status}\n`);
      }
    } catch (error) {
      console.log(`   ❌ 端点连接失败: ${error.message}\n`);
    }

    // 测试 2: 使用无效 API Key 测试，看是否返回地理位置限制错误
    console.log('2. 测试 API 调用（使用测试 API Key）...');
    const testApiKey = 'test-key-for-region-check';
    const apiUrl = `${API_ENDPOINT}?key=${testApiKey}`;
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: 'test' }],
            },
          ],
        }),
        dispatcher: agent,
        signal: AbortSignal.timeout(15000),
      });

      const responseText = await response.text();
      console.log(`   状态码: ${response.status}`);
      
      // 检查响应中是否包含地理位置限制相关的错误信息
      const lowerResponse = responseText.toLowerCase();
      const regionKeywords = [
        'region',
        'location',
        'country',
        'geographic',
        'not available',
        'restricted',
        'blocked',
        'singapore',
        'sg',
      ];

      const hasRegionError = regionKeywords.some(keyword => 
        lowerResponse.includes(keyword)
      );

      if (hasRegionError) {
        console.log('   ⚠️  检测到可能的地区限制错误');
        console.log(`   响应内容: ${responseText.substring(0, 500)}\n`);
      } else if (response.status === 400 || response.status === 401) {
        console.log('   ✅ API 端点正常（返回认证错误是预期的）');
        console.log('   ✅ 未检测到地区限制错误\n');
      } else {
        console.log(`   响应内容: ${responseText.substring(0, 500)}\n`);
      }
    } catch (error) {
      console.log(`   ❌ 请求失败: ${error.message}\n`);
      
      if (error.message.includes('fetch failed')) {
        console.log('   可能的原因:');
        console.log('     - 代理服务器连接问题');
        console.log('     - 网络连接问题');
        console.log('     - SSL/TLS 握手失败\n');
      }
    }

    // 测试 3: 检查 Google 服务是否可访问
    console.log('3. 测试 Google 服务可访问性...');
    try {
      const response = await fetch('https://www.google.com', {
        dispatcher: agent,
        signal: AbortSignal.timeout(10000),
      });
      
      if (response.ok) {
        console.log('   ✅ Google 服务可访问\n');
      } else {
        console.log(`   ⚠️  Google 服务返回状态码: ${response.status}\n`);
      }
    } catch (error) {
      console.log(`   ❌ Google 服务访问失败: ${error.message}\n`);
    }

    // 测试 4: 检查 generativelanguage.googleapis.com 域名解析
    console.log('4. 测试 generativelanguage.googleapis.com 域名解析...');
    try {
      const response = await fetch('https://generativelanguage.googleapis.com', {
        dispatcher: agent,
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
      });
      
      console.log(`   状态码: ${response.status}`);
      if (response.status === 200 || response.status === 405 || response.status === 404) {
        console.log('   ✅ 域名可解析且可访问\n');
      } else {
        console.log(`   ⚠️  域名返回状态码: ${response.status}\n`);
      }
    } catch (error) {
      console.log(`   ❌ 域名访问失败: ${error.message}\n`);
    }

  } catch (error) {
    console.log(`❌ 测试失败: ${error.message}\n`);
  }

  console.log('========================================');
  console.log('测试总结');
  console.log('========================================\n');
  console.log('如果所有测试都通过，说明：');
  console.log('  ✅ 代理服务器工作正常');
  console.log('  ✅ Google Gemini API 端点可访问');
  console.log('  ✅ 新加坡地区未被 Google 禁用\n');
  console.log('如果测试失败，可能的原因：');
  console.log('  - 代理服务器需要认证');
  console.log('  - 代理服务器配置问题');
  console.log('  - 网络连接问题');
  console.log('  - Google 服务在新加坡地区受限\n');
}

testGeminiRegion().catch(console.error);

