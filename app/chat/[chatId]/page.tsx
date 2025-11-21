'use client'

import { useParams } from 'next/navigation'
import { ChatLayout } from '@/components/chat/ChatLayout'

export default function ChatRoutePage() {
  const params = useParams()
  const chatId = params.chatId as string | undefined

  return <ChatLayout chatId={chatId} />
}

