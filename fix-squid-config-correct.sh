#!/bin/bash

# 正确的 Squid 配置修复脚本
# 在 GCP VM 上运行此脚本

echo "=== 修复 Squid 配置 ==="
echo ""

# 备份配置
BACKUP_FILE="/etc/squid/squid.conf.backup.$(date +%Y%m%d_%H%M%S)"
echo "1. 备份配置文件..."
sudo cp /etc/squid/squid.conf "$BACKUP_FILE"
echo "   备份到: $BACKUP_FILE"
echo ""

# 检查是否已有 allow all
if sudo grep -q "^http_access allow all" /etc/squid/squid.conf; then
    echo "2. 配置中已存在 'http_access allow all'"
    echo "   无需修改"
else
    echo "2. 添加 'http_access allow all' 规则..."
    
    # 正确的 sed 命令：在 'http_access deny all' 之前插入 'http_access allow all'
    sudo sed -i '/^http_access deny all/i http_access allow all' /etc/squid/squid.conf
    
    echo "   ✅ 已添加规则"
fi

echo ""
echo "3. 显示修改后的相关配置:"
sudo grep -A 2 -B 2 "http_access" /etc/squid/squid.conf | tail -10
echo ""

# 测试配置语法
echo "4. 测试配置语法..."
if sudo squid -k parse 2>&1 | grep -q "FATAL\|ERROR"; then
    echo "   ❌ 配置语法错误，正在恢复备份..."
    sudo cp "$BACKUP_FILE" /etc/squid/squid.conf
    exit 1
else
    echo "   ✅ 配置语法正确"
fi

echo ""
echo "5. 重启 Squid 服务..."
sudo systemctl restart squid

if [ $? -eq 0 ]; then
    echo "   ✅ Squid 服务已重启"
    echo ""
    echo "6. 检查服务状态:"
    sudo systemctl status squid --no-pager | head -5
    echo ""
    echo "✅ 配置修复完成！"
else
    echo "   ❌ Squid 重启失败"
    exit 1
fi


