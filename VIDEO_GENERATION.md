# 视频生成系统文档

本文档说明视频生成系统的功能和使用方法。

## 📋 支持的模型

- **Runway Gen-3**：专业视频生成
- **Pika 1.0**：快速视频生成
- **Kling**：字节跳动视频生成（如支持）

## 🚀 快速开始

### 1. 配置 API Key

在 `.env.local` 中配置：

```env
RUNWAY_API_KEY=your-runway-api-key
PIKA_API_KEY=your-pika-api-key
KLING_API_KEY=your-kling-api-key
```

### 2. 创建视频生成任务

```bash
POST /api/video/create
Content-Type: application/json
Cookie: token=your-jwt-token

{
  "prompt": "A cat walking in a garden",
  "duration": 5,
  "aspectRatio": "16:9",
  "imageUrl": "https://example.com/image.jpg" // 可选
}
```

### 3. 查询任务状态

```bash
GET /api/video/status?taskId=task_xxx
Cookie: token=your-jwt-token
```

### 4. Webhook 回调（可选）

配置 webhook URL 接收异步回调：

```
POST /api/video/webhook
```

## 📊 工作流程

1. **创建任务**：用户提交视频生成请求
2. **加入队列**：任务加入 videoQueue
3. **Worker 处理**：Worker 调用视频生成 API
4. **轮询状态**：Worker 轮询直到完成
5. **下载视频**：下载生成的视频文件
6. **转码处理**：转码为 MP4 格式
7. **生成封面**：从视频提取第一帧作为封面
8. **保存文件**：保存到本地存储或对象存储
9. **更新状态**：更新任务状态和生成记录

## 🎬 API 端点

### POST /api/video/create

创建视频生成任务。

**请求体**：
```json
{
  "prompt": "视频描述",
  "duration": 5,
  "aspectRatio": "16:9",
  "imageUrl": "https://..." // 可选，参考图片
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "taskId": "task_xxx",
    "status": "pending",
    "estimatedTime": 120
  }
}
```

### GET /api/video/status

查询视频生成状态。

**查询参数**：
- `taskId`: 任务ID

**响应**：
```json
{
  "success": true,
  "data": {
    "taskId": "task_xxx",
    "status": "running",
    "progress": 50,
    "result": {
      "videoUrl": "https://...",
      "thumbnailUrl": "https://..."
    }
  }
}
```

### POST /api/video/webhook

Webhook 回调端点（用于异步通知）。

## 🔧 视频处理

### 转码

视频会自动转码为 MP4 格式：

- **格式**：MP4 (H.264)
- **质量**：low/medium/high
- **分辨率**：可配置
- **帧率**：30fps（默认）

### 封面生成

自动从视频第一帧生成封面：

- **尺寸**：1280x720
- **格式**：JPEG
- **质量**：85%

### 文件存储

视频文件保存到：

```
storage/{userId}/videos/{videoId}.mp4
storage/{userId}/videos/{videoId}_thumb.jpg
```

## 📝 使用示例

### 前端调用

```typescript
// 创建视频生成任务
const response = await fetch('/api/video/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    prompt: 'A beautiful sunset over the ocean',
    duration: 5,
    aspectRatio: '16:9',
  }),
})

const { data } = await response.json()
const taskId = data.taskId

// 轮询状态
const pollStatus = async () => {
  const statusResponse = await fetch(`/api/video/status?taskId=${taskId}`, {
    credentials: 'include',
  })
  const statusData = await statusResponse.json()
  
  if (statusData.data.status === 'success') {
    console.log('Video ready:', statusData.data.result.videoUrl)
  } else if (statusData.data.status === 'failed') {
    console.error('Video generation failed:', statusData.data.error)
  } else {
    // 继续轮询
    setTimeout(pollStatus, 5000)
  }
}

pollStatus()
```

## ⚙️ 配置

### 环境变量

```env
# 视频生成 API Keys
RUNWAY_API_KEY=key1,key2,key3
PIKA_API_KEY=key1,key2
KLING_API_KEY=key1

# 存储路径
STORAGE_LOCAL_PATH=./storage
```

### 模型选择

系统会根据以下规则自动选择模型：

1. 如果指定了模型，使用指定模型
2. 否则根据成本和质量推荐
3. 失败时自动降级到备用模型

## 🔍 监控

### 查看队列状态

```bash
GET /api/queues/status
```

### 查看任务详情

```bash
GET /api/queues/tasks/{taskId}
```

## ⚠️ 注意事项

1. **积分消耗**：每次视频生成消耗 10 积分
2. **生成时间**：通常需要 1-3 分钟
3. **文件大小**：视频文件可能较大，确保有足够存储空间
4. **API 限制**：注意各平台的 API 调用限制

## 📚 相关文档

- [AI 调度器文档](./AI_SCHEDULER.md)
- [队列系统文档](./QUEUE_SYSTEM.md)

