/**
 * 错误日志持久化系统
 * 支持本地文件存储和S3存储
 * 兼容Edge Runtime和Node.js Runtime
 */

import { prisma } from './prisma'

export interface ErrorLog {
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  error?: Error | string
  context?: Record<string, any>
  userId?: string
  requestId?: string
  timestamp?: Date
}

// 检查是否在Edge Runtime中
const isEdgeRuntime = typeof process === 'undefined' || !process.cwd

// 获取日志目录（兼容Edge Runtime）
function getLogDir(): string | null {
  if (isEdgeRuntime) {
    // Edge Runtime不支持文件系统操作
    return null
  }
  
  try {
    const path = require('path')
    const fs = require('fs')
    const cwd = process.cwd()
    const logDir = process.env.LOG_DIR || path.join(cwd, 'logs')
    
    // 确保日志目录存在
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
    
    return logDir
  } catch (error) {
    console.warn('无法创建日志目录:', error)
    return null
  }
}

const LOG_DIR = getLogDir()
const MAX_LOG_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_LOG_FILES = 10

/**
 * 获取当前日志文件路径
 */
function getLogFilePath(level: string): string | null {
  if (!LOG_DIR) {
    return null
  }
  
  try {
    const path = require('path')
    const date = new Date().toISOString().split('T')[0]
    return path.join(LOG_DIR, `${level}-${date}.log`)
  } catch (error) {
    return null
  }
}

/**
 * 轮转日志文件
 */
function rotateLogFile(filePath: string | null): void {
  if (!filePath || !LOG_DIR) {
    return
  }

  try {
    const fs = require('fs')
    const path = require('path')
    
    if (!fs.existsSync(filePath)) {
      return
    }

    const stats = fs.statSync(filePath)
    if (stats.size < MAX_LOG_SIZE) {
      return
    }

    // 重命名现有文件
    const timestamp = Date.now()
    const ext = path.extname(filePath)
    const base = path.basename(filePath, ext)
    const dir = path.dirname(filePath)
    const rotatedPath = path.join(dir, `${base}-${timestamp}${ext}`)
    
    fs.renameSync(filePath, rotatedPath)

    // 清理旧日志文件
    const files = fs.readdirSync(dir)
      .filter((f: string) => f.startsWith(base) && f.endsWith('.log'))
      .map((f: string) => ({
        name: f,
        path: path.join(dir, f),
        time: fs.statSync(path.join(dir, f)).mtime.getTime(),
      }))
      .sort((a: any, b: any) => b.time - a.time)

    // 删除超出限制的文件
    if (files.length > MAX_LOG_FILES) {
      files.slice(MAX_LOG_FILES).forEach((file: any) => {
        try {
          fs.unlinkSync(file.path)
        } catch (error) {
          console.error(`删除日志文件失败: ${file.path}`, error)
        }
      })
    }
  } catch (error) {
    console.warn('日志文件轮转失败:', error)
  }
}

/**
 * 写入日志到文件
 */
function writeToFile(log: ErrorLog): void {
  if (!LOG_DIR) {
    // Edge Runtime: 只记录到控制台
    console.log(`[${log.level.toUpperCase()}]`, log.message, log.error || '', log.context || '')
    return
  }

  try {
    const fs = require('fs')
    const filePath = getLogFilePath(log.level)
    
    if (!filePath) {
      return
    }

    rotateLogFile(filePath)

    const logEntry = {
      timestamp: (log.timestamp || new Date()).toISOString(),
      level: log.level,
      message: log.message,
      error: log.error instanceof Error ? {
        name: log.error.name,
        message: log.error.message,
        stack: log.error.stack,
      } : log.error,
      context: log.context,
      userId: log.userId,
      requestId: log.requestId,
    }

    const line = JSON.stringify(logEntry) + '\n'
    fs.appendFileSync(filePath, line, 'utf8')
  } catch (error) {
    console.error('写入日志文件失败:', error)
  }
}

/**
 * 写入日志到数据库（可选）
 */
async function writeToDatabase(log: ErrorLog): Promise<void> {
  try {
    // 这里可以扩展为写入数据库表
    // 当前先记录到控制台
    console.log('[Error Logger]', log)
  } catch (error) {
    console.error('写入数据库日志失败:', error)
  }
}

/**
 * 上传日志到S3（可选）
 */
async function uploadToS3(log: ErrorLog): Promise<void> {
  try {
    // 如果配置了S3，可以在这里实现上传逻辑
    const s3Enabled = process.env.S3_ENABLED === 'true'
    const s3Bucket = process.env.S3_BUCKET
    
    if (!s3Enabled || !s3Bucket) {
      return
    }

    // TODO: 实现S3上传逻辑
    // const s3 = new S3Client({ ... })
    // await s3.putObject({ ... })
  } catch (error) {
    console.error('上传日志到S3失败:', error)
  }
}

/**
 * 记录错误日志
 */
export async function logError(
  message: string,
  error?: Error | string,
  context?: Record<string, any>,
  userId?: string,
  requestId?: string
): Promise<void> {
  const log: ErrorLog = {
    level: 'error',
    message,
    error,
    context,
    userId,
    requestId,
    timestamp: new Date(),
  }

  // 写入文件
  writeToFile(log)

  // 写入数据库（异步）
  writeToDatabase(log).catch(console.error)

  // 上传到S3（异步）
  uploadToS3(log).catch(console.error)
}

/**
 * 记录警告日志
 */
export async function logWarning(
  message: string,
  context?: Record<string, any>,
  userId?: string,
  requestId?: string
): Promise<void> {
  const log: ErrorLog = {
    level: 'warn',
    message,
    context,
    userId,
    requestId,
    timestamp: new Date(),
  }

  writeToFile(log)
}

/**
 * 记录信息日志
 */
export async function logInfo(
  message: string,
  context?: Record<string, any>,
  userId?: string,
  requestId?: string
): Promise<void> {
  const log: ErrorLog = {
    level: 'info',
    message,
    context,
    userId,
    requestId,
    timestamp: new Date(),
  }

  writeToFile(log)
}

/**
 * 记录调试日志
 */
export async function logDebug(
  message: string,
  context?: Record<string, any>,
  userId?: string,
  requestId?: string
): Promise<void> {
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  const log: ErrorLog = {
    level: 'debug',
    message,
    context,
    userId,
    requestId,
    timestamp: new Date(),
  }

  writeToFile(log)
}

/**
 * 获取错误统计
 */
export async function getErrorStats(days: number = 7): Promise<{
  total: number
  byLevel: Record<string, number>
  recent: ErrorLog[]
}> {
  if (!LOG_DIR) {
    // Edge Runtime: 返回空统计
    return {
      total: 0,
      byLevel: {},
      recent: [],
    }
  }

  try {
    const fs = require('fs')
    const path = require('path')
    
    const files = fs.readdirSync(LOG_DIR)
      .filter((f: string) => f.startsWith('error-') && f.endsWith('.log'))
      .map((f: string) => path.join(LOG_DIR, f))

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const logs: ErrorLog[] = []
    const byLevel: Record<string, number> = {
      error: 0,
      warn: 0,
      info: 0,
      debug: 0,
    }

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8')
        const lines = content.split('\n').filter((l: string) => l.trim())

        for (const line of lines) {
          try {
            const log: ErrorLog = JSON.parse(line)
            const logDate = new Date(log.timestamp || 0)
            
            if (logDate >= cutoffDate) {
              logs.push(log)
              byLevel[log.level] = (byLevel[log.level] || 0) + 1
            }
          } catch (e) {
            // 跳过无效的日志行
          }
        }
      } catch (error) {
        console.error(`读取日志文件失败: ${file}`, error)
      }
    }

    // 按时间排序
    logs.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime()
      const timeB = new Date(b.timestamp || 0).getTime()
      return timeB - timeA
    })

    return {
      total: logs.length,
      byLevel,
      recent: logs.slice(0, 100), // 最近100条
    }
  } catch (error) {
    console.error('获取错误统计失败:', error)
    return {
      total: 0,
      byLevel: {},
      recent: [],
    }
  }
}

