# Acceso con Google

Proyecto autorizado: `finflow-513111`. Dominio canónico: `https://finflow.sysora.io`.
Cliente OAuth de tipo web; origen autorizado canónico y retorno exacto:
`https://finflow.sysora.io/auth/index.php?action=callback`.

Permisos: `openid email profile`. Sin Gmail, Drive, movimientos financieros ni acceso sin conexión. Se utiliza el flujo de código con PKCE S256 y estado de un solo uso ligado a la sesión. El servidor obtiene la identidad desde el endpoint UserInfo de Google con el token recién canjeado; no decodifica ni confía en JWT sin verificar. Los tokens de Google se descartan tras el acceso.

La web utiliza una cookie `__Host-finflow`, Secure, HttpOnly, SameSite=Lax, rotada al acceder. La sesión dura ocho horas y el cierre exige origen y token CSRF. Android abre el navegador del sistema y recupera la sesión mediante un intento de cinco minutos ligado a un verificador aleatorio conservado solo en memoria. El navegador entrega a la app un código de retorno distinto, también de un solo uso. Recuperar la sesión exige tanto ese código como el verificador de la app; conocer únicamente el enlace de acceso no permite recuperarla. Cada intento se consume una vez. La sesión nativa dura ocho horas mientras la app está abierta y no se persiste en disco. El usuario puede continuar sin cuenta en modo local.

La identidad no sincroniza finanzas. Cada identidad tiene un espacio local separado; entrar o salir conserva el espacio anterior y carga el correspondiente. No se importan automáticamente los datos del modo local a una cuenta.

El cliente secreto se provisiona por HTTPS una sola vez y se almacena en `.finflow-auth/config.json`, fuera de `public_html`, con permisos 0600. No se incluye en JavaScript, APK, Git ni archivos de despliegue. El instalador temporal utiliza un secreto de un solo uso, rechaza reemplazar una configuración existente y se elimina después de configurarla. No se registran códigos, tokens ni secretos en los logs.

Los registros temporales de acceso tienen caducidad, limitación de frecuencia y limpieza acotada. No contienen movimientos financieros. El hosting necesita PHP 8.1+, cURL y mbstring. Sites conserva el frontend y envía el acceso al dominio canónico, ya que este backend PHP se ejecuta en Hostinger.

Fuentes: [Google OAuth para aplicaciones web](https://developers.google.com/identity/protocols/oauth2/web-server), [OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).
