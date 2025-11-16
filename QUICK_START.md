# 🚀 快速启动指南

## 第一步：安装依赖

```bash
npm install
```

## 第二步：配置环境变量

创建 `.env.local` 文件（参考 `.env.example`）：

```env
# 数据库（必需）
DATABASE_URL="postgresql://user:password@localhost:5432/aipiccenter?schema=public"

# JWT（必需）
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# 应用 URL（必需）
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 短信服务（可选，开发环境可以不配置）
SMS_PROVIDER="aliyun"
# ... 其他短信配置

# 微信支付（可选，开发环境可以不配置）
WECHAT_PAY_APP_ID="your-app-id"
# ... 其他微信支付配置

# Gemini API（可选）
NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"
```

## 第三步：设置数据库

### 选项 A：使用 Docker（推荐）

```bash
# 启动 PostgreSQL 容器
docker run --name postgres-aipiccenter \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=aipiccenter \
  -p 5432:5432 \
  -d postgres:15

# 更新 .env.local 中的 DATABASE_URL
# DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/aipiccenter?schema=public"
```

### 选项 B：使用本地 PostgreSQL

```bash
# 创建数据库
createdb aipiccenter
```

## 第四步：初始化数据库

```bash
# 生成 Prisma Client
npm run db:generate

# 推送数据库 schema（开发环境）
npm run db:push

# 或者创建迁移（生产环境）
npm run db:migrate
```

## 第五步：检查配置

```bash
# 检查环境变量配置
npm run check-config
```

## 第六步：启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000`

## 🧪 测试功能

### 1. 测试用户注册/登录

1. 访问 `http://localhost:3000/`
2. 输入手机号（格式：1xxxxxxxxxx）
3. 点击"发送验证码"
4. **开发环境**：在控制台查看验证码
5. 输入验证码完成注册/登录

### 2. 测试支付流程

1. 登录后访问 `http://localhost:3000/pricing`
2. 选择一个计划，点击"开始使用"
3. 系统会创建订单（需要配置微信支付才能完成支付）

### 3. 查看数据库

```bash
# 打开 Prisma Studio 查看数据库
npm run db:studio
```

## 📝 开发环境说明

### 短信验证码

- **开发环境**：验证码会在控制台输出，不会真正发送短信
- **生产环境**：需要配置真实的短信服务（阿里云/腾讯云/容联云）

### 微信支付

- **开发环境**：可以创建订单，但需要配置微信支付才能完成支付
- **生产环境**：需要申请微信支付商户号并配置回调 URL

## ⚠️ 常见问题

### 问题 1：Prisma Client 未生成

```bash
npm run db:generate
```

### 问题 2：数据库连接失败

- 检查数据库是否运行
- 检查 DATABASE_URL 是否正确
- 检查防火墙设置

### 问题 3：环境变量未加载

- 确保 `.env.local` 文件在项目根目录
- 重启开发服务器

## 📚 更多信息

- 详细配置指南：查看 `SETUP_AUTH.md`
- 项目结构：查看 `PROJECT_STATUS.md`
- 设置指南：查看 `SETUP_GUIDE.md`

