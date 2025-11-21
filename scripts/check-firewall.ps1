# Windows Firewall Check Script
# Check if firewall is blocking proxy connections

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Windows Firewall Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check firewall status
try {
    $firewallStatus = Get-NetFirewallProfile | Select-Object Name, Enabled

    Write-Host "Firewall Status:" -ForegroundColor Yellow
    foreach ($profile in $firewallStatus) {
        $status = if ($profile.Enabled) { "Enabled" } else { "Disabled" }
        $color = if ($profile.Enabled) { "Green" } else { "Red" }
        Write-Host "  $($profile.Name): $status" -ForegroundColor $color
    }
    Write-Host ""

    # Check outbound rules
    Write-Host "Checking outbound rules..." -ForegroundColor Yellow
    $outboundRules = Get-NetFirewallRule -Direction Outbound -ErrorAction SilentlyContinue | Where-Object {
        $_.DisplayName -like "*Node*" -or 
        $_.DisplayName -like "*npm*" -or 
        $_.DisplayName -like "*proxy*" -or
        $_.DisplayName -like "*3128*"
    }

    if ($outboundRules) {
        Write-Host "Found related outbound rules:" -ForegroundColor Yellow
        foreach ($rule in $outboundRules) {
            $action = if ($rule.Action -eq "Allow") { "Allow" } else { "Block" }
            $color = if ($rule.Action -eq "Allow") { "Green" } else { "Red" }
            Write-Host "  - $($rule.DisplayName): $action" -ForegroundColor $color
        }
    } else {
        Write-Host "No related outbound rules found" -ForegroundColor Yellow
    }
    Write-Host ""

    # Check for blocking rules
    $blockRules = Get-NetFirewallRule -Direction Outbound -ErrorAction SilentlyContinue | Where-Object {
        $_.Action -eq "Block" -and (
            $_.DisplayName -like "*Node*" -or 
            $_.DisplayName -like "*npm*"
        )
    }

    if ($blockRules) {
        Write-Host "Warning: Found rules that may block Node.js/npm:" -ForegroundColor Red
        foreach ($rule in $blockRules) {
            Write-Host "  - $($rule.DisplayName)" -ForegroundColor Red
        }
        Write-Host ""
        Write-Host "Suggestion: Check if these rules are blocking proxy connections" -ForegroundColor Yellow
    } else {
        Write-Host "No obvious blocking rules found for Node.js/npm" -ForegroundColor Green
    }
} catch {
    Write-Host "Error checking firewall: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You may need to run this script as Administrator" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Firewall Check Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "If proxy connection fails, you may need to:" -ForegroundColor Yellow
Write-Host "1. Create outbound rule to allow Node.js access to port 3128" -ForegroundColor White
Write-Host "2. Or temporarily disable firewall for testing" -ForegroundColor White
Write-Host ""

