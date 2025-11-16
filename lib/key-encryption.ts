/**
 * API Key加密存储工具
 * 使用AES-256-GCM加密算法
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 64
const TAG_LENGTH = 16
const KEY_LENGTH = 32

/**
 * 从环境变量或配置获取加密密钥
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY or JWT_SECRET must be set for key encryption')
  }
  
  // 使用PBKDF2派生固定长度的密钥
  return crypto.pbkdf2Sync(key, 'aipiccenter-salt', 100000, KEY_LENGTH, 'sha512')
}

/**
 * 加密API Key
 */
export function encryptKey(plaintext: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const tag = cipher.getAuthTag()
    
    // 返回格式: iv:tag:encrypted
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
  } catch (error) {
    throw new Error(`加密失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 解密API Key
 */
export function decryptKey(ciphertext: string): string {
  try {
    const key = getEncryptionKey()
    const parts = ciphertext.split(':')
    
    if (parts.length !== 3) {
      throw new Error('无效的加密格式')
    }
    
    const iv = Buffer.from(parts[0], 'hex')
    const tag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    throw new Error(`解密失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 安全获取环境变量中的API Key（自动解密）
 */
export function getSecureApiKey(keyName: string, isEncrypted: boolean = false): string | undefined {
  const value = process.env[keyName]
  
  if (!value) {
    return undefined
  }
  
  if (isEncrypted) {
    try {
      return decryptKey(value)
    } catch (error) {
      console.error(`解密 ${keyName} 失败:`, error)
      return undefined
    }
  }
  
  return value
}

/**
 * 哈希API Key（用于存储和比较，不可逆）
 */
export function hashKey(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext).digest('hex')
}

/**
 * 验证API Key（比较哈希值）
 */
export function verifyKey(plaintext: string, hash: string): boolean {
  return hashKey(plaintext) === hash
}

