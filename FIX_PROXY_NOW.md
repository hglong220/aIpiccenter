# 🚨 立即修复代理配置

## 问题
Google Gemini API 调用失败，因为代理环境变量未设置。

## ✅ 快速解决方案（3 步）

### 步骤 1: 停止当前运行的应用
如果应用正在运行，按 `Ctrl+C` 停止它。

### 步骤 2: 使用代理启动脚本启动应用

**Windows PowerShell:**
```powershell
.\start-with-proxy.ps1 dev
```

**或者使用 npm:**
```bash
npm run dev:proxy
```

### 步骤 3: 验证配置
启动后，查看控制台输出，应该看到：
```
✅ 代理配置已设置:
  HTTPS_PROXY: http://35.220.189.112:3128
  HTTP_PROXY: http://35.220.189.112:3128
  GEMINI_PROXY_URL: http://35.220.189.112:3128
```

## 🔍 诊断工具

如果仍然失败，运行诊断脚本：

```bash
# 检查代理配置
npm run check-proxy

# 测试代理连接
npm run test-proxy
```

## 📝 其他方法

### 方法 1: 在当前终端手动设置（临时）

**Windows PowerShell:**
```powershell
$env:HTTPS_PROXY="http://35.220.189.112:3128"
$env:HTTP_PROXY="http://35.220.189.112:3128"
$env:GEMINI_PROXY_URL="http://35.220.189.112:3128"
npm run dev
```

**Linux/Mac:**
```bash
export HTTPS_PROXY="http://35.220.189.112:3128"
export HTTP_PROXY="http://35.220.189.112:3128"
export GEMINI_PROXY_URL="http://35.220.189.112:3128"
npm run dev
```

### 方法 2: 使用快速设置脚本

**Windows:**
```powershell
.\setup-proxy-env.ps1
npm run dev
```

## ⚠️ 重要提示

1. **必须使用启动脚本**: 直接运行 `npm run dev` 不会设置代理环境变量
2. **重启应用**: 修改环境变量后必须重启应用
3. **检查日志**: 查看控制台日志确认代理是否生效

## 📚 详细文档

- [PROXY_SETUP_GUIDE.md](./PROXY_SETUP_GUIDE.md) - 完整代理配置指南
- [QUICK_START_PROXY.md](./QUICK_START_PROXY.md) - 快速启动参考


