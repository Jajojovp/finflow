param([string]$ToolsConfig = "$env:USERPROFILE\.cache\finflow-android\tools-config.json")
$ErrorActionPreference = 'Stop'
$mobileRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$repositoryRoot = (Resolve-Path (Join-Path $mobileRoot '..')).Path
$tools = Get-Content -LiteralPath $ToolsConfig | ConvertFrom-Json
$taskNode = (Get-Command node).Source
if ([int]((& $taskNode -p 'process.versions.node').Split('.')[0]) -lt 24) {
  $taskNode = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
}
$env:JAVA_HOME = $tools.javaHome
$env:ANDROID_HOME = $tools.androidHome
$env:ANDROID_SDK_ROOT = $tools.androidHome
$env:PATH = "$(Split-Path $taskNode);$env:JAVA_HOME\bin;$env:PATH"
$env:EXPO_NO_TELEMETRY = '1'
$env:NODE_ENV = 'production'
$env:NODE_OPTIONS = '--max-old-space-size=1536'
$env:CMAKE_BUILD_PARALLEL_LEVEL = '1'
$env:GRADLE_USER_HOME = Join-Path $env:USERPROFILE '.cache\finflow-android\gradle'
$signingDir = Join-Path $env:USERPROFILE '.finflow\signing'
New-Item -ItemType Directory -Path $signingDir -Force | Out-Null
$sid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
& icacls $signingDir /inheritance:r /grant:r "*${sid}:(OI)(CI)F" | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not protect the signing directory' }
$keyStore = Join-Path $signingDir 'finflow-release.jks'
$passwordPath = Join-Path $signingDir 'password.dpapi'
if (!(Test-Path -LiteralPath $keyStore)) {
  if (Test-Path -LiteralPath $passwordPath) { throw 'Signing setup is incomplete; inspect the private directory before continuing' }
  $bytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  $password = [Convert]::ToBase64String($bytes)
  $password | ConvertTo-SecureString -AsPlainText -Force | ConvertFrom-SecureString | Set-Content -LiteralPath $passwordPath
  $env:FINFLOW_STORE_PASSWORD = $password
  & "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -keystore $keyStore -storetype JKS -storepass:env FINFLOW_STORE_PASSWORD -keypass:env FINFLOW_STORE_PASSWORD -alias finflow -keyalg RSA -keysize 3072 -sigalg SHA256withRSA -validity 10950 -dname 'CN=FinFlow'
  if ($LASTEXITCODE -ne 0) { throw 'Could not generate the FinFlow signing key' }
} else {
  if (!(Test-Path -LiteralPath $passwordPath)) { throw 'The existing signing key must not be replaced; restore its protected password first' }
  $secure = Get-Content -LiteralPath $passwordPath | ConvertTo-SecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { $env:FINFLOW_STORE_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}
$password = $null
$env:FINFLOW_STORE_FILE = $keyStore
$env:FINFLOW_KEY_PASSWORD = $env:FINFLOW_STORE_PASSWORD
$env:FINFLOW_KEY_ALIAS = 'finflow'
Push-Location $mobileRoot
try {
  & $taskNode 'node_modules/expo/bin/cli' prebuild --platform android --no-install
  if ($LASTEXITCODE -ne 0) { throw 'Android prebuild failed' }
  & $taskNode 'scripts/configure-release.cjs'
  if ($LASTEXITCODE -ne 0) { throw 'Release signing configuration failed' }
  Push-Location 'android'
  try {
    & '.\gradlew.bat' ':app:assembleRelease' '-PreactNativeArchitectures=arm64-v8a' '--no-daemon' '--max-workers=1' '-Dorg.gradle.parallel=false' '-Pkotlin.compiler.execution.strategy=in-process' '-Dorg.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8'
    if ($LASTEXITCODE -ne 0) { throw 'Android release build failed' }
  } finally { Pop-Location }
  $apk = Join-Path $mobileRoot 'android\app\build\outputs\apk\release\app-release.apk'
  $signer = Join-Path $tools.androidHome 'build-tools\37.0.0\apksigner.bat'
  $signature = (& $signer verify --verbose --print-certs $apk 2>&1) -join "`n"
  if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed' }
  $certificate = Join-Path $signingDir 'certificate.der'
  & "$env:JAVA_HOME\bin\keytool.exe" -exportcert -keystore $keyStore -storepass:env FINFLOW_STORE_PASSWORD -alias finflow -file $certificate
  if ($LASTEXITCODE -ne 0) { throw 'Could not read the release certificate' }
  $certificateHash = (Get-FileHash -LiteralPath $certificate -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($signature -notmatch "certificate SHA-256 digest:\s*$certificateHash") { throw 'The APK does not match the FinFlow release certificate' }
  Write-Output $signature
  $destination = Join-Path $repositoryRoot 'outputs\android'
  New-Item -ItemType Directory -Path $destination -Force | Out-Null
  Copy-Item -LiteralPath $apk -Destination (Join-Path $destination 'finflow-1.0.0-arm64.apk')
  @{version='1.0.0';bytes=(Get-Item -LiteralPath $apk).Length;sha256=(Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash.ToLowerInvariant();certificateSha256=$certificateHash;architecture='arm64-v8a';sourceRevision=(& git -C $repositoryRoot rev-parse HEAD)} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $destination 'release.json')
  Get-FileHash -LiteralPath $apk -Algorithm SHA256 | Select-Object Algorithm,Hash
  Write-Output "Verified Android APK: $destination\finflow-1.0.0-arm64.apk"
} finally {
  Pop-Location
  Remove-Item Env:FINFLOW_STORE_PASSWORD,Env:FINFLOW_KEY_PASSWORD -ErrorAction SilentlyContinue
}
