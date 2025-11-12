# 🚀 重启服务指南

## 📋 完整步骤

### 步骤 1: 停止服务

**如果服务正在运行**:
- 找到运行 `npm run dev` 的窗口
- 按 `Ctrl + C` 停止服务
- 或关闭运行服务的窗口

**检查是否已停止**:
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue
```
如果没有输出，说明服务已停止。

---

### 步骤 2: 设置环境变量

在 **同一个 PowerShell 窗口**中设置环境变量：

```powershell
$env:HTTPS_PROXY = "http://35.220.189.112:3128"
$env:GEMINI_PROXY_URL = "http://35.220.189.112:3128"
```

**重要**: 
- 环境变量只在当前 PowerShell 会话中有效
- 必须在**同一个窗口**中启动服务

---

### 步骤 3: 启动服务

在**设置了环境变量的同一个窗口**中启动服务：

```powershell
npm run dev
```

---

## ✅ 验证服务启动

启动后，查看日志应该能看到：

```
[Gemini] Environment check:
[Gemini] GEMINI_PROXY_URL: http://35.220.189.112:3128
[Gemini] HTTPS_PROXY: http://35.220.189.112:3128
[Gemini] Proxy agent created successfully: http://35.220.189.112:3128
[Gemini] Using proxy for Google API request
```

---

## 🧪 测试聊天功能

1. 打开浏览器访问: `http://localhost:3000/generate`
2. 发送一条测试消息（例如："你好"）
3. 应该能正常收到 Grok 的回复

---

## ⚠️ 如果仍然失败

如果重启后仍然失败，请检查：

1. **环境变量是否正确设置**:
   ```powershell
   $env:HTTPS_PROXY
   $env:GEMINI_PROXY_URL
   ```

2. **服务日志中的错误信息**

3. **代理连接测试**:
   ```powershell
   Invoke-WebRequest -Uri "https://www.google.com" -Proxy $env:HTTPS_PROXY -Method Head
   ```

---

**关键**: 确保在**设置了环境变量的同一个窗口**中启动服务！

