<?php
/**
 * Backup automático - gera JSON com cópia dos dados (clientes + config).
 * Uso: agendar no cron para rodar diariamente, ou chamar com token de autenticação.
 * Exemplo cron (diário às 3h): 0 3 * * * php /caminho/para/sys-scooter/api/backup.php
 * Ou via HTTP: GET api/backup.php?token=SEU_TOKEN_SECRETO
 */
$dataDir = __DIR__ . '/../data';
$backupsDir = $dataDir . '/backups';
$clientsFile = $dataDir . '/clients.json';
$configFile = $dataDir . '/config.json';

// Token opcional para chamada HTTP (defina um segredo e use ?token=xxx)
$BACKUP_SECRET = 'cert-mobility-backup-' . (function_exists('gethostname') ? gethostname() : 'default');

function readJsonFile($path, $default = null) {
  if (!file_exists($path)) return $default;
  $raw = @file_get_contents($path);
  if ($raw === false) return $default;
  $data = @json_decode($raw, true);
  return $data !== null ? $data : $default;
}

// Chamada via HTTP: validar token
if (php_sapi_name() !== 'cli') {
  header('Content-Type: application/json; charset=utf-8');
  $token = isset($_GET['token']) ? $_GET['token'] : (isset($_SERVER['HTTP_X_BACKUP_TOKEN']) ? $_SERVER['HTTP_X_BACKUP_TOKEN'] : '');
  if ($token !== $BACKUP_SECRET) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Não autorizado']);
    exit;
  }
}

if (!is_dir($dataDir)) {
  if (php_sapi_name() !== 'cli') {
    echo json_encode(['ok' => false, 'error' => 'Pasta data não existe']);
    exit;
  }
  return;
}

$clients = readJsonFile($clientsFile, []);
$config = readJsonFile($configFile, []);
if (!is_array($clients)) $clients = [];

$payload = [
  'version' => 1,
  'backupAt' => date('c'),
  'clients' => $clients,
  'config' => $config
];

if (!is_dir($backupsDir)) {
  @mkdir($backupsDir, 0755, true);
}
if (is_dir($backupsDir) && is_writable($backupsDir)) {
  $filename = 'backup-' . date('Y-m-d-His') . '.json';
  $path = $backupsDir . '/' . $filename;
  $written = @file_put_contents($path, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
  if ($written !== false && php_sapi_name() !== 'cli') {
    echo json_encode(['ok' => true, 'file' => $filename]);
    exit;
  }
}

if (php_sapi_name() !== 'cli') {
  echo json_encode(['ok' => true, 'message' => 'Backup gerado em memória (pasta backups não gravável)']);
}
