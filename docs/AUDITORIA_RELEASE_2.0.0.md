# Auditoría de preparación AndroidMetro 2.0.0

Fecha: 15-10-2026, Europe/Madrid. **Preparación en curso; publicación NO autorizada ni validada.**

## Alcance y trazabilidad inicial (antes de corregir código)

Rama local `release/androidmetro-2.0.0`, creada desde `fix/mapa-gestos-safe-area`, commit `c3902150430a387cd2a977c51c790f05f042f41e`. Consulta directa `git ls-remote` confirma esa base y `main=339def20985e0fc2f2493ed593836472c96240b5`. No se cambia main, tags, releases ni el worktree de desarrollo. No se añade mapa al widget ni funcionalidad nueva.

Evidencia técnica local fuera de Git: `../auditoria/release-2.0.0/`. Incluye salida JSON completa de npm audit, inventario GitHub y escaneo de historial. No almacenar allí credenciales de producción ni transcripciones de su descarga.

## Hallazgos iniciales y clasificación contextual

| ID | Severidad real / naturaleza | Evidencia y explotabilidad | Acción prevista |
|---|---|---|---|
| R01 | Bloqueante de distribución | Falta recuperar clave original. El keystore identificado en AMetro/signing es exclusivamente de pruebas; Expo no tenía sesión autenticada. Sin clave no se puede demostrar actualización conservando instalación/datos. | Recuperar credenciales EAS existentes; nunca generar ni reemplazar clave automáticamente. |
| R02 | Alta de distribución, no ataque remoto | El Gradle generado por Expo usa `signingConfigs.debug` también para release. El script existente es sólo para `.pruebas`. Copiar ese proceso a producción produciría una firma incorrecta. | Proceso oficial separado que falle si falta clave/certificado/versión; no usar script de pruebas. |
| S01 | Media, confidencialidad local | `react-native-android-widget@0.20.1` exporta RNWidgetImageProvider sin permiso. Permite leer PNG de `files/widget_images` a otra aplicación si conoce/adivina nombre; contienen la representación de los widgets (trayectos/alias). Lectura, no escritura; no se ha demostrado acceso a AsyncStorage ni clave. `openFile` usa comprobación de prefijo canónico sin separador: requiere además estudiar posibles carpetas hermanas. | Restringir acceso público y conservar concesiones URI para el host, con prueba real antes de aceptar. |
| S02 | Baja, superficie innecesaria | Manifest generado solicita almacenamiento externo lectura/escritura (hasta API32), overlay y vibración; la app no usa esas capacidades. No se encontró petición runtime de esos permisos. | Excluir permisos desde configuración Expo y verificar manifest fusionado. |
| Q01 | Baja, disponibilidad local | `loadSettings()` acepta JSON `null` y después accede a sus campos. Preferencias malformadas pueden impedir cargar home/widget aun cuando favoritos están intactos. | Recuperar valores por defecto sin sobrescribir preferencias originales; prueba de regresión. |
| Q02 | Baja, validación | `routeProblem` consulta propiedades heredadas del objeto de estaciones, y HH:MM acepta 99:99. La UI normal no genera rutas así; requiere datos locales alterados o proveedor que devuelva datos incorrectos. | Validaciones pequeñas con pruebas, sin modificar códigos ni favoritos. |
| Q03 | Baja, carrera asíncrona | `refreshWidget` comprueba generación tras red, pero no tras cargar snapshot ni antes de pintar las ramas sin red; una carga antigua puede sobrescribir un selector más reciente. | Reproducir con promesas controladas y corregir sólo si se confirma. |
| S03 | Baja / defensa en profundidad | HTTPS fijo; Android moderno bloquea cleartext por defecto, pero falta declarar la política explícitamente. No hay WebView, eval remoto, pinning custom ni claves API en el código de app. | Política explícita de red; mantener TLS estándar de plataforma. |
| Q04 | Baja, entrada Android local | WidgetConfigurationActivity es exportada por necesidad del launcher. La implementación de librería no valida providerInfo nulo antes de dereferenciar; intents con ID inexistente pueden cerrar la pantalla con excepción. No demuestra acceso a datos. | Validación acotada de ID/proveedor en clase generada si se puede probar con seguridad. |
| D01 | Pendiente de verificación de empaquetado | npm audit: 44 paquetes señalados (1 crítico, 31 altos, 11 moderados, 1 bajo). npm marca todo como prod porque Expo/RN incluyen tooling en dependencies. Eso NO demuestra que todos esos paquetes se ejecuten en Android. | Clasificar rutas, revisar bundle y no ejecutar fix --force ni actualizar frameworks. |
| P01 | Media de distribución/documentación | README sólo contiene título; no explica instalación, independencia del operador, fuentes/licencias ni firma. ConfigScreen contiene instrucciones fijas de widget «(pruebas)». | Documentación de usuario y corregir texto para distribución oficial. |

## Dependencias y cadena de suministro

`npm ci --ignore-scripts --no-audit --no-fund` reproduce 584 paquetes, sin cambiar lockfile. npm 10.9.4, Node 24.19.0. Se han leído los avisos vigentes del registro, no sólo una salida antigua.

- `shell-quote@1.8.3`: aviso crítico GHSA-w7jw-789q-3m8p, inyección al entrecomillar objetos `.op` controlados por atacante y ejecutar resultado en shell. La app no ejecuta shells ni recibe esos objetos. Inspeccionar uso por tooling; no clasificar automáticamente como RCE del APK. También presenta aviso de complejidad en parse.
- `ws@7.5.10/8.19.0`: avisos de memoria/disponibilidad del servidor Node; Expo/Metro usan esos servidores durante desarrollo. El cliente WebSocket de RN es implementación nativa distinta. No exponer Metro a redes no confiables.
- Babel/PostCSS/source maps, XML/xcode, glob/braces, Jest, browserslist, image-size, YAML, node-forge y restantes avisos se deben evaluar por ruta de ejecución y entrada. Node-forge localizado en la firma iOS de Expo CLI; no es la verificación TLS de Android.
- npm sugiere RN 0.88.0 para varios avisos transitivos; sería cambio mayor y no se aplica. No se han ejecutado actualizaciones masivas ni npm audit fix.
- Lockfile fija integridades npm. Aún faltan informe del grafo Maven efectivo, comprobación de advisories nativos y verificación del bundle candidato. El wrapper inicial usa HTTPS y validación URL, pero no checksum explícito de distribución. No afirmar reproducibilidad bit a bit de APK sólo por existir lockfile.

Fuentes: [shell-quote, aviso y precondiciones](https://github.com/advisories/GHSA-w7jw-789q-3m8p), [ws](https://github.com/advisories/GHSA-58qx-3vcg-4xpx), [PendingIntents Android](https://developer.android.com/privacy-and-security/risks/pending-intent), [credenciales Expo](https://docs.expo.dev/app-signing/app-credentials/).

## Firma original comprobada

APK histórico local `../auditoria/artefactos/metroBilbao-release-apk.apk`:

- SHA-256 `f2e28a2a001fd4d1c3ca86ce42e4fc9442acc9ecd8b6a78cc1b37f97770310bc`, coincide con digest del asset `metroBilbao.apk` publicado en release `apk` por API GitHub.
- `apksigner verify --verbose --print-certs`: verifica esquema v2, un firmante RSA 2048.
- Certificado SHA-256 `91bc77ae484bc3ff3408f13950894e4ed7a3d49674a20f7a634b798747e026c0`.
- Package `com.metrobilbao.widget`, versionName `1.0.0`, versionCode `1`, minSdk24, targetSdk36, cuatro ABI.
- `assets/app.config` contiene proyecto EAS `990b536c-ce8d-4a17-82f6-412aeee0e317`. Es un identificador público, no un secreto ni prueba suficiente de cómo se firmó.

La verificación del certificado público NO significa haber recuperado su clave privada. Login Expo solicitado al propietario por navegador oficial, sin contraseñas en el chat.

## Secretos, almacenamiento y componentes

Escaneo de 707 objetos alcanzables por refs Git locales: 559 blobs, 336 de texto. Cero nombres de keystore/credentials/.env y cero coincidencias de patrones de claves privadas, tokens GitHub/AWS/Expo y literales de credenciales. Se revisan también scripts y logs versionados. Scanner propio emite sólo ubicación/regla, nunca valores. No cubre objetos inalcanzables, credenciales codificadas ni cachés externas: no demuestra ausencia universal de secretos.

APK histórico: se localizan config pública y bundle Hermes; sin entradas con extensiones de claves/keystores/credenciales/source maps en la búsqueda por nombres. Inspección de contenido y APK candidato pendientes. Contraseña `android` en script de pruebas es contraseña pública de desarrollo, no credencial oficial. `.gitignore` ya excluye APK/AAB, keystores, .env, node_modules y Android generado; revisar también credentials.json y copias auxiliares antes de guardar credenciales.

AsyncStorage no cifra favoritos, nombres ni cachés; están en almacenamiento privado de app, no almacenamiento compartido. No se guardan cuentas, ubicación GPS ni pagos. `allowBackup=true`: preservar restauración del usuario y documentar que puede incluir alias/trayectos. No desactivar backups silenciosamente justo antes de release. Legacy se copia literalmente antes de migrar y no se borra; documentos con esquema desconocido se rechazan conservando el original. No existen migraciones destructivas identificadas.

Receiver de widget no exportado, intents de clic explícitos. PendingIntents mutables limitados a componentes explícitos; las plantillas de listas necesitan mutabilidad para fill-in. Lanzador/host es frontera de confianza y puede modificar extras del token que recibe. IDs de favoritos se reconcilian contra documento; no se envían rutas arbitrarias directamente desde extras a fetch. Servicios WorkManager/RemoteViews y receptores de sistema requieren revisar manifest fusionado y permisos de firma. Actividades exportadas MAIN/configuración son necesarias; sin deep links declarados. No ocultar proveedor exportado entre componentes protegidos por permisos del sistema.

## Calidad, rendimiento y producto

Arquitectura pequeña separa dominio (favoritos, trenes, mapa/cámara), repositorio serializado, servicio deduplicado y controladores UI. Home no necesita widgets. Máximo diez favoritos, lista de trenes no recortada, selección por widget ID. Mapa nativo L1/L2 con 42 estaciones, incluye Deusto y Eliptikoa, 41 aristas; `test-map` recorre 1722 pares. Reanimated lleva transformaciones en hilo UI; SVG memoizado, sin consultas por cada gesto. No trasladar mapa al widget.

Riesgos razonables / mejoras opcionales: colores/routeName/botones y estilos duplicados entre pantallas; código comprimido en mapa/configuración dificulta mantenimiento; algunas importaciones, recursos de iconos anteriores y fichero vacío `npx` parecen residuales; prototipo navegador y capturas son material de desarrollo, no funcionalidad APK. Sin refactorización estética ni borrado masivo. Repositorio serializa en un runtime JS; no equivale a transacciones multiproceso. Cachés por ruta y `recent` no tienen política explícita de poda (universo de estaciones finito, posible crecimiento prolongado). No añadir TTL que oculte caché offline sin diseñarlo. Detail usa timer de edad mientras está montado, incluso app en segundo plano; no hace polling de red pero se puede mejorar posteriormente.

Consultas tienen timeout10s, deduplicación por ruta y ventana2.5s; home limita a tres en paralelo y cancela actualizaciones de generaciones antiguas, no necesariamente conexiones ya iniciadas. Widget periodo30min, no bucle por minuto; resize sin consulta; draw puede rasterizar toda la lista: validar tamaños/lista completa y batería con evidencia real, no asumir coste cero. Datos antiguos llevan fecha y aviso; dirección anunciada no promete tren directo. API inválida/error conserva sólo caché de la misma ruta; vacío válido limpia lista.

Accesibilidad: botones de al menos48dp, etiquetas, búsqueda por nombre que evita depender del SVG, lista nativa para objetivos ambiguos. SafeScreen aplica insets reales en mapa/modales. Home/gestor usan padding fijo de StatusBar heredado: riesgo residual de adaptación en landscape/insets extremos, a validar. Etiquetas de acciones de orden usan IDs internos, mejorables. No hay auditoría TalkBack completa ni dispositivos reales de terceros en esta preparación todavía. minSdk24 implica Android7+; probar antiguo y API36 y revisar soporte de bibliotecas, no prometer todas las versiones por compilar.

## Recursos y licencias

La geometría del mapa es propia según fuentes/proveniencia versionadas; no se incorporó plano raster oficial ni SVG de Wikimedia. Investigación legal previa registrada en `prototypes/mapa-interactivo/sources/legal-evidence.json`; volver a contrastar condiciones vigentes antes de distribuir. No equiparar Open Data a permiso de reutilizar logos/planos. Icono minimalista aportado por el propietario con generación/transformación documentada; no se ha verificado por contrato una cesión de derechos de terceros. Revisar splash e iconos antiguos efectivos para no redistribuir logos ajenos inadvertidamente.

Falta inventario de licencias/transitivas y avisos aplicables al binario. No añadir licencia del proyecto a nombre del propietario sin su decisión. Presentar AndroidMetro como app independiente no oficial, atribuir información de Metro Bilbao y aclarar limitaciones de horarios/mapa. La revisión es técnica/documental, no dictamen jurídico.

## Pruebas iniciales

Siete suites `scripts/test-*.cjs` pasan sobre código de base: favoritos/migración, persistencia/API simulada, consultas/concurrencia, widget race conocida, mapa/topología, consultas de mapa, pinch/cámara. Esto incluye errores HTTP500/red/timeout/formato, vacío,24 filas,10favoritos y reinicio de módulo simulado. No sustituye actualización real en Android.

`expo config` y `expo prebuild --platform android --no-install` sin ANDROIDMETRO_TEST pasan; generan paquete original1.0.0 porque aún no se han fijado metadatos oficiales. Avisos de edge-to-edge y expo-system-ui heredados. Validación del prototipo navegador intentada: Edge no arranca dentro de sandbox; no contabilizada como aprobada ni como fallo de app. Sus archivos de resultados se restauraron a la base tras el intento.

## Inventario remoto para futura retirada (sin borrar tags)

API GitHub y ls-remote consultados el15-10-2026:

| ID release | Tag temporal | Commit | Asset APK |
|---|---|---|---|
|409023620|androidmetro-2.0-mapa-interactivo-pruebas|96c1084af4e46408ad855dbd4a25bd3e9f7bcb69|androidmetro-mapa-android-test.apk|
|411827626|androidmetro-2.0-fase2b-fix1-pruebas|c3902150430a387cd2a977c51c790f05f042f41e|androidmetro-mapa-fix-test.apk|
|408820497|androidmetro-2.0-fase1-pruebas|e61da22cca1fc9f3e9ed3656b3d8586ac7442e1b|androidmetro-2-fase1-test.apk|
|408853799|androidmetro-2.0-app-consulta-pruebas|8bd08d8c902ca90020587dd602e30f15ac902bfc|androidmetro-app-consulta-test.apk|

Conservar release histórica `apk` ID290996482 y su APK. No retirar ninguna hasta publicar y verificar oficial con aprobación. Conservar ramas/commits/tags y APK locales. Fuente: [releases públicas](https://github.com/Kerzzq/AndroidMetro/releases).

## Puertas pendientes

1. Autenticación, clave original y mayor versionCode registrado EAS; verificar certificado privado contra APK histórico sin revelar secretos.
2. Corregir hallazgos pequeños con regresiones y mantener informe de cambios separado de este estado inicial.
3. APK candidato oficial: package, versión/código definitivo, firma, SHA256, manifest fusionado, bundle autónomo y revisión de secretos.
4. Emulador controlado: instalar APK histórico, configurar rutas/widget, actualizar sin desinstalar ni limpiar datos, comprobar migración/reinicio/red/widgets independientes/mapa y regresiones de gestos/insets.
5. Entrega previa completa y aprobación explícita antes de integrar main/publicar/retirar pruebas. Si falta firma o actualización real, NO publicar.
