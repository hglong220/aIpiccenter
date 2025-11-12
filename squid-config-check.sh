#!/bin/bash

# Squid 配置检查脚本
# 在 GCP VM 上运行此脚本

echo "=== 步骤 1: 检查 Squid 配置文件 ==="
echo ""

# 检查配置文件是否存在
if [ ! -f /etc/squid/squid.conf ]; then
    echo "❌ 错误: /etc/squid/squid.conf 不存在"
    exit 1
fi

echo "✅ 配置文件存在"
echo ""

# 显示配置文件内容
echo "=== Squid 配置文件内容 ==="
sudo cat /etc/squid/squid.conf
echo ""

# 检查关键配置
echo "=== 检查关键配置项 ==="
echo ""

# 检查 ACL 规则
echo "1. ACL 规则 (acl allowed_hosts):"
if sudo grep -q "acl.*allowed_hosts" /etc/squid/squid.conf; then
    echo "   ✅ 找到 ACL 规则:"
    sudo grep "acl.*allowed_hosts" /etc/squid/squid.conf | while read line; do
        echo "      $line"
    done
else
    echo "   ⚠️  未找到 allowed_hosts ACL 规则"
fi
echo ""

# 检查 http_access 规则
echo "2. HTTP 访问规则 (http_access):"
echo "   所有 http_access 规则:"
sudo grep "^http_access" /etc/squid/squid.conf | while read line; do
    echo "      $line"
done
echo ""

# 检查是否有 deny all
echo "3. 检查是否有 'deny all' 规则:"
if sudo grep -q "http_access deny all" /etc/squid/squid.conf; then
    echo "   ⚠️  找到 'http_access deny all'，这可能会阻止访问"
    echo "   位置:"
    sudo grep -n "http_access deny all" /etc/squid/squid.conf
else
    echo "   ✅ 未找到 'deny all' 规则"
fi
echo ""

echo "=== 建议 ==="
echo "如果看到 'http_access deny all'，需要在其上方添加 'http_access allow all'"
echo "然后重启 Squid 服务: sudo systemctl restart squid"


