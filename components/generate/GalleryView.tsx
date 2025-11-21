'use client'

import { useState, useEffect } from 'react'
import { Search, Images, Star, Play, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

export function GalleryView() {
    // 画廊状态
    const [gallerySearch, setGallerySearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('全部')
    const [selectedItem, setSelectedItem] = useState<any>(null)
    const [columnCount, setColumnCount] = useState(4)

    // 响应式列数
    useEffect(() => {
        const updateColumns = () => {
            const width = window.innerWidth
            if (width < 640) setColumnCount(1)
            else if (width < 1024) setColumnCount(2)
            else if (width < 1400) setColumnCount(3)
            else setColumnCount(4)
        }

        updateColumns()
        window.addEventListener('resize', updateColumns)
        return () => window.removeEventListener('resize', updateColumns)
    }, [])

    // 分类标签
    const categories = ['全部', '风景', '人物', '抽象', '动物', '建筑', '艺术', '科技']

    // 模拟画廊数据 - 真实的Pinterest风格,不同高度
    const galleryItems = [
        {
            id: '1',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
            prompt: '壮丽的山脉日出,金色阳光洒在雪峰上,云海翻腾',
            author: '用户A',
            likes: 234,
            category: '风景',
            aspectRatio: 1.5
        },
        {
            id: '2',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
            prompt: '星空下的银河,璀璨星辰点缀夜空,流星划过天际',
            author: '用户B',
            likes: 189,
            category: '风景',
            aspectRatio: 0.7
        },
        {
            id: '3',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
            prompt: '专业商务人士肖像,自信微笑,现代办公室背景',
            author: '用户C',
            likes: 156,
            category: '人物',
            aspectRatio: 1.3
        },
        {
            id: '4',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800',
            prompt: '可爱的猫咪特写,毛茸茸的面部,明亮的眼睛',
            author: '用户D',
            likes: 298,
            category: '动物',
            aspectRatio: 1.0
        },
        {
            id: '5',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800',
            prompt: '现代建筑外观,几何线条,玻璃幕墙反射蓝天',
            author: '用户E',
            likes: 142,
            category: '建筑',
            aspectRatio: 0.6
        },
        {
            id: '6',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800',
            prompt: '抽象艺术,色彩渐变,流动的形状和纹理',
            author: '用户F',
            likes: 178,
            category: '抽象',
            aspectRatio: 1.4
        },
        {
            id: '7',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800',
            prompt: '森林深处的小径,阳光透过树叶洒下斑驳光影',
            author: '用户G',
            likes: 267,
            category: '风景',
            aspectRatio: 1.6
        },
        {
            id: '8',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=800',
            prompt: '时尚人像摄影,黑白色调,强烈的光影对比',
            author: '用户H',
            likes: 312,
            category: '人物',
            aspectRatio: 0.65
        },
        {
            id: '9',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800',
            prompt: '海边日落,橙红色的天空倒映在平静的海面上',
            author: '用户I',
            likes: 445,
            category: '风景',
            aspectRatio: 1.8
        },
        {
            id: '10',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
            prompt: '慵懒的猫咪躺在阳光下,毛发在光线中闪闪发光',
            author: '用户J',
            likes: 523,
            category: '动物',
            aspectRatio: 1.1
        },
        {
            id: '11',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800',
            prompt: '城市天际线,摩天大楼在夜晚灯光的映衬下熠熠生辉',
            author: '用户K',
            likes: 198,
            category: '建筑',
            aspectRatio: 1.35
        },
        {
            id: '12',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
            prompt: '抽象几何图案,鲜艳的色彩和对称的设计',
            author: '用户L',
            likes: 167,
            category: '抽象',
            aspectRatio: 0.9
        },
        {
            id: '13',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
            prompt: '茂密的热带雨林,阳光穿透树冠形成光束',
            author: '用户M',
            likes: 289,
            category: '风景',
            aspectRatio: 0.75
        },
        {
            id: '14',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800',
            prompt: '优雅女性肖像,柔和光线,艺术摄影风格',
            author: '用户N',
            likes: 412,
            category: '人物',
            aspectRatio: 0.6
        },
        {
            id: '15',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=800',
            prompt: '极简主义建筑,白色墙面与蓝天的对比',
            author: '用户O',
            likes: 156,
            category: '建筑',
            aspectRatio: 1.5
        },
        {
            id: '16',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800',
            prompt: '水彩风格抽象画,柔和的色调融合',
            author: '用户P',
            likes: 201,
            category: '艺术',
            aspectRatio: 1.2
        },
        {
            id: '17',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
            prompt: '未来科技感的数字艺术,霓虹灯光效果',
            author: '用户Q',
            likes: 334,
            category: '科技',
            aspectRatio: 1.7
        },
        {
            id: '18',
            type: 'image',
            url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
            prompt: '宁静的湖泊倒影,山峦与天空完美对称',
            author: '用户R',
            likes: 278,
            category: '风景',
            aspectRatio: 1.4
        },
    ]

    // 过滤画廊项目
    const filteredItems = galleryItems.filter(item => {
        const matchesCategory = selectedCategory === '全部' || item.category === selectedCategory
        const matchesSearch = item.prompt.toLowerCase().includes(gallerySearch.toLowerCase())
        return matchesCategory && matchesSearch
    })

    // 将项目分配到各列 - 改进的算法,更好地平衡高度
    const distributeToColumns = (items: any[]) => {
        const columns: any[][] = Array.from({ length: columnCount }, () => [])
        const columnHeights = Array(columnCount).fill(0)

        items.forEach(item => {
            // 找到最短的列
            const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights))
            columns[shortestColumnIndex].push(item)
            // 使用实际高度计算,考虑宽高比
            columnHeights[shortestColumnIndex] += 1 / (item.aspectRatio || 1)
        })

        return columns
    }

    const columns = distributeToColumns(filteredItems)

    return (
        <div style={{ width: '100%', maxWidth: '1600px', padding: '32px 24px' }}>
            {/* 顶部搜索栏 */}
            <div style={{ marginBottom: '28px' }}>
                <div style={{ position: 'relative', maxWidth: '680px', margin: '0 auto' }}>
                    <Search
                        size={22}
                        style={{
                            position: 'absolute',
                            left: '18px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9ca3af'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="搜索提示词、风格、主题..."
                        value={gallerySearch}
                        onChange={(e) => setGallerySearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '16px 20px 16px 52px',
                            borderRadius: '50px',
                            border: '2px solid #e5e7eb',
                            fontSize: '15px',
                            outline: 'none',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#1d9bf0'
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(29, 155, 240, 0.15)'
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#e5e7eb'
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'
                        }}
                    />
                </div>
            </div>

            {/* 分类标签 */}
            <div style={{
                display: 'flex',
                gap: '10px',
                marginBottom: '36px',
                flexWrap: 'wrap',
                justifyContent: 'center'
            }}>
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '24px',
                            border: 'none',
                            backgroundColor: selectedCategory === category ? '#0f1419' : '#f7f9f9',
                            color: selectedCategory === category ? '#ffffff' : '#536471',
                            fontSize: '15px',
                            fontWeight: selectedCategory === category ? 600 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: selectedCategory === category ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                        }}
                        onMouseOver={(e) => {
                            if (selectedCategory !== category) {
                                e.currentTarget.style.backgroundColor = '#e5e7eb'
                            }
                        }}
                        onMouseOut={(e) => {
                            if (selectedCategory !== category) {
                                e.currentTarget.style.backgroundColor = '#f7f9f9'
                            }
                        }}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Pinterest风格瀑布流布局 */}
            {filteredItems.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '100px 24px',
                    backgroundColor: '#f7f9f9',
                    borderRadius: '20px',
                }}>
                    <Images size={64} style={{ color: '#aab8c2', margin: '0 auto 24px' }} />
                    <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#0f1419', marginBottom: '12px' }}>
                        没有找到相关内容
                    </h3>
                    <p style={{ fontSize: '16px', color: '#536471' }}>
                        尝试调整搜索关键词或选择其他分类
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                }}>
                    {columns.map((column, columnIndex) => (
                        <div
                            key={columnIndex}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                            }}
                        >
                            {column.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedItem(item)}
                                    style={{
                                        position: 'relative',
                                        borderRadius: '16px',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseOver={(e) => {
                                        const overlay = e.currentTarget.querySelector('.gallery-overlay') as HTMLElement
                                        if (overlay) {
                                            overlay.style.opacity = '1'
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        const overlay = e.currentTarget.querySelector('.gallery-overlay') as HTMLElement
                                        if (overlay) {
                                            overlay.style.opacity = '0'
                                        }
                                    }}
                                >
                                    {/* 图片 */}
                                    <img
                                        src={item.url}
                                        alt={item.prompt}
                                        style={{
                                            width: '100%',
                                            height: 'auto',
                                            display: 'block',
                                        }}
                                    />

                                    {/* 悬停信息层 */}
                                    <div
                                        className="gallery-overlay"
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)',
                                            opacity: 0,
                                            transition: 'opacity 0.2s ease',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'flex-end',
                                            padding: '16px',
                                        }}
                                    >
                                        {/* 提示词 */}
                                        <p style={{
                                            fontSize: '14px',
                                            color: '#ffffff',
                                            lineHeight: '1.4',
                                            marginBottom: '10px',
                                            fontWeight: 500,
                                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                                        }}>
                                            {item.prompt}
                                        </p>

                                        {/* 元数据 */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontSize: '13px',
                                            color: '#ffffff'
                                        }}>
                                            <span style={{ fontWeight: 500, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{item.author}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Star size={14} style={{ color: '#fbbf24', fill: '#fbbf24' }} />
                                                <span style={{ fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{item.likes}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 视频播放图标 */}
                                    {item.type === 'video' && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '12px',
                                            right: '12px',
                                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                            borderRadius: '50%',
                                            width: '40px',
                                            height: '40px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <Play size={20} style={{ color: '#ffffff', marginLeft: '2px' }} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}


            {/* 详情弹窗 */}
            {selectedItem && (
                <div
                    onClick={() => setSelectedItem(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '20px',
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '24px',
                            maxWidth: '1000px',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            flexDirection: window.innerWidth > 768 ? 'row' : 'column',
                        }}
                    >
                        {/* 左侧图片 */}
                        <div style={{
                            flex: window.innerWidth > 768 ? '1.5' : '1',
                            backgroundColor: '#000000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: window.innerWidth > 768 ? '24px 0 0 24px' : '24px 24px 0 0',
                            overflow: 'hidden',
                        }}>
                            <img
                                src={selectedItem.url}
                                alt={selectedItem.prompt}
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    maxHeight: '90vh',
                                    objectFit: 'contain',
                                }}
                            />
                        </div>

                        {/* 右侧信息 */}
                        <div style={{
                            flex: '1',
                            padding: '32px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '24px',
                            minWidth: window.innerWidth > 768 ? '380px' : 'auto',
                        }}>
                            {/* 关闭按钮 */}
                            <button
                                onClick={() => setSelectedItem(null)}
                                style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px',
                                    transition: 'all 0.2s',
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
                                }}
                            >
                                ×
                            </button>

                            {/* 作者信息 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    backgroundColor: '#1d9bf0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    fontSize: '20px',
                                    fontWeight: 700,
                                }}>
                                    {selectedItem.author[0]}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f1419', margin: 0 }}>
                                        {selectedItem.author}
                                    </h3>
                                    <p style={{ fontSize: '14px', color: '#536471', margin: 0 }}>
                                        {selectedItem.category}
                                    </p>
                                </div>
                            </div>

                            {/* 提示词 */}
                            <div>
                                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#536471', marginBottom: '8px' }}>
                                    提示词
                                </h4>
                                <p style={{
                                    fontSize: '16px',
                                    color: '#0f1419',
                                    lineHeight: '1.6',
                                    margin: 0,
                                    padding: '16px',
                                    backgroundColor: '#f7f9f9',
                                    borderRadius: '12px',
                                }}>
                                    {selectedItem.prompt}
                                </p>
                            </div>

                            {/* 操作按钮 */}
                            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(selectedItem.prompt)
                                        toast.success('提示词已复制')
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '14px 24px',
                                        borderRadius: '12px',
                                        border: '1px solid #e5e7eb',
                                        backgroundColor: '#ffffff',
                                        color: '#0f1419',
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f7f9f9'
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.backgroundColor = '#ffffff'
                                    }}
                                >
                                    <Copy size={18} />
                                    复制提示词
                                </button>
                                <button
                                    style={{
                                        padding: '14px 20px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        backgroundColor: '#1d9bf0',
                                        color: '#ffffff',
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.backgroundColor = '#1a8cd8'
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.backgroundColor = '#1d9bf0'
                                    }}
                                >
                                    <Star size={18} />
                                    {selectedItem.likes}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
