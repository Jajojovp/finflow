param(
  [int]$Port = 8081,
  [ValidateSet('lan','localhost')][string]$Connection = 'lan'
)
$ErrorActionPreference = 'Stop'
$taskNode = (Get-Command node -ErrorAction SilentlyContinue).Source
if($taskNode){$taskNodeMajor=[int]((& $taskNode -p 'process.versions.node').Split('.')[0])}else{$taskNodeMajor=0}
if($taskNodeMajor -lt 24){
  $bundledTaskNode=Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
  if(!(Test-Path -LiteralPath $bundledTaskNode)){throw 'Instala Node.js 24 o posterior para iniciar esta app Expo.'}
  $taskNode=$bundledTaskNode
}
Push-Location $PSScriptRoot
try{
  $env:EXPO_NO_TELEMETRY='1'
  & $taskNode 'node_modules/expo/bin/cli' start "--$Connection" --port $Port --max-workers 2
}finally{Pop-Location}
