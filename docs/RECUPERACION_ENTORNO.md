# Recuperación del entorno AndroidMetro

Fecha: 8 de octubre de 2026 (Europe/Madrid). Estado: FASE A validada en emulador Android 16/API 36, con APK autónomo de pruebas y widget real. Fase B documentada en CAMBIO_ICONO.md, con un segundo APK independiente y recursos del lanzador.

## Fuentes y ramas

- Clon completo: `C:\Users\W11\Documents\AndroidMetro_Paquete_Completo_Codex\AndroidMetro_Codex\AndroidMetro`.
- `main`: `339def20985e0fc2f2493ed593836472c96240b5`. Se conservan los seis commits y el tag público `apk`.
- Rama de inspección: `recuperacion/baseline-2026-10-08`.
- Worktree de pruebas, creado desde main: `C:\Users\W11\AMetro\baseline`, rama `recuperacion/apk-pruebas-2026-10-08`.
- Tag `apk`: `c20add19520b7655f2a74cd097173a5c3a44839a`. No identifica por sí solo el código exacto del binario adjunto.
- Referencia histórica: `historico_zip_relevante/`, fuera del repositorio. Sus archivos JS/configuración/lockfile coinciden con main tras normalizar LF/CRLF; todos los assets compartidos coinciden por SHA-256. El árbol Git de `4a2362d` coincide con el de main: `b8631804bb179ec5d9eaa5ee65d2755403c905b9`.
- Se comprobaron las 88 entradas de `MANIFIESTO_SHA256.txt`: cero diferencias.

## Inventario comprobado

| Elemento | Versión/resultado |
| --- | --- |
| Windows | Windows 11 Pro, 10.0.26200, x64 |
| CPU/RAM | Ryzen 9 9900X, 32 GB nominales |
| Disco C al empezar el entorno | 1498,8 GB libres |
| Virtualización | Firmware activo; WHPX instalado y utilizable |
| Git privado de Codex | 2.53.0.windows.3 |
| Node privado de Codex | 24.19.0; compatible con engines de RN 0.83.2 y doctor |
| npm local, aislado | 10.9.4; paquete verificado con su integridad SHA-512 |
| JDK local | Temurin 17.0.20.1+1, javac 17.0.20.1 |
| Android CLI | 19.0, compatible con Java 17 |
| SDK Platform / Build Tools | Android 36 / 36.0.0; Gradle instaló además 35.0.0 para subproyectos |
| NDK | 27.1.12297006 (r27b) |
| CMake instalado | 3.22.1 |
| Platform Tools / ADB | 37.0.1 / 1.0.41 |
| Emulator | 37.2.12; API 36 Google APIs x86_64, revisión 7 |
| Gradle | Wrapper 9.0.0, fijado por el proyecto generado |
| AGP/Kotlin | 8.12.0 / 2.1.20, sin actualizaciones |
| Android Studio | No encontrado en PATH, rutas habituales ni inventario de programas |
| Expo/EAS globales | No encontrados; Expo CLI procede de las dependencias del proyecto; EAS no instalado ni autenticado |

Al principio tampoco estaban en PATH Git, Node/npm, Java, ADB o JAVA_HOME/ANDROID_HOME/ANDROID_SDK_ROOT. Las herramientas preparadas son locales. `scripts/activar-entorno.ps1` solo configura el proceso actual; no se usó setx ni se modificaron variables permanentes.

## Dependencias preservadas

`package-lock.json` v3 es consistente con package.json; npm ci instaló 554 paquetes. Se conservan Expo 55.0.2, React Native 0.83.2, React 19.2.0, expo-status-bar 55.0.4, AsyncStorage 2.2.0, Picker 2.11.4 y react-native-android-widget 0.20.1. New Architecture y Hermes permanecen activados. No se actualizó el lockfile.

La versión instalada de Expo recomienda AsyncStorage 2.2.0 y Picker 2.11.4. Expo SDK 55 admite RN 0.83 / React 19.2.0 y SDK 36 ([referencia oficial](https://docs.expo.dev/versions/v55.0.0/)). RN exige Node >=20.19.4; el Node incluido satisface ese requisito.

## Herramientas aisladas y descargas

Raíz: `C:\Users\W11\AMetro`.

- JDK: `tools/jdk-17.0.20.1+1`.
- npm: `tools/npm/package/bin/npm-cli.js`.
- SDK: `sdk`; Android CLI se encuentra finalmente en `sdk/cmdline-tools/19.0`.
- Datos del emulador: `android-home/avd`; caché Gradle: `gradle-home`.
- Firma de pruebas: `signing/androidmetro-test.jks`, fuera de Git. Es una clave nueva para pruebas, con la contraseña estándar pública de Android debug. Nunca usarla para distribuir una actualización de la app instalada.
- Logs de instalación: `downloads/instalacion-sdk.log` y `downloads/licencias-sdk.log`.
- No se han obtenido, sustituido ni generado credenciales originales de EAS/release.

Fuentes exactas utilizadas:

- [Temurin JDK 17.0.20.1+1 Windows x64](https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.20.1%2B1/OpenJDK17U-jdk_x64_windows_hotspot_17.0.20.1_1.zip), SHA-256 `e53a79c3c3d86865bd7e787903884331068e71321714ffd44f145785affc7cb0`.
- [Android CLI 19.0 Windows](https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip), SHA-1 publicado por Google `54a582f3bf73e04253602f2d1c80bd5868aac115`.
- [npm 10.9.4](https://registry.npmjs.org/npm/-/npm-10.9.4.tgz), integridad `sha512-OnUG836FwboQIbqtefDNlyR0gTHzIfwRfE3DuiNewBvnMnWEpB0VEXwBlFVgqpNzIgYo/MHh3d2Hel/pszapAA==`.
- El resto se instaló con sdkmanager desde el repositorio oficial de Google, manteniendo las versiones de compilación indicadas arriba.

Comando de instalación ya ejecutado (requiere Java 17 en el proceso y las licencias aceptadas para esta instalación autorizada):

```powershell
& C:\Users\W11\AMetro\sdk\cmdline-tools\19.0\bin\sdkmanager.bat --sdk_root=C:\Users\W11\AMetro\sdk `
  'platform-tools' 'platforms;android-36' 'build-tools;36.0.0' `
  'ndk;27.1.12297006' 'cmake;3.22.1' 'build-tools;35.0.0' 'emulator' `
  'system-images;android-36;google_apis;x86_64'
```

Platform-tools/emulator no usan versiones en su path de paquete: para otra recuperación, revisar sus revisiones y registrar las efectivamente instaladas; no afirmar que el comando anterior las congela.

## Reproducción local de la compilación de pruebas

El usuario autorizó el entorno local y una firma exclusiva de pruebas, y exigió un identificador distinto del móvil principal. `app.config.js` mantiene la configuración original cuando ANDROIDMETRO_TEST no es 1. En pruebas cambia únicamente ID, versionCode y nombres de app/widget en el selector para reconocerla; no altera src ni assets. ID de pruebas: `com.metrobilbao.widget.pruebas`, versionCode 1.

```powershell
Set-Location C:\Users\W11\AMetro\baseline
. .\scripts\activar-entorno.ps1
& $env:AMETRO_NODE $env:AMETRO_NPM ci --cache C:\Users\W11\AMetro\npm-cache --no-audit --no-fund
& .\scripts\compilar-pruebas.ps1
```

`compilar-pruebas.ps1` valida la configuración efectiva y el applicationId nativo antes de copiar la clave de pruebas. Ejecuta Expo Prebuild con `--platform android --no-install` (sin --clean), Gradle `:app:assembleRelease --no-daemon --max-workers=4`, apksigner y SHA-256. No instala el APK automáticamente.

APK esperado: `android/app/build/outputs/apk/release/app-release.apk`. Aunque la variante Gradle se llama release, esta build es EXCLUSIVAMENTE de pruebas, firmada con su clave de desarrollo nueva. No es una firma de publicación. El JS se empaqueta en la variante release; comprobar presencia del bundle y arranque con Metro apagado antes de aceptar el baseline.

No modificar applicationId del original, su keystore, EAS projectId ni versionCode remoto para estas pruebas. No ejecutar el script sobre un Android generado del paquete original: cancela si detecta un ID incorrecto.

## EAS preview investigado

main e histórico contienen `preview.android.buildType=apk`, sin developmentClient en preview. `cli.appVersionSource=remote` y extra.eas.projectId=`990b536c-ce8d-4a17-82f6-412aeee0e317`. El tag apk no contiene eas.json ni projectId. El perfil es apropiado para un APK autónomo ([documentación APK](https://docs.expo.dev/build-reference/apk/)), pero requiere confirmar cuenta, acceso al proyecto, keystore y versión remota. No se ejecutaron login, credentials, build o submit de EAS. EAS local --local no es la vía elegida en Windows; la alternativa local usa Gradle directamente.

## Diagnósticos, errores y soluciones mínimas

- Primera inspección: herramientas no disponibles en PATH. Solución: ejecutables privados/locales, sin instalación global.
- Primer npm portátil: los wrappers npm.cmd originales suponían la estructura de un instalador Node, y doctor no podía ejecutar npm. Se creó un wrapper local correcto. Resultado real posterior: 19/20 checks pasan; el único fallo recomienda Expo ~55.0.31, expo-status-bar ~55.0.6 y RN 0.83.10. Se conserva el lockfile; no ejecutar install --fix como respuesta automática.
- `expo export --platform android` completó 600 módulos y generó Hermes, 1.768.385 bytes, SHA-256 `a5aa8b32c8dd9c73be689b5bfb099695e239c02ddb3175f64b41b55a0da0e02c`. Esto verifica empaquetado JS; no verifica instalación ni widget.
- Prebuild avisa de Android edge-to-edge/backgroundColor y ausencia de expo-system-ui para userInterfaceStyle. Son avisos existentes; no se añadió la dependencia ni se alteró la UI.
- Primer avdmanager, ejecutado desde tools fuera de SDK, no encontraba imágenes (`Package path is not valid`). Solución: colocar CLI en sdk/cmdline-tools/19.0. AVD creado correctamente; no se cambió la imagen/arquitectura del proyecto.
- Ruta de trabajo corta elegida antes de compilar para evitar problemas potenciales de longitudes Windows/NDK; no fue un error observado de compilación.

## Auditoría nativa

La generación aislada desde main, con las dependencias bloqueadas, reproduce 55 archivos del histórico (texto normalizado y pixels de recursos comparados). Solo cambia widgetprovider XML: histórico conserva previewImage y un PNG residual; main no lo configura. El APK publicado tampoco declara previewImage y no contiene una imagen con los mismos pixels que el preview histórico. La otra diferencia es debug.keystore, excluida intencionadamente del paquete histórico.

MainApplication, MainActivity, WidgetConfigurationActivity, RNWidgetProvider, manifest, Gradle, wrapper, iconos y sus capas son reproducibles con Prebuild; no se identificaron personalizaciones manuales adicionales entre las fuentes comparadas. No se copió android/ histórico sobre el proyecto y no se hizo prebuild --clean.

Resultado de Gradle: BUILD SUCCESSFUL in 4m 18s, 363 tareas ejecutadas. No fue necesario modificar dependencias, arquitectura, Gradle ni lógica para compilar. Hubo un aviso de Metaspace 512 MiB al final; el build terminó correctamente. NODE_ENV no estaba definido en esa primera invocación y expo-constants emitió un aviso; no hay archivos .env de la app recuperada y el bundle final fue probado autónomamente. Ver BASELINE_FUNCIONAL.md para metadatos, capturas y límites de las pruebas.

## Reproducir las pruebas en el emulador aislado

El AVD AndroidMetro_API36 ya está creado en android-home/avd. Para un entorno nuevo, después de instalar la imagen y activar el entorno, crearlo una sola vez (no sobrescribir un AVD existente):

```powershell
. .\scripts\activar-entorno.ps1
'no' | & "$env:ANDROID_HOME\cmdline-tools\19.0\bin\avdmanager.bat" create avd -n AndroidMetro_API36 -k 'system-images;android-36;google_apis;x86_64' -d pixel_6
```

Para reutilizarlo e instalar exclusivamente la variante de pruebas:

```powershell
Start-Process -FilePath "$env:ANDROID_HOME\emulator\emulator.exe" -WindowStyle Hidden -ArgumentList @('-avd','AndroidMetro_API36','-port','5556','-memory','2048','-gpu','swiftshader','-no-window','-no-audio','-no-snapshot')
& "$env:ANDROID_HOME\platform-tools\adb.exe" -s emulator-5556 wait-for-device
# Esperar hasta que este comando devuelva 1 antes de instalar.
& "$env:ANDROID_HOME\platform-tools\adb.exe" -s emulator-5556 shell getprop sys.boot_completed
& "$env:ANDROID_HOME\platform-tools\adb.exe" -s emulator-5556 install -r C:\Users\W11\AMetro\artifacts\androidmetro-icono-minimal-test.apk
& "$env:ANDROID_HOME\platform-tools\adb.exe" -s emulator-5556 shell am start -W -n com.metrobilbao.widget.pruebas/.MainActivity
```

Quitar -no-window permite ver la ventana del emulador; el arranque del proceso auxiliar sigue oculto. No ejecutar un install sin selector de dispositivo ni instalar un paquete que use el applicationId original para estas pruebas. Para conservar el widget, actualizar con install -r sin desinstalar ni borrar datos. El emulador se cerró tras guardar la evidencia para liberar memoria; sus datos y el AVD permanecen en disco.
