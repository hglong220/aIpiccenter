# 🔍 GCP 配置检查清单

请按照以下步骤检查 GCP 配置，并将结果告诉我。

## 1. 🌐 确认代理地址和防火墙状态 (GCP 控制台)

### 步骤 1.1: 检查静态 IP 地址

1. 登录 [GCP 控制台](https://console.cloud.google.com/)
2. 导航到：**VPC 网络 > 外部 IP 地址**
3. 找到实例 `instance-20251112-153615`（或你的代理 VM 实例）
4. 查看对应的**静态 IP 地址**

**请告诉我：** 你的静态 IP 地址是什么？

---

### 步骤 1.2: 检查防火墙端口

1. 在 GCP 控制台中，导航到：**VPC 网络 > 防火墙**
2. 找到规则 `allow-squid-proxy`（或你创建的代理防火墙规则）
3. 点击规则名称，查看详情
4. 确认：
   - **协议和端口**：是否允许 TCP 端口 `3128`
   - **状态**：是否显示"启用"
   - **操作**：是否显示"允许"

**请告诉我：** 
- 端口是多少？（应该是 3128）
- 防火墙规则是否已启用？

---

## 2. 💻 确认 Squid 服务运行状态 (GCP VM 的 SSH 终端)

### 步骤 2.1: SSH 登录到 GCP VM

1. 在 GCP 控制台中，找到你的代理 VM 实例
2. 点击 **SSH** 按钮，打开浏览器 SSH 终端
3. 或者使用本地 SSH 客户端连接

### 步骤 2.2: 检查 Squid 服务状态

在 SSH 终端中运行以下命令：

```bash
sudo systemctl status squid
```

**预期结果：**
- 应该显示 `Active: active (running)`
- 不应该显示 `Active: inactive (dead)` 或 `Active: failed`

**请告诉我：** Squid 服务状态是什么？

---

## 3. 📋 结果汇总

请将检查结果用以下格式回复：

```
静态 IP 是 [IP 地址]，端口是 [端口号]。
防火墙已配置 [是/否]。
Squid 状态是 [运行中/停止/失败]。
```

**示例：**
```
静态 IP 是 34.66.134.109，端口是 3128。
防火墙已配置 是。
Squid 状态是 运行中。
```

---

## 4. 🔧 如果发现问题

### 如果 Squid 服务未运行：

```bash
# 启动 Squid 服务
sudo systemctl start squid

# 设置开机自启
sudo systemctl enable squid

# 再次检查状态
sudo systemctl status squid
```

### 如果防火墙规则未配置：

1. 在 GCP 控制台，导航到：**VPC 网络 > 防火墙**
2. 点击 **创建防火墙规则**
3. 配置：
   - **名称**：`allow-squid-proxy`
   - **方向**：入站
   - **操作**：允许
   - **目标**：网络中的所有实例
   - **来源 IP 范围**：`0.0.0.0/0`（或限制为特定 IP）
   - **协议和端口**：TCP，端口 `3128`
4. 点击 **创建**

---

## 5. ✅ 验证代理连接

配置完成后，可以在本地测试代理连接：

```powershell
# Windows PowerShell
Invoke-WebRequest -Uri "https://www.google.com" -Proxy "http://你的IP:3128" -Method Head -TimeoutSec 10
```

如果返回 `200 OK`，说明代理配置成功！



