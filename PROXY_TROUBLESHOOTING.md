# 🔧 代理连接问题排查指南

## 常见错误信息

### 错误 1: `fetch failed`
**错误**: `网络连接失败: fetch failed。当前代理配置: http://47.79.137.153:3128`

**诊断**：
- ❌ 无法连接到代理服务器（TCP 连接失败）
- 可能的原因：
  - 代理服务器未运行或已关闭
  - 代理地址或端口错误
  - 防火墙阻止了连接
  - 代理服务器需要认证

### 错误 2: `基础连接已经关闭`
**错误**: `基础连接已经关闭: 接收时发生错误` (The underlying connection was closed: An error occurred while receiving)

**诊断**：
- ✅ 能够连接到代理服务器（TCP 连接成功）
- ❌ 但在数据传输过程中连接被关闭
- 可能的原因：
  - Squid 配置限制了来源 IP
  - SSL/TLS 握手失败
  - Squid 服务配置问题
  - 代理服务器需要认证（用户名/密码）

### 错误 3: `ECONNREFUSED`
**错误**: `代理连接失败: ECONNREFUSED`

**诊断**：
- ❌ 代理服务器拒绝连接
- 可能的原因：
  - 代理服务器未运行
  - 端口错误
  - 防火墙阻止

### 错误 4: `timeout` 或 `AbortError`
**错误**: `代理连接超时: 代理服务器响应超时`

**诊断**：
- ⏱️ 代理服务器响应超时
- 可能的原因：
  - 网络延迟过高
  - 代理服务器负载过高
  - 代理服务器已关闭

## 快速诊断

运行代理测试脚本：

```bash
node scripts/test-current-proxy.js
```

这个脚本会：
1. 检查代理配置是否正确
2. 测试 HTTP 连接
3. 测试 HTTPS 连接（Google）
4. 测试 Gemini API 端点连接
5. 提供详细的错误诊断和建议

## 解决方案

### 方案 0: 快速检查（首先执行）

1. **检查代理配置**
   ```bash
   # 查看当前代理配置
   cat .env.local | grep PROXY
   ```

2. **测试代理连接**
   ```bash
   # 使用 curl 测试代理
   curl -x http://47.79.137.153:3128 https://www.google.com
   
   # 或使用 PowerShell (Windows)
   $env:HTTPS_PROXY = "http://47.79.137.153:3128"
   Invoke-WebRequest -Uri "https://www.google.com" -Proxy $env:HTTPS_PROXY
   ```

3. **检查代理服务器是否可达**
   ```bash
   # Ping 代理服务器 IP
   ping 47.79.137.153
   
   # 检查端口是否开放
   telnet 47.79.137.153 3128
   # 或使用 PowerShell
   Test-NetConnection -ComputerName 47.79.137.153 -Port 3128
   ```

### 方案 1: 检查代理配置

如果代理需要认证，使用以下格式：

```env
# .env.local
GEMINI_PROXY_URL=http://username:password@47.79.137.153:3128
```

或者：

```env
HTTPS_PROXY=http://username:password@47.79.137.153:3128
HTTP_PROXY=http://username:password@47.79.137.153:3128
```

### 方案 2: 检查 Squid 配置（如果使用 Squid 代理）

在 GCP VM 上检查 Squid 配置：

```bash
# 1. SSH 登录到 GCP VM
# 2. 查看 Squid 配置文件
sudo cat /etc/squid/squid.conf

# 3. 查找 ACL 规则，特别是：
#    - http_access allow
#    - http_access deny
#    - acl allowed_hosts

# 4. 检查是否有 IP 限制
```

**常见问题**：
- Squid 配置中可能限制了允许的来源 IP
- 需要将国内服务器的公网 IP 添加到允许列表

**临时解决方案（仅用于测试）**：
```bash
# 编辑 Squid 配置
sudo nano /etc/squid/squid.conf

# 找到 http_access 规则，临时改为允许所有（不安全，仅测试用）
# 将：
#   http_access deny all
# 改为：
#   http_access allow all

# 保存后重启 Squid
sudo systemctl restart squid
```

### 方案 2: 检查防火墙规则

1. 登录 GCP 控制台
2. 导航到：VPC 网络 > 防火墙
3. 确认 `allow-squid-proxy` 规则：
   - 状态：启用
   - 方向：入站
   - 协议和端口：TCP 3128
   - 来源 IP 范围：`0.0.0.0/0`（或你的国内服务器 IP）

### 方案 3: 检查 Squid 服务状态

```bash
# 在 GCP VM 上运行
sudo systemctl status squid

# 如果未运行，启动服务
sudo systemctl start squid
sudo systemctl enable squid

# 查看 Squid 日志
sudo tail -f /var/log/squid/access.log
```

### 方案 4: 测试 HTTP 连接（绕过 SSL）

如果 HTTPS 失败，可以尝试 HTTP：

```powershell
# Windows PowerShell
$env:HTTPS_PROXY = "http://34.66.134.109:3128"
Invoke-WebRequest -Uri "http://www.google.com" -Proxy $env:HTTPS_PROXY -Method Head
```

## 常见问题解决

### Q: 代理服务器无法连接怎么办？

**A**: 按以下步骤排查：

1. **确认代理服务器状态**
   - 检查代理服务器是否运行
   - 验证 IP 地址和端口是否正确
   - 确认防火墙规则允许连接

2. **测试网络连接**
   ```bash
   # 测试代理服务器是否可达
   ping 47.79.137.153
   
   # 测试端口是否开放
   telnet 47.79.137.153 3128
   ```

3. **检查代理配置**
   - 确认 `.env.local` 中的代理 URL 格式正确
   - 如果代理需要认证，添加用户名和密码

4. **尝试不使用代理**（如果网络允许）
   - 临时删除或注释掉 `.env.local` 中的代理配置
   - 重启开发服务器

### Q: 代理连接成功但请求失败？

**A**: 可能是以下原因：

1. **代理需要认证**
   - 添加用户名和密码到代理 URL
   - 格式：`http://username:password@host:port`

2. **代理服务器限制**
   - 检查代理服务器是否限制了来源 IP
   - 查看代理服务器日志

3. **SSL/TLS 问题**
   - 检查代理服务器 SSL 配置
   - 尝试使用 HTTP 代理（如果支持）

### Q: 如何临时禁用代理？

**A**: 编辑 `.env.local` 文件：

```env
# 注释掉或删除代理配置
# GEMINI_PROXY_URL=http://47.79.137.153:3128
# HTTPS_PROXY=http://47.79.137.153:3128
# HTTP_PROXY=http://47.79.137.153:3128
```

然后重启开发服务器。

## 下一步

1. **运行诊断脚本**：`node scripts/test-current-proxy.js`
2. **检查代理配置**：确认 `.env.local` 中的代理 URL 正确
3. **测试代理连接**：使用 curl 或 PowerShell 测试代理
4. **查看错误日志**：检查服务器控制台的详细错误信息
5. **如果使用 Squid**：检查 Squid 配置和日志

## 获取国内服务器 IP

如果需要知道国内服务器的公网 IP：

```bash
# Linux/Mac
curl ifconfig.me

# 或
curl ipinfo.io/ip
```

然后将这个 IP 添加到 Squid 的允许列表中。


