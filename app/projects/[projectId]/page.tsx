/**
 * 项目详情页面
 * 显示项目文件、生成记录等
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  ArrowLeft,
  Edit,
  Share2,
  Image as ImageIcon,
  Video,
  FileText,
  Plus,
  Upload,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface ProjectDetail {
  id: string
  name: string
  description: string | null
  coverImage: string | null
  isPublic: boolean
  shareToken: string | null
  tags: string[]
  files: any[]
  generations: any[]
  fileCount: number
  generationCount: number
}

export default function ProjectDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const projectId = params.projectId as string
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'files' | 'generations'>('files')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadProject()
  }, [user, router, projectId])

  const loadProject = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}`)
      const data = await response.json()
      if (data.success) {
        setProject(data.data)
      } else {
        toast.error(data.error || '加载失败')
        router.push('/projects')
      }
    } catch (error) {
      console.error('Failed to load project:', error)
      toast.error('加载项目失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/projects">
              <button className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-6 h-6" />
              </button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            {project.isPublic && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                公开
              </span>
            )}
          </div>

          {project.description && (
            <p className="text-gray-600 mb-4">{project.description}</p>
          )}

          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4">
            <Link href={`/projects/${projectId}/edit`}>
              <button className="btn-secondary flex items-center gap-2">
                <Edit className="w-5 h-5" />
                编辑
              </button>
            </Link>
            <button className="btn-secondary flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              分享
            </button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标签页 */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('files')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'files'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  文件 ({project.fileCount})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('generations')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'generations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  生成记录 ({project.generationCount})
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'files' ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">项目文件</h2>
                  <button className="btn-primary flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    上传文件
                  </button>
                </div>
                {project.files.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    还没有文件，点击上传文件开始
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {project.files.map((file) => (
                      <div
                        key={file.id}
                        className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        {file.fileType === 'image' ? (
                          <img
                            src={file.url}
                            alt={file.originalFilename}
                            className="w-full aspect-square object-cover"
                          />
                        ) : (
                          <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                            <FileText className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        <div className="p-2">
                          <p className="text-sm text-gray-900 truncate">
                            {file.originalFilename}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">生成记录</h2>
                  <Link href="/generate">
                    <button className="btn-primary flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      新建生成
                    </button>
                  </Link>
                </div>
                {project.generations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    还没有生成记录
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {project.generations.map((gen) => (
                      <div
                        key={gen.id}
                        className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        {gen.type === 'image' && gen.imageUrl ? (
                          <img
                            src={gen.imageUrl}
                            alt={gen.prompt}
                            className="w-full aspect-square object-cover"
                          />
                        ) : gen.type === 'video' && gen.videoUrl ? (
                          <div className="w-full aspect-square bg-gray-100 flex items-center justify-center relative">
                            <Video className="w-12 h-12 text-gray-400" />
                            <div className="absolute bottom-2 left-2 right-2">
                              <video
                                src={gen.videoUrl}
                                className="w-full rounded"
                                controls
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        <div className="p-2">
                          <p className="text-sm text-gray-900 line-clamp-2">
                            {gen.prompt}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

