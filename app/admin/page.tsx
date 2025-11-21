/**
 * 后台管理系统主页
 * 提供系统概览和导航
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  Users,
  ShoppingCart,
  Zap,
  FileText,
  Shield,
  Folder,
  Activity,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查管理员权限
    if (!user || user.plan !== 'admin') {
      router.push('/')
      return
    }

    loadStats()
  }, [user, router])

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const menuItems = [
    {
      title: '用户管理',
      description: '管理用户账号、积分、订阅计划',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500',
    },
    {
      title: '订单管理',
      description: '查看和管理所有订单',
      icon: ShoppingCart,
      href: '/admin/orders',
      color: 'bg-green-500',
    },
    {
      title: '生成任务',
      description: '监控和管理AI生成任务',
      icon: Zap,
      href: '/admin/tasks',
      color: 'bg-yellow-500',
    },
    {
      title: 'AI调度记录',
      description: '查看模型使用和调度记录',
      icon: Activity,
      href: '/admin/scheduler',
      color: 'bg-purple-500',
    },
    {
      title: '内容审核',
      description: '查看和管理内容审核记录',
      icon: Shield,
      href: '/admin/moderation',
      color: 'bg-red-500',
    },
    {
      title: '文件管理',
      description: '管理用户上传的文件',
      icon: Folder,
      href: '/admin/files',
      color: 'bg-indigo-500',
    },
    {
      title: '系统日志',
      description: '查看系统运行日志',
      icon: FileText,
      href: '/admin/logs',
      color: 'bg-gray-500',
    },
    {
      title: '系统设置',
      description: '模型切换、系统配置',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-teal-500',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">后台管理系统</h1>
          <p className="mt-2 text-gray-600">系统概览和管理功能</p>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总用户数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-500">+{stats.newUsersToday} 今日新增</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">总订单数</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-green-500" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">今日订单: {stats.ordersToday}</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">运行中任务</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.runningTasks}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">等待中: {stats.pendingTasks}</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">审核记录</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.moderationLogs}</p>
                </div>
                <Shield className="w-8 h-8 text-red-500" />
              </div>
              <div className="mt-4 flex items-center text-sm">
                <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-500">通过: {stats.passedModeration}</span>
                <XCircle className="w-4 h-4 text-red-500 ml-4 mr-1" />
                <span className="text-red-500">拒绝: {stats.rejectedModeration}</span>
              </div>
            </div>
          </div>
        )}

        {/* 功能菜单 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 group"
              >
                <div className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

