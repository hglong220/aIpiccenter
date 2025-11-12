#!/bin/bash
# Bash 启动脚本 - 设置代理环境变量并启动 Next.js 应用
# 使用新加坡静态 IP 代理：34.87.103.25:3128

echo "========================================"
echo "启动 AI Pic Center (带代理配置)"
echo "========================================"

# 设置代理环境变量
export HTTPS_PROXY="http://34.87.103.25:3128"
export HTTP_PROXY="http://34.87.103.25:3128"
export GEMINI_PROXY_URL="http://34.87.103.25:3128"

echo ""
echo "代理配置已设置:"
echo "  HTTPS_PROXY: $HTTPS_PROXY"
echo "  HTTP_PROXY: $HTTP_PROXY"
echo "  GEMINI_PROXY_URL: $GEMINI_PROXY_URL"
echo ""

# 检查是否已安装 Node.js
if ! command -v node &> /dev/null; then
    echo "错误: 未找到 Node.js，请先安装 Node.js"
    exit 1
fi

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "检测到未安装依赖，正在安装..."
    npm install
fi

# 获取启动模式（dev 或 start）
MODE=${1:-dev}

echo "启动模式: $MODE"
echo ""

# 启动应用
case "$MODE" in
    dev)
        echo "启动开发服务器..."
        npm run dev
        ;;
    start)
        echo "启动生产服务器..."
        npm start
        ;;
    build)
        echo "构建生产版本..."
        npm run build
        ;;
    *)
        echo "未知模式: $MODE"
        echo "用法: ./start-with-proxy.sh [dev|start|build]"
        exit 1
        ;;
esac


