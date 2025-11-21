'use client'

import { useRef, useState } from 'react'
import { Upload, X, File, Image, Video } from 'lucide-react'
import toast from 'react-hot-toast'

interface FileUploadModalProps {
    projectId: string
    onClose: () => void
    onSuccess: () => void
}

export function FileUploadModal({ projectId, onClose, onSuccess }: FileUploadModalProps) {
    const [uploading, setUploading] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || [])
        setSelectedFiles((prev) => [...prev, ...files])
    }

    const handleRemoveFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    }

    const handleUpload = async () => {
        if (selectedFiles.length === 0) {
            toast.error('请选择至少一个文件')
            return
        }

        setUploading(true)
        let successCount = 0
        let failCount = 0

        for (const file of selectedFiles) {
            try {
                // 1. 上传文件到服务器
                const formData = new FormData()
                formData.append('file', file)

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })

                const uploadData = await uploadRes.json()

                if (!uploadData.success) {
                    failCount++
                    continue
                }

                // 2. 将文件添加到项目
                const addRes = await fetch(`/api/projects/${projectId}/files`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileId: uploadData.data.id }),
                })

                const addData = await addRes.json()

                if (addData.success) {
                    successCount++
                } else {
                    failCount++
                }
            } catch (error) {
                console.error('Upload error:', error)
                failCount++
            }
        }

        setUploading(false)

        if (successCount > 0) {
            toast.success(`成功上传 ${successCount} 个文件`)
            onSuccess()
            onClose()
        }

        if (failCount > 0) {
            toast.error(`${failCount} 个文件上传失败`)
        }
    }

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) return <Image className="w-5 h-5 text-blue-500" />
        if (file.type.startsWith('video/')) return <Video className="w-5 h-5 text-purple-500" />
        return <File className="w-5 h-5 text-gray-500" />
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">上传文件到项目</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* 文件选择区 */}
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors mb-4"
                >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">点击选择文件或拖拽文件到这里</p>
                    <p className="text-sm text-gray-400 mt-1">支持图片、视频、文档等多种格式</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>

                {/* 已选文件列表 */}
                {selectedFiles.length > 0 && (
                    <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                            已选择 {selectedFiles.length} 个文件
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {selectedFiles.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {getFileIcon(file)}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatFileSize(file.size)}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveFile(index)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 操作按钮 */}
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="btn-secondary" disabled={uploading}>
                        取消
                    </button>
                    <button
                        onClick={handleUpload}
                        className="btn-primary flex items-center gap-2"
                        disabled={uploading || selectedFiles.length === 0}
                    >
                        {uploading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                上传中...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                上传 {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
