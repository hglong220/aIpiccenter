# 创建 Windows 防火墙规则
# 允许 Node.js 访问代理服务器

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "创建防火墙出站规则" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ruleName = "Allow Node.js Proxy Access"
$proxyHost = "35.220.189.112"
$proxyPort = 3128

# 检查是否已存在规则
$existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "规则已存在: $ruleName" -ForegroundColor Yellow
    Write-Host "是否要删除并重新创建? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -eq "Y" -or $response -eq "y") {
        Remove-NetFirewallRule -DisplayName $ruleName
        Write-Host "已删除旧规则" -ForegroundColor Green
    } else {
        Write-Host "取消操作" -ForegroundColor Yellow
        exit
    }
}

try {
    # 创建出站规则
    New-NetFirewallRule -DisplayName $ruleName `
        -Direction Outbound `
        -Protocol TCP `
        -RemoteAddress $proxyHost `
        -RemotePort $proxyPort `
        -Action Allow `
        -Profile Any `
        -Description "允许 Node.js 应用程序通过代理服务器访问外部网络" | Out-Null
    
    Write-Host "✅ 防火墙规则创建成功!" -ForegroundColor Green
    Write-Host ""
    Write-Host "规则详情:" -ForegroundColor Yellow
    Write-Host "  名称: $ruleName" -ForegroundColor White
    Write-Host "  方向: 出站" -ForegroundColor White
    Write-Host "  协议: TCP" -ForegroundColor White
    Write-Host "  远程地址: $proxyHost" -ForegroundColor White
    Write-Host "  远程端口: $proxyPort" -ForegroundColor White
    Write-Host "  操作: 允许" -ForegroundColor White
    Write-Host ""
    Write-Host "现在可以测试代理连接了!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ 创建防火墙规则失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "可能需要管理员权限。请以管理员身份运行 PowerShell。" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "手动创建步骤:" -ForegroundColor Yellow
    Write-Host "1. 打开 Windows Defender 防火墙" -ForegroundColor White
    Write-Host "2. 点击 '高级设置'" -ForegroundColor White
    Write-Host "3. 点击 '出站规则' -> '新建规则'" -ForegroundColor White
    Write-Host "4. 选择 '端口' -> 'TCP' -> '特定远程端口' -> 输入 3128" -ForegroundColor White
    Write-Host "5. 选择 '允许连接'" -ForegroundColor White
    Write-Host "6. 应用到所有配置文件" -ForegroundColor White
    Write-Host "7. 名称: Allow Node.js Proxy Access" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan


