/**
 * 项目分享页面
 * 通过分享链接访问公开项目
 */

'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Share2, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface SharedProject {
  id: string
  name: string
  description: string | null
  coverImage: string | null
  files: any[]
  generations: any[]
}

export default function SharedProjectPage() {
  const params = useParams()
  const shareToken = params.shareToken as string
  const [project, setProject] = useState<SharedProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const loadSharedProject = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/shared/${shareToken}`)
      const data = await response.json()
      if (data.success) {
        setProject(data.data)
      } else {
        toast.error(data.error || '项目不存在或已失效')
      }
    } catch (error) {
      console.error('Failed to load shared project:', error)
      toast.error('加载项目失败')
    } finally {
      setLoading(false)
    }
  }, [shareToken])

  useEffect(() => {
    void loadSharedProject()
  }, [loadSharedProject])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast.success('链接已复制')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">项目不存在</h1>
          <p className="text-gray-600 mb-4">该项目可能已被删除或分享链接已失效</p>
          <Link href="/" className="btn-primary">
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              {project.description && (
                <p className="text-gray-600 mt-2">{project.description}</p>
              )}
            </div>
            <button
              onClick={handleCopyLink}
              className="btn-secondary flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  复制链接
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {project.files.map((file) => (
            <div key={file.id} className="bg-white rounded-lg shadow overflow-hidden">
              {file.fileType === 'image' ? (
                <div className="w-full aspect-square relative">
                  <Image
                    src={file.url}
                    alt={file.originalFilename}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400">文件</span>
                </div>
              )}
              <div className="p-4">
                <p className="text-sm text-gray-900 truncate">{file.originalFilename}</p>
              </div>
            </div>
          ))}
          {project.generations.map((gen) => (
            <div key={gen.id} className="bg-white rounded-lg shadow overflow-hidden">
              {gen.type === 'image' && gen.imageUrl ? (
                <div className="w-full aspect-square relative">
                  <Image
                    src={gen.imageUrl}
                    alt={gen.prompt}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              ) : gen.type === 'video' && gen.videoUrl ? (
                <video
                  src={gen.videoUrl}
                  className="w-full aspect-square object-cover"
                  controls
                />
              ) : (
                <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400">生成记录</span>
                </div>
              )}
              <div className="p-4">
                <p className="text-sm text-gray-900 line-clamp-2">{gen.prompt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

