# 用户认证和支付系统配置指南

## 📋 配置步骤

### 1. 数据库配置

#### 1.1 创建 PostgreSQL 数据库

如果你还没有 PostgreSQL 数据库，可以：

**选项 A：使用本地 PostgreSQL**
```bash
# 创建数据库
createdb aipiccenter
```

**选项 B：使用 Docker**
```bash
docker run --name postgres-aipiccenter -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=aipiccenter -p 5432:5432 -d postgres:15
```

**选项 C：使用云数据库（推荐生产环境）**
- 阿里云 RDS
- 腾讯云 CDB
- AWS RDS
- 其他云服务商

#### 1.2 配置数据库连接

创建 `.env.local` 文件（如果还没有）：

```env
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/aipiccenter?schema=public"
```

**注意**：将 `username` 和 `password` 替换为你的数据库用户名和密码。

#### 1.3 运行数据库迁移

```bash
# 生成 Prisma Client
npx prisma generate

# 创建数据库迁移
npx prisma migrate dev --name init

# 或者直接推送 schema（开发环境）
npx prisma db push
```

### 2. JWT 配置

在 `.env.local` 中添加：

```env
# JWT 配置
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
```

**生成安全的 JWT Secret**：
```bash
# 使用 Node.js 生成随机字符串
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. 短信服务配置

选择以下服务之一进行配置：

#### 选项 A：阿里云短信服务

1. 登录 [阿里云控制台](https://ecs.console.aliyun.com/)
2. 开通短信服务
3. 创建 AccessKey
4. 申请短信签名和模板

在 `.env.local` 中添加：

```env
SMS_PROVIDER="aliyun"
ALIYUN_ACCESS_KEY_ID="your-access-key-id"
ALIYUN_ACCESS_KEY_SECRET="your-access-key-secret"
ALIYUN_SMS_SIGN_NAME="AI Pic Center"
ALIYUN_SMS_TEMPLATE_CODE="SMS_123456789"
```

#### 选项 B：腾讯云短信服务

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 开通短信服务
3. 创建 SecretId 和 SecretKey
4. 申请短信签名和模板

在 `.env.local` 中添加：

```env
SMS_PROVIDER="tencent"
TENCENT_SECRET_ID="your-secret-id"
TENCENT_SECRET_KEY="your-secret-key"
TENCENT_SMS_APP_ID="your-app-id"
TENCENT_SMS_SIGN_NAME="AI Pic Center"
TENCENT_SMS_TEMPLATE_ID="123456"
```

#### 选项 C：容联云短信服务

1. 登录 [容联云控制台](https://www.yuntongxun.com/)
2. 开通短信服务
3. 获取 AccountSid 和 AuthToken
4. 申请短信模板

在 `.env.local` 中添加：

```env
SMS_PROVIDER="ronglian"
RONGLIAN_ACCOUNT_SID="your-account-sid"
RONGLIAN_AUTH_TOKEN="your-auth-token"
RONGLIAN_APP_ID="your-app-id"
RONGLIAN_TEMPLATE_ID="123456"
```

**开发环境**：如果不配置短信服务，系统会使用模拟发送（验证码会在控制台输出）。

### 4. 微信支付配置

#### 4.1 申请微信支付商户号

1. 访问 [微信支付商户平台](https://pay.weixin.qq.com/)
2. 注册并申请商户号
3. 完成企业认证
4. 获取以下信息：
   - AppID（应用ID）
   - MchID（商户号）
   - API Key（API密钥）

#### 4.2 配置支付参数

在 `.env.local` 中添加：

```env
# 微信支付配置
WECHAT_PAY_APP_ID="your-wechat-app-id"
WECHAT_PAY_MCH_ID="your-merchant-id"
WECHAT_PAY_API_KEY="your-api-key"
WECHAT_PAY_NOTIFY_URL="https://your-domain.com/api/payment/wechat/notify"
```

**注意**：
- `WECHAT_PAY_NOTIFY_URL` 必须是公网可访问的 HTTPS 地址
- 开发环境可以使用 [ngrok](https://ngrok.com/) 或类似工具进行本地测试

#### 4.3 配置支付回调域名

在微信支付商户平台中：
1. 进入「产品中心」→「开发配置」
2. 配置「支付授权目录」和「支付回调URL」

### 5. 其他配置

在 `.env.local` 中添加：

```env
# 应用 URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google Gemini API（如果还没有）
NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"
```

## 🧪 测试

### 1. 测试数据库连接

```bash
# 运行 Prisma Studio 查看数据库
npx prisma studio
```

### 2. 测试用户注册/登录

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 访问 `http://localhost:3000/`
3. 输入手机号，点击「发送验证码」
4. 在控制台查看验证码（开发环境）
5. 输入验证码完成注册/登录

### 3. 测试支付流程

1. 访问 `http://localhost:3000/pricing`
2. 选择一个计划，点击「开始使用」
3. 系统会创建订单并跳转到微信支付
4. 使用微信支付测试账号完成支付

## 📝 完整的 .env.local 示例

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/aipiccenter?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# 短信服务（选择一种）
SMS_PROVIDER="aliyun"
ALIYUN_ACCESS_KEY_ID="your-access-key-id"
ALIYUN_ACCESS_KEY_SECRET="your-access-key-secret"
ALIYUN_SMS_SIGN_NAME="AI Pic Center"
ALIYUN_SMS_TEMPLATE_CODE="SMS_123456789"

# 微信支付
WECHAT_PAY_APP_ID="your-wechat-app-id"
WECHAT_PAY_MCH_ID="your-merchant-id"
WECHAT_PAY_API_KEY="your-api-key"
WECHAT_PAY_NOTIFY_URL="https://your-domain.com/api/payment/wechat/notify"

# 应用配置
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"
```

## ⚠️ 注意事项

1. **不要将 `.env.local` 提交到版本控制**
   - 确保 `.env.local` 在 `.gitignore` 中

2. **生产环境配置**
   - 使用强密码和安全的密钥
   - 使用 HTTPS
   - 配置正确的回调 URL

3. **数据库备份**
   - 定期备份数据库
   - 使用云数据库的自动备份功能

4. **安全建议**
   - JWT Secret 使用随机生成的强密码
   - API Key 定期轮换
   - 使用环境变量管理敏感信息

## 🐛 常见问题

### 问题 1：Prisma Client 未生成

**解决方案**：
```bash
npx prisma generate
```

### 问题 2：数据库连接失败

**检查**：
- 数据库是否运行
- DATABASE_URL 是否正确
- 防火墙是否允许连接

### 问题 3：短信发送失败

**开发环境**：检查控制台输出，验证码会直接打印
**生产环境**：检查短信服务配置是否正确

### 问题 4：微信支付回调失败

**检查**：
- 回调 URL 是否可访问
- 签名验证是否通过
- 订单金额是否匹配

## 📚 相关文档

- [Prisma 文档](https://www.prisma.io/docs)
- [微信支付开发文档](https://pay.weixin.qq.com/wiki/doc/apiv3/index.shtml)
- [阿里云短信服务文档](https://help.aliyun.com/product/44282.html)
- [腾讯云短信服务文档](https://cloud.tencent.com/document/product/382)

