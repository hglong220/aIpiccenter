# 🔐 生产环境变量完整配置说明

## 📋 必需配置项

### 应用基础配置

```env
# 运行环境
NODE_ENV=production

# 应用URL（必须配置为实际域名）
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# 服务端口（默认3000）
PORT=3000
```

### 数据库配置

```env
# PostgreSQL连接字符串
# 格式: postgresql://用户名:密码@主机:端口/数据库名
DATABASE_URL=postgresql://aipiccenter:your-password@localhost:5432/aipiccenter

# 数据库连接池大小（推荐20-50）
DATABASE_POOL_SIZE=20
```

### Redis配置

```env
# Redis连接字符串
# 格式: redis://[:密码@]主机:端口[/数据库号]
REDIS_URL=redis://localhost:6379/0

# 如果Redis设置了密码
# REDIS_URL=redis://:your-password@localhost:6379/0
```

### 安全配置

```env
# JWT密钥（必须使用强随机字符串，至少32字符）
JWT_SECRET=your-super-secret-jwt-key-change-this-to-random-string

# 加密密钥（用于API Key加密，必须使用强随机字符串）
ENCRYPTION_KEY=your-encryption-key-change-this-to-random-string
```

## 🔑 API密钥配置

### AI服务

```env
# Google Gemini API Key
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key

# Gemini代理（可选，如果需要）
GEMINI_PROXY_URL=http://proxy-host:port
```

### 图像处理

```env
# Remove.bg API Key（背景移除功能）
REMOVE_BG_API_KEY=your-remove-bg-api-key
```

### 内容审核（可选）

```env
# 阿里云内容安全
ALIYUN_GREEN_ACCESS_KEY_ID=your-access-key-id
ALIYUN_GREEN_ACCESS_KEY_SECRET=your-access-key-secret
ALIYUN_GREEN_REGION=cn-shanghai

# 腾讯云内容安全
TENCENT_CLOUD_SECRET_ID=your-secret-id
TENCENT_CLOUD_SECRET_KEY=your-secret-key
TENCENT_CLOUD_REGION=ap-shanghai
```

## 💾 存储配置

### 本地存储

```env
# 存储提供商
STORAGE_PROVIDER=local

# 存储路径（绝对路径）
STORAGE_PATH=/var/www/aipiccenter/storage

# 文件访问URL前缀
STORAGE_URL_PREFIX=/storage
```

### AWS S3存储

```env
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_S3_ENDPOINT=  # 可选，用于兼容S3的存储服务
```

### 阿里云OSS存储

```env
STORAGE_PROVIDER=oss
ALIYUN_OSS_ACCESS_KEY_ID=your-access-key-id
ALIYUN_OSS_ACCESS_KEY_SECRET=your-access-key-secret
ALIYUN_OSS_REGION=oss-cn-shanghai
ALIYUN_OSS_BUCKET=your-bucket-name
```

## 📊 队列配置

```env
# 队列并发数（根据服务器性能调整）
QUEUE_CONCURRENCY=5

# 任务重试次数
QUEUE_RETRY_ATTEMPTS=3

# 任务超时时间（秒）
QUEUE_TIMEOUT=300
```

## 📝 日志配置

```env
# 日志级别: debug, info, warn, error
LOG_LEVEL=info

# S3日志存储（可选）
S3_ENABLED=false
S3_BUCKET=your-log-bucket
```

## 🚀 性能配置

```env
# API限流配置
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS_IP=100
RATE_LIMIT_MAX_REQUESTS_USER=200

# 文件上传限制（MB）
MAX_UPLOAD_SIZE=100

# 图像处理超时（秒）
IMAGE_PROCESSING_TIMEOUT=30
```

## 🔒 安全配置

```env
# CORS配置（生产环境应限制为实际域名）
CORS_ORIGIN=https://yourdomain.com

# Cookie安全配置
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict

# Session过期时间（秒）
SESSION_EXPIRES=86400
```

## 📧 邮件配置（可选）

```env
# SMTP配置
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@yourdomain.com
```

## 🔔 通知配置（可选）

```env
# 错误通知Webhook（Slack/Discord等）
ERROR_WEBHOOK_URL=https://hooks.slack.com/services/...

# 告警通知邮箱
ALERT_EMAIL=admin@yourdomain.com
```

## 🧪 测试配置

```env
# 测试模式（生产环境应为false）
TEST_MODE=false

# Mock API（生产环境应为false）
MOCK_APIS=false
```

## 📋 配置检查清单

部署前请确认：

- [ ] 所有必需配置项已填写
- [ ] JWT_SECRET和ENCRYPTION_KEY已更改为强随机字符串
- [ ] DATABASE_URL配置正确且数据库可访问
- [ ] REDIS_URL配置正确且Redis可访问
- [ ] NEXT_PUBLIC_APP_URL设置为实际域名
- [ ] 所有API密钥已配置
- [ ] 存储配置正确
- [ ] 日志配置合理
- [ ] 安全配置已启用

## 🔐 安全建议

1. **密钥管理**
   - 使用环境变量管理密钥，不要硬编码
   - 定期轮换API密钥
   - 使用密钥管理服务（如AWS Secrets Manager）

2. **数据库安全**
   - 使用强密码
   - 限制数据库访问IP
   - 启用SSL连接

3. **网络安全**
   - 使用HTTPS
   - 配置防火墙规则
   - 启用DDoS防护

4. **文件安全**
   - 限制文件上传类型和大小
   - 扫描上传文件
   - 定期清理临时文件

---

**重要提示**: 
- 生产环境必须使用HTTPS
- 所有密钥必须保密，不要提交到版本控制
- 定期备份数据库和文件存储
- 监控系统日志和错误

