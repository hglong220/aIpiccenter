# 🔧 代理连接问题排查指南

## 错误信息
**错误**: `基础连接已经关闭: 接收时发生错误` (The underlying connection was closed: An error occurred while receiving)

## 诊断

这个错误表示：
1. ✅ 能够连接到代理服务器（TCP 连接成功）
2. ❌ 但在数据传输过程中连接被关闭
3. 可能的原因：
   - Squid 配置限制了来源 IP
   - SSL/TLS 握手失败
   - Squid 服务配置问题

## 解决方案

### 方案 1: 检查 Squid 配置（推荐）

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

## 下一步

1. **优先检查 Squid 配置**：确认国内服务器 IP 是否在允许列表中
2. **查看 Squid 日志**：`sudo tail -f /var/log/squid/access.log` 查看拒绝原因
3. **临时允许所有连接**（仅测试）：修改 Squid 配置允许所有来源
4. **如果成功**：重启 Grok 服务，测试聊天功能

## 获取国内服务器 IP

如果需要知道国内服务器的公网 IP：

```bash
# Linux/Mac
curl ifconfig.me

# 或
curl ipinfo.io/ip
```

然后将这个 IP 添加到 Squid 的允许列表中。


