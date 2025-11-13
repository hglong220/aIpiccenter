# Vertex AI Imagen API 配置指南

## 环境变量配置

在你的 `.env.local` 或 `.env` 文件中添加以下配置：

### 必需配置

```bash
# Vertex AI 项目配置
VERTEX_AI_PROJECT_ID=your-project-id
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_IMAGE_MODEL=imagegeneration@006

# 认证方式（二选一）

# 方式1: 直接使用 Access Token（简单但需要定期更新）
VERTEX_AI_ACCESS_TOKEN=your-access-token-here

# 方式2: 使用 Service Account JSON（推荐，自动刷新）
VERTEX_AI_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

### 可选配置

```bash
# 代理配置（如果需要）
GEMINI_PROXY_URL=http://your-proxy:port
# 或
HTTPS_PROXY=http://your-proxy:port
HTTP_PROXY=http://your-proxy:port
```

## 获取配置信息

### 1. 获取 Project ID

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择或创建项目
3. 在项目设置中查看 Project ID

### 2. 选择 Location（区域）

常用的区域：
- `us-central1` (美国中部)
- `us-east1` (美国东部)
- `europe-west1` (欧洲西部)
- `asia-east1` (亚洲东部)

### 3. 启用 Imagen API

1. 在 Google Cloud Console 中，进入 **API 和服务** > **库**
2. 搜索 "Vertex AI API"
3. 点击 **启用**

### 4. 获取 Access Token（方式1）

#### 使用 gcloud CLI：

```bash
# 安装 gcloud CLI（如果未安装）
# https://cloud.google.com/sdk/docs/install

# 登录
gcloud auth login

# 设置项目
gcloud config set project YOUR_PROJECT_ID

# 获取 Access Token
gcloud auth print-access-token
```

#### 使用 OAuth 2.0：

访问：https://developers.google.com/oauthplayground/
- 选择 `https://www.googleapis.com/auth/cloud-platform` 作用域
- 授权并获取 Access Token

### 5. 创建 Service Account（方式2，推荐）

1. 在 Google Cloud Console 中，进入 **IAM 和管理** > **服务账号**
2. 点击 **创建服务账号**
3. 填写服务账号名称和描述
4. 授予角色：**Vertex AI User** 或 **AI Platform Developer**
5. 点击 **创建密钥** > **JSON**
6. 下载的 JSON 文件内容复制到 `VERTEX_AI_SERVICE_ACCOUNT` 环境变量

**注意**：Service Account JSON 包含敏感信息，不要提交到 Git！

## 安装依赖（如果使用 Service Account）

```bash
npm install google-auth-library
```

## 测试配置

创建测试文件 `test-vertex-ai.js`：

```javascript
const fetch = require('node-fetch')

async function testVertexAI() {
  const projectId = process.env.VERTEX_AI_PROJECT_ID
  const location = process.env.VERTEX_AI_LOCATION || 'us-central1'
  const accessToken = process.env.VERTEX_AI_ACCESS_TOKEN

  if (!projectId || !accessToken) {
    console.error('请设置 VERTEX_AI_PROJECT_ID 和 VERTEX_AI_ACCESS_TOKEN')
    return
  }

  const apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagegeneration@006:predict`

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      instances: [
        {
          prompt: 'A beautiful sunset over the ocean',
          sampleImageSize: '1024x1024',
        },
      ],
      parameters: {
        sampleCount: 1,
      },
    }),
  })

  const data = await response.json()
  console.log('Response status:', response.status)
  console.log('Response:', JSON.stringify(data, null, 2))
}

testVertexAI().catch(console.error)
```

运行测试：

```bash
node test-vertex-ai.js
```

## API 使用示例

### 基本请求

```javascript
POST /api/image-generator
Content-Type: application/json

{
  "prompt": "A beautiful sunset over the ocean",
  "aspectRatio": "16:9"
}
```

### 完整参数请求

```javascript
{
  "prompt": "A futuristic cityscape at night",
  "negativePrompt": "blurry, low quality",
  "aspectRatio": "16:9",
  "width": 1024,
  "height": 576,
  "numberOfImages": 2,
  "safetyFilterLevel": "BLOCK_SOME",
  "personGeneration": "ALLOW_ADULT"
}
```

## 响应格式

```json
{
  "success": true,
  "data": {
    "images": [
      "data:image/png;base64,iVBORw0KGgoAAAANS..."
    ],
    "prompt": "A beautiful sunset over the ocean",
    "dimensions": {
      "width": 1024,
      "height": 576
    }
  }
}
```

## 常见问题

### 1. 401 认证错误
- 检查 Access Token 是否过期（Access Token 有效期约 1 小时）
- 检查 Service Account JSON 是否正确
- 确认已启用 Vertex AI API

### 2. 403 权限错误
- 确认服务账号有 **Vertex AI User** 角色
- 确认项目已启用 Vertex AI API

### 3. 400 请求错误
- 检查 prompt 是否为空
- 检查图像尺寸是否在支持范围内（通常 256-2048）
- 检查参数格式是否正确

### 4. 429 限流错误
- 等待一段时间后重试
- 检查项目配额限制

## 支持的模型

- `imagegeneration@006` - Imagen 3.0（推荐）
- `imagen-3.0-generate-001` - Imagen 3.0（旧版本）

## 参考文档

- [Vertex AI Imagen API 文档](https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview)
- [Vertex AI 认证文档](https://cloud.google.com/vertex-ai/docs/general/authentication)
- [Imagen API 参考](https://cloud.google.com/vertex-ai/docs/generative-ai/image/api-reference)

