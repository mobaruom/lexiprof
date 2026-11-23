<?php
// Usage : php api/cli/make-admin.php email@exemple.fr   (le compte doit exister : inscris-toi d'abord sur le site)
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/../lib.php';
$e = mb_strtolower($argv[1] ?? ''); if (!$e) { fwrite(STDERR, "Usage: php make-admin.php email\n"); exit(1); }
$s = db()->prepare("UPDATE users SET role='admin' WHERE email=?"); $s->execute([$e]);
echo $s->rowCount() ? "OK : $e est administrateur.\n" : "Aucun compte avec cet email. Crée-le d'abord depuis le site (Profil → Créer un compte).\n";
