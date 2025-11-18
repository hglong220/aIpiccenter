# 更新 Gemini API Key 脚本
# 使用方法：在 PowerShell 中运行此脚本，然后输入您的 API Key

Write-Host "=== 更新 Gemini API Key ===" -ForegroundColor Cyan
Write-Host ""

# 读取当前的 .env.local 文件
$envContent = Get-Content .env.local -Raw

# 提示用户输入 API Key
$apiKey = Read-Host "请输入您的 Gemini API Key"

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host "错误：API Key 不能为空" -ForegroundColor Red
    exit 1
}

# 替换 API Key
$newContent = $envContent -replace 'NEXT_PUBLIC_GEMINI_API_KEY="your-gemini-api-key"', "NEXT_PUBLIC_GEMINI_API_KEY=`"$apiKey`""

# 如果已经是其他值，也替换
$newContent = $newContent -replace 'NEXT_PUBLIC_GEMINI_API_KEY="[^"]*"', "NEXT_PUBLIC_GEMINI_API_KEY=`"$apiKey`""

# 保存文件
$newContent | Set-Content .env.local -Encoding UTF8

Write-Host ""
Write-Host "✅ API Key 已更新到 .env.local 文件" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  请重启开发服务器使配置生效：" -ForegroundColor Yellow
Write-Host "   1. 停止当前服务器 (Ctrl+C)"
Write-Host "   2. 运行: npm run dev"
Write-Host ""
































































