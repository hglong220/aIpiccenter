#!/bin/bash

# 🛠️ 最终代理测试脚本
# 在国内服务器上运行此脚本

echo "=== 步骤 1: 设置环境变量 ==="
export HTTPS_PROXY="http://34.66.134.109:3128"
echo "✅ 已设置: HTTPS_PROXY=$HTTPS_PROXY"
echo ""

echo "=== 步骤 2: 测试代理连接 ==="
echo "正在通过代理测试连接 https://www.google.com ..."
echo ""

# 使用 curl 测试
if curl -x "$HTTPS_PROXY" -I https://www.google.com/ --max-time 15 -s -o /dev/null -w "%{http_code}"; then
    HTTP_CODE=$(curl -x "$HTTPS_PROXY" -I https://www.google.com/ --max-time 15 -s -o /dev/null -w "%{http_code}")
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        echo ""
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
        exit 0
    else
        echo ""
        echo "⚠️  返回状态码: $HTTP_CODE"
        echo "请检查代理配置"
        exit 1
    fi
else
    echo ""
    echo "❌ 测试失败"
    echo ""
    echo "错误诊断:"
    echo "1. 连接超时 (timeout):"
    echo "   - 国内服务器无法连接到 GCP 代理"
    echo "   - 可能原因：网络限制、防火墙未生效、Squid 配置限制"
    echo ""
    echo "2. 连接被拒绝 (Connection refused):"
    echo "   - 代理服务器未响应"
    echo "   - 可能原因：Squid 服务未运行、防火墙规则未生效"
    echo ""
    echo "请将具体的错误信息告诉我"
    exit 1
fi



