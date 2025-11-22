/**
 * 文件管理页面
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { StatusBadge } from '@/components/admin/StatusBadge'

export default function FilesManagementPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [files, setFiles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('all')

    useEffect(() => {
        if (!user || user.plan !== 'admin') {
            router.push('/admin/login')
            return
        }
        loadFiles()
    }, [user, router, filterStatus])

    const loadFiles = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/files?status=${filterStatus}`)
            const data = await response.json()
            if (data.success) {
                setFiles(data.data.files)
            }
        } catch (error) {
            console.error('Failed to load files:', error)
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
                    <h1 className="text-3xl font-bold text-gray-900">文件管理</h1>
                    <p className="mt-2 text-gray-600">管理用户上传的文件</p>
                </div>

                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                    >
                        <option value="all">所有状态</option>
                        <option value="ready">就绪</option>
                        <option value="processing">处理中</option>
                        <option value="failed">失败</option>
                    </select>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">文件名</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">大小</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">上传时间</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {files.map((file) => (
                                <tr key={file.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-900">{file.originalFilename}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{file.user.username || file.user.phone}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{file.fileType}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{(file.size / 1024 / 1024).toFixed(2)} MB</td>
                                    <td className="px-6 py-4"><StatusBadge status={file.status} /></td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(file.createdAt).toLocaleString('zh-CN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    )
}
