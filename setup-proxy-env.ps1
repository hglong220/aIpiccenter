# 快速设置代理环境变量脚本
# 运行此脚本后，在当前 PowerShell 会话中设置代理环境变量

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "设置代理环境变量" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 设置代理环境变量
$env:HTTPS_PROXY = "http://34.87.103.25:3128"
$env:HTTP_PROXY = "http://34.87.103.25:3128"
$env:GEMINI_PROXY_URL = "http://34.87.103.25:3128"

Write-Host ""
Write-Host "✅ 代理环境变量已设置:" -ForegroundColor Green
Write-Host "  HTTPS_PROXY: $env:HTTPS_PROXY" -ForegroundColor Yellow
Write-Host "  HTTP_PROXY: $env:HTTP_PROXY" -ForegroundColor Yellow
Write-Host "  GEMINI_PROXY_URL: $env:GEMINI_PROXY_URL" -ForegroundColor Yellow
Write-Host ""

Write-Host "⚠️  注意: 这些环境变量只在当前 PowerShell 会话中有效" -ForegroundColor Yellow
Write-Host "   如果关闭此窗口，需要重新运行此脚本" -ForegroundColor Yellow
Write-Host ""

Write-Host "现在可以运行以下命令启动应用:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host "  或" -ForegroundColor White
Write-Host "  npm start" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan


