# 🛠️ 最终代理测试脚本 (PowerShell 版本)
# 在国内 Windows 服务器上运行此脚本

Write-Host "=== 步骤 1: 设置环境变量 ===" -ForegroundColor Cyan
$env:HTTPS_PROXY = "http://34.66.134.109:3128"
Write-Host "已设置: HTTPS_PROXY=$env:HTTPS_PROXY" -ForegroundColor Green
Write-Host ""

Write-Host "=== 步骤 2: 测试代理连接 ===" -ForegroundColor Cyan
Write-Host "正在通过代理测试连接 https://www.google.com ..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "https://www.google.com" -Proxy $env:HTTPS_PROXY -Method Head -TimeoutSec 15 -UseBasicParsing
    
    Write-Host "测试成功！" -ForegroundColor Green
    Write-Host "状态码: HTTP/$($response.StatusCode) OK" -ForegroundColor Green
    Write-Host ""
    Write-Host "代理通道畅通！" -ForegroundColor Green
    Write-Host ""
    Write-Host "=== 下一步 ===" -ForegroundColor Cyan
    Write-Host "请重启 Grok 聊天助手服务：" -ForegroundColor Yellow
    Write-Host "  - 如果使用 PM2: pm2 restart aipiccenter" -ForegroundColor White
    Write-Host "  - 如果使用 systemd: sudo systemctl restart aipiccenter" -ForegroundColor White
    Write-Host "  - 如果直接运行: 停止进程后重新运行 npm start" -ForegroundColor White
    Write-Host "  - 开发环境: 按 Ctrl+C 停止，然后运行 npm run dev" -ForegroundColor White
    exit 0
} catch {
    Write-Host "测试失败" -ForegroundColor Red
    Write-Host "错误信息: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "错误诊断:" -ForegroundColor Yellow
    
    $errorMsg = $_.Exception.Message
    if ($errorMsg -match "timeout|超时") {
        Write-Host "1. 连接超时 (timeout):" -ForegroundColor Yellow
        Write-Host "   - 国内服务器无法连接到 GCP 代理" -ForegroundColor White
        Write-Host "   - 可能原因：网络限制、防火墙未生效、Squid 配置限制" -ForegroundColor White
    } elseif ($errorMsg -match "refused|拒绝") {
        Write-Host "2. 连接被拒绝 (Connection refused):" -ForegroundColor Yellow
        Write-Host "   - 代理服务器未响应" -ForegroundColor White
        Write-Host "   - 可能原因：Squid 服务未运行、防火墙规则未生效" -ForegroundColor White
    } else {
        Write-Host "其他错误: $errorMsg" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "请将具体的错误信息告诉我" -ForegroundColor Cyan
    exit 1
}



