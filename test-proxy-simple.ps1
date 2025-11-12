# Simple proxy test script

$env:HTTPS_PROXY = "http://35.220.189.112:3128"
$env:GEMINI_PROXY_URL = "http://35.220.189.112:3128"

Write-Host "Testing proxy: $env:HTTPS_PROXY" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "https://www.google.com" -Proxy $env:HTTPS_PROXY -Method Head -TimeoutSec 15 -UseBasicParsing
    Write-Host "Success! Status: HTTP/$($response.StatusCode) OK" -ForegroundColor Green
    Write-Host "Proxy is working! Please restart the service." -ForegroundColor Green
} catch {
    Write-Host "Failed! Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check if IP is reserved in GCP" -ForegroundColor Yellow
}
