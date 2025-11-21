# 启动开发服务器（带代理配置）
# 使用阿里云 IP 47.79.137.153

Write-Host "=== 启动开发服务器（带代理配置）===" -ForegroundColor Cyan
Write-Host ""

# 设置代理环境变量
$env:HTTPS_PROXY = "http://47.79.137.153:3128"
$env:HTTP_PROXY = "http://47.79.137.153:3128"
$env:GEMINI_PROXY_URL = "http://47.79.137.153:3128"

Write-Host "已设置代理环境变量:" -ForegroundColor Green
Write-Host "  HTTPS_PROXY: $env:HTTPS_PROXY" -ForegroundColor Yellow
Write-Host "  HTTP_PROXY: $env:HTTP_PROXY" -ForegroundColor Yellow
Write-Host "  GEMINI_PROXY_URL: $env:GEMINI_PROXY_URL" -ForegroundColor Yellow
Write-Host ""

# 启动开发服务器
Write-Host "正在启动开发服务器..." -ForegroundColor Cyan
npm run dev

