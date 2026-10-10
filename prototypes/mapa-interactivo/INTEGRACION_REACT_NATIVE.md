# Preparación para la fase 2B · sin implementación Android

10-10-2026. Fuente de verdad: código y dependencias instaladas en `C:/Users/W11/AMetro/baseline`, base `8bd08d8`. Se inspeccionaron `package.json`, `package-lock.json`, los `package.json` instalados, `node_modules/expo/bundledNativeModules.json` y `android/gradle.properties`.

## Compatibilidad nominal comprobada

Expo **55.0.2**, React Native **0.83.2**, React **19.2.0**, Fabric/New Architecture y Hermes activados. Ninguna de las cuatro bibliotecas siguientes está instalada ni aparece como dependencia en el lockfile.

| Biblioteca | Versión que declara el Expo instalado | Evidencia y papel futuro |
|---|---|---|
| `react-native-svg` | 15.15.3 | [Expo SDK 55](https://docs.expo.dev/versions/v55.0.0/sdk/svg/) y [README de la versión exacta](https://github.com/software-mansion/react-native-svg/blob/v15.15.3/README.md): la rama 15.13+ admite RN 0.78+ y Fabric. Render nativo de Path/Circle/G/Text. |
| `react-native-gesture-handler` | ~2.30.0 | [Expo SDK 55](https://docs.expo.dev/versions/v55.0.0/sdk/gesture-handler/) y [requisitos del proveedor](https://docs.swmansion.com/react-native-gesture-handler/docs/2.x/fundamentals/installation/). Pan, pinch y tap con relaciones explícitas; raíz de gestos dentro de un modal si se utiliza. |
| `react-native-reanimated` | 4.2.1 | [Expo SDK 55](https://docs.expo.dev/versions/v55.0.0/sdk/reanimated/) y [compatibilidad de 4.2.1](https://github.com/software-mansion/react-native-reanimated/blob/4.2.1/packages/react-native-reanimated/compatibility.json): RN 0.83 y Worklets 0.7.x con Fabric. Transformación de cámara en hilo UI. |
| `react-native-worklets` | 0.7.2 | Dependencia necesaria de Reanimated 4, versión registrada en el Expo local. La documentación actual puede recomendar otro patch de 0.7.x; confirmar con el SDK realmente instalado al iniciar 2B. |

Esto verifica compatibilidad declarada con **nuestras versiones**, no una compilación ni un ensayo Android. En 2B se deberán fijar versiones con el resolvedor de Expo y comprobar el build de pruebas existente, sin actualizar Expo por conveniencia. No se ha instalado, compilado ni cambiado configuración durante 2A.

Recomendación: SVG + Gesture Handler + Reanimated/Worklets para el conjunto completo pan/pinch/tap. La transformación debe afectar al grupo del mapa, sin regenerar 49 nodos por cada movimiento. Memoizar geometría/etiquetas; actualizar sólo selección y ruta al cambiar estaciones. Evitar rasterizar el esquema o animar individualmente todos sus textos.

Alternativa sencilla: SVG + `PanResponder` / `Animated` y botones de zoom, sin motor adicional de gestos. Puede servir para un primer ensayo aislado, pero habría que implementar y probar composición multitáctil, cancelación, límites y coordinación con accesibilidad. `ScrollView` horizontal por sí solo no resuelve pellizco bidimensional en Android. WebView permitiría reutilizar HTML, pero introduce otro runtime, puente de selección, foco y accesibilidad web; además no está instalada. No es la opción recomendada.

## Adaptación del modelo y del SVG

Reutilizar estaciones, IDs, posiciones, líneas, tipo de enlace y fuentes de `map-data.json`. Mantener `androidMetroId` y el código de consulta como conceptos explícitos; L3 no debe transformarse en CAV por aproximación de nombre. La elegibilidad es conservadora y la admisión real sigue dependiendo del servicio.

Portar los elementos a componentes `Svg`, `G`, `Path`, `Circle`, `Rect`, `Text` y `TSpan`. DOM, hojas CSS, `PointerEvent`, `ResizeObserver`, `getBBox`, `aria-*`, `title` y `classList` del HTML **no** se trasladan literalmente a React Native. Colores y medidas serán props/tema. El algoritmo puro de selección/recorrido puede conservarse; el renderer de strings y la cámara DOM deberán sustituirse.

La capa de objetivos táctiles debe calcularse en **dp de pantalla**, no en unidades de SVG que se encogen al alejar. Mantener unos 48 dp en la condición de detalle y resolver ambigüedad cuando se solapen en la vista completa. Los 48 CSS px comprobados en navegador no prueban ese resultado en Android. Foco, fuente escalada y etiquetas bilingües podrían requerir un layout distinto al de escritorio.

Para TalkBack: nombres, línea, operador, origen/destino y estado de cobertura; controles accesibles para editar e intercambiar; alternativa de selección por nombre y navegación sin gestos de precisión. Anunciar cambios una vez, no en cada frame. Usar letras O/D y formas, además del color. Verificar si agrupar nodos SVG funciona adecuadamente con Fabric/TalkBack; si no, mantener una lista/selector nativo accesible como vía principal equivalente.

## Entrada «Mapa» y consulta temporal

Conservar `ConsultationScreen` como home y añadir una entrada «Mapa». La arquitectura actual usa modales y no necesita una biblioteca de navegación nueva para esta fase. Preservar `{from,to}` y cámara en estado de pantalla al ir a detalle y volver; el borrador del mapa no es un favorito persistido.

Tras seleccionar dos códigos válidos L1/L2, «Consultar» deberá pasar una ruta efímera `{from,to}` a `trainService.queryTrains`, incluyendo éxito, vacío, error y caché. Reutilizar el detalle de trenes con **todos** los resultados y las preferencias existentes. El detalle está actualmente dentro de `ConsultationScreen`; en 2B convendrá extraer su presentación a un componente compartido antes de añadir otro flujo. `consultationController` está orientado a favoritos y no debe recibir un favorito ficticio para consultar esta ruta.

Descartar respuestas tardías si cambian origen/destino o se abandona la pantalla, reutilizando las garantías del servicio y el patrón de generaciones del controlador. Mantener timeout, deduplicación, contrato normalizado y etiquetas temporales actuales. Respuesta vacía válida sigue siendo distinta de fallo. El resaltado estático del grafo no valida la respuesta ni garantiza viaje directo.

«Guardar favorito» deberá reutilizar `favoritesModel` y `favoritesRepository`: máximo diez, duplicados por ruta dirigida, alias, ID nuevo y persistencia actuales; validar primero el trayecto con el servicio como hace el editor. Refrescar la home y sincronizar widgets por el mecanismo existente. Nunca guardar al completar automáticamente la segunda pulsación. L3 y recorridos mixtos mantendrán consulta/guardado deshabilitados con explicación, hasta que una fase específica los soporte.

## Qué falta para L3

Verificar feed o servicio autorizado de Euskotren, IDs oficiales de paradas/andenes, datos de tiempo real frente a horarios planificados, licencia, actualización, disponibilidad, sentido y contrato temporal. Estudiar Moveuskadi/GTFS como candidato, sin asumir que `ZZ*` es un `stop_id` de ese feed. Para recorridos mixtos harán falta consultas por operador y planificación del transbordo; no sumar horas ni duraciones inventadas. Ese trabajo no está incluido en el contrato actual.

## Widget y validación Android futura

El widget puede reutilizar nombres/códigos y elegibilidad para describir una ruta. Su implementación actual usa RemoteViews y colecciones rasterizadas; no puede presumirse un SVG multitáctil como en una pantalla React Native. Una futura acción del widget podría abrir «Mapa» en la app; no se propone incrustar este navegador ni implementar ese flujo ahora.

Antes de conectar servicios en 2B: construir la pantalla aislada y medir pan/pinch/tap en el emulador de pruebas, distintos anchos y densidades, fuente 100/150/200 %, TalkBack, rotación, Atrás, cancelación de gestos, retorno de segundo plano y rendimiento con selección simultánea. Medir fluidez y asignaciones, no inferirlas de las 49 estaciones. Confirmar los recursos e iconos intactos y probar regresiones de home, favoritos y widgets. La prueba física de móvil deberá autorizarse en esa fase; 2A no la realiza.
