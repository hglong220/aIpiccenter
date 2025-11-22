/**
 * 订单管理页面
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { Search, Download, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

interface Order {
    id: string
    user: {
        username: string | null
        phone: string
    }
    planName: string
    amount: number
    credits: number
    paymentMethod: string
    paymentStatus: string
    createdAt: string
    paidAt: string | null
}

export default function OrdersManagementPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')

    useEffect(() => {
        if (!user || user.plan !== 'admin') {
            router.push('/admin/login')
            return
        }
        loadOrders()
    }, [user, router, filterStatus])

    const loadOrders = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/orders?status=${filterStatus}`)
            const data = await response.json()
            if (data.success) {
                setOrders(data.data.orders)
            }
        } catch (error) {
            console.error('Failed to load orders:', error)
            toast.error('加载订单列表失败')
        } finally {
            setLoading(false)
        }
    }

    const filteredOrders = orders.filter((order) =>
        order.user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user.phone.includes(searchTerm) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </AdminLayout>
        )
    }

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">订单管理</h1>
                        <p className="mt-2 text-gray-600">查看和管理所有订单</p>
                    </div>
                    <button className="btn-secondary flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        导出
                    </button>
                </div>

                {/* 搜索和筛选 */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="搜索订单ID、用户名或手机号..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">所有状态</option>
                            <option value="pending">待支付</option>
                            <option value="paid">已支付</option>
                            <option value="failed">支付失败</option>
                            <option value="refunded">已退款</option>
                        </select>
                    </div>
                </div>

                {/* 订单列表 */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    订单ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    用户
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    套餐
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    金额
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    状态
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    创建时间
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                        {order.id.substring(0, 12)}...
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {order.user.username || '未设置'}
                                        </div>
                                        <div className="text-sm text-gray-500">{order.user.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {order.planName}
                                        <div className="text-xs text-gray-500">{order.credits} 积分</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        ¥{(order.amount / 100).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={order.paymentStatus} type="payment" />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(order.createdAt).toLocaleString('zh-CN')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-blue-600 hover:text-blue-800">
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    )
}
