# Cahier des charges — Agent IA de veille réglementaire automatisée

*Document reçu de Damien le 2026-09-04, conservé tel quel comme référence du projet. Complété le 2026-09-04 après relecture critique (section 20).*

## 1. Contexte et besoin

L'objectif est de mettre en place un agent IA autonome de veille réglementaire capable de surveiller régulièrement les évolutions réglementaires pertinentes pour une entreprise.

L'utilisateur ne souhaite pas effectuer lui-même des recherches régulières ni consulter quotidiennement plusieurs sites réglementaires.

Le système doit fonctionner en arrière-plan :

Surveiller → détecter → analyser → filtrer → alerter

L'objectif principal est de recevoir uniquement les informations réglementaires nouvelles, pertinentes et potentiellement impactantes, sans être submergé par les publications sans intérêt.

## 2. Objectif de la solution

Créer un système capable de :

1. surveiller automatiquement plusieurs sources réglementaires ;
2. détecter les nouveaux textes et les modifications ;
3. éviter de remonter plusieurs fois la même information ;
4. analyser les publications avec une IA ;
5. déterminer leur pertinence par rapport à l'activité de l'entreprise ;
6. résumer les changements en langage simple ;
7. identifier les éventuelles actions à entreprendre ;
8. envoyer une alerte uniquement lorsqu'une information suffisamment importante est détectée ;
9. conserver la source officielle et la date de détection.

L'utilisateur ne doit donc pas avoir à demander : « Y a-t-il eu des changements réglementaires cette semaine ? » Le système réalise cette recherche automatiquement.

## 3. Périmètre géographique

Phase 1 — surveillance prioritaire : France ; Union européenne.

Le système devra pouvoir être étendu ultérieurement à d'autres pays.

## 4. Sources à surveiller

Le système devra privilégier les sources officielles.

**France**, notamment : Légifrance ; Journal officiel de la République française ; sites des ministères ; autorités administratives et organismes réglementaires pertinents selon le secteur.

**Union européenne**, notamment : EUR-Lex ; Journal officiel de l'Union européenne ; Commission européenne ; autorités et agences européennes sectorielles.

D'autres sources pourront être ajoutées en fonction du secteur d'activité.

Chaque information remontée par l'agent devra conserver un lien vers sa source primaire officielle lorsque celle-ci est disponible.

## 5. Fréquence de surveillance

La surveillance doit être automatique. Fréquence configurable, par exemple : quotidienne ; tous les 2 ou 3 jours ; hebdomadaire.

Une fréquence quotidienne constitue le fonctionnement cible par défaut.

L'absence de nouveauté pertinente ne doit pas nécessairement provoquer l'envoi d'une notification.

## 6. Collecte des informations

À chaque exécution, le système devra :

1. interroger les différentes sources ;
2. récupérer les nouvelles publications ;
3. récupérer les principales métadonnées disponibles ;
4. comparer les résultats avec les publications déjà analysées ;
5. éliminer les doublons ;
6. transmettre les nouvelles informations au moteur d'analyse IA.

Lorsque cela est disponible, les informations suivantes seront conservées : titre ; organisme émetteur ; date de publication ; date d'entrée en vigueur ; référence du texte ; type de document ; juridiction ; URL officielle ; contenu ou extrait pertinent.

## 7. Analyse par intelligence artificielle

Chaque nouvelle publication devra être analysée automatiquement. L'IA devra notamment répondre aux questions suivantes :

**Qu'est-ce qui change ?** Résumé simple du changement réglementaire.

**Qui est concerné ?** Identification des entreprises, secteurs, produits ou activités potentiellement concernés.

**Sommes-nous concernés ?** Comparaison du texte avec le profil de l'entreprise. Résultat possible : Oui ; Probablement ; À vérifier ; Non pertinent.

**Quand ?** Identification des dates importantes : publication ; entrée en vigueur ; période transitoire ; échéance de mise en conformité.

**Quel est l'impact ?** Classification indicative : Critique / Important / À surveiller / Informatif.

**Que faut-il faire ?** Lorsque cela est possible, génération d'une liste courte d'actions potentielles.

Exemple : Nouvelle obligation applicable à partir du 1er janvier 2027. Impact potentiel : important. Action recommandée : vérifier la conformité des procédures internes avant décembre 2026.

## 8. Profil réglementaire de l'entreprise

Afin d'éviter les alertes inutiles, le système devra disposer d'un profil décrivant l'entreprise. Exemples d'informations : secteur d'activité ; activités exercées ; pays d'activité ; taille de l'entreprise ; produits commercialisés ; équipements utilisés ; substances ou matériaux concernés ; certifications ; réglementation déjà identifiée ; thèmes réglementaires à surveiller.

Ce profil sera utilisé par l'IA pour déterminer la pertinence d'une publication.

*Voir le document séparé "profil-reglementaire-mpe-europe.md" pour le brouillon en cours.*

## 9. Système de scoring

Chaque publication pourra recevoir un score de pertinence, par exemple de 0 à 100.

- 0–30 : non pertinent — aucune notification.
- 31–60 : à surveiller — conservation dans l'historique.
- 61–80 : important — ajout au rapport de veille.
- 81–100 : critique — alerte immédiate.

Les seuils devront être configurables.

## 10. Notifications

Le principe essentiel est : ne pas notifier pour rien. Le système doit privilégier la qualité des alertes plutôt que leur quantité.

Canaux possibles : e-mail ; notification ChatGPT ; Teams ou Slack ; tableau de bord ; autres canaux ultérieurement.

Une alerte devra idéalement contenir : Titre (nouvelle évolution réglementaire détectée) ; Résumé (explication du changement en quelques lignes) ; Impact ; Entreprises concernées (description du périmètre concerné) ; Échéance (date éventuelle d'application) ; Action recommandée (action concrète à vérifier ou réaliser) ; Source (lien vers le texte officiel).

## 11. Rapport périodique

En complément des alertes importantes, le système pourra générer un rapport périodique, par exemple hebdomadaire, listant les évolutions pertinentes détectées avec impact, échéance et action. Le rapport doit rester court et orienté décision.

## 12. Historique

Le système devra conserver un historique permettant de savoir : ce qui a été détecté ; quand l'information a été détectée ; quelle source a été utilisée ; quelle analyse a été réalisée ; quel niveau de priorité a été attribué ; si une alerte a été envoyée.

Cela permet également d'éviter les alertes répétitives.

## 13. Traçabilité et fiabilité

L'IA ne doit jamais constituer l'unique source de vérité réglementaire. Chaque analyse devra permettre de revenir au texte officiel.

Le système devra clairement distinguer :

- **FAIT RÉGLEMENTAIRE** — information directement issue d'une source officielle.
- **ANALYSE IA** — interprétation ou résumé produit par le système.
- **RECOMMANDATION** — action potentielle proposée par l'IA.

Pour les sujets critiques, une validation humaine ou juridique devra rester possible.

## 14. Architecture fonctionnelle cible

Sources réglementaires → Collecteur automatique → Détection des nouveautés → Base historique / déduplication → Analyse IA → Comparaison avec le profil entreprise → Score de pertinence et d'impact → Filtrage → Alerte ou rapport → Utilisateur.

## 15. Interface minimale

Une première version ne nécessite pas forcément une application complexe. Un MVP peut fonctionner avec : un moteur de recherche/collecte automatique ; une base simple des textes déjà analysés ; une IA ; un système de notification ; un rapport périodique.

Une interface web pourra être ajoutée ultérieurement pour consulter un dashboard : alertes critiques ; nouvelles réglementations ; prochaines échéances ; textes à vérifier ; historique ; sources surveillées.

## 16. Contraintes économiques

L'objectif initial est de maintenir un coût très faible, idéalement 0 € ou quelques euros par mois pour un MVP. Les sources réglementaires gratuites et officielles devront être privilégiées.

Les principales dépenses potentielles seront : utilisation d'un modèle IA/API ; hébergement de l'automatisation ; stockage ; éventuels services de collecte ou notification.

## 17. MVP proposé

**MVP V1**
- Entrées : profil de l'entreprise + liste des thèmes réglementaires.
- Sources : Légifrance + EUR-Lex + quelques autorités sectorielles.
- Automatisation : recherche quotidienne.
- IA : analyse des nouvelles publications.
- Filtre : score de pertinence.
- Sortie : alerte uniquement lorsqu'une évolution pertinente est détectée.
- Rapport : synthèse hebdomadaire facultative.

## 18. Critères de réussite

Le système sera considéré comme efficace s'il permet de : réduire fortement le temps consacré à la veille ; détecter les évolutions importantes suffisamment tôt ; limiter les faux positifs ; fournir systématiquement la source officielle ; expliquer simplement l'impact potentiel ; identifier les échéances importantes ; proposer des actions concrètes ; fonctionner automatiquement sans intervention quotidienne.

## 19. Vision cible

À terme, l'objectif n'est pas simplement d'avoir un moteur de recherche réglementaire. Il s'agit de créer un véritable assistant réglementaire autonome qui connaît le contexte de l'entreprise et peut dire :

« J'ai surveillé les nouvelles publications réglementaires. J'ai identifié deux changements susceptibles de vous concerner. Voici ce qui change, pourquoi cela vous concerne, quand cela s'applique et ce que vous devriez vérifier. »

Le principe directeur du produit est donc : l'utilisateur ne cherche plus la réglementation. Le système surveille la réglementation et vient vers l'utilisateur lorsqu'une action ou une attention est nécessaire.

## 20. Compléments suite à relecture critique (2026-09-04)

Décisions et ajustements retenus après revue du document initial, à intégrer dans toute implémentation :

**Fiabilité de la collecte (section 6).** La recherche par mots-clés seule est insuffisante pour garantir l'exhaustivité (risque de faux négatifs, le plus dangereux dans un système de veille). Le collecteur doit s'appuyer en priorité sur des flux structurés et officiels plutôt que sur une recherche web générique :
- Légifrance : flux RSS du Journal Officiel.
- EUR-Lex : flux RSS/Atom des publications récentes, éventuellement complétés par des alertes email sur recherche sauvegardée (fonctionnalité native EUR-Lex) comme filet de sécurité.
- La recherche web (WebSearch/WebFetch) reste utile en complément pour les sources sectorielles sans flux structuré, mais ne doit pas être la seule méthode pour Légifrance/EUR-Lex.

**Déduplication (section 6).** Se baser sur un identifiant canonique du texte plutôt que sur une comparaison de titre : numéro NOR pour les textes français, numéro CELEX pour les textes UE.

**Profil entreprise (section 8).** Trancher explicitement si MPE Europe est fabricant (responsabilité pleine : marquage CE, notice, analyse de risques) ou intégrateur/ingénierie sur des équipements tiers — ce point détermine une grande partie du corpus réglementaire applicable et doit être validé avant calibration du scoring.

**Calibration du scoring (section 9).** Prévoir une phase de rodage de 2 à 3 semaines où tout ce qui dépasse le seuil "à surveiller" (31) reste visible dans un rapport plutôt que d'activer immédiatement les alertes critiques, afin de calibrer les seuils sur des textes réels avant de couper au niveau alerte immédiate.

**Notifications (section 10).** Retenir un canal unique pour le MVP plutôt que la liste ouverte initiale (« notification ChatGPT » n'est pas applicable ici). Les options réalistes sont : notification push/email native d'une tâche planifiée, ou un connecteur dédié (email, Slack, Teams) si Damien le souhaite — à trancher au moment du choix de solution technique.

**Coût (section 16).** Les sources (Légifrance, EUR-Lex) sont gratuites. Le coût réel dépend de la solution technique choisie pour l'automatisation et l'analyse IA (abonnement existant vs API facturée à l'usage) — voir la comparaison des solutions techniques dans le document séparé à venir.
