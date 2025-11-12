#!/bin/bash

# 🛠️ 代理配置快速设置脚本
# 使用方法: bash scripts/setup-proxy.sh <STATIC_IP> <PORT>

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🛠️  GCP 代理配置设置脚本${NC}"
echo ""

# 检查参数
if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${RED}❌ 错误: 缺少参数${NC}"
    echo ""
    echo "使用方法:"
    echo "  bash scripts/setup-proxy.sh <STATIC_IP> <PORT>"
    echo ""
    echo "示例:"
    echo "  bash scripts/setup-proxy.sh 34.66.134.109 3128"
    exit 1
fi

STATIC_IP=$1
PORT=$2
PROXY_URL="http://${STATIC_IP}:${PORT}"

echo -e "${YELLOW}配置信息:${NC}"
echo "  静态 IP: ${STATIC_IP}"
echo "  端口: ${PORT}"
echo "  代理 URL: ${PROXY_URL}"
echo ""

# 检查 .env.local 文件是否存在
ENV_FILE=".env.local"
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  .env.local 文件不存在，正在创建...${NC}"
    touch "$ENV_FILE"
fi

# 备份现有文件
cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo -e "${GREEN}✅ 已备份现有配置文件${NC}"

# 更新或添加代理配置
if grep -q "HTTPS_PROXY=" "$ENV_FILE"; then
    # 更新现有配置
    sed -i.bak "s|HTTPS_PROXY=.*|HTTPS_PROXY=${PROXY_URL}|" "$ENV_FILE"
    echo -e "${GREEN}✅ 已更新 HTTPS_PROXY 配置${NC}"
else
    # 添加新配置
    echo "" >> "$ENV_FILE"
    echo "# GCP 代理配置" >> "$ENV_FILE"
    echo "HTTPS_PROXY=${PROXY_URL}" >> "$ENV_FILE"
    echo "GEMINI_PROXY_URL=${PROXY_URL}" >> "$ENV_FILE"
    echo -e "${GREEN}✅ 已添加代理配置${NC}"
fi

# 检查 GEMINI_PROXY_URL
if grep -q "GEMINI_PROXY_URL=" "$ENV_FILE"; then
    sed -i.bak "s|GEMINI_PROXY_URL=.*|GEMINI_PROXY_URL=${PROXY_URL}|" "$ENV_FILE"
    echo -e "${GREEN}✅ 已更新 GEMINI_PROXY_URL 配置${NC}"
else
    echo "GEMINI_PROXY_URL=${PROXY_URL}" >> "$ENV_FILE"
    echo -e "${GREEN}✅ 已添加 GEMINI_PROXY_URL 配置${NC}"
fi

# 清理备份文件
rm -f "${ENV_FILE}.bak"

echo ""
echo -e "${GREEN}✅ 配置完成！${NC}"
echo ""
echo -e "${YELLOW}下一步:${NC}"
echo "1. 检查 .env.local 文件中的配置"
echo "2. 确保已设置 GOOGLE_GEMINI_API_KEY"
echo "3. 重启服务以使配置生效:"
echo "   - 开发环境: npm run dev"
echo "   - 生产环境: pm2 restart aipiccenter 或重启服务"
echo ""
echo -e "${YELLOW}验证配置:${NC}"
echo "  查看 .env.local 文件: cat .env.local | grep PROXY"
echo ""




