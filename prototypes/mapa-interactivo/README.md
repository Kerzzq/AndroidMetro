# AndroidMetro 2.0 · Fase 2A

Prototipo de navegador entregado el **10 de octubre de 2026**, pendiente de revisión visual del usuario. Desarrollo en `C:/Users/W11/AMetro/baseline`, rama `feature/mapa-interactivo-prototipo`, desde `feature/app-consulta-trayectos` (`8bd08d8`). Todo el trabajo está en `prototypes/mapa-interactivo/`. La app, el widget, los favoritos y sus dependencias no se modifican.

## Probar el resultado

Abre **[index.html](index.html)** en Edge o Chrome: funciona por `file://`, sin servidor, red ni instalación. También puede servirse localmente desde esta carpeta:

```powershell
node serve.cjs
# http://127.0.0.1:8765
```

El servidor sólo escucha en el propio equipo. Ctrl+C lo detiene. [Galería de capturas](galeria.html), [SVG editable](mapa.svg), [datos](map-data.json), [tabla completa de estaciones](ESTACIONES.md), [investigación](INVESTIGACION.md), [integración futura](INTEGRACION_REACT_NATIVE.md) y [validación](VALIDACION.md).

1. Se abre el mapa completo. En móvil, toca una zona o usa «Bilbao», «Costa» y «Margen izquierda» para ampliarla.
2. Toca una estación: origen **O**, verde. La siguiente estación diferente es destino **D**, azul.
3. Las casillas «Origen · cambiar» y «Destino · cambiar» indican qué selección editar. Después de la selección inicial, las pulsaciones siguen editando destino; si activas origen, editan origen hasta cambiar de casilla.
4. El botón ⇄ intercambia estaciones; RESET borra ambas, sin perder el zoom. El mapa se recupera con «Todo el mapa».
5. Arrastra, pellizca, usa la rueda o +/−. Las flechas del teclado desplazan; Enter/Espacio activan una estación enfocada. «Seleccionar por nombre» ofrece una alternativa al mapa.
6. Si un toque alcanza varias estaciones en la vista general, confirma en la lista de estaciones cercanas. El prototipo no adivina cuál querías.

L3 se puede seleccionar para evaluar la experiencia, pero muestra explícitamente que la cobertura de trenes no está validada. No hay horarios, consultas reales desde el HTML ni guardado de favoritos. La ruta resaltada describe **enlaces físicos y transbordos**, no garantiza un tren directo, el itinerario más rápido ni el estado del servicio.

## Archivos y mantenimiento

| Archivo | Función |
|---|---|
| `build.cjs` | Define las secuencias y coordenadas propias, coteja las fuentes y genera artefactos. |
| `map-data.json` | 49 nodos de selección, 47 enlaces de vía y un transbordo, con evidencias y fuentes. |
| `map-data.js` | Copia generada para abrir HTML offline sin `fetch` ni módulos ES. |
| `map-core.js` | Render SVG y funciones puras de selección/recorrido. Sin DOM en las funciones del modelo. |
| `mapa.svg` | Exportación independiente, texto editable y capas `zones`, `geometry`, `annotations`, `labels`, `route`, `interaction`. |
| `prototype.js` / `prototype.css` | Interacción, cámara, gestos, accesibilidad web y temas. |
| `sources/` | Catálogos de hechos y respuestas de consultas puntuales. No contiene el JPG ni planos oficiales. |
| `captures/` | Siete capturas originales de navegador, sin retoque. |
| `validate.cjs` | Pruebas del grafo, selección, gestos, tamaños y geometría de etiquetas. |

Editar los datos de diseño en `build.cjs` y la representación en `map-core.js`; después `node build.cjs`. No editar solamente `mapa.svg`: una regeneración reemplazaría esos cambios. SVG de aproximadamente **38 KB**, sin textos convertidos a miles de trazados. `map-data.json` mantiene nombres, aliases, códigos, posiciones y fuentes legibles por separado.

Las comprobaciones de navegador usan Playwright **ya incluido en el entorno Codex** y Edge instalado. `node validate.cjs` reproduce la matriz y las capturas; la ruta del runtime está escrita para este equipo y debe adaptarse en otro ordenador. No se añadió un paquete ni un lockfile al prototipo o a la app. El generador y el servidor sólo requieren Node.

## Estado del repositorio y punto de parada

Antes de crear la rama se detectó únicamente `docs/evidencias/app-consulta.zip`, sin versionar. Se preservó fuera del checkout en `C:/Users/W11/Documents/AndroidMetro_Paquete_Completo_Codex/AndroidMetro_Codex/respaldo-app-consulta-pre-mapa.zip`, verificando el mismo SHA-256 `F43A12860005D444806BD0A79BBBED2D5C9CAFE87FD6A8097C5A47C19F61E67D`. La rama se creó con el checkout limpio; no se hizo stash ni se incorporó ese ZIP al prototipo.

La referencia de `main` permanece en `339def20985e0fc2f2493ed593836472c96240b5`. No hay push, merge, APK, instalación en móvil ni uso de credenciales. Los planos oficiales inspeccionados se conservan únicamente como material local de investigación fuera del repositorio; no se distribuyen como recursos del prototipo.

**La fase 2A termina aquí.** Revisar apariencia, tamaño de etiquetas, tratamiento de L3 y selección en navegador antes de autorizar la fase 2B. La recomendación es portar primero el render y los gestos a una pantalla nativa aislada, comprobarlos en Android y sólo después conectar consulta y favoritos.
