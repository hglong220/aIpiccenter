/**
 * 视频生成历史页面
 * 显示用户的所有视频生成记录
 */

'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Play, Download, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface VideoGeneration {
  id: string
  prompt: string
  videoUrl?: string
  thumbnailUrl?: string
  status: string
  progress: number
  createdAt: string
  completedAt?: string
  model?: string
}

export default function VideoHistoryPage() {
  const { user } = useAuth()
  const [videos, setVideos] = useState<VideoGeneration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadVideoHistory()
    }
  }, [user])

  const loadVideoHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/generations?type=video')
      const data = await response.json()

      if (data.success) {
        setVideos(data.data || [])
      }
    } catch (error) {
      console.error('Error loading video history:', error)
      toast.error('加载视频历史失败')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'running':
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return '已完成'
      case 'failed':
        return '失败'
      case 'running':
      case 'processing':
        return '生成中'
      default:
        return '等待中'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">视频生成历史</h1>
          <p className="mt-2 text-gray-600">查看您生成的所有视频</p>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">还没有生成过视频</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {video.thumbnailUrl ? (
                  <div className="relative aspect-video bg-gray-200">
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.prompt}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                    {video.status === 'success' && video.videoUrl && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-50 transition-all">
                        <a
                          href={video.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <Play className="w-16 h-16 text-white" />
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video bg-gray-200 flex items-center justify-center">
                    {getStatusIcon(video.status)}
                  </div>
                )}

                <div className="p-4">
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {video.prompt}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(video.status)}
                      <span>{getStatusText(video.status)}</span>
                    </div>
                    {video.model && (
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {video.model}
                      </span>
                    )}
                  </div>

                  {video.status === 'running' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${video.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {video.status === 'success' && video.videoUrl && (
                    <div className="mt-2 flex gap-2">
                      <a
                        href={video.videoUrl}
                        download
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Download className="w-4 h-4" />
                        下载
                      </a>
                    </div>
                  )}

                  <div className="mt-2 text-xs text-gray-400">
                    {new Date(video.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
