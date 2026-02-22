<?php
/**
 * API Sys-Scooter - Login, clientes e configuração (dados na hospedagem)
 * Requer PHP 7+. Dados em arquivos JSON na pasta data/ (permissão de escrita).
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

$dataDir = __DIR__ . '/../data';
$clientsFile = $dataDir . '/clients.json';
$configFile = $dataDir . '/config.json';
$sessionsFile = $dataDir . '/sessions.json';

// Credenciais vêm de api/config.php (não versionado). Copie api/config.example.php para config.php.
$VALID_USER = '';
$VALID_PASSWORD = '';
$TOKEN_EXPIRY_DAYS = 30;
$authConfig = __DIR__ . '/config.php';
if (is_file($authConfig)) {
  $cfg = include $authConfig;
  if (is_array($cfg)) {
    $VALID_USER = isset($cfg['user']) ? (string) $cfg['user'] : '';
    $VALID_PASSWORD = isset($cfg['password']) ? (string) $cfg['password'] : '';
    if (isset($cfg['token_expiry_days'])) $TOKEN_EXPIRY_DAYS = (int) $cfg['token_expiry_days'];
  }
}

function ensureDataDir($dir) {
  if (!is_dir($dir)) {
    if (!@mkdir($dir, 0755, true)) {
      return false;
    }
  }
  if (!is_writable($dir)) return false;
  return true;
}

function readJsonFile($path, $default = null) {
  if (!file_exists($path)) return $default;
  $raw = @file_get_contents($path);
  if ($raw === false) return $default;
  $data = @json_decode($raw, true);
  return $data !== null ? $data : $default;
}

function writeJsonFile($path, $data) {
  $dir = dirname($path);
  if (!ensureDataDir($dir)) return false;
  $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
  return file_put_contents($path, $json) !== false;
}

function getBearerToken() {
  $h = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
  if (preg_match('/Bearer\s+(\S+)/', $h, $m)) return $m[1];
  return null;
}

function validateToken($sessionsFile, $token, $validUser, $expiryDays) {
  $sessions = readJsonFile($sessionsFile, []);
  if (!isset($sessions[$token])) return false;
  $s = $sessions[$token];
  if ($s['user'] !== $validUser) return false;
  $exp = strtotime($s['expires']);
  if ($exp < time()) {
    unset($sessions[$token]);
    writeJsonFile($sessionsFile, $sessions);
    return false;
  }
  return true;
}

function jsonResponse($data, $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function jsonError($message, $code = 400) {
  jsonResponse(['ok' => false, 'error' => $message], $code);
}

$input = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $raw = file_get_contents('php://input');
  if ($raw !== '') {
    $input = json_decode($raw, true);
    if ($input === null) $input = [];
  }
  // Se não veio JSON, tentar formulário (alguns servidores alteram Content-Type)
  if (empty($input) && !empty($_POST)) {
    $input = $_POST;
  }
}

$action = isset($_GET['action']) ? $_GET['action'] : (isset($input['action']) ? $input['action'] : '');

switch ($action) {

  case 'login':
    $user = isset($input['login']) ? trim((string) $input['login']) : '';
    $pass = isset($input['password']) ? $input['password'] : (isset($input['senha']) ? $input['senha'] : '');
    $pass = trim(str_replace(["\r", "\n"], '', (string) $pass));
    if ($user === '' || $pass === '') jsonError('Login e senha obrigatórios.', 400);
    if (strtolower($user) !== strtolower($VALID_USER) || strtolower($pass) !== strtolower($VALID_PASSWORD)) {
      jsonError('Login ou senha incorretos.', 401);
    }
    $token = 'auth_' . bin2hex(random_bytes(16));
    $sessions = readJsonFile($sessionsFile, []);
    $sessions[$token] = [
      'user' => $VALID_USER,
      'expires' => date('Y-m-d H:i:s', strtotime("+{$TOKEN_EXPIRY_DAYS} days"))
    ];
    if (!writeJsonFile($sessionsFile, $sessions)) jsonError('Erro ao salvar sessão.', 500);
    jsonResponse(['ok' => true, 'token' => $token, 'login' => $VALID_USER]);
    break;

  case 'getClients':
    $token = getBearerToken();
    if (!$token || !validateToken($sessionsFile, $token, $VALID_USER, $TOKEN_EXPIRY_DAYS)) {
      jsonError('Não autorizado.', 401);
    }
    $clients = readJsonFile($clientsFile, []);
    if (!is_array($clients)) $clients = [];
    jsonResponse(['ok' => true, 'clients' => $clients]);
    break;

  case 'saveClients':
    $token = getBearerToken();
    if (!$token || !validateToken($sessionsFile, $token, $VALID_USER, $TOKEN_EXPIRY_DAYS)) {
      jsonError('Não autorizado.', 401);
    }
    $clients = isset($input['clients']) ? $input['clients'] : null;
    if (!is_array($clients)) jsonError('clients deve ser um array.');
    if (!writeJsonFile($clientsFile, $clients)) jsonError('Erro ao salvar clientes.', 500);
    jsonResponse(['ok' => true]);
    break;

  case 'getConfig':
    $token = getBearerToken();
    if (!$token || !validateToken($sessionsFile, $token, $VALID_USER, $TOKEN_EXPIRY_DAYS)) {
      jsonError('Não autorizado.', 401);
    }
    $config = readJsonFile($configFile, []);
    if (!is_array($config)) $config = [];
    jsonResponse(['ok' => true, 'config' => $config]);
    break;

  case 'saveConfig':
    $token = getBearerToken();
    if (!$token || !validateToken($sessionsFile, $token, $VALID_USER, $TOKEN_EXPIRY_DAYS)) {
      jsonError('Não autorizado.', 401);
    }
    $config = readJsonFile($configFile, []);
    if (!is_array($config)) $config = [];
    if (array_key_exists('whatsappMsg', $input)) $config['whatsappMsg'] = $input['whatsappMsg'];
    if (array_key_exists('diasVencendo', $input)) {
      $v = (int) $input['diasVencendo'];
      $config['diasVencendo'] = ($v >= 0 && $v <= 365) ? $v : 15;
    }
    if (!writeJsonFile($configFile, $config)) jsonError('Erro ao salvar configuração.', 500);
    jsonResponse(['ok' => true]);
    break;

  default:
    jsonError('Ação inválida.', 400);
}
