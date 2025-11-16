/**
 * 视频处理工具
 * - 视频转码
 * - 封面生成
 * - 视频文件保存
 */

import * as ffmpeg from 'fluent-ffmpeg'
import * as fs from 'fs'
import * as path from 'path'
import sharp from 'sharp'

export interface VideoProcessOptions {
  outputFormat?: 'mp4' | 'webm' | 'mov'
  quality?: 'low' | 'medium' | 'high'
  resolution?: string // e.g., '1920x1080'
  fps?: number
}

/**
 * 下载视频文件
 */
export async function downloadVideo(videoUrl: string, outputPath: string): Promise<string> {
  try {
    const response = await fetch(videoUrl)
    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    fs.writeFileSync(outputPath, buffer)

    return outputPath
  } catch (error: any) {
    console.error('[Video Processor] Error downloading video:', error)
    throw new Error(`Video download failed: ${error.message}`)
  }
}

/**
 * 视频转码
 */
export async function transcodeVideo(
  inputPath: string,
  outputPath: string,
  options: VideoProcessOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const {
      outputFormat = 'mp4',
      quality = 'medium',
      resolution,
      fps = 30,
    } = options

    let command = ffmpeg(inputPath)

    // 设置输出格式
    command.format(outputFormat)

    // 设置质量
    if (outputFormat === 'mp4') {
      const qualityMap = {
        low: '23',
        medium: '20',
        high: '18',
      }
      command.videoCodec('libx264')
        .videoBitrate(qualityMap[quality] || '20')
    } else if (outputFormat === 'webm') {
      command.videoCodec('libvpx-vp9')
    }

    // 设置分辨率
    if (resolution) {
      command.size(resolution)
    }

    // 设置帧率
    command.fps(fps)

    command
      .on('end', () => {
        console.log('[Video Processor] Transcoding completed')
        resolve(outputPath)
      })
      .on('error', (err) => {
        console.error('[Video Processor] Transcoding error:', err)
        reject(new Error(`Video transcoding failed: ${err.message}`))
      })
      .save(outputPath)
  })
}

/**
 * 提取关键帧
 */
export async function extractKeyFrames(
  videoPath: string,
  outputDir: string,
  count: number = 10
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    // 获取视频时长
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to probe video: ${err.message}`))
        return
      }

      const duration = metadata.format?.duration || 0
      if (duration === 0) {
        reject(new Error('Video duration is 0'))
        return
      }

      // 计算时间戳
      const timestamps: number[] = []
      for (let i = 0; i < count; i++) {
        timestamps.push((duration / (count + 1)) * (i + 1))
      }

      const framePaths: string[] = []

      ffmpeg(videoPath)
        .screenshots({
          timestamps,
          filename: 'frame_%s.png',
          folder: outputDir,
          size: '1920x1080',
        })
        .on('end', () => {
          // 返回所有帧的路径
          for (let i = 0; i < timestamps.length; i++) {
            const framePath = path.join(outputDir, `frame_${timestamps[i]}.png`)
            if (fs.existsSync(framePath)) {
              framePaths.push(framePath)
            }
          }
          resolve(framePaths)
        })
        .on('error', (err) => {
          console.error('[Video Processor] Keyframe extraction error:', err)
          reject(new Error(`Keyframe extraction failed: ${err.message}`))
        })
    })
  })
}

/**
 * 生成视频封面（从第一帧）
 */
export async function generateVideoThumbnail(
  videoPath: string,
  outputPath: string,
  timestamp: number = 1 // 秒
): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        timestamps: [timestamp],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '1280x720',
      })
      .on('end', async () => {
        // 使用 sharp 优化缩略图
        try {
          const thumbnailPath = path.join(path.dirname(outputPath), path.basename(outputPath))
          await sharp(thumbnailPath)
            .resize(1280, 720, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 85 })
            .toFile(outputPath)

          // 删除临时文件
          if (thumbnailPath !== outputPath) {
            fs.unlinkSync(thumbnailPath)
          }

          resolve(outputPath)
        } catch (error: any) {
          reject(new Error(`Thumbnail generation failed: ${error.message}`))
        }
      })
      .on('error', (err) => {
        console.error('[Video Processor] Thumbnail generation error:', err)
        reject(new Error(`Thumbnail generation failed: ${err.message}`))
      })
  })
}

/**
 * 获取视频元数据
 */
export async function getVideoMetadata(videoPath: string): Promise<{
  duration: number
  width: number
  height: number
  fps: number
  bitrate: number
  size: number
}> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to get video metadata: ${err.message}`))
        return
      }

      const videoStream = metadata.streams?.find(s => s.codec_type === 'video')
      const audioStream = metadata.streams?.find(s => s.codec_type === 'audio')

      resolve({
        duration: metadata.format?.duration || 0,
        width: videoStream?.width || 0,
        height: videoStream?.height || 0,
        fps: videoStream?.r_frame_rate ? eval(videoStream.r_frame_rate) : 30,
        bitrate: metadata.format?.bit_rate ? parseInt(metadata.format.bit_rate) : 0,
        size: metadata.format?.size ? parseInt(metadata.format.size) : 0,
      })
    })
  })
}

/**
 * 保存视频文件到存储
 */
export async function saveVideoToStorage(
  videoUrl: string,
  userId: string,
  storagePath: string
): Promise<{
  localPath: string
  metadata: any
  thumbnailPath: string
}> {
  // 创建存储目录
  const userStorageDir = path.join(storagePath, userId, 'videos')
  if (!fs.existsSync(userStorageDir)) {
    fs.mkdirSync(userStorageDir, { recursive: true })
  }

  const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const videoFileName = `${videoId}.mp4`
  const videoPath = path.join(userStorageDir, videoFileName)
  const thumbnailFileName = `${videoId}_thumb.jpg`
  const thumbnailPath = path.join(userStorageDir, thumbnailFileName)

  // 下载视频
  await downloadVideo(videoUrl, videoPath)

  // 生成缩略图
  await generateVideoThumbnail(videoPath, thumbnailPath)

  // 获取元数据
  const metadata = await getVideoMetadata(videoPath)

  return {
    localPath: videoPath,
    metadata,
    thumbnailPath,
  }
}

