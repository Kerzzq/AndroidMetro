# Publicación del APK de mapa interactivo

El propietario autoriza, después de finalizar la fase 2B, crear el commit de publicación y subir el APK a GitHub Releases siguiendo las pre-releases anteriores. Esta autorización posterior permite publicar la rama `feature/mapa-interactivo-android`; no implica merge a `main` ni firma de distribución.

Se publica el APK autónomo ya compilado y validado en el emulador, sin modificarlo ni reconstruirlo:

- Archivo: `androidmetro-mapa-android-test.apk`, 78 688 820 bytes.
- SHA-256: `f8504a3977450a54e02b0bceb4141071318b865042dbb599547f14ff07d34b2c`.
- ApplicationId: `com.metrobilbao.widget.pruebas`, versionName 1.0.0 / versionCode 1.
- Certificado de pruebas SHA-256: `5822756d7982c9c612d283f007d55f08e62b7a4224cc9b5b9409b1297891026d`.
- Tag: `androidmetro-2.0-mapa-interactivo-pruebas`, asociado al commit de publicación de la rama.
- Título: **AndroidMetro 2.0 · Mapa interactivo (pruebas)**.
- Descripción breve: **Mapa interactivo L1/L2, consultas de trenes y favoritos. APK de pruebas independiente: conserva tu app original.**

La release se prepara como borrador, se sube el asset y se comprueban su tamaño y digest SHA-256 antes de publicarla como pre-release, sin marcarla como latest. Se conservan las releases anteriores. El APK se adjunta a Releases, no se añade al historial Git; tampoco se suben keystores, credenciales o dependencias generadas. La autenticación existente de Git Credential Manager se usa únicamente contra GitHub y no se guarda en el repositorio ni en esta documentación.

Los commits de integración y validación anteriores son `34fc89a`, `71e11fe` y `e82b1fd`. `main` permanece en `339def20985e0fc2f2493ed593836472c96240b5`. El resultado remoto de rama, tag, publicación y asset se verifica después de subirlos y se comunica en el chat.

- [Pre-release del mapa](https://github.com/Kerzzq/AndroidMetro/releases/tag/androidmetro-2.0-mapa-interactivo-pruebas)
- [Rama de integración](https://github.com/Kerzzq/AndroidMetro/tree/feature/mapa-interactivo-android)
- [Arquitectura y validación Android](ANDROIDMETRO_2_FASE2B.md)
