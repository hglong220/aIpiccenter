'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, Copy, Check, Edit2, RotateCcw, MoreVertical, Image as ImageIcon, X } from 'lucide-react'
import toast from 'react-hot-toast'

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
  onSendMessage: (text: string, images?: Array<{ url: string; mimeType: string; base64?: string; filename: string }>) => void
  isSending: boolean
  input: string
  setInput: (value: string) => void
  onRegenerate?: (messageId: string) => void
  onEditMessage?: (messageId: string, newText: string) => void
}

export default function ChatDetailPage({
  chatId,
  messages,
  loadingHistory,
  onSendMessage,
  isSending,
  input,
  setInput,
  onRegenerate,
  onEditMessage,
}: ChatDetailPageProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; mimeType: string; base64?: string; filename: string }>>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if ((input.trim() || uploadedImages.length > 0) && !isSending) {
      onSendMessage(input.trim(), uploadedImages.length > 0 ? uploadedImages : undefined)
      setUploadedImages([])
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // 验证文件大小 (20MB)
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`文件 ${file.name} 超过20MB大小限制`)
          return null
        }

        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || '上传失败')
        }

        const data = await response.json()
        if (data.success && data.data) {
          return {
            url: data.data.url,
            mimeType: data.data.mimeType,
            base64: data.data.base64,
            filename: data.data.filename,
          }
        }
        return null
      })

      const uploadedFiles = (await Promise.all(uploadPromises)).filter((file): file is { url: string; mimeType: string; base64?: string; filename: string } => file !== null)
      
      if (uploadedFiles.length > 0) {
        setUploadedImages((prev) => [...prev, ...uploadedFiles])
        const imageCount = uploadedFiles.filter(f => f.mimeType.startsWith('image/')).length
        const docCount = uploadedFiles.length - imageCount
        let message = ''
        if (imageCount > 0 && docCount > 0) {
          message = `成功上传 ${imageCount} 张图片和 ${docCount} 个文档`
        } else if (imageCount > 0) {
          message = `成功上传 ${imageCount} 张图片`
        } else {
          message = `成功上传 ${docCount} 个文档`
        }
        toast.success(message)
      }
    } catch (error) {
      console.error('上传文件失败:', error)
      toast.error(error instanceof Error ? error.message : '上传文件失败')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCopy = async (text: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(messageId)
      toast.success('已复制到剪贴板')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      toast.error('复制失败')
    }
  }

  const handleEdit = (message: Message) => {
    if (message.sender === 'user') {
      setEditingId(message.id)
      setEditText(message.text)
    }
  }

  const handleSaveEdit = () => {
    if (editingId && editText.trim() && onEditMessage) {
      onEditMessage(editingId, editText.trim())
      setEditingId(null)
      setEditText('')
      toast.success('消息已更新')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const handleRegenerate = (messageId: string) => {
    if (onRegenerate) {
      onRegenerate(messageId)
    }
  }

  // 简单的 Markdown 渲染（支持代码块和行内代码）
  const renderMessage = (text: string) => {
    // 处理代码块
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    let processedText = text
    const codeBlocks: Array<{ id: number; code: string; lang?: string }> = []
    let blockId = 0

    processedText = processedText.replace(codeBlockRegex, (match, lang, code) => {
      const id = blockId++
      codeBlocks.push({ id, code, lang })
      return `__CODE_BLOCK_${id}__`
    })

    // 处理行内代码
    const inlineCodeRegex = /`([^`]+)`/g
    processedText = processedText.replace(inlineCodeRegex, '<code style="background-color: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em;">$1</code>')

    // 处理换行
    processedText = processedText.split('\n').map((line, index, array) => {
      if (line.includes('__CODE_BLOCK_')) {
        return line
      }
      return index < array.length - 1 ? `${line}<br/>` : line
    }).join('')

    // 替换代码块占位符
    codeBlocks.forEach((block) => {
      const codeHtml = `<pre style="background-color: rgba(0,0,0,0.05); padding: 12px; border-radius: 8px; overflow-x: auto; margin: 8px 0; font-family: 'Courier New', monospace; font-size: 0.9em; line-height: 1.5;"><code>${block.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`
      processedText = processedText.replace(`__CODE_BLOCK_${block.id}__`, codeHtml)
    })

    return processedText
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
          messages.map((message, index) => {
            const isEditing = editingId === message.id
            const isHovered = hoveredMessageId === message.id

            return (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: '8px',
                  position: 'relative',
                }}
                onMouseEnter={() => setHoveredMessageId(message.id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  {isEditing ? (
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '12px',
                        backgroundColor: '#ffffff',
                        border: '2px solid #1A73E8',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        style={{
                          width: '100%',
                          minHeight: '60px',
                          padding: '8px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          outline: 'none',
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            e.preventDefault()
                            handleSaveEdit()
                          } else if (e.key === 'Escape') {
                            handleCancelEdit()
                          }
                        }}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={handleCancelEdit}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#f3f4f6',
                            color: '#1f2937',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          取消
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#1A73E8',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          保存 (Ctrl+Enter)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          padding: '12px 16px',
                          borderRadius: '12px',
                          backgroundColor:
                            message.sender === 'user' ? '#1A73E8' : '#f3f4f6',
                          color: message.sender === 'user' ? '#ffffff' : '#1f2937',
                          fontSize: '14px',
                          lineHeight: '1.5',
                          wordWrap: 'break-word',
                        }}
                      >
                        {message.sender === 'assistant' ? (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: renderMessage(message.text),
                            }}
                            style={{
                              color: '#1f2937',
                            }}
                          />
                        ) : (
                          <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
                        )}
                        {message.images && message.images.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                            {message.images.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`上传的图片 ${idx + 1}`}
                                style={{
                                  maxWidth: '200px',
                                  maxHeight: '200px',
                                  borderRadius: '8px',
                                  objectFit: 'cover',
                                  cursor: 'pointer',
                                }}
                                onClick={() => window.open(img, '_blank')}
                              />
                            ))}
                          </div>
                        )}
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
                      {isHovered && message.status === 'sent' && (
                        <div
                          style={{
                            display: 'flex',
                            gap: '4px',
                            justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                            padding: '4px',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '6px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            position: 'absolute',
                            top: message.sender === 'user' ? '-40px' : 'auto',
                            bottom: message.sender === 'user' ? 'auto' : '-40px',
                            right: message.sender === 'user' ? '0' : 'auto',
                            left: message.sender === 'user' ? 'auto' : '0',
                          }}
                        >
                          {message.sender === 'user' && (
                            <button
                              onClick={() => handleEdit(message)}
                              style={{
                                padding: '6px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#6b7280',
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: '4px',
                              }}
                              title="编辑"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f3f4f6'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {message.sender === 'assistant' && onRegenerate && (
                            <button
                              onClick={() => handleRegenerate(message.id)}
                              style={{
                                padding: '6px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#6b7280',
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: '4px',
                              }}
                              title="重新生成"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f3f4f6'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                              }}
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleCopy(message.text, message.id)}
                            style={{
                              padding: '6px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: copiedId === message.id ? '#10b981' : '#6b7280',
                              display: 'flex',
                              alignItems: 'center',
                              borderRadius: '4px',
                            }}
                            title={copiedId === message.id ? '已复制' : '复制'}
                            onMouseEnter={(e) => {
                              if (copiedId !== message.id) {
                                e.currentTarget.style.backgroundColor = '#f3f4f6'
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            {copiedId === message.id ? <Check size={14} /> : <Copy size={14} />}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
        }}
      >
        {/* 已上传文件预览 */}
        {uploadedImages.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {uploadedImages.map((file, idx) => (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  width: '80px',
                  height: '80px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {file.mimeType.startsWith('image/') ? (
                  <img
                    src={file.url}
                    alt={`预览 ${idx + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '8px' }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>📄</div>
                    <div style={{ fontSize: '10px', color: '#6b7280', wordBreak: 'break-all' }}>
                      {file.filename.length > 10 ? file.filename.substring(0, 10) + '...' : file.filename}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => removeImage(idx)}
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    border: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv,.xls,.xlsx"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isUploading || loadingHistory}
            style={{
              padding: '10px',
              backgroundColor: isSending || isUploading || loadingHistory ? '#e5e7eb' : '#f3f4f6',
              color: isSending || isUploading || loadingHistory ? '#9ca3af' : '#1f2937',
              border: 'none',
              borderRadius: '8px',
              cursor: isSending || isUploading || loadingHistory ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            title="上传文件（图片、PDF、文档等）"
          >
            {isUploading ? (
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <ImageIcon size={18} />
            )}
          </button>
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
            disabled={isSending || (!input.trim() && uploadedImages.length === 0) || loadingHistory}
            style={{
              padding: '10px 20px',
              backgroundColor: isSending || (!input.trim() && uploadedImages.length === 0) || loadingHistory ? '#e5e7eb' : '#1A73E8',
              color: isSending || (!input.trim() && uploadedImages.length === 0) || loadingHistory ? '#9ca3af' : '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isSending || (!input.trim() && uploadedImages.length === 0) || loadingHistory ? 'not-allowed' : 'pointer',
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
                发送
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
