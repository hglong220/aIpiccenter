/**
 * 测试代理配置和 Google Gemini API 连接
 * 运行: node scripts/test-proxy.js
 */

// 手动加载 .env.local
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  // 读取文件并移除 BOM
  let envContent = fs.readFileSync(envPath, 'utf8')
  if (envContent.charCodeAt(0) === 0xFEFF) {
    envContent = envContent.slice(1) // 移除 BOM
  }
  
  const lines = envContent.split(/\r?\n/)
  lines.forEach((line) => {
    // 移除所有不可见字符
    const trimmed = line.replace(/[\u200B-\u200D\uFEFF]/g, '').trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const equalIndex = trimmed.indexOf('=')
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim()
        const value = trimmed.substring(equalIndex + 1).trim()
        if (key && value) {
          // 移除 key 和 value 中的不可见字符
          const cleanKey = key.replace(/[^\x20-\x7E]/g, '')
          const cleanValue = value.replace(/[^\x20-\x7E]/g, '')
          if (cleanKey && cleanValue) {
            process.env[cleanKey] = cleanValue
          }
        }
      }
    }
  })
} else {
  console.warn('⚠️  .env.local 文件不存在')
}

const { fetch, ProxyAgent } = require('undici')

async function testProxy() {
  console.log('🔍 检查环境变量配置...\n')
  
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  const model = process.env.GOOGLE_GEMINI_MODEL || 'gemini-1.5-flash'
  const proxyUrl = process.env.GEMINI_PROXY_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY

  console.log('环境变量:')
  console.log(`  GOOGLE_GEMINI_API_KEY: ${apiKey ? '✅ 已设置' : '❌ 未设置'}`)
  console.log(`  GOOGLE_GEMINI_MODEL: ${model}`)
  console.log(`  代理 URL: ${proxyUrl || '❌ 未设置'}`)
  console.log('')

  if (!apiKey) {
    console.error('❌ 错误: GOOGLE_GEMINI_API_KEY 未设置')
    console.log('请在 .env.local 文件中设置 GOOGLE_GEMINI_API_KEY')
    process.exit(1)
  }

  if (!proxyUrl) {
    console.warn('⚠️  警告: 未配置代理，可能无法连接 Google API')
    console.log('如果网络被墙，请在 .env.local 中设置 GEMINI_PROXY_URL')
  }

  // 测试代理连接
  if (proxyUrl) {
    console.log('🔗 测试代理连接...')
    try {
      const proxyAgent = new ProxyAgent(proxyUrl)
      console.log(`✅ 代理代理创建成功: ${proxyUrl}`)
      
      // 测试通过代理访问 Google
      console.log('\n🌐 测试通过代理访问 Google...')
      try {
        const testResponse = await fetch('https://www.google.com', {
          dispatcher: proxyAgent,
          signal: AbortSignal.timeout(10000), // 10秒超时
        })
        
        if (testResponse.ok) {
          console.log('✅ 代理连接成功，可以访问 Google')
        } else {
          console.warn(`⚠️  代理响应状态: ${testResponse.status}`)
        }
      } catch (testError) {
        console.error('❌ 通过代理访问 Google 失败:')
        console.error(`  错误类型: ${testError.name}`)
        console.error(`  错误信息: ${testError.message}`)
        console.error(`  错误代码: ${testError.code || 'N/A'}`)
        
        if (testError.message.includes('ECONNREFUSED')) {
          console.error('\n💡 问题诊断:')
          console.error('  代理服务器连接被拒绝')
          console.error('  可能原因:')
          console.error('    1. 代理服务器未运行')
          console.error('    2. 代理地址或端口错误')
          console.error('    3. 防火墙阻止了连接')
          console.error(`\n  请确认代理服务器运行在: ${proxyUrl}`)
        } else if (testError.message.includes('ETIMEDOUT')) {
          console.error('\n💡 问题诊断:')
          console.error('  代理连接超时')
          console.error('  可能原因:')
          console.error('    1. 代理服务器响应慢')
          console.error('    2. 网络连接问题')
        } else {
          console.error('\n💡 请检查代理配置和网络连接')
        }
        
        // 继续测试 API，因为代理可能只是测试连接有问题
        console.log('\n⚠️  继续测试 API（代理可能仍可用）...')
      }
    } catch (error) {
      console.error('❌ 创建代理代理失败:', error.message)
      console.error('请检查代理 URL 格式是否正确')
      process.exit(1)
    }
  }

  // 测试 Gemini API
  console.log('\n🤖 测试 Google Gemini API 连接...')
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  const apiUrl = `${endpoint}?key=${apiKey}`

  const fetchOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: 'Hello, say hi in one sentence.' }],
        },
      ],
    }),
    signal: AbortSignal.timeout(60000), // 60秒超时
  }

  if (proxyUrl) {
    try {
      const proxyAgent = new ProxyAgent(proxyUrl)
      fetchOptions.dispatcher = proxyAgent
      console.log('✅ 使用代理发送请求...')
    } catch (error) {
      console.error('❌ 创建代理代理失败:', error.message)
      process.exit(1)
    }
  } else {
    console.log('⚠️  未使用代理，直接连接...')
  }

  try {
    console.log(`📡 请求 URL: ${endpoint}`)
    const response = await fetch(apiUrl, fetchOptions)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ API 请求失败:`)
      console.error(`  状态码: ${response.status}`)
      console.error(`  错误信息: ${errorText}`)
      process.exit(1)
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || '')
      .join('\n')
      .trim()

    if (text) {
      console.log('✅ API 调用成功!')
      console.log(`📝 响应: ${text}`)
      console.log('\n🎉 所有测试通过！代理配置正确。')
    } else {
      console.warn('⚠️  API 响应格式异常')
      console.log('响应数据:', JSON.stringify(data, null, 2))
    }
  } catch (error) {
    console.error('❌ API 请求异常:')
    console.error(`  错误类型: ${error.name}`)
    console.error(`  错误信息: ${error.message}`)
    
    if (error.name === 'AbortError') {
      console.error('\n💡 建议:')
      console.error('  1. 检查网络连接')
      console.error('  2. 检查代理配置是否正确')
      console.error('  3. 尝试增加超时时间')
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 建议:')
      console.error('  1. 检查代理服务器是否运行在 127.0.0.1:7897')
      console.error('  2. 检查代理端口是否正确')
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('\n💡 建议:')
      console.error('  1. 检查 DNS 解析')
      console.error('  2. 检查代理配置')
    }
    
    process.exit(1)
  }
}

testProxy().catch((error) => {
  console.error('未捕获的错误:', error)
  process.exit(1)
})

