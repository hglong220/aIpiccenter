# 4. 依赖与必须安装软件

## Node.js依赖

### 状态: ✅ 已安装

**核心依赖** (package.json):
- ✅ `next@14.2.33` - Next.js框架
- ✅ `react@18.3.1` - React库
- ✅ `typescript@5.5.3` - TypeScript
- ✅ `@prisma/client@6.19.0` - Prisma客户端
- ✅ `sharp@0.33.5` - 图像处理 ✅
- ✅ `pdf-parse@1.1.4` - PDF解析 ✅
- ✅ `mammoth@1.11.0` - Word解析 ✅
- ✅ `xlsx@0.18.5` - Excel解析 ✅
- ✅ `lru-cache@10.4.3` - LRU缓存 ✅

**AI相关**:
- ✅ `@google/generative-ai@0.21.0` - Gemini API
- ✅ `google-auth-library@10.5.0` - Google认证

**认证与安全**:
- ✅ `jsonwebtoken@9.0.2` - JWT
- ✅ `bcryptjs@3.0.3` - 密码加密

## 系统级依赖

### FFmpeg

**状态**: ❌ 未安装

**用途**: 视频/音频处理

**安装方法**:
```bash
# Windows
# 下载: https://ffmpeg.org/download.html
# 添加到PATH

# Linux
sudo apt-get install ffmpeg

# macOS
brew install ffmpeg
```

**代码位置**: 
- `lib/file-processor.ts` - 视频/音频处理
- `lib/metadata-extractor.ts` - 元数据提取
- `lib/preview-generator.ts` - 预览生成

**优先级**: 🟡 中 (视频功能需要)

### Tesseract OCR

**状态**: ❌ 未安装

**用途**: PDF OCR识别

**安装方法**:
```bash
# Windows
# 下载: https://github.com/UB-Mannheim/tesseract/wiki

# Linux
sudo apt-get install tesseract-ocr

# macOS
brew install tesseract
```

**代码位置**: 
- `lib/multimodal-parser.ts` - PDF OCR解析

**优先级**: 🟢 低 (可选功能)

### Whisper (OpenAI)

**状态**: ⚠️ 通过API使用

**用途**: 音频转文本

**实现方式**: 通过OpenAI API调用，无需本地安装

**代码位置**: 
- `lib/ai-router.ts` - Whisper任务路由
- `lib/multimodal-parser.ts` - 音频解析

**优先级**: 🟡 中

## 缺失依赖

### AWS SDK (S3支持)

**状态**: ❌ 未安装

**用途**: S3对象存储

**安装方法**:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**代码位置**: 
- `lib/storage.ts` - S3存储提供者

**优先级**: 🟡 中 (如果使用S3)

### fluent-ffmpeg

**状态**: ❌ 未安装

**用途**: FFmpeg Node.js封装

**安装方法**:
```bash
npm install fluent-ffmpeg
```

**代码位置**: 
- `lib/file-processor.ts` - 视频处理
- `lib/metadata-extractor.ts` - 元数据提取

**优先级**: 🟡 中 (视频功能需要)

## 依赖安全检查

### 漏洞扫描

**命令**: `npm audit`

**结果**: 
- 2 vulnerabilities (1 moderate, 1 high)

**建议**: 
```bash
npm audit fix
```

**优先级**: 🔴 高

## 依赖版本兼容性

### Node.js版本要求

**要求**: Node.js 18+

**检查**: ✅ 兼容

### 数据库驱动

**Prisma**: ✅ 已安装并配置

**SQLite**: ✅ 内置支持

**PostgreSQL**: ⚠️ 需要配置连接字符串

