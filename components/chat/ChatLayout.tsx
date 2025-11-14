'use client'

import { useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Plus, Star, Trash2, Search, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import ChatDetailPage from '@/components/chat/ChatDetailPage'

interface ChatSession {
  id: string
  title: string | null
  updatedAt: string
  isStarred?: boolean
  messageCount?: number
  lastMessage?: string | null
}

interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  status: 'sending' | 'sent' | 'error'
  images?: string[]
}

interface ChatLayoutProps {
  chatId?: string
}

interface SearchResult {
  chatId: string
  messageId: string
  content: string
  highlight: string
  createdAt: string
  title?: string
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function ChatLayout({ chatId }: ChatLayoutProps) {
  const router = useRouter()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('')
  
  // State for the chat detail page moved here
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Global search states
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')
  const [globalSearchResults, setGlobalSearchResults] = useState<SearchResult[]>([])
  const [isGlobalSearchLoading, setIsGlobalSearchLoading] = useState(false)

  const debouncedGlobalSearchQuery = useDebounce(globalSearchQuery, 300)

  // DEBUGGING: Log query changes
  useEffect(() => {
    console.log('[DEBUG] globalSearchQuery changed:', globalSearchQuery)
  }, [globalSearchQuery])

  useEffect(() => {
    console.log('[DEBUG] debouncedGlobalSearchQuery changed:', debouncedGlobalSearchQuery)
  }, [debouncedGlobalSearchQuery])


  // Fetch global search results
  useEffect(() => {
    if (debouncedGlobalSearchQuery && debouncedGlobalSearchQuery.length > 1) {
      console.log('[DEBUG] Triggering fetch for:', debouncedGlobalSearchQuery)
      fetchGlobalSearchResults(debouncedGlobalSearchQuery)
    } else {
      setGlobalSearchResults([])
    }
  }, [debouncedGlobalSearchQuery])

  const fetchGlobalSearchResults = async (query: string) => {
    console.log('[DEBUG] fetchGlobalSearchResults called with query:', query)
    setIsGlobalSearchLoading(true)
    try {
      const response = await fetch(`/api/search/chats?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      console.log('[DEBUG] API Response:', data)

      if (data.success) {
        console.log('[DEBUG] Setting global search results:', data.data.results)
        setGlobalSearchResults(data.data.results)
      } else {
        console.error('[DEBUG] API call failed:', data.error)
        toast.error(data.error || 'Search failed')
        setGlobalSearchResults([])
      }
    } catch (error) {
      console.error('[DEBUG] Failed to fetch global search results:', error)
      toast.error('Search failed due to a server error.')
      setGlobalSearchResults([])
    } finally {
      console.log('[DEBUG] Finished fetching. Loading set to false.')
      setIsGlobalSearchLoading(false)
    }
  }

  // 加载会话列表
  useEffect(() => {
    loadSessions()
    
    // 监听消息保存事件，自动刷新侧边栏
    const handleMessageSaved = () => {
      // 延迟一点刷新，确保数据库已更新
      setTimeout(() => {
        loadSessions()
      }, 500)
    }
    
    window.addEventListener('chatMessageSaved', handleMessageSaved)
    
    return () => {
      window.removeEventListener('chatMessageSaved', handleMessageSaved)
    }
  }, [])

  // History loading logic moved here
  const loadHistory = useCallback(async (id: string) => {
    console.log('[DEBUG] loadHistory called with id:', id)
    try {
      setLoadingHistory(true)
      const response = await fetch(`/api/chats/${id}/history`)
      console.log('[DEBUG] loadHistory response status:', response.status)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('会话不存在，请选择或创建新会话。')
          router.replace('/chat')
        } else {
          throw new Error('加载历史记录失败')
        }
        return
      }
      const data = await response.json()
      console.log('[DEBUG] loadHistory data:', data)
      if (data.success) {
        setMessages(data.data.messages || [])
      }
    } catch (error) {
      console.error('加载历史记录失败:', error)
      toast.error('加载历史记录失败')
      router.replace('/chat')
    } finally {
      setLoadingHistory(false)
    }
  }, [router])

  // Effect to load chat history when chatId changes
  useEffect(() => {
    console.log('[DEBUG] useEffect triggered, chatId:', chatId)
    if (chatId) {
      console.log('[DEBUG] Calling loadHistory with chatId:', chatId)
      loadHistory(chatId)
    } else {
      // Clear messages if no chat is selected
      console.log('[DEBUG] No chatId, clearing messages')
      setMessages([])
      setLoadingHistory(false)
    }
  }, [chatId, loadHistory])

  const loadSessions = async () => {
    console.log('[DEBUG] loadSessions called')
    try {
      setLoadingSessions(true)
      const response = await fetch('/api/chats/list')
      console.log('[DEBUG] loadSessions response status:', response.status)
      if (!response.ok) {
        throw new Error('加载会话列表失败')
      }
      const data = await response.json()
      console.log('[DEBUG] loadSessions data:', data)
      if (data.success) {
        setSessions(data.data || [])
      }
    } catch (error) {
      console.error('加载会话列表失败:', error)
      toast.error('加载会话列表失败')
    } finally {
      setLoadingSessions(false)
    }
  }

  // 创建新会话（点击"新对话"按钮时）
  const handleNewChat = async () => {
    try {
      const response = await fetch('/api/chats/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) {
        throw new Error('创建会话失败')
      }
      const data = await response.json()
      if (data.success && data.data?.id) {
        // 使用 replace 跳转，避免在历史记录中留下旧页面
        router.replace(`/chat/${data.data.id}`)
        // 立即刷新列表，显示新创建的会话
        loadSessions()
      }
    } catch (error) {
      console.error('创建会话失败:', error)
      toast.error('创建会话失败，请重试')
    }
  }

  // 删除会话
  const handleDeleteChat = async (sessionId: string, e: React.MouseEvent) => {
    console.log('[DEBUG] handleDeleteChat called with sessionId:', sessionId)
    e.stopPropagation()
    if (!confirm('确定要删除这个会话吗？')) {
      return
    }

    try {
      console.log('[DEBUG] Sending DELETE request to /api/chats/' + sessionId)
      const response = await fetch(`/api/chats/${sessionId}`, {
        method: 'DELETE',
      })
      console.log('[DEBUG] DELETE response status:', response.status)
      if (!response.ok) {
        throw new Error('删除会话失败')
      }
      
      // 如果删除的是当前会话，跳转到新会话页面
      if (sessionId === chatId) {
        router.push('/chat')
      }
      
      loadSessions()
      toast.success('会话已删除')
    } catch (error) {
      console.error('删除会话失败:', error)
      toast.error('删除会话失败')
    }
  }

  // 切换星标
  const handleToggleStar = async (sessionId: string, currentStarred: boolean, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(`/api/chats/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isStarred: !currentStarred }),
      })
      if (!response.ok) {
        throw new Error('更新失败')
      }
      loadSessions()
    } catch (error) {
      console.error('更新星标失败:', error)
      toast.error('更新失败')
    }
  }


  // Send message logic moved here
  const handleSendMessage = async (text: string) => {
    if (!chatId) return
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toISOString(),
      status: 'sending',
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsSending(true)

    try {
      const saveUserMsgResponse = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: userMessage.text,
        }),
      })

      if (!saveUserMsgResponse.ok) throw new Error('保存用户消息失败')
      const savedUserMsg = await saveUserMsgResponse.json()
      userMessage.id = savedUserMsg.data.id
      userMessage.status = 'sent'
      window.dispatchEvent(new CustomEvent('chatMessageSaved'))

      const historyMessages = messages.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }))
      historyMessages.push({
        role: 'user',
        parts: [{ text: userMessage.text }],
      })

      const aiResponse = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage.text,
          history: historyMessages,
          stream: true,
        }),
      })

      if (!aiResponse.ok) throw new Error('AI 响应失败')

      const reader = aiResponse.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')
      
      const decoder = new TextDecoder()
      let assistantText = ''
      const assistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        sender: 'assistant',
        text: '',
        timestamp: new Date().toISOString(),
        status: 'sending',
      }

      setMessages((prev) => {
        const updated = prev.map((msg) =>
          msg.id.startsWith('temp-') && msg.sender === 'user' ? userMessage : msg
        )
        return [...updated, assistantMessage]
      })

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.text) {
                assistantText += data.text
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id
                      ? { ...msg, text: assistantText }
                      : msg
                  )
                )
              }
            } catch (e) {}
          }
        }
      }

      const saveAssistantResponse = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'assistant',
          content: assistantText,
        }),
      })

      if (saveAssistantResponse.ok) {
        const savedAssistant = await saveAssistantResponse.json()
        assistantMessage.id = savedAssistant.data.id
        window.dispatchEvent(new CustomEvent('chatMessageSaved'))
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id ? { ...msg, status: 'sent' } : msg
        )
      )
    } catch (error) {
      console.error('发送消息失败:', error)
      toast.error('发送消息失败，请重试')
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id.startsWith('temp-') && msg.sender === 'user' ? { ...msg, status: 'error' } : msg
        )
      )
    } finally {
      setIsSending(false)
    }
  }

  // 格式化时间
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

  // 过滤会话 (for sidebar)
  const filteredSessions = sessions.filter((session) => {
    if (!sidebarSearchQuery.trim()) return true
    const query = sidebarSearchQuery.toLowerCase()
    const titleMatch = session.title?.toLowerCase().includes(query) || false
    const messageMatch = session.lastMessage?.toLowerCase().includes(query) || false
    return titleMatch || messageMatch
  })

  // 按星标和时间排序
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (a.isStarred && !b.isStarred) return -1
    if (!a.isStarred && b.isStarred) return 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  // DEBUGGING: Log state before render
  console.log('[DEBUG] Rendering with state:', {
    globalSearchQuery,
    globalSearchResults,
    isGlobalSearchLoading,
  })

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* 永久侧栏 */}
      <div
        style={{
          width: '280px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 100,
        }}
      >
        {/* 顶部：新会话按钮 */}
        <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
          <button
            onClick={handleNewChat}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: '#1A73E8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1557B0'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1A73E8'
            }}
          >
            <Plus size={18} />
            新对话
          </button>
        </div>

        {/* 搜索栏 */}
        <div style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                color: '#9ca3af',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="搜索所有对话..."
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#1A73E8'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb'
              }}
            />
            {globalSearchQuery && (
              <button
                onClick={() => setGlobalSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#9ca3af',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Global Search Results Overlay */}
        {globalSearchQuery.length > 1 && (
          <div style={{
            position: 'absolute',
            top: '130px', // Position below the search bar
            left: '8px',
            right: '8px',
            backgroundColor: 'white',
            border: '2px solid red', // DEBUG: Make border very obvious
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            zIndex: 101,
            maxHeight: 'calc(100vh - 150px)',
            overflowY: 'auto',
            padding: '8px',
          }}>
            {isGlobalSearchLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
                Loading...
              </div>
            ) : globalSearchResults.length > 0 ? (
              globalSearchResults.map((result) => (
                <Link key={result.messageId} href={`/chat/${result.chatId}`}
                  onClick={() => setGlobalSearchQuery('')} // Close search on click
                  style={{
                    display: 'block',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {/* DEBUG: Simplified rendering */}
                  <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                    {result.title || 'No Title'}
                  </div>
                  <div 
                    style={{ fontSize: '12px', color: '#6b7280' }}
                    dangerouslySetInnerHTML={{ __html: result.highlight }} 
                  />
                </Link>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>No results found.</div>
            )}
          </div>
        )}

        {/* 会话列表 */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px',
          }}
        >
          {loadingSessions ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: '13px',
              }}
            >
              加载中...
            </div>
          ) : sortedSessions.length === 0 ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: '13px',
              }}
            >
              {sidebarSearchQuery ? '没有找到匹配的对话' : '还没有对话，点击上方按钮创建新对话'}
            </div>
          ) : (
            sortedSessions.map((session) => {
              const isActive = session.id === chatId
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    router.push(`/chat/${session.id}`)
                  }}
                  style={{
                    padding: '10px 12px',
                    marginBottom: '4px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                    border: isActive ? '1px solid #1A73E8' : '1px solid transparent',
                    transition: 'all 0.2s',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#f9fafb'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  <MessageSquare
                    size={16}
                    style={{
                      marginTop: '2px',
                      color: isActive ? '#1A73E8' : '#6b7280',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? '#1A73E8' : '#1f2937',
                        marginBottom: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {session.title || '新对话'}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: '#9ca3af',
                      }}
                    >
                      {formatTime(session.updatedAt)}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '4px',
                    }}
                  >
                    <button
                      onClick={(e) => handleToggleStar(session.id, session.isStarred || false, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color: session.isStarred ? '#fbbf24' : '#9ca3af',
                      }}
                      title={session.isStarred ? '取消星标' : '添加星标'}
                    >
                      <Star
                        size={14}
                        fill={session.isStarred ? '#fbbf24' : 'none'}
                      />
                    </button>
                    <button
                      onClick={(e) => {
                        console.log('[DEBUG] Delete button clicked for session:', session.id)
                        handleDeleteChat(session.id, e)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#9ca3af',
                      }}
                      title="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 主聊天区域 */}
      <div
        style={{
          marginLeft: '280px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          backgroundColor: '#ffffff',
        }}
      >
        {chatId ? (
          <ChatDetailPage
            chatId={chatId}
            messages={messages}
            loadingHistory={loadingHistory}
            onSendMessage={handleSendMessage}
            isSending={isSending}
            input={input}
            setInput={setInput}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            选择或创建一个新对话开始聊天
          </div>
        )}
      </div>
    </div>
  )
}

