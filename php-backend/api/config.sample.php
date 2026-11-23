<?php
// Copie ce fichier en config.php (jamais publié) et adapte.
return [
    // Idéalement HORS du dossier public (ex. /home/user/lexiprof-data/lexiprof.sqlite). Par défaut : api/data/ (protégé par .htaccess).
    // 'db_path' => '/home/user/lexiprof-data/lexiprof.sqlite',
    // Origines supplémentaires autorisées à écrire (si le site et l'API sont sur deux domaines). Vide = même domaine uniquement.
    'allowed_origins' => '',
    // Reste false tant que les paiements ne sont pas configurés : tout est alors ouvert à tous.
    'plans_launched' => false,
];
