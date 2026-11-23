# LexiProf 2.3 — Firebase + GitHub Pages

Application de révision STMG/BTS : bibliothèque de notions, révision espacée (SM-2), quiz, XP, séries, badges, PWA hors ligne.
Site statique (HTML/CSS/JS, sans build) hébergé sur **GitHub Pages** (CNAME inclus) ; données sur **Firebase Realtime Database** ; comptes via **Firebase Authentication**. Le dossier `php-backend/` est une option pour plus tard (`backend: 'php'` dans `js/config.js`), non utilisé.

## Nouveautés 2.3
- **Admin → Journal** : toutes les modifications (notions créées/modifiées/supprimées avec le avant/après, imports, propositions, signalements, connexions, mot de passe) avec date et auteur, frise lisible, filtres, recherche, export CSV, restauration d'une notion supprimée. Stocké dans Firebase `audit` en **ajout seul** → **republie `database.rules.json`** pour activer cette protection. Les actions faites avant cette version ne sont pas enregistrées.
- **Coach de réussite** (`#/coach`, bandeau sur l'accueil) : score de préparation, compte à rebours, projection au jour J, plan sur 7 jours, points faibles. Calculé dans le navigateur sur les vraies données de l'élève (modèle simple et annoncé comme estimation). Plan détaillé et points faibles = **aperçu Premium** : essai local de 7 jours (une fois), puis verrouillé avec le bouton « Je veux Premium au lancement » (compteur anonyme dans Firebase `interest`, visible dans Admin → Statistiques ; **republie `database.rules.json`**). Le verrouillage est un confort d'interface, pas une sécurité : au lancement il faudra le faire côté serveur.
- **Admin → Notions** : sélection multiple (supprimer, changer de matière).
- **Import** : tri, recherche, pagination de l'aperçu, export CSV de la vue.
- **Quiz** : « Je ne sais pas », « Refaire mes erreurs » (sans XP), score direct, réglages mémorisés, reprise d'un quiz interrompu, clavier et lecteurs d'écran.
- **Bandeau « nouvelle version »** : à chaque mise en ligne, change `LP.VERSION` (js/app.js) **et** `version.json` (même valeur) ; les visiteurs voient « Recharger ».
- **Journal technique** (Profil) : erreurs notées sur l'appareil, exportables, jamais envoyées.
- **Tests automatiques** : `.github/workflows/tests.yml` (non testé ici : à vérifier au premier push).

## Mise en route (une seule fois)
1. **Firebase console** → projet `lexiprof-44e50` → *Authentication* → *Sign-in method* → activer **E-mail/Mot de passe**.
2. *Paramètres du projet* → *Général* → copier la **clé API Web** → la coller dans `js/config.js` (`apiKey`). Sans clé, le site marche en **mode local/test** (comptes sur l'appareil, admin à mot de passe navigateur : ce n'est PAS une vraie sécurité).
3. *Realtime Database* → onglet **Règles** → coller le contenu de `database.rules.json` → Publier.
4. Créer ton compte sur le site (Profil → Créer un compte), puis dans la console : *Authentication* → copier ton **UID** → *Realtime Database* → ajouter `admins/<ton UID> = true`. C'est la seule façon de devenir admin (jamais via le site).
5. Se rendre sur `https://lexiprof.run.place/#/admin` (aucun lien public) et se connecter avec ce compte.
6. Déployer : pousser le dossier sur GitHub (branche servie par Pages). En cas de changement de fichiers JS/CSS, incrémenter `?v=` dans `index.html` et `CACHE` dans `sw.js`.

## Tests
`node tests/streak.test.js`, `quiz.test.js`, `import.test.js`, `pdf.test.js` ; E2E (Playwright, **faux Firebase** `tests/fbmock.js` avec règles approchées) : `NODE_PATH=$(npm root -g) OUT=/tmp node tests/e2e.js`. `tests/api.test.js` ne concerne que l'option PHP.
Non testé : les vraies règles Firebase (pas d'émulateur ici) et l'installation PWA sur le vrai domaine HTTPS.

## Import en masse (Admin → Importer)
CSV (`;` `,` ou tabulation), JSON (`[...]` ou `{"definitions":[...]}`) ou copier-coller (`Terme : définition` / `Terme ; Matière ; Définition`).
| Champ | Obligatoire | Règle |
|---|---|---|
| `term` (terme) | oui | 2–120 car. |
| `def` (définition) | oui | 15–2000 car. |
| `matiere` | oui (ou matière par défaut) | Management, Droit, Économie, RH |
| `example`, `remember`, `source`, `aliases` (séparés par `\|`) | non | 1000 / 500 / 500 car., source http(s) |
Aperçu avant validation, doublons (existants / dans le fichier) ignorés ou mis à jour, bilan, rapport CSV des rejets. Écriture unique et atomique (restauration locale + aucune écriture serveur en cas d'échec).

## Flammes
Une journée est validée dès ≥ 1 carte révisée ou ≥ 1 réponse de quiz (jour calendaire local). Série = jours consécutifs ; la série d'hier reste « en sursis » jusqu'à minuit. Record conservé. Données stockées sur l'appareil (non synchronisées entre appareils, modifiables par l'utilisateur : ne pas s'en servir comme preuve).

## Données et consentement
Export PDF étudiant : Profil → Mes données (rapport + fiches des favoris). Voir la page **Confidentialité** de l'app (tableau complet). Résumé : progression/préférences/compte = appareil seulement (essentiel) ; propositions/signalements = envoi volontaire (Firebase) ; **statistiques anonymes** (`events` : type, date, identifiant aléatoire) et **polices Google** = optionnelles, désactivées tant que l'utilisateur n'a pas choisi, retirables à tout moment. Aucun cookie publicitaire.

## Admin (toi seul)
Pas de lien public vers `#/admin`. L'accès exige un compte Firebase **et** `admins/<uid> = true` posé à la main dans la console. Les règles `database.rules.json` refusent côté serveur toute écriture des notions et toute lecture des propositions/signalements/statistiques à un non-admin. Statistiques : usage anonyme (consentement) + comptes réels (`profiles`).

## Freemium (préparation)
`js/plans.js` : `launched=false`, prix non fixés, aucun paiement. Le plan est dans `profiles/<uid>/plan` ('free' à la création ; seul l'admin peut le modifier). Toute restriction réelle devra être faite côté serveur (règles / Cloud Functions) avec un prestataire de paiement. Ne pas activer avant.

## PWA
`manifest.json` (icônes 192/512 + maskable), `sw.js` (réseau d'abord, repli cache). Bouton « Installer » : invite native si disponible, sinon instructions iOS/Safari/Firefox/Android.

## Version 2.4 (novembre 2026)

- **Quiz** : trois modes (Classique, Express 3 min, Survie 3 vies) et un nouveau type de question, les **cartes à trous** (un mot-clé de la définition est masqué, quatre propositions). « Refaire mes erreurs » fonctionne dans tous les modes. Records Express et Survie enregistrés.
- **Fenn**, la mascotte (un fennec dessiné en SVG, personnage original) : accueil, fins de session, avatars. Humeurs : content, enthousiaste, fier, triste, endormi, pensif.
- **Personnage** (Profil → Personnaliser) : pseudo, avatar (11, dont 3 trouvables dans les coffres), titre (12). Stocké sur l'appareil (clé `lexiprof_fun`), inclus dans l'export de progression. Pas de modération : le pseudo n'est jamais envoyé ni affiché à d'autres.
- **Coffre de récompense** : un par jour, quand l'objectif du jour est atteint. XP bonus, ou avatar/titre (garanti tous les 5 coffres).
- **Badges rares** (9) : description cachée tant qu'ils ne sont pas obtenus.
- Fichiers : `js/fun.js` (nouveau), modifications dans `js/views.js`, `js/core.js`, `js/views2.js`, `js/app.js`, `css/app.css`.
- Tests : `node tests/cloze.test.js`, `node tests/fun.test.js` (+ 29 contrôles ajoutés au test navigateur, 211 au total).

À la mise en ligne : garder `LP.VERSION` (js/app.js) et `version.json` identiques (2.4.0).

## Version 2.5

- **Fenn v2** (`js/fenn.js`) : fennec redessiné en calques SVG, 9 humeurs, 3 cadrages, accessoires refaits, animations CSS (respiration, clignement, oreilles, queue, salut, saut de joie). Désactivées avec « Réduire les animations ».
- **Visite guidée** (`js/tour.js`) à la 1re ouverture : pseudo, objectif quotidien (vraie préférence), fonctionnement, coffre. Rejouable depuis le profil. Drapeau `lexiprof_tour`.
- **Écran de chargement** avec Fenn.
- **Polices** : Standard / Lisible (Atkinson) / Dyslexie (OpenDyslexic) + espacement renforcé. Déposer les .woff2 dans `fonts/` (voir `fonts/LISEZMOI.txt`) ; sans eux, polices système lisibles en repli.
- **Couleurs des matières** : palette étendue + couleur calculée pour toute matière inconnue.
