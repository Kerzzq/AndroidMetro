# Baseline funcional AndroidMetro

Fecha: 8 de octubre de 2026. Estado: FASE A VALIDADA EN EMULADOR. APK autónomo compilado, instalado y probado con el widget real. El nuevo icono no se ha integrado en este baseline.

## Verificado

- Fuente elegida: main `339def20985e0fc2f2493ed593836472c96240b5`, árbol idéntico a `4a2362d`; histórico equivalente en JS/config/assets, preservado como referencia fuera del repo.
- Dependencias instaladas con npm ci sin cambios del lockfile. Bundle Hermes de producción generado y Prebuild nativo comparado.
- API `https://api.metrobilbao.eus/metro/real-time/ABA/MOY`: HTTP 200 el 8/10/2026, ocho trenes en la observación inicial; campos timeRounded, estimated, direction y wagons presentes. Esta petición de PC no prueba la red ni el widget de Android.
- APK público: `metroBilbao.apk`, 62.918.257 bytes, SHA-256 `f2e28a2a001fd4d1c3ca86ce42e4fc9442acc9ecd8b6a78cc1b37f97770310bc`, coincide con digest de GitHub.
- Paquete público `com.metrobilbao.widget`, versionName 1.0.0, versionCode 1, minSdk 24, compile/target 36. No se declara debuggable=true. Bundle Hermes embebido `assets/index.android.bundle`, 1.075.440 bytes. ABI arm64-v8a, armeabi-v7a, x86, x86_64.
- apksigner 36.0.0 verifica correctamente firma v2 del APK público, un firmante RSA 2048. Certificado SHA-256 `91bc77ae484bc3ff3408f13950894e4ed7a3d49674a20f7a634b798747e026c0`. No valida correspondencia con el móvil principal.
- Manifest publicado contiene actividad de configuración, provider MetroBilbaoWidget y servicio de colección. Provider: cuatro celdas por lado, refresco 1.800.000 ms, configuración reconfigurable, sin previewImage.
- Las fuentes app.json/index/App y servicio del tag apk son diferentes de main. Tag usa scraping HTML y AsyncStorage ^3.0.1; main usa JSON API y AsyncStorage 2.2.0. El bundle público contiene claves de ajustes y API posteriores al código del tag. No atribuir el APK al tag por el nombre de la release.
- PNG nuevo aprobado: 512x512, 92.094 bytes. Solo se ha comprobado; no se usa en la compilación baseline.

## Hipótesis

El binario publicado podría haberse construido a partir de un árbol de trabajo con cambios aún no comprometidos en el tag apk. El certificado y las fechas son compatibles con una build externa, pero no demuestran uso de EAS ni un comando exacto. No se ha identificado el APK instalado en el móvil.

## Pruebas Android ejecutadas

| Comprobación | Estado |
| --- | --- |
| APK baseline nuevo y apksigner/ID/firma distintos | Correcto: firma v2 válida, ID independiente y certificado nuevo |
| Instalación en emulator-5556 y arranque sin Metro | Correcto: Success; arranque frío 839 ms; ningún servidor en TCP 8081 |
| Selección origen/destino en cuatro paneles, tiempos reales | Correcto: ABA→MOY, MOY→ABA, CAV→SIN y BAR→ANS desde UI |
| Persistencia al cerrar/abrir y reiniciar Android | Correcto: rutas y ajustes conservados al reabrir y tras adb reboot del emulador |
| Widget real colocado en launcher | Correcto: Nexus Launcher, appWidgetId=2; 4×5 celdas en este dispositivo |
| Cuatro paneles visibles y refresco manual | Correcto: cuatro rutas y trenes; minutos y vagones probados; ver límites de recorte |
| Actualización con app cerrada y cambios de rutas/ajustes | Correcto al refrescar: proceso pasó de inexistente a PID 6487; ruta/ajustes visibles |
| Sin conexión/errores, restauración de conectividad | Correcto para recuperación: app/widget no fallan; logs de Network request failed, UI vacía; trenes vuelven al reconectar |
| Capturas y logs de Android | Guardados en docs/evidencias y C:\\Users\\W11\\AMetro\\evidencias |

## Comportamientos existentes que deben observarse sin refactorizar

El servicio captura fallos HTTP/red y devuelve []; la UI puede mostrar ausencia de trenes también ante fallo de red. Guardar rutas/ajustes no solicita requestWidgetUpdate: probar refresco manual y eventos del sistema sin introducir un cambio funcional. La configuración es compartida por las instancias del widget dentro del mismo paquete de app. Una selección incompleta conserva potencialmente datos previos en pantalla hasta un nuevo fetch; registrar lo observado.

## Protección de la instalación funcional

Todas las operaciones ADB de instalación/entrada deben incluir `-s emulator-5556`. El APK de pruebas usa `com.metrobilbao.widget.pruebas` y una clave nueva fuera de Git. No se ha conectado, instalado, desinstalado, borrado datos ni sobrescrito nada en el móvil principal. Tampoco se ha publicado, hecho push o creado releases.

La puerta A→B queda satisfecha para esta variante y emulador: APK autónomo instalable y widget real funcionando. No es una validación de la firma ni del comportamiento del móvil principal, que permanece intacto. No se han probado otros launchers/OEM, Doze prolongado ni el ciclo completo de 30 minutos en reposo; no se forzaron errores HTTP 4xx/5xx del servidor real. Se probaron fallos reales de conectividad y recuperación.

## APK baseline conservado

Ruta: `C:\Users\W11\AMetro\artifacts\androidmetro-baseline-test.apk`.

- Tamaño: 62.918.313 bytes.
- SHA-256: `6ffe136f331dc6d4785b82cdad1de87c3525bc4d2c80de18657c7cc02b0a75a1`.
- ID: `com.metrobilbao.widget.pruebas`; versionName 1.0.0; versionCode 1; minSdk 24; target/compile 36.
- Certificado de pruebas SHA-256: `5822756d7982c9c612d283f007d55f08e62b7a4224cc9b5b9409b1297891026d`, RSA 2048, DN AndroidMetro pruebas/Baseline. Distinto del APK público. Firma v2 verificada con apksigner 36.0.0.
- Bundle Hermes: 1.075.440 bytes, SHA-256 `b9d73c39464e1ec4b286ceb4836c9f36849e17e0b27591de2f839d84d2af9540`. El bundle público tiene mismo tamaño pero hash `740905ea9d8001d6147c689de43598cb999598f766faaf3688cc06527bfc3911`; no son idénticos.
- Cuatro ABI originales; sin flag DEBUGGABLE. La build se obtuvo por assembleRelease, con clave exclusiva de pruebas; no es una actualización de distribución.
- Entorno: AVD Pixel 6, Android 16/API 36 Google APIs x86_64; WHPX, 2 GB RAM. Firmware `google/sdk_gphone64_x86_64/emu64xa:16/BE2A.250530.026.F3/13894323:userdebug/dev-keys`. Capturas de reloj del emulador en UTC; horarios del servicio en Europe/Madrid.

## Evidencia visual

- [App con trenes reales, panel 1](evidencias/baseline-panel1-trenes.png).
- [Widget real con cuatro rutas y vagones](evidencias/baseline-widget-real.png).
- [Widget con app cerrada](evidencias/baseline-widget-app-cerrada.png).
- [Widget sin conexión](evidencias/baseline-widget-sin-conexion.png).
- [Widget recuperado tras reconectar](evidencias/baseline-widget-red-restaurada.png).
- [Minutos y sin vagones](evidencias/baseline-widget-minutos-sin-vagones.png).
- [Cambio de ruta tras refrescar](evidencias/baseline-widget-ruta-cambiada.png).
- [Widget y ajustes persistentes tras reiniciar Android](evidencias/baseline-widget-persistencia-reinicio.png).
- [App sin conexión](evidencias/baseline-app-sin-conexion.png) y [restaurada](evidencias/baseline-app-red-restaurada.png).

## Limitaciones observadas, conservadas sin corregir

1. Sin red: el widget muestra «Sin datos» y la app «No hay trenes disponibles». Los logs confirman error de red; el producto no distingue ese error de una respuesta vacía y no conserva últimos trenes.
2. Rutas/ajustes no se refrescan inmediatamente al guardar. El widget conserva el render previo hasta Actualizar/evento del sistema. Se verificó cambio ABA→CAV y vuelta a ABA→MOY, y ajuste clock/vagones→minutes/sin vagones mediante refresco.
3. En esta rejilla, el widget se ofrece como 4×5 aunque config targetCellWidth/Height sean 4. Con seis trenes y vagones aparece recorte en la última fila; con minutos sin vagones las seis filas caben. No se alteró el layout.
4. Tras volver desde configuración del widget, se observó header de la app solapado con la barra de estado en Android 16; la parte inferior de los botones sigue operativa. Un arranque frío/reinicio recupera la posición inicial. No se investigó/corrigió el lifecycle de insets durante esta tarea.
5. El icono efectivo baseline del launcher es el adaptive anterior de Expo, aunque expo.icon apunta a metroBilbaoIcon.png. Este comportamiento real confirma que fase B debe sustituir las capas adaptativas, no solo expo.icon.

Los archivos src/, App.js, index.js, assets originales, app.json, eas.json y package-lock.json permanecen idénticos a main en el baseline. El overlay de pruebas cambia identidad/nombres de distribución y firma; no lógica ni imágenes del widget. Este baseline funcional no afirma equivalencia byte a byte con la release ni con el móvil instalado.
