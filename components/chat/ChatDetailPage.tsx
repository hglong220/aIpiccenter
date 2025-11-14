'use client'

import { Send, Loader2 } from 'lucide-react'

// This is a re-creation of the Message interface, as it's needed here.
interface Message {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  status: 'sending' | 'sent' | 'error'
  images?: string[]
}

interface ChatDetailPageProps {
  chatId?: string
  messages: Message[]
  loadingHistory: boolean
  onSendMessage: (text: string) => void
  isSending: boolean
  input: string
  setInput: (value: string) => void
}

export default function ChatDetailPage({
  messages,
  loadingHistory,
  onSendMessage,
  isSending,
  input,
  setInput,
}: ChatDetailPageProps) {
  
  const handleSend = () => {
    if (input.trim() && !isSending) {
      onSendMessage(input.trim())
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#ffffff',
      }}
    >
      {/* 消息区域 */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {loadingHistory ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: '14px',
            }}
          >
            <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
            加载中...
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: '14px',
            }}
          >
            开始新的对话...
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor:
                    message.sender === 'user' ? '#1A73E8' : '#f3f4f6',
                  color: message.sender === 'user' ? '#ffffff' : '#1f2937',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {message.text}
                {message.status === 'sending' && (
                  <Loader2
                    size={14}
                    style={{
                      display: 'inline-block',
                      marginLeft: '8px',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 输入区域 */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="输入消息... (Shift+Enter 换行)"
            rows={1}
            style={{
              flex: 1,
              padding: '10px 14px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              minHeight: '44px',
              maxHeight: '120px',
            }}
            disabled={isSending || loadingHistory}
          />
          <button
            onClick={handleSend}
            disabled={isSending || !input.trim() || loadingHistory}
            style={{
              padding: '10px 20px',
              backgroundColor: isSending || !input.trim() || loadingHistory ? '#e5e7eb' : '#1A73E8',
              color: isSending || !input.trim() || loadingHistory ? '#9ca3af' : '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isSending || !input.trim() || loadingHistory ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
            }}
          >
            {isSending ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                发送中...
              </>
            ) : (
              <>
                <Send size={18} />
                发送
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
