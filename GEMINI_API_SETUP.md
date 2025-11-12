# 🔑 Gemini API Key 配置指南

## 📝 如何获取 Gemini API Key

### 方法一：通过 Google AI Studio（推荐，免费）

1. **访问 Google AI Studio**
   - 打开浏览器访问：https://aistudio.google.com/app/apikey
   - 或访问：https://makersuite.google.com/app/apikey

2. **登录 Google 账号**
   - 使用您的 Google 账号登录
   - 如果没有账号，需要先注册

3. **创建 API Key**
   - 点击"获取 API 密钥"或"Get API Key"
   - 选择"创建 API 密钥"或"Create API Key"
   - 选择项目（可以创建新项目）
   - 复制生成的 API 密钥

4. **注意事项**
   - API Key 只显示一次，请妥善保存
   - 免费配额：每分钟 15 次请求
   - 适合开发和测试使用

### 方法二：通过 Google Cloud Console（生产环境）

1. **访问 Google Cloud Console**
   - 打开：https://console.cloud.google.com/

2. **创建或选择项目**
   - 创建新项目或选择现有项目

3. **启用 API**
   - 在 API 库中搜索"Generative Language API"
   - 点击启用

4. **创建凭据**
   - 转到"凭据"页面
   - 点击"创建凭据" → "API 密钥"
   - 复制 API 密钥

5. **设置配额和计费**
   - 配置 API 配额限制
   - 设置计费账户（如需要）

## ⚙️ 配置 API Key

### 1. 更新 .env.local 文件

在项目根目录的 `.env.local` 文件中，将：

```env
NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"
```

替换为：

```env
NEXT_PUBLIC_GEMINI_API_KEY="你的实际API密钥"
```

### 2. 重启开发服务器

配置完成后，需要重启开发服务器：

```bash
# 停止当前服务器（Ctrl+C）
# 然后重新启动
npm run dev
```

## ⚠️ 重要说明

### 关于图像生成

**重要**：目前 Google Gemini API 主要支持：
- ✅ 文本生成
- ✅ 图像理解（分析图像）
- ✅ 多模态对话
- ❌ **不支持图像生成**

### 当前实现状态

1. **提示词增强功能**
   - ✅ 已实现，使用 Gemini API
   - 配置 API Key 后可以使用真实的 AI 增强

2. **图像生成功能**
   - ⚠️ 当前使用 Mock 数据（picsum.photos）
   - 需要集成其他图像生成 API，例如：
     - OpenAI DALL-E
     - Stability AI
     - Midjourney API
     - 或其他图像生成服务

### 建议

1. **开发/测试阶段**
   - 可以配置 Gemini API Key 用于提示词增强
   - 图像生成继续使用 Mock 数据

2. **生产环境**
   - 配置 Gemini API Key（用于提示词增强）
   - 集成真实的图像生成 API（如 DALL-E、Stability AI 等）

## 🧪 测试配置

### 测试提示词增强

1. 访问 `http://localhost:3000/generate`
2. 输入提示词
3. 点击"增强提示"按钮
4. 如果配置了 API Key，会使用真实的 AI 增强
5. 如果没有配置，会使用简单的字符串拼接

### 验证 API Key 是否生效

在终端查看日志，如果看到：
- ✅ 使用 Gemini API 进行增强 → API Key 配置成功
- ⚠️ 使用简单增强 → API Key 未配置或无效

## 🔒 安全提示

1. **不要提交 API Key 到版本控制**
   - `.env.local` 已在 `.gitignore` 中
   - 不要将 API Key 提交到 Git

2. **生产环境**
   - 使用环境变量管理
   - 考虑使用密钥管理服务
   - 设置 API 配额限制

3. **API Key 泄露处理**
   - 如果 API Key 泄露，立即在 Google Cloud Console 中删除
   - 创建新的 API Key
   - 更新所有使用该 Key 的环境

## 📚 相关资源

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API 文档](https://ai.google.dev/docs)
- [API 配额和限制](https://ai.google.dev/pricing)

## 🌐 代理配置（重要！）

### 为什么需要代理？

如果您的服务器在中国大陆或网络环境无法直接访问 Google API，需要配置代理才能正常调用 Gemini API。

### 方法一：使用启动脚本（推荐）

我们提供了带代理配置的启动脚本，会自动设置代理环境变量：

**Windows (PowerShell):**
```powershell
# 开发模式
.\start-with-proxy.ps1 dev

# 或使用 npm 脚本
npm run dev:proxy
```

**Linux/Mac (Bash):**
```bash
# 先添加执行权限
chmod +x start-with-proxy.sh

# 开发模式
./start-with-proxy.sh dev

# 或使用 npm 脚本（需要先配置）
npm run dev:proxy
```

### 方法二：在 .env.local 中配置

在项目根目录的 `.env.local` 文件中添加以下配置：

```env
# 代理配置（使用香港静态 IP：35.220.189.112:3128）
HTTPS_PROXY=http://35.220.189.112:3128
HTTP_PROXY=http://35.220.189.112:3128
GEMINI_PROXY_URL=http://35.220.189.112:3128
```

**注意：** Next.js 默认不会读取服务器端环境变量（如 `HTTPS_PROXY`），所以推荐使用方法一（启动脚本）。

### 方法三：设置系统环境变量（Windows）

1. 打开"系统属性" → "环境变量"
2. 在"系统变量"中添加：
   - `HTTPS_PROXY` = `http://35.220.189.112:3128`
   - `HTTP_PROXY` = `http://35.220.189.112:3128`
   - `GEMINI_PROXY_URL` = `http://35.220.189.112:3128`
3. 重启电脑或重启服务

### 验证代理配置

启动应用后，查看控制台日志，应该看到：
```
[Gemini] Proxy agent created successfully: http://35.220.189.112:3128
[Gemini] Using proxy for Google API request
```

如果看到：
```
[Gemini] No proxy URL found in environment variables
[Gemini] No proxy configured - direct connection may fail
```

说明代理未配置，需要按照上述方法配置。

## 🆘 常见问题

### Q: 在中国大陆无法访问 Google AI Studio？
A: 需要使用 VPN 或代理访问，或使用 API 中转服务。配置代理后，API 调用也会通过代理。

### Q: 代理配置后仍然失败？
A: 请检查：
1. 代理服务器是否正常运行（35.220.189.112:3128）
2. 环境变量是否正确设置
3. 应用是否已重启（环境变量只在启动时读取）
4. 查看控制台日志中的代理配置信息

### Q: API Key 有使用限制吗？
A: 免费版本每分钟 15 次请求，付费版本有更高的配额。

### Q: 图像生成什么时候能使用真实 API？
A: 需要集成其他图像生成服务，Gemini 不支持图像生成。



















