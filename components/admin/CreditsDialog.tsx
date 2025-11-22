/**
 * 积分管理对话框组件
 */

'use client'

import { useState } from 'react'
import { X, Plus, Minus } from 'lucide-react'

interface CreditsDialogProps {
    user: {
        id: string
        username: string | null
        phone: string
        credits: number
        creditsUsed?: number
    }
    onClose: () => void
    onSave: (userId: string, newCredits: number) => Promise<void>
}

export function CreditsDialog({ user, onClose, onSave }: CreditsDialogProps) {
    const [mode, setMode] = useState<'set' | 'add' | 'subtract'>('add')
    const [amount, setAmount] = useState('')
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        const value = parseInt(amount)
        if (isNaN(value) || value <= 0) {
            alert('请输入有效的积分数量')
            return
        }

        let newCredits = user.credits
        if (mode === 'set') {
            newCredits = value
        } else if (mode === 'add') {
            newCredits = user.credits + value
        } else if (mode === 'subtract') {
            newCredits = Math.max(0, user.credits - value)
        }

        setSaving(true)
        try {
            await onSave(user.id, newCredits)
            onClose()
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* 标题 */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">管理积分</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* 内容 */}
                <div className="p-6 space-y-6">
                    {/* 用户信息 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600">用户</div>
                        <div className="font-medium text-gray-900">
                            {user.username || user.phone}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-sm">
                            <span className="text-gray-600">当前积分</span>
                            <span className="font-semibold text-blue-600">{user.credits}</span>
                        </div>
                        {user.creditsUsed !== undefined && (
                            <div className="mt-1 flex items-center justify-between text-sm">
                                <span className="text-gray-600">已使用</span>
                                <span className="text-gray-500">{user.creditsUsed}</span>
                            </div>
                        )}
                    </div>

                    {/* 操作模式 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            操作类型
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => setMode('add')}
                                className={`px-4 py-2 rounded-lg border-2 transition-colors ${mode === 'add'
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Plus className="w-4 h-4 mx-auto mb-1" />
                                <div className="text-xs">增加</div>
                            </button>
                            <button
                                onClick={() => setMode('subtract')}
                                className={`px-4 py-2 rounded-lg border-2 transition-colors ${mode === 'subtract'
                                        ? 'border-red-500 bg-red-50 text-red-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Minus className="w-4 h-4 mx-auto mb-1" />
                                <div className="text-xs">减少</div>
                            </button>
                            <button
                                onClick={() => setMode('set')}
                                className={`px-4 py-2 rounded-lg border-2 transition-colors ${mode === 'set'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="text-lg mb-1">=</div>
                                <div className="text-xs">设置</div>
                            </button>
                        </div>
                    </div>

                    {/* 数量输入 */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {mode === 'set' ? '新积分数量' : '积分数量'}
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="输入数量"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="0"
                        />
                    </div>

                    {/* 预览 */}
                    {amount && !isNaN(parseInt(amount)) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="text-sm text-blue-800">
                                <div className="font-medium mb-1">操作预览</div>
                                <div className="flex items-center justify-between">
                                    <span>当前: {user.credits}</span>
                                    <span>→</span>
                                    <span className="font-semibold">
                                        {mode === 'set'
                                            ? parseInt(amount)
                                            : mode === 'add'
                                                ? user.credits + parseInt(amount)
                                                : Math.max(0, user.credits - parseInt(amount))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 按钮 */}
                <div className="flex gap-3 p-6 border-t">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        disabled={saving}
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !amount}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? '保存中...' : '确认'}
                    </button>
                </div>
            </div>
        </div>
    )
}
