# AndroidMetro 2.0.0 — entrega previa a publicación

Auditoría del 15-10-2026. **No se ha autorizado ni realizado publicación, integración en main o retirada de releases.** Este informe sustituye el estado provisional de los informes iniciales; se conservan como registro de lo observado antes de corregir.

## Candidato e identidad

| Dato | Resultado |
|---|---|
| Rama local | `release/androidmetro-2.0.0`, desde `fix/mapa-gestos-safe-area` / `c3902150430a387cd2a977c51c790f05f042f41e` |
| Commit de aplicación compilado | `bae3c09bd634b93c2c13cdcdfea2eabb34f91c86` |
| Archivo local, fuera de Git | `../auditoria/release-2.0.0/AndroidMetro-2.0.0-rc2.apk` |
| Nombre / paquete | AndroidMetro 2.0.0 / `com.metrobilbao.widget` |
| versionName / versionCode | `2.0.0` / `2` |
| Tamaño | 79 717 800 bytes |
| SHA-256 APK | `3c99de40d3644961fa1c413ea5e07584d8266e8cecb1c67e8739a38dba6486b9` |
| SHA-256 certificado | `91bc77ae484bc3ff3408f13950894e4ed7a3d49674a20f7a634b798747e026c0` |
| Verificación | apksigner v2/v3, ZIP alineado a 16 KB, release no debuggable; minSdk 24, targetSdk 36, cuatro ABI |

Se conserva el primer candidato local para recuperación; queda sustituido por rc2, que añade la corrección de red en Android 7. No se ha usado `ANDROIDMETRO_TEST=1`, identificador `.pruebas`, firma temporal o servidor Metro para ejecutar el candidato. El bundle Hermes está dentro del APK y coincide byte a byte con el generado por la compilación. Los avisos de terceros también coinciden con el archivo versionado. No se incluyen keystores, credenciales, source maps ni herramientas de prueba en el APK.

Los commits posteriores de entrega sólo pueden cambiar documentación o herramientas de comprobación; antes de integrar debe verificarse que el código/configuración de aplicación sigue idéntico al commit compilado. No se promete una reconstrucción binaria idéntica sin controlar además las herramientas, tiempos y firma.

## Firma original y actualización

`eas whoami` reconoció la cuenta `kerzzq` después del acceso oficial por navegador. Se comprobó acceso a `@kerzzq/metro-bilbao`, proyecto `990b536c-ce8d-4a17-82f6-412aeee0e317`. Se inspeccionó y recuperó la credencial Android existente cuyo certificado coincide con el anterior. **No se creó ni sustituyó ninguna credencial de producción.** Material privado fuera del repositorio, con ACL restringida al usuario; no se incorporan contraseñas, tokens o keystores a estos informes.

EAS devuelve mayor versionCode oficial **1**; las tres compilaciones históricas consultadas registran 1.0.0/1 (una completada y dos con error). Se fija 2, y `appVersionSource=local` evita que el candidato dependa de otro valor remoto. No se modifica el contador EAS. La compilación histórica completada es `eb29ac67-ff03-4e1d-aa2a-013531443451`, 26-02-2026. Su artefacto EAS ya no ofrece URL HTTPS recuperable: no se demuestra identidad binaria con ese archivo desaparecido. Sí se demuestra identidad del APK histórico publicado en GitHub, certificado y capacidad de actualizarlo.

APK histórico `metroBilbao-release-apk.apk`: SHA-256 `f2e28a2a001fd4d1c3ca86ce42e4fc9442acc9ecd8b6a78cc1b37f97770310bc`, igual al digest del asset estable `metroBilbao.apk`; paquete oficial, versión 1.0.0/código 1 y certificado original verificados con apksigner.

**Ensayo directo del rc2, emulator-5562, Android 16/API 36:**

1. Instalar APK histórico, configurar Abando→Moyua desde UI y añadir widget original ID 2; comprobar trenes reales.
2. Ejecutar `adb install -r` del rc2, sin desinstalar, limpiar datos o inyectar preferencias.
3. Comprobar appId 10216 y firstInstallTime `2026-10-15 16:56:38` sin cambios; versionCode 1→2 y versionName 1.0.0→2.0.0. El SHA-256 del APK instalado coincide con rc2.
4. Home conserva el trayecto, consulta ocho trenes reales y el mismo widget ID 2 se transforma y funciona.
5. Reiniciar: trayecto y widget persisten. El primer trabajo anterior a disponer de red conserva caché con aviso; refrescar devuelve datos actuales.

Resultado automático registrado en `final-update/verified-update.json`, con dumps de paquete/widgets antes y después y capturas. Ensayo adicional en Android 7/API 24 conservó ruta y preferencias antiguas (vagones desactivados y minutos activados). Otro emulador conserva diez favoritos, alias y widgets oficiales IDs 6/7 con selección independiente tras actualizar y reiniciar. **No se ha modificado el móvil físico.**

## Hallazgos, correcciones y riesgos restantes

La severidad contextual describe el impacto y las precondiciones observadas en esta aplicación. Un aviso alto de una librería no equivale automáticamente a un ataque alto contra el APK.

| ID | Severidad contextual | Resultado y explotabilidad |
|---|---|---|
| R01 | Bloqueante de distribución, cerrado | Recuperada clave original; certificado y actualización directa comprobados. |
| R02 | Alta de distribución, corregida | La plantilla Gradle firmaba release con debug. Producción queda sin firma implícita; el proceso local firma expresamente y rechaza certificado/identidad incorrectos. |
| S01 | **Media, lectura local confirmada; corregida** | Antes, un UID externo leía41 215 bytes de una imagen de widget por nombre predecible. Ahora cada URI exige HMAC-SHA256 por archivo, con secreto aleatorio privado de 32 bytes y comparación constante. Se exige padre canónico exacto, y borrar widget2 ya no coincide con widget20. Parche mínimo reproducible sobre0.20.1, con hashes de fuente y rechazo de cambios inesperados. |
| S02 | Baja, corregida | Eliminados permisos de almacenamiento externo, overlay y vibración innecesarios; verificado manifest final. |
| S03 | Baja / defensa adicional, corregida | `usesCleartextTraffic=false`; se conserva TLS normal, sin verificadores permisivos ni certificados aceptados a ciegas. |
| Q01 | Baja de disponibilidad, corregida | Preferencias null/primitivas/arrays malformados recuperan valores por defecto conservando datos originales. |
| Q02 | Baja de validación, corregida | IDs deben pertenecer al catálogo y horas estar en00:00–23:59. UI habitual no generaba las entradas defectuosas. |
| Q03 | Baja de consistencia, corregida | Una carga antigua de snapshot ya no sobrescribe un selector más reciente. Control negativo reproduce el fallo en código anterior. |
| Q05 | **Fallo funcional en API 24, corregido** | Consulta HTTPS se agotaba a10 s con HTTP/2. Probe usando las mismas clases del APK: HTTP/2 timeout; HTTP/1.1 devuelve200 en378ms. Factory de OkHttp usa sólo HTTP/1.1 en API 24, conserva cookies/caché/TLS y se instala antes de React. API 36 conserva protocolo predeterminado. Consulta real final correcta en API 24. No se extrapola la prueba a API25. |
| S04 | **Media residual de disponibilidad** | Okio 2.9.0, CVE-2023-3635/GHSA-w33c-445m-f8w7: GZIP malformado. Componente presente en HTTP nativo; entrada maliciosa requiere control de respuesta del proveedor HTTPS o compromiso de esa confianza. No se reprodujo explotación en esta app. Actualizar a3.x exige estudio de compatibilidad; no se fuerza un cambio principal en esta preparación. |
| S05 | Aviso alto; vector no identificado en esta app | Gson 2.8.6, CVE-2022-25647/GHSA-4jrv-ppp4-jm57: deserialización Java de clases internas/writeReplace. La API usa JSON en JS; no se encontró ObjectInputStream con entrada externa en código propio. Se mantiene como deuda transitiva, sin dar por corregido el componente. |
| S06 | Aviso moderado; vector no identificado en esta app | Commons IO 1.4, CVE-2021-29425/GHSA-gwrp-pvrq-jmwv, normalización de rutas. Transitivo de Expo; no se encontró uso propio de normalize con ruta no confiable. |
| D01 | Riesgo de herramientas de compilación | npm audit señala 44 paquetes:1 crítico, 31 altos, 11 moderados, 1 bajo. El crítico shell-quote y módulos Node ws/XML/PostCSS/glob/etc no aparecen como módulos runtime del bundle. Los avisos propagados a Expo/RN no prueban que sus funciones vulnerables se ejecuten en Android. Build sólo desde fuentes fiables y Metro no expuesto a redes hostiles. Sin actualizaciones masivas ni audit fix/force. |
| Q04 | Baja local, riesgo estático conservado | La actividad de configuración exportada de la librería puede dereferenciar providerInfo nulo con ID de widget inexistente. Posible cierre provocado de pantalla, sin acceso a datos demostrado. No se reemplaza su delegado nativo durante esta preparación. |
| P01 | Distribución/documentación, corregida | README explica app independiente no oficial, instalación, privacidad y atribuciones; eliminada instrucción fija «(pruebas)» en app oficial. |

S01 mantiene el provider exportado porque lo necesitan los hosts RemoteViews. El launcher autorizado recibe la capacidad de lectura; quien obtenga una URI válida también puede leer esa imagen mientras sea válida. La protección impide adivinar acceso sin token; no promete confidencialidad frente al propio launcher, Android con privilegios o un dispositivo comprometido. Tokens por archivo, sin volcar capacidades válidas a logs ni informes.

No se ha identificado una vulnerabilidad crítica/alta del APK con ruta explotable demostrada en el alcance auditado. **Esto no certifica ausencia de vulnerabilidades.** La consulta OSV sobre 129 componentes Maven exactos devuelve los tres avisos nativos indicados. No cubre exhaustivamente C/C++, sistema operativo ni futuros avisos.

También se contrastaron las páginas de seguridad upstream de Hermes y las fuentes/changelog de React Native/Folly/fmt. La [página de Hermes](https://github.com/facebook/hermes/security) no publica advisories; eso no prueba ausencia de defectos. El motor ejecuta el bundle local empaquetado, sin descarga/evaluación de código remoto ni WebView propia; las respuestas de horarios siguen siendo entrada no confiable para sus parsers. No se sustituyen binarios Hermes fuera de la combinación soportada por React Native.

## Pruebas y producto

| Comprobación | Resultado / límites |
|---|---|
| Instalación reproducida | npm ci con lockfile:584 paquetes; sin modificar versiones/integridades. Scripts automáticos de instalación desactivados durante auditoría. |
| Suite existente y regresiones | **10 suites PASS** en commit compilado: migración, persistencia, serialización, favoritos, API, caché, errores, carreras,24 filas, mapa y cámara. Añadidas pruebas de preferencias/IDs/horas/snapshots, parche S01, configuración y compatibilidad API 24. Casos unitarios con datos simulados distinguidos de API real. |
| Compilación y Lint | `:app:assembleRelease :app:lintRelease` correcto,633 tareas; **0 errores y 46 advertencias**. No se interpretan advertencias de iconos/actualizaciones como vulnerabilidades. |
| Actualización y persistencia | Directa1.0.0→rc2, misma instalación/widget; reinicio y refresco correctos. Preferencias legacy conservadas en API 24. |
| Home/favoritos | Consulta sin widget, diez favoritos mediante UI real y alias, undécimo rechazado, diez/alias conservados tras actualización/reinicio. |
| Widget | IDs 6/7 independientes; selector, refresco, ocho filas reales accesibles al deslizar. Actualización de widget original y arranque conservados. S01 en API 24 y API 36: nombre predecible, token falso y traversal rechazados, sin PNG expuesto; imágenes legítimas siguen visibles. |
| Red | En APK final: modo sin red conserva caché y aviso; ruta nueva sin caché muestra error; al volver red y refrescar carga cuatro trenes reales. Errores500/formato/vacío/timeout probados además en suite. |
| Mapa, topología |42 estaciones, 41 aristas L1/L2,1722 pares físicos; Deusto y Eliptikoa conservados. Sin mapa en widget. |
| Matriz Android mapa | **8 combinaciones PASS, 40 mediciones nativas**: navegación por botones/gestos × fuente 1/1,5 × vertical/horizontal; mapa vacío/selección, consulta real, resultados, guardar y selector. Capturas y orientación verificadas sobre rc2. |
| Gestos Android | **8 casos PASS sobre rc2**: ampliar/reducir levantando cualquiera de los dedos, centro móvil, cancelación, nuevo pinch tras cancelar y pan anterior al pinch. MotionEvents reales inyectados por shell; región del mapa idéntica píxel a píxel tras 2→1→0/cancel. No equivale a una prueba manual de dedos físicos. |
| Android 7/API 24 | App, migración, preferencias y consulta real correctas tras corrección de protocolo. Widget real en launcher AOSP muestra ocho trenes con imágenes protegidas y preferencias antiguas. No se ha probado cada Android intermedio ni cada fabricante. |
| Android 16/API 36 /16KB | Candidato final instalado y consulta Deusto→Eliptikoa correcta con modo de compatibilidad16KB desactivado.38 bibliotecas de 64 bits cumplen alineación LOAD ≥16 KB; ZIP validado. No se deduce un fallo de una heurística de final RELRO que no es prueba de compatibilidad por sí sola. |
| Secretos y APK | Escaneo de1149fuentes del build final:0coincidencias de patrones; bundle empaquetado idéntico al generado. Escaneo Git alcanzable y exclusiones descritos abajo. No es detector universal de secretos. |

Avisos Lint:20IconExtension,5IconLauncherShape,2NewerVersionAvailable,6PrivateResource,2ScopedStorage,4UnusedAttribute,6UnusedResources,1DiscouragedApi. Los de almacenamiento son entradas de exclusión, no permisos efectivos. Los recursos Expo con bytesPNG y nombre.webp se cargan correctamente; no se cambia el icono validado por ese aviso.

## Calidad, rendimiento, privacidad y límites

Dominio, persistencia, servicio de consultas y controladores tienen responsabilidades separadas. Persistencia serializa escrituras en un runtime y guarda copia literal legacy antes de migrar; no se identificaron migraciones destructivas. No equivale a transacciones entre procesos JS. Cachés por ruta evitan mezclar resultados; no hay poda explícita para crecimiento prolongado. Se conservan datos obsoletos con fecha/aviso.

Home limita consultas paralelas a 3; deduplicación 2,5 s, timeout 10 s y generaciones descartan respuestas antiguas. No todas las conexiones iniciadas se cancelan. Transformación del mapa en hilo UI y SVG memoizado; no hace llamadas por gesto. Widget programa 30 min, resize no consulta, y rasteriza filas para RemoteViews. Se ha comprobado funcionamiento/lista; **no se han medido batería durante días, memoria bajo estrés prolongado o todas las restricciones de fabricantes**.

Duplicaciones de estilos/rótulos, archivos/recursos antiguos, Picker/expo-status-bar aparentemente sin uso y fichero npx vacío son mejoras opcionales. No se hace limpieza/refactorización masiva antes de publicar. Temporizador de edad de pantalla puede seguir mientras está montada en segundo plano, sin polling de red. Algunas etiquetas de ordenar favoritos exponen IDs internos; TalkBack completo y adaptación de home/gestor a todos los insets no auditados exhaustivamente. Mapa ofrece selección por nombre, etiquetas y objetivos de 48 dp; matriz de mapa verifica insets y fuente grande.

Favoritos, alias y caché son privados de app pero sin cifrado adicional. Backup Android habilitado puede incluirlos: se documenta y conserva restauración. No GPS, contactos, pagos, cuenta de usuario ni almacenamiento compartido. El operador recibe las peticiones normales de horarios por HTTPS. Componentes exportados revisados: MAIN/configuración necesarios, receiver de widget no exportado, servicios protegidos por BIND_REMOTEVIEWS/BIND_JOB_SERVICE/DUMP; provider de imágenes protegido según S01. PendingIntents de listas necesitan fill-in mutable y apuntan a componentes explícitos; selección se reconcilia con favoritos almacenados.

## Dependencias, recursos y atribuciones

`THIRD_PARTY_NOTICES.txt` incluye227 grupos de textos instalados npm,17 textos upstream adicionales fijados por commit/tag y12 avisos incrustados en AAR/JAR, junto a129 coordenadas Maven resueltas. Se comprueba su presencia e identidad en el APK final. El inventario cubre584 paquetes npm conservadoramente, incluyendo tooling.59 no traen LICENSE/NOTICE en raíz; los 9 casos con fuente incluida en JS se cubren con textos Expo/RN/Metro upstream. El generador rechaza textos suplementarios vacíos y permite regenerar desde Git sin depender de enlaces vivos durante el build.

Se incluyen licencias nativas de Hermes y dependencias C/C++ (LLVM/ICU, Boost, double-conversion, fast_float, fmt, Folly, glog, fbjni, gflags, json), además de las licencias de componentes Maven/AndroidX/OkHttp/Okio/Gson/etc. No se asigna licencia al código del propietario sin su decisión. MPL 2 de lightningcss y CC-BY 4 de caniuse-lite corresponden a tooling sin módulo en el APK; node-forge ofrece alternativa BSD, no se imputa GPL a toda la app.

Mapa de geometría propia, procedencia versionada; no contiene plano raster/SVG/logo del operador. Icono minimalista aportado para el proyecto; splash efectivo genérico de Expo. Recursos antiguos no usados no se presentan como nuevos activos autorizados. README atribuye datos a Metro Bilbao y presenta AndroidMetro como independiente no oficial. No se afirma permiso contractual de marca/API que no conste.

Reconsulta legal: [información legal](https://www.metrobilbao.eus/es/informacion-legal) y OpenData raíz devolvieron sólo shellJS a la herramienta. Se conserva evidencia renderizada del10-10-2026 en `prototypes/mapa-interactivo/sources/legal-evidence.json`. La [guía oficial OpenData](https://www.metrobilbao.eus/es/open-data/dataset/api-guide) sí describe consulta/descarga de datasets; eso **no demuestra una licencia específica del endpoint de próximos trenes ni autorización para redistribuir gráficos**. Queda esta limitación documental para la decisión del propietario; no se ha identificado un nuevo recurso gráfico ajeno que obligue a sustituir el mapa. Revisión técnica y de atribuciones, no dictamen jurídico ni autorización del operador.

Referencias de avisos nativos: [Okio](https://github.com/advisories/GHSA-w33c-445m-f8w7), [Gson](https://github.com/advisories/GHSA-4jrv-ppp4-jm57), [CommonsIO](https://github.com/advisories/GHSA-gwrp-pvrq-jmwv). [Clasificación npm detallada](DEPENDENCIAS_AUDITORIA_2.0.0.md). [Requisitos Android 16KB](https://developer.android.com/guide/practices/page-sizes).

## Commits, reconstrucción y GitHub

| Commit | Cambio |
|---|---|
| `a36d82a` | Informe inicial antes de corregir código. |
| `a79e53e` | Preferencias/IDs/horas, carreras de snapshots y regresiones. |
| `56860c2` | Producción/permisos/HTTPS/firma explícita/wrapper, documentación y avisos iniciales. |
| `53669eb` | Resultados intermedios, perfil APK y pruebas. |
| `ebc3e5d` | S01, versionCode2 y avisos nativos suplementarios. |
| `cd8dc24` | Textos de licencias completos y verificables. |
| `bae3c09` | Compatibilidad de consultas API 24 y herramientas de validación oficial. **Fuente del rc2.** |

Reconstrucción: checkout del commit compilado, npm ci, generar Android mediante Expo prebuild de producción sin variable de pruebas, ejecutar10 suites, Gradle `:app:assembleRelease :app:lintRelease`, verificar APK sin firma, firmar con la clave original privada, y verificar certificado/manifest/bundle/zipalign. Toolchain comprobado: Node 24.19.0, npm 10.9.4, JDK 17.0.20.1, SDK/build-tools36, NDK 27.1.12297006 y Gradle 9.0.0. Wrapper JAR y distribución tienen SHA-256 oficiales comprobados y fijados. Plugins versionados reproducen las correcciones nativas tras npm ci/prebuild. No se suben Android generado, APK, claves ni herramientas auxiliares locales.

Remoto reconsultado directamente el 15-10-2026: cuatro ramas de desarrollo más main; main sigue `339def20985e0fc2f2493ed593836472c96240b5`; no existe tag oficial v2.0.0. Main es ancestro de release: una integración futura sin reescribir historial es viable. Debe reconsultarse justo antes de ejecutarla. No se han hecho push, merge en main, tags ni mutaciones de releases. Exclusiones protegen APK/AAB, firmas auxiliares, keystores/copias, credentials*.json, .env, caches y Android generado. El escaneo alcanzable no cubre objetos huérfanos, credenciales codificadas o caches de terceros.

Escaneo de las refs alcanzables hasta `4aec140`: **797 objetos,608 blobs,385 textos; cero coincidencias de patrones y cero nombres de archivos de credenciales**. Registro sin valores sensibles en `release-2.0.0/history-scan.json`. No se infiere ausencia universal de secretos. Reconsulta final EAS a17:16UTC confirma contador oficial1 mediante la misma AppVersionQuery de lectura de la CLI, sin cambiar `appVersionSource=local`; registro público en `release-2.0.0/eas-version.json`.

Propuesta exacta de retirada **sólo después de aprobación, publicación y verificación oficial**:

| ID | Pre-release/tag | APK publicado |
|---|---|---|
|409023620|`androidmetro-2.0-mapa-interactivo-pruebas`|`androidmetro-mapa-android-test.apk`|
|411827626|`androidmetro-2.0-fase2b-fix1-pruebas`|`androidmetro-mapa-fix-test.apk`|
|408820497|`androidmetro-2.0-fase1-pruebas`|`androidmetro-2-fase1-test.apk`|
|408853799|`androidmetro-2.0-app-consulta-pruebas`|`androidmetro-app-consulta-test.apk`|

Se conserva estable histórica `apk`, ID 290996482, `metroBilbao.apk`. **Ninguna retirada ejecutada.** La propuesta no borra tags, ramas, commits, APK locales o copias de recuperación. El texto futuro de release tiene cinco líneas en [RELEASE_NOTES_2.0.0.md](RELEASE_NOTES_2.0.0.md).

Evidencia completa fuera de Git en `../auditoria/release-2.0.0/`: metadatos rc2, apksigner/badging/manifest, inventarios npm/Maven/OSV/licencias, build/Lint, tests, capturas/matriz/gestos y actualización final. Los archivos privados de firma están separados y no forman parte de la entrega pública. Se conserva un resumen de evidencias y sus hashes junto a este informe.

**Puerta siguiente:** revisión del propietario y aprobación explícita de publicación, teniendo presentes los riesgos S04–S06, Q04 y las limitaciones descritas. Hasta entonces main y todas las releases permanecen intactos. La publicación y verificación del archivo descargado desde GitHub siguen pendientes por falta de esa autorización, no se presentan como completadas.
