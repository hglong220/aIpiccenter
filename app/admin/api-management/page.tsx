/**
 * API管理页面 - 简洁优化版
 * 管理AI提供商和API密钥
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AddProviderDialog } from '@/components/admin/AddProviderDialog'
import { AddAPIKeyDialog } from '@/components/admin/AddAPIKeyDialog'
import {
    Plus,
    Key,
    Settings,
    AlertCircle,
    CheckCircle,
    XCircle,
    Edit,
    Trash2,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface AIProvider {
    id: string
    name: string
    type: string
    displayName: string
    description: string | null
    enabled: boolean
    _count: {
        apiKeys: number
    }
}

interface APIKey {
    id: string
    name: string
    apiKey: string
    endpoint: string | null
    enabled: boolean
    priority: number
    weight: number
    status: string
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    provider: {
        id: string
        name: string
        displayName: string
    }
}

export default function APIManagementPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [providers, setProviders] = useState<AIProvider[]>([])
    const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null)
    const [apiKeys, setApiKeys] = useState<APIKey[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddProvider, setShowAddProvider] = useState(false)
    const [showAddKey, setShowAddKey] = useState(false)

    useEffect(() => {
        if (!user || user.plan !== 'admin') {
            router.push('/admin/login')
            return
        }
        loadProviders()
    }, [user, router])

    const loadProviders = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/api-providers')
            const data = await response.json()
            if (data.success) {
                setProviders(data.data.providers)
            }
        } catch (error) {
            console.error('Failed to load providers:', error)
            toast.error('加载提供商失败')
        } finally {
            setLoading(false)
        }
    }

    const loadAPIKeys = async (providerId: string) => {
        try {
            const response = await fetch(`/api/admin/api-keys?providerId=${providerId}`)
            const data = await response.json()
            if (data.success) {
                setApiKeys(data.data.keys)
            }
        } catch (error) {
            console.error('Failed to load API keys:', error)
            toast.error('加载API密钥失败')
        }
    }

    const handleSelectProvider = (provider: AIProvider) => {
        setSelectedProvider(provider)
        loadAPIKeys(provider.id)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-50 text-green-700 border-green-200'
            case 'rate_limited':
                return 'bg-yellow-50 text-yellow-700 border-yellow-200'
            case 'error':
                return 'bg-red-50 text-red-700 border-red-200'
            case 'disabled':
                return 'bg-gray-50 text-gray-700 border-gray-200'
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <CheckCircle className="w-3.5 h-3.5" />
            case 'rate_limited':
                return <AlertCircle className="w-3.5 h-3.5" />
            case 'error':
                return <XCircle className="w-3.5 h-3.5" />
            default:
                return <AlertCircle className="w-3.5 h-3.5" />
        }
    }

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="p-8 max-w-7xl mx-auto">
                {/* 顶部操作栏 */}
                <div className="mb-6 flex justify-end">
                    <button
                        onClick={() => setShowAddProvider(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        添加提供商
                    </button>
                </div>

                <div className="grid grid-cols-12 gap-6">
                    {/* 提供商列表 */}
                    <div className="col-span-4">
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 border-b border-gray-200 flex items-center justify-center" style={{ height: '64px' }}>
                                <h2 className="text-lg font-semibold text-gray-900" style={{ position: 'relative', top: '8px' }}>AI 提供商</h2>
                            </div>
                            <div className="divide-y divide-gray-100 max-h-[calc(100vh-280px)] overflow-y-auto">
                                {providers.map((provider) => (
                                    <div
                                        key={provider.id}
                                        onClick={() => handleSelectProvider(provider)}
                                        className={`px-4 py-3 cursor-pointer transition-colors ${selectedProvider?.id === provider.id
                                                ? 'bg-blue-50 border-l-2 border-blue-600'
                                                : 'hover:bg-gray-50 border-l-2 border-transparent'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900 mb-1">
                                                    {provider.displayName}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span className="px-2 py-0.5 bg-gray-100 rounded">
                                                        {provider.type}
                                                    </span>
                                                    <span>{provider._count.apiKeys} 个密钥</span>
                                                </div>
                                            </div>
                                            {provider.enabled ? (
                                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                            ) : (
                                                <XCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* API密钥列表 */}
                    <div className="col-span-8">
                        {selectedProvider ? (
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 border-b border-gray-200" style={{ minHeight: '64px' }}>
                                    <div className="flex items-center justify-center" style={{ height: '64px' }}>
                                        <h1 className="text-2xl font-semibold text-gray-900" style={{ transform: 'translateY(21px)' }}>API 管理</h1>
                                    </div>
                                    <div className="flex items-center justify-between px-4 pb-3">
                                        <div className="flex-1 text-center">
                                            <h2 className="text-base font-semibold text-gray-900">
                                                {selectedProvider.displayName}
                                            </h2>
                                            {selectedProvider.description && (
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {selectedProvider.description}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setShowAddKey(true)}
                                            className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg flex items-center gap-1.5 transition-colors ml-4"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            添加密钥
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 max-h-[calc(100vh-280px)] overflow-y-auto">
                                    {apiKeys.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-sm text-gray-500">暂无 API 密钥，点击右上角"添加密钥"按钮开始</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {apiKeys.map((key) => (
                                                <div
                                                    key={key.id}
                                                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            {/* 密钥名称和状态 */}
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <h3 className="text-sm font-medium text-gray-900">
                                                                    {key.name}
                                                                </h3>
                                                                <span
                                                                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${getStatusColor(
                                                                        key.status
                                                                    )}`}
                                                                >
                                                                    {getStatusIcon(key.status)}
                                                                    {key.status}
                                                                </span>
                                                            </div>

                                                            {/* API密钥 */}
                                                            <div className="mb-2 px-3 py-2 bg-gray-900 rounded text-xs text-gray-300 font-mono break-all">
                                                                {key.apiKey}
                                                            </div>

                                                            {/* 端点 */}
                                                            {key.endpoint && (
                                                                <div className="mb-2 text-xs text-gray-600">
                                                                    <span className="font-medium">端点:</span>{' '}
                                                                    <code className="text-blue-600">{key.endpoint}</code>
                                                                </div>
                                                            )}

                                                            {/* 统计信息 */}
                                                            <div className="grid grid-cols-4 gap-2 text-xs">
                                                                <div className="bg-gray-50 rounded px-2 py-1.5">
                                                                    <div className="text-gray-500">优先级</div>
                                                                    <div className="font-medium text-gray-900">{key.priority}</div>
                                                                </div>
                                                                <div className="bg-gray-50 rounded px-2 py-1.5">
                                                                    <div className="text-gray-500">权重</div>
                                                                    <div className="font-medium text-gray-900">{key.weight}</div>
                                                                </div>
                                                                <div className="bg-gray-50 rounded px-2 py-1.5">
                                                                    <div className="text-gray-500">成功率</div>
                                                                    <div className="font-medium text-gray-900">
                                                                        {key.totalRequests > 0
                                                                            ? Math.round(
                                                                                (key.successfulRequests / key.totalRequests) * 100
                                                                            )
                                                                            : 0}
                                                                        %
                                                                    </div>
                                                                </div>
                                                                <div className="bg-gray-50 rounded px-2 py-1.5">
                                                                    <div className="text-gray-500">总请求</div>
                                                                    <div className="font-medium text-gray-900">{key.totalRequests}</div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* 操作按钮 */}
                                                        <div className="flex gap-1 flex-shrink-0">
                                                            <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 border-b border-gray-200 flex items-center justify-center" style={{ height: '64px' }}>
                                    <h1 className="text-2xl font-semibold text-gray-900">API 管理</h1>
                                </div>
                                <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 280px)' }}>
                                    <div className="text-center">
                                        <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-sm text-gray-500">请选择一个 AI 提供商查看其 API 密钥</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 对话框 */}
                {showAddProvider && (
                    <AddProviderDialog
                        onClose={() => setShowAddProvider(false)}
                        onSuccess={() => {
                            loadProviders()
                            setShowAddProvider(false)
                        }}
                    />
                )}

                {showAddKey && selectedProvider && (
                    <AddAPIKeyDialog
                        providerId={selectedProvider.id}
                        providerName={selectedProvider.displayName}
                        onClose={() => setShowAddKey(false)}
                        onSuccess={() => {
                            loadAPIKeys(selectedProvider.id)
                            setShowAddKey(false)
                        }}
                    />
                )}
            </div>
        </AdminLayout>
    )
}
