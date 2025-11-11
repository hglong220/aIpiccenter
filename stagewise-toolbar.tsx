'use client'

import { StagewiseToolbar } from '@stagewise/toolbar-react'

export function StagewiseDevToolbar() {
  if (process.env.NODE_ENV !== 'development') return null
  return <StagewiseToolbar />
}