$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (!(Test-Path -LiteralPath '.env.local')) {
    $jwtBytes = New-Object byte[] 48
    $pepperBytes = New-Object byte[] 48
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $rng.GetBytes($jwtBytes)
        $rng.GetBytes($pepperBytes)
    } finally { $rng.Dispose() }
    @"
MSSQL_SA_PASSWORD=ClothingStore@2026
JWT_SECRET_KEY=$([Convert]::ToBase64String($jwtBytes))
JWT_ISSUER=ClothingStoreAPI
JWT_AUDIENCE=ClothingStoreAngular
TWO_FACTOR_RECOVERY_PEPPER=$([Convert]::ToBase64String($pepperBytes))
TURNSTILE_ENABLED=true
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
ADMIN_EMAIL=admin@clothingstore.local
ADMIN_PASSWORD=Admin@123
"@ | Set-Content -LiteralPath '.env.local' -Encoding ASCII
}
docker compose --env-file .env.local -f compose.local.yml up -d --build --wait --wait-timeout 240
if ($LASTEXITCODE -ne 0) { throw 'Docker khong khoi dong thanh cong. Xem docker compose logs.' }
$ready = $false
for ($attempt = 0; $attempt -lt 60; $attempt++) {
    try {
        $response = Invoke-RestMethod 'http://localhost:4200/api/products' -TimeoutSec 5
        if ($response.success) { $ready = $true; break }
    } catch { }
    Start-Sleep -Seconds 2
}
if (!$ready) { throw 'API chua san sang. Xem docker compose --env-file .env.local -f compose.local.yml logs api' }
Write-Host 'Website: http://localhost:4200 | Admin: http://localhost:4200/admin'
Write-Host 'API: http://localhost:8080/swagger'
