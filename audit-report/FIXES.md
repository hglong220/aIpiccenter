# 修复补丁和修复步骤

## 高优先级修复

### 1. 数据库迁移到PostgreSQL

**文件**: `prisma/schema.prisma`

**步骤**:
1. 创建PostgreSQL数据库
2. 更新 `DATABASE_URL` 环境变量
3. 运行 `npm run db:migrate`

**补丁**: 无需代码修改，只需配置更改

---

### 2. 任务队列集成Redis

**文件**: `lib/ai-router.ts`

**需要安装**:
```bash
npm install bullmq ioredis
npm install --save-dev @types/ioredis
```

**修复代码**:
```typescript
// lib/ai-router-redis.ts (新建文件)
import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

export class RedisTaskQueue {
  private queue: Queue
  private worker: Worker

  constructor() {
    this.queue = new Queue('ai-tasks', { connection })
    this.worker = new Worker('ai-tasks', this.processTask.bind(this), { connection })
  }

  async enqueue(task: AITask): Promise<void> {
    await this.queue.add('process', task, {
      priority: this.getPriority(task.priority),
      attempts: task.maxRetries,
    })
  }

  private getPriority(priority: string): number {
    const map = { urgent: 4, high: 3, normal: 2, low: 1 }
    return map[priority] || 2
  }

  private async processTask(job: any) {
    // 处理任务逻辑
  }
}
```

**优先级**: 🔴 高

---

### 3. Docker配置

**文件**: `Dockerfile` (新建)

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

**文件**: `docker-compose.yml` (新建)

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/aipiccenter
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=aipiccenter
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**优先级**: 🔴 高

---

### 4. 安全漏洞修复

**命令**:
```bash
npm audit fix
```

**如果无法自动修复**:
```bash
npm audit
# 查看详细信息，手动更新依赖
```

**优先级**: 🔴 高

---

### 5. 安全头配置

**文件**: `middleware.ts` (更新)

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // 安全头
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  return response
}

export const config = {
  matcher: '/:path*',
}
```

**优先级**: 🔴 高

---

## 中优先级修复

### 6. 内容审核真实服务配置

**文件**: `lib/content-moderation.ts`

**需要安装** (阿里云):
```bash
npm install @alicloud/green
```

**修复代码**: 参考 `lib/content-moderation.ts` 中的TODO注释

**优先级**: 🟡 中

---

### 7. 后台管理系统

**需要创建多个文件**:
- `app/admin/page.tsx` - 后台首页
- `app/admin/users/page.tsx` - 用户管理
- `app/admin/files/page.tsx` - 文件管理
- `app/admin/moderations/page.tsx` - 审核管理
- `app/admin/tasks/page.tsx` - 任务管理
- `app/api/admin/*` - 后台API

**优先级**: 🟡 中

---

## 修复验证

### 测试步骤

1. **数据库迁移测试**
   ```bash
   npm run db:migrate
   npm run db:generate
   ```

2. **Redis队列测试**
   ```bash
   # 启动Redis
   redis-server
   
   # 测试任务队列
   # 运行应用并创建AI任务
   ```

3. **Docker测试**
   ```bash
   docker-compose up --build
   # 访问 http://localhost:3000
   ```

4. **安全测试**
   ```bash
   npm audit
   # 应该显示0 vulnerabilities
   ```

---

## 修复时间估算

- 数据库迁移: 1-2天
- Redis集成: 2-3天
- Docker配置: 1天
- 安全修复: 0.5天
- 内容审核配置: 1-2天
- 后台管理系统: 5-7天

**总计**: 约10-15个工作日

