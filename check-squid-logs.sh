#!/bin/bash

# 检查 Squid 日志脚本
# 在 GCP VM 上运行此脚本

echo "=== 检查 Squid 日志 ==="
echo ""

echo "1. 查看最近的访问日志（最后 20 行）:"
echo "----------------------------------------"
sudo tail -20 /var/log/squid/access.log
echo ""

echo "2. 查看错误日志（最后 20 行）:"
echo "----------------------------------------"
sudo tail -20 /var/log/squid/cache.log | grep -i "error\|deny\|refused\|timeout" || echo "未发现明显错误"
echo ""

echo "3. 实时监控日志（按 Ctrl+C 停止）:"
echo "----------------------------------------"
echo "请在国内服务器上运行测试，然后查看这里的日志输出"
echo ""
echo "运行以下命令开始监控:"
echo "  sudo tail -f /var/log/squid/access.log"
echo ""

echo "4. 检查 Squid 监听端口:"
echo "----------------------------------------"
sudo netstat -tlnp | grep 3128 || sudo ss -tlnp | grep 3128
echo ""

echo "5. 检查 Squid 配置中的端口设置:"
echo "----------------------------------------"
sudo grep "http_port" /etc/squid/squid.conf | grep -v "^#"
echo ""


