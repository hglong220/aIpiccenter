# Docker 部署指南

本文档说明如何使用 Docker 部署 AI Pic Center。

## 📋 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 4GB 可用内存
- 至少 10GB 可用磁盘空间

## 🚀 快速开始

### 1. 配置环境变量

```bash
# 复制环境变量模板
cp env.template .env.production

# 编辑 .env.production，填入实际配置
# 至少需要配置：
# - DATABASE_URL
# - REDIS_URL
# - JWT_SECRET
# - GOOGLE_GEMINI_API_KEY
```

### 2. 构建镜像

```bash
# 使用构建脚本
chmod +x scripts/docker-build.sh
./scripts/docker-build.sh

# 或手动构建
docker-compose build
```

### 3. 启动服务

```bash
# 使用启动脚本
chmod +x scripts/docker-start.sh
./scripts/docker-start.sh

# 或手动启动
docker-compose up -d
```

### 4. 运行数据库迁移

```bash
# 进入应用容器
docker-compose exec app sh

# 运行迁移
npm run db:migrate-to-postgres

# 退出容器
exit
```

### 5. 验证部署

```bash
# 检查健康状态
curl http://localhost:3000/api/health

# 查看日志
docker-compose logs -f
```

## 🐳 服务说明

### app

主应用服务，运行 Next.js 应用。

- **端口**: 3000
- **健康检查**: `/api/health`
- **依赖**: db, redis

### workers

队列工作进程，处理 AI 任务、视频生成和文件上传。

- **副本数**: 2（可调整）
- **依赖**: db, redis

### db

PostgreSQL 数据库。

- **端口**: 5432
- **数据卷**: `postgres_data`
- **健康检查**: `pg_isready`

### redis

Redis 缓存和消息队列。

- **端口**: 6379
- **数据卷**: `redis_data`
- **健康检查**: `redis-cli ping`

## 📊 监控

### 查看日志

```bash
# 所有服务
docker-compose logs -f

# 特定服务
docker-compose logs -f app
docker-compose logs -f workers
docker-compose logs -f db
docker-compose logs -f redis
```

### 查看资源使用

```bash
docker stats
```

### 健康检查

```bash
# API 健康检查
curl http://localhost:3000/api/health

# 队列状态
curl http://localhost:3000/api/queues/status
```

## 🔧 配置

### 环境变量

在 `.env.production` 中配置：

```env
# 数据库
DATABASE_URL=postgresql://aipiccenter:password@db:5432/aipiccenter

# Redis
REDIS_URL=redis://redis:6379

# 应用
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=your-secret-key

# AI API
GOOGLE_GEMINI_API_KEY=your-api-key
```

### 资源限制

在 `docker-compose.yml` 中调整：

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 扩展 Workers

```yaml
services:
  workers:
    deploy:
      replicas: 4  # 增加到 4 个 worker
```

## 🔄 更新部署

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建
docker-compose build

# 3. 重启服务
docker-compose up -d

# 4. 运行迁移（如有）
docker-compose exec app npm run db:migrate-to-postgres
```

## 🛑 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（⚠️ 会删除数据）
docker-compose down -v
```

## 📦 生产环境建议

### 1. 使用外部数据库

```yaml
# 注释掉 db 服务，使用外部数据库
# db:
#   ...

# 更新 DATABASE_URL
DATABASE_URL=postgresql://user:pass@external-db:5432/dbname
```

### 2. 使用外部 Redis

```yaml
# 注释掉 redis 服务，使用外部 Redis
# redis:
#   ...

# 更新 REDIS_URL
REDIS_URL=redis://external-redis:6379
```

### 3. 使用对象存储

配置 S3/R2/OSS 等对象存储，而不是本地存储。

### 4. 启用 HTTPS

使用 Nginx 或 Traefik 作为反向代理，启用 HTTPS。

### 5. 备份策略

```bash
# 备份数据库
docker-compose exec db pg_dump -U aipiccenter aipiccenter > backup.sql

# 恢复数据库
docker-compose exec -T db psql -U aipiccenter aipiccenter < backup.sql
```

## 🐛 故障排除

### 服务无法启动

```bash
# 查看日志
docker-compose logs app

# 检查端口占用
netstat -tulpn | grep 3000
```

### 数据库连接失败

```bash
# 检查数据库状态
docker-compose exec db pg_isready -U aipiccenter

# 检查连接字符串
docker-compose exec app env | grep DATABASE_URL
```

### Redis 连接失败

```bash
# 检查 Redis 状态
docker-compose exec redis redis-cli ping

# 测试连接
docker-compose exec app node -e "const Redis = require('ioredis'); const r = new Redis('redis://redis:6379'); r.ping().then(console.log)"
```

## 📚 相关文档

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Next.js Docker 部署](https://nextjs.org/docs/deployment#docker-image)

