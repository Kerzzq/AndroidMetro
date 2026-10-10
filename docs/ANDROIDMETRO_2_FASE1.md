# AndroidMetro 2.0 — Fase 1: favoritos y widget de consulta

10 de octubre de 2026. Desarrollo en `C:/Users/W11/AMetro/baseline`, rama `feature/favoritos-widget-fase1`, desde el icono validado `765e2de`. Repositorio principal, aplicación del móvil y firma de distribución conservados. Sin push, publicación, cambios de dependencias ni mapa.

## Arquitectura implementada

La app administra hasta diez favoritos globales: ID estable, códigos de origen/destino, alias opcional de hasta 80 caracteres y orden explícito mediante la posición en el array. Una pantalla reúne creación, edición, intercambio de estaciones, búsqueda sin depender de tildes, reordenación con flechas y eliminación con confirmación. Los botones deshabilitados indican los límites y las operaciones en curso. Los nuevos trayectos y los cambios de estaciones deben obtener una respuesta válida de la API antes de guardarse; una respuesta vacía válida admite guardar, un fallo de conexión conserva el borrador y pide reintentar.

`favoritesModel.js` contiene validación, migración y operaciones puras. `favoritesRepository.js` serializa escrituras en AsyncStorage. El documento `androidmetro_favorites_v1` incluye versión de esquema y revisión. La migración lee `metro_panels_config` o `widget_panels_config`, crea previamente una copia literal `androidmetro_migration_backup_v1` y conserva las claves antiguas. Los paneles incompletos o con códigos desconocidos se preservan para reparar; los trayectos duplicados se consolidan, manteniendo el original en la copia. Un documento nuevo corrupto no se sustituye silenciosamente. Se conserva la configuración previa de vagones/minutos.

Cada widget guarda `favoriteId` y `view` en `androidmetro_widget_<widgetId>_v1`. Cambiar un widget no modifica otro. Editar un favorito conserva su ID; eliminar el seleccionado elige otro favorito disponible. Eliminar el widget limpia solo su selección. Favoritos y preferencias son comunes a todas las instancias.

`MetroWidget.js` presenta una sola ruta y dos vistas: consulta y selector. Cada vista utiliza una colección Android real mediante `ListWidget` 0.20.1. La consulta mapea **todos** los trenes normalizados de la respuesta; no hay `slice`, seis filas fijas ni límite de resultados. El selector mapea todos los favoritos. Las filas disponen de etiquetas de accesibilidad, y la selección usa `clickActionData.favoriteId`. La cabecera abre/cierra el selector; elegir una fila vuelve a la consulta y carga esa ruta. El usuario puede cancelar la selección.

Las horas previstas destacan frente al destino final indicado por la API y los vagones opcionales. Se mantienen los campos `timeRounded`, `direction`, `estimated`, `wagons` y el `time` original. No se supone que la hora represente llegada al destino ni se convierte una fecha sin offset en un instante UTC inventado. La hora de consulta es del cliente al recibir la respuesta, presentada en Europe/Madrid. El modo heredado de minutos se identifica explícitamente como **«min al consultar»**: no es un contador. La hora absoluta permanece siempre visible. Los datos antiguos conservan su fecha de consulta.

`trainService.js` ofrece resultados tipados: éxito, vacío y error de red, timeout, servicio, formato o trayecto inválido. Timeout de diez segundos; deduplicación por ruta de peticiones en curso y reutilización de respuestas durante 2,5 segundos. La caché de éxitos y el último fallo se guardan por origen/destino. Un error puede conservar únicamente datos de **la misma ruta**, con aviso de antigüedad. Al cambiar a una ruta sin caché se muestran carga y, si falla, error sin trenes ajenos.

`widgetRuntime.js` dibuja por ID, compara selección, ruta y revisión tras cada consulta y descarta respuestas tardías. La app sincroniza las instancias después de guardar, borrar, reordenar o cambiar preferencias, y al abrirse. El render de caché y los cambios de vista no realizan una consulta innecesaria. Se mantiene el periodo Android existente de 30 minutos; el refresco manual y el cambio de ruta consultan inmediatamente. No se han añadido servicios permanentes, temporizadores por minuto ni permisos nuevos.

## Viabilidad comprobada y correcciones

Se revisaron las implementaciones locales `CollectionView`, `RNWidgetCollectionService`, `RNWidget`, registro de tareas y configuración. La biblioteca crea un ListView con RemoteViewsService; cada fila se rasteriza. Admite dos colecciones por widget; utilizamos una por vista, sin listas anidadas. Se han probado desplazamiento y pulsaciones de filas en el launcher real del emulador.

Se detectó que el callback `renderWidget` de la pantalla de configuración de 0.20.1 envía a nativo un árbol sin el envoltorio `light/dark` esperado. La selección se guardaba pero el primer dibujo podía mantener la ruta anterior. La configuración utiliza ahora `requestWidgetUpdateById`, que aporta el formato correcto. No se ha parcheado `node_modules` ni actualizado la biblioteca.

La prueba al 150 % detectó un recorte en la hora de consulta. El runtime headless puede mantener una métrica de fuente anterior mientras TextWidget nativo ya utiliza el nuevo tamaño SP. Se reserva espacio para al menos 150 % en cabecera y pie. Las filas toman su altura natural cuando caben en la ventana; solo se impone una altura explícita si la ventana es más corta que la fila estimada, para que la colección no corte su bitmap. Los nombres pueden ocupar dos líneas; el alias del widget se abrevia con elipsis, y se mantiene completo en la app y en su etiqueta accesible. La tipografía no se reduce para encajar trenes.

Tras `force-stop`, Android 15+ cancela los PendingIntent del paquete. Se comprobó el fallo y que abrir la app reconstruye las acciones del widget. Esto difiere de cerrar la pantalla o reiniciar normalmente Android. [Comportamiento documentado por Android](https://developer.android.com/about/versions/15/behavior-changes-all). [Colecciones Android](https://developer.android.com/develop/ui/views/appwidgets/collections).

Se corrigieron nombres erróneos del catálogo manteniendo sus códigos: Areeta, Astrabudua y tres estaciones L3. Se contrastaron con el CSV público de estaciones/accesos y documentación oficial; no se hizo una renombración masiva. [Datos abiertos de estaciones](https://cms.metrobilbao.eus/get/open_data/estaciones/es). La admisión efectiva de cada trayecto sigue comprobándose con la API.

## Entorno y reproducción

Se conserva Expo 55.0.2, React Native 0.83.2, React 19.2, `react-native-android-widget` 0.20.1 y AsyncStorage 2.2.0. `package.json`, `package-lock.json`, `eas.json`, configuración del icono y assets no cambian respecto a la fase B.

Herramientas aisladas: Node 24.19.0, npm 10.9.4, Temurin JDK 17.0.20.1+1, SDK 36, Build Tools 36.0.0, NDK 27.1.12297006, Gradle Wrapper 9.0.0. Emulador 37.2.12, AVD AndroidMetro_API36 Google APIs x86_64, Pixel 6, densidad 420 dpi, 2 GB RAM, Nexus Launcher. No variables Windows permanentes ni instalación global adicional.

Desde el checkout de trabajo, en PowerShell:

```powershell
$env:NODE_ENV = 'production'
.\scripts\compilar-pruebas.ps1
# Solo después de comprobar que se trata del emulador:
& 'C:/Users/W11/AMetro/sdk/platform-tools/adb.exe' -s emulator-5556 install -r .\android\app\build\outputs\apk\release\app-release.apk
```

El script activa herramientas solo para su proceso, evalúa Expo config, exige `com.metrobilbao.widget.pruebas`/versionCode 1 y comprueba el applicationId nativo. Ejecuta Prebuild **sin --clean**, `:app:assembleRelease`, verificación de firma y hash. Usa exclusivamente el keystore aislado de pruebas existente. La variante Gradle release empaqueta Hermes y es autónoma; no representa una firma de distribución.

Pruebas reproducibles sin Android, usando el Node local del entorno:

```powershell
node scripts/test-fase1.cjs
node scripts/test-persistence-api.cjs
node scripts/test-widget-races.cjs
```

Estas pruebas usan datos **simulados**, fuera del comportamiento de la app: migración literal, datos incompletos, duplicados, límite diez, orden, selección por instancia, recarga de almacenamiento, escrituras concurrentes, caché, errores HTTP/red/formato/timeout, lista vacía, deduplicación y 24 trenes sin recorte. Una respuesta tardía de A después de seleccionar B no aparece bajo la cabecera de B. Todas pasan. Las comprobaciones Android usan datos reales de la API salvo donde se indique lo contrario.

## APK y puntos de recuperación

APK nuevo: `C:/Users/W11/AMetro/artifacts/androidmetro-2-fase1-test.apk`.

- 62.817.128 bytes; SHA-256 `f736c922ffa2bce4f442cf3b85adb94f9340f0e93ea0835bb62b04e39ac3754e`.
- ID `com.metrobilbao.widget.pruebas`, versionName 1.0.0 / versionCode 1, minSdk 24, target/compile 36.
- Certificado SHA-256 `5822756d7982c9c612d283f007d55f08e62b7a4224cc9b5b9409b1297891026d`, idéntico al certificado exclusivo de pruebas del baseline y fase B; verificación v2 correcta.
- Bundle Hermes integrado: 1.087.248 bytes. Icono minimalista conservado; los 196 recursos raster Android tienen un multiconjunto de hashes idéntico al APK de fase B (los nombres dentro del APK están optimizados).
- El APK de baseline y el APK del icono permanecen en artifacts, sin sustitución.
- Tags locales de recuperación: `recuperacion-baseline-validado` (9fab92b), `recuperacion-icono-validado` (765e2de).
- Commits: 73086ae (modelo, migración y API), 8b08d5f (app y widget), 34b9ee7 (correcciones nativas, accesibilidad y robustez), 699f40c (altura natural de filas). La documentación/evidencias se añaden en otro commit consultable con `git log`.

## Validación Android

| Comprobación | Resultado y evidencia |
|---|---|
| Migración de los cuatro paneles | Cuatro favoritos conservados después de actualizar el APK de fase B sin borrar datos; captura inicial 01. Copia literal y paneles incompletos comprobados además en pruebas simuladas. |
| Crear hasta diez | Se crearon seis trayectos adicionales con API real; al llegar a diez, Añadir se deshabilita. Capturas 08 y 58. |
| Editar y ordenar | Alias largo guardado y favorito movido con flechas; Barakaldo/Ansio cambiado a Barakaldo/Moyua con API real. Capturas 07 y 38. |
| Duplicados y eliminación | Trayecto duplicado bloqueado; cancelar conserva la entrada; confirmar elimina y libera capacidad. Capturas 09 y 10. |
| Selector dentro del widget | Abrir y elegir cambia la ruta sin abrir app; indicador de selección y cierre sin cambios. Desplazamiento hasta el décimo favorito, captura 48. |
| Lista completa de trenes | Ocho filas reales distintas recorridas dentro del widget; última salida 11:21 con consulta 10:05, sin límite de seis ni recorte de la respuesta. Datos observados en esa consulta, no garantía de horario futuro. |
| Cambio de ruta | Cabecera y filas del nuevo trayecto; estado de carga y rechazo de respuestas tardías comprobado además con una prueba simulada. |
| Cambios desde la app | Editar el favorito activo STZ/ANS a STZ/MOY actualiza automáticamente widget4; widget2 conserva CAV/SIN. Captura 56. |
| Preferencias | Activar vagones y desactivar minutos se refleja sin refresco. Capturas 59 y 60. |
| Sin conexión con caché | Wi-Fi y datos desactivados en emulador: error y aviso «datos anteriores», conservando solo la ruta consultada. Captura 18. |
| Sin conexión sin caché | Seleccionar CAV/SIN sin caché: error y ninguna fila de otra ruta. Captura 19. |
| Recuperación y refresco | Restaurar conexión y pulsar refresco obtiene trenes reales de CAV/SIN. Captura 20. |
| Varias instancias | ID2 CAV/SIN e ID4 STZ/MOY tienen selecciones independientes; ambas restauradas después de reiniciar Android antes de abrir app o refrescar. Capturas 55–58. |
| Persistencia | Cierre/reapertura y reinicio real conservan diez favoritos, alias, orden y selección por widget. Capturas 11 y 58. |
| Texto 100 % / 150 % | App, editor, selector y consulta revisados; recorte del pie detectado y corregido. Capturas 36, 37, 42, 43 y finales 65–73, con ambos tamaños y alias largo. Escala restaurada a 100 %. |
| Tamaños reales | Compacto de 3×4 celdas, aproximadamente 266×464 dp, y ampliado 4×5, aproximadamente 360×584 dp. El launcher probado no aceptó el intento de reducir más la altura; no se afirma una prueba real a 280 dp. |
| Arranque autónomo | Instalación APK, app y consulta headless con proceso de app cerrado y sin listener Metro en 8081; bundle incluido. |
| Icono minimalista | Visible en el launcher y recursos raster idénticos por contenido al APK de fase B. |
| Vacío válido, HTTP 500, formato, timeout | Pruebas simuladas del servicio; no se provocó un HTTP 500 en el proveedor ni se presentó una simulación como datos reales del widget. |

El registro completo es [resultados-ui.json](evidencias/fase1/resultados-ui.json). La [galería y guía de repetición](CAPTURAS_FASE1.md) incluye comparativa con fase B y capturas reales de la entrega. Hay capturas y árboles uiautomator originales en `C:/Users/W11/AMetro/evidencias/fase1`, incluidas trazas de intentos fallidos. No se utilizan como evidencia positiva las capturas 13 (acciones canceladas tras force-stop), 28/29 (primer dibujo inicial incorrecto), ni los intentos de navegación por coordenadas que no cambiaron de página. Se repitieron las comprobaciones después de corregir los problemas.

## Límites y pruebas posteriores

No se ha probado en el móvil físico ni en otros launchers/versiones de Android. Tampoco se han medido consumos de batería durante días ni entrega del evento periódico bajo Doze; el periodo de 30 minutos no garantiza puntualidad. No se ha cambiado esta política para forzar actualizaciones frecuentes. Pantallas con fuentes superiores al 150 %, otros anchos/densidades, TalkBack completo y listas API mucho mayores de las ocho filas observadas requieren ampliar la matriz. El modelo se ha probado con 24 trenes, pero esa prueba es simulada y no demuestra el rendimiento de todas las listas posibles en Android.

Una caché offline puede contener salidas ya pasadas: se conserva para informar, con aviso y fecha de consulta. No se recalculan tiempos relativos ni se ocultan trenes aplicando timestamps supuestos. Las preferencias cambiadas durante QA pertenecen exclusivamente a la app de pruebas. No se han obtenido ni usado credenciales EAS o keystores de publicación; una futura distribución requiere revisar firma, versionCode y autorización de publicación por separado.

No hay decisiones funcionales nuevas necesarias para utilizar esta fase. Antes de una siguiente entrega conviene decidir la política de actualización automática y si se quiere permitir guardar borradores de rutas nuevas sin conexión; actualmente se conserva el borrador abierto pero no se admite como favorito validado hasta consultar la API.

## Archivos principales modificados

App: `src/screens/ConfigScreen.js` y correcciones de nombres en `src/data/stations.js`. Dominio: `src/domain/favoritesModel.js`, `src/domain/trainModel.js`. Persistencia/API: `src/services/favoritesRepository.js`, `src/services/trainService.js`. Widget: `src/widgets/MetroWidget.js`, `src/widgets/widgetRuntime.js`, `src/widgets/widgetTaskHandler.js`. Configuración: descripción y tamaño mínimo del widget en `app.json`. Pruebas: los tres scripts `test-*.cjs` de esta fase. Documentación y capturas bajo `docs/`.

No se cambian `App.js`, `index.js`, `package.json`, lockfile, `eas.json`, assets o capas del icono respecto a fase B. Android generado permanece excluido de Git; Prebuild aplica el mismo plugin existente y el script impone el ID y la firma de pruebas. Los puntos de recuperación conservan las fases anteriores completas.
