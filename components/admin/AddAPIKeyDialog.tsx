/**
 * 添加API密钥对话框
 */

'use client'

import { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface AddAPIKeyDialogProps {
    providerId: string
    providerName: string
    onClose: () => void
    onSuccess: () => void
}

export function AddAPIKeyDialog({
    providerId,
    providerName,
    onClose,
    onSuccess,
}: AddAPIKeyDialogProps) {
    const [formData, setFormData] = useState({
        name: '',
        apiKey: '',
        endpoint: '',
        priority: 50,
        weight: 1,
        maxRequestsPerMinute: '',
    })
    const [showKey, setShowKey] = useState(false)
    const [saving, setSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.name || !formData.apiKey) {
            toast.error('请填写必填字段')
            return
        }

        setSaving(true)
        try {
            const response = await fetch('/api/admin/api-keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    providerId,
                    maxRequestsPerMinute: formData.maxRequestsPerMinute
                        ? parseInt(formData.maxRequestsPerMinute)
                        : null,
                }),
            })

            const data = await response.json()
            if (data.success) {
                toast.success('API密钥添加成功')
                onSuccess()
                onClose()
            } else {
                toast.error(data.error || '添加失败')
            }
        } catch (error) {
            toast.error('添加失败')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">添加API密钥</h3>
                        <p className="text-sm text-gray-500 mt-1">{providerName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            密钥名称 *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="例如: 主密钥-1, 备用密钥-2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            API密钥 *
                        </label>
                        <div className="relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={formData.apiKey}
                                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                                placeholder="输入API密钥"
                                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showKey ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            API端点
                        </label>
                        <input
                            type="url"
                            value={formData.endpoint}
                            onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                            placeholder="https://api.example.com/v1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-gray-500">可选，留空使用默认端点</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                优先级
                            </label>
                            <input
                                type="number"
                                value={formData.priority}
                                onChange={(e) =>
                                    setFormData({ ...formData, priority: parseInt(e.target.value) })
                                }
                                min="1"
                                max="100"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="mt-1 text-xs text-gray-500">1-100，越高越优先</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                权重
                            </label>
                            <input
                                type="number"
                                value={formData.weight}
                                onChange={(e) =>
                                    setFormData({ ...formData, weight: parseInt(e.target.value) })
                                }
                                min="1"
                                max="100"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="mt-1 text-xs text-gray-500">负载均衡权重</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            速率限制
                        </label>
                        <input
                            type="number"
                            value={formData.maxRequestsPerMinute}
                            onChange={(e) =>
                                setFormData({ ...formData, maxRequestsPerMinute: e.target.value })
                            }
                            placeholder="留空表示无限制"
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-gray-500">每分钟最大请求数</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            disabled={saving}
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? '添加中...' : '添加'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
