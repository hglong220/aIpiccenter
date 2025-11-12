# Final proxy test

$env:HTTPS_PROXY = "http://35.220.189.112:3128"
$env:GEMINI_PROXY_URL = "http://35.220.189.112:3128"

Write-Host "Testing proxy connection..." -ForegroundColor Yellow
Write-Host "Proxy: $env:HTTPS_PROXY" -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "https://www.google.com" -Proxy $env:HTTPS_PROXY -Method Head -TimeoutSec 20 -UseBasicParsing
    
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Status Code: HTTP/$($response.StatusCode) OK" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proxy is working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next step: Restart the service" -ForegroundColor Cyan
    Write-Host "  Development: npm run dev" -ForegroundColor White
    Write-Host "  Production: pm2 restart aipiccenter" -ForegroundColor White
} catch {
    Write-Host "FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "1. Wait 1-2 minutes for firewall rules to take effect" -ForegroundColor White
    Write-Host "2. Check Squid logs on GCP VM" -ForegroundColor White
}


