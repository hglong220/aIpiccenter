import { ProxyAgent, setGlobalDispatcher } from 'undici'

let proxyConfigured = false

export function ensureGeminiProxy() {
  if (proxyConfigured) {
    return
  }

  const proxyUrl =
    process.env.GEMINI_PROXY_URL ||
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    null

  if (!proxyUrl) {
    return
  }

  try {
    const agent = new ProxyAgent(proxyUrl)
    setGlobalDispatcher(agent)
    proxyConfigured = true
    console.info('[Gemini] Proxy configured:', proxyUrl)
  } catch (error) {
    console.warn('[Gemini] Failed to configure proxy:', error)
  }
}




















