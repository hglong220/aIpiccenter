/**
 * 文件工具函数库
 * 用于文件类型检测、MIME类型识别、文件分类等
 */

import crypto from 'crypto'

// 支持的文件类型映射
export const FILE_TYPE_MAP: Record<string, string> = {
  // 图像
  'image/jpeg': 'image',
  'image/jpg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/tiff': 'image',
  'image/tif': 'image',
  'image/bmp': 'image',
  'image/svg+xml': 'image',
  'image/x-icon': 'image',
  'image/vnd.adobe.photoshop': 'image', // PSD
  
  // 视频
  'video/mp4': 'video',
  'video/quicktime': 'video', // MOV
  'video/x-msvideo': 'video', // AVI
  'video/x-matroska': 'video', // MKV
  'video/webm': 'video',
  'video/x-flv': 'video',
  'video/x-ms-wmv': 'video',
  
  // 音频
  'audio/mpeg': 'audio', // MP3
  'audio/mp3': 'audio',
  'audio/wav': 'audio',
  'audio/x-wav': 'audio',
  'audio/flac': 'audio',
  'audio/x-flac': 'audio',
  'audio/mp4': 'audio', // M4A
  'audio/x-m4a': 'audio',
  'audio/ogg': 'audio',
  'audio/webm': 'audio',
  'audio/aac': 'audio',
  
  // 文档
  'application/pdf': 'document',
  'text/plain': 'document',
  'text/markdown': 'document',
  'text/csv': 'document',
  'application/msword': 'document', // DOC
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document', // DOCX
  'application/vnd.ms-excel': 'document', // XLS
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'document', // XLSX
  'application/vnd.ms-powerpoint': 'document', // PPT
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'document', // PPTX
  'application/json': 'document',
  'application/xml': 'document',
  'text/xml': 'document',
  'text/html': 'document',
  
  // 代码
  'text/javascript': 'code',
  'application/javascript': 'code',
  'text/typescript': 'code',
  'application/typescript': 'code',
  'text/x-python': 'code',
  'text/x-java': 'code',
  'text/x-c': 'code',
  'text/x-c++': 'code',
  'text/x-csharp': 'code',
  'text/x-go': 'code',
  'text/x-rust': 'code',
  'text/x-php': 'code',
  'text/x-ruby': 'code',
  'text/x-swift': 'code',
  'text/x-kotlin': 'code',
  'text/x-scala': 'code',
  'text/x-clojure': 'code',
  'text/x-haskell': 'code',
  'text/x-lua': 'code',
  'text/x-perl': 'code',
  'text/x-shellscript': 'code',
  'text/x-bash': 'code',
  'text/x-sh': 'code',
  
  // 压缩包
  'application/zip': 'archive',
  'application/x-zip-compressed': 'archive',
  'application/x-rar-compressed': 'archive',
  'application/x-rar': 'archive',
  'application/x-7z-compressed': 'archive',
  'application/x-tar': 'archive',
  'application/gzip': 'archive',
  'application/x-gzip': 'archive',
  
  // 3D文件
  'model/obj': '3d',
  'application/x-tgif': '3d', // OBJ
  'model/fbx': '3d',
  'model/gltf+json': '3d',
  'model/gltf-binary': '3d',
  'application/x-blender': '3d',
}

// 文件扩展名到MIME类型的映射
export const EXTENSION_TO_MIME: Record<string, string> = {
  // 图像
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  psd: 'image/vnd.adobe.photoshop',
  
  // 视频
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  avi: 'video/x-msvideo',
  mkv: 'video/x-matroska',
  webm: 'video/webm',
  flv: 'video/x-flv',
  wmv: 'video/x-ms-wmv',
  
  // 音频
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  aac: 'audio/aac',
  
  // 文档
  pdf: 'application/pdf',
  txt: 'text/plain',
  md: 'text/markdown',
  csv: 'text/csv',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  json: 'application/json',
  xml: 'application/xml',
  html: 'text/html',
  htm: 'text/html',
  
  // 代码
  js: 'text/javascript',
  jsx: 'text/javascript',
  ts: 'text/typescript',
  tsx: 'text/typescript',
  py: 'text/x-python',
  java: 'text/x-java',
  c: 'text/x-c',
  cpp: 'text/x-c++',
  cc: 'text/x-c++',
  cxx: 'text/x-c++',
  cs: 'text/x-csharp',
  go: 'text/x-go',
  rs: 'text/x-rust',
  php: 'text/x-php',
  rb: 'text/x-ruby',
  swift: 'text/x-swift',
  kt: 'text/x-kotlin',
  scala: 'text/x-scala',
  clj: 'text/x-clojure',
  hs: 'text/x-haskell',
  lua: 'text/x-lua',
  pl: 'text/x-perl',
  sh: 'text/x-shellscript',
  bash: 'text/x-bash',
  
  // 压缩包
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',
  
  // 3D
  obj: 'model/obj',
  fbx: 'model/fbx',
  gltf: 'model/gltf+json',
  glb: 'model/gltf-binary',
  blend: 'application/x-blender',
}

/**
 * 根据文件扩展名获取MIME类型
 */
export function getMimeTypeFromExtension(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (!ext) return null
  return EXTENSION_TO_MIME[ext] || null
}

/**
 * 根据MIME类型获取文件类型分类
 */
export function getFileTypeFromMime(mimeType: string): string {
  return FILE_TYPE_MAP[mimeType] || 'other'
}

/**
 * 检测文件类型（通过MIME类型和扩展名）
 */
export function detectFileType(filename: string, mimeType?: string): {
  mimeType: string
  fileType: string
  extension: string
} {
  const extension = filename.split('.').pop()?.toLowerCase() || ''
  const detectedMime = mimeType || getMimeTypeFromExtension(filename) || 'application/octet-stream'
  const fileType = getFileTypeFromMime(detectedMime)
  
  return {
    mimeType: detectedMime,
    fileType,
    extension,
  }
}

/**
 * 计算文件的MD5哈希值
 */
export async function calculateMD5(buffer: Buffer): Promise<string> {
  return crypto.createHash('md5').update(buffer).digest('hex')
}

/**
 * 计算文件分片的MD5
 */
export function calculateChunkMD5(chunk: Buffer): string {
  return crypto.createHash('md5').update(chunk).digest('hex')
}

/**
 * 生成唯一文件名
 */
export function generateUniqueFilename(originalFilename: string, userId: string): string {
  const timestamp = Date.now()
  const randomStr = Math.random().toString(36).substring(2, 15)
  const extension = originalFilename.split('.').pop() || 'bin'
  return `${userId}/${timestamp}-${randomStr}.${extension}`
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 验证MIME类型是否匹配文件扩展名（防止文件伪装）
 */
export function validateMimeType(filename: string, declaredMimeType: string): boolean {
  const detectedMime = getMimeTypeFromExtension(filename)
  if (!detectedMime) return true // 如果无法检测，允许通过（由内容审核处理）
  
  // 允许的MIME类型映射（同一文件类型可能有多个MIME类型）
  const allowedMimes: Record<string, string[]> = {
    'image/jpeg': ['image/jpeg', 'image/jpg'],
    'image/jpg': ['image/jpeg', 'image/jpg'],
    'text/javascript': ['text/javascript', 'application/javascript'],
    'application/javascript': ['text/javascript', 'application/javascript'],
  }
  
  const allowed = allowedMimes[declaredMimeType] || [declaredMimeType]
  return allowed.includes(detectedMime) || detectedMime === declaredMimeType
}

/**
 * 检查文件大小是否超过限制
 */
export function checkFileSizeLimit(size: number, fileType: string): { allowed: boolean; maxSize: number } {
  const limits: Record<string, number> = {
    image: 50 * 1024 * 1024, // 50MB
    video: 5 * 1024 * 1024 * 1024, // 5GB
    audio: 500 * 1024 * 1024, // 500MB
    document: 100 * 1024 * 1024, // 100MB
    code: 50 * 1024 * 1024, // 50MB
    archive: 2 * 1024 * 1024 * 1024, // 2GB
    '3d': 500 * 1024 * 1024, // 500MB
    other: 100 * 1024 * 1024, // 100MB
  }
  
  const maxSize = limits[fileType] || limits.other
  return {
    allowed: size <= maxSize,
    maxSize,
  }
}

/**
 * 获取推荐的分片大小（根据文件大小）
 */
export function getRecommendedChunkSize(fileSize: number): number {
  if (fileSize < 10 * 1024 * 1024) {
    return 5 * 1024 * 1024 // 5MB for files < 10MB
  } else if (fileSize < 100 * 1024 * 1024) {
    return 10 * 1024 * 1024 // 10MB for files < 100MB
  } else if (fileSize < 1024 * 1024 * 1024) {
    return 20 * 1024 * 1024 // 20MB for files < 1GB
  } else {
    return 50 * 1024 * 1024 // 50MB for files >= 1GB
  }
}

