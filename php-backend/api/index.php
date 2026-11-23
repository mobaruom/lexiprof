<?php
declare(strict_types=1);
require __DIR__ . '/lib.php';

set_exception_handler(function (Throwable $e) {
    if ($e instanceof HttpError) out(['error' => $e->getMessage()], $e->status);
    error_log('[LexiProf] ' . $e);
    out(['error' => 'Erreur interne du serveur.'], 500);
});

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = $_SERVER['PATH_INFO'] ?? '';
if ($path === '') { $u = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH) ?: ''; $i = strpos($u, 'index.php'); $path = $i !== false ? substr($u, $i + 9) : ''; }
$seg = array_values(array_filter(explode('/', $path), fn($s) => $s !== ''));
$r0 = $seg[0] ?? ''; $r1 = $seg[1] ?? null; $r2 = $seg[2] ?? null;

if ($method === 'OPTIONS') { http_response_code(204); exit; }
if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) guard_write();
$id = fn($v) => ctype_digit((string) $v) ? (int) $v : fail(400, 'Identifiant invalide.');
$date = fn($v) => preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $v) ? (string) $v : fail(422, 'Date invalide.');

switch ($r0) {
case 'health': out(['ok' => true, 'version' => '2.1.0']);

case 'definitions':
    if ($method === 'GET') { out(array_map('def_row', db()->query('SELECT * FROM definitions ORDER BY id')->fetchAll())); }
    if ($method === 'PUT') { need_admin(); $b = body(8_000_000); out(['ok' => true, 'count' => replace_definitions($b)]); }
    fail(405, 'Méthode non autorisée.');

case 'proposals':
    if ($method === 'POST') {
        rate('prop', 8, 3600); $b = body(20000);
        $term = str($b['term'] ?? '', 120); $def = str($b['def'] ?? '', 2000); $m = str($b['matiere'] ?? '', 30);
        if (mb_strlen($term) < 2 || mb_strlen($def) < 15 || !in_array($m, SUBJECTS, true)) fail(422, 'Proposition invalide (terme, matière et définition de 15 caractères minimum).');
        $src = str($b['source'] ?? '', 500); if ($src !== '' && !preg_match('#^https?://#i', $src)) $src = '';
        $u = user();
        db()->prepare('INSERT INTO proposals(term,matiere,def,example,remember,source,pseudo,email,status,created_at,user_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
            ->execute([$term, $m, $def, str($b['example'] ?? '', 1000), str($b['remember'] ?? '', 500), $src, str($b['pseudo'] ?? '', 60), str($b['email'] ?? '', 120), 'pending', iso(), $u['id'] ?? null]);
        out(['ok' => true], 201);
    }
    need_admin();
    if ($method === 'GET') { out(array_map(fn($r) => $r + ['_key' => (string) $r['id']], db()->query("SELECT * FROM proposals ORDER BY id DESC LIMIT 2000")->fetchAll())); }
    if ($method === 'PATCH' && $r1) { $b = body(2000); $s = str($b['status'] ?? '', 20); if (!in_array($s, ['pending', 'accepted', 'rejected'], true)) fail(422, 'Statut invalide.'); db()->prepare('UPDATE proposals SET status=? WHERE id=?')->execute([$s, $id($r1)]); out(['ok' => true]); }
    if ($method === 'DELETE' && $r1) { db()->prepare('DELETE FROM proposals WHERE id=?')->execute([$id($r1)]); out(['ok' => true]); }
    fail(405, 'Méthode non autorisée.');

case 'reports':
    if ($method === 'POST') {
        rate('rep', 10, 3600); $b = body(10000);
        db()->prepare('INSERT INTO reports(definition_id,term,reason,message,status,created_at) VALUES(?,?,?,?,?,?)')
            ->execute([(int) ($b['definitionId'] ?? 0), str($b['term'] ?? '', 120), str($b['reason'] ?? '', 60), str($b['message'] ?? '', 1000), 'pending', iso()]);
        out(['ok' => true], 201);
    }
    need_admin();
    if ($method === 'GET') { out(array_map(fn($r) => $r + ['_key' => (string) $r['id'], 'definitionId' => (int) $r['definition_id'], 'createdAt' => $r['created_at']], db()->query('SELECT * FROM reports ORDER BY id DESC LIMIT 2000')->fetchAll())); }
    if ($method === 'PATCH' && $r1) { $b = body(2000); $s = str($b['status'] ?? '', 20); if (!in_array($s, ['pending', 'done'], true)) fail(422, 'Statut invalide.'); db()->prepare('UPDATE reports SET status=? WHERE id=?')->execute([$s, $id($r1)]); out(['ok' => true]); }
    if ($method === 'DELETE' && $r1) { db()->prepare('DELETE FROM reports WHERE id=?')->execute([$id($r1)]); out(['ok' => true]); }
    fail(405, 'Méthode non autorisée.');

case 'events':      // statistiques anonymes : envoyées uniquement si l'utilisateur a consenti (contrôlé côté navigateur)
    if ($method === 'POST') {
        $b = body(2000); $a = str($b['a'] ?? '', 40);
        $t = str($b['t'] ?? '', 16); if (!in_array($t, ['open', 'review', 'quiz', 'view', 'import'], true) || !preg_match('/^[A-Za-z0-9]{6,40}$/', $a)) fail(422, 'Événement invalide.');
        rate('ev', 300, 86400);
        db()->prepare('INSERT INTO events(t,d,a,n,c,ts) VALUES(?,?,?,?,?,?)')->execute([$t, $date($b['d'] ?? ''), $a, isset($b['n']) ? min(999, max(0, (int) $b['n'])) : null, isset($b['c']) ? min(999, max(0, (int) $b['c'])) : null, now()]);
        out(['ok' => true], 201);
    }
    need_admin();
    if ($method === 'GET') { out(db()->query('SELECT t,d,a,n,c,ts FROM events ORDER BY id DESC LIMIT 20000')->fetchAll()); }
    fail(405, 'Méthode non autorisée.');

case 'auth':
    if ($method !== 'POST') fail(405, 'Méthode non autorisée.');
    if ($r1 === 'register') {
        rate('reg', 10, 3600); $b = body(5000);
        $email = mb_strtolower(str($b['email'] ?? '', 160)); $name = str($b['displayName'] ?? '', 60); $pw = (string) ($b['password'] ?? '');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail(422, 'Email invalide.');
        if (mb_strlen($name) < 2) fail(422, 'Prénom trop court.');
        if (strlen($pw) < 8 || strlen($pw) > 200) fail(422, 'Mot de passe : 8 caractères minimum.');
        $e = db()->prepare('SELECT 1 FROM users WHERE email=?'); $e->execute([$email]);
        if ($e->fetch()) fail(409, 'Cet email est déjà utilisé.');
        db()->prepare('INSERT INTO users(email,name,pass_hash,created_at) VALUES(?,?,?,?)')->execute([$email, $name, password_hash($pw, PASSWORD_DEFAULT), now()]);
        $uid = (int) db()->lastInsertId(); start_session($uid);
        $s = db()->prepare('SELECT * FROM users WHERE id=?'); $s->execute([$uid]); out(['user' => public_user($s->fetch())], 201);
    }
    if ($r1 === 'login') {
        $b = body(5000); $email = mb_strtolower(str($b['email'] ?? '', 160)); $pw = (string) ($b['password'] ?? '');
        $lk = hash('sha256', $email . '|' . ip_hash()); $p = db();
        $l = $p->prepare('SELECT * FROM locks WHERE k=?'); $l->execute([$lk]); $lock = $l->fetch();
        if ($lock && (int) $lock['until'] > now()) fail(429, 'Trop d’essais. Réessaie dans ' . ((int) $lock['until'] - now()) . ' s.');
        $s = $p->prepare('SELECT * FROM users WHERE email=?'); $s->execute([$email]); $u = $s->fetch();
        $ok = password_verify($pw, $u['pass_hash'] ?? '$2y$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012346');   // temps constant même si l'email est inconnu
        if (!$u || !$ok) {
            $f = ($lock['fails'] ?? 0) + 1; $until = $f >= 5 ? now() + 900 : 0;
            $p->prepare('INSERT INTO locks(k,fails,until) VALUES(?,?,?) ON CONFLICT(k) DO UPDATE SET fails=?, until=?')->execute([$lk, $until ? 0 : $f, $until, $until ? 0 : $f, $until]);
            fail(401, 'Email ou mot de passe incorrect.');
        }
        $p->prepare('DELETE FROM locks WHERE k=?')->execute([$lk]);
        if (password_needs_rehash($u['pass_hash'], PASSWORD_DEFAULT)) $p->prepare('UPDATE users SET pass_hash=? WHERE id=?')->execute([password_hash($pw, PASSWORD_DEFAULT), $u['id']]);
        start_session((int) $u['id']); out(['user' => public_user($u)]);
    }
    if ($r1 === 'logout') { end_session(); out(['ok' => true]); }
    fail(404, 'Route inconnue.');

case 'me':
    $u = need_user();
    if (!$r1) {
        if ($method === 'GET') out(['user' => public_user($u)]);
        if ($method === 'PATCH') { $n = str(body(2000)['displayName'] ?? '', 60); if (mb_strlen($n) < 2) fail(422, 'Prénom trop court.'); db()->prepare('UPDATE users SET name=? WHERE id=?')->execute([$n, $u['id']]); $u['name'] = $n; out(['user' => public_user($u)]); }
        if ($method === 'DELETE') {   // suppression du compte et des données associées
            $b = body(2000); if (!password_verify((string) ($b['password'] ?? ''), $u['pass_hash'])) fail(403, 'Mot de passe incorrect.');
            db()->prepare('DELETE FROM users WHERE id=?')->execute([$u['id']]); end_session(); out(['ok' => true]);
        }
    }
    if ($r1 === 'password' && $method === 'POST') {
        $b = body(2000); $new = (string) ($b['next'] ?? '');
        if (!password_verify((string) ($b['current'] ?? ''), $u['pass_hash'])) fail(403, 'Mot de passe actuel incorrect.');
        if (strlen($new) < 8 || strlen($new) > 200) fail(422, 'Nouveau mot de passe : 8 caractères minimum.');
        db()->prepare('UPDATE users SET pass_hash=? WHERE id=?')->execute([password_hash($new, PASSWORD_DEFAULT), $u['id']]);
        db()->prepare('DELETE FROM sessions WHERE user_id=?')->execute([$u['id']]); start_session((int) $u['id']); out(['ok' => true]);
    }
    if ($r1 === 'progress') {     // synchronisation multi-appareils (la fusion se fait côté client)
        if ($method === 'GET') { $s = db()->prepare('SELECT data,updated FROM progress WHERE user_id=?'); $s->execute([$u['id']]); $r = $s->fetch(); out($r ? ['data' => json_decode($r['data'], true), 'updated' => (int) $r['updated']] : ['data' => null, 'updated' => 0]); }
        if ($method === 'PUT') { $raw = body(600000); $d = $raw['data'] ?? null; if (!is_array($d)) fail(422, 'Données invalides.'); $j = json_encode($d, JSON_UNESCAPED_UNICODE); if (strlen($j) > 500000) fail(413, 'Progression trop volumineuse.'); db()->prepare('INSERT INTO progress(user_id,data,updated) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET data=?, updated=?')->execute([$u['id'], $j, now(), $j, now()]); out(['ok' => true]); }
    }
    fail(404, 'Route inconnue.');

case 'admin':
    need_admin();
    if ($r1 === 'overview' && $method === 'GET') {
        $p = db(); $days = [];
        for ($i = 89; $i >= 0; $i--) $days[gmdate('Y-m-d', now() - $i * 86400)] = 0;
        foreach ($p->query('SELECT created_at FROM users WHERE created_at > ' . (now() - 91 * 86400))->fetchAll() as $r) { $k = gmdate('Y-m-d', (int) $r['created_at']); if (isset($days[$k])) $days[$k]++; }
        $plans = ['free' => 0, 'premium' => 0]; foreach ($p->query('SELECT * FROM users')->fetchAll() as $u) $plans[plan_of($u)]++;
        out(['users' => array_sum($plans), 'plans' => $plans, 'signups' => $days,
             'active7' => (int) $p->query('SELECT COUNT(*) FROM users WHERE last_seen > ' . (now() - 7 * 86400))->fetchColumn(),
             'active30' => (int) $p->query('SELECT COUNT(*) FROM users WHERE last_seen > ' . (now() - 30 * 86400))->fetchColumn(),
             'plansLaunched' => plans_launched()]);
    }
    fail(404, 'Route inconnue.');

default: fail(404, 'Route inconnue.');
}
