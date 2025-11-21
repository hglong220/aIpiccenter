'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { ChatLayout } from '@/components/chat/ChatLayout'

export default function ChatPage() {
  const router = useRouter()

  useEffect(() => {
    // 加载会话列表，如果有会话则跳转到最新的，否则显示列表让用户选择
    const loadSessions = async () => {
      try {
        const response = await fetch('/api/chats/list')
        if (!response.ok) {
          // 如果加载失败，显示聊天布局（会显示空列表）
          return
        }
        
        const data = await response.json()
        if (data.success && data.data && data.data.length > 0) {
          // 如果有会话，跳转到最新的会话
          const sortedSessions = [...data.data].sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          router.replace(`/chat/${sortedSessions[0].id}`)
        }
        // 如果没有会话，显示聊天布局（会显示空列表和创建按钮）
      } catch (error) {
        console.error('加载会话列表失败:', error)
        // 出错时也显示聊天布局
      }
    }
    
    loadSessions()
  }, [router])

  // 显示聊天布局，让用户可以看到会话列表或创建新会话
  return <ChatLayout />
}
