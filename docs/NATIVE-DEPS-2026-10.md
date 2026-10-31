# Ajuste de parches de Expo SDK 58

El 31 de octubre de 2026, el control oficial `expo install --check` recomendó cinco parches compatibles. Se ajustaron juntos por pertenecer al mismo SDK; no se añadieron librerías funcionales de terceros ni un SDK publicitario. El lockfile fue generado por npm y revisado: 35 paquetes cambiados y 16 entradas retiradas, principalmente dependencias de Expo, React Native y sus herramientas. React Native permanece fijado exactamente.

| Dependencia | Anterior | Candidata |
| --- | --- | --- |
| Expo | 58.0.21 | 58.0.22 |
| @expo/ui | 58.0.25 | 58.0.26 |
| expo-router | 58.0.28 | 58.0.29 |
| expo-sqlite | 58.0.14 | 58.0.15 |
| react-native | 0.88.0 | 0.88.1 |

Se revisaron las notas oficiales y las incluidas en los paquetes del registro npm. UI 58.0.26 incorpora `accessibilityLabel` para `TextInput` universal; los campos de FinFlow ahora lo declaran. El cambio de DateTimePicker a selecciones nulas no afecta estos campos, que usan texto validado. SQLite 58.0.15 reduce la biblioteca Android y no introduce una migración de los datos de FinFlow. React Native 0.88.1 corrige, entre otros casos, medición y dibujo de texto en Android; no cambia el identificador de aplicación ni su clave de firma.

La copia corta de compilación pasó `expo install --check` con «Dependencies are up to date». Se sincronizaron el manifiesto y lockfile con el proyecto principal y se reparó allí la instalación incompleta anterior. Se repetirán TypeScript, compatibilidad y contenido del APK con este conjunto antes de publicar. El uso de la misma versión principal del SDK no acredita una prueba física.

Fuentes primarias: [registro oficial UI 58.0.26](https://registry.npmjs.org/@expo/ui/58.0.26), [registro oficial SQLite 58.0.15](https://registry.npmjs.org/expo-sqlite/58.0.15), [notas de React Native 0.88.1](https://github.com/react/react-native/releases/tag/v0.88.1), [control de dependencias con Expo CLI](https://docs.expo.dev/more/expo-cli/#install).
