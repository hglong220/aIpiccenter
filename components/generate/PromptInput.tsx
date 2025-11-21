'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface PromptInputProps {
  value: string
  onChange: (value: string) => void
  onEnhance?: (enhanced: string) => void
  disabled?: boolean
}

export function PromptInput({ value, onChange, onEnhance, disabled = false }: PromptInputProps) {
  const [isEnhancing, setIsEnhancing] = useState(false)

  const handleEnhance = async () => {
    if (disabled) {
      return
    }

    if (!value.trim()) {
      toast.error('请先输入提示词')
      return
    }

    setIsEnhancing(true)
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: value }),
      })

      if (!response.ok) {
        throw new Error('Failed to enhance prompt')
      }

      const data = await response.json()
      if (data.success && data.enhanced) {
        onChange(data.enhanced)
        onEnhance?.(data.enhanced)
        toast.success('提示词增强成功！')
      } else {
        throw new Error(data.error || '提示词增强失败')
      }
    } catch (error) {
      toast.error('提示词增强失败，请重试。')
      console.error('Error enhancing prompt:', error)
    } finally {
      setIsEnhancing(false)
    }
  }

  return (
    <div className="space-y-2">
      <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
        描述您想要生成的内容
      </label>
      <div className="relative">
        <textarea
          id="prompt"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="例如：一个未来主义的城市景观，夕阳西下，霓虹灯反射在潮湿的街道上，赛博朋克风格，高度详细，4k"
          rows={4}
          className="input-primary resize-none pr-12"
          disabled={disabled}
          aria-disabled={disabled}
          readOnly={disabled}
        />
        <button
          type="button"
          onClick={handleEnhance}
          disabled={disabled || isEnhancing || !value.trim()}
          className="absolute top-3 right-3 p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="使用 AI 增强提示词"
          aria-label="增强提示词"
        >
          {isEnhancing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
        </button>
      </div>
      <p className="text-xs text-gray-500">
        提示：详细描述风格、氛围和细节以获得更好的效果。点击闪烁图标可增强您的提示词。
      </p>
    </div>
  )
}

