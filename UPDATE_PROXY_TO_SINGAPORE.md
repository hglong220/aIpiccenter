# 更新代理配置为新加坡 IP

## ✅ 已完成的更新

已将所有启动脚本更新为使用新的新加坡代理 IP：`34.87.103.25:3128`

更新的文件：
- ✅ `start-with-proxy.ps1` - PowerShell 启动脚本
- ✅ `start-with-proxy.sh` - Bash 启动脚本  
- ✅ `setup-proxy-env.ps1` - 环境变量设置脚本

## 🚀 使用方法

### 方法 1: 使用启动脚本（推荐）

**PowerShell (Windows):**
```powershell
.\start-with-proxy.ps1 dev
```

**Bash (Linux/Mac):**
```bash
./start-with-proxy.sh dev
```

### 方法 2: 手动设置环境变量

**PowerShell:**
```powershell
$env:HTTPS_PROXY="http://34.87.103.25:3128"
$env:HTTP_PROXY="http://34.87.103.25:3128"
$env:GEMINI_PROXY_URL="http://34.87.103.25:3128"
npm run dev
```

**Bash:**
```bash
export HTTPS_PROXY="http://34.87.103.25:3128"
export HTTP_PROXY="http://34.87.103.25:3128"
export GEMINI_PROXY_URL="http://34.87.103.25:3128"
npm run dev
```

## ⚠️ 重要提示

1. **必须重启应用**：如果应用正在运行，需要停止并重新启动才能使用新的代理配置
2. **代理认证**：如果代理服务器需要认证，请使用格式：
   ```
   http://username:password@34.87.103.25:3128
   ```
3. **测试代理连接**：
   ```powershell
   npm run test-proxy
   npm run diagnose-proxy
   npm run test-gemini-region
   ```

## 📊 代理信息

- **IP 地址**: 34.87.103.25
- **端口**: 3128
- **地理位置**: 新加坡 (Singapore, SG)
- **ISP**: Google Cloud Platform
- **状态**: ✅ Google 未禁用新加坡代理

## 🔍 故障排除

如果遇到连接问题：

1. **测试 TCP 连接**：
   ```powershell
   Test-NetConnection -ComputerName 34.87.103.25 -Port 3128
   ```

2. **检查代理是否需要认证**：
   ```powershell
   node scripts/test-proxy-auth.js
   ```

3. **查看详细诊断**：
   ```powershell
   npm run diagnose-proxy
   ```

4. **测试 Google Gemini API 地区限制**：
   ```powershell
   npm run test-gemini-region
   ```

## 📝 注意事项

- 环境变量只在当前会话中有效
- 如果使用 `npm run dev:proxy` 或 `npm run start:proxy`，会自动使用新的代理配置
- 确保代理服务器正常运行且可访问

