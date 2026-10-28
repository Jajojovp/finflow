# Distribución de FinFlow

La página pública es `/descargar/`, enlazada desde la web y la barra lateral de la aplicación. Mantiene el diseño claro y GSAP. Un instalador solo aparece como descargable cuando el catálogo declara una publicación completa; Android exige URL del mismo dominio o del dominio canónico `finflow.sysora.io`, versión, tamaño y huellas SHA-256 del archivo y su certificado. El Site puede enlazar ese mismo archivo canónico sin duplicar el binario.

## Android sin cuenta Expo

La compilación local utiliza Node 24, OpenJDK 17, Android SDK 37.0, Build Tools 37.0.0, NDK 27.1.12297006 y CMake 3.22.1. Google cambió las herramientas de línea de comandos en octubre de 2026: el Android CLI actual usa rutas de paquete como `platforms/android-37.0`. La licencia del SDK se acepta únicamente después de la autorización de su titular.

El entorno local mantiene las herramientas y su configuración en `%USERPROFILE%/.cache/finflow-android/`. Con ese entorno preparado, desde `mobile/` en PowerShell 7:

`tools-config.json` contiene únicamente las rutas `javaHome` y `androidHome`, por ejemplo `{"javaHome":"C:/tools/jdk-17","androidHome":"C:/tools/android-sdk"}`. Puede utilizarse otra ubicación pasando `-ToolsConfig RUTA` al script.

```powershell
.\scripts\build-android.ps1
```

En Windows, utiliza un checkout con ruta corta, por ejemplo `C:/ffn`, e instala sus dependencias en `mobile/`. Ninja puede fallar al generar archivos C++ si el proyecto está dentro de una ruta larga como Documentos. En esta entrega se utilizó una copia de compilación aislada con el mismo commit; la firma permanece en el directorio privado del usuario.

El script genera una clave RSA propia de FinFlow si todavía no existe; reutiliza la existente en futuras compilaciones. La guarda en `%USERPROFILE%/.finflow/signing/`, con acceso restringido al usuario actual y contraseña protegida con DPAPI de Windows. No se envía a Expo, GitHub ni al hosting y no se incluye en el repositorio. Antes de reinstalar Windows o migrar de ordenador, el titular debe respaldar la clave y sus credenciales de forma segura para conservar la posibilidad de actualizar la app.

La compilación `release` utiliza esa clave y verifica la firma del APK contra el certificado esperado. No utiliza la clave de depuración del ejemplo Expo. El resultado ARM64 y su recibo se guardan en `outputs/android/`; la verificación en teléfono físico sigue siendo un paso separado.

Para publicar un APK verificado, se copia a `public/downloads/finflow-VERSION.apk` y se actualiza `public/descargar/releases.json` con los datos del recibo, la URL y `status: available`. El archivo binario está excluido de Git, pero debe incluirse en el artefacto estático que se publica. No se activa una descarga para un archivo ausente, sin firma verificada o con metadatos incompletos.

## iPhone y iPad

Un APK no se instala en iOS. La app Expo ya tiene identificador `io.sysora.finflow`, versión y perfiles de compilación; una distribución nativa mediante TestFlight/App Store requiere configurar la cuenta Apple Developer, el proyecto y la firma. No existe una cuenta Expo o Apple Developer del titular en esta entrega y no se contratan servicios.

La alternativa gratuita es la versión web instalable: manifiesto, iconos y apertura independiente mediante Safari → Compartir → Añadir a pantalla de inicio → Abrir como app web. Necesita internet; no se anuncia funcionamiento sin conexión. Usa el almacenamiento del navegador y no sincroniza automáticamente los datos con SQLite de la app nativa.

`mobile/eas.json` conserva perfiles futuros para APK interno, iOS interno y tiendas. No crea cuentas, proyectos EAS, invitaciones ni publicaciones por sí solo. Una publicación iOS verificada puede activar un enlace oficial de TestFlight o App Store en el catálogo.

## Fuentes

- [Distribución interna de Expo](https://docs.expo.dev/build/internal-distribution/)
- [Firma de Android en React Native](https://reactnative.dev/docs/signed-apk-android)
- [Android CLI oficial](https://developer.android.com/tools/agents/android-cli)
- [Instalación web en iPhone](https://support.apple.com/guide/iphone/bookmark-a-website-iph42ab2f3a7/ios)
