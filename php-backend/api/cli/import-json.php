<?php
// Usage : php api/cli/import-json.php definitions.json   (tableau JSON de définitions, ex. export Firebase)
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/../lib.php';
$j = json_decode(file_get_contents($argv[1] ?? 'php://stdin'), true);
if (isset($j['definitions'])) $j = $j['definitions'];
if (!is_array($j)) { fwrite(STDERR, "JSON invalide\n"); exit(1); }
$j = array_values(array_filter($j, 'is_array'));
echo replace_definitions($j) . " définitions importées.\n";
