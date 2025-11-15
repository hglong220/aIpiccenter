# 完整文件上传系统文档

## 📋 功能清单

### ✅ 已实现功能

1. **多格式文件支持**
   - 图像：PNG, JPG, JPEG, GIF, WebP, TIFF, PSD
   - 视频：MP4, MOV, AVI, MKV, WebM
   - 音频：MP3, WAV, FLAC, M4A, OGG
   - 文档：PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, MD, CSV, JSON
   - 代码：JS, TS, Python, Java, C/C++, Go, Rust, PHP, Ruby, Swift 等
   - 压缩包：ZIP, RAR, 7Z, TAR, GZ
   - 3D文件：OBJ, FBX, GLTF, GLB

2. **分片上传**
   - 支持大文件分片上传（默认10MB/片）
   - 断点续传
   - MD5校验
   - 自动重试

3. **文件处理**
   - 图像自动压缩（超过4K自动缩放）
   - 视频转码（H264/H265）
   - 音频格式转换（WAV/MP3）
   - PDF文本提取

4. **元数据提取**
   - 图像：宽高、宽高比、颜色模式
   - 视频：分辨率、帧率、时长、码率、编码格式
   - 音频：采样率、时长、码率、声道数
   - 文档：页数、字数、语言检测
   - 代码：编程语言、代码行数、依赖提取

5. **预览生成**
   - 图像缩略图
   - 视频封面（关键帧提取）
   - 音频波形（待实现）
   - 文档预览（待实现）

6. **内容审核**
   - 图像内容审核（阿里云/腾讯云）
   - 文本内容审核
   - 视频内容审核（待完善）

7. **对象存储**
   - 本地文件系统（默认）
   - AWS S3
   - Cloudflare R2
   - 阿里云OSS（待实现）
   - MinIO

8. **签名URL**
   - 临时访问链接
   - 过期时间控制
   - 访问次数限制

9. **AI调度对接**
   - 文件类型自动推荐模型
   - 任务类型识别

10. **文件管理**
    - 文件列表查询
    - 文件详情获取
    - 文件删除
    - 访问权限控制

## 🚀 快速开始

### 1. 安装依赖

```bash
# 必需依赖（已在package.json中）
npm install

# 可选依赖（根据需要安装）
npm install sharp                    # 图像处理
npm install fluent-ffmpeg            # 视频/音频处理
npm install pdf-parse                # PDF文本提取
npm install @aws-sdk/client-s3       # AWS S3支持
npm install @aws-sdk/s3-request-presigner
```

### 2. 数据库迁移

```bash
npm run db:push
```

### 3. 配置环境变量

在 `.env.local` 中添加：

```env
# 存储配置
STORAGE_PROVIDER=local  # local, s3, r2, oss, minio
STORAGE_LOCAL_PATH=./storage

# S3配置（如果使用S3）
S3_BUCKET=your-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key

# R2配置（如果使用Cloudflare R2）
R2_BUCKET=your-bucket
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# 内容审核配置
MODERATION_PROVIDER=mock  # mock, aliyun, tencent, baidu
ALIYUN_ACCESS_KEY_ID=your-key
ALIYUN_ACCESS_KEY_SECRET=your-secret
ALIYUN_REGION=cn-shanghai
```

### 4. 使用上传组件

```tsx
import FileUploader from '@/components/upload/FileUploader'

function MyPage() {
  const handleUploadComplete = (file) => {
    console.log('文件上传成功:', file)
  }

  return (
    <FileUploader
      onUploadComplete={handleUploadComplete}
      maxFiles={10}
      maxSize={5 * 1024 * 1024 * 1024} // 5GB
    />
  )
}
```

## 📡 API 端点

### 1. 简单上传（< 100MB）

```
POST /api/upload/v2
Content-Type: multipart/form-data

Body: FormData with 'file' field
Response: {
  success: boolean
  data: FileUploadResult
}
```

### 2. 分片上传（>= 100MB）

#### 初始化上传
```
POST /api/upload/chunk
{
  "action": "init",
  "filename": "video.mp4",
  "size": 500000000,
  "mimeType": "video/mp4",
  "md5": "file-md5-hash"
}
```

#### 上传分片
```
POST /api/upload/chunk
{
  "action": "upload",
  "fileId": "file-id",
  "chunkIndex": 0,
  "chunk": "base64-encoded-chunk",
  "chunkMd5": "chunk-md5-hash"
}
```

#### 完成上传
```
POST /api/upload/chunk
{
  "action": "complete",
  "fileId": "file-id"
}
```

### 3. 获取文件列表

```
GET /api/files?fileType=image&status=ready&page=1&limit=20
```

### 4. 获取文件详情

```
GET /api/files/[fileId]
```

### 5. 生成签名URL

```
POST /api/files/[fileId]/signed-url
{
  "expiresIn": 3600,  // 秒
  "maxAccess": 10     // 可选
}
```

### 6. 删除文件

```
DELETE /api/files/[fileId]
```

## 🔧 配置说明

### 文件大小限制

默认限制（可在代码中修改）：
- 图像：50MB
- 视频：5GB
- 音频：500MB
- 文档：100MB
- 代码：50MB
- 压缩包：2GB
- 3D文件：500MB

### 分片大小

- 文件 < 10MB：5MB/片
- 文件 < 100MB：10MB/片
- 文件 < 1GB：20MB/片
- 文件 >= 1GB：50MB/片

### 图像处理选项

- 最大宽度：4096px
- 最大高度：4096px
- 质量：85%
- 格式：自动选择（JPEG/PNG/WebP）

### 视频处理选项

- 编码：H264
- 最大分辨率：1920x1080
- 帧率：30fps
- 码率：2Mbps

### 音频处理选项

- 格式：WAV
- 采样率：44100Hz
- 声道：立体声（2）
- 码率：128kbps

## 🛡️ 安全特性

1. **MIME类型验证**
   - 防止文件扩展名伪装
   - 验证文件实际类型

2. **内容审核**
   - 图像内容审核
   - 文本内容审核
   - 视频内容审核

3. **访问控制**
   - 私有文件仅所有者可访问
   - 签名URL带过期时间
   - 访问次数限制

4. **MD5校验**
   - 文件完整性校验
   - 分片完整性校验

## 📊 数据库结构

### File 表
- 文件基本信息
- 存储信息
- 审核状态
- 访问权限

### FileMetadata 表
- 图像元数据
- 视频元数据
- 音频元数据
- 文档元数据
- 代码元数据

### FileChunk 表
- 分片上传记录
- 断点续传支持

### SignedUrl 表
- 签名URL记录
- 过期时间
- 访问次数

## 🔄 文件处理流程

1. **上传阶段**
   - 文件验证（类型、大小）
   - MIME类型校验
   - MD5计算

2. **审核阶段**
   - 内容审核（异步）
   - 病毒扫描（可选）

3. **处理阶段**
   - 文件转码/压缩
   - 元数据提取
   - 预览生成

4. **存储阶段**
   - 上传到对象存储
   - 保存数据库记录
   - 清理临时文件

## 🎯 AI模型推荐

根据文件类型自动推荐：

- **图像**：gemini-2.5-pro, dall-e-3, midjourney, stable-diffusion
- **视频**：runway, pika, luma, stability-ai
- **音频**：elevenlabs, whisper, musicgen
- **文档**：gpt-4, claude, gemini-2.5-pro
- **代码**：gpt-4, claude, github-copilot

## 📝 待完善功能

1. **音频波形生成**
   - 需要安装 audiowaveform 或使用 ffmpeg + canvas

2. **PDF预览**
   - 需要安装 pdf-poppler 或 pdf2pic

3. **阿里云OSS集成**
   - 需要安装 @alicloud/oss

4. **内容审核完整实现**
   - 需要安装 @alicloud/green（阿里云）
   - 需要安装 tencentcloud-sdk-nodejs（腾讯云）

5. **病毒扫描**
   - 需要集成 ClamAV 或云服务

6. **文件生命周期管理**
   - 定时任务清理过期文件
   - 任务完成后保留策略

7. **后台管理界面**
   - 文件管理
   - 审核管理
   - 统计分析

## 🐛 故障排查

### 图像处理失败
- 检查是否安装了 `sharp`
- 检查文件格式是否支持

### 视频处理失败
- 检查是否安装了 `fluent-ffmpeg`
- 检查系统是否安装了 FFmpeg
- Windows: 下载 FFmpeg 并添加到 PATH
- Linux: `sudo apt-get install ffmpeg`
- macOS: `brew install ffmpeg`

### PDF处理失败
- 检查是否安装了 `pdf-parse`
- 检查PDF文件是否损坏

### 存储上传失败
- 检查存储配置是否正确
- 检查网络连接
- 检查存储服务是否可用

## 📚 相关文档

- [数据库设置](./DATABASE_SETUP.md)
- [环境配置](./ENV_CONFIG_EXAMPLE.md)
- [API文档](./API_DOCS.md)（待创建）

## 💡 最佳实践

1. **大文件上传**
   - 使用分片上传API
   - 显示上传进度
   - 支持断点续传

2. **文件安全**
   - 启用内容审核
   - 使用签名URL
   - 设置访问权限

3. **性能优化**
   - 使用CDN加速
   - 启用图像压缩
   - 异步处理大文件

4. **成本控制**
   - 定期清理临时文件
   - 设置文件保留策略
   - 使用合适的存储方案

