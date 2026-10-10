# AndroidMetro 2.0 — Corrección de gestos y áreas seguras

10 de octubre de 2026. Base limpia `feature/mapa-interactivo-android`, commit `96c1084`; rama independiente `fix/mapa-gestos-safe-area`. Se conservan la fase 2B publicada, sus commits, APK y el prototipo 2A. No se hace push, merge ni release. No se instala en un móvil físico.

## Causas comprobadas

**Salto al retirar un dedo.** En Gesture Handler **2.30.0 instalado**, `ScaleGestureDetector.java` excluye el dedo que se retira al calcular el foco. `PinchGestureHandler.kt` sigue activo hasta `ACTION_UP` del último dedo, y el orquestador envía actualizaciones durante `ACTION_POINTER_UP`. Ese evento aún contiene dos punteros, aunque el foco ya corresponde al superviviente. El código anterior aplicaba siempre `focalX/Y − anchor × scale`. Pan ya se cancelaba al exceder `maxPointers(1)`; el salto reproducido procede del foco de pinch, no de los botones de zoom. Con el APK anterior, mantener el dedo izquierdo tras levantar el derecho desplazó el mapa **−240 píxeles**: la región solapada coincide exactamente al aplicar ese desplazamiento a las capturas.

La corrección usa el número de dedos de `onTouchesUp`, entregado **antes** de esa actualización nativa, y conserva la cámara cuando quedan menos de dos. Comprobar solamente `onUpdate.numberOfPointers < 2` dejaría pasar el primer evento problemático. Los cambios de punteros invalidan el anclaje: si se vuelve a disponer de dos dedos, se recalibra respecto a la cámara retenida y a la escala acumulada del evento. Fin y cancelación limpian la sesión. Pan no escribe mientras pinch posee la cámara; un nuevo arrastre con un dedo sigue disponible al finalizar. El dedo superviviente no mueve el mapa durante la retirada. Se mantiene el desplazamiento del foco con dos dedos.

Fuentes técnicas: código nativo instalado de Gesture Handler en `node_modules/react-native-gesture-handler/android/src/main/java/com/swmansion/gesturehandler/`, [documentación oficial de pinch](https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/pinch-gesture/), [safe-area-context en Expo SDK 55](https://docs.expo.dev/versions/v55.0.0/sdk/safe-area-context/) y [ubicación de proveedores en raíces y modales](https://appandflow.github.io/react-native-safe-area-context/api/safe-area-provider/). El recuento observado en POINTER_UP se comprueba contra esta versión instalada, no se deduce únicamente de la documentación genérica.

**Guardar bajo la barra Android.** MapScreen reservaba `paddingBottom: 24` y calculaba el espacio superior con `StatusBar.currentHeight`. En navegación clásica del emulador, el inset inferior real es **48 dp**; con fuente 150 % las acciones pasan a dos filas. La zona de Guardar era `[21,2211][290,2337]`, pero la navegación empieza en `y=2274`: **63 píxeles** del botón quedaban cubiertos. Es el mismo tipo de superposición que muestra la captura aportada por el propietario; esa imagen es evidencia del hardware anterior, no una prueba ejecutada por Codex.

## Cambios de alcance limitado

- `mapCamera.js`: matemáticas de pinch y sesión comprobables en Node y ejecutadas como worklets en el hilo UI. Se reutilizan los límites de cámara anteriores; no se sustituye el zoom por botones ni se elimina pan.
- `MapScreen.js`: cuenta real de dedos, exclusión de escrituras simultáneas de cámara, área segura nativa y footer desplazable que puede encogerse cuando falta altura. Se reserva para el mapa el mínimo necesario para su control de 48 dp y separación de diseño; no se utiliza un margen para adivinar la navegación Android.
- `SafeScreen.js`: un `SafeAreaProvider` y `SafeAreaView` en cada raíz de ventana/modal, fuera del contenido animado y desplazable. Aplica los cuatro bordes y mide también recorte lateral y navegación en horizontal. No usa métricas iniciales cacheadas de otra ventana. Se retiran los rellenos manuales en esas pantallas, evitando sumar dos veces los insets.
- Selector, guardado y `TrainDetail` compartido usan el mismo contenedor. El detalle de favoritos obtiene la misma protección de layout, sin cambiar su consulta o lista. La home conserva su diseño.
- Búsqueda y alias incluyen `disableFullscreenUI`: durante la validación, el teclado Android en horizontal cubría el selector con su modo de edición a pantalla completa. El ajuste se limita a esos dos inputs del mapa; no oculta barras del sistema.
- Los dos formularios usan `KeyboardAvoidingView` con `behavior="padding"` y offset calculado como `frame.y − insets.bottom`: el inset inferior ya se aplica dentro. El guardado puede desplazarse y la búsqueda forma parte de la cabecera desplazable de la lista. Se descartó una variante con `height` que provocaba realimentación de layout en el modal Android; el APK entregado mantiene el marco exterior estable.
- Única dependencia añadida: `react-native-safe-area-context` **5.6.2**, fijada según `node_modules/expo/bundledNativeModules.json` del SDK 55.0.2 instalado. No se actualizan Expo, RN 0.83.2, Gesture Handler 2.30.0, Reanimated 4.2.1 ni Worklets 0.7.2.

Se conservan datos y SVG L1/L2, nombres, códigos API, servicio, modelos, persistencia, widget, iconos, App.js y prototipo. No se introduce L3.

## Validación y evidencias

La [galería](evidencias/mapa-fix/galeria.html) enlaza PNG originales obtenidos con `adb screencap`, XML de UI y JSON de coordenadas. No se retocan ni se generan imágenes de Android. [Resultados estructurados](evidencias/mapa-fix/resultados.json).

AVD `AndroidMetro_API36`, Pixel 6, Android 16/API 36, x86_64, exclusivamente `emulator-5556`. APK definitivo identificado abajo. Validación nativa:

| Caso | Resultado y evidencia |
| --- | --- |
| Pinch 2→1→0 | Ocho casos: ampliar/reducir, retirar izquierdo/derecho, foco móvil, cancelación, sesión nueva y pan anterior. Se mantiene el dedo superviviente ≥350 ms. En cada caso, la región `[0,600,1080,1900]` mantiene exactamente los mismos píxeles entre sus capturas de dos/uno/cero dedos. Hay 24 capturas. `gestos-resultados.json`. |
| Pan y botones después de pinch | Un nuevo arrastre nativo con un dedo y ampliar por botón cambian la región del mapa. `final-camara-regresiones.json` y capturas `final-pan-*`, `final-boton-zoom`. |
| Navegación, fuente y orientación | 2 navegaciones × 2 fuentes (100/150 %) × 2 orientaciones; cinco pantallas por combinación, **40 registros**, con mapa vacío/seleccionado, resultados, guardado y selector. Se verifica la fuente efectiva y la orientación de cada PNG, coordenadas contra barras visibles y objetivos ≥48 dp (tolerancia 0,5 dp). Incluye los dos campos superiores Origen/Destino, además de los diez controles del mapa. `matriz-resultados.json`. |
| Antes/después de Guardar | Fuente 150 %, navegación clásica: antes `[21,2211][290,2337]`, 63 px cubiertos; después `[21,2148][290,2274]`, sin solapamiento. PNG/XML originales `antes-tres-botones-150` y `threebutton-1.5-vertical-vacio`. |
| Teclado en horizontal, fuente 150 % | Guardado con scroll: Guardar `[170,226][2358,352]`, altura 48 dp, IME comienza en y=394. Pulsación real responde con el error de duplicado esperado; no altera favoritos. `teclado-guardar-validado-bounds.json`, `teclado-guardar-pulsado.png`. |
| Densidad y pantalla pequeña | 900×2000, 480 dpi (**300 dp** de ancho), vertical, tres botones y fuente 150 %. Mapa vacío y seleccionado: todos los controles medidos siguen fuera de las barras y conservan 48 dp. `final-pequeno-300dp-*`. Después se restauran tamaño y densidad. |
| Selección SVG y consulta real | Toques medidos STZ `(540,1477)`, POR `(830,1477)` con zoom 0,85: Santurtzi → Portugalete. API real devuelve **ocho** trenes. Regresar conserva selección y píxeles del mapa. Se comprueban RESET e intercambio. `final-seleccion-tactil`, `final-consulta-api`, `final-vuelta-consulta`, `final-intercambio`. |
| Corrección posterior | En una selección STZ/POR se cambia por nombre el destino a PEN (Peñota), manteniendo Santurtzi como origen; RESET deja ambos campos vacíos. `final-antes-correccion`, `final-destino-corregido`, `final-reset-tras-correccion`. |
| Guardado y duplicados | Se guarda STZ/POR con alias «Correccion final» en el usuario 10 sin widgets, usando el repositorio existente. El segundo guardado muestra «Ya tienes este trayecto en favoritos». Conserva los cinco favoritos originales y dos trayectos añadidos durante esta corrección: siete de diez. `final-favorito-guardado`, `final-duplicado`, `final-gestor-sin-widget`. |
| Home y detalle | Usuario principal conserva diez favoritos; la home presenta tres trenes y el detalle los ocho, incluyendo sus últimas filas al desplazar. Volver/Refrescar también pasan la medida de insets. `final-home-principal`, `final-detalle-home*`, `final-diez-favoritos`. |
| Widgets | Selector de diez, lista desplazable de ocho. Cambiar el primero a BAR/MOY mantiene el segundo en STZ/MOY; se restaura el primero a CAV/SIN. `final-widget-BAR-completo`, `final-widget-segundo`, `final-widget-restaurado`, `final-widget-ultimos`. El usuario 10 mantiene cero widgets. |

Después de reiniciar Android, la home y gestión del usuario 0 conservan **diez** favoritos (`final-home-reinicio`, `final-diez-reinicio`), y el usuario 10 conserva **siete**, sin widgets (`final-siete-reinicio`). Las dos instancias originales siguen registradas (`final-widgets-reinicio.txt`). La primera activación del perfil secundario se intentó durante el arranque y no resolvió la actividad; se repitió una vez confirmado `RUNNING_UNLOCKED`, sin reinstalar ni borrar datos. Ese intento no se cuenta como una prueba positiva. Se restaura el usuario 0, fuentes al 100 %, 1080×2400/420 dpi, rotación libre y conectividad.

Las ocho consultas STZ/MOY de la matriz y STZ/POR del flujo se hacen contra el servicio real, sin respuestas inyectadas. Cada JSON registra hora y textos observados; el contador de ocho no supone que todas las filas entren en una única captura. No se declara validada cualquier combinación de estaciones por estos ejemplos. No se modifican API, horarios, direcciones o vagones.

La lectura de nombres/roles y las medidas de áreas pulsables no equivalen a una sesión completa con TalkBack. Las capturas y comparaciones puntuales tampoco constituyen una medición de fluidez o batería en hardware. No se observa el ciclo continuo de layout del candidato descartado en el formulario final; no se afirma un rendimiento universal. Al cambiar orientación se vuelve a encuadrar, conservando la selección, como en fase 2B. Se conserva la cámara al cerrar resultados; cerrar el mapa hacia home y reabrirlo crea de nuevo la ventana y puede recuperar el encuadre completo. No se añade persistencia de cámara entre reinicios.

Las pruebas de lógica ejecutadas son `test-map-camera.cjs`, `test-map.cjs`, `test-map-query.cjs`, `test-consultation.cjs`, `test-fase1.cjs`, `test-persistence-api.cjs` y `test-widget-races.cjs`. Todas pasan. Los casos de servicio/favoritos de esas pruebas usan fixtures, incluidos los 24 trenes; no se presentan como llamadas reales. La prueba de cámara reproduce el payload Android con dos punteros en POINTER_UP y un solo dedo real, ambos focos supervivientes, reanclaje con escala acumulada, límites y sesión nueva tras finalización/cancelación.

El controlador UI es secuencial. Espera a que termine el arranque y a la rotación efectiva con la app abierta; el launcher impone vertical y los cambios de fuente son asíncronos. Cierra el teclado antes de elegir una fila por coordenadas. Los intentos preliminares interrumpidos por transiciones, teclado de edición completa o un desplazamiento excesivo del controlador no se cuentan como casos positivos. Refrescar puede salir de la vista al desplazar voluntariamente la lista; vuelve a ser accesible desplazando hacia arriba.

## Reproducción

Activar el entorno con `scripts/activar-entorno.ps1`. Los controladores se dirigen exclusivamente a **emulator-5556**; `MAPA_EVIDENCE_DIR` selecciona la carpeta de salida.

- `node scripts/android-test/run-map-fix-matrix.cjs`: ocho combinaciones de navegación/fuente/orientación, con mapa vacío y seleccionado, consulta real, guardado y selector. `MAPA_CASES` permite repetir casos concretos.
- `node scripts/android-test/verify-map-insets.cjs nombre map|save|picker|results`: mide contra los InsetsSource visibles de Android y exige áreas de al menos 48 dp, con tolerancia de redondeo de 0,5 dp. Guarda PNG/XML/JSON.
- Compilar `MetroGesture.java` con javac contra `platforms/android-36/android.jar`, convertir su clase con d8 y empaquetar `classes.dex` en `metro-gesture.jar`. ADB lo deposita en `/data/local/tmp`; `app_process` inyecta MotionEvents. Es un controlador externo de pruebas, **no forma parte del APK**. Ejemplo: `CLASSPATH=/data/local/tmp/metro-gesture.jar app_process /data/local/tmp MetroGesture 540 1250 100 240 1 prueba`. Retira el dedo 1, mantiene el 0 al menos 350 ms y captura dos/uno/cero dedos. El argumento de modo admite `cancel` y `pan-first`; otros dos argumentos desplazan el foco.
- Con el mapa abierto en vertical 1080×2400, `node scripts/android-test/run-map-fix-gestures.cjs` ejecuta los ocho casos; `python scripts/android-test/verify-map-fix-evidence.py` compara los píxeles y verifica la orientación e integridad de las 40 capturas de la matriz. Requiere Pillow del runtime de pruebas, ya disponible; no es dependencia de la app.

## APK y recuperación

APK autónomo: `C:/Users/W11/AMetro/artifacts/androidmetro-mapa-fix-test.apk`.

- SHA-256: `cf9f6bd4ac153b074686a8b2912e778dfa8aa924391c393795ed2edc2c84c30b`.
- 79.535.449 bytes; `com.metrobilbao.widget.pruebas`, versionCode 1, versionName 1.0.0, minSdk 24, target/compileSdk 36.
- Certificado de pruebas SHA-256 `5822756d7982c9c612d283f007d55f08e62b7a4224cc9b5b9409b1297891026d`, idéntico al APK anterior. No se usa firma de distribución.
- Bundle Hermes integrado de 2.152.888 bytes; cuatro ABI. Los 196 recursos PNG/WebP del APK anterior coinciden byte por byte. No requiere Metro.
- APK anterior conservado con SHA `f8504a3977450a54e02b0bceb4141071318b865042dbb599547f14ff07d34b2c`.

Commits de código: `93040c6` (pinch y áreas seguras), `bdc202e` (inputs en horizontal), `8c6a9a2` (desplazamiento con teclado y marco estable). El commit de documentación y controladores se identifica en `git log`. `main` permanece en `339def20985e0fc2f2493ed593836472c96240b5`; la rama base permanece en `96c1084`. No se crean, mueven o publican tags; se conservan los tags locales `apk`, `recuperacion-baseline-validado` y `recuperacion-icono-validado`. La publicación de fase 2B está documentada en `PUBLICACION_MAPA_ANDROID.md`; su tag remoto no existe como referencia local en este checkout.

## Verificación pendiente en el móvil

No se afirma una validación en hardware: solamente se recibió la captura anterior del propietario. Tampoco se extrapola API 36 del emulador a todos los dispositivos.

Instalar manualmente este APK de pruebas sobre el anterior, con el mismo paquete/firma, sin borrar datos. Comprobar ampliación y reducción cerca del centro y los extremos: dos dedos → retirar primero el izquierdo/derecho → mantener el superviviente → retirarlo. Repetir con un arrastre nuevo, botones de zoom y selección de estaciones. Consultar y regresar comprobando selección y cámara. Probar navegación clásica y por gestos, fuente 100/150 %, ambas orientaciones, mapa vacío/seleccionado, búsqueda, alias con teclado, guardado y resultados. Guardar debe quedar completamente por encima o al lado de la navegación y responder a la pulsación. Conservar favoritos y comprobar home/widget. Fuentes mayores y otros Android/launchers siguen fuera de la cobertura demostrada.
