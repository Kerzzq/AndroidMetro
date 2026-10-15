# Dependencias npm: clasificación por presencia en el bundle

Export Hermes de producción del 15-10-2026; 1149 módulos de source map. Esto no sustituye inspección del APK firmado ni demuestra por sí solo alcanzabilidad de una función vulnerable. El lockfile no cambió versiones.

| Paquete | Severidad npm | Módulos en bundle | Evaluación |
|---|---|---:|---|
|@babel/core|low|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|@expo/cli|high|1|Sólo shim metro-require/require.js, no servidor/CLI con avisos.|
|@expo/config|moderate|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|@expo/config-plugins|moderate|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|@expo/local-build-cache-provider|moderate|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|@expo/metro|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|@expo/metro-config|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|@expo/prebuild-config|moderate|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|@jest/environment|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|@jest/fake-timers|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|@jest/transform|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|@react-native/community-cli-plugin|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|@xmldom/xmldom|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|argparse|moderate|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|babel-jest|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|baseline-browser-mapping|moderate|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|brace-expansion|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|braces|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|browserslist|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|compression|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|expo|high|41|Módulos runtime; severidad heredada de dependencias tooling según npm. Revisar ruta, no asignar CVE al paquete completo.|
|expo-constants|moderate|3|Módulos runtime; severidad heredada de dependencias tooling según npm. Revisar ruta, no asignar CVE al paquete completo.|
|image-size|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|jest-environment-node|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|jest-haste-map|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|jest-message-util|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|js-yaml|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|metro|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|metro-config|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|metro-file-map|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|metro-transform-worker|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|micromatch|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|nanoid|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|node-forge|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|picomatch|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|postcss|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|react-native|high|440|Módulos runtime; severidad heredada de dependencias tooling según npm. Revisar ruta, no asignar CVE al paquete completo.|
|shell-quote|critical|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|source-map-js|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|sprintf-js|moderate|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|uuid|moderate|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|ws|high|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|xcode|moderate|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|
|yaml|moderate|0|Sin módulo fuente de ese paquete en este bundle; afecta al árbol de tooling.|

El paquete Expo puede contener copias anidadas de tooling dentro de su carpeta; contar rutas no significa que todo el paquete ni sus advisories se ejecute en la app. shell-quote, ws Node, xmldom, postcss, node-forge, braces y otros paquetes de entrada del tooling no aparecen como módulos fuente en este export. El cliente HTTP/TLS Android sí usa Maven, auditado aparte.
