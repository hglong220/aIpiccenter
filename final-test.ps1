# 最终测试脚本 (PowerShell) - 在国内 Windows 服务器上运行

Write-Host "=== 最终测试：代理连接验证 ===" -ForegroundColor Cyan
Write-Host ""

# 步骤 1: 设置环境变量
$env:HTTPS_PROXY = "http://34.66.134.109:3128"
$env:GEMINI_PROXY_URL = "http://34.66.134.109:3128"

Write-Host "步骤 1: 设置环境变量" -ForegroundColor Yellow
Write-Host "HTTPS_PROXY=$env:HTTPS_PROXY" -ForegroundColor Green
Write-Host "GEMINI_PROXY_URL=$env:GEMINI_PROXY_URL" -ForegroundColor Green
Write-Host ""

# 步骤 2: 测试代理连接
Write-Host "步骤 2: 测试代理连接" -ForegroundColor Yellow
Write-Host "正在通过代理测试连接 https://www.google.com ..." -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "https://www.google.com" -Proxy $env:HTTPS_PROXY -Method Head -TimeoutSec 15 -UseBasicParsing
    
    Write-Host "测试成功！" -ForegroundColor Green
    Write-Host "状态码: HTTP/$($response.StatusCode) OK" -ForegroundColor Green
    Write-Host ""
    Write-Host "代理通道畅通！" -ForegroundColor Green
    Write-Host ""
    Write-Host "=== 下一步：重启服务 ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "请立即重启 Grok 聊天助手服务：" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "开发环境:" -ForegroundColor Cyan
    Write-Host "  1. 停止当前服务（按 Ctrl+C）" -ForegroundColor White
    Write-Host "  2. 重新启动: npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "生产环境:" -ForegroundColor Cyan
    Write-Host "  - PM2: pm2 restart aipiccenter" -ForegroundColor White
    Write-Host "  - systemd: sudo systemctl restart aipiccenter" -ForegroundColor White
    Write-Host "  - 直接运行: 停止进程后运行 npm start" -ForegroundColor White
    Write-Host ""
    Write-Host "重启后，Grok 聊天助手应该就能正常访问 Gemini API 了！" -ForegroundColor Green
    exit 0
} catch {
    Write-Host "测试失败" -ForegroundColor Red
    Write-Host "错误: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "请确认:" -ForegroundColor Yellow
    Write-Host "1. Squid 配置是否已修改（允许所有访问）" -ForegroundColor White
    Write-Host "2. Squid 服务是否已重启" -ForegroundColor White
    Write-Host "3. 防火墙规则是否生效" -ForegroundColor White
    exit 1
}


