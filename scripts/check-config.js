/**
 * Configuration Check Script
 * 
 * 检查环境变量配置是否完整
 */

const fs = require('fs')
const path = require('path')

const requiredEnvVars = {
  // 数据库
  DATABASE_URL: 'PostgreSQL 数据库连接字符串',
  
  // JWT
  JWT_SECRET: 'JWT 密钥',
  
  // 应用
  NEXT_PUBLIC_APP_URL: '应用 URL',
}

const optionalEnvVars = {
  // 短信服务
  SMS_PROVIDER: '短信服务提供商（aliyun/tencent/ronglian）',
  ALIYUN_ACCESS_KEY_ID: '阿里云 AccessKey ID',
  ALIYUN_ACCESS_KEY_SECRET: '阿里云 AccessKey Secret',
  ALIYUN_SMS_SIGN_NAME: '阿里云短信签名',
  ALIYUN_SMS_TEMPLATE_CODE: '阿里云短信模板代码',
  TENCENT_SECRET_ID: '腾讯云 SecretId',
  TENCENT_SECRET_KEY: '腾讯云 SecretKey',
  TENCENT_SMS_APP_ID: '腾讯云短信应用ID',
  TENCENT_SMS_SIGN_NAME: '腾讯云短信签名',
  TENCENT_SMS_TEMPLATE_ID: '腾讯云短信模板ID',
  RONGLIAN_ACCOUNT_SID: '容联云 AccountSid',
  RONGLIAN_AUTH_TOKEN: '容联云 AuthToken',
  RONGLIAN_APP_ID: '容联云应用ID',
  RONGLIAN_TEMPLATE_ID: '容联云模板ID',
  
  // 微信支付
  WECHAT_PAY_APP_ID: '微信支付 AppID',
  WECHAT_PAY_MCH_ID: '微信支付商户号',
  WECHAT_PAY_API_KEY: '微信支付 API 密钥',
  WECHAT_PAY_NOTIFY_URL: '微信支付回调 URL',
  
  // Gemini
  NEXT_PUBLIC_GEMINI_API_KEY: 'Google Gemini API 密钥',
}

function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local')
  const envExamplePath = path.join(process.cwd(), '.env.example')
  
  console.log('🔍 检查环境变量配置...\n')
  
  // 检查 .env.local 文件是否存在
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local 文件不存在')
    console.log('📝 请创建 .env.local 文件并配置环境变量')
    if (fs.existsSync(envExamplePath)) {
      console.log('💡 可以参考 .env.example 文件')
    }
    return false
  }
  
  console.log('✅ .env.local 文件存在\n')
  
  // 读取 .env.local 文件
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const envVars = {}
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
      }
    }
  })
  
  // 检查必需的环境变量
  let hasErrors = false
  console.log('📋 必需的环境变量：')
  for (const [key, description] of Object.entries(requiredEnvVars)) {
    if (envVars[key] && envVars[key] !== `your-${key.toLowerCase().replace(/_/g, '-')}`) {
      console.log(`  ✅ ${key}: 已配置`)
    } else {
      console.log(`  ❌ ${key}: 未配置 - ${description}`)
      hasErrors = true
    }
  }
  
  console.log('\n📋 可选的环境变量：')
  let hasOptional = false
  for (const [key, description] of Object.entries(optionalEnvVars)) {
    if (envVars[key] && envVars[key] !== `your-${key.toLowerCase().replace(/_/g, '-')}`) {
      console.log(`  ✅ ${key}: 已配置`)
      hasOptional = true
    }
  }
  
  if (!hasOptional) {
    console.log('  ⚠️  没有配置可选环境变量（短信服务、微信支付等）')
    console.log('  💡 开发环境可以使用模拟服务')
  }
  
  console.log('\n')
  
  if (hasErrors) {
    console.log('❌ 配置不完整，请检查并配置必需的环境变量')
    return false
  } else {
    console.log('✅ 环境变量配置检查通过')
    return true
  }
}

// 运行检查
if (require.main === module) {
  const result = checkEnvFile()
  process.exit(result ? 0 : 1)
}

module.exports = { checkEnvFile }

