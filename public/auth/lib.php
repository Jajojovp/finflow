<?php
declare(strict_types=1);

// Authorization-code flow: Google tokens stay on the server and are discarded
// after retrieving the verified identity from Google's fixed UserInfo endpoint.
const FF_ORIGIN = 'https://finflow.sysora.io';
const FF_CALLBACK = FF_ORIGIN . '/auth/index.php?action=callback';
function ff_b64(string $bytes): string { return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '='); }
function ff_random(): string { return ff_b64(random_bytes(32)); }
function ff_private(): string {
    $dir = getenv('FINFLOW_AUTH_PRIVATE_DIR') ?: dirname(__DIR__, 3) . '/.finflow-auth';
    if (!is_dir($dir) && !mkdir($dir, 0700, true)) throw new RuntimeException('Private storage unavailable');
    return $dir;
}
function ff_config(): array {
    $path = ff_private() . '/config.json';
    if (!is_file($path)) return [];
    $value = json_decode(file_get_contents($path), true, 8, JSON_THROW_ON_ERROR);
    if (!is_array($value) || empty($value['client_id']) || empty($value['client_secret'])) return [];
    return $value;
}
function ff_path(string $type, string $id): string {
    if (!in_array($type, ['attempt', 'token', 'rate'], true)) throw new InvalidArgumentException('Invalid record');
    return ff_private() . '/' . $type . '-' . hash('sha256', $id) . '.json';
}
function ff_write(string $type, string $id, array $value): void {
    $path = ff_path($type, $id);
    $temporary = $path . '.' . bin2hex(random_bytes(8));
    if (file_put_contents($temporary, json_encode($value, JSON_THROW_ON_ERROR), LOCK_EX) === false) throw new RuntimeException('Write failed');
    chmod($temporary, 0600);
    if (!rename($temporary, $path)) throw new RuntimeException('Write failed');
}
function ff_read(string $type, string $id): ?array {
    $path = ff_path($type, $id);
    if (!is_file($path)) return null;
    $value = json_decode(file_get_contents($path), true, 12, JSON_THROW_ON_ERROR);
    if (!is_array($value) || ($value['expires'] ?? 0) < time()) { unlink($path); return null; }
    return $value;
}
function ff_clean(): void {
    // Bounded cleanup of expired authentication records; no financial records.
    foreach (array_slice(glob(ff_private() . '/*-*.json') ?: [], 0, 200) as $path) {
        if (filemtime($path) < time() - 86400) @unlink($path);
    }
}
function ff_rate(string $bucket, int $limit): bool {
    $key = $bucket . ':' . ($_SERVER['REMOTE_ADDR'] ?? '') . ':' . intdiv(time(), 60);
    $path = ff_path('rate', $key);
    $f = fopen($path, 'c+');
    if (!$f || !flock($f, LOCK_EX)) throw new RuntimeException('Rate storage unavailable');
    $value = json_decode(stream_get_contents($f) ?: '{}', true) ?: [];
    $count = (int)($value['count'] ?? 0) + 1;
    ftruncate($f, 0); rewind($f);
    fwrite($f, json_encode(['count' => $count, 'expires' => time() + 120]));
    fflush($f); flock($f, LOCK_UN); fclose($f); chmod($path, 0600);
    return $count <= $limit;
}
function ff_user(array $value): array {
    if (!isset($value['sub'], $value['email']) || !is_string($value['sub']) || !preg_match('/^[a-zA-Z0-9_-]{1,128}$/D', $value['sub']) || ($value['email_verified'] ?? false) !== true || !filter_var($value['email'], FILTER_VALIDATE_EMAIL)) throw new RuntimeException('Unverified Google identity');
    return ['id' => $value['sub'], 'email' => $value['email'], 'name' => mb_substr((string)($value['name'] ?? $value['email']), 0, 120)];
}
function ff_google(string $url, array $form = [], ?string $access = null): array {
    if (!in_array($url, ['https://oauth2.googleapis.com/token', 'https://openidconnect.googleapis.com/v1/userinfo'], true)) throw new RuntimeException('Invalid upstream');
    $curl = curl_init($url);
    $headers = ['Accept: application/json'];
    if ($access !== null) $headers[] = 'Authorization: Bearer ' . $access;
    curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_TIMEOUT => 20, CURLOPT_FOLLOWLOCATION => false, CURLOPT_PROTOCOLS => CURLPROTO_HTTPS, CURLOPT_HTTPHEADER => $headers, CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2]);
    if ($form) { curl_setopt($curl, CURLOPT_POST, true); curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($form)); }
    $raw = curl_exec($curl); $status = curl_getinfo($curl, CURLINFO_RESPONSE_CODE); curl_close($curl);
    if ($raw === false || $status !== 200 || strlen($raw) > 65536) throw new RuntimeException('Google request failed');
    return json_decode($raw, true, 20, JSON_THROW_ON_ERROR);
}
