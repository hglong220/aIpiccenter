/**
 * Task Status API
 * GET /api/queues/tasks/[taskId]
 * 
 * Returns the status of a specific task
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aiQueue, videoQueue, uploadProcessingQueue } from '@/lib/queues'

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params

    // Get task from database
    const task = await prisma.aiTask.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        userId: true,
        taskType: true,
        status: true,
        priority: true,
        progress: true,
        error: true,
        resultData: true,
        retryCount: true,
        maxRetries: true,
        createdAt: true,
        startedAt: true,
        completedAt: true,
      },
    })

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: 'Task not found',
        },
        { status: 404 }
      )
    }

    // Get job status from queue (if exists)
    let jobStatus = null
    try {
      // Try to find job in queues
      const queues = [aiQueue, videoQueue, uploadProcessingQueue]
      for (const queue of queues) {
        const job = await queue.getJob(taskId)
        if (job) {
          const state = await job.getState()
          jobStatus = {
            id: job.id,
            state,
            progress: job.progress,
            attemptsMade: job.attemptsMade,
            failedReason: job.failedReason,
          }
          break
        }
      }
    } catch (error) {
      // Job might not exist in queue (already completed/removed)
      console.log(`Job ${taskId} not found in queue`)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...task,
        queueStatus: jobStatus,
      },
    })
  } catch (error) {
    console.error('Error getting task status:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

