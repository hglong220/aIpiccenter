#!/bin/bash

# 验证 Squid 配置并测试
# 在 GCP VM 上运行此脚本

echo "=== 验证 Squid 配置 ==="
echo ""

# 检查 IP 地址
echo "1. 检查 IP 地址:"
CURRENT_IP=$(curl -s ifconfig.me)
echo "   当前 IP: $CURRENT_IP"

if [ "$CURRENT_IP" = "35.220.189.112" ]; then
    echo "   ✅ IP 地址正确"
else
    echo "   ❌ IP 地址不正确，应该是 35.220.189.112"
    exit 1
fi

echo ""

# 检查 Squid 配置
echo "2. 检查 Squid 配置:"
HTTP_ACCESS_RULES=$(sudo grep "^http_access" /etc/squid/squid.conf)

if echo "$HTTP_ACCESS_RULES" | grep -q "http_access allow all"; then
    echo "   ✅ 找到 'http_access allow all' 规则"
else
    echo "   ⚠️  未找到 'http_access allow all' 规则"
    echo "   正在添加..."
    sudo sed -i '/^http_access deny all/i http_access allow all' /etc/squid/squid.conf
    sudo systemctl restart squid
    echo "   ✅ 已添加并重启服务"
fi

echo ""
echo "   当前 http_access 规则:"
echo "$HTTP_ACCESS_RULES" | head -5
echo ""

# 检查服务状态
echo "3. 检查 Squid 服务状态:"
if sudo systemctl is-active --quiet squid; then
    echo "   ✅ Squid 服务正在运行"
else
    echo "   ❌ Squid 服务未运行"
    sudo systemctl start squid
    echo "   ✅ 已启动服务"
fi

echo ""
echo "4. 测试本地代理连接:"
if curl -x http://127.0.0.1:3128 -I https://www.google.com --max-time 10 -s -o /dev/null -w "%{http_code}" | grep -q "200\|301\|302"; then
    echo "   ✅ 本地代理测试成功"
else
    echo "   ⚠️  本地代理测试失败，但可能不影响外部访问"
fi

echo ""
echo "=== 验证完成 ==="
echo ""
echo "如果所有检查都通过，请在国内服务器上测试代理连接"


