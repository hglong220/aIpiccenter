'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { ImageGenerationRequest } from '@/types'

interface AdvancedSettingsProps {
  settings: Omit<ImageGenerationRequest, 'prompt'>
  onChange: (settings: Partial<ImageGenerationRequest>) => void
  disabled?: boolean
}

const aspectRatios = [
  { label: '正方形 (1:1)', width: 1024, height: 1024 },
  { label: '竖版 (2:3)', width: 1024, height: 1536 },
  { label: '横版 (3:2)', width: 1536, height: 1024 },
  { label: '宽屏 (16:9)', width: 1920, height: 1080 },
  { label: '竖屏 (9:16)', width: 1080, height: 1920 },
]

const models = [
  {
    id: 'gemini-pro-vision',
    label: 'Gemini Pro Vision',
    tier: '标准基础',
    description: '适用于日常创作，1 个信用点生成 1 张图像',
    creditCost: 1,
  },
  {
    id: 'gemini-pro',
    label: 'Gemini Pro',
    tier: '增强细节',
    description: '画面表现更加细腻，1.5 倍信用点消耗 (向上取整)',
    creditCost: 1.5,
  },
  {
    id: 'gemini-ultra',
    label: 'Gemini Ultra',
    tier: '高阶旗舰',
    description: '企业级质量，建议精细项目使用，3 倍信用点消耗',
    creditCost: 3,
  },
]

export function AdvancedSettings({ settings, onChange, disabled = false }: AdvancedSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      className={`border border-gray-200 rounded-lg overflow-hidden ${disabled ? 'opacity-60 pointer-events-none select-none' : ''}`}
      aria-disabled={disabled}
    >
      <button
        type="button"
        onClick={() => {
          if (disabled) return
          setIsOpen(!isOpen)
        }}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        aria-expanded={isOpen}
        aria-controls="advanced-settings-content"
      >
        <span className="text-sm font-medium text-gray-700">高级设置</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div id="advanced-settings-content" className="p-4 space-y-6 bg-white">
          {/* Aspect Ratio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              宽高比
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {aspectRatios.map((ratio) => (
                <button
                  key={ratio.label}
                  type="button"
                  onClick={() => onChange({ width: ratio.width, height: ratio.height })}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    settings.width === ratio.width && settings.height === ratio.height
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-300 hover:border-primary-300 text-gray-700'
                  }`}
                >
                  {ratio.label}
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                自定义尺寸
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="custom-width" className="block text-xs text-gray-600 mb-1">
                    宽度 (px)
                  </label>
                  <input
                    id="custom-width"
                    type="number"
                    min="256"
                    max="4096"
                    value={settings.width}
                    onChange={(e) => {
                      const width = parseInt(e.target.value) || 1024
                      onChange({ width })
                    }}
                    className="input-primary w-full text-sm"
                    placeholder="宽度"
                  />
                </div>
                <div>
                  <label htmlFor="custom-height" className="block text-xs text-gray-600 mb-1">
                    高度 (px)
                  </label>
                  <input
                    id="custom-height"
                    type="number"
                    min="256"
                    max="4096"
                    value={settings.height}
                    onChange={(e) => {
                      const height = parseInt(e.target.value) || 1024
                      onChange({ height })
                    }}
                    className="input-primary w-full text-sm"
                    placeholder="高度"
                  />
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                当前尺寸：{settings.width} × {settings.height}px
              </p>
            </div>
          </div>

          {/* Negative Prompt */}
          <div>
            <label htmlFor="negative-prompt" className="block text-sm font-medium text-gray-700 mb-2">
              负面提示词（要避免的内容）
            </label>
            <textarea
              id="negative-prompt"
              value={settings.negativePrompt || ''}
              onChange={(e) => onChange({ negativePrompt: e.target.value })}
              placeholder="例如：模糊、低质量、扭曲、水印"
              rows={2}
              className="input-primary resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              描述您希望在生成的图像中排除的元素
            </p>
          </div>

          {/* Generation Count */}
          <div>
            <label htmlFor="count" className="block text-sm font-medium text-gray-700 mb-2">
              生成数量
            </label>
            <input
              id="count"
              type="number"
              min="1"
              max="4"
              value={settings.count}
              onChange={(e) => onChange({ count: parseInt(e.target.value) || 1 })}
              className="input-primary w-24"
            />
            <p className="mt-1 text-xs text-gray-500">
              一次生成 1-4 个变体（消耗 {settings.count} 个信用点）
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-3">模型版本与信用点</span>
            <div className="space-y-2">
              {models.map((model) => {
                const isActive = (settings.model || 'gemini-pro-vision') === model.id
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => onChange({ model: model.id })}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                      isActive
                        ? 'border-primary-500 bg-primary-50 text-primary-800 shadow-sm'
                        : 'border-gray-200 hover:border-primary-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold">{model.label}</p>
                        <p className="text-xs text-gray-500 mt-1">{model.tier}</p>
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        ≈ {model.creditCost} × 信用点
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-gray-500">
                      {model.description}
                    </p>
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-amber-600">
              提示：高阶模型会根据消耗倍率扣减信用点，请在生成前确认账户余额。
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

