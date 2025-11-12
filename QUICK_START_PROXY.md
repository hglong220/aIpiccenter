# 🚀 快速启动指南（带代理配置）

## Windows 用户

### 方法 1: 使用启动脚本（最简单）

```powershell
# 开发模式
.\start-with-proxy.ps1 dev

# 或使用 npm
npm run dev:proxy
```

### 方法 2: 使用 npm 脚本

```bash
npm run dev:proxy    # 开发模式
npm run start:proxy  # 生产模式
npm run build:proxy  # 构建
```

## Linux/Mac 用户

### 方法 1: 使用启动脚本

```bash
# 添加执行权限（只需一次）
chmod +x start-with-proxy.sh

# 开发模式
./start-with-proxy.sh dev

# 或使用 npm
npm run dev:proxy
```

## ✅ 验证配置

启动后，控制台应该显示：

```
代理配置已设置:
  HTTPS_PROXY: http://35.220.189.112:3128
  HTTP_PROXY: http://35.220.189.112:3128
  GEMINI_PROXY_URL: http://35.220.189.112:3128
```

应用日志中应该看到：

```
[Gemini] Proxy agent created successfully: http://35.220.189.112:3128
[Gemini] Using proxy for Google API request
```

## 📚 详细文档

- [PROXY_SETUP_GUIDE.md](./PROXY_SETUP_GUIDE.md) - 完整代理配置指南
- [GEMINI_API_SETUP.md](./GEMINI_API_SETUP.md) - Gemini API 配置指南


