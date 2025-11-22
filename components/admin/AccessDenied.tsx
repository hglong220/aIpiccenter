'use client'

import { useAuth } from '@/contexts/AuthContext'
import { ShieldX } from 'lucide-react'

export function AccessDenied() {
    const { logout } = useAuth()

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                    {/* 图标 */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-red-100 rounded-full p-4">
                            <ShieldX className="w-12 h-12 text-red-600" />
                        </div>
                    </div>

                    {/* 标题 */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        访问受限
                    </h1>

                    {/* 描述 */}
                    <p className="text-gray-600 mb-6">
                        您没有权限访问后台管理系统。此区域仅限管理员账号访问。
                    </p>

                    {/* 操作按钮 */}
                    <div className="space-y-3">
                        <a
                            href="/"
                            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            返回首页
                        </a>

                        <button
                            onClick={() => void logout()}
                            className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            退出登录
                        </button>
                    </div>

                    {/* 额外信息 */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                            如果您认为这是一个错误，请联系系统管理员
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
