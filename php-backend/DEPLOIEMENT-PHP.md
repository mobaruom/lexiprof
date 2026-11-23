# Déploiement LexiProf (PHP + SQLite)

## Prérequis hébergeur
PHP ≥ 8.1 avec `pdo_sqlite` (presque tous les hébergements mutualisés), HTTPS, accès FTP/SFTP. Aucune base MySQL à créer.

## Étapes
1. Envoie tout le dossier sur l'hébergeur (le site à la racine, l'API dans `/api`).
2. (Recommandé) copie `api/config.sample.php` en `api/config.php` et mets `db_path` **hors du dossier public**.
3. Ouvre le site, va dans Profil → « Créer un compte » avec TON email.
4. Passe ce compte administrateur (SSH, ou le terminal PHP de l'hébergeur) :
   `php api/cli/make-admin.php ton@email.fr`
   Sans accès terminal : ouvre `api/cli/make-admin.php` n'est volontairement pas accessible par le web. Alternative : demande-moi un script d'installation à usage unique protégé par un jeton.
5. Importe tes notions actuelles : exporte `definitions` depuis Firebase (Console → Export JSON) puis
   `php api/cli/import-json.php definitions.json`  — ou via Admin → Importer (CSV/JSON).
6. Accède à l'admin par `https://ton-site/#/admin` (aucun lien public).

## Sécurité en place (testée)
Mots de passe hachés (bcrypt/argon), cookie de session HttpOnly + SameSite, anti-CSRF (en-tête + origine), requêtes SQL préparées, verrouillage des essais de connexion, limitation de débit (propositions, signalements, inscriptions, événements), écritures de contenu réservées au rôle admin, import atomique, rôle admin impossible à obtenir via le web.

## Hébergements possibles
Gratuit : InfinityFree, 000webhost-like (limites, publicités, SQLite parfois désactivé → à tester). Pas cher et fiable : Hostinger, o2switch, OVH (≈ 2–5 €/mois). Paiements Stripe : nécessitent HTTPS et PHP ≥ 8.1 (ok partout ci-dessus).
