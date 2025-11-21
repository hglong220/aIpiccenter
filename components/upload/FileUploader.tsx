/**
 * 文件上传组件
 * 支持拖拽上传、进度显示、预览、多文件上传
 */

'use client'

import { useCallback, useState, useRef } from 'react'
import { UploadCloud, X, File, Image, Video, Music, FileText, Code, Archive, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import type { FileUploadResult, FileInfo } from '@/types'
import toast from 'react-hot-toast'

interface FileUploaderProps {
  onUploadComplete?: (file: FileUploadResult) => void
  onUploadError?: (error: string) => void
  maxFiles?: number
  acceptedTypes?: string[]
  maxSize?: number // bytes
  chunkSize?: number // bytes，超过此大小使用分片上传
  className?: string
}

interface UploadingFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error'
  result?: FileUploadResult
  error?: string
}

const CHUNK_SIZE_THRESHOLD = 100 * 1024 * 1024 // 100MB

export default function FileUploader({
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  acceptedTypes,
  maxSize,
  chunkSize = CHUNK_SIZE_THRESHOLD,
  className = '',
}: FileUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return Image
      case 'video':
        return Video
      case 'audio':
        return Music
      case 'document':
        return FileText
      case 'code':
        return Code
      case 'archive':
        return Archive
      default:
        return File
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const validateFile = useCallback((file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `文件大小超过限制 (${formatFileSize(maxSize)})`
    }

    if (acceptedTypes && !acceptedTypes.includes(file.type)) {
      return `不支持的文件类型: ${file.type}`
    }

    return null
  }, [maxSize, acceptedTypes])

  const uploadFileSimple = async (file: File): Promise<FileUploadResult> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload/v2', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || '上传失败')
    }

    return result.data
  }

  const uploadFileChunked = useCallback(async (file: File, fileId: string): Promise<FileUploadResult> => {
    // 计算MD5（简化版，实际应该使用Web Crypto API）
    const buffer = await file.arrayBuffer()
    const chunks = Math.ceil(file.size / chunkSize)
    
    // 初始化上传
    const initResponse = await fetch('/api/upload/chunk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'init',
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        md5: '', // 实际应该计算MD5
      }),
    })

    const initResult = await initResponse.json()
    if (!initResult.success) {
      throw new Error(initResult.error || '初始化上传失败')
    }

    const { fileId: uploadFileId, totalChunks, chunkSize: serverChunkSize } = initResult.data

    // 上传所有分片
    for (let i = 0; i < totalChunks; i++) {
      const start = i * serverChunkSize
      const end = Math.min(start + serverChunkSize, file.size)
      const chunk = buffer.slice(start, end)
      const chunkBase64 = btoa(String.fromCharCode(...new Uint8Array(chunk)))

      const uploadResponse = await fetch('/api/upload/chunk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'upload',
          fileId: uploadFileId,
          chunkIndex: i,
          chunk: chunkBase64,
          chunkMd5: '', // 实际应该计算MD5
        }),
      })

      const uploadResult = await uploadResponse.json()
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || `上传分片 ${i + 1}/${totalChunks} 失败`)
      }

      // 更新进度
      const progress = ((i + 1) / totalChunks) * 100
      setUploadingFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? { ...f, progress }
            : f
        )
      )
    }

    // 完成上传
    const completeResponse = await fetch('/api/upload/chunk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'complete',
        fileId: uploadFileId,
      }),
    })

    const completeResult = await completeResponse.json()
    if (!completeResult.success) {
      throw new Error(completeResult.error || '完成上传失败')
    }

    // 等待处理完成（实际应该轮询状态）
    return {
      fileId: uploadFileId,
      url: '',
      filename: file.name,
      mimeType: file.type,
      fileType: 'other',
      size: file.size,
      status: 'processing',
    }
  }, [chunkSize])

  const handleFileUpload = useCallback(async (file: File, fileId: string) => {
    try {
      setUploadingFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        )
      )

      let result: FileUploadResult

      if (file.size > chunkSize) {
        // 使用分片上传
        result = await uploadFileChunked(file, fileId)
      } else {
        // 使用简单上传
        result = await uploadFileSimple(file)
      }

      setUploadingFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? { ...f, status: 'success', progress: 100, result }
            : f
        )
      )

      onUploadComplete?.(result)
      toast.success(`文件 "${file.name}" 上传成功`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '上传失败'
      setUploadingFiles(prev =>
        prev.map(f =>
          f.id === fileId
            ? { ...f, status: 'error', error: errorMessage }
            : f
        )
      )
      onUploadError?.(errorMessage)
      toast.error(`文件 "${file.name}" 上传失败: ${errorMessage}`)
    }
  }, [onUploadComplete, onUploadError, chunkSize, uploadFileChunked])

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files).slice(0, maxFiles)
    const newFiles: UploadingFile[] = []

    fileArray.forEach((file) => {
      const error = validateFile(file)
      if (error) {
        toast.error(`文件 "${file.name}": ${error}`)
        return
      }

      const fileId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
      newFiles.push({
        id: fileId,
        file,
        progress: 0,
        status: 'pending',
      })
    })

    setUploadingFiles(prev => [...prev, ...newFiles])

    // 开始上传
    newFiles.forEach(({ id, file }) => {
      void handleFileUpload(file, id)
    })
  }, [maxFiles, handleFileUpload, validateFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFiles])

  const removeFile = (fileId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId))
  }

  return (
    <div className={className}>
      {/* 上传区域 */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes?.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
        />
        <UploadCloud className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          拖拽文件到此处或点击选择文件
        </p>
        <p className="text-sm text-gray-500 mb-4">
          支持所有文件类型，大文件自动使用分片上传
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          选择文件
        </button>
      </div>

      {/* 上传列表 */}
      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadingFiles.map((uploadingFile) => {
            const Icon = getFileIcon(uploadingFile.result?.fileType || 'other')
            
            return (
              <div
                key={uploadingFile.id}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
              >
                <Icon className="w-8 h-8 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadingFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(uploadingFile.file.size)}
                  </p>
                  {/* 进度条 */}
                  {uploadingFile.status === 'uploading' && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadingFile.progress}%` }}
                      />
                    </div>
                  )}
                  {uploadingFile.status === 'processing' && (
                    <p className="text-xs text-blue-600 mt-1">正在处理...</p>
                  )}
                  {uploadingFile.status === 'error' && uploadingFile.error && (
                    <p className="text-xs text-red-600 mt-1">{uploadingFile.error}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {uploadingFile.status === 'uploading' && (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  )}
                  {uploadingFile.status === 'success' && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                  {uploadingFile.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <button
                    onClick={() => removeFile(uploadingFile.id)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

