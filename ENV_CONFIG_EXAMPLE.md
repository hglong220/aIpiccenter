# .env.local 完整配置示例

## 同时配置 Gemini 和 Vertex AI

你可以在 `.env.local` 中同时配置两个 API，它们会用于不同的功能：

- **Gemini API** - 用于文本生成、聊天、Prompt 增强等
- **Vertex AI Imagen** - 用于图像生成（如果配置了会优先使用，否则回退到 Gemini）

### 智能回退机制

代码会自动检测配置：
- ✅ **如果配置了 Vertex AI** → 使用 Vertex AI Imagen 生成图像（专业图像生成）
- ✅ **如果只配置了 Gemini** → 使用 Gemini API 生成图像（回退方案）
- ✅ **两个都配置** → Vertex AI 用于图像，Gemini 用于文本和聊天

## 完整配置示例

```bash
# ============================================
# Gemini API 配置（文本生成、聊天等）
# ============================================
GOOGLE_GEMINI_API_KEY=你的Gemini_API密钥
GOOGLE_GEMINI_MODEL=gemini-2.5-flash

# 可选：前端使用的 Gemini API Key（如果前端需要直接调用）
NEXT_PUBLIC_GEMINI_API_KEY=你的Gemini_API密钥

# ============================================
# Vertex AI Imagen API 配置（图像生成）
# ============================================
VERTEX_AI_PROJECT_ID=你的项目ID
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_IMAGE_MODEL=imagegeneration@006

# 认证方式（二选一）
# 方式1: Access Token
VERTEX_AI_ACCESS_TOKEN=你的AccessToken

# 方式2: Service Account（推荐）
# VERTEX_AI_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}

# ============================================
# 代理配置（如果需要）
# ============================================
GEMINI_PROXY_URL=http://your-proxy:port
# 或
HTTPS_PROXY=http://your-proxy:port
HTTP_PROXY=http://your-proxy:port
```

## 配置说明

### Gemini API（必需，用于聊天和文本生成）

```bash
# Google AI Studio API Key（从 https://aistudio.google.com/app/apikey 获取）
GOOGLE_GEMINI_API_KEY=AIzaSy...你的密钥

# 使用的模型（默认: gemini-2.5-flash）
GOOGLE_GEMINI_MODEL=gemini-2.5-flash
```

### Vertex AI Imagen（用于图像生成）

```bash
# Google Cloud 项目 ID
VERTEX_AI_PROJECT_ID=your-project-id

# 区域（常用: us-central1, us-east1, europe-west1, asia-east1）
VERTEX_AI_LOCATION=us-central1

# Imagen 模型（推荐: imagegeneration@006）
VERTEX_AI_IMAGE_MODEL=imagegeneration@006

# 认证方式（二选一）

# 方式1: Access Token（简单，但需要定期更新）
# 获取: gcloud auth print-access-token
VERTEX_AI_ACCESS_TOKEN=ya29.a0AfH6SMC...

# 方式2: Service Account JSON（推荐，自动刷新）
# 获取: Google Cloud Console > IAM > 服务账号 > 创建密钥 > JSON
# 注意: 将整个 JSON 作为一行，或使用 \n 表示换行
VERTEX_AI_SERVICE_ACCOUNT={"type":"service_account",...}
```

## 功能对应关系

| 功能 | 使用的 API | 环境变量 | 说明 |
|------|-----------|---------|------|
| 聊天对话 | Gemini API | `GOOGLE_GEMINI_API_KEY` | 必需 |
| 文本生成 | Gemini API | `GOOGLE_GEMINI_API_KEY` | 必需 |
| Prompt 增强 | Gemini API | `GOOGLE_GEMINI_API_KEY` | 必需 |
| 图像生成 | Vertex AI Imagen（优先）<br>或 Gemini API（回退） | `VERTEX_AI_*`<br>或 `GOOGLE_GEMINI_API_KEY` | 自动选择：有 Vertex AI 配置就用 Vertex AI，否则用 Gemini |

## 最小配置（如果只想用 Gemini）

如果你暂时不想使用 Vertex AI，只需要配置 Gemini：

```bash
GOOGLE_GEMINI_API_KEY=你的Gemini_API密钥
GOOGLE_GEMINI_MODEL=gemini-2.5-flash
```

图像生成功能会自动使用 Gemini API（代码会自动检测并回退）。

## 最小配置（如果只想用 Vertex AI）

如果你只想用 Vertex AI 生成图像，但保留 Gemini 用于聊天：

```bash
# Gemini（用于聊天）
GOOGLE_GEMINI_API_KEY=你的Gemini_API密钥
GOOGLE_GEMINI_MODEL=gemini-2.5-flash

# Vertex AI（用于图像生成）
VERTEX_AI_PROJECT_ID=你的项目ID
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_IMAGE_MODEL=imagegeneration@006
VERTEX_AI_ACCESS_TOKEN=你的AccessToken
```

## 注意事项

1. **两个 API 可以共存**：Gemini 用于文本，Vertex AI 用于图像
2. **代理配置共享**：`GEMINI_PROXY_URL` 会被两个 API 使用
3. **Service Account 需要安装依赖**：如果使用 `VERTEX_AI_SERVICE_ACCOUNT`，需要运行 `npm install google-auth-library`
4. **Access Token 会过期**：Access Token 有效期约 1 小时，需要定期更新
5. **不要提交到 Git**：`.env.local` 文件应该添加到 `.gitignore`

## 验证配置

重启开发服务器后，检查控制台日志：

- 如果看到 `[Gemini] Proxy agent created` - Gemini 配置正常
- 如果看到 `[Vertex AI] Using model: imagegeneration@006` - Vertex AI 配置正常

