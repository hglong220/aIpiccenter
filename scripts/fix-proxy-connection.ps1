# 代理连接修复助手
# 帮助用户快速修复代理连接问题

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔧 代理连接修复助手" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$envFile = ".env.local"

if (-not (Test-Path $envFile)) {
    Write-Host "❌ 未找到 .env.local 文件" -ForegroundColor Red
    Write-Host "   请先创建 .env.local 文件" -ForegroundColor Yellow
    exit 1
}

# 读取当前配置
$content = Get-Content $envFile -Raw
$proxyLine = $content -match 'GEMINI_PROXY_URL|HTTPS_PROXY|HTTP_PROXY'

Write-Host "📋 当前代理配置:" -ForegroundColor Green
if ($proxyLine) {
    $proxyLine | ForEach-Object {
        Write-Host "   $_" -ForegroundColor White
    }
} else {
    Write-Host "   未找到代理配置" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "请选择操作:" -ForegroundColor Yellow
Write-Host "1. 临时禁用代理（如果网络允许直接访问）" -ForegroundColor White
Write-Host "2. 更新代理地址和端口" -ForegroundColor White
Write-Host "3. 添加代理认证信息（用户名/密码）" -ForegroundColor White
Write-Host "4. 退出" -ForegroundColor White
Write-Host ""

$choice = Read-Host "请输入选项 (1-4)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "正在禁用代理配置..." -ForegroundColor Yellow
        
        # 注释掉所有代理配置
        $newContent = $content -replace '(?m)^(GEMINI_PROXY_URL|HTTPS_PROXY|HTTP_PROXY)=', '# $1='
        
        Set-Content -Path $envFile -Value $newContent -NoNewline
        
        Write-Host "✅ 代理配置已禁用（已注释）" -ForegroundColor Green
        Write-Host ""
        Write-Host "请重启开发服务器以使更改生效" -ForegroundColor Yellow
        Write-Host "如果网络允许，现在应该可以直接访问 Google API" -ForegroundColor Yellow
    }
    "2" {
        Write-Host ""
        $newProxy = Read-Host "请输入新的代理地址 (格式: http://proxy-server:port)"
        
        if ($newProxy -match '^https?://[^:]+:\d+$') {
            # 更新或添加 GEMINI_PROXY_URL
            if ($content -match 'GEMINI_PROXY_URL=') {
                $newContent = $content -replace 'GEMINI_PROXY_URL=.*', "GEMINI_PROXY_URL=$newProxy"
            } else {
                $newContent = $content + "`nGEMINI_PROXY_URL=$newProxy`n"
            }
            
            Set-Content -Path $envFile -Value $newContent -NoNewline
            
            Write-Host "✅ 代理地址已更新为: $newProxy" -ForegroundColor Green
            Write-Host ""
            Write-Host "请重启开发服务器并运行测试: node scripts/diagnose-proxy-quick.js" -ForegroundColor Yellow
        } else {
            Write-Host "❌ 代理地址格式不正确" -ForegroundColor Red
            Write-Host "   正确格式: http://proxy-server:port" -ForegroundColor Yellow
            Write-Host "   示例: http://47.79.137.153:3128" -ForegroundColor Yellow
        }
    }
    "3" {
        Write-Host ""
        $username = Read-Host "请输入代理用户名"
        $password = Read-Host "请输入代理密码" -AsSecureString
        $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))
        
        # 查找现有代理配置
        if ($content -match 'GEMINI_PROXY_URL=(https?://)([^@]+@)?([^:]+):(\d+)') {
            $protocol = $matches[1]
            $host = $matches[3]
            $port = $matches[4]
            $newProxyUrl = "${protocol}${username}:${plainPassword}@${host}:${port}"
            
            $newContent = $content -replace 'GEMINI_PROXY_URL=.*', "GEMINI_PROXY_URL=$newProxyUrl"
            Set-Content -Path $envFile -Value $newContent -NoNewline
            
            Write-Host "✅ 代理认证信息已添加" -ForegroundColor Green
            Write-Host "   新配置: ${protocol}${username}:***@${host}:${port}" -ForegroundColor White
            Write-Host ""
            Write-Host "请重启开发服务器并运行测试: node scripts/diagnose-proxy-quick.js" -ForegroundColor Yellow
        } else {
            Write-Host "❌ 未找到有效的代理配置" -ForegroundColor Red
            Write-Host "   请先配置代理地址" -ForegroundColor Yellow
        }
    }
    "4" {
        Write-Host "退出" -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "❌ 无效的选项" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "修复完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan































