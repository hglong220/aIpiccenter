/**
 * 内容审核管理页面
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Shield, CheckCircle, XCircle, AlertTriangle, Filter, Search } from 'lucide-react'

interface ModerationLog {
  id: string
  userId: string
  contentType: string
  riskLevel: string
  passed: boolean
  score: number | null
  reason: string | null
  action: string
  createdAt: string
}

export default function ModerationManagementPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<ModerationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPassed, setFilterPassed] = useState<string>('all')
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>('all')

  useEffect(() => {
    if (!user || user.plan !== 'admin') {
      router.push('/')
      return
    }
    loadLogs()
  }, [user, router, filterPassed, filterRiskLevel])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterPassed !== 'all') {
        params.append('passed', filterPassed)
      }
      if (filterRiskLevel !== 'all') {
        params.append('riskLevel', filterRiskLevel)
      }

      const response = await fetch(`/api/admin/moderation?${params}`)
      const data = await response.json()
      if (data.success) {
        setLogs(data.data)
      }
    } catch (error) {
      console.error('Failed to load moderation logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'block':
        return 'bg-red-100 text-red-800'
      case 'review':
        return 'bg-yellow-100 text-yellow-800'
      case 'pass':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">内容审核管理</h1>
          <p className="mt-2 text-gray-600">查看和管理所有内容审核记录</p>
        </div>

        {/* 筛选 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <select
              value={filterPassed}
              onChange={(e) => setFilterPassed(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">所有结果</option>
              <option value="true">通过</option>
              <option value="false">拒绝</option>
            </select>
            <select
              value={filterRiskLevel}
              onChange={(e) => setFilterRiskLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">所有风险等级</option>
              <option value="pass">通过</option>
              <option value="review">需审核</option>
              <option value="block">阻止</option>
            </select>
          </div>
        </div>

        {/* 审核记录列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  内容类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  风险等级
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  结果
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  分数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  操作
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  时间
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.contentType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskLevelColor(
                        log.riskLevel
                      )}`}
                    >
                      {log.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.score !== null ? log.score.toFixed(2) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString('zh-CN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

