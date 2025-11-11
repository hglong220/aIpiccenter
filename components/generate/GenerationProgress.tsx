'use client'

import { Loader2 } from 'lucide-react'
import type { GenerationProgress as ProgressType } from '@/types'

interface GenerationProgressProps {
  progress: ProgressType
}

export function GenerationProgress({ progress }: GenerationProgressProps) {
  if (progress.status === 'idle') return null

  return (
    <div className="card">
      <div className="flex items-center space-x-4 mb-4">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {progress.status === 'generating' ? '正在生成您的图像...' : '正在处理...'}
          </h3>
          {progress.message && (
            <p className="text-xs text-gray-600">{progress.message}</p>
          )}
        </div>
        <span className="text-sm font-semibold text-primary-600">
          {Math.round(progress.progress)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-primary-500 to-primary-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${progress.progress}%` }}
          role="progressbar"
          aria-valuenow={progress.progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}

