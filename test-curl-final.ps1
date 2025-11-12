# 最终 curl 测试脚本

Write-Host "=== curl 测试 ===" -ForegroundColor Cyan
Write-Host ""

# 设置环境变量
$env:HTTPS_PROXY = "http://34.66.134.109:3128"
$env:GEMINI_PROXY_URL = "http://34.66.134.109:3128"

Write-Host "已设置环境变量:" -ForegroundColor Yellow
Write-Host "  HTTPS_PROXY=$env:HTTPS_PROXY" -ForegroundColor Gray
Write-Host "  GEMINI_PROXY_URL=$env:GEMINI_PROXY_URL" -ForegroundColor Gray
Write-Host ""

Write-Host "测试连接 https://www.google.com ..." -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "https://www.google.com" -Proxy $env:HTTPS_PROXY -Method Head -TimeoutSec 15 -UseBasicParsing
    
    Write-Host "成功！" -ForegroundColor Green
    Write-Host "状态码: HTTP/$($response.StatusCode) OK" -ForegroundColor Green
    Write-Host ""
    Write-Host "代理通道畅通！" -ForegroundColor Green
    exit 0
} catch {
    $errorType = $_.Exception.GetType().Name
    $errorMsg = $_.Exception.Message
    
    Write-Host "失败" -ForegroundColor Red
    Write-Host ""
    Write-Host "错误类型: $errorType" -ForegroundColor Red
    Write-Host "错误信息: $errorMsg" -ForegroundColor Red
    Write-Host ""
    
    if ($errorMsg -match "refused|拒绝") {
        Write-Host "诊断: Connection refused" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "原因: Squid 配置拒绝连接" -ForegroundColor White
        Write-Host "解决方案: 检查 /etc/squid/squid.conf 中的 ACL 规则" -ForegroundColor Cyan
        Write-Host "  1. SSH 到 GCP VM" -ForegroundColor White
        Write-Host "  2. 运行: sudo nano /etc/squid/squid.conf" -ForegroundColor White
        Write-Host "  3. 找到 http_access allow allowed_hosts" -ForegroundColor White
        Write-Host "  4. 确认国内服务器 IP 在允许列表中" -ForegroundColor White
    } elseif ($errorMsg -match "timeout|超时|timed out") {
        Write-Host "诊断: Operation timed out" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "原因: 连接被阻止" -ForegroundColor White
        Write-Host "解决方案:" -ForegroundColor Cyan
        Write-Host "  1. 等待 1-2 分钟，然后重试" -ForegroundColor White
        Write-Host "  2. 检查 GCP 防火墙规则是否生效" -ForegroundColor White
        Write-Host "  3. 检查国内服务器网络出口是否被限制" -ForegroundColor White
    } else {
        Write-Host "其他错误，请检查网络连接" -ForegroundColor Yellow
    }
    
    exit 1
}


