# 测试新代理 IP 地址 (PowerShell)
# 在国内 Windows 服务器上运行此脚本

Write-Host "=== 测试新代理 IP 地址 ===" -ForegroundColor Cyan
Write-Host ""

# 新 IP 地址
$NEW_IP = "35.220.189.112"
$PORT = "3128"
$PROXY_URL = "http://${NEW_IP}:${PORT}"

Write-Host "代理地址: $PROXY_URL" -ForegroundColor Yellow
Write-Host ""

# 步骤 1: 设置环境变量
Write-Host "步骤 1: 设置环境变量" -ForegroundColor Yellow
$env:HTTPS_PROXY = $PROXY_URL
$env:GEMINI_PROXY_URL = $PROXY_URL
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
    Write-Host "新代理通道畅通！" -ForegroundColor Green
    Write-Host ""
    Write-Host "=== 下一步 ===" -ForegroundColor Cyan
    Write-Host "1. 更新应用配置（如果还没更新）" -ForegroundColor White
    Write-Host "2. 重启 Grok 聊天助手服务" -ForegroundColor White
    Write-Host ""
    Write-Host "重启方法:" -ForegroundColor Yellow
    Write-Host "  - 开发环境: 停止服务后运行 npm run dev" -ForegroundColor White
    Write-Host "  - 生产环境: pm2 restart aipiccenter" -ForegroundColor White
    exit 0
} catch {
    Write-Host "测试失败" -ForegroundColor Red
    Write-Host "错误: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "请检查:" -ForegroundColor Yellow
    Write-Host "1. IP 地址是否已在 GCP 上预留为静态 IP" -ForegroundColor White
    Write-Host "2. Squid 服务是否运行正常" -ForegroundColor White
    Write-Host "3. 防火墙规则是否允许端口 3128" -ForegroundColor White
    exit 1
}


