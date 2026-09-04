# Dossier de transfert — Projet "Veille Réglementaire" → conversation Suite MPE

*Compilé le 2026-09-04 à la demande de Damien, pour reprise dans la conversation dédiée à la Suite MPE (historique complet + points d'accès en attente).*

## 1. Origine du projet

Damien a transmis un cahier des charges complet pour un agent IA de veille réglementaire automatisée (surveiller → détecter → analyser → filtrer → alerter, sans intervention manuelle récurrente). Document complet : `01-cahier-des-charges-veille-reglementaire.md`.

## 2. Relecture critique (faite)

Points de vigilance identifiés et intégrés au cahier des charges (section 20) : privilégier des flux structurés officiels (RSS Légifrance, RSS/alertes EUR-Lex) plutôt qu'une recherche mot-clé générique pour éviter les faux négatifs ; déduplication par identifiant canonique (NOR/CELEX) ; trancher fabricant vs intégrateur pour calibrer le corpus réglementaire ; phase de rodage de 2-3 semaines avant d'activer les alertes immédiates ; un seul canal de notification pour le MVP.

## 3. Profil réglementaire MPE Europe (brouillon, à valider)

Construit à partir de la mémoire de session + recherche web sur MPE Europe / ex-COJIT (filiale de Modern Process Equipment, Chicago) : broyage/réduction granulométrique et transport de matières en vrac (convoyeurs à vis, Chain-Vey, tuyauterie inox), clients café/dry foods/pet food/chimie/minéraux. Document complet : `02-profil-reglementaire-mpe-europe.md`.

**Points encore ouverts, à valider avec Damien avant calibration du scoring :**
- MPE Europe est-elle fabricant (responsabilité marquage CE) ou intégrateur/ingénierie ?
- Présence réelle de transport pneumatique de poudres (risque ATEX) ?
- Certifications déjà suivies en interne (ISO 9001, IFS/BRC clients, EHEDG documenté) ?
- Installations réalisées uniquement en France ou aussi ailleurs en UE ?

## 4. Comparaison des solutions techniques (faite)

Quatre pistes évaluées : rester dans Cowork/Claude (tâches planifiées), flux natifs sans IA (RSS/alertes Légifrance-EUR-Lex, gratuit mais manuel), stack DIY GitHub Actions + script + API/flux gratuits + Gemini free tier (retenue), n8n auto-hébergé. Une proposition tierce (autre IA) a aussi été analysée et critiquée : bonne sur le fond réglementaire (a permis d'identifier l'EHEDG comme thème manquant) mais son "Option A" (copier-coller mensuel dans un chatbot) contredit le principe même du besoin (pas d'intervention manuelle), et ses deux options ne couvraient ni la déduplication, ni le scoring, ni la traçabilité FAIT/ANALYSE/RECOMMANDATION exigés par le cahier des charges.

## 5. Décisions d'architecture (prises)

- Nom retenu : **Veille Réglementaire**.
- Pensé comme un nouveau module de la suite d'outils internes MPE (même stack que pointages.html / wbs-suivi-projets.html : GitHub Pages + Firebase, UI française, charte MPE navy/rouge/or).
- Repo GitHub dédié : `veille-reglementaire`.
- Base de données : projet Firebase existant **MPE-Suite** (`mpe-suite`) — confirmé par Damien après consultation de sa console Firebase (3 projets existants : MPE-Suite `mpe-suite`, MPE-Outils `mpe-pointages`, MPE SAV `mpe-sav`).
- Sources : API PISTE (Légifrance officiel) + flux RSS EUR-Lex (recherche sauvegardée).
- IA d'analyse/scoring : Gemini API (tier gratuit).
- Mode de travail choisi : Claude prépare tous les fichiers de code, Damien crée le repo GitHub et les comptes nécessaires.

Détail complet (schéma Firestore, flux de données, choix d'hébergement) : `03-architecture-veille-reglementaire.md`.

## 6. Fonctionnalités demandées en cours de conversation (intégrées au code livré)

En plus du flux d'alertes du cahier des charges initial, Damien a demandé :
- Une **base de connaissances** consultable et éditable dans le dashboard : une fiche par thème réglementaire (Règlement Machines, ATEX, contact alimentaire, EHEDG, PED, REACH/CLP, environnement, export) avec résumé du besoin, référentiels associés, liens sources officielles, et liens vers des documents internes MPE ajoutables directement depuis l'app.
- Un **rapport périodique** (7/30/90 jours, "retour d'info mensuel"), calculé à la volée depuis l'historique, copiable en un clic — en complément du flux d'alertes.

Les deux sont implémentés dans le dashboard livré (`code/veille-reglementaire/public/veille-reglementaire.html`).

## 7. Livrable actuel

Un scaffold de code complet a été généré (dossier `code/veille-reglementaire/` dans ce dossier de transfert, identique au `.zip` déjà envoyé à Damien séparément) :
- `collector/` — moteur Node.js : collecte Légifrance (PISTE) + EUR-Lex (RSS), déduplication NOR/CELEX, analyse/scoring IA (Gemini), écriture Firestore, alerte email.
- `.github/workflows/veille-quotidienne.yml` — planificateur GitHub Actions (cron gratuit quotidien).
- `public/veille-reglementaire.html` — dashboard (Tableau de bord / Base de connaissances / Rapport périodique).
- `firestore.rules` — règles de sécurité **MVP** : lecture publique de tout, écriture libre sur la base de connaissances (pas d'authentification à ce stade).
- `README.md` — 11 étapes de mise en place manuelle (comptes PISTE, EUR-Lex, Gemini, service account Firebase, secrets GitHub, etc.).

**Non testé en conditions réelles** : le module Légifrance/PISTE (`collector/sources/legifrance.js`) est écrit à partir de la documentation publique, faute de compte PISTE disponible dans cette session — à vérifier une fois le compte créé.

## 8. Point en cours au moment du transfert — RÈGLES D'ACCÈS (non résolu, à reprendre)

Damien souhaite avancer en parallèle sur trois fronts : le visuel de l'outil, la préparation de la mise en ligne, et les règles d'accès — avec une revue de la "matrice" d'accès existante de la Suite MPE en y ajoutant une ligne pour Veille Réglementaire, puis lancement et tests. **Phase 1 souhaitée : accès et visibilité réservés à Admin uniquement.**

Claude a signalé un point technique important avant de continuer : une page GitHub Pages standard reste toujours accessible publiquement à qui a l'URL (même non répertoriée) — un vrai accès réservé à l'Admin nécessite une authentification (ex. Firebase Authentication) qui bloque à la fois l'affichage de la page ET les règles Firestore, pas seulement une URL cachée.

**Questions posées à Damien, restées sans réponse au moment du transfert (à reprendre dans la conversation Suite MPE) :**
1. Comment les autres outils de la suite (pointages.html, wbs-suivi-projets.html) gèrent-ils aujourd'hui les droits d'accès ? (Firebase Authentication par compte, mot de passe partagé simple, ou rien de formalisé actuellement ?)
2. Une "matrice" des règles d'accès existe-t-elle déjà sous forme de document (à fournir pour analyse et ajout d'une ligne), ou est-ce à construire à partir de ce qui existe déjà sur les autres outils ?

Ces deux réponses sont nécessaires avant d'implémenter l'authentification Admin-only sur `veille-reglementaire.html` et de mettre à jour `firestore.rules` en conséquence (actuellement en lecture publique, à resserrer).

## 9. Fichiers de ce dossier

- `00-synthese-pour-suite-MPE.md` — ce document.
- `01-cahier-des-charges-veille-reglementaire.md` — cahier des charges complet (avec compléments section 20).
- `02-profil-reglementaire-mpe-europe.md` — profil réglementaire MPE Europe (brouillon, points ouverts listés).
- `03-architecture-veille-reglementaire.md` — architecture technique détaillée + état d'avancement.
- `code/veille-reglementaire/` — code source complet du scaffold (identique au .zip déjà livré à Damien).
