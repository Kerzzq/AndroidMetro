# AndroidMetro 2.0 · mapa nativo L1/L2

Base revisada: `feature/mapa-interactivo-prototipo`, `97c662b`. Rama de trabajo: `feature/mapa-interactivo-android`. El ZIP sin versionar se preservó fuera del checkout en `respaldo-mapa-interactivo-pre-android.zip`, SHA-256 `6ef1c1b4b2642cec1207d9fbe1be6dcfd171cee0ec5ba354b2a102042b5c08fd`.

## Datos y representación

`src/data/metroMap.json` deriva del modelo trazable de fase 2A. Contiene exclusivamente las 42 estaciones de L1/L2 y 41 aristas físicas bidireccionales validadas. Conserva código API, identificador de dominio, ID SVG, fuentes y evidencia original. No hay nodos ZZ*, secuencia L3 ni transbordo CAV/ZZC. CAV permanece como estación compartida de L1/L2. El modelo histórico completo sigue intacto en `prototypes/mapa-interactivo/`.

Nombres visibles de este flujo: MOY = Eliptikoa, DEU = Deusto. No se altera `stations.js`, el código API, los nombres antiguos en otras pantallas ni la persistencia. Las posiciones originales se trasladan 180 unidades hacia arriba y el encuadre se reduce a 2420×560, eliminando el espacio del ramal retirado. Las etiquetas, geometría y selección se renderizan como primitivas SVG independientes.

`mapModel.js` calcula el camino físico sobre las aristas validadas y resuelve selección y áreas de pulsación de 48 dp, después de la transformación de cámara. Si varias estaciones están dentro del objetivo, abre una lista nativa de candidatas. El mapa completo orienta; la ampliación permite leer los nombres. Los campos de origen/destino ofrecen búsqueda por nombre sin depender de un toque preciso. O/D y color identifican ambas selecciones.

## Dependencias y gestos

Se conservan Expo 55.0.2, RN 0.83.2, React 19.2.0, Fabric y Hermes. Se añaden únicamente las dependencias directas `react-native-svg` 15.15.3, Gesture Handler 2.30.0, Reanimated 4.2.1 y Worklets 0.7.2, más sus transitivas. Las versiones coinciden con `node_modules/expo/bundledNativeModules.json`; la matriz instalada de Reanimated admite RN 0.83 / Worklets 0.7.x. Fuentes: [SVG SDK55](https://docs.expo.dev/versions/v55.0.0/sdk/svg/), [Gesture Handler SDK55](https://docs.expo.dev/versions/v55.0.0/sdk/gesture-handler/), [Reanimated SDK55](https://docs.expo.dev/versions/v55.0.0/sdk/reanimated/).

`expo install --check` online recomienda actualmente Expo 55.0.31, status-bar 55.0.6, RN 0.83.10 y Worklets 0.7.4. No se aplicó esa actualización general. La comprobación offline utiliza el catálogo local y no detecta discrepancias, aunque advierte que esa validación offline es limitada. La compatibilidad práctica de esta entrega debe apoyarse en la compilación y las pruebas Android registradas, no únicamente en ese comando.

La raíz de Gesture Handler está dentro del modal del mapa. Pan y pinch son simultáneos y compiten con tap; los umbrales evitan seleccionar una estación al arrastrar. Reanimated transforma una vista SVG memorizada desde el hilo UI; sólo la selección llega a JS, sin reconstruir estaciones por cada frame. Se limita la cámara entre encuadre completo y escala 2; los controles ofrecen acercar, alejar y recuperar encuadre. No hay WebView ni motor geográfico.

## Preservación y compilación

La entrada Mapa es adicional a la home. El controlador de favoritos se pausa al abrir el mapa y se reanuda al volver. Los registros de widget y ConfigScreen se conservan. No hay cambios de iconos, credenciales de distribución ni aplicación original.

Se utiliza `scripts/compilar-pruebas.ps1` sin `--clean`, entorno aislado existente, `com.metrobilbao.widget.pruebas` y exclusivamente el keystore de pruebas. Todas las instalaciones y acciones Android se dirigen explícitamente a `emulator-5556`. No se publica ni se hace push/merge. Los APK de recuperación y fase 1 siguen separados.

## Validación por etapas

La integración de consultas se habilita después de comprobar el primer APK de mapa nativo en Android. Los resultados, capturas, artefactos y pendientes se registran en los apartados siguientes al completar cada etapa.

### Etapa A completada antes de conectar consultas

APK de recuperación nativo: `C:/Users/W11/AMetro/artifacts/androidmetro-mapa-stage-a-test.apk`, SHA-256 `c7d84a2ca84cc0c29002b2f52d18d50f0e3d14fdde292b3fa4ae2d2af5c9d0fa`. Incluye únicamente la selección del mapa, sin consultas desde él. Firma de pruebas existente verificada. La primera compilación permitió detectar y corregir el centrado de zoom antes de este APK.

Comprobaciones reales en Android API36: vista completa L1/L2, bifurcación, ambos ramales, ausencia L3; pellizco con MotionEvents de dos punteros Android, arrastre, ampliación/alejado/encuadre, pulsaciones Erandio/Urbinaga, intercambio, reset, búsqueda Deusto y Eliptikoa, toque ambiguo con candidatas y selección Plentzia. Fuente 100/150 %, retrato 1080×2400 y 900×2000 a 420dpi, paisaje 2400×1080. Se habilita la orientación `default` de Expo para permitir la rotación requerida; listas y home conservan su funcionamiento. Cambiar font_scale desde ADB recrea la actividad en este entorno; se reabre Mapa para probar la nueva escala.

Gfxinfo, tras reset y una muestra de pellizco/arrastre: 57 frames, mediana 8 ms, p90 17 ms, p95 18 ms, 4 frames tardíos (7,02 %), ningún frame de hilo UI lento. Es una muestra corta del emulador, no una garantía de 60fps en móviles. Archivo bruto `C:/Users/W11/AMetro/evidencias/mapa-android/gfx-stage-a.txt`.

Home con tres trenes y acceso a ocho resultados reales comprobada. Widget existente muestra STZ/MOY, ocho trenes y colección desplazable. Persistencia, migración, diez favoritos, consultas y aislamiento pasan los scripts de regresión. Los 1722 pares dirigidos del grafo tienen camino físico; esas pruebas no equivalen a 1722 consultas reales.

Dos intentos iniciales del controlador externo de pellizco fallaron (argumento PowerShell y API InputManager sin contexto); se corrigió el controlador para InputManagerGlobal y CLASSPATH. No eran fallos de la aplicación y no se cuentan como validaciones positivas. Algunas capturas inmediatas durante repintado Android eran incompletas; se conservan fuera del repositorio como registro bruto y se seleccionan capturas estables.
