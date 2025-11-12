# 🌐 代理配置指南

## 📋 概述

本指南说明如何为 AI Pic Center 配置代理，以便在中国大陆或其他受限网络环境中访问 Google Gemini API。

## 🎯 代理服务器信息

- **代理地址**: `35.220.189.112:3128`
- **协议**: HTTP
- **类型**: 香港静态 IP 代理

## 🚀 快速开始

### Windows 用户（推荐）

使用 PowerShell 启动脚本：

```powershell
# 开发模式
.\start-with-proxy.ps1 dev

# 或使用 npm 脚本
npm run dev:proxy
```

### Linux/Mac 用户

使用 Bash 启动脚本：

```bash
# 添加执行权限
chmod +x start-with-proxy.sh

# 开发模式
./start-with-proxy.sh dev
```

## 📝 详细配置方法

### 方法一：启动脚本（最简单，推荐）

启动脚本会自动设置以下环境变量：
- `HTTPS_PROXY=http://35.220.189.112:3128`
- `HTTP_PROXY=http://35.220.189.112:3128`
- `GEMINI_PROXY_URL=http://35.220.189.112:3128`

**优点：**
- ✅ 无需手动配置
- ✅ 每次启动自动设置
- ✅ 不影响系统环境变量

**使用方法：**

**Windows:**
```powershell
# 开发模式
.\start-with-proxy.ps1 dev

# 生产模式
.\start-with-proxy.ps1 start

# 构建
.\start-with-proxy.ps1 build
```

**Linux/Mac:**
```bash
# 开发模式
./start-with-proxy.sh dev

# 生产模式
./start-with-proxy.sh start

# 构建
./start-with-proxy.sh build
```

### 方法二：npm 脚本

在 `package.json` 中已添加了代理启动脚本：

```json
{
  "scripts": {
    "dev:proxy": "powershell -ExecutionPolicy Bypass -File ./start-with-proxy.ps1 dev",
    "start:proxy": "powershell -ExecutionPolicy Bypass -File ./start-with-proxy.ps1 start",
    "build:proxy": "powershell -ExecutionPolicy Bypass -File ./start-with-proxy.ps1 build"
  }
}
```

**使用方法：**
```bash
npm run dev:proxy    # 开发模式（带代理）
npm run start:proxy  # 生产模式（带代理）
npm run build:proxy  # 构建（带代理）
```

### 方法三：手动设置环境变量

#### Windows PowerShell（临时）

```powershell
$env:HTTPS_PROXY="http://35.220.189.112:3128"
$env:HTTP_PROXY="http://35.220.189.112:3128"
$env:GEMINI_PROXY_URL="http://35.220.189.112:3128"

# 然后启动应用
npm run dev
```

#### Windows 系统环境变量（永久）

1. 打开"系统属性"
   - 右键"此电脑" → "属性" → "高级系统设置"
   - 或搜索"编辑系统环境变量"

2. 点击"环境变量"按钮

3. 在"系统变量"中点击"新建"，添加：
   - 变量名：`HTTPS_PROXY`
   - 变量值：`http://35.220.189.112:3128`
   
4. 重复步骤 3，添加：
   - `HTTP_PROXY` = `http://35.220.189.112:3128`
   - `GEMINI_PROXY_URL` = `http://35.220.189.112:3128`

5. 点击"确定"保存

6. **重要**：重启电脑或重启服务，使环境变量生效

#### Linux/Mac（临时）

```bash
export HTTPS_PROXY="http://35.220.189.112:3128"
export HTTP_PROXY="http://35.220.189.112:3128"
export GEMINI_PROXY_URL="http://35.220.189.112:3128"

# 然后启动应用
npm run dev
```

#### Linux/Mac（永久）

编辑 `~/.bashrc` 或 `~/.zshrc`：

```bash
export HTTPS_PROXY="http://35.220.189.112:3128"
export HTTP_PROXY="http://35.220.189.112:3128"
export GEMINI_PROXY_URL="http://35.220.189.112:3128"
```

然后执行：
```bash
source ~/.bashrc  # 或 source ~/.zshrc
```

## ✅ 验证配置

启动应用后，查看控制台输出，应该看到：

```
========================================
启动 AI Pic Center (带代理配置)
========================================

代理配置已设置:
  HTTPS_PROXY: http://35.220.189.112:3128
  HTTP_PROXY: http://35.220.189.112:3128
  GEMINI_PROXY_URL: http://35.220.189.112:3128
```

在应用日志中应该看到：

```
[Gemini] Proxy agent created successfully: http://35.220.189.112:3128
[Gemini] Using proxy for Google API request
```

## 🔍 故障排查

### 问题 1: 代理未生效

**症状：** 日志显示 `[Gemini] No proxy configured`

**解决方案：**
1. 确认使用了启动脚本或设置了环境变量
2. 重启应用（环境变量只在启动时读取）
3. 检查环境变量是否正确设置：
   ```powershell
   # Windows PowerShell
   echo $env:HTTPS_PROXY
   ```
   ```bash
   # Linux/Mac
   echo $HTTPS_PROXY
   ```

### 问题 2: 代理连接失败

**症状：** 错误信息包含 "ECONNREFUSED" 或 "ETIMEDOUT"

**解决方案：**
1. 检查代理服务器是否正常运行
2. 测试代理连接：
   ```bash
   curl -x http://35.220.189.112:3128 https://www.google.com
   ```
3. 确认防火墙未阻止连接

### 问题 3: API 调用仍然失败

**症状：** 代理已配置，但 API 调用失败

**解决方案：**
1. 检查 API Key 是否正确配置
2. 查看详细错误日志
3. 确认代理服务器可以访问 `generativelanguage.googleapis.com`

## 📚 相关文档

- [GEMINI_API_SETUP.md](./GEMINI_API_SETUP.md) - Gemini API 配置指南
- [README.md](./README.md) - 项目概览

## 🆘 获取帮助

如果遇到问题：
1. 检查控制台日志
2. 确认代理服务器状态
3. 验证环境变量配置
4. 查看 [GEMINI_API_SETUP.md](./GEMINI_API_SETUP.md) 中的常见问题


