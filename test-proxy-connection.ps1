# 代理连接测试脚本

Write-Host "`n=== 代理连接测试 ===" -ForegroundColor Cyan
Write-Host ""

$proxyUrl = "http://34.66.134.109:3128"
Write-Host "测试代理地址: $proxyUrl" -ForegroundColor Yellow
Write-Host ""

# 测试 1: 连接 Google
Write-Host "测试 1: 连接 https://www.google.com ..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://www.google.com" -Proxy $proxyUrl -Method Head -TimeoutSec 10 -UseBasicParsing
    Write-Host "✅ 测试成功！" -ForegroundColor Green
    Write-Host "   状态码: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   代理通道畅通！" -ForegroundColor Green
    Write-Host ""
    Write-Host "下一步: 重启服务即可使用代理" -ForegroundColor Cyan
    exit 0
} catch {
    Write-Host "❌ 测试失败" -ForegroundColor Red
    Write-Host "   错误: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    
    # 诊断
    $errorMsg = $_.Exception.Message
    if ($errorMsg -match "refused") {
        Write-Host "诊断: Connection refused" -ForegroundColor Yellow
        Write-Host "可能原因:" -ForegroundColor Yellow
        Write-Host "  1. GCP 防火墙规则未完全生效" -ForegroundColor White
        Write-Host "  2. Squid 服务未运行" -ForegroundColor White
        Write-Host ""
        Write-Host "建议: 登录 GCP VM (SSH) 运行以下命令检查:" -ForegroundColor Cyan
        Write-Host "  sudo systemctl status squid" -ForegroundColor White
    } elseif ($errorMsg -match "timeout") {
        Write-Host "诊断: Operation timed out (连接超时)" -ForegroundColor Yellow
        Write-Host "可能原因:" -ForegroundColor Yellow
        Write-Host "  1. 代理 IP 地址不正确 (当前: 34.66.134.109)" -ForegroundColor White
        Write-Host "  2. 端口不正确 (当前: 3128)" -ForegroundColor White
        Write-Host "  3. GCP 防火墙规则未创建或未生效" -ForegroundColor White
        Write-Host ""
        Write-Host "请确认:" -ForegroundColor Cyan
        Write-Host "  - 在 GCP 控制台确认静态 IP" -ForegroundColor White
        Write-Host "  - 在 GCP 防火墙规则中确认端口 3128 已开放" -ForegroundColor White
    } else {
        Write-Host "其他错误，请检查代理配置" -ForegroundColor Yellow
    }
    
    exit 1
}

