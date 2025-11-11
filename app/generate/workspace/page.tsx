'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { PromptInput } from '@/components/generate/PromptInput'
import { ResultCard } from '@/components/generate/ResultCard'
import { useImageGenerationStore } from '@/lib/store'
import { useAuth } from '@/contexts/AuthContext'
import type { ImageGenerationRequest, ImageGenerationResult, GenerationProgress as ProgressType } from '@/types'
import { Upload, XCircle, ImageIcon, Sparkles, Palette, Info } from 'lucide-react'

const aspectRatios = [
  { id: '1:1', label: '1 : 1 · 方形', width: 1024, height: 1024 },
  { id: '4:3', label: '4 : 3 · 横屏', width: 1280, height: 960 },
  { id: '3:2', label: '3 : 2 · 经典', width: 1536, height: 1024 },
  { id: '16:9', label: '16 : 9 · 宽屏', width: 1920, height: 1080 },
  { id: '9:16', label: '9 : 16 · 竖屏', width: 1080, height: 1920 },
]

const stylePresets = [
  '电影级写实',
  '未来赛博',
  '东方水墨',
  '潮流插画',
  '像素艺术',
  '复古油画',
]

const defaultSettings: Omit<ImageGenerationRequest, 'prompt'> = {
  width: 1024,
  height: 1024,
  count: 1,
  model: 'gemini-pro-vision',
}

export default function ImageWorkspacePage() {
  const { user, token, refreshUser } = useAuth()
  const isLoggedIn = Boolean(user && token)
  const { results, addResult, setStatus, clearResults } = useImageGenerationStore()

  const [prompt, setPrompt] = useState('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [style, setStyle] = useState<string>('')
  const [includeText, setIncludeText] = useState(false)
  const [textInImage, setTextInImage] = useState('')
  const [aspect, setAspect] = useState(aspectRatios[0])
  const [count, setCount] = useState(1)
  const [progress, setProgress] = useState<ProgressType>({ status: 'idle', progress: 0 })

  const [referenceImage, setReferenceImage] = useState<File | null>(null)
  const [referencePreview, setReferencePreview] = useState<string | null>(null)
  const [referenceData, setReferenceData] = useState<string | null>(null)
  const [referenceError, setReferenceError] = useState<string | null>(null)

  const [settings, setSettings] = useState(defaultSettings)

  useEffect(() => {
    setSettings((prev) => ({ ...prev, width: aspect.width, height: aspect.height }))
  }, [aspect])

  useEffect(() => {
    return () => {
      if (referencePreview) {
        URL.revokeObjectURL(referencePreview)
      }
    }
  }, [referencePreview])

  const formatFileSize = (file?: File | null) => {
    if (!file) return ''
    const kb = file.size / 1024
    if (kb < 1024) return `${Math.round(kb)} KB`
    return `${(kb / 1024).toFixed(2)} MB`
  }

  const handleReference = (file: File | null) => {
    if (!file) {
      if (referencePreview) URL.revokeObjectURL(referencePreview)
      setReferenceImage(null)
      setReferencePreview(null)
      setReferenceData(null)
      setReferenceError(null)
      return
    }

    if (!file.type.startsWith('image/')) {
      setReferenceError('请上传图片格式文件（JPG / PNG / WebP）')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setReferenceError('图片大小不能超过 5MB')
      return
    }

    if (referencePreview) URL.revokeObjectURL(referencePreview)

    const preview = URL.createObjectURL(file)
    setReferenceImage(file)
    setReferencePreview(preview)
    setReferenceError(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      const data = typeof reader.result === 'string' ? reader.result : null
      setReferenceData(data)
    }
    reader.readAsDataURL(file)
  }

  const finalPrompt = useMemo(() => {
    const segments = [prompt]
    if (style) segments.push(`风格：${style}`)
    if (includeText && textInImage) segments.push(`图中文字：${textInImage}`)
    return segments.filter(Boolean).join('。')
  }, [includeText, prompt, style, textInImage])

  const handleGenerate = async () => {
    if (!isLoggedIn) {
      toast.error('请先登录后再生成图像')
      return
    }

    if (!prompt.trim()) {
      toast.error('请输入提示词描述')
      return
    }

    setProgress({ status: 'generating', progress: 0, message: '正在准备生成...' })
    setStatus('generating', 0, '正在准备生成')

    try {
      const payload: ImageGenerationRequest = {
        prompt: finalPrompt,
        negativePrompt: negativePrompt || undefined,
        width: settings.width,
        height: settings.height,
        count,
        model: settings.model,
      }

      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...payload,
          referenceImage: referenceData || undefined,
          referenceImageName: referenceImage?.name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '图像生成失败')
      }

      const data = await response.json()
      if (data.success && data.data) {
        addResult(data.data as ImageGenerationResult)
        toast.success('生成成功！')
        setStatus('success', 100, '生成完成')
        await refreshUser()
        setProgress({ status: 'success', progress: 100 })
      } else {
        throw new Error(data.error || '图像生成失败')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '生成失败'
      toast.error(message)
      setProgress({ status: 'error', progress: 0, message })
      setStatus('error', 0, message)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-container mx-auto flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">图像创作工作台</h1>
            <p className="text-sm text-gray-500">结构化提示词 + 高级参数，打造超清 AI 视觉作品</p>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {isLoggedIn ? (
              <>
                <span>账户：{user?.username || user?.phone}</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#1A73E8]/10 px-3 py-1 font-medium text-[#1A73E8]">
                  Credits {user?.credits}
                </span>
              </>
            ) : (
              <span className="text-xs text-gray-400">未登录：可浏览全部功能，生成作品前需登录账号</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-container mx-auto px-6 py-10 space-y-12">
        <div className="lg:grid lg:grid-cols-[2fr_1fr] lg:gap-8">
          {/* 左侧：提示词与素材 */}
          <section className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">提示词</h2>
                  <p className="text-sm text-gray-500">清晰描述主体、风格、场景、光线与氛围</p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={progress.status === 'generating'}
                  className="inline-flex items-center gap-2 rounded-full bg-[#1A73E8] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Sparkles className="h-4 w-4" /> {progress.status === 'generating' ? '正在生成...' : '立刻生成'}
                </button>
              </div>
              <div className="mt-4">
                <PromptInput value={prompt} onChange={setPrompt} onEnhance={setPrompt} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                <span>已输入：{prompt.length} 字</span>
                <span>建议结构：主体 + 风格 + 光线 + 背景 + 细节</span>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">上传参考图（可选）</h3>
                    <p className="mt-1 text-xs text-gray-500">锁定构图或人物特征 · 支持 JPG/PNG/WebP · ≤5MB</p>
                  </div>
                  <ImageIcon className="h-5 w-5 text-gray-400" />
                </div>
                <label
                  htmlFor="workspace-reference-upload"
                  className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#1A73E8] shadow-sm ring-1 ring-[#1A73E8]/40 hover:bg-[#1A73E8] hover:text-white"
                >
                  <Upload className="h-4 w-4" /> 选择图片
                </label>
                <input
                  id="workspace-reference-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(event) => handleReference(event.target.files?.[0] || null)}
                />
                {referenceError && <p className="mt-3 text-xs text-red-500">{referenceError}</p>}
                {referencePreview && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={referencePreview} alt="参考图" className="h-36 w-full object-cover" />
                    <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
                      <span className="truncate">{referenceImage?.name}</span>
                      <div className="flex items-center gap-2">
                        <span>{formatFileSize(referenceImage)}</span>
                        <button
                          type="button"
                          onClick={() => handleReference(null)}
                          className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-gray-500 hover:text-gray-800"
                        >
                          <XCircle className="h-4 w-4" /> 移除
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900">风格标签</h3>
                <p className="mt-1 text-xs text-gray-500">点击快速切换常用风格，也可在提示词中自定义</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {stylePresets.map((preset) => {
                    const active = style === preset
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setStyle((prev) => (prev === preset ? '' : preset))}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          active ? 'bg-[#1A73E8] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {preset}
                      </button>
                    )
                  })}
                </div>
                <div className="mt-5 space-y-2 text-xs text-gray-500">
                  <label className="font-semibold text-gray-600">图中文字</label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={includeText}
                      onChange={(event) => setIncludeText(event.target.checked)}
                    />
                    在图像中添加清晰可读的文字内容
                  </label>
                  <textarea
                    rows={2}
                    disabled={!includeText}
                    value={textInImage}
                    onChange={(event) => setTextInImage(event.target.value)}
                    placeholder="例如：品牌口号、活动标题等"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#1A73E8] disabled:bg-gray-100"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 右侧：参数与状态 */}
          <aside className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg">
              <h2 className="text-sm font-semibold text-gray-900">常用参数</h2>
              <p className="mt-2 text-xs text-gray-500">常规设置保持展开，更多选项在高级配置中调整</p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Aspect Ratio</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {aspectRatios.map((ratio) => {
                      const active = aspect.id === ratio.id
                      return (
                        <button
                          key={ratio.id}
                          type="button"
                          onClick={() => setAspect(ratio)}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                            active ? 'border-[#1A73E8] bg-[#1A73E8]/10 text-[#1A73E8]' : 'border-gray-200 text-gray-600 hover:border-[#1A73E8]/40'
                          }`}
                        >
                          <Palette className="h-4 w-4" /> {ratio.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid gap-3 text-xs text-gray-600">
                  <label className="font-semibold text-gray-600">生成数量
                    <input
                      type="range"
                      min={1}
                      max={4}
                      value={count}
                      onChange={(event) => setCount(Number(event.target.value))}
                      className="mt-2 w-full"
                    />
                    <span className="mt-1 inline-block text-gray-500">{count} 张图像</span>
                  </label>

                  <label className="font-semibold text-gray-600">使用模型
                    <select
                      value={settings.model}
                      onChange={(event) => setSettings((prev) => ({ ...prev, model: event.target.value }))}
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#1A73E8]"
                    >
                      <option value="gemini-pro-vision">Gemini Pro Vision · 标准</option>
                      <option value="gemini-ultra">Gemini Ultra · 高细节</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg">
              <details open>
                <summary className="cursor-pointer text-sm font-semibold text-gray-900">
                  高级设置
                </summary>
                <div className="mt-4 space-y-4 text-sm text-gray-700">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-xs font-semibold text-gray-600">宽度
                      <input
                        type="number"
                        min={256}
                        max={4096}
                        value={settings.width}
                        onChange={(event) => setSettings((prev) => ({ ...prev, width: Number(event.target.value) }))}
                        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#1A73E8]"
                      />
                    </label>
                    <label className="text-xs font-semibold text-gray-600">高度
                      <input
                        type="number"
                        min={256}
                        max={4096}
                        value={settings.height}
                        onChange={(event) => setSettings((prev) => ({ ...prev, height: Number(event.target.value) }))}
                        className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#1A73E8]"
                      />
                    </label>
                  </div>

                  <label className="text-xs font-semibold text-gray-600">负面提示词
                    <textarea
                      rows={3}
                      value={negativePrompt}
                      onChange={(event) => setNegativePrompt(event.target.value)}
                      placeholder="输入需要排除的元素，例如：模糊、失真、噪点"
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#1A73E8]"
                    />
                  </label>
                </div>
              </details>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg">
              <h3 className="text-sm font-semibold text-gray-900">生成状态</h3>
              <div className="mt-3 text-sm text-gray-600">
                {progress.status === 'generating' && (
                  <p>正在生成图像，请稍候...</p>
                )}
                {progress.status === 'success' && (
                  <p className="text-[#1A73E8]">生成完成，可在下方查看结果。</p>
                )}
                {progress.status === 'error' && (
                  <p className="text-red-500">{progress.message}</p>
                )}
                {progress.status === 'idle' && (
                  <p>准备就绪，输入提示词并生成您的创意。</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-lg">
              <h3 className="text-sm font-semibold text-gray-900">高质量创作建议</h3>
              <ul className="mt-3 space-y-2 text-xs text-gray-600 leading-relaxed">
                <li>· 使用「主体 + 风格 + 光线 + 背景 + 细节」结构描述提示词。</li>
                <li>· 利用参考图锁定构图或人物特征，适用于品牌和人像项目。</li>
                <li>· 负面提示词能有效排除噪点元素，例如“模糊、失真、多余手指”。</li>
              </ul>
            </div>
          </aside>
        </div>

        {/* 结果展示 */}
        <section className="space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">最新生成</h2>
              <p className="text-sm text-gray-500">点击卡片中的“编辑”可进入高级图像编辑工作区</p>
            </div>
            {results.length > 0 && (
              <button
                type="button"
                onClick={clearResults}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
              >
                清除全部作品
              </button>
            )}
          </div>

          {results.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-16 text-center">
              <p className="text-sm text-gray-500">暂未生成作品，输入提示词并点击“立刻生成”即可开始创作。</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((item) => (
                <ResultCard key={item.id} result={item} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

