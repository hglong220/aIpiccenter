/**
 * 后台管理系统主页
 * 提供系统概览和导航
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AccessDenied } from '@/components/admin/AccessDenied'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { StatsCard } from '@/components/admin/StatsCard'
import {
  Users,
  DollarSign,
  Zap,
  Image,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 未登录，重定向到管理员登录页面
    if (!authLoading && !user) {
      router.push('/admin/login')
      return
    }

    // 已登录但不是管理员，不做跳转（显示 AccessDenied 组件）
    if (!authLoading && user && user.plan === 'admin') {
      loadStats()
    }
  }, [user, authLoading, router])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // 显示加载状态
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // 已登录但不是管理员，显示权限不足页面
  if (user && user.plan !== 'admin') {
    return <AccessDenied />
  }

  // 未登录会在 useEffect 中重定向，这里返回 null
  if (!user) {
    return null
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 text-center" style={{ position: 'relative', top: '10px' }}>总控制台</h1>
          <p className="mt-2 text-gray-600">系统概览和关键指标</p>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="总用户数"
              value={stats.users.total.toLocaleString()}
              icon={Users}
              color="blue"
              trend={{
                value: stats.users.trend,
                label: `今日新增 ${stats.users.today}`,
                isPositive: stats.users.trend >= 0,
              }}
            />

            <StatsCard
              title="总收入"
              value={`¥${(stats.revenue.total / 100).toLocaleString()}`}
              icon={DollarSign}
              color="green"
              trend={{
                value: stats.revenue.trend,
                label: `今日 ¥${(stats.revenue.today / 100).toLocaleString()}`,
                isPositive: stats.revenue.trend >= 0,
              }}
            />

            <StatsCard
              title="运行中任务"
              value={stats.tasks.running}
              icon={Zap}
              color="yellow"
              subtitle={`等待中: ${stats.tasks.pending} | 今日失败: ${stats.tasks.failedToday}`}
            />

            <StatsCard
              title="生成记录"
              value={stats.generations.total.toLocaleString()}
              icon={Image}
              color="purple"
              subtitle={`成功率: ${stats.generations.successRate}% | 今日: ${stats.generations.today}`}
            />
          </div>
        )}

        {/* 快捷操作 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <QuickActionCard
            title="用户管理"
            description="管理用户账号和权限"
            href="/admin/users"
            icon="👥"
          />
          <QuickActionCard
            title="订单管理"
            description="查看和处理订单"
            href="/admin/orders"
            icon="🛒"
          />
          <QuickActionCard
            title="内容审核"
            description="审核用户生成内容"
            href="/admin/moderation"
            icon="🛡️"
          />
        </div>

        {/* 系统告警 */}
        {stats && stats.tasks.failedToday > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">系统告警</h3>
                <p className="text-sm text-red-700">
                  今日有 {stats.tasks.failedToday} 个任务失败，请及时处理
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function QuickActionCard({ title, description, href, icon }: {
  title: string
  description: string
  href: string
  icon: string
}) {
  return (
    <a
      href={href}
      className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </a>
  )
}
