/**
 * 图像编辑页面
 * 裁剪、压缩、分辨率调整、WebP转换、背景移除、一键增强
 */

'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  Upload,
  Crop,
  Compress,
  Maximize2,
  FileImage,
  Sparkles,
  Download,
  RotateCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Stage, Layer, Image as KonvaImage, Transformer } from 'react-konva'
import useImage from 'use-image'

export default function ImageEditorPage() {
  const { user } = useAuth()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const [cropArea, setCropArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [processing, setProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('请上传图像文件')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const url = event.target?.result as string
      setImageUrl(url)
      setOriginalImageUrl(url)
    }
    reader.readAsDataURL(file)
  }

  const handleCrop = async () => {
    if (!imageUrl || !cropArea) {
      toast.error('请先选择裁剪区域')
      return
    }

    try {
      setProcessing(true)
      const response = await fetch('/api/image-editor/crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          x: cropArea.x,
          y: cropArea.y,
          width: cropArea.width,
          height: cropArea.height,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setImageUrl(data.data.imageUrl)
        setActiveTool(null)
        toast.success('裁剪完成')
      } else {
        toast.error(data.error || '裁剪失败')
      }
    } catch (error) {
      toast.error('裁剪失败')
    } finally {
      setProcessing(false)
    }
  }

  const handleCompress = async (quality: number) => {
    if (!imageUrl) {
      toast.error('请先上传图像')
      return
    }

    try {
      setProcessing(true)
      const response = await fetch('/api/image-editor/compress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          quality,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setImageUrl(data.data.imageUrl)
        toast.success(`压缩完成，压缩率: ${data.data.compressionRatio}%`)
      } else {
        toast.error(data.error || '压缩失败')
      }
    } catch (error) {
      toast.error('压缩失败')
    } finally {
      setProcessing(false)
    }
  }

  const handleResize = async (width: number, height: number) => {
    if (!imageUrl) {
      toast.error('请先上传图像')
      return
    }

    try {
      setProcessing(true)
      const response = await fetch('/api/image-editor/resize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          width,
          height,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setImageUrl(data.data.imageUrl)
        toast.success('分辨率调整完成')
      } else {
        toast.error(data.error || '调整失败')
      }
    } catch (error) {
      toast.error('调整失败')
    } finally {
      setProcessing(false)
    }
  }

  const handleConvertToWebP = async () => {
    if (!imageUrl) {
      toast.error('请先上传图像')
      return
    }

    try {
      setProcessing(true)
      const response = await fetch('/api/image-editor/webp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setImageUrl(data.data.imageUrl)
        toast.success(`WebP转换完成，压缩率: ${data.data.compressionRatio}%`)
      } else {
        toast.error(data.error || '转换失败')
      }
    } catch (error) {
      toast.error('转换失败')
    } finally {
      setProcessing(false)
    }
  }

  const handleRemoveBackground = async () => {
    if (!imageUrl) {
      toast.error('请先上传图像')
      return
    }

    try {
      setProcessing(true)
      const response = await fetch('/api/image-editor/remove-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setImageUrl(data.data.imageUrl)
        toast.success('背景移除完成')
      } else {
        toast.error(data.error || '背景移除失败')
      }
    } catch (error) {
      toast.error('背景移除失败')
    } finally {
      setProcessing(false)
    }
  }

  const handleEnhance = async () => {
    if (!imageUrl) {
      toast.error('请先上传图像')
      return
    }

    try {
      setProcessing(true)
      const response = await fetch('/api/image-editor/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setImageUrl(data.data.imageUrl)
        toast.success('图像增强完成')
      } else {
        toast.error(data.error || '增强失败')
      }
    } catch (error) {
      toast.error('增强失败')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!imageUrl) return

    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `edited_${Date.now()}.jpg`
    link.click()
  }

  const handleReset = () => {
    if (originalImageUrl) {
      setImageUrl(originalImageUrl)
      setCropArea(null)
      setActiveTool(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">图像编辑</h1>
          <p className="mt-2 text-gray-600">专业的图像编辑工具</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 工具栏 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-4 space-y-4">
              {/* 上传 */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  上传图像
                </button>
              </div>

              {/* 编辑工具 */}
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTool(activeTool === 'crop' ? null : 'crop')}
                  className={`w-full btn-secondary flex items-center gap-2 ${
                    activeTool === 'crop' ? 'bg-blue-500 text-white' : ''
                  }`}
                >
                  <Crop className="w-5 h-5" />
                  裁剪
                </button>

                <div className="border-t pt-2">
                  <p className="text-sm font-medium mb-2">压缩质量</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleCompress(90)}
                      className="btn-secondary text-xs"
                      disabled={!imageUrl || processing}
                    >
                      高质量
                    </button>
                    <button
                      onClick={() => handleCompress(70)}
                      className="btn-secondary text-xs"
                      disabled={!imageUrl || processing}
                    >
                      中等
                    </button>
                    <button
                      onClick={() => handleCompress(50)}
                      className="btn-secondary text-xs"
                      disabled={!imageUrl || processing}
                    >
                      低质量
                    </button>
                  </div>
                </div>

                <div className="border-t pt-2">
                  <p className="text-sm font-medium mb-2">常用尺寸</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleResize(1920, 1080)}
                      className="btn-secondary text-xs"
                      disabled={!imageUrl || processing}
                    >
                      1920x1080
                    </button>
                    <button
                      onClick={() => handleResize(1280, 720)}
                      className="btn-secondary text-xs"
                      disabled={!imageUrl || processing}
                    >
                      1280x720
                    </button>
                    <button
                      onClick={() => handleResize(1024, 1024)}
                      className="btn-secondary text-xs"
                      disabled={!imageUrl || processing}
                    >
                      1024x1024
                    </button>
                    <button
                      onClick={() => handleResize(512, 512)}
                      className="btn-secondary text-xs"
                      disabled={!imageUrl || processing}
                    >
                      512x512
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleConvertToWebP}
                  className="w-full btn-secondary flex items-center gap-2"
                  disabled={!imageUrl || processing}
                >
                  <FileImage className="w-5 h-5" />
                  转为WebP
                </button>

                <button
                  onClick={handleRemoveBackground}
                  className="w-full btn-secondary flex items-center gap-2"
                  disabled={!imageUrl || processing}
                >
                  <Maximize2 className="w-5 h-5" />
                  移除背景
                </button>

                <button
                  onClick={handleEnhance}
                  className="w-full btn-secondary flex items-center gap-2"
                  disabled={!imageUrl || processing}
                >
                  <Sparkles className="w-5 h-5" />
                  一键增强
                </button>
              </div>

              {/* 操作按钮 */}
              <div className="border-t pt-4 space-y-2">
                <button
                  onClick={handleReset}
                  className="w-full btn-secondary flex items-center gap-2"
                  disabled={!originalImageUrl}
                >
                  <RotateCw className="w-5 h-5" />
                  重置
                </button>
                <button
                  onClick={handleDownload}
                  className="w-full btn-primary flex items-center gap-2"
                  disabled={!imageUrl}
                >
                  <Download className="w-5 h-5" />
                  下载
                </button>
              </div>
            </div>
          </div>

          {/* 图像预览和编辑区域 */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              {!imageUrl ? (
                <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                  <Upload className="w-16 h-16 mb-4" />
                  <p>上传图像开始编辑</p>
                </div>
              ) : (
                <div className="relative">
                  {processing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                    </div>
                  )}
                  <img
                    src={imageUrl}
                    alt="编辑中"
                    className="max-w-full h-auto rounded-lg"
                  />
                  {activeTool === 'crop' && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">
                        在图像上拖拽选择裁剪区域
                      </p>
                      <button
                        onClick={handleCrop}
                        className="btn-primary"
                        disabled={!cropArea || processing}
                      >
                        确认裁剪
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

