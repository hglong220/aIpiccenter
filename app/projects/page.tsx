/**
 * 项目管理系统主页
 * 项目CRUD、封面、文件、生成记录、批量操作、分享链接、标签
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  Plus,
  Search,
  Filter,
  Share2,
  Edit,
  Trash2,
  Folder,
  Image as ImageIcon,
  Video,
  Tag,
  MoreVertical,
  Copy,
  Check,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Project {
  id: string
  name: string
  description: string | null
  coverImage: string | null
  isPublic: boolean
  shareToken: string | null
  tags: string[]
  createdAt: string
  updatedAt: string
  fileCount: number
  generationCount: number
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    loadProjects()
  }, [user, router])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/projects')
      const data = await response.json()
      if (data.success) {
        setProjects(data.data)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
      toast.error('加载项目列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (name: string, description?: string) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('项目创建成功')
        setShowCreateModal(false)
        loadProjects()
      } else {
        toast.error(data.error || '创建失败')
      }
    } catch (error) {
      toast.error('创建失败')
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('确定要删除此项目吗？')) return

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (data.success) {
        toast.success('项目已删除')
        loadProjects()
      } else {
        toast.error(data.error || '删除失败')
      }
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const handleToggleShare = async (projectId: string, isPublic: boolean) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success(isPublic ? '项目已公开' : '项目已设为私有')
        loadProjects()
      } else {
        toast.error(data.error || '操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleCopyShareLink = (shareToken: string) => {
    const shareUrl = `${window.location.origin}/projects/shared/${shareToken}`
    navigator.clipboard.writeText(shareUrl)
    toast.success('分享链接已复制')
  }

  const handleBatchDelete = async () => {
    if (selectedProjects.size === 0) return
    if (!confirm(`确定要删除选中的 ${selectedProjects.size} 个项目吗？`)) return

    try {
      const response = await fetch('/api/projects/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectIds: Array.from(selectedProjects) }),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('批量删除成功')
        setSelectedProjects(new Set())
        loadProjects()
      } else {
        toast.error(data.error || '批量删除失败')
      }
    } catch (error) {
      toast.error('批量删除失败')
    }
  }

  // 提取所有标签
  const allTags = Array.from(
    new Set(projects.flatMap((p) => p.tags || []))
  ).sort()

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => project.tags?.includes(tag))
    return matchesSearch && matchesTags
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">项目管理</h1>
            <p className="mt-2 text-gray-600">组织和管理您的创作项目</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            新建项目
          </button>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索项目名称或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {selectedProjects.size > 0 && (
              <button
                onClick={handleBatchDelete}
                className="btn-danger flex items-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                批量删除 ({selectedProjects.size})
              </button>
            )}
          </div>

          {/* 标签筛选 */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTags((prev) =>
                      prev.includes(tag)
                        ? prev.filter((t) => t !== tag)
                        : [...prev, tag]
                    )
                  }}
                  className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                    selectedTags.includes(tag)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 项目网格 */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">还没有项目</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 btn-primary"
            >
              创建第一个项目
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* 封面图片 */}
                <Link href={`/projects/${project.id}`}>
                  <div className="aspect-video bg-gray-200 relative group cursor-pointer">
                    {project.coverImage ? (
                      <img
                        src={project.coverImage}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Folder className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-2">
                      {project.isPublic && (
                        <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                          公开
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* 项目信息 */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Link href={`/projects/${project.id}`}>
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                        {project.name}
                      </h3>
                    </Link>
                    <div className="flex gap-1">
                      <input
                        type="checkbox"
                        checked={selectedProjects.has(project.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedProjects)
                          if (e.target.checked) {
                            newSet.add(project.id)
                          } else {
                            newSet.delete(project.id)
                          }
                          setSelectedProjects(newSet)
                        }}
                        className="w-4 h-4"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  {/* 标签 */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 统计信息 */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Folder className="w-4 h-4" />
                      {project.fileCount} 文件
                    </span>
                    <span className="flex items-center gap-1">
                      <ImageIcon className="w-4 h-4" />
                      {project.generationCount} 生成
                    </span>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleShare(project.id, !project.isPublic)}
                        className="text-gray-600 hover:text-blue-600"
                        title={project.isPublic ? '设为私有' : '设为公开'}
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                      {project.isPublic && project.shareToken && (
                        <button
                          onClick={() => handleCopyShareLink(project.shareToken!)}
                          className="text-gray-600 hover:text-blue-600"
                          title="复制分享链接"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/projects/${project.id}/edit`}>
                        <button className="text-gray-600 hover:text-blue-600">
                          <Edit className="w-5 h-5" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-gray-600 hover:text-red-600"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 创建项目模态框 */}
        {showCreateModal && (
          <CreateProjectModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateProject}
          />
        )}
      </div>
    </div>
  )
}

function CreateProjectModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string, description?: string) => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('项目名称不能为空')
      return
    }
    onCreate(name.trim(), description.trim() || undefined)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">创建新项目</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              项目名称 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="输入项目名称"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              项目描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="输入项目描述（可选）"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
            <button type="submit" className="btn-primary">
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
