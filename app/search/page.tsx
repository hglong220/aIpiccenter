'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, MessageSquare, Search as SearchIcon } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface SearchResult {
  chatId: string
  messageId: string
  content: string
  highlight: string
  createdAt: string
  title?: string // Add title for display
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    if (query) {
      setHasSearched(true)
      fetchSearchResults(query)
    } else {
      setResults([])
      setHasSearched(false)
    }
  }, [query])

  const fetchSearchResults = async (searchQuery: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/search/chats?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.success) {
        // 在这里，我们需要处理从后端返回的 title 字段
        const formattedResults = data.data.results.map((result: SearchResult) => ({
          ...result,
          // 这里的 title 需要根据你的 `app/api/chats/list/route.ts` 逻辑来调整
          // 如果 `/api/search/chats` 返回了 chatSession.title，就直接用
          // 否则可以考虑从 content 中截取
          title: result.title || result.content.substring(0, 30) + '...',
        }))
        setResults(formattedResults)
      } else {
        toast.error(data.error || '搜索失败')
        setResults([])
      }
    } catch (error) {
      console.error('搜索聊天记录失败:', error)
      toast.error('服务器异常，搜索失败')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`
    
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}月${day}日`
  }

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '30px', textAlign: 'center', color: '#1f2937' }}>聊天搜索</h1>

      {!hasSearched && (
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '16px' }}>
          <SearchIcon size={32} style={{ margin: '0 auto 20px', color: '#9ca3af' }} />
          <div>输入关键词开始搜索你的聊天记录...</div>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px', color: '#6b7280' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', marginRight: '10px' }} />
          正在搜索...
        </div>
      )}

      {hasSearched && !loading && results.length === 0 && (
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '16px' }}>
          没有找到匹配的聊天记录。
        </div>
      )}

      {hasSearched && !loading && results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {results.map((result) => (
            <Link key={result.messageId} href={`/chat/${result.chatId}`} 
              style={{
                display: 'block',
                padding: '15px',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                backgroundColor: '#fff',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#1A73E8')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#e5e7eb')}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <MessageSquare size={16} style={{ color: '#6b7280', marginRight: '8px' }} />
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937' }}>{result.title}</h2>
                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#9ca3af' }}>{formatTime(result.createdAt)}</span>
              </div>
              <p 
                style={{ 
                  fontSize: '14px', 
                  color: '#4b5563', 
                  lineHeight: '1.5', 
                  maxHeight: '4.5em', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                }}
                dangerouslySetInnerHTML={{ __html: result.highlight }}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}










