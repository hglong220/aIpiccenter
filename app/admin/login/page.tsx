'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AuthForm } from '@/components/auth/AuthForm'

export default function AdminLoginPage() {
    const router = useRouter()
    const { user, loading } = useAuth()

    useEffect(() => {
        // 如果已登录且是管理员，直接跳转到后台
        if (!loading && user) {
            if (user.plan === 'admin') {
                router.replace('/admin')
            } else {
                // 已登录但不是管理员，跳转到首页
                router.replace('/')
            }
        }
    }, [loading, user, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    // 未登录或正在加载时显示登录表单
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                {/* 顶部标识 */}
                <div className="bg-blue-600 text-white py-3 px-4 text-center">
                    <div className="max-w-4xl mx-auto flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="font-semibold">管理员登录</span>
                    </div>
                </div>

                {/* 登录表单容器 */}
                <div className="flex items-center justify-center px-4 py-12">
                    <div className="w-full max-w-md">
                        {/* 标题 */}
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">后台管理系统</h1>
                            <p className="text-gray-600">请使用管理员账号登录</p>
                        </div>

                        {/* 登录表单 */}
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <AuthForm
                                initialMode="login"
                                redirect="/admin"
                                isEmbedded={true}
                            />

                            {/* 提示信息 */}
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex gap-2">
                                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="text-sm text-blue-800">
                                        <p className="font-semibold mb-1">管理员登录说明</p>
                                        <ul className="list-disc list-inside space-y-1 text-blue-700">
                                            <li>仅限管理员账号访问</li>
                                            <li>请使用用户名或手机号登录</li>
                                            <li>建议使用密码登录方式</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* 返回首页链接 */}
                            <div className="mt-6 text-center">
                                <a
                                    href="/"
                                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    ← 返回首页
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // 已登录，正在重定向
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    )
}
