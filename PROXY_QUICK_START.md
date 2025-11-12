# 🚀 代理配置快速开始指南

## 一键配置（推荐）

### Windows (PowerShell)

```powershell
.\scripts\setup-proxy.ps1 -StaticIP 34.66.134.109 -Port 3128
```

### Linux/Mac (Bash)

```bash
bash scripts/setup-proxy.sh 34.66.134.109 3128
```

**注意**：请将 `34.66.134.109` 和 `3128` 替换为您的实际 GCP 静态 IP 和端口。

## 手动配置

### 1. 编辑 `.env.local` 文件

在项目根目录创建或编辑 `.env.local` 文件，添加：

```env
# GCP 代理配置
HTTPS_PROXY=http://34.66.134.109:3128
GEMINI_PROXY_URL=http://34.66.134.109:3128

# Gemini API 配置
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. 重启服务

```bash
# 开发环境
npm run dev

# 生产环境
pm2 restart aipiccenter
# 或
npm start
```

## ✅ 验证配置

启动服务后，查看日志应该能看到：

```
[Gemini] Proxy agent created successfully: http://34.66.134.109:3128
[Gemini] Using proxy for Google API request
```

## 📚 详细文档

更多信息请查看 [PROXY_SETUP.md](./PROXY_SETUP.md)




