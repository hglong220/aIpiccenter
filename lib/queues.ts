/**
 * BullMQ Queue Configuration
 * 
 * Defines all queues used in the application:
 * - aiQueue: AI generation tasks (text, image, etc.)
 * - videoQueue: Video generation tasks
 * - uploadProcessingQueue: File upload processing tasks
 */

import { Queue, QueueOptions } from 'bullmq'
import { redis } from './redis'

// Queue configuration
const queueOptions: QueueOptions = {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
}

// AI Generation Queue
export const aiQueue = new Queue('ai-generation', {
  ...queueOptions,
  defaultJobOptions: {
    ...queueOptions.defaultJobOptions,
    priority: 5, // Default priority
  },
})

// Video Generation Queue
export const videoQueue = new Queue('video-generation', {
  ...queueOptions,
  defaultJobOptions: {
    ...queueOptions.defaultJobOptions,
    priority: 3, // Lower priority than AI (videos take longer)
  },
})

// Upload Processing Queue
export const uploadProcessingQueue = new Queue('upload-processing', {
  ...queueOptions,
  defaultJobOptions: {
    ...queueOptions.defaultJobOptions,
    priority: 7, // Higher priority (user waiting for upload)
  },
})

// Queue status helper
export async function getQueueStatus() {
  const [aiWaiting, aiActive, aiCompleted, aiFailed] = await Promise.all([
    aiQueue.getWaitingCount(),
    aiQueue.getActiveCount(),
    aiQueue.getCompletedCount(),
    aiQueue.getFailedCount(),
  ])

  const [videoWaiting, videoActive, videoCompleted, videoFailed] = await Promise.all([
    videoQueue.getWaitingCount(),
    videoQueue.getActiveCount(),
    videoQueue.getCompletedCount(),
    videoQueue.getFailedCount(),
  ])

  const [uploadWaiting, uploadActive, uploadCompleted, uploadFailed] = await Promise.all([
    uploadProcessingQueue.getWaitingCount(),
    uploadProcessingQueue.getActiveCount(),
    uploadProcessingQueue.getCompletedCount(),
    uploadProcessingQueue.getFailedCount(),
  ])

  return {
    ai: {
      waiting: aiWaiting,
      active: aiActive,
      completed: aiCompleted,
      failed: aiFailed,
    },
    video: {
      waiting: videoWaiting,
      active: videoActive,
      completed: videoCompleted,
      failed: videoFailed,
    },
    upload: {
      waiting: uploadWaiting,
      active: uploadActive,
      completed: uploadCompleted,
      failed: uploadFailed,
    },
  }
}

