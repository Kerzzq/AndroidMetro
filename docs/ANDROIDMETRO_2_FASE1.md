# AndroidMetro 2.0 — Fase 1

10 octubre 2026. Rama feature/favoritos-widget-fase1 desde 765e2de. Puntos de recuperación: tags locales recuperacion-baseline-validado (9fab92b) y recuperacion-icono-validado (765e2de). No push/publicación.

## Diseño técnico (etapa A)

- Favoritos globales: documento versionado, hasta 10, IDs estables, origen/destino, alias opcional, orden en array. Escrituras serializadas; copia literal previa de claves legacy; entradas incompletas/no reconocidas conservadas en migración, visibles para reparar. Duplicados de trayecto se consolidan manteniendo copia legacy.
- Estado de instancia: clave por widgetId con favorito seleccionado y vista trains/favorites. Eliminación seleccionada -> primer favorito disponible; edición conserva ID y descarta caché de otro trayecto. Borrado de widget limpia solo su estado.
- Caché por origen/destino: resultado válido completo con fetchedAt, nunca limitar trenes. Errores tipados, timeout 10 segundos, deduplicación de peticiones simultáneas y reutilización breve. Cambiar ruta pinta carga sin trenes anteriores.
- ListWidget 0.20.1 verificado en CollectionView.java, RNWidgetCollectionService.java y RNWidget.java: ListView/RemoteViewsService real, filas rasterizadas y clickActionData. Una colección por vista, tamaño positivo explícito; no listas anidadas. Render por instancia.
- App solicita render por ID usando getWidgetInfo + requestWidgetUpdateById; evitar requestWidgetUpdate global porque su forEach async no espera los callbacks. Selección widget no abre app ni cambia otras instancias.
- Hora prevista conservada como timeRounded de API; time crudo preservado, sin convertir fecha sin offset en instante inventado. Timestamp de consulta generado por el cliente al recibir respuesta. Modo minutos legacy se explica como estimación al consultar, nunca contador.
- Validación de nuevos trayectos: códigos del catálogo, origen distinto de destino y respuesta de API válida (lista vacía válida también admite guardado). Fallo temporal no se interpreta como ruta imposible. No borrar favoritos migrados que requieran revisión.
- Sin mapa, nuevos proveedores, scheduler agresivo, actualización de dependencias ni cambios de icono/firma original.

## Riesgos y validación pendiente

El launcher puede cambiar márgenes, restaurar posición de scroll y diferir eventos. Cada fila se rasteriza: medir listas largas, tamaños y fuente 150 %. ListWidget soporta máximo dos colecciones; usamos una. HeadlessTask tiene límite de 30 segundos: timeout de red 10 s y solo consulta activa. WidgetInfo no incluye fontScale; verificar PixelRatio.getFontScale en Android antes de fijar alturas. API devuelve time sin offset: no se recalculan minutos con suposiciones de zona horaria.

Colecciones Android: https://developer.android.com/develop/ui/views/appwidgets/collections

## Etapas B y C

Implementación y pruebas aún en curso. No declarar completa esta fase por compilación. Se añadirá aquí evidencia real, APK, firma, commits, matriz de pruebas y limitaciones.
