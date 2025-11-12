# ✅ GCP VM 验证检查清单

## 📋 在 GCP VM 上需要确认的事项

### 1. 验证 IP 地址

运行以下命令，确认 VM 正在使用新 IP：

```bash
curl ifconfig.me
```

**预期结果**: 应该显示 `35.220.189.112`

如果显示的是旧 IP 或其他 IP，说明新 IP 还未分配给 VM 实例。

---

### 2. 检查 Squid 服务状态

运行以下命令：

```bash
sudo systemctl status squid
```

**预期结果**: 应该显示 `Active: active (running)`

如果显示 `inactive` 或 `failed`，需要：
```bash
sudo systemctl start squid
sudo systemctl enable squid
```

---

### 3. 检查 Squid 配置

确认 Squid 监听正确的端口：

```bash
sudo cat /etc/squid/squid.conf | grep http_port
```

**预期结果**: 应该看到 `http_port 3128` 或 `http_port 0.0.0.0:3128`

---

### 4. 查看 Squid 日志（可选）

如果连接仍然失败，查看日志：

```bash
# 查看访问日志
sudo tail -20 /var/log/squid/access.log

# 查看错误日志
sudo tail -20 /var/log/squid/cache.log
```

---

## ✅ 如果所有检查都通过

如果：
- ✅ IP 地址正确显示为 `35.220.189.112`
- ✅ Squid 服务状态为 `active (running)`
- ✅ 端口配置正确

那么请在国内服务器上重新测试：

```powershell
$env:HTTPS_PROXY = "http://35.220.189.112:3128"
Invoke-WebRequest -Uri "https://www.google.com" -Proxy $env:HTTPS_PROXY -Method Head
```

---

## 🔍 如果 IP 地址不正确

如果 `curl ifconfig.me` 显示的不是 `35.220.189.112`，需要：

1. **在 GCP 控制台**:
   - 导航到: Compute Engine > VM 实例
   - 点击您的实例名称
   - 点击"编辑"
   - 在网络接口中，将外部 IP 改为 `35.220.189.112`
   - 保存更改

2. **等待实例更新完成**

3. **重新验证 IP**:
   ```bash
   curl ifconfig.me
   ```


