interface StatusBadgeProps {
    status: string
    type?: 'default' | 'payment' | 'task' | 'moderation'
}

const statusConfig = {
    // 支付状态
    pending: { label: '待支付', color: 'bg-yellow-100 text-yellow-800' },
    paid: { label: '已支付', color: 'bg-green-100 text-green-800' },
    failed: { label: '支付失败', color: 'bg-red-100 text-red-800' },
    refunded: { label: '已退款', color: 'bg-gray-100 text-gray-800' },

    // 任务状态
    success: { label: '成功', color: 'bg-green-100 text-green-800' },
    running: { label: '运行中', color: 'bg-blue-100 text-blue-800' },
    retry: { label: '重试中', color: 'bg-orange-100 text-orange-800' },

    // 审核状态
    pass: { label: '通过', color: 'bg-green-100 text-green-800' },
    review: { label: '待审核', color: 'bg-yellow-100 text-yellow-800' },
    block: { label: '已拒绝', color: 'bg-red-100 text-red-800' },

    // 通用状态
    active: { label: '活跃', color: 'bg-green-100 text-green-800' },
    inactive: { label: '未激活', color: 'bg-gray-100 text-gray-800' },
    completed: { label: '已完成', color: 'bg-blue-100 text-blue-800' },
    cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-800' },
}

export function StatusBadge({ status, type = 'default' }: StatusBadgeProps) {
    const config = statusConfig[status as keyof typeof statusConfig] || {
        label: status,
        color: 'bg-gray-100 text-gray-800',
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
            {config.label}
        </span>
    )
}
