# Architecture retenue — Veille Réglementaire (MPE Europe)

*Décisions prises le 2026-09-04, en complément du cahier des charges et du profil réglementaire. Nom de l'application retenu : **Veille Réglementaire**.*

## État d'avancement (2026-09-04)

Un premier scaffold de code complet a été généré et livré à Damien en `.zip` (`veille-reglementaire.zip`) : moteur de collecte (Node.js), workflow GitHub Actions quotidien, dashboard `veille-reglementaire.html` (3 vues : Tableau de bord, Base de connaissances, Rapport périodique), règles Firestore, script de seed de la base de connaissances. Reste à faire côté Damien : les 11 étapes manuelles listées dans le `README.md` du repo (compte PISTE, recherche sauvegardée EUR-Lex, clé Gemini, compte de service Firebase projet `mpe-suite`, secrets GitHub, création du repo, activation de GitHub Pages) avant que le système tourne en conditions réelles. Le module PISTE (`collector/sources/legifrance.js`) est écrit à partir de la documentation publique mais n'a pas pu être testé faute d'accès à un compte PISTE dans cette session — à vérifier une fois le compte créé.

**Point en cours (non résolu) :** Damien veut restreindre l'accès et la visibilité de l'app à Admin uniquement en phase 1, en cohérence avec une "matrice" de règles d'accès existante sur la suite MPE. Voir section 8 de `00-synthese-pour-suite-MPE.md` pour le détail et les questions en attente.

## Principe : module de la suite d'outils internes MPE

Le projet est pensé comme une nouvelle brique de la suite d'outils internes de Damien (même famille que pointages.html, wbs-suivi-projets.html, suivi-foot-app) — même stack technique, mêmes conventions (couleurs MPE navy #1B3A6B / rouge #C8102E / or #F0A500, UI en français, GitHub Pages + Firebase).

Deux couches distinctes :

**1. Le moteur (invisible, automatique)**
Un script Node.js déclenché quotidiennement par GitHub Actions (cron gratuit) : collecte des flux Légifrance (API PISTE officielle) et EUR-Lex (flux RSS d'une recherche sauvegardée), déduplication par NOR/CELEX contre l'historique, analyse et scoring par IA (Gemini API, tier gratuit) selon le profil réglementaire MPE Europe, puis écriture des résultats dans Firestore. Envoi d'une notification email pour tout ce qui dépasse le seuil critique (désactivé par défaut le temps du rodage).

**2. L'application "Veille Réglementaire" (visible, consultable)**
Une page `veille-reglementaire.html`, hébergée sur GitHub Pages, lisant le même Firestore, avec trois vues :
- **Tableau de bord** : stats (critiques/importants/à surveiller), liste filtrable des textes détectés avec résumé IA, pertinence, échéance, actions recommandées, lien source officielle.
- **Base de connaissances** : fiches de référence par thème réglementaire (Règlement Machines, ATEX, EHEDG, contact alimentaire, PED, REACH/CLP, environnement, export), pré-remplies via `collector/scripts/seed-referentiels.js`, éditables directement dans l'app (résumé du besoin + ajout de liens vers des documents internes MPE).
- **Rapport périodique** : synthèse agrégée sur une période choisie (7/30/90 jours), calculée à la volée à partir de l'historique Firestore, copiable en un clic.

## Décisions d'hébergement

- **Repo** : nouveau repo GitHub dédié (`veille-reglementaire`), séparé des autres outils.
- **Base de données** : projet Firebase existant **MPE-Suite** (project ID `mpe-suite`), nouvelle collection Firestore dédiée. Les deux autres projets Firebase existants (MPE-Outils `mpe-pointages`, MPE SAV `mpe-sav`) ne sont pas utilisés ici.

## Sources retenues

- **France** : API PISTE (DILA/Légifrance), officielle, gratuite sur inscription.
- **UE** : flux RSS EUR-Lex généré par une recherche sauvegardée sur les mots-clés du profil MPE (fonctionnalité native EUR-Lex, gratuite).

## Schéma Firestore

- `veille/textes/items/{docId}` — un document par texte détecté : identifiant (NOR/CELEX), titre, organisme, date publication, date entrée en vigueur, type, juridiction, URL source, extrait, score de pertinence, niveau d'impact, statut (Oui/Probablement/À vérifier/Non pertinent), résumé IA, actions recommandées, themeId (lien optionnel vers une fiche de la base de connaissances), alerte envoyée (bool), date de détection.
- `veille/referentiels/items/{id}` — la base de connaissances : nom du thème, domaine, résumé du besoin pour MPE, référentiels, liens sources officielles, liens documents internes MPE, statut, dernière mise à jour.
- `veille/config/params/seuils` — seuils configurables du scoring (éditables depuis le dashboard, plan futur).

## Sécurité / accès (état actuel — MVP, à resserrer)

`firestore.rules` livré autorise la lecture publique de `veille/textes` et `veille/referentiels`, et l'écriture libre sur `veille/referentiels` et `veille/config` (pour permettre l'édition de la base de connaissances depuis le dashboard sans authentification). L'écriture sur `veille/textes` est réservée au compte de service (Admin SDK, utilisé par GitHub Actions).

**Ce modèle ne correspond pas à la demande "Admin uniquement" formulée par Damien en fin de session — à revoir avant mise en production.** Une page GitHub Pages standard reste accessible à qui a l'URL, même non répertoriée : un vrai accès réservé nécessite une authentification (ex. Firebase Authentication) qui conditionne à la fois l'affichage de la page et les règles Firestore. Reste à savoir si les autres outils de la suite MPE ont déjà un système d'authentification à réutiliser pour rester cohérent.

## Prérequis techniques à réunir avant mise en production

Voir `README.md` du repo `veille-reglementaire` (11 étapes détaillées : compte PISTE, recherche sauvegardée EUR-Lex, clé Gemini, compte de service Firebase, secrets GitHub, etc.).
