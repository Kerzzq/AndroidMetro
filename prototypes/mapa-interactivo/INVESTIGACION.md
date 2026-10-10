# Investigación · Fase 2A

10-10-2026, Europe/Madrid. Se leyeron primero `docs/APP_CONSULTA.md`, `docs/ANDROIDMETRO_2_FASE1.md`, la recuperación del entorno y el código de estaciones, dominio y servicios. Las instrucciones de compilación antiguas son contexto documental; no se ejecutaron para este prototipo.

## Herramientas evaluadas

| Opción | Ventaja concreta | Coste / decisión |
|---|---|---|
| [Rail Map Painter](https://github.com/railmapgen/rmp) | Editor SVG libre, arrastrar estaciones y conectar líneas, exportar SVG/PNG/JSON. | Buen candidato para composición manual. Su JSON visual no aporta nuestros códigos ni cobertura. Habría que reconciliar IDs y datos después de cada exportación. No usado para generar esta entrega. |
| [Rail Map Generator](https://github.com/railmapgen/rmg) | Generación de esquemas con estilos de redes existentes. | Los estilos publicados no incluyen Bilbao; menos adecuado para este esquema completo con tres líneas. No usado. |
| SVG por código | Coordenadas, nodos, líneas, estados y fuentes separados; reproducible y reutilizable en RN. | **Elegido.** Permite conservar los IDs reales y verificar adyacencias sin depender de un editor. |
| [Inkscape](https://inkscape.org/about/) | Ajuste visual de un SVG y edición de capas. | Útil para una revisión manual puntual. No ofrece ventaja para mantener la lógica O/D ni la trazabilidad; no instalado ni requerido. |
| [diagrams.net](https://www.diagrams.net/) | Boceto rápido y exportación SVG. | Reconciliación manual de estaciones e interacción. No reduce el trabajo del modelo. |

RMP/RMG publican su software bajo GPL-3.0. Eso no basta para determinar la licencia de todos los iconos o recursos exportados. No se incorporó código ni iconografía de esas herramientas. La evaluación fue documental, no una sesión completa de edición o una comparación medida de tiempos.

## Fuentes y comprobación de topología

Se comparó la referencia aportada con el [plano incluido en el cartel oficial de enero de 2026](https://cms.metrobilbao.eus/sites/default/files/2026-01/CARTEL%20horarios%20-%20plentzia%20-%20invierno%202026.pdf). Se renderizó el PDF para revisión visual. El [catálogo oficial de estaciones](https://api.metrobilbao.eus/api/stations?page=1&perPage=200) suministró nombres, códigos, líneas y `weight`. Las secuencias de andenes L1/L2 del prototipo coinciden exactamente con sus códigos ordenados por ese campo.

El resultado contiene L1 Plentzia–Etxebarri, L2 Kabiezes–Basauri y el tronco compartido San Ignazio–Etxebarri. El plano incluye también Ibarbengoa, ausente de algunas versiones antiguas. Ariz/Basauri pertenecen nominalmente a L2; algunos servicios L1 pueden prolongarse, por lo que la geometría no se utiliza para prometer servicios directos.

Para L3 se contrastó el orden con el [documento oficial de Euskotren de marzo de 2026](https://www.euskotren.eus/sites/default/files/2026-03/260317%20L3%2030%25.pdf) y los [planos del operador](https://euskotren.eus/fr/l3/planos). El documento de marzo contiene servicios especiales: sólo se usa su orden de estaciones, no sus horarios. Matiko, Uribarri, Zazpikaleak/Casco Viejo, Zurbaranbarri, Txurdinaga, Otxarkoaga y Kukullaga-Etxebarri forman una secuencia independiente.

El plano oficial representa la conexión L1/L2–L3 en Casco Viejo. Se modela como transbordo `CAV ↔ ZZC`, sin duración inventada. No hay una arista Etxebarri–Kukullaga deducida por compartir parte del nombre. Tampoco se añaden conexiones de otras redes ni extensiones fuera del alcance solicitado. Las posiciones son propias y esquemáticas; lo verificado es el orden y la conectividad, no una localización geográfica ni una inspección de vías.

## Catálogos y API: hechos distintos

`src/data/stations.js` tiene **49 códigos**: 42 L1/L2 y siete `ZZ*`. El identificador interno utilizado por favoritos es precisamente `code`; no hay otro ID de estación en el dominio. `routeProblem` sólo comprueba presencia en `STATION_MAP` y estaciones diferentes. Por tanto, admitir un código en ese modelo no demuestra que el proveedor acepte una consulta.

`trainService.js` llama a `https://api.metrobilbao.eus/metro/real-time/{from}/{to}`. `trainModel.js` requiere `trains[]`, `timeRounded` con formato HH:MM y `direction` de tipo string. La investigación comprueba esos campos, sin alterar el contrato ni interpretar un HTTP 200 de cualquier forma como éxito.

Se hicieron **54 solicitudes secuenciales públicas**: una por código y cinco casos adicionales. Resultados completos con URL, fecha UTC, HTTP y cuerpo en [api-probes.json](sources/api-probes.json). Los 42 códigos L1/L2 devolvieron HTTP 200 y el contrato esperado, con destino MOY salvo MOY→ABA. Los siete códigos L3 devolvieron HTTP 500 sin ese contrato. También fallaron ZZC→MOY, MOY→ZZC y ZZA→ZZC. STZ→PLE y PLE→BSR devolvieron HTTP 200 con trenes.

**Conclusión conservadora:** habilitar más adelante la validación de consultas para los códigos L1/L2; mantener L3 sin consulta ni guardado hasta verificar un proveedor adecuado. Un HTTP 500 puntual no demuestra una exclusión permanente del operador. No se probó cada par ni ambos sentidos de los 42 códigos; una respuesta con trenes tampoco demuestra que sean trenes directos hasta el destino. El prototipo no llama a la API y no muestra los horarios capturados.

El [CSV de accesos oficial](https://cms.metrobilbao.eus/get/open_data/estaciones/es) contiene también `ZZ*`, pero no es un contrato de cobertura en tiempo real. Su cabecera declara seis campos mientras las filas contienen siete; el código está en la segunda columna y el nombre del acceso en la tercera. No se reinterpretaron los IDs numéricos de acceso como códigos de estación. El catálogo `/api/stations` devuelve 42 entradas y enumera L3 en `CAV` como agrupación de la conexión; se conservan dos nodos de selección por operador en el mapa.

La [tabla de 49 correspondencias](ESTACIONES.md) y `map-data.json` permiten auditar cada fila. Diferencias actuales de nombre: Bagatza frente a Bagaza en la app, Deustu frente a Deusto, Zazpikaleak/Casco Viejo frente a Casco Viejo y **Eliptikoa frente a Moyua**. Esta última difiere también del plano de enero; se muestran ambos nombres para mantener reconocimiento y trazabilidad. No se modifica el catálogo funcional.

## SVG y datasets existentes

| Recurso | Situación | Decisión |
|---|---|---|
| [Metro Bilbao Red.svg, Laukatu](https://commons.wikimedia.org/wiki/File:Metro_Bilbao_Red.svg) | Trabajo propio del autor, CC BY 4.0; ficha indica actualización de agosto de 2026; unos 258 KB. | Reutilizable cumpliendo atribución/licencia y revisando contenido, no una certificación oficial. No utilizado. |
| [Bilbao Metro Map.svg, Laukatu](https://commons.wikimedia.org/wiki/File:Bilbao_Metro_Map.svg) | CC BY-SA 3.0; versión de 2017; unos 630 KB y textos convertidos a trazados. | Más costoso para IDs, etiquetas accesibles y mantenimiento; no utilizado. |
| CSV / catálogo Metro Bilbao | Datos oficiales de accesos y estaciones, descargables públicamente. | Base de hechos y códigos; fuentes y copias mínimas auditables incluidas. |
| [Moveuskadi / Open Data Euskadi](https://opendata.euskadi.eus/catalogo/-/moveuskadi-datos-de-la-red-de-transporte-publico-de-euskadi-operadores-horarios-paradas-calendario-tarifas-etc/) | Catálogo de transporte con índices GTFS, GTFS-RT, SIRI y NeTEx. | Candidato para estudiar Euskotren en otra fase. La descarga del índice falló en este entorno; no se verificó un feed L3 operativo ni su relación con ZZ*. |

La disponibilidad de formatos de tiempo real en un catálogo general no demuestra que Euskotren aporte un feed utilizable para todas estas estaciones. En una fase futura habrá que inspeccionar agencia, rutas, paradas, calendario, licencia y disponibilidad de actualizaciones del feed concreto.

## Reutilización del plano oficial

Se leyó la [Información legal de Metro Bilbao](https://www.metrobilbao.eus/es/informacion-legal) cargando el contenido JavaScript de la página. Su apartado 5 protege contenidos y presentación, restringe reproducción y transformación sin autorización o permiso legal, y distingue descargas privadas de derechos de redistribución. La [sección Open Data](https://www.metrobilbao.eus/es/open-data) describe publicación automatizada de datos; no se encontró allí una autorización específica para redistribuir la imagen del plano. Euskotren también muestra una restricción de reproducción en el pie de sus planos.

Por ello esta entrega **no contiene `mapa_zonas.jpg`, el PDF oficial, sus píxeles, trazados, logos ni fuentes tipográficas**. El esquema se dibuja con geometría y símbolos propios a partir de hechos de la red, con referencias documentales. La licencia de un SVG de Wikimedia corresponde a ese archivo concreto, no al plano oficial. Antes de incorporar un recurso oficial en una distribución habrá que obtener y guardar su permiso específico o escoger material con licencia compatible y cumplir sus condiciones. Esta investigación no sustituye una autorización del titular.

## Incertidumbres que afectan al diseño

La ruta resaltada es física y estática: sin interrupciones, tiempos, instrucciones de andén ni garantía de tren directo. CAV/ZZC mantienen códigos distintos aunque compartan complejo. Zonas son las del esquema consultado, sin cálculo de tarifas. L3 requiere cobertura independiente. Los aliases actuales requieren una futura decisión de actualización de nombres sin romper códigos ni favoritos. La vista completa horizontal no permite leer 49 etiquetas en un móvil estrecho: ofrece orientación, zoom por zonas y confirmación de toques ambiguos. Los nombres son legibles en la vista de detalle prevista; no se afirma legibilidad en la miniatura completa.
