/**
 * 测试 Gemini API Key 是否配置正确
 */

require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

console.log('\n=== Gemini API Key 配置检查 ===\n');

if (!apiKey) {
  console.log('❌ 未找到 NEXT_PUBLIC_GEMINI_API_KEY');
  console.log('请检查 .env.local 文件\n');
  process.exit(1);
}

if (apiKey === 'your-gemini-api-key' || apiKey === '') {
  console.log('⚠️  API Key 仍然是默认值');
  console.log('请将 API Key 替换为您的实际密钥\n');
  process.exit(1);
}

console.log('✅ API Key 已配置');
console.log(`   长度: ${apiKey.length} 字符`);
console.log(`   前4位: ${apiKey.substring(0, 4)}...`);
console.log(`   后4位: ...${apiKey.substring(apiKey.length - 4)}`);
console.log('\n✅ 配置检查通过！');
console.log('提示词增强功能将使用真实的 Gemini API\n');












