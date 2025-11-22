/**
 * 数据分析页面
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { TrendingUp, Users, DollarSign, Zap } from 'lucide-react'

export default function AnalyticsPage() {
    const { user } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!user || user.plan !== 'admin') {
            router.push('/admin/login')
            return
        }
    }, [user, router])

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">数据分析</h1>
                    <p className="mt-2 text-gray-600">查看系统数据分析和趋势</p>
                </div>

                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">数据分析功能</h3>
                    <p className="text-gray-600">
                        此功能正在开发中，敬请期待...
                    </p>
                </div>
            </div>
        </AdminLayout>
    )
}
