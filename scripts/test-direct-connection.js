#!/usr/bin/env node

/**
 * 测试不使用代理直接连接 Gemini API
 */

const { fetch } = require('undici');
require('dotenv').config({ path: '.env.local' });

async function testDirectConnection() {
  console.log('========================================');
  console.log('🌐 测试直接连接（不使用代理）');
  console.log('========================================\n');

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ 未配置 GOOGLE_GEMINI_API_KEY');
    console.log('   请在 .env.local 中配置 Gemini API Key\n');
    return false;
  }

  console.log('API Key: ' + apiKey.substring(0, 10) + '...\n');

  // 测试 1: 基本网络连接
  console.log('测试 1: 测试网络连接...');
  try {
    const response = await fetch('https://www.google.com', {
      signal: AbortSignal.timeout(10000),
    });
    
    if (response.ok) {
      console.log('✅ 网络连接正常\n');
    } else {
      console.log(`⚠️  返回状态码: ${response.status}\n`);
    }
  } catch (error) {
    console.log(`❌ 网络连接失败: ${error.message}`);
    console.log('   可能原因: 防火墙或网络限制\n');
    return false;
  }

  // 测试 2: Gemini API 连接
  console.log('测试 2: 测试 Gemini API 连接...');
  try {
    const model = process.env.GOOGLE_GEMINI_MODEL || 'gemini-2.0-flash-exp';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const startTime = Date.now();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: '你好，请回复"测试成功"' }],
        }],
      }),
      signal: AbortSignal.timeout(30000),
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.ok) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '无响应';
      console.log(`✅ Gemini API 连接成功`);
      console.log(`   响应时间: ${responseTime}ms`);
      console.log(`   AI 回复: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}\n`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`❌ Gemini API 返回错误`);
      console.log(`   状态码: ${response.status}`);
      console.log(`   错误信息: ${errorText.substring(0, 200)}\n`);
      
      if (response.status === 400) {
        console.log('💡 可能的原因:');
        console.log('   - API Key 无效或已过期');
        console.log('   - 模型名称错误');
        console.log('   - 请求格式有误\n');
      } else if (response.status === 403) {
        console.log('💡 可能的原因:');
        console.log('   - API Key 权限不足');
        console.log('   - API 配额已用完');
        console.log('   - 地区限制\n');
      }
      return false;
    }
  } catch (error) {
    console.log(`❌ Gemini API 连接失败: ${error.message}`);
    
    if (error.message.includes('timeout')) {
      console.log('\n💡 连接超时，可能需要代理才能访问 Google API');
      console.log('   如果在中国大陆，建议配置可用的代理服务器\n');
    } else if (error.message.includes('fetch failed')) {
      console.log('\n💡 无法连接到 Google 服务器');
      console.log('   可能原因:');
      console.log('   - 网络限制（需要代理）');
      console.log('   - DNS 解析失败');
      console.log('   - 防火墙阻止\n');
    }
    return false;
  }
}

testDirectConnection()
  .then(success => {
    console.log('========================================');
    if (success) {
      console.log('✅ 测试通过 - 可以不使用代理直接连接');
      console.log('   建议: 禁用代理配置以提升速度');
    } else {
      console.log('❌ 测试失败 - 需要配置可用的代理');
      console.log('   建议: 获取可用的代理服务器地址');
    }
    console.log('========================================');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('测试过程出错:', error);
    process.exit(1);
  });

