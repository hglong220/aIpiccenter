#!/usr/bin/env node

/**
 * 快速禁用代理配置
 * 自动注释掉 .env.local 中的代理配置
 */

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(process.cwd(), '.env.local');

console.log('========================================');
console.log('🔧 快速禁用代理配置');
console.log('========================================\n');

// 检查 .env.local 是否存在
if (!fs.existsSync(ENV_FILE)) {
  console.log('❌ 找不到 .env.local 文件');
  console.log('   请确保在项目根目录运行此脚本\n');
  process.exit(1);
}

// 读取文件内容
let content = fs.readFileSync(ENV_FILE, 'utf8');
let modified = false;

// 备份原文件
const backupFile = `${ENV_FILE}.backup.${Date.now()}`;
fs.writeFileSync(backupFile, content);
console.log(`✅ 已备份原配置到: ${path.basename(backupFile)}\n`);

// 代理配置变量列表
const proxyVars = [
  'GEMINI_PROXY_URL',
  'HTTPS_PROXY',
  'HTTP_PROXY',
  'http_proxy',
  'https_proxy'
];

// 注释掉所有代理配置
proxyVars.forEach(varName => {
  // 匹配未注释的代理配置行
  const regex = new RegExp(`^(${varName}=.*)$`, 'gm');
  if (regex.test(content)) {
    content = content.replace(regex, '# $1');
    console.log(`✅ 已禁用: ${varName}`);
    modified = true;
  }
});

if (!modified) {
  console.log('ℹ️  没有找到活动的代理配置（可能已经被禁用）\n');
  fs.unlinkSync(backupFile); // 删除备份
} else {
  // 写入修改后的内容
  fs.writeFileSync(ENV_FILE, content);
  console.log('\n✅ 代理配置已禁用\n');
  console.log('📝 下一步:');
  console.log('   1. 重启开发服务器');
  console.log('   2. 测试应用是否正常工作');
  console.log('   3. 如果需要恢复，运行: cp ' + path.basename(backupFile) + ' .env.local\n');
}

console.log('========================================');
console.log('完成');
console.log('========================================');

