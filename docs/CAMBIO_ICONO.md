# Cambio del icono del lanzador AndroidMetro

Fecha: 8 de octubre de 2026. Fase B ejecutada después de validar la fase A y conservar el baseline en el commit `9fab92b`. Variante independiente `com.metrobilbao.widget.pruebas`, versionCode 1 y firma exclusiva de pruebas. No se ha publicado ni modificado la instalación del móvil principal.

## Verificado: diseño y recursos

Se utiliza el diseño minimalista aprobado de `icono_nuevo/androidmetro_icon_minimal_512.png`. La copia en Git conserva exactamente sus 92.094 bytes y SHA-256 `d6aca7b9d72be5ce852bd29011db38dcc83206ca91e5bb4a6cc2b76d18b4a54b`. No se usa el diseño futurista ni el original pesado de 1254 píxeles.

| Archivo | Dimensiones / bytes | Uso |
| --- | --- | --- |
| assets/androidmetro-icon-minimal-512.png | 512×512 / 92.094 | PNG aprobado; expo.icon y android.icon |
| assets/androidmetro-icon-foreground.png | 512×512 RGBA / 53.171 | Dibujo extraído, transparencia y margen adaptativo |
| assets/androidmetro-icon-monochrome.png | 512×512 RGBA / 16.551 | Silueta con huecos para iconos temáticos |
| scripts/preparar-icono.py | Código Python | Extracción determinista y prototipo de máscaras/tamaños |
| app.json | Configuración Expo | Referencias anteriores y adaptiveIcon con fondo #011228 |

El usuario autorizó explícitamente la extracción determinista con Python/Pillow. Se conservaron los RGB del PNG fuente antes del escalado; no se redibujó el logo. El script distingue los trazos claros/cian/grises del fondo, conserva el interior oscuro del tren y extrae tren, reloj, lista y raíles. La capa monocroma reutiliza esas formas, deja hueco en el parabrisas y uniformiza el alpha de las traviesas para evitar ruido de textura al aplicar un único tinte. El fondo adaptativo es azul marino sólido #011228, próximo al centro del original; no contiene un cuadrado con esquinas redondeadas.

El dibujo se escala al 60 % en un lienzo de 512 píxeles y se centra respecto a (264,273) de la fuente. Su radio máximo antes del antialias es 150,88 píxeles, inferior a los 156,44 correspondientes al círculo seguro de 66 dp en una capa de 108 dp. El prototipo muestra el viewport central de 72 dp, máscaras circular/redondeada y tamaños de 48, 72 y 96 píxeles sobre fondos claros/oscuros. [Guía oficial Android](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive).

Se comprobó el plugin instalado de Expo SDK 55, `@expo/prebuild-config/build/plugins/icons/withAndroidIcons.js`: cuando existe foregroundImage lo usa también para componer los iconos legacy/round. Por ello cambiar solo expo.icon/android.icon no bastaba. Se eliminó backgroundImage de la configuración adaptativa; el XML utiliza @color/iconBackground, foreground y monochrome. [Configuración Expo SDK 55](https://docs.expo.dev/versions/v55.0.0/config/app/).

## Generación nativa y compilación

Expo Prebuild se ejecutó sin --clean y regeneró mipmap-mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi: ic_launcher.webp, ic_launcher_round.webp, ic_launcher_foreground.webp e ic_launcher_monochrome.webp, y los dos XML mipmap-anydpi-v26. Eliminó las cinco imágenes antiguas ic_launcher_background.webp y cambió únicamente iconBackground en values/colors.xml. Auditoría por hash antes/después: 28 recursos anteriores cambiados o eliminados; manifest, Kotlin, clases del widget, layouts, Gradle y arquitectura conservados.

El APK definitivo contiene un bundle Hermes **idéntico byte a byte al del baseline**, SHA-256 `b9d73c39464e1ec4b286ceb4836c9f36849e17e0b27591de2f839d84d2af9540`, 1.075.440 bytes. También permanecen idénticos a main src/, App.js, index.js, package.json, package-lock.json, eas.json y todos los assets originales. Los iconos antiguos siguen conservados en Git pero no se referencian como capas del lanzador.

```powershell
Set-Location C:\Users\W11\AMetro\baseline
. .\scripts\activar-entorno.ps1
# Solo si se desea regenerar las capas; Python/Pillow disponibles en el runtime privado de Codex.
& C:\Users\W11\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe .\scripts\preparar-icono.py
& .\scripts\compilar-pruebas.ps1
Copy-Item .\android\app\build\outputs\apk\release\app-release.apk C:\Users\W11\AMetro\artifacts\androidmetro-icono-minimal-test.apk
& C:\Users\W11\AMetro\sdk\platform-tools\adb.exe -s emulator-5556 install -r C:\Users\W11\AMetro\artifacts\androidmetro-icono-minimal-test.apk
```

Pillow usado: 12.3.0 del runtime privado existente; no se instaló globalmente ni se añadió a las dependencias de la app. Las capas finales están versionadas, por lo que compilar no requiere Python. Gradle final: BUILD SUCCESSFUL in 28s, 29 tareas ejecutadas / 334 al día. apksigner 36.0.0 verificó firma v2 válida; el nombre Gradle release corresponde a empaquetado autónomo con firma **de pruebas**, no publicación.

APK: `C:\Users\W11\AMetro\artifacts\androidmetro-icono-minimal-test.apk`, 62.805.332 bytes, SHA-256 `c6165b5539db51d980505207efc41e71e9f294f1cb2075122f61ca30a651ab20`. Certificado de pruebas SHA-256 `5822756d7982c9c612d283f007d55f08e62b7a4224cc9b5b9409b1297891026d`. Mismo ID/clave de pruebas que baseline, versionName 1.0.0/versionCode 1, minSdk 24, target/compile 36 y cuatro ABI. Diferente APK del baseline, que permanece conservado.

## Pruebas y evidencia visual

Emulador Pixel 6/API 36, Nexus Launcher, siempre con selector ADB emulator-5556. Se actualizó la variante de pruebas con install -r sin desinstalar ni borrar datos.

- [Prototipo de máscaras, fondos y tamaños pequeños](evidencias/icono-prototipo-mascaras.png).
- [Acceso directo real, colores normales y fondo oscuro](evidencias/icono-home-acceso-directo.png).
- [Cajón real con fondo claro](evidencias/icono-cajon-normal.png).
- [Iconos temáticos, modo claro](evidencias/icono-home-tematico-claro.png) y [modo oscuro](evidencias/icono-home-tematico-oscuro.png).
- [Widget real tras actualizar el APK](evidencias/icono-widget-tras-actualizar-apk.png) y [refresco con trenes reales](evidencias/icono-widget-refresco.png).
- [App con rutas y datos conservados](evidencias/icono-app-arranque-frio.png) y [preferencias conservadas](evidencias/icono-ajustes-conservados.png).

El acceso directo y el cajón muestran el tren/reloj/cian elegido, completo y sin el símbolo Expo ni doble redondeo. El launcher coloca un aro propio en sus sugerencias del dock: se verificó también un acceso directo creado desde el cajón, sin ese aro. El interruptor Themed icons se activó desde Wallpaper & style; la silueta propia aparece con el tinte del sistema en ambos modos. El cajón mantiene iconos en color en este launcher, incluso con los iconos temáticos activados en inicio.

Las cuatro rutas ABA→MOY, MOY→ABA, CAV→SIN, BAR→ANS y preferencias minutos/sin vagones persisten tras actualizar. El appWidgetId=2 y su host se mantienen; el widget conserva su imagen/interfaz anterior y refresca datos del servicio real. Arranque frío observado: COLD, 313 ms, con Metro apagado. Las limitaciones preexistentes del baseline siguen documentadas en BASELINE_FUNCIONAL.md; no se alteró lógica/UI para corregirlas.

## Hipótesis y pendientes

La adaptación mantiene calidad visual comparable al PNG aprobado en las máscaras y tamaños inspeccionados; eso no demuestra comportamiento en todos los launchers OEM. Pendientes: dispositivo físico/otros launchers, Android 7 legacy, Doze prolongado y ciclo completo de refresco de 30 minutos. No se afirma equivalencia del baseline con el APK del móvil principal.

Para un APK final de distribución, primero confirmar cuenta/acceso EAS, keystore original y versionCode remoto superior al instalado. Después, usar el perfil preview ya auditado o un flujo local de firma original confirmado, con configuración normal (sin ANDROIDMETRO_TEST=1). Los comandos aquí producen exclusivamente la app independiente de pruebas. No usar su clave para actualizar la app funcional ni ejecutar compilación/firmado de producción hasta confirmar esos datos. No se han realizado login EAS, push, publicación ni releases.


La primera extracción con imagegen se descartó por ruido en los bordes y alteración del dibujo. No se integró ninguna imagen generada por IA. El resultado descartado permanece únicamente en el directorio generated_images de Codex; las capas definitivas proceden del PNG aprobado mediante el script determinista autorizado.
