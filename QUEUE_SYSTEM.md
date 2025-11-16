# 任务队列系统文档

本文档说明如何使用 Redis + BullMQ 任务队列系统。

## 📋 概述

系统使用 BullMQ 作为任务队列，Redis 作为消息代理。支持以下队列：

- **aiQueue**: AI 生成任务（文本、图像、文档、代码）
- **videoQueue**: 视频生成任务
- **uploadProcessingQueue**: 文件上传处理任务

## 🚀 快速开始

### 1. 启动 Redis

```bash
# 使用 Docker
docker run -d --name redis -p 6379:6379 redis:7-alpine

# 或使用本地 Redis
redis-server
```

### 2. 配置环境变量

在 `.env.local` 中设置：

```env
REDIS_URL=redis://localhost:6379
```

### 3. 启动 Workers

```bash
# 开发环境
npm run workers:start

# 生产环境（使用 PM2）
pm2 start npm --name "queue-workers" -- run workers:start
```

## 📊 队列状态

### API 端点

```bash
# 获取所有队列状态
GET /api/queues/status

# 获取特定任务状态
GET /api/queues/tasks/[taskId]
```

### 响应示例

```json
{
  "success": true,
  "data": {
    "ai": {
      "waiting": 5,
      "active": 2,
      "completed": 100,
      "failed": 3
    },
    "video": {
      "waiting": 1,
      "active": 1,
      "completed": 50,
      "failed": 2
    },
    "upload": {
      "waiting": 0,
      "active": 3,
      "completed": 500,
      "failed": 1
    }
  }
}
```

## 🔧 任务优先级

任务优先级映射：

- `urgent`: 10
- `high`: 7
- `normal`: 5
- `low`: 1

## 📝 使用示例

### 添加任务到队列

```typescript
import { getAIRouter } from '@/lib/ai-router'

const router = getAIRouter()

// 创建任务
const task = await router.routeTask(
  userId,
  {
    prompt: 'Generate an image of a cat',
    type: 'image',
  },
  'normal' // priority
)

// 任务会自动添加到队列并开始处理
```

### 查询任务状态

```typescript
import { prisma } from '@/lib/prisma'

const task = await prisma.aiTask.findUnique({
  where: { id: taskId },
})

console.log(task.status) // pending, running, success, failed
console.log(task.progress) // 0-100
```

## ⚙️ 配置

### Worker 并发数

在 `lib/queue-workers.ts` 中配置：

```typescript
const workerOptions = {
  concurrency: 5, // AI 和上传队列
  // ...
}

// 视频队列使用更低的并发数
{
  concurrency: 2, // 视频队列
}
```

### 速率限制

```typescript
limiter: {
  max: 10, // 最大任务数
  duration: 1000, // 每秒
}
```

### 任务重试

```typescript
defaultJobOptions: {
  attempts: 3, // 最多重试 3 次
  backoff: {
    type: 'exponential',
    delay: 2000, // 初始延迟 2 秒
  },
}
```

## 🐳 Docker 部署

在 `docker-compose.yml` 中已配置 Redis：

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
```

启动 workers：

```bash
docker-compose exec app npm run workers:start
```

## 🔍 监控

### 健康检查

```bash
curl http://localhost:3000/api/health
```

检查 Redis 连接状态。

### 日志

Workers 会输出以下日志：

- `[AI Worker] Processing task...`
- `[Video Worker] Processing task...`
- `[Upload Worker] Processing task...`

## ⚠️ 注意事项

1. **Workers 必须运行**：如果没有运行 workers，任务会一直处于 `pending` 状态
2. **Redis 连接**：确保 Redis 服务正常运行
3. **并发控制**：根据服务器资源调整并发数
4. **错误处理**：失败的任务会记录错误信息，可通过数据库查询

## 📚 相关文档

- [BullMQ 文档](https://docs.bullmq.io/)
- [Redis 文档](https://redis.io/docs/)
- [队列系统架构图](./docs/queue-architecture.md)

