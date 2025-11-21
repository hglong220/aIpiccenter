/**
 * 检查代理配置脚本
 * 用于诊断代理环境变量是否正确设置
 */

console.log('========================================');
console.log('代理配置检查');
console.log('========================================\n');

// 检查环境变量
const envVars = {
  'GEMINI_PROXY_URL': process.env.GEMINI_PROXY_URL,
  'HTTPS_PROXY': process.env.HTTPS_PROXY,
  'HTTP_PROXY': process.env.HTTP_PROXY,
  'GOOGLE_GEMINI_API_KEY': process.env.GOOGLE_GEMINI_API_KEY ? '已设置' : '未设置',
};

console.log('环境变量状态:');
Object.entries(envVars).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  console.log(`  ${status} ${key}: ${value || '未设置'}`);
});

// 检查代理 URL
const proxyUrl = process.env.GEMINI_PROXY_URL || 
                 process.env.HTTPS_PROXY || 
                 process.env.HTTP_PROXY;

console.log('\n代理配置:');
if (proxyUrl) {
  console.log(`  ✅ 代理 URL: ${proxyUrl}`);
  console.log(`  ✅ 代理地址: ${proxyUrl.replace(/^https?:\/\//, '')}`);
} else {
  console.log('  ❌ 未检测到代理配置');
  console.log('\n解决方案:');
  console.log('  1. 使用启动脚本: npm run dev:proxy');
  console.log('  2. 或手动设置环境变量:');
  console.log('     Windows PowerShell:');
  console.log('       $env:HTTPS_PROXY="http://35.220.189.112:3128"');
  console.log('       $env:HTTP_PROXY="http://35.220.189.112:3128"');
  console.log('       $env:GEMINI_PROXY_URL="http://35.220.189.112:3128"');
  console.log('     Linux/Mac:');
  console.log('       export HTTPS_PROXY="http://35.220.189.112:3128"');
  console.log('       export HTTP_PROXY="http://35.220.189.112:3128"');
  console.log('       export GEMINI_PROXY_URL="http://35.220.189.112:3128"');
}

console.log('\n========================================');
console.log('检查完成');
console.log('========================================\n');


