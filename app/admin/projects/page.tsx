/**
 * 项目管理页面
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AdminLayout } from '@/components/admin/AdminLayout'

export default function ProjectsManagementPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user || user.plan !== 'admin') {
            router.push('/admin/login')
            return
        }
        loadProjects()
    }, [user, router])

    const loadProjects = async () => {
        try {
            const response = await fetch('/api/admin/projects')
            const data = await response.json()
            if (data.success) {
                setProjects(data.data.projects)
            }
        } catch (error) {
            console.error('Failed to load projects:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">项目管理</h1>
                    <p className="mt-2 text-gray-600">查看所有用户项目</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                        <div key={project.id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="text-3xl">{project.icon || '📦'}</div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                                    <p className="text-sm text-gray-500">{project.user.username || project.user.phone}</p>
                                </div>
                            </div>
                            {project.description && (
                                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                            )}
                            <div className="flex gap-4 text-sm text-gray-500">
                                <span>📄 {project._count.files} 文件</span>
                                <span>🎨 {project._count.generations} 生成</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    )
}
