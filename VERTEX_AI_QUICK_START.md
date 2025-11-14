# Vertex AI Imagen 快速开始

## 步骤 1: 安装依赖（如果使用 Service Account）

如果你选择使用 Service Account 方式认证，需要安装：

```bash
npm install google-auth-library
```

如果只使用 Access Token，可以跳过此步骤。

## 步骤 2: 配置环境变量

在 `.env.local` 文件中添加：

```bash
# 必需配置
VERTEX_AI_PROJECT_ID=你的项目ID
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_IMAGE_MODEL=imagegeneration@006

# 认证方式（二选一）

# 方式1: Access Token（简单）
VERTEX_AI_ACCESS_TOKEN=你的AccessToken

# 方式2: Service Account（推荐）
VERTEX_AI_SERVICE_ACCOUNT={"type":"service_account",...}
```

## 步骤 3: 获取配置信息

### 获取 Project ID
1. 访问 https://console.cloud.google.com/
2. 选择项目，在项目设置中查看 Project ID

### 获取 Access Token（方式1）
```bash
gcloud auth print-access-token
```

### 创建 Service Account（方式2）
1. Google Cloud Console > IAM > 服务账号
2. 创建服务账号，授予 **Vertex AI User** 角色
3. 创建密钥 > JSON，复制内容到环境变量

## 步骤 4: 启用 API

在 Google Cloud Console 中启用：
- Vertex AI API

## 步骤 5: 测试

重启开发服务器，然后访问图像生成页面测试。

## 完整代码已就绪

代码文件：`app/api/image-generator/route.ts`

直接复制你的 API 配置到 `.env.local` 即可使用！



