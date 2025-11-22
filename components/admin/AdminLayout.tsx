'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
    LayoutDashboard,
    Users,
    ShoppingCart,
    Image,
    Folder,
    FolderOpen,
    MessageSquare,
    Shield,
    MessageCircle,
    Key,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
} from 'lucide-react'
import { useState } from 'react'

interface AdminLayoutProps {
    children: ReactNode
}

const navigation = [
    { name: '控制台', href: '/admin', icon: LayoutDashboard },
    { name: '用户管理', href: '/admin/users', icon: Users },
    { name: '订单管理', href: '/admin/orders', icon: ShoppingCart },
    { name: '生成记录', href: '/admin/generations', icon: Image },
    { name: '文件管理', href: '/admin/files', icon: Folder },
    { name: '项目管理', href: '/admin/projects', icon: FolderOpen },
    { name: '聊天监控', href: '/admin/chats', icon: MessageSquare },
    { name: '内容审核', href: '/admin/moderation', icon: Shield },
    { name: '反馈管理', href: '/admin/feedback', icon: MessageCircle },
    { name: 'API管理', href: '/admin/api-management', icon: Key },
    { name: '数据分析', href: '/admin/analytics', icon: BarChart3 },
    { name: '系统设置', href: '/admin/settings', icon: Settings },
]

export function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname()
    const { user, logout } = useAuth()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 移动端侧边栏遮罩 */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* 侧边栏 */}
            <div
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo */}
                <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200 flex-shrink-0">
                    <h1 className="text-xl font-bold text-gray-900" style={{ marginTop: '23px' }}>AI Pic Center</h1>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-gray-500 hover:text-gray-700 absolute right-6"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* 导航菜单 */}
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-blue-50 text-blue-600 font-medium'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>

                {/* 用户信息 - 固定在底部 */}
                <div className="border-t border-gray-200 p-4 flex-shrink-0" style={{ marginBottom: '30px' }}>
                    <div className="flex items-center justify-center mb-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                            {user?.username?.[0]?.toUpperCase() || 'A'}
                        </div>
                    </div>
                    <button
                        onClick={() => void logout()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        退出登录
                    </button>
                </div>
            </div>

            {/* 主内容区 */}
            <div className="lg:pl-64">
                {/* 顶部栏 */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200 lg:hidden">
                    <div className="flex items-center justify-between h-16 px-4">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg font-semibold text-gray-900">后台管理</h1>
                        <div className="w-6" /> {/* 占位 */}
                    </div>
                </div>

                {/* 页面内容 */}
                <main>{children}</main>
            </div>
        </div>
    )
}
