# Validación del prototipo de navegador

10-10-2026. Resultado reproducible en [VALIDACION.json](VALIDACION.json), script `validate.cjs`. Motor Microsoft Edge/Chromium instalado, ejecución headless en Windows. Apertura real de `index.html` por `file://`; no se requieren peticiones ni paquetes de la app.

## Matriz comprobada

| Ventana CSS | Resultado |
|---|---|
| 360 × 800 | Sin desbordamiento horizontal; controles visibles ≥44 px. |
| 390 × 844 | Vista general y detalle; selección sobre SVG, confirmación de estaciones próximas. |
| 768 × 1024 | Reajuste del mapa; controles y selecciones conservados. |
| 1440 × 900 / 1000 | Vista general, zoom y selecciones en temas claro/oscuro. |
| 844 × 390 | Ventana apaisada; página con desplazamiento vertical normal, sin desbordamiento horizontal. |

Pruebas positivas: 49 IDs únicos y posiciones finitas, 42 códigos admitidos conservadoramente y siete L3 sin `apiCode` validado; secuencias L1/L2 iguales al orden oficial `weight`; grafo de 49 nodos y 48 enlaces conectado; ninguna arista inventada ETX/ZZG; transbordo CAV/ZZC distinto de vía; origen y destino diferentes; corrección de origen conservando destino; intercambio y RESET; selección por nombre y Enter; ruta resaltada y aviso L3; arrastre sin seleccionar; zoom por rueda; pellizco con dos contactos táctiles emulados mediante CDP sin cambiar selección. Sin errores JavaScript de página.

Se comprobaron los 2.352 pares dirigidos distintos del grafo para conectividad, **no** se consultaron esos pares a la API. Las 54 consultas reales de investigación son un conjunto independiente y están descritas en `INVESTIGACION.md`.

## Revisión visual y objetivos táctiles

Se inspeccionaron las capturas generales, móvil, detalle, selección, L3 y oscuro. La iteración corrigió el contraste del tema oscuro, la separación Etxebarri/Ariz, la proximidad de Ansio/Gurutzeta y el corte de palabras en la casilla móvil de Casco Viejo. Las capturas finales se regeneraron después de esos cambios.

La verificación geométrica usa cajas orientadas de las 49 etiquetas SVG, ampliadas 2 unidades por lado para el contorno de texto. Resultado: **cero pares de etiquetas solapadas y cero etiquetas fuera del viewBox**. La revisión visual complementa ese cálculo; el cálculo no certifica toda combinación de fuente externa o navegador.

En el detalle móvil «Bilbao», cada objetivo táctil mide 48 × 48 CSS px y la fuente de estaciones equivale a 17 CSS px. Los centros contiguos del tronco están separados más que esos objetivos. Las estaciones del esquema no comparten coordenadas; los marcadores O/D no solapan estaciones adyacentes en la escala prevista.

En vista general móvil las letras se reducen a unos 3 px: **no es una vista de lectura**. No se afirma que sean legibles a esa escala. El mensaje pide ampliar; una pulsación que alcanza varias estaciones no selecciona ninguna hasta confirmar en botones ≥48 px. Al ampliar se mantiene el tamaño táctil de 48 px recalculando el radio en unidades SVG. Pan/zoom pueden dejar parte del mapa fuera del viewport de forma intencional; eso no es un recorte del SVG exportado.

Hay controles de zonas, zoom, teclado y selección por nombre. No se realizó una auditoría completa con lector de pantalla, contraste WCAG de cada combinación, fuentes sustituidas, todas las escalas intermedias, Safari/Firefox ni dispositivos táctiles físicos. Los eventos táctiles emulados prueban el código de navegador, no los gestos ni el rendimiento nativos.

## Galería de evidencias

| Captura | Contenido |
|---|---|
| [01](captures/01-escritorio-completo.png) | Mapa completo y controles en escritorio, estado vacío. |
| [02](captures/02-seleccion-detalle.png) | Ruta seleccionada y zona ampliada. |
| [03](captures/03-l3-transbordo-oscuro.png) | Tema oscuro, origen en L3 y transbordo resaltado con aviso. |
| [04](captures/04-movil-completo.png) | Ventana de 390 px, mapa completo como orientación. |
| [05](captures/05-movil-seleccion.png) | Detalle móvil, O Abando / D Casco Viejo y etiquetas legibles. |
| [06](captures/06-movil-desambiguacion.png) | Lista de confirmación tras un toque ambiguo en la vista completa. |
| [07](captures/07-svg-general.png) | Exportación completa del SVG a 2420 × 780. |

No se alteraron los píxeles de las capturas. **No se ejecutó ni validó este mapa dentro de AndroidMetro**, no hubo APK, build Android, móvil, widget ni conexión desde el HTML al servicio.
