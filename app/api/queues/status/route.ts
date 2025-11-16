/**
 * Queue Status API
 * GET /api/queues/status
 * 
 * Returns the status of all queues (waiting, active, completed, failed counts)
 */

import { NextResponse } from 'next/server'
import { getQueueStatus } from '@/lib/queues'

export async function GET() {
  try {
    const status = await getQueueStatus()

    return NextResponse.json({
      success: true,
      data: status,
    })
  } catch (error) {
    console.error('Error getting queue status:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

