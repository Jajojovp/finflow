<?php
// Rendered once into the deployment artifact with a random setup-token hash.
// No Google credential is included in this file or in the deployment archive.
declare(strict_types=1);
require __DIR__ . '/lib.php';
header('Cache-Control: no-store');
header('Content-Type: application/json');
ini_set('display_errors', '0');
try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || ($_SERVER['HTTPS'] ?? '') !== 'on' || !hash_equals('__SETUP_HASH__', hash('sha256', $_SERVER['HTTP_X_SETUP_TOKEN'] ?? ''))) { http_response_code(404); exit; }
    $path = ff_private() . '/config.json';
    if (is_file($path)) { http_response_code(409); exit; }
    $value = json_decode(file_get_contents('php://input', false, null, 0, 8192), true, 8, JSON_THROW_ON_ERROR);
    if (($value['project_id'] ?? '') !== 'finflow-513111' || !preg_match('/^[0-9]+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/D', $value['client_id'] ?? '') || strlen($value['client_secret'] ?? '') < 16) { http_response_code(400); exit; }
    $f = fopen($path, 'x');
    if (!$f) throw new RuntimeException('Already configured');
    chmod($path, 0600);
    fwrite($f, json_encode(['project_id' => $value['project_id'], 'client_id' => $value['client_id'], 'client_secret' => $value['client_secret']], JSON_THROW_ON_ERROR)); fclose($f);
    @unlink(__FILE__);
    echo '{"configured":true}';
} catch (Throwable $e) { http_response_code(503); echo '{"configured":false}'; }
