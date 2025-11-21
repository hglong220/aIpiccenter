'use client'

import { useState, useEffect } from 'react'
import { FolderPlus, Check } from 'lucide-react'
import toast from 'react-hot-toast'

interface SaveToProjectButtonProps {
    generationId: string
    compact?: boolean
}

interface Project {
    id: string
    name: string
}

export function SaveToProjectButton({ generationId, compact = false }: SaveToProjectButtonProps) {
    const [projects, setProjects] = useState<Project[]>([])
    const [showMenu, setShowMenu] = useState(false)
    const [saving, setSaving] = useState(false)
    const [savedProjects, setSavedProjects] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (showMenu) {
            loadProjects()
        }
    }, [showMenu])

    const loadProjects = async () => {
        try {
            const response = await fetch('/api/projects')
            const data = await response.json()
            if (data.success) {
                setProjects(data.data || [])
            }
        } catch (error) {
            console.error('Failed to load projects:', error)
        }
    }

    const handleSave = async (projectId: string) => {
        setSaving(true)
        try {
            const response = await fetch(`/api/projects/${projectId}/generations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ generationId }),
            })

            const data = await response.json()
            if (data.success) {
                toast.success('已保存到项目')
                setSavedProjects((prev) => new Set([...prev, projectId]))
                setShowMenu(false)
            } else {
                toast.error(data.error || '保存失败')
            }
        } catch (error) {
            toast.error('保存失败')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(!showMenu)}
                className={
                    compact
                        ? 'p-2 hover:bg-gray-100 rounded-lg transition-colors'
                        : 'btn-secondary flex items-center gap-2'
                }
                title="保存到项目"
            >
                <FolderPlus className="w-5 h-5" />
                {!compact && <span>保存到项目</span>}
            </button>

            {showMenu && (
                <>
                    {/* 背景遮罩 */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMenu(false)}
                    />

                    {/* 项目菜单 */}
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
                        <div className="p-3 border-b border-gray-200">
                            <p className="text-sm font-medium text-gray-700">选择项目</p>
                        </div>

                        {projects.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                还没有项目
                                <br />
                                <a href="/projects" className="text-blue-500 hover:underline">
                                    创建第一个项目
                                </a>
                            </div>
                        ) : (
                            <div className="py-1">
                                {projects.map((project) => {
                                    const isSaved = savedProjects.has(project.id)
                                    return (
                                        <button
                                            key={project.id}
                                            onClick={() => !isSaved && handleSave(project.id)}
                                            disabled={isSaved || saving}
                                            className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${isSaved || saving ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                        >
                                            <span className="text-sm text-gray-900 truncate">
                                                {project.name}
                                            </span>
                                            {isSaved && (
                                                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        <div className="p-3 border-t border-gray-200">
                            <a
                                href="/projects"
                                className="text-sm text-blue-500 hover:underline"
                                onClick={() => setShowMenu(false)}
                            >
                                + 新建项目
                            </a>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
