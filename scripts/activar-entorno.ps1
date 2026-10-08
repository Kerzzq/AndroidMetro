param([string]$ToolsRoot = (Join-Path $env:USERPROFILE 'AMetro'))
# Solo modifica las variables del proceso PowerShell actual.
$env:AMETRO_ROOT = $ToolsRoot
$env:JAVA_HOME = Join-Path $ToolsRoot 'tools/jdk-17.0.20.1+1'
$env:ANDROID_HOME = Join-Path $ToolsRoot 'sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:ANDROID_USER_HOME = Join-Path $ToolsRoot 'android-home'
$env:ANDROID_AVD_HOME = Join-Path $ToolsRoot 'android-home/avd'
$env:ANDROID_EMULATOR_HOME = Join-Path $ToolsRoot 'android-home'
$env:GRADLE_USER_HOME = Join-Path $ToolsRoot 'gradle-home'
$env:AMETRO_NODE = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
$env:AMETRO_NPM = Join-Path $ToolsRoot 'tools/npm/package/bin/npm-cli.js'
$env:Path = (Split-Path $env:AMETRO_NODE) + ';' + $env:JAVA_HOME + '/bin;' + $env:ANDROID_HOME + '/platform-tools;' + $env:Path

