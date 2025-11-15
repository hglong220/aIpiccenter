# 5. 数据库

## Prisma Schema

### 状态: ✅ 已实现

**文件位置**: `prisma/schema.prisma`

**数据库类型**: SQLite (开发) / PostgreSQL (生产建议)

## 数据库模型清单

### 核心模型 (15个表)

1. **User** ✅
   - 字段: id, username, phone, email, password, credits, plan
   - 索引: username
   - 关系: 关联到多个表

2. **VerificationCode** ✅
   - 字段: id, phone, code, type, used, expiresAt
   - 索引: [phone, code], expiresAt

3. **PasswordResetToken** ✅
   - 字段: id, token, userId, expiresAt, used
   - 索引: token, expiresAt

4. **Order** ✅
   - 字段: id, userId, planId, planName, amount, credits, paymentStatus
   - 索引: userId, paymentStatus, wechatOrderId

5. **Generation** ✅
   - 字段: id, userId, type, prompt, imageUrl, videoUrl, creditsUsed, status
   - 索引: userId, type, createdAt

6. **Session** ✅
   - 字段: id, sessionToken, userId, expires
   - 索引: userId

7. **ChatSession** ✅
   - 字段: id, userId, title, isStarred
   - 索引: userId

8. **ChatMessage** ✅
   - 字段: id, chatId, role, content, imagePath
   - 索引: [chatId, createdAt]

9. **File** ✅
   - 字段: id, userId, filename, mimeType, fileType, size, md5, storagePath
   - 索引: userId, fileType, status, moderationStatus, md5, createdAt

10. **FileMetadata** ✅
    - 字段: id, fileId, width, height, duration, extractedText等
    - 关系: 一对一关联File

11. **FileChunk** ✅
    - 字段: id, fileId, chunkIndex, chunkSize, chunkMd5, uploaded
    - 索引: fileId
    - 唯一约束: [fileId, chunkIndex]

12. **SignedUrl** ✅
    - 字段: id, fileId, token, url, expiresAt, accessCount
    - 索引: fileId, token, expiresAt

13. **AITask** ✅ (新增)
    - 字段: id, userId, taskType, priority, status, model, requestData, resultData
    - 索引: userId, taskType, status, priority, createdAt

14. **Project** ✅ (新增)
    - 字段: id, userId, name, description, coverUrl, shareToken, shareExpiresAt
    - 索引: userId, shareToken, createdAt

15. **ProjectFile** ✅ (新增)
    - 字段: id, projectId, fileId
    - 唯一约束: [projectId, fileId]

16. **ProjectGeneration** ✅ (新增)
    - 字段: id, projectId, generationId
    - 唯一约束: [projectId, generationId]

17. **ModerationLog** ✅ (新增)
    - 字段: id, userId, contentType, content, riskLevel, score, passed, action
    - 索引: userId, contentType, riskLevel, action, createdAt

## 数据库迁移

### 状态: ✅ 已配置

**迁移文件位置**: `prisma/migrations/`

**迁移命令**:
```bash
npm run db:migrate  # 创建迁移
npm run db:push     # 直接推送 (开发)
npm run db:generate # 生成Prisma客户端
```

**当前状态**: 
- ✅ Schema已同步到数据库
- ⚠️ Prisma客户端生成有文件权限问题 (可忽略，重启后自动生成)

## 数据库种子数据

### 状态: ❌ 未实现

**缺失文件**: 
- ❌ `prisma/seed.ts`
- ❌ `prisma/seed.sql`

**建议创建**:
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 创建测试用户
  // 创建测试数据
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

**优先级**: 🟢 低

## 数据库索引优化

### 当前索引状态: ✅ 良好

**已优化索引**:
- ✅ User.username
- ✅ File.md5 (唯一)
- ✅ File.status, moderationStatus
- ✅ AITask.status, priority, taskType
- ✅ Project.shareToken (唯一)

**建议添加索引**:
- ⚠️ Generation.createdAt (已有，但可考虑复合索引)
- ⚠️ File.createdAt (已有)

## 数据库连接池

### 状态: ⚠️ 未配置

**当前**: Prisma默认连接池

**生产环境建议**:
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
```

**优先级**: 🟡 中

## 数据库备份

### 状态: ❌ 未实现

**建议**:
- 每日自动备份
- 备份到对象存储
- 保留7-30天备份

**优先级**: 🔴 高 (生产环境)

