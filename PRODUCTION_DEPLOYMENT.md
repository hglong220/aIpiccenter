# 🚀 生产环境部署指南

## 📋 前置要求

### 服务器要求
- **CPU**: 4核心以上
- **内存**: 8GB以上
- **存储**: 100GB以上（SSD推荐）
- **网络**: 10Mbps以上带宽

### 软件要求
- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / Debian 10+
- **Node.js**: 20.x LTS
- **PostgreSQL**: 14+
- **Redis**: 6+
- **Docker**: 20.10+（可选，推荐使用Docker部署）
- **Nginx**: 1.18+（用于反向代理）

## 🔧 环境变量配置

创建 `.env` 文件：

```bash
# 应用配置
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
PORT=3000

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/aipiccenter
DATABASE_POOL_SIZE=20

# Redis配置
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this
ENCRYPTION_KEY=your-encryption-key-change-this

# API密钥
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
REMOVE_BG_API_KEY=your-remove-bg-api-key

# 存储配置
STORAGE_PROVIDER=local
STORAGE_PATH=/var/www/aipiccenter/storage
# 或使用S3
# STORAGE_PROVIDER=s3
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=
# AWS_S3_BUCKET=

# 内容审核（可选）
ALIYUN_GREEN_ACCESS_KEY_ID=
ALIYUN_GREEN_ACCESS_KEY_SECRET=
TENCENT_CLOUD_SECRET_ID=
TENCENT_CLOUD_SECRET_KEY=

# 日志配置
LOG_LEVEL=info
S3_ENABLED=false
S3_BUCKET=

# 队列配置
QUEUE_CONCURRENCY=5
QUEUE_RETRY_ATTEMPTS=3
```

## 🐳 Docker部署（推荐）

### 1. 克隆代码

```bash
git clone <repository-url>
cd aipiccenter
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入实际配置
```

### 3. 构建和启动

```bash
# 构建镜像
docker-compose build

# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 执行数据库迁移
docker-compose exec web npm run db:migrate
```

### 4. 验证部署

```bash
# 检查健康状态
curl http://localhost:3000/api/health

# 检查服务状态
docker-compose ps
```

## 📦 手动部署

### 1. 安装依赖

```bash
# 安装Node.js依赖
npm ci --production

# 安装PostgreSQL和Redis
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql redis-server

# CentOS/RHEL
sudo yum install postgresql-server redis
```

### 2. 配置数据库

```bash
# 创建数据库
sudo -u postgres psql
CREATE DATABASE aipiccenter;
CREATE USER aipiccenter WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE aipiccenter TO aipiccenter;
\q

# 运行迁移
npm run db:migrate
```

### 3. 配置Redis

```bash
# 编辑Redis配置
sudo nano /etc/redis/redis.conf

# 设置密码（可选）
requirepass your-redis-password

# 启动Redis
sudo systemctl start redis
sudo systemctl enable redis
```

### 4. 构建应用

```bash
# 构建生产版本
npm run build

# 生成Prisma客户端
npm run db:generate
```

### 5. 启动服务

#### 使用PM2（推荐）

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start npm --name "aipiccenter" -- start

# 启动队列Worker
pm2 start npm --name "aipiccenter-workers" -- run workers:start

# 保存PM2配置
pm2 save
pm2 startup
```

#### 使用systemd

创建 `/etc/systemd/system/aipiccenter.service`:

```ini
[Unit]
Description=AI Pic Center
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/aipiccenter
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl start aipiccenter
sudo systemctl enable aipiccenter
```

### 6. 配置Nginx反向代理

创建 `/etc/nginx/sites-available/aipiccenter`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：

```bash
sudo ln -s /etc/nginx/sites-available/aipiccenter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔄 更新部署

### 1. 备份数据

```bash
# 备份数据库
pg_dump -U aipiccenter aipiccenter > backup_$(date +%Y%m%d).sql

# 备份文件存储
tar -czf storage_backup_$(date +%Y%m%d).tar.gz /var/www/aipiccenter/storage
```

### 2. 拉取最新代码

```bash
git pull origin main
```

### 3. 更新依赖

```bash
npm ci --production
npm run db:generate
```

### 4. 运行迁移

```bash
npm run db:migrate
```

### 5. 重新构建

```bash
npm run build
```

### 6. 重启服务

```bash
# PM2
pm2 restart aipiccenter

# systemd
sudo systemctl restart aipiccenter

# Docker
docker-compose restart web
```

## 🔙 回滚流程

### 1. 停止服务

```bash
pm2 stop aipiccenter
# 或
sudo systemctl stop aipiccenter
```

### 2. 恢复代码

```bash
git checkout <previous-commit-hash>
```

### 3. 恢复数据库

```bash
psql -U aipiccenter aipiccenter < backup_YYYYMMDD.sql
```

### 4. 恢复文件存储

```bash
tar -xzf storage_backup_YYYYMMDD.tar.gz -C /
```

### 5. 重启服务

```bash
pm2 start aipiccenter
# 或
sudo systemctl start aipiccenter
```

## 📊 监控与维护

### 健康检查

```bash
# API健康检查
curl https://yourdomain.com/api/health

# 系统监控（需要管理员权限）
curl https://yourdomain.com/api/admin/monitoring
```

### 日志查看

```bash
# PM2日志
pm2 logs aipiccenter

# systemd日志
sudo journalctl -u aipiccenter -f

# 应用日志
tail -f logs/error-*.log

# Docker日志
docker-compose logs -f web
```

### 性能监控

- 使用 `/api/admin/monitoring` 查看系统状态
- 配置Prometheus + Grafana（可选）
- 监控数据库连接池使用情况
- 监控Redis内存使用

## 🚨 故障排查

### 常见问题

1. **数据库连接失败**
   - 检查DATABASE_URL配置
   - 检查PostgreSQL服务状态
   - 检查防火墙规则

2. **Redis连接失败**
   - 检查REDIS_URL配置
   - 检查Redis服务状态
   - 检查Redis密码配置

3. **文件上传失败**
   - 检查存储路径权限
   - 检查磁盘空间
   - 检查Nginx client_max_body_size配置

4. **队列任务不执行**
   - 检查Queue Workers是否运行
   - 检查Redis连接
   - 查看队列任务日志

## 📞 支持与联系

如遇问题，请查看：
- 项目README.md
- 部署检查清单（DEPLOYMENT_CHECKLIST.md）
- 错误日志（logs/目录）

---

**最后更新**: 2025-01-XX
**版本**: 2.0

