#!/bin/bash

# 测试新代理 IP 地址
# 在国内服务器上运行此脚本

echo "=== 测试新代理 IP 地址 ==="
echo ""

# 新 IP 地址
NEW_IP="35.220.189.112"
PORT="3128"
PROXY_URL="http://${NEW_IP}:${PORT}"

echo "代理地址: $PROXY_URL"
echo ""

# 步骤 1: 设置环境变量
echo "步骤 1: 设置环境变量"
export HTTPS_PROXY="$PROXY_URL"
export GEMINI_PROXY_URL="$PROXY_URL"
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
    echo "✅ 新代理通道畅通！"
    echo ""
    echo "=== 下一步 ==="
    echo "1. 更新应用配置（如果还没更新）"
    echo "2. 重启 Grok 聊天助手服务"
    echo ""
    echo "重启方法:"
    echo "  - 开发环境: 停止服务后运行 npm run dev"
    echo "  - 生产环境: pm2 restart aipiccenter"
    exit 0
else
    echo "❌ 测试失败"
    echo ""
    if [ $CURL_EXIT_CODE -ne 0 ]; then
        echo "curl 错误代码: $CURL_EXIT_CODE"
        echo "请检查:"
        echo "1. IP 地址是否已在 GCP 上预留为静态 IP"
        echo "2. Squid 服务是否运行正常"
        echo "3. 防火墙规则是否允许端口 3128"
    else
        echo "HTTP 状态码: $HTTP_CODE"
        echo "请检查代理服务器配置"
    fi
    exit 1
fi


