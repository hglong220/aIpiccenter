import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

interface StatsCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    trend?: {
        value: number
        label: string
        isPositive?: boolean
    }
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo'
    subtitle?: string
}

const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    indigo: 'bg-indigo-500',
}

export function StatsCard({
    title,
    value,
    icon: Icon,
    trend,
    color = 'blue',
    subtitle,
}: StatsCardProps) {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                </div>
                <div className={`${colorClasses[color]} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>

            {trend && (
                <div className="flex items-center gap-2">
                    <span
                        className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'
                            }`}
                    >
                        {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                    </span>
                    <span className="text-sm text-gray-500">{trend.label}</span>
                </div>
            )}
        </div>
    )
}
