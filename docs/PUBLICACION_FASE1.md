# Publicación de AndroidMetro 2.0 — Fase 1

10 de octubre de 2026. Rama independiente `feature/favoritos-widget-fase1`; main permanece en `339def20985e0fc2f2493ed593836472c96240b5`. El propietario autoriza publicar la rama y el APK final existente en GitHub Releases. No merge a main ni compilación/firma de distribución.

## Revisión previa

- Árbol limpio inicialmente en 8a2454d. Se incluyen recuperación del entorno (9fab92b), icono aprobado (765e2de), favoritos/API (73086ae), app/widget (8b08d5f), correcciones (34b9ee7), espaciado (699f40c) y documentación/evidencias (8a2454d).
- 85 archivos inicialmente versionados. Ningún APK, AAB, keystore, archivo de entorno, clave privada ni dependencia generada. Revisión de 39 blobs de texto de los commits nuevos: sin tokens GitHub/Slack, claves AWS, encabezados de claves privadas o URLs con credenciales. Se revisaron también scripts, logs y metadatos. Los identificadores públicos EAS, hashes y fingerprints de certificados no son credenciales.
- El script de compilación contiene la contraseña pública estándar `android` para generar una clave EXCLUSIVA de pruebas local. No es una contraseña personal ni de distribución. El archivo de clave no se versiona ni se adjunta a la Release. Las credenciales GitHub quedan en Git Credential Manager, fuera del proyecto.
- `.idea/` estaba heredado de main e incluía una ruta personal y ajustes de IDE. Se retira del árbol de esta rama conservando los archivos locales; se añade su exclusión. No se reescribe el historial original ya público. Se refuerzan exclusiones de `.env`, APK/AAB, keystores y configuración Gradle local.
- `android/`, `node_modules/` y `.expo/` siguen ignorados. Se exportó HEAD a una carpeta temporal y se ejecutó Prebuild de pruebas sin `--clean` ni instalaciones, reutilizando mediante junction las dependencias locales existentes. Se compararon 43 fuentes, recursos y archivos Gradle con el Android validado: cero diferencias y cero archivos ausentes. No hay personalizaciones nativas imprescindibles fuera de los scripts/configuración versionados.
- PNG minimalista y foreground/monochrome incluidos en assets; configuración Expo y Android incluida. La compilación no requiere regenerar el diseño del icono. Lockfile, scripts de entorno/compilación, tres pruebas Node, documentación y capturas están versionados.

## APK que se publica

Pre-release propuesta: `androidmetro-2.0-fase1-pruebas`, vinculada al HEAD de la rama independiente. Se adjunta el APK validado existente, primero a un borrador y después se publica una vez verificado el asset. Se conserva la Release antigua `apk` y no se marca esta pre-release como latest.

- Archivo: `androidmetro-2-fase1-test.apk`, 62.817.128 bytes.
- SHA-256: `f736c922ffa2bce4f442cf3b85adb94f9340f0e93ea0835bb62b04e39ac3754e`.
- Paquete: `com.metrobilbao.widget.pruebas`; versionName 1.0.0 / versionCode 1. AndroidMetro 2.0 identifica la fase del producto; no se ha cambiado la versión interna del APK validado.
- Certificado exclusivo de pruebas SHA-256: `5822756d7982c9c612d283f007d55f08e62b7a4224cc9b5b9409b1297891026d`. Firma v2 comprobada y bundle Hermes integrado.
- El APK no contiene archivos `.env`, keystores o claves privadas. Es autónomo y se instala junto a la app original gracias a su paquete independiente; no es un APK de distribución con las credenciales originales.

Enlaces previstos:

- [Rama](https://github.com/Kerzzq/AndroidMetro/tree/feature/favoritos-widget-fase1)
- [Pre-release](https://github.com/Kerzzq/AndroidMetro/releases/tag/androidmetro-2.0-fase1-pruebas)
- [Documentación técnica](ANDROIDMETRO_2_FASE1.md)
- [Capturas y validación](CAPTURAS_FASE1.md)

La verificación remota posterior al push y a la publicación se entrega en el chat: SHA de rama, SHA de main, Release publicada, tamaño/digest del asset y estado final de Git. No se afirma publicación realizada en este documento preparatorio antes de verificarla.
