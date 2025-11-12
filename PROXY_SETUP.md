# 🛠️ 代理通道配置指南

本文档说明如何配置 GCP 代理通道以访问 Gemini API。

## 📋 前置条件

1. **GCP 静态 IP 地址**：已预留的固定 IP 地址（例如：`34.66.134.109`）
2. **代理端口**：已在 GCP 防火墙中开放的端口（例如：`3128`）
3. **服务器访问权限**：能够访问运行 Next.js 应用的服务器

## 🔧 配置步骤

### 步骤 1: 确认代理地址信息

在 GCP 控制台或记录中确认以下信息：

- **静态 IP 地址** (Static IP): `34.66.134.109`（请替换为您的实际 IP）
- **代理端口** (Proxy Port): `3128`（请替换为您的实际端口）

### 步骤 2: 设置环境变量

#### 方式 A: 在 `.env.local` 文件中配置（推荐用于开发环境）

在项目根目录的 `.env.local` 文件中添加：

```env
# GCP 代理配置
HTTPS_PROXY=http://34.66.134.109:3128
# 或者使用
GEMINI_PROXY_URL=http://34.66.134.109:3128

# Gemini API 配置
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_GEMINI_MODEL=gemini-1.5-flash

# Google AI Studio API 配置（用于图像生成）
GOOGLE_AI_STUDIO_API_KEY=your_ai_studio_api_key_here
```

**重要提示**：
- 将 `34.66.134.109` 替换为您的实际 GCP 静态 IP 地址
- 将 `3128` 替换为您的实际代理端口
- 确保 `.env.local` 文件已添加到 `.gitignore` 中，不会被提交到版本控制

#### 方式 B: 在服务器环境中设置（推荐用于生产环境）

在服务器的 Shell 或启动脚本中设置：

```bash
# 设置 HTTPS_PROXY 环境变量
export HTTPS_PROXY="http://34.66.134.109:3128"

# 或者使用 GEMINI_PROXY_URL
export GEMINI_PROXY_URL="http://34.66.134.109:3128"

# 设置 Gemini API 密钥
export GOOGLE_GEMINI_API_KEY="your_gemini_api_key_here"
export GOOGLE_AI_STUDIO_API_KEY="your_ai_studio_api_key_here"
```

#### 方式 C: 使用 PM2 或其他进程管理器

如果使用 PM2 管理 Node.js 进程，可以在 `ecosystem.config.js` 中配置：

```javascript
module.exports = {
  apps: [{
    name: 'aipiccenter',
    script: './node_modules/.bin/next',
    args: 'start',
    env: {
      HTTPS_PROXY: 'http://34.66.134.109:3128',
      GOOGLE_GEMINI_API_KEY: 'your_gemini_api_key_here',
      GOOGLE_AI_STUDIO_API_KEY: 'your_ai_studio_api_key_here',
    }
  }]
}
```

#### 方式 D: 使用 Docker

如果使用 Docker，可以在 `docker-compose.yml` 中配置：

```yaml
services:
  app:
    image: your-image
    environment:
      - HTTPS_PROXY=http://34.66.134.109:3128
      - GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
      - GOOGLE_AI_STUDIO_API_KEY=your_ai_studio_api_key_here
```

### 步骤 3: 重启服务

**重要：必须重启服务，新的环境变量才能生效！**

#### 开发环境（本地）

```bash
# 停止当前运行的开发服务器（Ctrl+C）
# 然后重新启动
npm run dev
```

#### 生产环境

```bash
# 如果使用 PM2
pm2 restart aipiccenter

# 如果使用 systemd
sudo systemctl restart aipiccenter

# 如果使用 Docker
docker-compose restart

# 如果直接运行 Node.js
# 停止当前进程，然后重新启动
npm start
```

## ✅ 验证配置

配置完成后，可以通过以下方式验证代理是否正常工作：

1. **查看日志**：启动服务后，查看控制台日志，应该能看到类似以下信息：
   ```
   [Gemini] Proxy agent created successfully: http://34.66.134.109:3128
   [Gemini] Using proxy for Google API request
   ```

2. **测试聊天功能**：在应用中发送一条消息，如果能够正常收到 Gemini 的回复，说明代理配置成功。

3. **测试图像生成**：尝试生成一张图像，如果能够成功生成，说明代理配置正确。

## 🔍 故障排查

### 问题 1: 代理未生效

**症状**：日志中显示 "No proxy configured" 或请求失败

**解决方案**：
- 检查环境变量是否正确设置：`echo $HTTPS_PROXY`
- 确认已重启服务
- 检查 `.env.local` 文件格式是否正确（无多余空格、引号等）

### 问题 2: 连接超时

**症状**：请求超时或连接失败

**解决方案**：
- 检查 GCP 防火墙规则，确保端口 `3128` 已开放
- 确认静态 IP 地址正确
- 检查代理服务器是否正常运行
- 尝试从服务器直接测试代理连接：
  ```bash
  curl -x http://34.66.134.109:3128 https://www.google.com
  ```

### 问题 3: API 密钥错误

**症状**：返回 401 或 403 错误

**解决方案**：
- 检查 `GOOGLE_GEMINI_API_KEY` 是否正确设置
- 确认 API 密钥有效且未过期
- 检查 API 密钥是否有足够的权限

## 📝 环境变量优先级

代码会按以下顺序查找代理配置：

1. `GEMINI_PROXY_URL`（最高优先级）
2. `HTTPS_PROXY`
3. `HTTP_PROXY`

如果设置了多个环境变量，将使用优先级最高的那个。

## 🔒 安全建议

1. **不要将环境变量提交到版本控制**：确保 `.env.local` 在 `.gitignore` 中
2. **使用强密码**：确保 API 密钥足够安全
3. **限制访问**：在 GCP 防火墙中限制只有必要的 IP 可以访问代理端口
4. **定期轮换密钥**：定期更新 API 密钥和代理配置

## 📚 相关文档

- [Next.js 环境变量文档](https://nextjs.org/docs/basic-features/environment-variables)
- [GCP 静态 IP 文档](https://cloud.google.com/compute/docs/ip-addresses/reserve-static-external-ip-address)
- [undici ProxyAgent 文档](https://undici.nodejs.org/#/docs/api/ProxyAgent)

## 🆘 获取帮助

如果遇到问题，请检查：
1. 服务器日志：查看详细的错误信息
2. GCP 控制台：检查防火墙规则和静态 IP 状态
3. 网络连接：确认服务器可以访问代理服务器

---

**最后更新**：2024年




