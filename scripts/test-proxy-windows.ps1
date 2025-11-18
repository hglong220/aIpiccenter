# PowerShell 代理诊断脚本
# 快速测试代理服务器连接

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔍 Windows 代理诊断工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 读取环境变量
$envFile = ".env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$proxyUrl = $env:GEMINI_PROXY_URL
if (-not $proxyUrl) {
    $proxyUrl = $env:HTTPS_PROXY
}
if (-not $proxyUrl) {
    $proxyUrl = $env:HTTP_PROXY
}

if (-not $proxyUrl) {
    Write-Host "❌ 未配置代理" -ForegroundColor Red
    Write-Host ""
    Write-Host "请在 .env.local 中设置以下环境变量之一:" -ForegroundColor Yellow
    Write-Host "  - GEMINI_PROXY_URL=http://proxy-server:port"
    Write-Host "  - HTTPS_PROXY=http://proxy-server:port"
    Write-Host "  - HTTP_PROXY=http://proxy-server:port"
    Write-Host ""
    Write-Host "如果需要认证，使用格式:" -ForegroundColor Yellow
    Write-Host "  - GEMINI_PROXY_URL=http://username:password@proxy-server:port"
    exit 1
}

Write-Host "📋 当前代理配置:" -ForegroundColor Green
Write-Host "   完整URL: $proxyUrl" -ForegroundColor White

# 解析代理URL
if ($proxyUrl -match '://(?:([^:@]+):([^@]+)@)?([^:@]+):(\d+)') {
    $username = $matches[1]
    $password = $matches[2]
    $host = $matches[3]
    $port = $matches[4]
    
    Write-Host "   服务器: ${host}:${port}" -ForegroundColor White
    if ($username) {
        Write-Host "   认证: ${username}:***" -ForegroundColor White
    } else {
        Write-Host "   认证: 无" -ForegroundColor White
    }
} else {
    Write-Host "   ⚠️  无法解析代理URL格式" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 测试 1: 端口连通性测试
Write-Host "🔌 测试 1: 端口连通性测试..." -ForegroundColor Cyan
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $connect = $tcpClient.BeginConnect($host, $port, $null, $null)
    $wait = $connect.AsyncWaitHandle.WaitOne(5000, $false)
    
    if ($wait) {
        $tcpClient.EndConnect($connect)
        Write-Host "✅ 端口连接成功！" -ForegroundColor Green
        Write-Host "   服务器 $host 的端口 $port 可以访问" -ForegroundColor White
        $tcpClient.Close()
    } else {
        Write-Host "❌ 端口连接超时（5秒）" -ForegroundColor Red
        Write-Host "   无法连接到 ${host}:${port}" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ 端口连接失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   无法连接到 ${host}:${port}" -ForegroundColor Yellow
}

Write-Host ""

# 测试 2: HTTP 连接测试
Write-Host "🌐 测试 2: HTTP 代理连接测试..." -ForegroundColor Cyan
try {
    $proxy = New-Object System.Net.WebProxy($proxyUrl)
    $webClient = New-Object System.Net.WebClient
    $webClient.Proxy = $proxy
    $webClient.Headers.Add("User-Agent", "Mozilla/5.0")
    
    $startTime = Get-Date
    $response = $webClient.DownloadString("http://httpbin.org/ip")
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    
    Write-Host "✅ HTTP 代理连接成功！" -ForegroundColor Green
    Write-Host "   响应时间: $([math]::Round($duration))ms" -ForegroundColor White
    Write-Host "   响应内容: $response" -ForegroundColor Gray
} catch {
    Write-Host "❌ HTTP 代理连接失败: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Message -match "407") {
        Write-Host ""
        Write-Host "💡 诊断: 代理需要认证（407 Proxy Authentication Required）" -ForegroundColor Yellow
        Write-Host "   解决方案: 在代理URL中添加用户名和密码" -ForegroundColor Yellow
        Write-Host "   格式: http://username:password@${host}:${port}" -ForegroundColor White
    } elseif ($_.Exception.Message -match "timeout|timed out") {
        Write-Host ""
        Write-Host "💡 诊断: 连接超时" -ForegroundColor Yellow
        Write-Host "   可能原因: 代理服务器响应慢或已关闭" -ForegroundColor Yellow
    } elseif ($_.Exception.Message -match "refused|无法连接") {
        Write-Host ""
        Write-Host "💡 诊断: 连接被拒绝" -ForegroundColor Yellow
        Write-Host "   可能原因: 代理服务器未运行或端口错误" -ForegroundColor Yellow
    }
}

Write-Host ""

# 测试 3: HTTPS 连接测试
Write-Host "🔒 测试 3: HTTPS 代理连接测试（Google）..." -ForegroundColor Cyan
try {
    $proxy = New-Object System.Net.WebProxy($proxyUrl)
    $webClient = New-Object System.Net.WebClient
    $webClient.Proxy = $proxy
    $webClient.Headers.Add("User-Agent", "Mozilla/5.0")
    
    # 忽略SSL证书错误（仅用于测试）
    [System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
    
    $startTime = Get-Date
    $response = $webClient.DownloadString("https://www.google.com")
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    
    Write-Host "✅ HTTPS 代理连接成功！" -ForegroundColor Green
    Write-Host "   响应时间: $([math]::Round($duration))ms" -ForegroundColor White
    Write-Host "   响应长度: $($response.Length) 字符" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🎉 代理配置正常，可以正常使用！" -ForegroundColor Green
} catch {
    Write-Host "❌ HTTPS 代理连接失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📝 诊断完成" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 提示:" -ForegroundColor Yellow
Write-Host "   - 如果端口测试失败，代理服务器可能已关闭" -ForegroundColor White
Write-Host "   - 如果HTTP/HTTPS测试失败但端口测试成功，可能是代理需要认证" -ForegroundColor White
Write-Host "   - 如果所有测试都失败，请检查代理服务器状态" -ForegroundColor White
Write-Host "   - 如果网络允许，可以临时禁用代理进行测试" -ForegroundColor White

