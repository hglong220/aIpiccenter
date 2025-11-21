'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Download, Copy, Sparkles, Loader2, Share2, PencilLine } from 'lucide-react'
import toast from 'react-hot-toast'
import type { ImageGenerationResult } from '@/types'
import { useImageGenerationStore } from '@/lib/store'

interface ResultCardProps {
  result: ImageGenerationResult
}

export function ResultCard({ result }: ResultCardProps) {
  const [isGeneratingSimilar, setIsGeneratingSimilar] = useState(false)
  const { addResult, setStatus } = useImageGenerationStore()
  const router = useRouter()

  const handleDownload = async () => {
    try {
      const response = await fetch(result.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-pic-${result.id}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('图像下载成功！')
    } catch (error) {
      toast.error('图像下载失败')
      console.error('Download error:', error)
    }
  }

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(result.prompt)
    toast.success('提示词已复制到剪贴板！')
  }

  const handleShare = () => {
    navigator.clipboard.writeText(result.imageUrl)
    toast.success('图片链接已复制，可直接分享！')
  }

  const handleEnterEditor = () => {
    const params = new URLSearchParams({
      imageId: result.id,
      imageUrl: result.imageUrl,
      prompt: result.prompt,
    })
    router.push(`/image-editor?${params.toString()}`)
  }

  const handleGenerateSimilar = async () => {
    setIsGeneratingSimilar(true)
    try {
      setStatus('generating', 0, '正在生成相似图像...')
      
      const response = await fetch('/api/generate/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `${result.prompt}, similar style but with variations`,
          negativePrompt: result.negativePrompt,
          width: result.width,
          height: result.height,
          count: 1,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '生成相似图像失败')
      }

      const data = await response.json()
      if (data.success && data.data) {
        addResult(data.data as ImageGenerationResult)
        setStatus('success', 100, '相似图像生成成功！')
        toast.success('相似图像生成成功！')
      } else {
        throw new Error(data.error || '生成相似图像失败')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '生成相似图像失败'
      toast.error(errorMessage)
      setStatus('error', 0, errorMessage)
      console.error('Generate similar error:', error)
    } finally {
      setIsGeneratingSimilar(false)
    }
  }

  return (
    <div className="card">
      {/* Image */}
      <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={result.imageUrl}
          alt={result.prompt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      {/* Prompt */}
      <p className="text-sm text-gray-700 mb-4 line-clamp-2" title={result.prompt}>
        "{result.prompt}"
      </p>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleDownload}
          className="btn secondary text-sm py-2 inline-flex items-center justify-center gap-2"
          aria-label="下载图像"
        >
          <Download className="w-4 h-4" /> 下载
        </button>
        <button
          onClick={handleShare}
          className="btn secondary text-sm py-2 inline-flex items-center justify-center gap-2"
          aria-label="分享图像链接"
        >
          <Share2 className="w-4 h-4" /> 分享链接
        </button>
        <button
          onClick={handleCopyPrompt}
          className="btn secondary text-sm py-2 inline-flex items-center justify-center gap-2"
          aria-label="复制提示词"
        >
          <Copy className="w-4 h-4" /> 复制提示词
        </button>
        <button
          onClick={handleEnterEditor}
          className="btn primary text-sm py-2 inline-flex items-center justify-center gap-2"
          aria-label="进入编辑模式"
        >
          <PencilLine className="w-4 h-4" /> 编辑
        </button>
      </div>

      <button
        onClick={handleGenerateSimilar}
        disabled={isGeneratingSimilar}
        className="mt-3 w-full btn secondary text-sm py-2 inline-flex items-center justify-center gap-2 disabled:opacity-50"
        aria-label="生成相似"
      >
        {isGeneratingSimilar ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> 正在生成…
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" /> 生成相似
          </>
        )}
      </button>

      {/* Metadata */}
      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <span>{result.width} × {result.height}px</span>
        <span>{new Date(result.createdAt).toLocaleString()}</span>
      </div>
    </div>
  )
}

