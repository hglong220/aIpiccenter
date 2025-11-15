npm.cmd run dev# ⚡ 快速修复代理连接问题

## 问题
代理服务器 `47.79.137.153:3128` 无法连接

## 你的信息
- **公网 IP**: `50.7.252.26`
- **本地 IP**: `192.168.1.100`
- **代理服务器**: `47.79.137.153:3128`

## 快速解决方案

### 选项 1: 修复代理服务器（如果有权限）

**步骤 1**: 检查并启动代理服务
```bash
ssh user@47.79.137.153
sudo systemctl status squid
sudo systemctl start squid
sudo systemctl enable squid
```

**步骤 2**: 添加防火墙规则（GCP）
1. 登录 [GCP Console](https://console.cloud.google.com/)
2. 导航到：**VPC 网络** > **防火墙**
3. 创建或编辑规则：
   - 名称：`allow-squid-proxy`
   - 方向：入站
   - 协议和端口：TCP 3128
   - 来源 IP 范围：`50.7.252.26/32`（你的 IP）或 `0.0.0.0/0`（所有 IP）
   - 目标：所有实例

**步骤 3**: 更新 Squid 配置
```bash
sudo nano /etc/squid/squid.conf
# 添加：
acl allowed_ips src 50.7.252.26
http_access allow allowed_ips
# 保存并重启：
sudo systemctl restart squid
```

### 选项 2: 使用其他代理（推荐，如果无法修复）

**使用本地代理**（如果有）：
```env
# .env.local
GEMINI_PROXY_URL=http://127.0.0.1:7890
```

**或购买/配置新的代理服务器**

### 选项 3: 临时禁用代理（如果网络允许）

```env
# .env.local
# 注释掉代理配置
# GEMINI_PROXY_URL=http://47.79.137.153:3128
# HTTPS_PROXY=http://47.79.137.153:3128
# HTTP_PROXY=http://47.79.137.153:3128
```

然后重启开发服务器。

## 验证修复

修复后运行：
```bash
node scripts/test-current-proxy.js
```

或 PowerShell：
```powershell
Test-NetConnection -ComputerName 47.79.137.153 -Port 3128
```

应该看到 `TcpTestSucceeded: True`

## 联系管理员

如果无法自行修复，请联系代理服务器管理员并提供：
- 你的公网 IP: `50.7.252.26`
- 需要访问的端口: `3128`
- 错误信息: TCP 连接失败

