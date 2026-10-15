# AndroidMetro

Aplicación independiente **no oficial**, sin afiliación ni respaldo de Metro Bilbao. Consulta próximos trenes desde la app, guarda hasta diez favoritos y, si lo deseas, añade widgets con selección independiente y lista completa de resultados. Incluye mapa interactivo L1/L2 con búsqueda por nombre, zoom y selección de origen/destino. El mapa permanece en la aplicación.

Los horarios proceden del [servicio de Metro Bilbao](https://www.metrobilbao.eus/). Cada consulta indica su fecha; una caché o estimación puede quedar obsoleta. El recorrido resaltado en el mapa representa conectividad física, sin garantizar tren directo ni contemplar incidencias. Contrasta el servicio con el operador antes de viajar.

## Instalación y actualización

Descarga sólo el APK estable de [Releases](https://github.com/Kerzzq/AndroidMetro/releases). Android 7.0/API24 o posterior. Para actualizar la versión oficial, instala el APK sobre la instalación anterior **sin desinstalar ni borrar datos**. Debe conservar el paquete `com.metrobilbao.widget` y su certificado original. Las pre-releases `.pruebas` son instalaciones separadas: sus favoritos no se transfieren automáticamente a la oficial.

**2.0.0 aún no se ha publicado:** el candidato firmado con el certificado original y su actualización desde 1.0.0 se documentan en el [informe de entrega previa](docs/INFORME_FINAL_RELEASE_2.0.0.md). La publicación requiere aprobación del propietario; app.json no es un anuncio de release.

## Privacidad y permisos

Favoritos, nombres y cachés se guardan localmente en el almacenamiento privado de Android, sin cifrado adicional. Las copias de seguridad del sistema pueden incluirlos. No requiere GPS, contactos, cuenta de usuario ni acceso a archivos compartidos. Consulta trenes por HTTPS; el operador recibe los códigos de origen/destino y la información normal de una petición de red. Widget y tareas de Android necesitan acceso a red y permisos de trabajo/arranque del sistema.

## Desarrollo y verificación

Node24, npm10, JDK17, Android SDK/Build Tools36, NDK27.1.12297006. Dependencias fijadas por `package-lock.json`; ejecutar `npm ci` y `npm test`. No ejecutar `npm audit fix --force` para silenciar avisos del tooling. La configuración Android se genera con Expo55; cambios nativos de release deben estar en plugins versionados para que el código sea reconstruible desde Git.

`scripts/activar-entorno.ps1` facilita el entorno Windows local. `scripts/compilar-pruebas.ps1` construye **exclusivamente la variante de pruebas**. No usarlo para distribución oficial. El plugin de seguridad impide que la plantilla de producción se firme silenciosamente con la clave debug: una compilación local release queda sin firmar hasta utilizar explícitamente la clave original verificada. EAS debe usar las credenciales existentes del proyecto, nunca generar reemplazo automáticamente.

## Fuentes y derechos

Mapa esquemático dibujado con geometría propia a partir de la topología y nombres públicos de la red. Fuentes y comprobaciones en [investigación](prototypes/mapa-interactivo/INVESTIGACION.md) y [estaciones](prototypes/mapa-interactivo/ESTACIONES.md). No se redistribuye el plano oficial ni SVG ajeno. Los nombres de operadores y estaciones se usan como referencia informativa. El icono minimalista fue aportado para AndroidMetro por su propietario; no es un sello oficial.

Las dependencias conservan sus licencias y avisos en `THIRD_PARTY_NOTICES.txt`, incluido también como recurso del APK generado cuando el archivo está presente. Esta atribución no implica licencia del operador para sus imágenes, marcas o API ni concede por sí misma una licencia al código propio del proyecto.
