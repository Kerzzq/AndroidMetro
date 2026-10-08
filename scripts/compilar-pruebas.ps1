param([string]$ToolsRoot = (Join-Path $env:USERPROFILE 'AMetro'))
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'activar-entorno.ps1') -ToolsRoot $ToolsRoot
$repoRoot = Split-Path $PSScriptRoot -Parent
$env:ANDROIDMETRO_TEST = '1'
$env:CI = '1'
Push-Location $repoRoot
try {
  foreach ($tool in @($env:AMETRO_NODE, $env:AMETRO_NPM, (Join-Path $env:JAVA_HOME 'bin/java.exe'), (Join-Path $env:ANDROID_HOME 'build-tools/36.0.0/apksigner.bat'))) {
    if (!(Test-Path -LiteralPath $tool)) { throw "Falta herramienta: $tool" }
  }
  if (!(Test-Path -LiteralPath 'node_modules/expo/bin/cli')) {
    & $env:AMETRO_NODE $env:AMETRO_NPM ci --cache (Join-Path $ToolsRoot 'npm-cache') --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw 'npm ci ha fallado' }
  }
  $configJson = & $env:AMETRO_NODE node_modules/expo/bin/cli config --type public --json
  if ($LASTEXITCODE -ne 0) { throw 'No se pudo evaluar Expo config' }
  $effectiveConfig = $configJson | ConvertFrom-Json
  if ($effectiveConfig.android.package -ne 'com.metrobilbao.widget.pruebas' -or $effectiveConfig.android.versionCode -ne 1) {
    throw 'Configuración de pruebas inesperada: compilación cancelada'
  }
  & $env:AMETRO_NODE node_modules/expo/bin/cli prebuild --platform android --no-install
  if ($LASTEXITCODE -ne 0) { throw 'Expo Prebuild ha fallado' }
  $nativeGradle = Get-Content -LiteralPath android/app/build.gradle -Raw
  if (!$nativeGradle.Contains("applicationId 'com.metrobilbao.widget.pruebas'")) {
    throw 'El proyecto Android no corresponde a la variante de pruebas'
  }
  $testKey = Join-Path $ToolsRoot 'signing/androidmetro-test.jks'
  if (!(Test-Path -LiteralPath $testKey)) {
    # Contraseña estándar pública de desarrollo; nunca usar esta clave para distribución.
    & (Join-Path $env:JAVA_HOME 'bin/keytool.exe') -genkeypair -keystore $testKey -storetype JKS -storepass android -keypass android -alias androiddebugkey -keyalg RSA -keysize 2048 -validity 3650 -dname 'CN=AndroidMetro pruebas,OU=Baseline,O=AndroidMetro,C=ES'
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo generar la clave EXCLUSIVA de pruebas' }
  }
  # Solo se sustituye la clave de plantilla del Android generado para el ID de pruebas.
  Copy-Item -LiteralPath $testKey -Destination android/app/debug.keystore -Force
  Push-Location android
  try {
    & ./gradlew.bat :app:assembleRelease --no-daemon --max-workers=4
    if ($LASTEXITCODE -ne 0) { throw 'Gradle assembleRelease ha fallado' }
  } finally { Pop-Location }
  $apk = Join-Path $repoRoot 'android/app/build/outputs/apk/release/app-release.apk'
  & (Join-Path $env:ANDROID_HOME 'build-tools/36.0.0/apksigner.bat') verify --verbose --print-certs $apk
  if ($LASTEXITCODE -ne 0) { throw 'El APK no pasa apksigner' }
  Get-FileHash -LiteralPath $apk -Algorithm SHA256
  Write-Host "APK de pruebas: $apk"
} finally { Pop-Location }

