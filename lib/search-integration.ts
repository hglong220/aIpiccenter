/**
 * 网络搜索集成
 * 为AI提供实时网络数据
 */

import { fetch } from 'undici'

export interface SearchResult {
  title: string
  url: string
  snippet: string
  publishedDate?: string
}

export interface SearchResponse {
  results: SearchResult[]
  query: string
}

/**
 * 检测提示词是否需要网络搜索
 */
export function needsWebSearch(prompt: string): boolean {
  const searchKeywords = [
    '最新', '现在', '今天', '昨天', '本周', '本月', '今年',
    '新闻', '消息', '报道', '动态', '趋势',
    '谁', '什么时候', '哪里', '多少',
    '最近', '刚刚', '实时', '当前',
    'latest', 'now', 'today', 'news', 'current', 'recent'
  ]
  
  const lowerPrompt = prompt.toLowerCase()
  return searchKeywords.some(keyword => lowerPrompt.includes(keyword))
}

/**
 * 使用Brave Search API搜索
 */
async function searchWithBrave(query: string, maxResults = 5): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY
  if (!apiKey) {
    throw new Error('Brave Search API key not configured')
  }

  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${maxResults}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey,
        },
        signal: AbortSignal.timeout(10000), // 10秒超时
      }
    )

    if (!response.ok) {
      throw new Error(`Brave Search API failed: ${response.status}`)
    }

    const data: any = await response.json()
    
    return (data.web?.results || []).slice(0, maxResults).map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.description,
      publishedDate: r.age,
    }))
  } catch (error) {
    console.error('[Search] Brave Search error:', error)
    throw error
  }
}

/**
 * 使用SerpAPI搜索（备选）
 */
async function searchWithSerpAPI(query: string, maxResults = 5): Promise<SearchResult[]> {
  const apiKey = process.env.SERPAPI_API_KEY
  if (!apiKey) {
    throw new Error('SerpAPI key not configured')
  }

  try {
    const response = await fetch(
      `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${apiKey}&num=${maxResults}`,
      {
        signal: AbortSignal.timeout(10000),
      }
    )

    if (!response.ok) {
      throw new Error(`SerpAPI failed: ${response.status}`)
    }

    const data: any = await response.json()
    
    return (data.organic_results || []).slice(0, maxResults).map((r: any) => ({
      title: r.title,
      url: r.link,
      snippet: r.snippet,
    }))
  } catch (error) {
    console.error('[Search] SerpAPI error:', error)
    throw error
  }
}

/**
 * 执行网络搜索
 */
export async function searchWeb(query: string, maxResults = 5): Promise<SearchResponse> {
  const provider = process.env.SEARCH_PROVIDER || 'brave'
  
  try {
    let results: SearchResult[] = []
    
    if (provider === 'brave' && process.env.BRAVE_SEARCH_API_KEY) {
      results = await searchWithBrave(query, maxResults)
    } else if (provider === 'serpapi' && process.env.SERPAPI_API_KEY) {
      results = await searchWithSerpAPI(query, maxResults)
    } else {
      console.warn('[Search] No search provider configured')
      return { results: [], query }
    }
    
    return { results, query }
  } catch (error) {
    console.error('[Search] Search failed:', error)
    return { results: [], query }
  }
}

/**
 * 将搜索结果格式化为AI可读的文本
 */
export function formatSearchResults(searchResponse: SearchResponse): string {
  if (searchResponse.results.length === 0) {
    return ''
  }
  
  let formatted = '\n\n📰 网络搜索结果:\n\n'
  
  searchResponse.results.forEach((result, index) => {
    formatted += `${index + 1}. **${result.title}**\n`
    formatted += `   ${result.snippet}\n`
    formatted += `   🔗 ${result.url}\n`
    if (result.publishedDate) {
      formatted += `   📅 ${result.publishedDate}\n`
    }
    formatted += '\n'
  })
  
  return formatted
}

/**
 * 增强提示词（如果需要搜索）
 */
export async function enhancePromptWithSearch(prompt: string): Promise<{
  enhancedPrompt: string
  sources: SearchResult[]
  searchPerformed: boolean
}> {
  // 检查是否需要搜索
  if (!needsWebSearch(prompt)) {
    return {
      enhancedPrompt: prompt,
      sources: [],
      searchPerformed: false
    }
  }
  
  // 检查是否配置了搜索API
  if (!process.env.BRAVE_SEARCH_API_KEY && !process.env.SERPAPI_API_KEY) {
    console.warn('[Search] No search API configured, skipping search')
    return {
      enhancedPrompt: prompt,
      sources: [],
      searchPerformed: false
    }
  }
  
  try {
    // 执行搜索
    const searchResponse = await searchWeb(prompt, 5)
    
    if (searchResponse.results.length === 0) {
      return {
        enhancedPrompt: prompt,
        sources: [],
        searchPerformed: true
      }
    }
    
    // 增强提示词
    const searchContext = formatSearchResults(searchResponse)
    const enhancedPrompt = `${prompt}${searchContext}\n\n请基于以上搜索结果和你的知识来回答。如果搜索结果包含相关信息，请引用来源。`
    
    return {
      enhancedPrompt,
      sources: searchResponse.results,
      searchPerformed: true
    }
  } catch (error) {
    console.error('[Search] Failed to enhance prompt:', error)
    return {
      enhancedPrompt: prompt,
      sources: [],
      searchPerformed: false
    }
  }
}

