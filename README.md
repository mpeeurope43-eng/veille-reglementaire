# Veille réglementaire — MPE Europe

Agent automatisé de veille réglementaire pour MPE Europe SAS. Surveille quotidiennement Légifrance (France) et EUR-Lex (UE), analyse la pertinence de chaque nouveau texte par rapport au profil réglementaire de l'entreprise, score l'impact, et alerte uniquement quand c'est nécessaire. Conçu comme un module de la suite d'outils internes MPE (même stack que pointages.html / wbs-suivi-projets.html : GitHub Pages + Firebase Firestore).

## Architecture

```
Sources (Légifrance PISTE + EUR-Lex RSS)
        │
        ▼
GitHub Actions (cron quotidien, gratuit)
        │
        ├─ collecte + dédup (NOR / CELEX) vs Firestore
        ├─ analyse IA (Gemini, tier gratuit) selon profil MPE Europe
        ├─ score de pertinence + niveau d'impact
        ├─ écriture Firestore (projet mpe-suite)
        └─ email si score ≥ seuil critique
                │
                ▼
        Firestore (mpe-suite)
                │
                ▼
veille-reglementaire.html (GitHub Pages) — dashboard consultable
```

## Mise en place (à faire une fois, manuellement)

Ces étapes ne peuvent pas être automatisées — elles demandent tes identifiants / comptes.

1. **Créer le repo GitHub** : nouveau repo `veille-reglementaire`, pousser le contenu de ce dossier.
2. **Activer GitHub Pages** sur ce repo : Settings → Pages → Source = "GitHub Actions" (pas "Deploy from a branch", qui ne permet pas de choisir le dossier `/public`). Le workflow `.github/workflows/deploy-pages.yml` publie automatiquement le contenu de `public/` à chaque push sur `main`.
3. **Compte PISTE (API Légifrance officielle)** : créer un compte gratuit sur [piste.gouv.fr](https://piste.gouv.fr/en/), créer une application, souscrire à l'API "Légifrance / DILA", récupérer `PISTE_CLIENT_ID` et `PISTE_CLIENT_SECRET`.
4. **Alerte(s) EUR-Lex** : sur [eur-lex.europa.eu](https://eur-lex.europa.eu), créer un compte gratuit, faire une recherche avec les mots-clés du profil MPE (voir `collector/config/profil.json`). ⚠️ Le moteur de recherche EUR-Lex ne combine fiablement que **2 termes maximum** avec OR (au-delà, la requête renvoie 0 résultat silencieusement, testé le 04/09/2026) — créer donc une recherche séparée par thème (ex. "2006/42 OR 2023/1230" pour Machines, "ATEX OR 2014/34" pour ATEX, etc.), l'enregistrer dans "My searches", puis récupérer son flux RSS via "My RSS alerts". `eurlexRssUrl` dans `collector/config/sources.json` est un **tableau** : ajouter une URL de flux par recherche/thème (`recupererEurLex` dans `collector/sources/eurlex.js` les combine et déduplique automatiquement).
5. **Clé API Gemini gratuite** : créer une clé sur [Google AI Studio](https://aistudio.google.com/app/apikey) → `GEMINI_API_KEY`.
6. **Compte de service Firebase Admin** : dans la console Firebase du projet `mpe-suite` → Paramètres du projet → Comptes de service → Générer une nouvelle clé privée (JSON). Le contenu de ce fichier va dans le secret GitHub `FIREBASE_SERVICE_ACCOUNT`.
7. **Config Firebase Web** (pour le dashboard) : dans la console Firebase du projet `mpe-suite` → Paramètres du projet → Général → tes apps Web → config SDK. Coller les valeurs dans `public/firebase-config.js` (ce sont des clés publiques, sans risque à publier — la sécurité se fait via les règles Firestore, voir `firestore.rules`).
8. **Email de notification (SMTP)** : soit un compte Gmail dédié avec un "mot de passe d'application", soit tout autre SMTP. Renseigner `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `ALERT_EMAIL_TO` en secrets GitHub.
9. **Secrets GitHub Actions** à créer (Settings → Secrets and variables → Actions) : `PISTE_CLIENT_ID`, `PISTE_CLIENT_SECRET`, `GEMINI_API_KEY`, `FIREBASE_SERVICE_ACCOUNT`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `ALERT_EMAIL_TO`.
10. **Valider le profil réglementaire** : relire et compléter `collector/config/profil.json` (points encore ouverts : fabricant vs intégrateur, transport pneumatique, certifications).
11. **Déployer les règles Firestore** : `firebase deploy --only firestore:rules` (ou copier-coller `firestore.rules` dans la console Firebase → Firestore → Règles).

Une fois ces 11 points faits, le workflow GitHub Actions tourne seul chaque jour — aucune intervention manuelle récurrente.

## Rodage recommandé

Pendant les 2-3 premières semaines, laisser `seuils.json` avec `alerteImmediateActive: false` — tout est visible dans le dashboard mais rien n'est envoyé par email — le temps de vérifier que le scoring correspond à ta lecture métier. Activer ensuite les alertes.

## Structure du dépôt

- `.github/workflows/veille-quotidienne.yml` — planificateur (cron gratuit GitHub Actions).
- `collector/` — le moteur : collecte, dédup, analyse IA, scoring, écriture Firestore, notification.
- `public/` — le dashboard (GitHub Pages), `veille-reglementaire.html`.
- `firestore.rules` — règles de sécurité Firestore (lecture dashboard, écriture réservée au compte de service).

## Ce que ce MVP ne fait pas (volontairement, pour rester simple)

Pas d'authentification utilisateur sur le dashboard (lecture seule publique via règles Firestore — à resserrer si besoin). Pas de gestion multi-entreprise. Pas de sources sectorielles au-delà de Légifrance/EUR-Lex pour l'instant (extensible plus tard).
