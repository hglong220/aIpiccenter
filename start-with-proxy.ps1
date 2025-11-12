# PowerShell 启动脚本 - 设置代理环境变量并启动 Next.js 应用
# 使用新加坡静态 IP 代理：34.87.103.25:3128

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "启动 AI Pic Center (带代理配置)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 设置代理环境变量
$env:HTTPS_PROXY = "http://34.87.103.25:3128"
$env:HTTP_PROXY = "http://34.87.103.25:3128"
$env:GEMINI_PROXY_URL = "http://34.87.103.25:3128"

Write-Host ""
Write-Host "✅ 代理配置已设置:" -ForegroundColor Green
Write-Host "  HTTPS_PROXY: $env:HTTPS_PROXY" -ForegroundColor Yellow
Write-Host "  HTTP_PROXY: $env:HTTP_PROXY" -ForegroundColor Yellow
Write-Host "  GEMINI_PROXY_URL: $env:GEMINI_PROXY_URL" -ForegroundColor Yellow
Write-Host ""

# 验证环境变量
if (-not $env:HTTPS_PROXY) {
    Write-Host "❌ 错误: 代理环境变量设置失败" -ForegroundColor Red
    exit 1
}

# 检查是否已安装 Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "错误: 未找到 Node.js，请先安装 Node.js" -ForegroundColor Red
    exit 1
}

# 检查是否已安装依赖
if (-not (Test-Path "node_modules")) {
    Write-Host "检测到未安装依赖，正在安装..." -ForegroundColor Yellow
    npm install
}

# 获取启动模式（dev 或 start）
$mode = $args[0]
if (-not $mode) {
    $mode = "dev"
}

Write-Host "启动模式: $mode" -ForegroundColor Cyan
Write-Host ""

# 启动应用
if ($mode -eq "dev") {
    Write-Host "启动开发服务器..." -ForegroundColor Green
    npm run dev
} elseif ($mode -eq "start") {
    Write-Host "启动生产服务器..." -ForegroundColor Green
    npm start
} elseif ($mode -eq "build") {
    Write-Host "构建生产版本..." -ForegroundColor Green
    npm run build
} else {
    Write-Host "未知模式: $mode" -ForegroundColor Red
    Write-Host "用法: .\start-with-proxy.ps1 [dev|start|build]" -ForegroundColor Yellow
    exit 1
}
