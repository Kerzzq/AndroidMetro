# Estado de preparación, 15-10-2026

**Trabajo pendiente. No apto todavía para publicar ni para pedir aprobación de publicación.** El [informe inicial](AUDITORIA_RELEASE_2.0.0.md) se guardó antes de corregir código en `a36d82a`. Este documento registra los resultados posteriores; no sustituye las puertas de firma y actualización real.

## Cambios preparados

- `a79e53e`: preferencias nulas/malformadas recuperan valores por defecto conservando el original; sólo se aceptan IDs propios del catálogo y horas válidas; generaciones antiguas del widget no pueden pintar después de cargar snapshots. Se añaden regresiones para las carreras anteriores y posteriores a red.
- `56860c2`: se excluyen permisos innecesarios desde Expo, se bloquea cleartext explícitamente y se impide firmar producción con la clave debug de la plantilla. Se fija checksum oficial de Gradle 9.0.0 y se verifica el JAR del wrapper. No se cambia ninguna dependencia ni se genera clave oficial.
- Preparación de metadatos: nombre AndroidMetro, versionName 2.0.0 y perfil EAS production para APK. **versionCode definitivo aún NO fijado**, pendiente del mayor registrado en EAS. No compilar ni distribuir usando el valor 1 de la plantilla generada durante auditoría.
- README explica independencia del operador, instalación/actualización, caché, permisos, privacidad y atribuciones. Se corrige la instrucción fija del widget «(pruebas)». `THIRD_PARTY_NOTICES.txt` incorpora los textos de licencia/NOTICE disponibles del árbol npm y se copia al recurso nativo durante prebuild.
- `.gitignore` amplía protección para credentials.json, copias de keystores y firmas auxiliares. Prueba `git check-ignore` confirma exclusiones de credenciales, APK/AAB, .env, node_modules y Android generado.
- Se prepara [texto de release de cinco líneas](RELEASE_NOTES_2.0.0.md); no se publica.

Se mantienen las funcionalidades, códigos de estación, claves legacy, selección de widgets e implementación del mapa validadas. No hay refactorización masiva ni mapa en el widget. Sólo cambia la versión raíz del lockfile, sin cambios de versiones/integridades de dependencias.

## Pruebas y herramientas ejecutadas

| Comprobación | Resultado y alcance |
|---|---|
| npm ci |584 paquetes, lockfile reproducido, scripts de instalación desactivados.|
| npm audit |44 paquetes señalados:1 crítico, 31 altos, 11 moderados y 1 bajo. Sin fix/force. [Clasificación por bundle](DEPENDENCIAS_AUDITORIA_2.0.0.md).|
| npm test / scripts/run-tests.cjs |9 suites aprobadas (7 previas y 2 nuevas). Casos simulados, no actualización Android real.|
| Control negativo de regresión |El test de snapshot tarda y selector nuevo falla con el widgetRuntime de c390215; pasa con la corrección. Evidencia local sin modificar fuente Git.|
| Expo public config y prebuild |Paquete original, sin ANDROIDMETRO_TEST. Generación reproducible sin copiar Android histórico ni usar --clean.|
| Hermes export producción |1156 módulos empaquetados, 1149 fuentes en source map; bundle de 2,2 MB. Export exitoso fuera del sandbox tras fallo de escritura temporal de Hermes dentro del aislamiento. No equivale al bundle de un APK candidato.|
| Secretos en export |Cero coincidencias de patrones de claves privadas/GitHub/AWS y literales de credenciales en 1149 fuentes. No prueba ausencia de todos los secretos posibles.|
| Manifest fusionado |Sin lectura/escritura almacenamiento, overlay o vibración; usesCleartextTraffic=false. Se conservan INTERNET, ACCESS_NETWORK_STATE, WAKE_LOCK, RECEIVE_BOOT_COMPLETED, FOREGROUND_SERVICE y permiso signature de receptores de AndroidX para tareas/widgets.|
| Android Lint release |**0 errores,46advertencias**,549tareas,3m40s en checkout corto del commit56860c2. Informe XML local. No se ejecuta assembleRelease ni se produce APK.|
| Prototipo navegador existente |16 comprobaciones aprobadas,5 tamaños de pantalla sin overflow,0 errores de consola. Copia aislada; Edge headless requirió --disable-gpu/--disable-gpu-compositing para capturas. No se sobrescriben las evidencias Git. No sustituye gestos Android.|
| Original en Android16/API36 |APK histórico verificado instalado sólo en emulator-5556. Se configura Abando→Moyua desde UI; persiste tras force-stop/arranque, API real devuelve trenes. Widget original real añadido, ID 6; capturas y dumpsys conservados.|
| Actualización original→2.0.0 |**No ejecutada: falta clave y APK candidato.** No desinstalar ni limpiar datos para continuar.|
| Regresión final home/favoritos/widget/mapa |Pendiente en APK candidato exacto. La evidencia de builds de pruebas anteriores no se presenta como validación del candidato.|
| Android anterior / TalkBack / consumo prolongado |Pendientes. minSdk24 y análisis estático no demuestran ejecución en todas las versiones ni mediciones de batería.|

Los 46 avisos Lint se agrupan en IconExtension20, IconLauncherShape5, NewerVersionAvailable2, PrivateResource6, ScopedStorage2, UnusedAttribute4, UnusedResources6 y DiscouragedApi1. Los 2 de almacenamiento describen entradas `tools:node=remove`; el manifest fusionado confirma que esos permisos no se solicitan. Los 20 de extensión se deben a recursos Expo con PNG y nombre.webp, cargados por Android; no se rediseña icono validado por un aviso estático. Los restantes se conservan para revisión, sin equipararlos a vulnerabilidades.

El primer intento Lint falló por longitud de ruta CMake/ninja en Windows. Se creó checkout de validación separado en `C:\Users\W11\AMetro\release-2.0.0`, detached en56860c2, sin tocar `C:\Users\W11\AMetro\baseline` ni su rama de desarrollo. El clon principal de preparación sigue en la carpeta AndroidMetro de este paquete y contiene la rama release. Cambios posteriores a56860c2 son perfil EAS, robustez de pruebas y documentación: la validación nativa se deberá repetir sobre el commit candidato final cuando exista.

## Riesgos abiertos, con explotabilidad

| ID | Severidad contextual | Estado |
|---|---|---|
| R01/Firma |Bloqueante|No se ha recuperado clave privada original ni consultado versionCode remoto. EAS CLI24.14.0 aislada preparada; cuenta aún sin autenticar. Ninguna nueva clave oficial generada, ningún reemplazo de credenciales.|
| S01/Imágenes de widget |**Media, confirmada**|`content read` desde UID externo pudo leer41 215 bytes del PNG del widget de pruebas mediante URI predecible. Otra app puede leer representación de trayectos/alias sin permiso si el provider queda exportado. No se demostró lectura del almacén AsyncStorage ni escritura. Falta corregir y verificar la solución con hosts/listas: poner exported=false sin probar concesiones URI puede dejar widgets/listas sin imágenes. No se aplica una modificación nativa apresurada ni se declara cerrado.|
| S04/Okio |Media, disponibilidad de runtime|Okio 2.9.0, [CVE-2023-3635](https://github.com/advisories/GHSA-w33c-445m-f8w7): GZIP malformado puede provocar fallo. La ruta de HTTP usa esta librería; requeriría respuesta maliciosa del proveedor HTTPS o compromiso de esa confianza. No se ha reproducido crash en esta app ni declarado inocuo sólo por HTTPS. Cambiar a 3.x exige analizar compatibilidad, no forzarla.|
| S05/Gson |Aviso alto; ruta explotable no identificada|Gson 2.8.6, [CVE-2022-25647](https://github.com/advisories/GHSA-4jrv-ppp4-jm57). El aviso afecta deserialización Java de clases internas/writeReplace; el fetch de trenes usa JSON JS, no ObjectInputStream. No se encontró entrada binaria Java controlada por terceros en código propio. Se conserva como deuda de componente, sin atribuir automáticamente el CVSS al APK.|
| S06/CommonsIO |Aviso moderado; ruta explotable no identificada|Commons IO 1.4, [CVE-2021-29425](https://github.com/advisories/GHSA-gwrp-pvrq-jmwv), normalize de nombres de fichero. Proviene de expo-file-system, sin uso del método ni rutas externas controlables en código propio. No se elimina una dependencia transitiva nativa sin comprobar framework.|
| D01/npm |Tooling / superficie de compilación|Los avisos de shell-quote,ws Node,XML,PostCSS,glob/YAML/etc no aparecen como sus módulos fuente en el export runtime. ExpoCLI sólo aporta shim metro-require. Expo,expo-constants y RN sí tienen código runtime, pero la severidad npm observada se propaga desde tooling; no demuestra que esas funciones vulnerables estén en el APK. Mantener Metro local, entrada de build confiable y no procesar proyectos/archivos hostiles.|
| Q04/Intent configuración |Baja local|Librería puede dereferenciar providerInfo nulo ante ID inexistente. Actividad exportada necesaria para launcher. Pendiente de reproducción/control nativo; no se ha demostrado acceso a datos.|
| Privacidad/backups |Riesgo conocido|Favoritos/cachés privados sin cifrado adicional, backup de Android habilitado, alias pueden revelar hábitos. No cambiar restauración del usuario silenciosamente.|
| Recursos/licencias |Pendiente de cierre documental|Ver detalles siguientes. No anunciar autorización de terceros que no conste.|

La consulta OSV utiliza **129 componentes Maven exactos** obtenidos del grafo Gradle resuelto, incluidos React Android 0.83.2 y Hermes Android 0.14.1; devuelve los 3 avisos anteriores. OSV no cubre todas las CVE de C/C++/sistema ni sustituye inspección del APK final. No se ha demostrado una RCE crítica/alta del APK en este alcance; tampoco se afirma que no existan vulnerabilidades.

## Recursos, licencias y residuos

Inventario npm:584 paquetes. Predominan MIT 479, ISC 50, BSD 26 y Apache 11; también BlueOak,Python,CC0,Unlicense y opciones duales. `caniuse-lite` CC-BY 4.0 y `lightningcss` MPL 2.0 pertenecen al tooling y no aparecen como fuentes del export; no implican por sí mismos obligaciones sobre todo el código propio. `node-forge` ofrece BSD-3-Clause O GPL-2.0; no se infiere una obligación GPL para la aplicación por esa alternativa. Se incluyen textos/avisos disponibles conservadoramente,227 grupos únicos. **59 paquetes carecen de archivo LICENSE/NOTICE en su raíz instalada**: falta completar trazabilidad del texto/copyright desde upstream cuando corresponda al material distribuido. No presentar el inventario automático como cumplimiento jurídico cerrado.

Metadatos POM del grafo Maven se han inventariado localmente; licencias declaradas principalmente Apache 2.0, MIT y una BSD. Algunas precompilaciones Expo no traen POM en caché: revisar avisos de AAR/JAR y licencias upstream antes del candidato final. Los notices npm ya están copiados a assets nativos en la generación verificada; todavía hay que verificar presencia en el APK final y completar avisos nativos aplicables.

Mapa de geometría propia según procedencia versionada; splash revisado visualmente es rejilla genérica de plantilla Expo, no plano/logo oficial. Iconos antiguos, fichero vacío npx, tema antiguo y paquetes Picker/expo-status-bar parecen no usados en las pantallas actuales; no se eliminan a ciegas antes de release. Las páginas oficiales legales/OpenData consultadas de nuevo sólo exponen contenido base JavaScript con esta herramienta: no se pudo revalidar su contenido legal actual; se conserva la evidencia anterior con fecha, no se inventa una licencia actual.

## Firma, versión y conservación de datos

La firma pública del APK original y su hash se verificaron y coinciden con el asset histórico remoto. Certificado SHA-256 `91bc77ae484bc3ff3408f13950894e4ed7a3d49674a20f7a634b798747e026c0`; APK SHA-256 `f2e28a2a001fd4d1c3ca86ce42e4fc9442acc9ecd8b6a78cc1b37f97770310bc`.

Búsqueda local por nombres de keystore/credentials en este paquete, AMetro y carpetas habituales de documentos/descargas/escritorio: sólo identificados la clave de pruebas y keystores debug generados. No se ha identificado una clave de producción; esto no demuestra que no exista en otra ubicación/copia. EAS projectId del APK coincide con app.json. La forma exacta de firma original sigue siendo una hipótesis EAS hasta consultar su historial/credenciales.

No existe APK candidato 2.0.0 oficial: hash/certificado/compatibilidad de actualización pendientes. No se usa el APK de pruebas como sustituto ni se generan claves nuevas. Completar acceso Expo mediante la CLI aislada y consultar sólo credenciales existentes, sin volcarlas a logs/Git/informes. Tras recuperar clave, comparar su certificado, determinar versionCode superior al mayor oficial/EAS y compilar el commit final. Después verificar `apksigner`, manifest, bundle, licencias y update real con la app/widget originales ya preparados en emulator-5556.

## GitHub y siguiente puerta

No se ha hecho push ni cambio remoto. `main` sigue en 339def20985e0fc2f2493ed593836472c96240b5. Es ancestro de release en la inspección local; integración sin reescribir historia parece viable, pero debe recalcularse justo antes de publicación tras aprobación. No se integra ahora. Conservar todos los commits de desarrollo y los puntos de recuperación.

Inventario exacto de 4 pre-releases propuestas para retirar y release apk a conservar en el informe inicial; todas permanecen publicadas. No se borran tags/ramas/commits ni APK locales. Antes de cualquier futura retirada, volver a consultar remoto, publicar estable con autorización y verificar el APK descargado.

**Siguiente acción necesaria del propietario: autenticar Expo.** La preparación seguirá abierta hasta recuperar firma, resolver el proveedor de imágenes, cerrar los avisos/licencias que condicionen distribución y demostrar la actualización del APK candidato. Sólo entonces corresponde presentar la entrega previa completa y pedir aprobación de publicación.
