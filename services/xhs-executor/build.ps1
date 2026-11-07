param([string]$BuildRoot = (Join-Path ([IO.Path]::GetTempPath()) ('amadeus-xhs-build-'+[Guid]::NewGuid().ToString('N'))))
$ErrorActionPreference='Stop'
if(Test-Path -LiteralPath $BuildRoot){throw 'Use a new isolated build directory'}
$repoRoot=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
New-Item -ItemType Directory -Path $BuildRoot | Out-Null
$source=Join-Path $BuildRoot 'source'
git clone https://github.com/xpzouying/xiaohongshu-mcp.git $source
if($LASTEXITCODE -ne 0){throw 'Clone failed'}
git -C $source checkout --detach d6352e5435b45ebb48fe240dc03a2bec0476bd56
if($LASTEXITCODE -ne 0){throw 'Pin failed'}
node (Join-Path $PSScriptRoot 'prepare.mjs') $source
if($LASTEXITCODE -ne 0){throw 'Overlay failed'}
$out=Join-Path $repoRoot 'lib/xhs'
New-Item -ItemType Directory -Path $out -Force | Out-Null
Push-Location $source
try {
 go test ./cookies -run TestDPAPISessionRoundTripAndCorruption -v
 if($LASTEXITCODE -ne 0){throw 'DPAPI validation failed'}
 go build -trimpath -o (Join-Path $out 'amadeus-xhs-executor.exe') -ldflags '-X main.version=v2.7.0-amadeus.1' .
 if($LASTEXITCODE -ne 0){throw 'Executor build failed'}
} finally {Pop-Location}
Copy-Item -LiteralPath (Join-Path $source 'LICENSE') -Destination (Join-Path $out 'LICENSE.upstream')
$sha=(Get-FileHash (Join-Path $out 'amadeus-xhs-executor.exe') -Algorithm SHA256).Hash.ToLowerInvariant()
@{version='v2.7.0-amadeus.1';sha256=$sha;upstream='d6352e5435b45ebb48fe240dc03a2bec0476bd56';storage='windows-current-user-dpapi';browser='signed-microsoft-edge-job-object'} | ConvertTo-Json | Set-Content -Encoding utf8NoBOM (Join-Path $out 'executor.json')
