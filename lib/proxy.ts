import { ProxyAgent, setGlobalDispatcher, fetch } from 'undici'

let proxyConfigured = false
let proxyTested = false
let proxyAvailable = false

/**
 * 测试代理连接是否可用
 * @param proxyUrl 代理URL
 * @param timeout 超时时间（毫秒），默认5秒
 * @returns Promise<boolean> 连接是否成功
 */
export async function testProxyConnection(proxyUrl: string, timeout: number = 5000): Promise<boolean> {
  try {
    const agent = new ProxyAgent(proxyUrl)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    const response = await fetch('http://httpbin.org/ip', {
      dispatcher: agent,
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    return false
  }
}

/**
 * 获取代理配置信息
 * @returns 代理URL或null
 */
export function getProxyUrl(): string | null {
  return (
    process.env.GEMINI_PROXY_URL ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    null
  )
}

/**
 * 格式化代理错误信息，提供诊断建议
 * @param error 错误对象
 * @param proxyUrl 代理URL
 * @returns 格式化的错误信息和诊断步骤
 */
export function formatProxyError(error: unknown, proxyUrl: string | null): { message: string; diagnostics: string } {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const proxy = proxyUrl || '未配置'
  
  // 提取代理服务器IP和端口
  const proxyMatch = proxy.match(/:\/\/([^:@]+):(\d+)/)
  const proxyHost = proxyMatch ? proxyMatch[1] : 'N/A'
  const proxyPort = proxyMatch ? proxyMatch[2] : 'N/A'
  
  let message = `代理连接失败: ${errorMessage}`
  let diagnostics = ''
  
  if (errorMessage.includes('fetch failed') || errorMessage.includes('ECONNREFUSED')) {
    message = `无法连接到代理服务器 ${proxy}`
    diagnostics = `
诊断步骤：
1. 检查代理服务器是否运行正常
   - 运行测试脚本: node scripts/test-current-proxy.js
   - 或使用 curl 测试: curl -x ${proxy} https://www.google.com
   - 或使用 PowerShell 测试: Invoke-WebRequest -Uri https://www.google.com -Proxy ${proxy}

2. 验证代理地址和端口是否正确
   - 当前配置: ${proxy}
   - 代理服务器 IP: ${proxyHost}
   - 代理服务器端口: ${proxyPort}
   - 检查 .env.local 文件中的 GEMINI_PROXY_URL、HTTPS_PROXY 或 HTTP_PROXY

3. 检查网络连接
   - 确认可以访问代理服务器 IP: ${proxyHost}
   - 测试端口连通性: Test-NetConnection -ComputerName ${proxyHost} -Port ${proxyPort} (PowerShell)
   - 检查防火墙是否阻止了连接

4. 如果代理需要认证
   - 使用格式: http://username:password@host:port
   - 示例: http://user:pass@${proxyHost}:${proxyPort}
   - 确保用户名和密码正确

5. 尝试不使用代理（如果网络允许）
   - 临时删除或注释掉 .env.local 中的代理配置
   - 重启开发服务器`
  } else if (errorMessage.includes('ECONNRESET') || errorMessage.includes('connection closed')) {
    message = `代理连接中断: 代理服务器 ${proxy} 在传输过程中关闭了连接`
    diagnostics = `
可能原因：
1. 代理服务器需要认证（用户名/密码）
2. 代理服务器配置限制了来源 IP
3. SSL/TLS 握手失败
4. 代理服务器负载过高或已关闭

解决方案：
- 如果代理需要认证，添加用户名和密码到代理 URL
- 检查代理服务器日志
- 确认你的 IP 地址在代理允许列表中
- 尝试更换代理服务器
- 检查代理服务器状态`
  } else if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
    message = `代理连接超时: 代理服务器 ${proxy} 响应超时`
    diagnostics = `
可能原因：
1. 代理服务器响应超时
2. 网络延迟过高
3. 代理服务器负载过高

解决方案：
- 检查网络连接
- 尝试更换代理服务器
- 检查代理服务器状态
- 增加超时时间（如果可能）`
  } else {
    diagnostics = `
通用诊断步骤：
1. 检查代理服务器状态: node scripts/test-current-proxy.js
2. 验证代理配置是否正确
3. 检查网络连接和防火墙设置
4. 查看服务器日志获取更多信息`
  }
  
  return { message, diagnostics }
}

/**
 * 获取代理 Agent，如果代理不可用则返回 undefined（允许回退到直连）
 * @param testConnection 是否测试代理连接（默认 false，避免每次调用都测试）
 * @returns ProxyAgent 或 undefined
 */
export async function getProxyAgentSafe(testConnection: boolean = false): Promise<ProxyAgent | undefined> {
  const proxyUrl = getProxyUrl()
  
  if (!proxyUrl) {
    return undefined
  }

  // 如果已经测试过且代理不可用，直接返回 undefined
  if (proxyTested && !proxyAvailable) {
    return undefined
  }

  // 如果需要测试连接
  if (testConnection && !proxyTested) {
    proxyTested = true
    proxyAvailable = await testProxyConnection(proxyUrl, 3000) // 3秒超时快速测试
    
    if (!proxyAvailable) {
      console.warn('[Gemini] Proxy connection test failed, will fallback to direct connection')
      const { message } = formatProxyError(new Error('Proxy connection test failed'), proxyUrl)
      console.warn('[Gemini]', message)
      return undefined
    }
  }

  try {
    const agent = new ProxyAgent(proxyUrl)
    return agent
  } catch (error) {
    console.warn('[Gemini] Failed to create proxy agent:', error)
    return undefined
  }
}

/**
 * 获取代理 Agent（同步版本，不测试连接）
 * @returns ProxyAgent 或 undefined
 */
export function getProxyAgentSync(): ProxyAgent | undefined {
  const proxyUrl = getProxyUrl()
  
  if (!proxyUrl) {
    return undefined
  }

  try {
    const agent = new ProxyAgent(proxyUrl)
    return agent
  } catch (error) {
    console.warn('[Gemini] Failed to create proxy agent:', error)
    return undefined
  }
}

export function ensureGeminiProxy() {
  if (proxyConfigured) {
    return
  }

  const proxyUrl = getProxyUrl()

  if (!proxyUrl) {
    return
  }

  try {
    const agent = new ProxyAgent(proxyUrl)
    setGlobalDispatcher(agent)
    proxyConfigured = true
    console.info('[Gemini] Proxy configured:', proxyUrl)
  } catch (error) {
    const { message, diagnostics } = formatProxyError(error, proxyUrl)
    console.warn('[Gemini] Failed to configure proxy:', message)
    console.warn('[Gemini] Diagnostics:', diagnostics)
    console.warn('[Gemini] Will attempt direct connection if proxy fails')
  }
}





















