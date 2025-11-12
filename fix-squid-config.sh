#!/bin/bash

# Squid 配置修复脚本（临时测试用）
# 在 GCP VM 上运行此脚本

echo "=== 修改 Squid 配置（临时允许所有访问）==="
echo ""
echo "⚠️  警告: 这将临时允许所有 IP 访问代理（仅用于测试）"
echo ""

# 备份原配置
BACKUP_FILE="/etc/squid/squid.conf.backup.$(date +%Y%m%d_%H%M%S)"
echo "1. 备份原配置文件到: $BACKUP_FILE"
sudo cp /etc/squid/squid.conf "$BACKUP_FILE"
echo "   ✅ 备份完成"
echo ""

# 检查是否有 deny all
if sudo grep -q "^http_access deny all" /etc/squid/squid.conf; then
    echo "2. 找到 'http_access deny all' 规则"
    echo "   正在添加 'http_access allow all' 规则..."
    
    # 在 deny all 之前添加 allow all
    sudo sed -i '/^http_access deny all/i # 临时测试规则：允许所有 IP 访问\nhttp_access allow all' /etc/squid/squid.conf
    
    echo "   ✅ 已添加 'http_access allow all'"
    echo ""
    
    # 显示修改后的相关行
    echo "3. 修改后的配置（相关部分）:"
    sudo grep -A 2 -B 2 "http_access allow all" /etc/squid/squid.conf | head -5
    echo ""
    
    # 测试配置语法
    echo "4. 测试配置语法:"
    if sudo squid -k parse 2>&1 | grep -q "FATAL\|ERROR"; then
        echo "   ❌ 配置语法错误，正在恢复备份..."
        sudo cp "$BACKUP_FILE" /etc/squid/squid.conf
        echo "   ✅ 已恢复备份"
        exit 1
    else
        echo "   ✅ 配置语法正确"
    fi
    echo ""
    
    # 重启 Squid
    echo "5. 重启 Squid 服务:"
    sudo systemctl restart squid
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Squid 服务已重启"
        echo ""
        echo "6. 检查服务状态:"
        sudo systemctl status squid --no-pager | head -5
        echo ""
        echo "✅ 配置修改完成！"
        echo ""
        echo "现在可以在国内服务器上测试代理连接了"
    else
        echo "   ❌ Squid 重启失败，正在恢复备份..."
        sudo cp "$BACKUP_FILE" /etc/squid/squid.conf
        sudo systemctl restart squid
        exit 1
    fi
else
    echo "2. 未找到 'http_access deny all' 规则"
    echo "   配置文件可能已经是允许所有访问的状态"
    echo ""
    echo "当前 http_access 规则:"
    sudo grep "^http_access" /etc/squid/squid.conf
fi


