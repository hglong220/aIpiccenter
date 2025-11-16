# 🔧 关键问题快速修复指南

**优先级**: P0 - 必须立即修复  
**预计时间**: 2-4小时

---

## ❌ 1. 数据库迁移（阻塞上线）

### 问题
- `prisma/schema.prisma` 仍配置为 SQLite
- `docker-compose.yml` 配置了 PostgreSQL，但 Prisma 未使用

### 修复步骤

#### 步骤1: 修改 Prisma Schema

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"  // 改为 postgresql
  url      = env("DATABASE_URL")
}
```

#### 步骤2: 更新迁移锁文件

```toml
// prisma/migrations/migration_lock.toml
provider = "postgresql"
```

#### 步骤3: 创建新的迁移

```bash
# 删除旧的 SQLite 迁移（可选）
rm -rf prisma/migrations

# 创建新的 PostgreSQL 迁移
npx prisma migrate dev --name init_postgresql

# 或者直接推送（开发环境）
npx prisma db push
```

#### 步骤4: 验证

```bash
# 检查连接
npx prisma db pull

# 检查迁移状态
npx prisma migrate status
```

---

## ❌ 2. AI调度器核心功能缺失（阻塞核心功能）

### 问题
- GPT文本生成未实现（`lib/ai-router.ts:567`）
- 图像生成未实现（`lib/ai-router.ts:575`）
- Whisper音频转文本未实现（`lib/ai-router.ts:667`）
- OCR处理未实现（`lib/queue-workers.ts:391`）

### 修复步骤

#### 步骤1: 实现GPT文本生成

```typescript
// lib/ai-router.ts
private async executeGPTTask(task: AITask, apiKey: string): Promise<any> {
  const { OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey })
  
  const model = task.model === 'gpt-4' ? 'gpt-4' : 'gpt-3.5-turbo'
  
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'user', content: task.request.prompt || task.request.text }
    ],
  })
  
  return completion.choices[0].message.content
}
```

**需要安装**:
```bash
npm install openai
```

#### 步骤2: 实现图像生成

```typescript
// lib/ai-router.ts
private async executeImageGenerationTask(task: AITask, apiKey: string): Promise<any> {
  // 使用 Gemini 图像生成
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(apiKey)
  
  // 注意：Gemini 不直接支持图像生成，需要使用 Imagen API
  // 或者调用其他图像生成服务
  throw new Error('Image generation requires Imagen API or other service')
}
```

#### 步骤3: 实现Whisper音频转文本

```typescript
// lib/ai-router.ts
private async executeWhisperTask(task: AITask, apiKey: string): Promise<any> {
  const { OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey })
  
  // 需要从文件读取音频
  const audioFile = task.request.audioFile
  if (!audioFile) {
    throw new Error('Audio file is required')
  }
  
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
  })
  
  return transcription.text
}
```

#### 步骤4: 实现OCR处理

```typescript
// lib/queue-workers.ts
async function processDocumentTask(request: any, model: ModelType, apiKey: string) {
  // 使用 Tesseract.js
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('chi_sim+eng')
  
  const { data: { text } } = await worker.recognize(request.imageUrl)
  await worker.terminate()
  
  return { text }
}
```

---

## ❌ 3. 视频生成流程不完整（阻塞视频功能）

### 问题
- 缺少 Webhook 接收端点
- 缺少状态轮询逻辑
- 缺少视频下载和存储

### 修复步骤

#### 步骤1: 创建 Webhook 端点

```typescript
// app/api/video/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, status, videoUrl, error } = body
    
    // 更新任务状态
    await prisma.aiTask.update({
      where: { id: taskId },
      data: {
        status: status === 'completed' ? 'success' : status === 'failed' ? 'failed' : 'running',
        resultData: videoUrl ? JSON.stringify({ videoUrl }) : null,
        error: error || null,
        completedAt: status === 'completed' ? new Date() : undefined,
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Video Webhook] Error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
```

#### 步骤2: 实现状态轮询

```typescript
// lib/video-generators/runway.ts
export async function pollRunwayGeneration(
  config: RunwayConfig,
  generationId: string,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<RunwayGenerationResponse> {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await getRunwayGenerationStatus(config, generationId)
    
    if (status.status === 'completed') {
      return status
    }
    
    if (status.status === 'failed') {
      throw new Error(status.error || 'Generation failed')
    }
    
    // 等待后重试
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }
  
  throw new Error('Generation timeout')
}
```

#### 步骤3: 实现视频下载和存储

```typescript
// lib/video-processor.ts
export async function downloadAndStoreVideo(
  videoUrl: string,
  taskId: string
): Promise<string> {
  // 下载视频
  const response = await fetch(videoUrl)
  const videoBuffer = Buffer.from(await response.arrayBuffer())
  
  // 保存到存储
  const fs = await import('fs/promises')
  const path = await import('path')
  
  const storageDir = path.join(process.cwd(), 'storage', 'videos')
  await fs.mkdir(storageDir, { recursive: true })
  
  const filePath = path.join(storageDir, `${taskId}.mp4`)
  await fs.writeFile(filePath, videoBuffer)
  
  // 返回存储路径或URL
  return `/storage/videos/${taskId}.mp4`
}
```

---

## ⚠️ 4. 内容审核Mock Fallback（安全风险）

### 问题
- 如果 `@alicloud/green` 未安装，所有审核都会通过

### 修复步骤

#### 步骤1: 移除Mock Fallback

```typescript
// lib/moderation/aliyun.ts
export async function moderateImageAliyun(
  imageUrl: string,
  accessKeyId: string,
  accessKeySecret: string,
  region: string = 'cn-shanghai'
): Promise<AliyunModerationResult> {
  // 移除 try-catch，直接导入
  const Green = require('@alicloud/green')
  
  if (!Green) {
    throw new Error('@alicloud/green is required but not installed. Run: npm install @alicloud/green')
  }
  
  // ... 其余代码
}
```

#### 步骤2: 确保依赖安装

```bash
npm install @alicloud/green
```

#### 步骤3: 添加环境变量检查

```typescript
// lib/content-moderation.ts
export function getModerationConfig(): ModerationConfig {
  const provider = process.env.MODERATION_PROVIDER || 'mock'
  
  if (provider === 'aliyun') {
    if (!process.env.ALIYUN_ACCESS_KEY_ID || !process.env.ALIYUN_ACCESS_KEY_SECRET) {
      throw new Error('Aliyun moderation requires ALIYUN_ACCESS_KEY_ID and ALIYUN_ACCESS_KEY_SECRET')
    }
  }
  
  // ... 其余代码
}
```

---

## ⚠️ 5. 搜索功能增强（用户体验）

### 问题
- 只搜索文件名，不搜索内容
- 没有使用 PostgreSQL 全文搜索

### 修复步骤

#### 步骤1: 添加文件内容搜索

```typescript
// app/api/search/route.ts
// 搜索文件内容（从元数据）
if (searchType === 'all' || searchType === 'files') {
  const files = await prisma.file.findMany({
    where: {
      userId: decoded.id,
      status: 'ready',
      OR: [
        { originalFilename: { contains: query, mode: 'insensitive' } },
        { filename: { contains: query, mode: 'insensitive' } },
        // 添加内容搜索
        {
          metadata: {
            extractedText: {
              contains: query,
              mode: 'insensitive',
            },
          },
        },
      ],
    },
    // ... 其余代码
  })
}
```

#### 步骤2: 使用 PostgreSQL 全文搜索（可选）

```sql
-- 创建全文搜索索引
CREATE INDEX idx_file_content_search ON "FileMetadata" USING gin(to_tsvector('english', "extractedText"));
```

```typescript
// 使用全文搜索
const files = await prisma.$queryRaw`
  SELECT * FROM "File" f
  JOIN "FileMetadata" fm ON f.id = fm."fileId"
  WHERE f."userId" = ${decoded.id}
    AND to_tsvector('english', fm."extractedText") @@ plainto_tsquery('english', ${query})
  LIMIT ${limit}
`
```

---

## ⚠️ 6. 后台管理分页和过滤

### 问题
- 用户列表无分页
- 缺少过滤和搜索

### 修复步骤

```typescript
// app/api/admin/users/route.ts
export async function GET(request: NextRequest) {
  // ... 权限检查 ...
  
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const search = searchParams.get('search') || ''
  const plan = searchParams.get('plan') || ''
  
  const skip = (page - 1) * limit
  
  const where: any = {}
  if (search) {
    where.OR = [
      { username: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (plan) {
    where.plan = plan
  }
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        // ... 字段
      },
    }),
    prisma.user.count({ where }),
  ])
  
  return NextResponse.json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  })
}
```

---

## 📋 修复检查清单

### P0 - 必须修复（阻塞上线）

- [ ] 数据库迁移到 PostgreSQL
- [ ] AI调度器GPT文本生成
- [ ] AI调度器图像生成
- [ ] AI调度器Whisper音频转文本
- [ ] AI调度器OCR处理
- [ ] 视频生成Webhook端点
- [ ] 视频生成状态轮询
- [ ] 视频下载和存储

### P1 - 严重影响体验

- [ ] 内容审核移除Mock Fallback
- [ ] 搜索功能增强（内容搜索）
- [ ] 后台管理分页和过滤

### P2 - 优化项

- [ ] 图像编辑并发处理优化
- [ ] 多模态解析依赖检查
- [ ] 性能优化（大文件处理）

---

## 🧪 测试验证

### 1. 数据库迁移测试

```bash
# 检查连接
npx prisma db pull

# 检查数据
npx prisma studio
```

### 2. AI调度器测试

```bash
# 测试文本生成
curl -X POST http://localhost:3000/api/ai/chat \
  -d '{"prompt": "Hello"}'

# 测试图像生成
curl -X POST http://localhost:3000/api/generate/image \
  -d '{"prompt": "A cat"}'
```

### 3. 视频生成测试

```bash
# 创建视频任务
curl -X POST http://localhost:3000/api/video/create \
  -d '{"prompt": "A sunset"}'

# 查询状态
curl http://localhost:3000/api/video/status/:taskId

# 测试Webhook
curl -X POST http://localhost:3000/api/video/webhook \
  -d '{"taskId": "...", "status": "completed"}'
```

### 4. 内容审核测试

```bash
# 上传测试图片
curl -X POST http://localhost:3000/api/moderation/image \
  -F "image=@test.jpg"

# 检查日志（不应该有mock警告）
docker-compose logs app | grep -i moderation
```

---

## 📝 注意事项

1. **数据库迁移**: 迁移前备份数据
2. **API密钥**: 确保所有必需的API密钥已配置
3. **依赖安装**: 运行 `npm install` 确保所有依赖已安装
4. **环境变量**: 检查 `.env` 文件配置
5. **测试**: 每个修复后都要实际测试

---

**最后更新**: 2025-01-XX  
**优先级**: P0 - 必须立即修复

