# 🔧 更新新 IP 地址配置指南

## 当前状态

- ✅ IP 地址已在 GCP 控制台预留为静态 IP: `35.220.189.112`
- ❌ 但代理连接失败，说明 VM 实例可能还未使用这个新 IP

## 📋 需要在 GCP VM 上完成的步骤

### 步骤 1: 将新 IP 分配给 VM 实例

1. **登录 GCP 控制台**
2. **导航到**: Compute Engine > VM 实例
3. **找到您的代理 VM 实例** (instance-20251112-153615)
4. **点击实例名称**进入详情页
5. **点击"编辑"**
6. **在网络接口部分**:
   - 展开网络接口
   - 点击"外部 IP"下拉菜单
   - 选择新预留的静态 IP: `35.220.189.112`
7. **保存更改**
8. **等待实例重启**（如果需要）

### 步骤 2: 验证 IP 地址

在 GCP VM 上（通过 SSH）运行：

```bash
# 查看当前 IP 地址
curl ifconfig.me

# 或
hostname -I
```

应该显示 `35.220.189.112`

### 步骤 3: 检查 Squid 配置

在 GCP VM 上检查 Squid 是否监听正确的接口：

```bash
# 查看 Squid 配置
sudo cat /etc/squid/squid.conf | grep -i "http_port"

# 应该看到类似：
# http_port 3128
# 或
# http_port 0.0.0.0:3128
```

### 步骤 4: 重启 Squid 服务

```bash
sudo systemctl restart squid
sudo systemctl status squid
```

### 步骤 5: 测试代理连接

在 GCP VM 上测试（可选）：

```bash
curl -I https://www.google.com
```

---

## 🔍 如果仍然失败

### 检查防火墙规则

1. **GCP 控制台** > VPC 网络 > 防火墙
2. **确认规则** `allow-squid-proxy`:
   - 状态: 启用
   - 方向: 入站
   - 协议和端口: TCP 3128
   - 目标: 网络中的所有实例
   - 来源 IP 范围: `0.0.0.0/0`

### 检查 Squid 日志

```bash
# 查看访问日志
sudo tail -f /var/log/squid/access.log

# 查看错误日志
sudo tail -f /var/log/squid/cache.log
```

---

## ✅ 完成后的测试

完成上述步骤后，在国内服务器上重新测试：

```powershell
$env:HTTPS_PROXY = "http://35.220.189.112:3128"
Invoke-WebRequest -Uri "https://www.google.com" -Proxy $env:HTTPS_PROXY -Method Head
```

如果返回 `HTTP/200 OK`，说明配置成功！

---

**重要**: 确保新 IP 已分配给 VM 实例，这是最关键的一步！


