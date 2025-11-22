/**
 * 反馈管理页面
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AdminLayout } from '@/components/admin/AdminLayout'

export default function FeedbackManagementPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [feedbacks, setFeedbacks] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!user || user.plan !== 'admin') {
            router.push('/admin/login')
            return
        }
        loadFeedbacks()
    }, [user, router])

    const loadFeedbacks = async () => {
        try {
            const response = await fetch('/api/admin/feedback')
            const data = await response.json()
            if (data.success) {
                setFeedbacks(data.data.feedbacks)
            }
        } catch (error) {
            console.error('Failed to load feedbacks:', error)
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
                    <h1 className="text-3xl font-bold text-gray-900">反馈管理</h1>
                    <p className="mt-2 text-gray-600">查看用户反馈</p>
                </div>

                <div className="space-y-4">
                    {feedbacks.map((feedback) => (
                        <div key={feedback.id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
                                        {feedback.type}
                                    </span>
                                    <p className="mt-2 text-sm text-gray-600">
                                        {feedback.user.username || feedback.user.phone} · {new Date(feedback.createdAt).toLocaleString('zh-CN')}
                                    </p>
                                </div>
                            </div>
                            <p className="text-gray-900">{feedback.content}</p>
                            {feedback.page && (
                                <p className="mt-2 text-sm text-gray-500">页面: {feedback.page}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    )
}
