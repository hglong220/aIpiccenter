/**
 * 聊天监控页面
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AdminLayout } from '@/components/admin/AdminLayout'

export default function ChatsManagementPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [chats, setChats] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user || user.plan !== 'admin') {
            router.push('/admin/login')
            return
        }
        loadChats()
    }, [user, router])

    const loadChats = async () => {
        try {
            const response = await fetch('/api/admin/chats')
            const data = await response.json()
            if (data.success) {
                setChats(data.data.chats)
            }
        } catch (error) {
            console.error('Failed to load chats:', error)
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
                    <h1 className="text-3xl font-bold text-gray-900">聊天监控</h1>
                    <p className="mt-2 text-gray-600">查看所有聊天会话</p>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">会话ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">用户</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">标题</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">消息数</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">更新时间</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {chats.map((chat) => (
                                <tr key={chat.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-mono text-gray-900">{chat.id.substring(0, 12)}...</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{chat.user.username || chat.user.phone}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{chat.title || '未命名'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{chat._count.messages}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(chat.updatedAt).toLocaleString('zh-CN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    )
}
