<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
ini_set('display_errors', '0');
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
session_name('__Host-finflow');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => true, 'httponly' => true, 'samesite' => 'Lax']);
session_start();
$_SESSION['csrf'] ??= ff_random();
function reply(array $body, int $status = 200): never {
    http_response_code($status); header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR); exit;
}
function page(string $title, string $message, bool $native = false, ?string $handoff = null): never {
    header('Content-Type: text/html; charset=utf-8');
    $e = fn(string $v): string => htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $link = $handoff ?? ($native ? 'finflow://more' : '/?app=1');
    echo '<!doctype html><html lang="es"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FinFlow · Cuenta</title><style>body{font:17px -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f7f9fb;color:#26364a;max-width:470px;margin:12vh auto;padding:28px}h1{font-size:32px;letter-spacing:-1px}p{line-height:1.6;color:#627083}a{display:inline-block;background:#3478ee;color:white;text-decoration:none;padding:14px 22px;border-radius:15px;margin-top:20px}small{display:block;margin-top:30px;line-height:1.6}</style><b>finflow.</b><h1>' . $e($title) . '</h1><p>' . $e($message) . '</p><a href="' . $e($link) . '">Volver a FinFlow</a><small>El acceso identifica tu cuenta. Tus movimientos financieros siguen en tu dispositivo; no hay sincronización automática.</small></html>'; exit;
}
function post_body(bool $csrf = false): array {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') reply(['error' => 'Método no permitido.'], 405);
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && $origin !== FF_ORIGIN) reply(['error' => 'Origen no permitido.'], 403);
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 4096) reply(['error' => 'Solicitud demasiado grande.'], 413);
    $raw = file_get_contents('php://input', false, null, 0, 4097);
    if (strlen($raw) > 4096) reply(['error' => 'Solicitud demasiado grande.'], 413);
    $value = json_decode($raw, true, 8);
    if (!is_array($value)) reply(['error' => 'Solicitud inválida.'], 400);
    if ($csrf && ($origin !== FF_ORIGIN || !hash_equals($_SESSION['csrf'], (string)($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')))) reply(['error' => 'Sesión de formulario inválida.'], 403);
    return $value;
}
try {
    $action = (string)($_GET['action'] ?? 'session');
    $config = ff_config();
    if ($action === 'session') {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') reply(['error' => 'Método no permitido.'], 405);
        if (($_SESSION['expires'] ?? 0) < time()) unset($_SESSION['user']);
        reply(['configured' => (bool)$config, 'user' => $_SESSION['user'] ?? null, 'csrf' => $_SESSION['csrf']]);
    }
    if ($action === 'logout') {
        post_body(true); $_SESSION = []; session_regenerate_id(true);
        reply(['ok' => true]);
    }
    if (!$config) reply(['error' => 'El acceso con Google está en preparación.'], 503);
    if ($action === 'begin-native') {
        $body = post_body();
        if (!ff_rate('begin', 8)) reply(['error' => 'Espera un minuto antes de reintentar.'], 429);
        if (!preg_match('/^[A-Za-z0-9_-]{43}$/D', (string)($body['challenge'] ?? ''))) reply(['error' => 'Prueba de acceso inválida.'], 400);
        ff_clean(); $id = ff_random();
        ff_write('attempt', $id, ['challenge' => $body['challenge'], 'expires' => time() + 300]);
        reply(['id' => $id, 'url' => FF_ORIGIN . '/auth/index.php?action=login&attempt=' . $id]);
    }
    if ($action === 'complete-native') {
        $body = post_body();
        if (!ff_rate('complete', 12)) reply(['error' => 'Espera un minuto antes de reintentar.'], 429);
        $id = (string)($body['id'] ?? ''); $verifier = (string)($body['verifier'] ?? '');
        $code = (string)($body['code'] ?? '');
        if (!preg_match('/^[A-Za-z0-9_-]{43}$/D', $id) || !preg_match('/^[A-Za-z0-9_-]{43,128}$/D', $verifier) || !preg_match('/^[A-Za-z0-9_-]{43}$/D', $code)) reply(['error' => 'Intento inválido.'], 400);
        // Both the app's verifier and the browser's one-use handoff code are required.
        $path = ff_path('attempt', $id); $f = @fopen($path, 'r+');
        if (!$f || !flock($f, LOCK_EX)) reply(['error' => 'El acceso caducó. Vuelve a intentarlo.'], 410);
        $attempt = json_decode(stream_get_contents($f), true) ?: [];
        if (($attempt['expires'] ?? 0) < time() || !hash_equals((string)($attempt['challenge'] ?? ''), ff_b64(hash('sha256', $verifier, true)))) { fclose($f); reply(['error' => 'El acceso caducó o no corresponde a esta app.'], 410); }
        if (empty($attempt['user']) || !hash_equals((string)($attempt['codeHash'] ?? ''), hash('sha256', $code))) { fclose($f); reply(['error' => 'El código de retorno no es válido.'], 400); }
        $token = ff_random(); ff_write('token', $token, ['user' => $attempt['user'], 'expires' => time() + 28800]);
        ftruncate($f, 0); fflush($f); fclose($f); @unlink($path);
        reply(['token' => $token, 'user' => $attempt['user'], 'expires' => time() + 28800]);
    }
    if ($action === 'native-session' || $action === 'native-logout') {
        post_body(); $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (!preg_match('/^Bearer ([A-Za-z0-9_-]{43})$/D', $header, $match)) reply(['error' => 'Inicia sesión de nuevo.'], 401);
        $record = ff_read('token', $match[1]);
        if (!$record) reply(['error' => 'La sesión caducó.'], 401);
        if ($action === 'native-logout') { unlink(ff_path('token', $match[1])); reply(['ok' => true]); }
        reply(['user' => $record['user'], 'expires' => $record['expires']]);
    }
    if ($action === 'login') {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') reply(['error' => 'Método no permitido.'], 405);
        if (!ff_rate('login', 12)) reply(['error' => 'Espera un minuto antes de reintentar.'], 429);
        $id = (string)($_GET['attempt'] ?? '');
        if ($id !== '' && (!preg_match('/^[A-Za-z0-9_-]{43}$/D', $id) || !ff_read('attempt', $id))) page('El acceso caducó.', 'Vuelve a iniciar el acceso desde la app.', true);
        $state = ff_random(); $verifier = ff_random();
        $_SESSION['oauth'] = ['state' => $state, 'verifier' => $verifier, 'attempt' => $id, 'expires' => time() + 300];
        $query = http_build_query(['client_id' => $config['client_id'], 'redirect_uri' => FF_CALLBACK, 'response_type' => 'code', 'scope' => 'openid email profile', 'state' => $state, 'code_challenge' => ff_b64(hash('sha256', $verifier, true)), 'code_challenge_method' => 'S256', 'access_type' => 'online', 'prompt' => 'select_account']);
        header('Location: https://accounts.google.com/o/oauth2/v2/auth?' . $query, true, 302); exit;
    }
    if ($action === 'callback') {
        $oauth = $_SESSION['oauth'] ?? []; unset($_SESSION['oauth']);
        if (empty($oauth['state']) || ($oauth['expires'] ?? 0) < time() || !hash_equals($oauth['state'], (string)($_GET['state'] ?? ''))) { http_response_code(400); page('Acceso no válido.', 'Vuelve a iniciar sesión desde FinFlow.'); }
        if (isset($_GET['error'])) page('Acceso cancelado.', 'Puedes seguir usando FinFlow en modo local.', !empty($oauth['attempt']));
        $code = (string)($_GET['code'] ?? '');
        if ($code === '' || strlen($code) > 2048) throw new RuntimeException('Missing code');
        $tokens = ff_google('https://oauth2.googleapis.com/token', ['code' => $code, 'client_id' => $config['client_id'], 'client_secret' => $config['client_secret'], 'redirect_uri' => FF_CALLBACK, 'grant_type' => 'authorization_code', 'code_verifier' => $oauth['verifier']]);
        if (empty($tokens['access_token']) || ($tokens['token_type'] ?? '') !== 'Bearer') throw new RuntimeException('Missing access token');
        $user = ff_user(ff_google('https://openidconnect.googleapis.com/v1/userinfo', [], $tokens['access_token']));
        unset($tokens);
        if (!empty($oauth['attempt'])) {
            $path = ff_path('attempt', $oauth['attempt']); $f = @fopen($path, 'r+');
            if (!$f || !flock($f, LOCK_EX)) page('El acceso caducó.', 'Vuelve a intentarlo desde la app.', true);
            $attempt = json_decode(stream_get_contents($f), true) ?: [];
            if (($attempt['expires'] ?? 0) < time() || isset($attempt['user'])) { fclose($f); page('El acceso caducó.', 'Vuelve a intentarlo desde la app.', true); }
            $handoff = ff_random(); $attempt['user'] = $user; $attempt['codeHash'] = hash('sha256', $handoff);
            ftruncate($f, 0); rewind($f); fwrite($f, json_encode($attempt, JSON_THROW_ON_ERROR)); fflush($f); fclose($f);
            page('Cuenta conectada.', 'Vuelve a la app FinFlow para continuar como ' . $user['name'] . '.', true, 'finflow://account?' . http_build_query(['attempt' => $oauth['attempt'], 'code' => $handoff]));
        }
        session_regenerate_id(true); $_SESSION['user'] = $user; $_SESSION['expires'] = time() + 28800; $_SESSION['csrf'] = ff_random();
        header('Location: /?app=1', true, 303); exit;
    }
    reply(['error' => 'Ruta no encontrada.'], 404);
} catch (Throwable $e) {
    // Log only a generic incident; never Google tokens, codes or client secrets.
    error_log('FinFlow authentication request failed');
    http_response_code(503);
    if (($_GET['action'] ?? '') === 'callback') page('No pudimos completar el acceso.', 'Reintenta desde FinFlow. Tus datos locales se conservan.');
    reply(['error' => 'No pudimos completar el acceso. Reintenta en unos minutos.'], 503);
}
