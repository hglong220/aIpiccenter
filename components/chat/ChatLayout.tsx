'use client'

import { useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Plus, Star, Trash2, Search, X, Loader2, Edit2, Check } from 'lucide-react'
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
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  
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

  // 开始重命名
  const handleStartRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation()
    setRenamingSessionId(session.id)
    setRenameValue(session.title || '')
  }

  // 保存重命名
  const handleSaveRename = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chats/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renameValue.trim() || null }),
      })
      if (!response.ok) {
        throw new Error('重命名失败')
      }
      setRenamingSessionId(null)
      setRenameValue('')
      loadSessions()
      toast.success('重命名成功')
    } catch (error) {
      console.error('重命名失败:', error)
      toast.error('重命名失败')
    }
  }

  // 取消重命名
  const handleCancelRename = () => {
    setRenamingSessionId(null)
    setRenameValue('')
  }


  // 编辑消息
  const handleEditMessage = async (messageId: string, newText: string) => {
    if (!chatId) return
    
    try {
      const response = await fetch(`/api/chats/${chatId}/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newText }),
      })

      if (!response.ok) throw new Error('更新消息失败')

      // 更新本地消息
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, text: newText } : msg
        )
      )

      // 如果编辑的是用户消息，重新生成AI回复
      const editedMessage = messages.find((m) => m.id === messageId)
      if (editedMessage && editedMessage.sender === 'user') {
        // 找到这条消息之后的所有消息并删除
        const editedIndex = messages.findIndex((m) => m.id === messageId)
        setMessages((prev) => prev.slice(0, editedIndex + 1))

        // 重新生成AI回复
        const historyMessages = messages.slice(0, editedIndex).map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        }))
        historyMessages.push({
          role: 'user',
          parts: [{ text: newText }],
        })

        await generateAIResponse(newText, historyMessages)
      }
    } catch (error) {
      console.error('编辑消息失败:', error)
      toast.error('编辑消息失败')
    }
  }

  // 重新生成AI回复
  const handleRegenerate = async (messageId: string) => {
    if (!chatId) return

    try {
      // 找到要重新生成的消息
      const messageIndex = messages.findIndex((m) => m.id === messageId)
      if (messageIndex === -1) return

      // 删除这条消息及之后的所有消息
      const messagesToKeep = messages.slice(0, messageIndex)
      setMessages(messagesToKeep)

      // 获取用户的上一条消息
      const userMessage = messagesToKeep
        .slice()
        .reverse()
        .find((m) => m.sender === 'user')

      if (!userMessage) {
        toast.error('没有找到用户消息')
        return
      }

      // 构建历史消息
      const historyMessages = messagesToKeep.map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }))

      // 重新生成AI回复
      await generateAIResponse(userMessage.text, historyMessages)
    } catch (error) {
      console.error('重新生成失败:', error)
      toast.error('重新生成失败')
    }
  }

  // 生成AI回复的通用函数
  const generateAIResponse = async (prompt: string, historyMessages: Array<{ role: string; parts: Array<{ text: string }> }>) => {
    if (!chatId) return

    setIsSending(true)

    try {
      const aiResponse = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          history: historyMessages,
          stream: true,
        }),
      })

      if (!aiResponse.ok) throw new Error('AI 响应失败')

      const reader = aiResponse.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')

      const decoder = new TextDecoder()
      let assistantText = ''
      let buffer = ''
      const assistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        sender: 'assistant',
        text: '',
        timestamp: new Date().toISOString(),
        status: 'sending',
      }

      setMessages((prev) => [...prev, assistantMessage])

      let lastUpdateTime = 0
      const updateThrottle = 50

      const updateMessage = (text: string) => {
        const now = Date.now()
        if (now - lastUpdateTime >= updateThrottle) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id ? { ...msg, text } : msg
            )
          )
          lastUpdateTime = now
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.text) {
                assistantText += data.text
                updateMessage(assistantText)
              } else if (data.error) {
                console.error('[Chat] Stream error:', data.error)
                if (!assistantText) {
                  assistantText = `错误: ${data.error}`
                  updateMessage(assistantText)
                }
              }
            } catch (e) {
              console.warn('[Chat] Failed to parse data line:', line.substring(0, 100))
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id ? { ...msg, text: assistantText } : msg
        )
      )

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
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id ? { ...msg, id: savedAssistant.data.id, status: 'sent' } : msg
          )
        )
        window.dispatchEvent(new CustomEvent('chatMessageSaved'))
      }
    } catch (error) {
      console.error('生成AI回复失败:', error)
      toast.error('生成回复失败')
    } finally {
      setIsSending(false)
    }
  }

  // Send message logic moved here
  const handleSendMessage = async (text: string, images?: Array<{ url: string; mimeType: string; base64?: string; filename: string }>) => {
    if (!chatId) return
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toISOString(),
      status: 'sending',
      images: images,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsSending(true)

    try {
      // 如果有文件，将文件URL数组存储为JSON
      const imagePath = images && images.length > 0 ? JSON.stringify(images.map(img => img.url)) : undefined
      
      const saveUserMsgResponse = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: userMessage.text || (images && images.length > 0 ? `已上传 ${images.length} 个文件` : ''),
          imagePath: imagePath,
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
      
      // 准备发送给Gemini的图片数据（仅包含base64编码的图片）
      const imageData = images?.filter(img => img.mimeType.startsWith('image/') && img.base64).map(img => ({
        mimeType: img.mimeType,
        base64: img.base64!,
      }))

      const aiResponse = await fetch('/api/ai/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage.text || (images && images.length > 0 ? '请分析这些文件' : ''),
          history: historyMessages,
          stream: true,
          images: imageData && imageData.length > 0 ? imageData : undefined,
        }),
      })

      if (!aiResponse.ok) throw new Error('AI 响应失败')

      const reader = aiResponse.body?.getReader()
      if (!reader) throw new Error('无法读取响应流')
      
      const decoder = new TextDecoder()
      let assistantText = ''
      let buffer = '' // 用于累积不完整的行
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

      // 使用节流来减少状态更新频率，提高性能
      let lastUpdateTime = 0
      const updateThrottle = 50 // 每50ms最多更新一次
      
      const updateMessage = (text: string) => {
        const now = Date.now()
        if (now - lastUpdateTime >= updateThrottle) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, text }
                : msg
            )
          )
          lastUpdateTime = now
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // 保留最后一个可能不完整的行

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6))
                  if (data.text) {
                    assistantText += data.text
                    updateMessage(assistantText)
                  } else if (data.error) {
                    // 处理错误消息
                    console.error('[Chat] Stream error:', data.error)
                    if (!assistantText) {
                      assistantText = `错误: ${data.error}`
                      updateMessage(assistantText)
                    }
                  }
                } catch (e) {
                  // 忽略解析错误
                  console.warn('[Chat] Failed to parse data line:', line.substring(0, 100))
                }
              }
            }
      }

      // 确保最终状态更新
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, text: assistantText }
            : msg
        )
      )

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
            top: '130px',
            left: '8px',
            right: '8px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 101,
            maxHeight: 'calc(100vh - 150px)',
            overflowY: 'auto',
            padding: '4px',
          }}>
            {isGlobalSearchLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '13px' }}>搜索中...</span>
              </div>
            ) : globalSearchResults.length > 0 ? (
              <>
                <div style={{ padding: '8px 12px', fontSize: '12px', color: '#6b7280', borderBottom: '1px solid #e5e7eb', fontWeight: 500 }}>
                  找到 {globalSearchResults.length} 条结果
                </div>
                {globalSearchResults.map((result, index) => (
                  <Link 
                    key={result.messageId} 
                    href={`/chat/${result.chatId}`}
                    onClick={() => setGlobalSearchQuery('')}
                    style={{
                      display: 'block',
                      padding: '12px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      color: 'inherit',
                      borderBottom: index < globalSearchResults.length - 1 ? '1px solid #f3f4f6' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb'
                      e.currentTarget.style.cursor = 'pointer'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '8px',
                      marginBottom: '6px' 
                    }}>
                      <MessageSquare size={14} style={{ marginTop: '2px', color: '#9ca3af', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#1f2937', 
                          fontSize: '13px',
                          marginBottom: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {result.title || '未命名对话'}
                        </div>
                        <div 
                          style={{ 
                            fontSize: '12px', 
                            color: '#6b7280',
                            lineHeight: '1.5',
                            maxHeight: '40px',
                            overflow: 'hidden',
                          }}
                          dangerouslySetInnerHTML={{ 
                            __html: result.highlight.length > 100 
                              ? result.highlight.substring(0, 100) + '...' 
                              : result.highlight 
                          }} 
                        />
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#9ca3af', 
                          marginTop: '4px' 
                        }}>
                          {new Date(result.createdAt).toLocaleDateString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </>
            ) : (
              <div style={{ 
                padding: '40px 20px', 
                textAlign: 'center', 
                color: '#9ca3af',
                fontSize: '13px',
              }}>
                <div style={{ marginBottom: '8px' }}>未找到匹配的结果</div>
                <div style={{ fontSize: '12px', color: '#d1d5db' }}>
                  尝试使用不同的关键词搜索
                </div>
              </div>
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
              const isRenaming = renamingSessionId === session.id
              return (
                <div
                  key={session.id}
                  onClick={() => {
                    if (!isRenaming) {
                      router.push(`/chat/${session.id}`)
                    }
                  }}
                  style={{
                    padding: '10px 12px',
                    marginBottom: '4px',
                    borderRadius: '8px',
                    cursor: isRenaming ? 'default' : 'pointer',
                    backgroundColor: isActive ? '#f3f4f6' : 'transparent',
                    border: isActive ? '1px solid #1A73E8' : '1px solid transparent',
                    transition: 'all 0.2s',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive && !isRenaming) {
                      e.currentTarget.style.backgroundColor = '#f9fafb'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive && !isRenaming) {
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
                    {isRenaming ? (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.stopPropagation()
                              handleSaveRename(session.id)
                            } else if (e.key === 'Escape') {
                              e.stopPropagation()
                              handleCancelRename()
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            border: '1px solid #1A73E8',
                            borderRadius: '4px',
                            fontSize: '13px',
                            outline: 'none',
                          }}
                          autoFocus
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSaveRename(session.id)
                          }}
                          style={{
                            padding: '4px',
                            background: '#1A73E8',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="保存"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCancelRename()
                          }}
                          style={{
                            padding: '4px',
                            background: '#f3f4f6',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title="取消"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div
                          onDoubleClick={(e) => handleStartRename(session, e)}
                          style={{
                            fontSize: '13px',
                            fontWeight: isActive ? 600 : 500,
                            color: isActive ? '#1A73E8' : '#1f2937',
                            marginBottom: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                          }}
                          title="双击重命名"
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
                      </>
                    )}
                  </div>
                  {!isRenaming && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '4px',
                      }}
                    >
                      <button
                        onClick={(e) => handleStartRename(session, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          color: '#9ca3af',
                        }}
                        title="重命名"
                      >
                        <Edit2 size={14} />
                      </button>
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
                  )}
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
            onRegenerate={handleRegenerate}
            onEditMessage={handleEditMessage}
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

