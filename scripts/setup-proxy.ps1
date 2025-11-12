# 🛠️ 代理配置快速设置脚本 (PowerShell)
# 使用方法: .\scripts\setup-proxy.ps1 -StaticIP <STATIC_IP> -Port <PORT>

param(
    [Parameter(Mandatory=$true)]
    [string]$StaticIP,
    
    [Parameter(Mandatory=$true)]
    [int]$Port
)

$ErrorActionPreference = "Stop"

Write-Host "🛠️  GCP 代理配置设置脚本" -ForegroundColor Green
Write-Host ""

$ProxyURL = "http://${StaticIP}:${Port}"

Write-Host "配置信息:" -ForegroundColor Yellow
Write-Host "  静态 IP: $StaticIP"
Write-Host "  端口: $Port"
Write-Host "  代理 URL: $ProxyURL"
Write-Host ""

# 检查 .env.local 文件是否存在
$EnvFile = ".env.local"
if (-not (Test-Path $EnvFile)) {
    Write-Host "⚠️  .env.local 文件不存在，正在创建..." -ForegroundColor Yellow
    New-Item -Path $EnvFile -ItemType File -Force | Out-Null
}

# 备份现有文件
$BackupFile = "${EnvFile}.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Copy-Item $EnvFile $BackupFile
Write-Host "✅ 已备份现有配置文件" -ForegroundColor Green

# 读取现有内容
$Content = Get-Content $EnvFile -Raw

# 更新或添加 HTTPS_PROXY
if ($Content -match "HTTPS_PROXY=.*") {
    $Content = $Content -replace "HTTPS_PROXY=.*", "HTTPS_PROXY=$ProxyURL"
    Write-Host "✅ 已更新 HTTPS_PROXY 配置" -ForegroundColor Green
} else {
    $Content += "`n# GCP 代理配置`nHTTPS_PROXY=$ProxyURL`n"
    Write-Host "✅ 已添加 HTTPS_PROXY 配置" -ForegroundColor Green
}

# 更新或添加 GEMINI_PROXY_URL
if ($Content -match "GEMINI_PROXY_URL=.*") {
    $Content = $Content -replace "GEMINI_PROXY_URL=.*", "GEMINI_PROXY_URL=$ProxyURL"
    Write-Host "✅ 已更新 GEMINI_PROXY_URL 配置" -ForegroundColor Green
} else {
    $Content += "GEMINI_PROXY_URL=$ProxyURL`n"
    Write-Host "✅ 已添加 GEMINI_PROXY_URL 配置" -ForegroundColor Green
}

# 写入文件
Set-Content -Path $EnvFile -Value $Content.Trim()

Write-Host ""
Write-Host "✅ 配置完成！" -ForegroundColor Green
Write-Host ""
Write-Host "下一步:" -ForegroundColor Yellow
Write-Host "1. 检查 .env.local 文件中的配置"
Write-Host "2. 确保已设置 GOOGLE_GEMINI_API_KEY"
Write-Host "3. 重启服务以使配置生效:"
Write-Host "   - 开发环境: npm run dev"
Write-Host "   - 生产环境: pm2 restart aipiccenter 或重启服务"
Write-Host ""
Write-Host "验证配置:" -ForegroundColor Yellow
Write-Host "  查看 .env.local 文件: Get-Content .env.local | Select-String PROXY"
Write-Host ""




