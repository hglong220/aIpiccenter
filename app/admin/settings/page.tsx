/**
 * 系统设置页面
 * 模型切换、系统配置
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Save, Globe, Shield, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState({
    modelMode: 'international', // 'international' | 'domestic'
    moderationEnabled: true,
    autoModeration: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || user.plan !== 'admin') {
      router.push('/')
      return
    }
    loadSettings()
  }, [user, router])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      const data = await response.json()
      if (data.success) {
        setSettings(data.data)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await response.json()
      if (data.success) {
        toast.success('设置已保存')
      } else {
        toast.error(data.error || '保存失败')
      }
    } catch (error) {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">系统设置</h1>
          <p className="mt-2 text-gray-600">配置系统参数和模型切换</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* 模型模式 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">模型模式</h2>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="modelMode"
                  value="international"
                  checked={settings.modelMode === 'international'}
                  onChange={(e) =>
                    setSettings({ ...settings, modelMode: e.target.value as any })
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-medium">国际模式</div>
                  <div className="text-sm text-gray-500">
                    使用 GPT、Gemini、Runway、Pika 等国际模型
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="modelMode"
                  value="domestic"
                  checked={settings.modelMode === 'domestic'}
                  onChange={(e) =>
                    setSettings({ ...settings, modelMode: e.target.value as any })
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <div className="font-medium">国内模式</div>
                  <div className="text-sm text-gray-500">
                    使用 Kling、百度、阿里等国内模型
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 内容审核 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">内容审核</h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.moderationEnabled}
                  onChange={(e) =>
                    setSettings({ ...settings, moderationEnabled: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="font-medium">启用内容审核</div>
                  <div className="text-sm text-gray-500">
                    对所有用户上传的内容进行审核
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoModeration}
                  onChange={(e) =>
                    setSettings({ ...settings, autoModeration: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <div>
                  <div className="font-medium">自动审核</div>
                  <div className="text-sm text-gray-500">
                    自动审核通过的内容，仅标记高风险内容
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

