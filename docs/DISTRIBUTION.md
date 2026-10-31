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

El configurador local también utiliza `cxx/` en la raíz como directorio temporal nativo y limita `CMAKE_OBJECT_PATH_MAX` a 240 para que CMake acorte mediante hashes los nombres generados. Esto evita que los componentes de código generado excedan el límite de Ninja en Windows; no requiere modificar la configuración global del sistema.

El script genera una clave RSA propia de FinFlow si todavía no existe; reutiliza la existente en futuras compilaciones. La guarda en `%USERPROFILE%/.finflow/signing/`, con acceso restringido al usuario actual y contraseña protegida con DPAPI de Windows. No se envía a Expo, GitHub ni al hosting y no se incluye en el repositorio. Antes de reinstalar Windows o migrar de ordenador, el titular debe respaldar la clave y sus credenciales de forma segura para conservar la posibilidad de actualizar la app.

Para reanudar una compilación interrumpida sin regenerar el proyecto nativo puede utilizarse `-SkipPrebuild`. En equipos con poca memoria se puede añadir `-NoMinify`: omite R8 y la reducción de recursos, genera un archivo más grande y conserva una compilación release firmada. Esta entrega utiliza esa opción local.

La compilación `release` utiliza esa clave y verifica la firma del APK contra el certificado esperado. No utiliza la clave de depuración del ejemplo Expo. El resultado ARM64 y su recibo se guardan en `outputs/android/`; la verificación en teléfono físico sigue siendo un paso separado.

Para publicar un APK verificado, se copia a `public/downloads/finflow-VERSION.apk` y se actualiza `public/descargar/releases.json` con los datos del recibo, la URL y `status: available`. El archivo binario está excluido de Git, pero debe incluirse en el artefacto estático que se publica. No se activa una descarga para un archivo ausente, sin firma verificada o con metadatos incompletos.

## APK publicado · 30 de octubre de 2026

Android 1.1.0, `io.sysora.finflow`, versión interna 3, ARM64, 45.799.045 bytes. El APK release se compiló del commit `a532493a4e8abf5f149b1025639682bb59a83760`, con firma propia RSA de 3072 bits y esquema v2. Se verificaron la firma, el certificado esperado, el alineamiento de 16 KB, los metadatos y el bundle embebido. No es depurable.

- Archivo: https://finflow.sysora.io/downloads/finflow-1.1.0.apk
- SHA-256: `1cc26d84376d047c41f447bb97ae58a99d561802708165fd69e97abcdd5a7ede`
- Certificado SHA-256: `4420a145b7a3ecb0b505980eb85b400e452b4cb7e37885ad3590d91a96ff1d66`

Esta versión incorpora el selector buscable de 176 monedas, con CLP, ARS, USD y CAD entre las primeras opciones. Conserva la corrección de NativeTabs con `expo-symbols` (~58.0.4). Se comprobaron el selector, los códigos solicitados, el renderizador y la fuente Material Symbols incrustada en el APK.

Verificación adicional con Python 3: `python mobile/scripts/verify-android-artifact.py RUTA_APK RUTA_RECIBO`. El build y el verificador rechazan los APK anteriores, un archivo de un build anterior o una versión distinta de `app.json`.

La instalación, los controles nativos y el retorno de Google en teléfono físico siguen pendientes de validación. Los enlaces de 1.0.0 y 1.0.1 redirigen a 1.1.0. El catálogo de descargas se sirve sin caché.

## Crecimiento · APK 1.2.0 preparado

Compilación local completada y verificada el 30 de octubre de 2026: versión interna 4, ARM64, Android 7+, 45.821.533 bytes. Procedencia `08139d88991a7fbe5164b693e5b73b85db62145b`; SHA-256 `782b66b33b5f45981c47e1a9308f868f101b139613bfe3664ac27ff8650f863e`. Mantiene el certificado anterior, firma v2, alineamiento de 16 KB y aplicación no depurable. La comprobación adicional confirma los respaldos v2, revisión CSV, restauración completa, archivo de clientes y fuente Material Symbols embebidos.

El paquete para Hostinger contiene únicamente `downloads/finflow-1.2.0.apk`; los enlaces antiguos redirigirán a esta versión cuando se despliegue. El catálogo preparado coincide con el recibo del build. **La descarga pública nueva todavía no está verificada:** falta completar el acceso a la cuenta de Hostinger que administra sysora.io, publicar y descargar el archivo servido para comparar tamaño y SHA-256. Hasta entonces, la producción canónica conserva 1.1.0 y Sites muestra la nueva descarga pendiente. No se elimina el instalador público anterior antes de comprobar el reemplazo.

La web 2.5.0 de la fase 1 está publicada en el Site privado `https://finflow-open.earlypine4.chatgpt.site`, versión `appgprj_6ae0a6971b148191a0fb73c2d71b8999~appgver_044c921a9c8c81918916d7dcb96991bf`, despliegue `appgdep_6ae53546f8088191a4e456db798d2969`, estado `succeeded`. Su fuente es `7345fb679b0c2b47a5a584619783a8b92e456da1`. La descarga se mantiene pendiente en ese canal hasta que exista el binario canónico.

## iPhone y iPad

Un APK no se instala en iOS. La app Expo ya tiene identificador `io.sysora.finflow`, versión y perfiles de compilación; una distribución nativa mediante TestFlight/App Store requiere configurar la cuenta Apple Developer, el proyecto y la firma. No existe una cuenta Expo o Apple Developer del titular en esta entrega y no se contratan servicios.

La alternativa gratuita es la versión web instalable: manifiesto, iconos y apertura independiente mediante Safari → Compartir → Añadir a pantalla de inicio → Abrir como app web. Necesita internet; no se anuncia funcionamiento sin conexión. Usa el almacenamiento del navegador y no sincroniza automáticamente los datos con SQLite de la app nativa.

`mobile/eas.json` conserva perfiles futuros para APK interno, iOS interno y tiendas. No crea cuentas, proyectos EAS, invitaciones ni publicaciones por sí solo. Una publicación iOS verificada puede activar un enlace oficial de TestFlight o App Store en el catálogo.

## Fuentes

- [Distribución interna de Expo](https://docs.expo.dev/build/internal-distribution/)
- [Firma de Android en React Native](https://reactnative.dev/docs/signed-apk-android)
- [Android CLI oficial](https://developer.android.com/tools/agents/android-cli)
- [Límite de rutas de objetos de CMake](https://cmake.org/cmake/help/latest/variable/CMAKE_OBJECT_PATH_MAX.html)
- [Instalación web en iPhone](https://support.apple.com/guide/iphone/bookmark-a-website-iph42ab2f3a7/ios)
