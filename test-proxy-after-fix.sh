#!/bin/bash

# 代理连接测试脚本（修复后）
# 在国内服务器上运行此脚本

echo "=== 代理连接测试（修复后）==="
echo ""

# 设置环境变量
export HTTPS_PROXY="http://34.66.134.109:3128"
export GEMINI_PROXY_URL="http://34.66.134.109:3128"

echo "代理地址: $HTTPS_PROXY"
echo ""

# 获取国内服务器 IP
echo "=== 获取国内服务器 IP ==="
MY_IP=$(curl -s ifconfig.me)
echo "您的公网 IP: $MY_IP"
echo ""

# 测试连接
echo "=== 测试代理连接 ==="
echo "正在通过代理测试连接 https://www.google.com ..."
echo ""

HTTP_CODE=$(curl -x "$HTTPS_PROXY" -I https://www.google.com/ --max-time 15 -s -o /dev/null -w "%{http_code}")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "✅ 测试成功！"
    echo "状态码: HTTP/1.1 $HTTP_CODE OK"
    echo ""
    echo "✅ 代理通道畅通！"
    echo ""
    echo "=== 下一步 ==="
    echo "请重启 Grok 聊天助手服务："
    echo "  - 如果使用 PM2: pm2 restart aipiccenter"
    echo "  - 如果使用 systemd: sudo systemctl restart aipiccenter"
    echo "  - 如果直接运行: 停止进程后重新运行 npm start"
    echo "  - 开发环境: 按 Ctrl+C 停止，然后运行 npm run dev"
    echo ""
    echo "重启后，Grok 聊天助手应该就能正常访问 Gemini API 了！"
    exit 0
else
    echo "❌ 测试失败"
    echo "状态码: $HTTP_CODE"
    echo ""
    echo "如果仍然失败，请检查："
    echo "1. GCP VM 上的 Squid 配置是否已修改"
    echo "2. Squid 服务是否已重启"
    echo "3. 防火墙规则是否生效"
    exit 1
fi


