<?php
declare(strict_types=1);

/* ---------- configuration ---------- */
function cfg(string $k, $default = null) {
    static $c = null;
    if ($c === null) { $f = __DIR__ . '/config.php'; $c = is_file($f) ? (require $f) : []; }
    $env = getenv('LP_' . strtoupper($k));
    if ($env !== false && $env !== '') return $env;
    return $c[$k] ?? $default;
}

/* ---------- base de données (SQLite, aucun serveur à installer) ---------- */
function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    $path = (string) cfg('db_path', __DIR__ . '/data/lexiprof.sqlite');
    $dir = dirname($path);
    if (!is_dir($dir)) @mkdir($dir, 0750, true);
    $pdo = new PDO('sqlite:' . $path, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $pdo->exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
    migrate($pdo);
    return $pdo;
}
function migrate(PDO $p): void {
    $p->exec("
    CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY, v TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users(
      id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, pass_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user', plan TEXT NOT NULL DEFAULT 'free', plan_until INTEGER, created_at INTEGER NOT NULL, last_seen INTEGER);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL, created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS definitions(
      id INTEGER PRIMARY KEY, term TEXT NOT NULL, matiere TEXT NOT NULL, def TEXT NOT NULL, example TEXT NOT NULL DEFAULT '', remember TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT '', aliases TEXT NOT NULL DEFAULT '[]', created_at TEXT, needs_review INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS proposals(
      id INTEGER PRIMARY KEY AUTOINCREMENT, term TEXT NOT NULL, matiere TEXT NOT NULL, def TEXT NOT NULL, example TEXT NOT NULL DEFAULT '', remember TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT '', pseudo TEXT NOT NULL DEFAULT '', email TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL, user_id INTEGER);
    CREATE TABLE IF NOT EXISTS reports(
      id INTEGER PRIMARY KEY AUTOINCREMENT, definition_id INTEGER NOT NULL DEFAULT 0, term TEXT NOT NULL DEFAULT '', reason TEXT NOT NULL DEFAULT '', message TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT, t TEXT NOT NULL, d TEXT NOT NULL, a TEXT NOT NULL, n INTEGER, c INTEGER, ts INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS ev_d ON events(d);
    CREATE TABLE IF NOT EXISTS progress(user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, data TEXT NOT NULL, updated INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS rl(k TEXT NOT NULL, ts INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS rl_k ON rl(k, ts);
    CREATE TABLE IF NOT EXISTS locks(k TEXT PRIMARY KEY, fails INTEGER NOT NULL, until INTEGER NOT NULL);
    ");
    $r = $p->query("SELECT v FROM meta WHERE k='secret'")->fetch();
    if (!$r) $p->prepare("INSERT INTO meta(k,v) VALUES('secret',?)")->execute([bin2hex(random_bytes(32))]);
}
function secret(): string { return (string) db()->query("SELECT v FROM meta WHERE k='secret'")->fetchColumn(); }

/* ---------- réponses / entrées ---------- */
final class HttpError extends Exception { public function __construct(public int $status, string $msg) { parent::__construct($msg); } }
function out($data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}
function fail(int $status, string $msg): never { throw new HttpError($status, $msg); }
function body(int $max = 1_000_000): array {
    $raw = file_get_contents('php://input', false, null, 0, $max + 1);
    if ($raw === false || $raw === '') return [];
    if (strlen($raw) > $max) fail(413, 'Requête trop volumineuse.');
    $j = json_decode($raw, true);
    if (!is_array($j)) fail(400, 'JSON invalide.');
    return $j;
}
function str($v, int $max, bool $trim = true): string {
    if (!is_scalar($v)) return '';
    $s = (string) $v; if ($trim) $s = trim($s);
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $s) ?? '';
    return mb_substr($s, 0, $max);
}
function now(): int { return time(); }
function ip_hash(): string { return hash_hmac('sha256', $_SERVER['REMOTE_ADDR'] ?? '0', secret()); }
function iso(): string { return gmdate('Y-m-d\TH:i:s\Z'); }

/* ---------- limitation de débit ---------- */
function rate(string $key, int $max, int $window): void {
    $p = db(); $t = now(); $k = $key . ':' . ip_hash();
    $p->prepare('DELETE FROM rl WHERE ts < ?')->execute([$t - 86400]);
    $s = $p->prepare('SELECT COUNT(*) FROM rl WHERE k=? AND ts>?'); $s->execute([$k, $t - $window]);
    if ((int) $s->fetchColumn() >= $max) fail(429, 'Trop de requêtes. Réessaie plus tard.');
    $p->prepare('INSERT INTO rl(k,ts) VALUES(?,?)')->execute([$k, $t]);
}

/* ---------- sécurité des écritures (anti-CSRF) ---------- */
function guard_write(): void {
    if (($_SERVER['HTTP_X_LP'] ?? '') !== '1') fail(403, 'En-tête de sécurité manquant.');
    $o = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($o !== '') {
        $host = parse_url($o, PHP_URL_HOST) . (parse_url($o, PHP_URL_PORT) ? ':' . parse_url($o, PHP_URL_PORT) : '');
        $allowed = array_filter(array_map('trim', explode(',', (string) cfg('allowed_origins', ''))));
        if ($host !== ($_SERVER['HTTP_HOST'] ?? '') && !in_array($o, $allowed, true)) fail(403, 'Origine non autorisée.');
    }
}

/* ---------- sessions & comptes ---------- */
const COOKIE = 'lp_sess';
function https(): bool { return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'); }
function start_session(int $uid): void {
    $tok = bin2hex(random_bytes(32)); $exp = now() + 30 * 86400;
    db()->prepare('INSERT INTO sessions(token_hash,user_id,expires,created) VALUES(?,?,?,?)')->execute([hash('sha256', $tok), $uid, $exp, now()]);
    setcookie(COOKIE, $tok, ['expires' => $exp, 'path' => '/', 'secure' => https(), 'httponly' => true, 'samesite' => 'Lax']);
}
function end_session(): void {
    $t = $_COOKIE[COOKIE] ?? '';
    if ($t !== '') db()->prepare('DELETE FROM sessions WHERE token_hash=?')->execute([hash('sha256', $t)]);
    setcookie(COOKIE, '', ['expires' => 1, 'path' => '/', 'secure' => https(), 'httponly' => true, 'samesite' => 'Lax']);
}
function user(): ?array {
    static $u = false; if ($u !== false) return $u;
    $t = $_COOKIE[COOKIE] ?? ''; $u = null;
    if (preg_match('/^[a-f0-9]{64}$/', $t)) {
        $s = db()->prepare('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires>?');
        $s->execute([hash('sha256', $t), now()]); $r = $s->fetch();
        if ($r) { $u = $r; db()->prepare('UPDATE users SET last_seen=? WHERE id=?')->execute([now(), $r['id']]); }
    }
    return $u;
}
function need_user(): array { return user() ?? fail(401, 'Connexion requise.'); }
function need_admin(): array { $u = need_user(); if ($u['role'] !== 'admin') fail(403, 'Accès réservé à l’administrateur.'); return $u; }
function public_user(array $u): array {
    return ['id' => (int) $u['id'], 'email' => $u['email'], 'displayName' => $u['name'], 'role' => $u['role'], 'plan' => plan_of($u), 'createdAt' => gmdate('c', (int) $u['created_at'])];
}

/* ---------- offres : droits vérifiés CÔTÉ SERVEUR (aucun paiement actif) ---------- */
function plan_of(array $u): string {
    if (($u['plan'] ?? 'free') === 'premium' && (empty($u['plan_until']) || (int) $u['plan_until'] > now())) return 'premium';
    return 'free';
}
function plans_launched(): bool { return (bool) cfg('plans_launched', false); }
/** À appeler dans tout futur endpoint premium. Tant que l'offre n'est pas lancée, tout est ouvert. */
function require_feature(string $feature): void {
    if (!plans_launched()) return;
    $u = need_user();
    $premium = ['advancedStats', 'smartSessions', 'pdfStudyPack', 'multiDeviceSync'];
    if (in_array($feature, $premium, true) && plan_of($u) !== 'premium') fail(402, 'Fonctionnalité Premium.');
}

/* ---------- validation des définitions ---------- */
const SUBJECTS = ['Management', 'Droit', 'Économie', 'RH'];
function clean_def(array $d): array {
    $term = str($d['term'] ?? '', 120); $def = str($d['def'] ?? ($d['definition'] ?? ''), 2000);
    $m = str($d['matiere'] ?? '', 30);
    $map = ['management' => 'Management', 'droit' => 'Droit', 'economie' => 'Économie', 'économie' => 'Économie', 'rh' => 'RH'];
    $m = $map[mb_strtolower($m)] ?? $m;
    if (mb_strlen($term) < 2 || mb_strlen($def) < 1 || !in_array($m, SUBJECTS, true)) fail(422, 'Définition invalide : « ' . mb_substr($term, 0, 40) . ' ».');
    $al = array_slice(array_values(array_filter(array_map(fn($x) => str($x, 80), is_array($d['aliases'] ?? null) ? $d['aliases'] : []))), 0, 10);
    $src = str($d['source'] ?? '', 500);
    if ($src !== '' && preg_match('/^[a-z][a-z0-9+.\-]*:/i', $src) && !preg_match('#^https?://#i', $src)) $src = '';
    return ['term' => $term, 'matiere' => $m, 'def' => $def, 'example' => str($d['example'] ?? '', 1000), 'remember' => str($d['remember'] ?? '', 500), 'source' => $src, 'aliases' => $al,
        'created_at' => str($d['createdAt'] ?? '', 40) ?: null, 'needs_review' => !empty($d['needsReview']) ? 1 : 0];
}
function def_row(array $r): array {
    $o = ['id' => (int) $r['id'], 'term' => $r['term'], 'matiere' => $r['matiere'], 'def' => $r['def'], 'example' => $r['example'], 'remember' => $r['remember'], 'source' => $r['source'], 'aliases' => json_decode($r['aliases'], true) ?: []];
    if ($r['created_at']) $o['createdAt'] = $r['created_at'];
    if ($r['needs_review']) $o['needsReview'] = true;
    return $o;
}
function replace_definitions(array $list): int {
    if (count($list) > 5000) fail(413, 'Trop de définitions (5000 max).');
    $p = db(); $rows = []; $ids = [];
    $max = 0; foreach ($list as $d) if (is_array($d)) $max = max($max, (int) ($d['id'] ?? 0));
    foreach ($list as $d) {
        if (!is_array($d)) fail(422, 'Entrée invalide.');
        $c = clean_def($d); $id = (int) ($d['id'] ?? 0);
        if ($id <= 0 || isset($ids[$id])) $id = ++$max;
        $ids[$id] = 1; $rows[] = [$id, $c];
    }
    $p->beginTransaction();                      // tout ou rien
    try {
        $p->exec('DELETE FROM definitions');
        $st = $p->prepare('INSERT INTO definitions(id,term,matiere,def,example,remember,source,aliases,created_at,needs_review) VALUES(?,?,?,?,?,?,?,?,?,?)');
        foreach ($rows as [$id, $c]) $st->execute([$id, $c['term'], $c['matiere'], $c['def'], $c['example'], $c['remember'], $c['source'], json_encode($c['aliases'], JSON_UNESCAPED_UNICODE), $c['created_at'], $c['needs_review']]);
        $p->commit();
    } catch (Throwable $e) { $p->rollBack(); throw $e; }
    return count($rows);
}
