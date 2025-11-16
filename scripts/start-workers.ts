/**
 * Start Queue Workers
 * 
 * This script starts all queue workers for processing jobs.
 * Run this in a separate process from the main Next.js app.
 * 
 * Usage: tsx scripts/start-workers.ts
 */

import { aiWorker, videoWorker, uploadWorker } from '../lib/queue-workers'

// 检查环境变量
if (!process.env.REDIS_URL) {
  console.error('❌ REDIS_URL environment variable is not set')
  process.exit(1)
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set')
  process.exit(1)
}

console.log('🚀 Starting queue workers...')
console.log('📋 AI Worker: Processing AI generation tasks')
console.log('🎬 Video Worker: Processing video generation tasks')
console.log('📤 Upload Worker: Processing file upload tasks')
console.log(`🔗 Redis URL: ${process.env.REDIS_URL}`)
console.log(`💾 Database URL: ${process.env.DATABASE_URL?.substring(0, 20)}...`)
console.log('\nWorkers are running. Press Ctrl+C to stop.\n')

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down workers...')
  
  await Promise.all([
    aiWorker.close(),
    videoWorker.close(),
    uploadWorker.close(),
  ])
  
  console.log('✅ Workers stopped')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down workers...')
  
  await Promise.all([
    aiWorker.close(),
    videoWorker.close(),
    uploadWorker.close(),
  ])
  
  console.log('✅ Workers stopped')
  process.exit(0)
})

