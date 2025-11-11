'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, Clock, MessageSquare, Star, Tag } from 'lucide-react'

interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  tags: string[]
  preview: string
  star?: boolean
  messages: Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: string }>
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    title: '产品发布预热策略',
    createdAt: '2025-03-12 09:45',
    updatedAt: '2025-03-14 18:32',
    tags: ['营销', '策略'],
    star: true,
    preview: '请根据我们新产品的定位，提供一个为期三周的发布预热计划…',
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: '请根据我们新产品的定位，提供一个为期三周的发布预热计划。',
        timestamp: '2025-03-12 09:45',
      },
      {
        id: 'm2',
        role: 'assistant',
        content:
          '好的，这里是为期三周的发布预热计划：\n1. 第 1 周：核心用户调研和预告素材准备…\n2. 第 2 周：社交媒体倒计时，关键意见领袖合作…\n3. 第 3 周：直播发布会预热和 Beta 体验邀约…',
        timestamp: '2025-03-12 09:47',
      },
      {
        id: 'm3',
        role: 'user',
        content: '能否细化第 2 周的社交媒体执行动作？',
        timestamp: '2025-03-13 14:12',
      },
      {
        id: 'm4',
        role: 'assistant',
        content: '当然可以，第 2 周我们可以围绕倒计时进行三类内容：1）产品亮点短视频；2）KOL 联合图文；3）互动抽奖话题…',
        timestamp: '2025-03-13 14:15',
      },
    ],
  },
  {
    id: '2',
    title: '客户服务 FAQ 优化',
    createdAt: '2025-02-02 10:05',
    updatedAt: '2025-02-03 21:08',
    tags: ['客服', '内容'],
    preview: '我们收集了一批常见问题，请你帮忙归纳 FAQ 并优化表达…',
    messages: [
      {
        id: 'm5',
        role: 'user',
        content: '我们收集了一批常见问题，请你帮忙归纳 FAQ 并优化表达。',
        timestamp: '2025-02-02 10:05',
      },
      {
        id: 'm6',
        role: 'assistant',
        content: '当然，以下是精炼后的 FAQ 结构，涵盖支付、物流、售后等场景…',
        timestamp: '2025-02-02 10:08',
      },
    ],
  },
  {
    id: '3',
    title: 'AI 图像风格测试',
    createdAt: '2025-01-18 16:20',
    updatedAt: '2025-01-18 17:02',
    tags: ['设计'],
    preview: '帮我列出 10 种适合科技主题宣传海报的视觉风格，并提供 prompt…',
    messages: [
      {
        id: 'm7',
        role: 'user',
        content: '帮我列出 10 种适合科技主题宣传海报的视觉风格，并提供对应 prompt。',
        timestamp: '2025-01-18 16:20',
      },
      {
        id: 'm8',
        role: 'assistant',
        content: '以下是 10 种科技主题视觉风格及示例 prompt：1）赛博朋克…',
        timestamp: '2025-01-18 16:23',
      },
    ],
  },
]

export default function HistoryPage() {
  const [activeId, setActiveId] = useState(MOCK_CONVERSATIONS[0]?.id ?? '')

  const activeConversation = useMemo(
    () => MOCK_CONVERSATIONS.find((item) => item.id === activeId) ?? null,
    [activeId]
  )

  return (
    <main
      style={{
        display: 'flex',
        minHeight: 'calc(100vh - 64px)',
        backgroundColor: '#ffffff',
      }}
    >
      <aside
        style={{
          width: '320px',
          borderRight: '1px solid #f0f0f0',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#1f2937', marginBottom: '8px' }}>历史记录</h1>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>查看你与 AI 的最新对话，后续可在此基础上继续创作。</p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {MOCK_CONVERSATIONS.map((conversation) => {
            const isActive = conversation.id === activeId
            return (
              <button
                key={conversation.id}
                onClick={() => setActiveId(conversation.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: '1px solid',
                  borderColor: isActive ? '#1A73E8' : '#e5e7eb',
                  borderRadius: '16px',
                  padding: '16px',
                  backgroundColor: isActive ? 'rgba(26, 115, 232, 0.06)' : '#ffffff',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 16px 32px rgba(59, 130, 246, 0.12)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#1f2937' }}>{conversation.title}</span>
                  {conversation.star && <Star style={{ width: '16px', height: '16px', color: '#F59E0B' }} />}
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>{conversation.preview}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6b7280' }}>
                    <Clock style={{ width: '14px', height: '14px' }} />
                    {conversation.updatedAt}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#6b7280' }}>
                    <CalendarDays style={{ width: '14px', height: '14px' }} />
                    {conversation.createdAt}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {conversation.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(17, 24, 39, 0.05)',
                        color: '#1f2937',
                        fontSize: '11px',
                        fontWeight: 500,
                      }}
                    >
                      <Tag style={{ width: '12px', height: '12px' }} />
                      {tag}
                    </span>
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <section
        style={{
          flex: 1,
          padding: '48px 64px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {activeConversation ? (
          <>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#111827' }}>{activeConversation.title}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#6b7280' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Clock style={{ width: '14px', height: '14px' }} /> 最后更新 {activeConversation.updatedAt}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarDays style={{ width: '14px', height: '14px' }} /> 创建于 {activeConversation.createdAt}
                  </span>
                </div>
              </div>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '999px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  color: '#111827',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                <MessageSquare style={{ width: '16px', height: '16px' }} /> 继续对话
              </button>
            </header>

            <div
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '20px',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                backgroundColor: '#ffffff',
                boxShadow: '0 18px 48px rgba(15, 23, 42, 0.08)',
              }}
            >
              {activeConversation.messages.map((message) => (
                <article
                  key={message.id}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'flex-start',
                    backgroundColor: message.role === 'assistant' ? 'rgba(26, 115, 232, 0.04)' : 'rgba(17, 24, 39, 0.04)',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '18px',
                      backgroundColor: message.role === 'assistant' ? '#1A73E8' : '#111827',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    {message.role === 'assistant' ? 'AI' : '我'}
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                        {message.role === 'assistant' ? 'AI 助手' : '我'}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{message.timestamp}</span>
                    </div>
                    <p style={{ fontSize: '14px', color: '#1f2937', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{message.content}</p>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af',
              fontSize: '15px',
            }}
          >
            暂无会话记录，请从左侧选择一个历史对话。
          </div>
        )}
      </section>
    </main>
  )
}



