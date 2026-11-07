<?php
/* Shared setup for every API file: settings, PDO connection, session, JSON helpers, errors. */
declare(strict_types=1);

const ECOOP_ROOT = __DIR__ . '/../..';
$GLOBALS['CFG'] = require __DIR__ . '/../config.php';
date_default_timezone_set($GLOBALS['CFG']['timezone']);

/* friendly errors: business-rule errors go back to the screen, anything else is logged */
class ApiError extends Exception {
    public string $codeName;
    public int $http;
    /* business-rule answers use HTTP 200 with ok:false (the request itself worked); 401/403/404/500 stay real errors */
    public function __construct(string $message, string $codeName = 'error', int $http = 200) {
        parent::__construct($message);
        $this->codeName = $codeName;
        $this->http = $http;
    }
}

function json_out(array $data, int $http = 200): void {
    http_response_code($http);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, string $codeName = 'error', int $http = 200): void {
    throw new ApiError($message, $codeName, $http);
}

/* run an endpoint: catch ApiError, database rule errors (SIGNAL 45000, CHECK, UNIQUE) and the rest */
function handle(callable $fn): void {
    try {
        $fn();
    } catch (ApiError $e) {
        json_out(['ok' => false, 'error' => $e->getMessage(), 'code' => $e->codeName] + state_if_possible(), $e->http);
    } catch (PDOException $e) {
        $sqlState = $e->errorInfo[0] ?? $e->getCode();
        $msg = $e->errorInfo[2] ?? $e->getMessage();
        if ($sqlState === '45000') {                       // a trigger or procedure rule (BR-.., UC-..)
            json_out(['ok' => false, 'error' => $msg, 'code' => 'rule'] + state_if_possible(), 200);
        }
        if ($sqlState === '23000' || $sqlState === 'HY000' && stripos($msg, 'check') !== false) {   // UNIQUE / FK / CHECK
            $nice = stripos($msg, 'Duplicate') !== false ? 'This record already exists.' : 'The data breaks a database rule: ' . $msg;
            json_out(['ok' => false, 'error' => $nice, 'code' => 'constraint'] + state_if_possible(), 200);
        }
        error_log('E-COOP DB error: ' . $e->getMessage());
        json_out(['ok' => false, 'error' => 'Database error: ' . $msg, 'code' => 'db'], 500);
    } catch (Throwable $e) {
        error_log('E-COOP error: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
        json_out(['ok' => false, 'error' => 'Server error: ' . $e->getMessage(), 'code' => 'server'], 500);
    }
}

function state_if_possible(): array {
    try {
        if (isset($GLOBALS['PDO'])) {
            if (db()->inTransaction()) db()->rollBack();
            return ['state' => build_state(db(), current_user())];
        }
    } catch (Throwable $e) { /* ignore */ }
    return [];
}

/* ---------------------------------------------------------------- database */
function db(): PDO {
    if (!isset($GLOBALS['PDO'])) {
        $c = $GLOBALS['CFG'];
        $dsn = "mysql:host={$c['db_host']};port={$c['db_port']};dbname={$c['db_name']};charset=utf8mb4";
        try {
            $pdo = new PDO($dsn, $c['db_user'], $c['db_pass'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        } catch (PDOException $e) {
            json_out(['ok' => false, 'code' => 'no_database',
                'error' => 'Cannot connect to the database "' . $c['db_name'] . '". Start MySQL in XAMPP and open install.php to create it. (' . $e->getMessage() . ')'], 503);
        }
        $pdo->exec("SET time_zone = '+03:00'");
        $GLOBALS['PDO'] = $pdo;
    }
    return $GLOBALS['PDO'];
}

function q(string $sql, array $args = []): PDOStatement {
    $st = db()->prepare($sql);
    $st->execute($args);
    return $st;
}
function one(string $sql, array $args = []): ?array { $r = q($sql, $args)->fetch(); return $r === false ? null : $r; }
function val(string $sql, array $args = []) { $r = q($sql, $args)->fetchColumn(); return $r === false ? null : $r; }
function all(string $sql, array $args = []): array { return q($sql, $args)->fetchAll(); }

/* ---------------------------------------------------------------- request + session */
function body(): array {
    static $b = null;
    if ($b === null) {
        $raw = file_get_contents('php://input');
        $b = $raw ? (json_decode($raw, true) ?: []) : [];
    }
    return $b;
}

function start_session(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_name('ECOOPSESSID');
        session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'path' => '/']);
        session_start();
    }
}

/* the signed-in user row (+ profile ids) or null */
function current_user(): ?array {
    start_session();
    if (empty($_SESSION['uid'])) return null;
    static $cache = [];
    $uid = (int)$_SESSION['uid'];
    if (!array_key_exists($uid, $cache)) {
        $cache[$uid] = one("SELECT u.user_id, u.full_name, u.email, u.role, u.account_status,
                s.student_id, c.company_id, sp.supervisor_id, a.admin_id
            FROM users u
            LEFT JOIN students s ON s.user_id = u.user_id
            LEFT JOIN companies c ON c.user_id = u.user_id
            LEFT JOIN academic_supervisors sp ON sp.user_id = u.user_id
            LEFT JOIN admins a ON a.user_id = u.user_id
            WHERE u.user_id = ?", [$uid]);
    }
    $u = $cache[$uid];
    if (!$u || $u['account_status'] !== 'Active') { $_SESSION = []; return null; }
    return $u;
}

function require_user(string ...$roles): array {
    $u = current_user();
    if (!$u) fail('Please sign in first.', 'auth', 401);
    if ($roles && !in_array($u['role'], $roles, true)) fail('Your role cannot do this action.', 'forbidden', 403);
    return $u;
}

/* ---------------------------------------------------------------- ids between the UI and the database */
function nid($x): int { return (int)preg_replace('/^[a-z]+/', '', (string)$x); }   // 'u12' -> 12
function ui_role(string $db): string { return $db === 'Academic Supervisor' ? 'Supervisor' : $db; }
function db_role(string $ui): string { return $ui === 'Supervisor' ? 'Academic Supervisor' : $ui; }

/* ---------------------------------------------------------------- audit + notifications */
function audit(?int $uid, string $action, ?string $entityType = null, ?int $entityId = null): void {
    q('INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, user_agent) VALUES (?,?,?,?,?,?)', [
        $uid, mb_substr($action, 0, 120), $entityType, $entityId,
        $_SERVER['REMOTE_ADDR'] ?? null, mb_substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255) ?: null]);
}

/* notification_type = the interface key (e.g. nAppAccepted); message = its values as JSON */
function notify(?int $uid, string $key, array $args = [], ?string $entityType = null, ?int $entityId = null): void {
    if (!$uid) return;
    q('INSERT INTO notifications (user_id, notification_type, message, entity_type, entity_id, email_status) VALUES (?,?,?,?,?,?)',
        [$uid, $key, json_encode((object)$args, JSON_UNESCAPED_UNICODE), $entityType, $entityId, 'Queued']);
}

function notify_admins(string $key, array $args = [], ?int $exceptUid = null): void {
    foreach (all("SELECT user_id FROM users WHERE role = 'Admin' AND account_status = 'Active'") as $r) {
        if ((int)$r['user_id'] !== $exceptUid) notify((int)$r['user_id'], $key, $args);
    }
}

require __DIR__ . '/state.php';
