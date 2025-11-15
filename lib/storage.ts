/**
 * 对象存储服务抽象层
 * 支持多种存储后端：本地文件系统、AWS S3、阿里云OSS、Cloudflare R2、MinIO
 */

import { writeFile, readFile, unlink, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import crypto from 'crypto'

export interface StorageConfig {
  provider: 'local' | 's3' | 'oss' | 'r2' | 'minio'
  // Local storage config
  localPath?: string
  // S3 config
  s3Bucket?: string
  s3Region?: string
  s3AccessKeyId?: string
  s3SecretAccessKey?: string
  s3Endpoint?: string
  // OSS config
  ossBucket?: string
  ossRegion?: string
  ossAccessKeyId?: string
  ossAccessKeySecret?: string
  ossEndpoint?: string
  // R2 config
  r2Bucket?: string
  r2AccountId?: string
  r2AccessKeyId?: string
  r2SecretAccessKey?: string
  r2Endpoint?: string
  // MinIO config
  minioBucket?: string
  minioEndpoint?: string
  minioAccessKey?: string
  minioSecretKey?: string
  minioUseSSL?: boolean
}

export interface UploadResult {
  url: string
  path: string
  provider: string
}

export interface SignedUrlOptions {
  expiresIn?: number // 秒数，默认1小时
  maxAccess?: number // 最大访问次数
}

export abstract class StorageProvider {
  abstract upload(buffer: Buffer, path: string): Promise<UploadResult>
  abstract delete(path: string): Promise<void>
  abstract getSignedUrl(path: string, options?: SignedUrlOptions): Promise<string>
  abstract getPublicUrl(path: string): Promise<string | null>
}

/**
 * 本地文件系统存储
 */
export class LocalStorageProvider extends StorageProvider {
  private basePath: string

  constructor(config: StorageConfig) {
    super()
    this.basePath = config.localPath || join(process.cwd(), 'storage')
  }

  async upload(buffer: Buffer, path: string): Promise<UploadResult> {
    const fullPath = join(this.basePath, path)
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/') || fullPath.lastIndexOf('\\'))
    
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }
    
    await writeFile(fullPath, buffer)
    
    return {
      url: `/storage/${path}`,
      path: fullPath,
      provider: 'local',
    }
  }

  async delete(path: string): Promise<void> {
    const fullPath = join(this.basePath, path)
    if (existsSync(fullPath)) {
      await unlink(fullPath)
    }
  }

  async getSignedUrl(path: string, options?: SignedUrlOptions): Promise<string> {
    // 本地存储生成临时token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresIn = options?.expiresIn || 3600
    const expiresAt = Date.now() + expiresIn * 1000
    
    // 在实际应用中，应该将token存储到数据库并验证
    return `/storage/${path}?token=${token}&expires=${expiresAt}`
  }

  async getPublicUrl(path: string): Promise<string | null> {
    return `/storage/${path}`
  }
}

/**
 * AWS S3 存储（需要安装 @aws-sdk/client-s3）
 */
export class S3StorageProvider extends StorageProvider {
  private config: StorageConfig
  private s3Client: any

  constructor(config: StorageConfig) {
    super()
    this.config = config
    // 动态导入AWS SDK（如果可用）
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3')
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
      
      this.s3Client = new S3Client({
        region: config.s3Region,
        credentials: {
          accessKeyId: config.s3AccessKeyId || '',
          secretAccessKey: config.s3SecretAccessKey || '',
        },
        endpoint: config.s3Endpoint,
      })
    } catch (error) {
      console.warn('AWS S3 SDK not installed. Install @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner to use S3 storage.')
    }
  }

  async upload(buffer: Buffer, path: string): Promise<UploadResult> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized. Please install @aws-sdk/client-s3')
    }
    
    const { PutObjectCommand } = require('@aws-sdk/client-s3')
    const command = new PutObjectCommand({
      Bucket: this.config.s3Bucket,
      Key: path,
      Body: buffer,
    })
    
    await this.s3Client.send(command)
    
    return {
      url: `https://${this.config.s3Bucket}.s3.${this.config.s3Region}.amazonaws.com/${path}`,
      path,
      provider: 's3',
    }
  }

  async delete(path: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized')
    }
    
    const { DeleteObjectCommand } = require('@aws-sdk/client-s3')
    const command = new DeleteObjectCommand({
      Bucket: this.config.s3Bucket,
      Key: path,
    })
    
    await this.s3Client.send(command)
  }

  async getSignedUrl(path: string, options?: SignedUrlOptions): Promise<string> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized')
    }
    
    const { GetObjectCommand } = require('@aws-sdk/client-s3')
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
    
    const command = new GetObjectCommand({
      Bucket: this.config.s3Bucket,
      Key: path,
    })
    
    const expiresIn = options?.expiresIn || 3600
    return await getSignedUrl(this.s3Client, command, { expiresIn })
  }

  async getPublicUrl(path: string): Promise<string | null> {
    if (this.config.s3Bucket) {
      return `https://${this.config.s3Bucket}.s3.${this.config.s3Region}.amazonaws.com/${path}`
    }
    return null
  }
}

/**
 * 存储工厂函数
 */
export function createStorageProvider(config: StorageConfig): StorageProvider {
  switch (config.provider) {
    case 'local':
      return new LocalStorageProvider(config)
    case 's3':
      return new S3StorageProvider(config)
    case 'oss':
      // TODO: 实现阿里云OSS
      throw new Error('OSS storage not implemented yet')
    case 'r2':
      // Cloudflare R2兼容S3 API
      return new S3StorageProvider({
        ...config,
        s3Endpoint: config.r2Endpoint || `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
        s3Bucket: config.r2Bucket,
        s3AccessKeyId: config.r2AccessKeyId,
        s3SecretAccessKey: config.r2SecretAccessKey,
      })
    case 'minio':
      // MinIO兼容S3 API
      return new S3StorageProvider({
        ...config,
        s3Endpoint: config.minioEndpoint,
        s3Bucket: config.minioBucket,
        s3AccessKeyId: config.minioAccessKey,
        s3SecretAccessKey: config.minioSecretKey,
      })
    default:
      return new LocalStorageProvider(config)
  }
}

/**
 * 获取存储配置（从环境变量）
 */
export function getStorageConfig(): StorageConfig {
  const provider = (process.env.STORAGE_PROVIDER || 'local') as StorageConfig['provider']
  
  return {
    provider,
    localPath: process.env.STORAGE_LOCAL_PATH,
    // S3
    s3Bucket: process.env.S3_BUCKET,
    s3Region: process.env.S3_REGION,
    s3AccessKeyId: process.env.S3_ACCESS_KEY_ID,
    s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    s3Endpoint: process.env.S3_ENDPOINT,
    // R2
    r2Bucket: process.env.R2_BUCKET,
    r2AccountId: process.env.R2_ACCOUNT_ID,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    r2Endpoint: process.env.R2_ENDPOINT,
    // OSS
    ossBucket: process.env.OSS_BUCKET,
    ossRegion: process.env.OSS_REGION,
    ossAccessKeyId: process.env.OSS_ACCESS_KEY_ID,
    ossAccessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
    ossEndpoint: process.env.OSS_ENDPOINT,
    // MinIO
    minioBucket: process.env.MINIO_BUCKET,
    minioEndpoint: process.env.MINIO_ENDPOINT,
    minioAccessKey: process.env.MINIO_ACCESS_KEY,
    minioSecretKey: process.env.MINIO_SECRET_KEY,
    minioUseSSL: process.env.MINIO_USE_SSL === 'true',
  }
}

