#!/bin/bash

# 最终测试脚本 - 在国内服务器上运行

echo "=== 最终测试：代理连接验证 ==="
echo ""

# 步骤 1: 设置环境变量
export HTTPS_PROXY="http://34.66.134.109:3128"
export GEMINI_PROXY_URL="http://34.66.134.109:3128"

echo "步骤 1: 设置环境变量"
echo "HTTPS_PROXY=$HTTPS_PROXY"
echo "GEMINI_PROXY_URL=$GEMINI_PROXY_URL"
echo ""

# 步骤 2: 测试代理连接
echo "步骤 2: 测试代理连接"
echo "正在通过代理测试连接 https://www.google.com ..."
echo ""

HTTP_CODE=$(curl -x "$HTTPS_PROXY" -I https://www.google.com/ --max-time 15 -s -o /dev/null -w "%{http_code}")
CURL_EXIT_CODE=$?

if [ $CURL_EXIT_CODE -eq 0 ] && ([ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]); then
    echo "✅ 测试成功！"
    echo "状态码: HTTP/1.1 $HTTP_CODE OK"
    echo ""
    echo "✅ 代理通道畅通！"
    echo ""
    echo "=== 下一步：重启服务 ==="
    echo ""
    echo "请立即重启 Grok 聊天助手服务："
    echo ""
    echo "开发环境:"
    echo "  1. 停止当前服务（按 Ctrl+C）"
    echo "  2. 重新启动: npm run dev"
    echo ""
    echo "生产环境:"
    echo "  - PM2: pm2 restart aipiccenter"
    echo "  - systemd: sudo systemctl restart aipiccenter"
    echo "  - 直接运行: 停止进程后运行 npm start"
    echo ""
    echo "重启后，Grok 聊天助手应该就能正常访问 Gemini API 了！"
    exit 0
else
    echo "❌ 测试失败"
    echo ""
    if [ $CURL_EXIT_CODE -ne 0 ]; then
        echo "curl 错误代码: $CURL_EXIT_CODE"
        echo "请检查网络连接和代理配置"
    else
        echo "HTTP 状态码: $HTTP_CODE"
        echo "请检查代理服务器配置"
    fi
    echo ""
    echo "请确认:"
    echo "1. Squid 配置是否已修改（允许所有访问）"
    echo "2. Squid 服务是否已重启"
    echo "3. 防火墙规则是否生效"
    exit 1
fi


