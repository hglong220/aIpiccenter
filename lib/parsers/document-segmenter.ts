/**
 * 超长文档分段器
 * 将长文档分割成适合 AI 处理的段落
 */

export interface DocumentSegment {
  id: string
  text: string
  startIndex: number
  endIndex: number
  tokenCount?: number
  metadata?: {
    pageNumber?: number
    sectionTitle?: string
  }
}

export interface SegmentationOptions {
  maxTokens?: number // 每段最大 token 数（默认 2000）
  overlap?: number // 重叠 token 数（默认 200）
  preserveParagraphs?: boolean // 是否保持段落完整
}

/**
 * 文档分段
 */
export function segmentDocument(
  text: string,
  options: SegmentationOptions = {}
): DocumentSegment[] {
  const {
    maxTokens = 2000,
    overlap = 200,
    preserveParagraphs = true,
  } = options

  const segments: DocumentSegment[] = []

  if (preserveParagraphs) {
    // 按段落分割
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    let currentSegment = ''
    let startIndex = 0
    let segmentId = 0

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i]
      const paragraphTokens = estimateTokenCount(paragraph)
      const currentTokens = estimateTokenCount(currentSegment)

      if (currentTokens + paragraphTokens > maxTokens && currentSegment.length > 0) {
        // 保存当前段
        segments.push({
          id: `segment_${segmentId++}`,
          text: currentSegment.trim(),
          startIndex,
          endIndex: startIndex + currentSegment.length,
          tokenCount: currentTokens,
        })

        // 开始新段（包含重叠）
        const overlapText = getOverlapText(currentSegment, overlap)
        currentSegment = overlapText + '\n\n' + paragraph
        startIndex = startIndex + currentSegment.length - overlapText.length - paragraph.length
      } else {
        currentSegment += (currentSegment ? '\n\n' : '') + paragraph
      }
    }

    // 添加最后一段
    if (currentSegment.trim().length > 0) {
      segments.push({
        id: `segment_${segmentId++}`,
        text: currentSegment.trim(),
        startIndex,
        endIndex: startIndex + currentSegment.length,
        tokenCount: estimateTokenCount(currentSegment),
      })
    }
  } else {
    // 简单按字符数分割
    const chunkSize = maxTokens * 4 // 粗略估算：1 token ≈ 4 字符
    const overlapSize = overlap * 4

    for (let i = 0; i < text.length; i += chunkSize - overlapSize) {
      const chunk = text.slice(i, i + chunkSize)
      segments.push({
        id: `segment_${segments.length}`,
        text: chunk,
        startIndex: i,
        endIndex: Math.min(i + chunkSize, text.length),
        tokenCount: estimateTokenCount(chunk),
      })
    }
  }

  return segments
}

/**
 * 估算 token 数量（简化版）
 * 实际应该使用 tiktoken 等库
 */
function estimateTokenCount(text: string): number {
  // 粗略估算：中文 1 字符 ≈ 1 token，英文 4 字符 ≈ 1 token
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const englishChars = text.length - chineseChars
  return chineseChars + Math.ceil(englishChars / 4)
}

/**
 * 获取重叠文本
 */
function getOverlapText(text: string, overlapTokens: number): string {
  const overlapChars = overlapTokens * 4 // 粗略估算
  if (text.length <= overlapChars) {
    return text
  }
  
  // 从末尾提取重叠部分，尽量在句子边界
  const overlapText = text.slice(-overlapChars)
  const lastSentenceEnd = overlapText.lastIndexOf('。') || overlapText.lastIndexOf('.')
  
  if (lastSentenceEnd > overlapChars / 2) {
    return overlapText.slice(lastSentenceEnd + 1).trim()
  }
  
  return overlapText.trim()
}

