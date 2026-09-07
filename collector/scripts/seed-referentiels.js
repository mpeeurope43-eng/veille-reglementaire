/**
 * Initialise la "base de connaissances" (collection veille/referentiels) avec les thèmes
 * réglementaires identifiés dans le profil MPE Europe. À exécuter une fois, manuellement,
 * après avoir configuré FIREBASE_SERVICE_ACCOUNT en local ou en variable d'environnement :
 *
 *   FIREBASE_SERVICE_ACCOUNT="$(cat chemin/vers/service-account.json)" node scripts/seed-referentiels.js
 *
 * Sans effet si une fiche du même id existe déjà (ne écrase pas les liens vers des documents
 * internes que tu aurais déjà ajoutés depuis le dashboard).
 */
import { initFirestore } from "../lib/firestore.js";

const referentiels = [
  {
    id: "machines",
    nom: "Règlement Machines (UE) 2023/1230",
    domaine: "Sécurité des machines",
    resumeBesoin:
      "Remplace la Directive Machines 2006/42/CE, applicable à partir du 20 janvier 2027. Encadre le marquage CE, la notice, l'analyse de risques des équipements fabriqués ou intégrés par MPE Europe.",
    referentiels: ["Règlement (UE) 2023/1230", "Ex-Directive 2006/42/CE"],
    liensSourcesOfficielles: ["https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R1230"],
    liensDocumentsInternes: [],
    statut: "À vérifier",
  },
  {
    id: "atex",
    nom: "ATEX — atmosphères explosives",
    domaine: "Sécurité / poussières combustibles",
    resumeBesoin:
      "Pertinent si le broyage de matières sèches génère des poussières combustibles. Deux volets : équipements (2014/34/UE) et lieux de travail (1999/92/CE).",
    referentiels: ["Directive 2014/34/UE", "Directive 1999/92/CE"],
    liensSourcesOfficielles: [
      "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32014L0034",
      "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:31999L0092",
    ],
    liensDocumentsInternes: [],
    statut: "À vérifier",
  },
  {
    id: "contact-alimentaire",
    nom: "Matériaux au contact alimentaire",
    domaine: "Agroalimentaire / pet food",
    resumeBesoin:
      "Concerne les équipements en contact avec des denrées alimentaires ou du pet food (inox alimentaire notamment).",
    referentiels: ["Règlement (CE) 1935/2004"],
    liensSourcesOfficielles: ["https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32004R1935"],
    liensDocumentsInternes: [],
    statut: "À vérifier",
  },
  {
    id: "ehedg",
    nom: "Conception hygiénique (EHEDG)",
    domaine: "Agroalimentaire / pet food",
    resumeBesoin:
      "Lignes directrices non contraignantes légalement mais standard de référence pour la conception hygiénique de machines, souvent exigées contractuellement par les clients agroalimentaires.",
    referentiels: ["Lignes directrices EHEDG"],
    liensSourcesOfficielles: ["https://www.ehedg.org/"],
    liensDocumentsInternes: [],
    statut: "À vérifier",
  },
  {
    id: "ped",
    nom: "Équipements sous pression (PED)",
    domaine: "Sécurité des équipements",
    resumeBesoin: "Pertinent si le transport pneumatique de matières est concerné par de la pression.",
    referentiels: ["Directive 2014/68/UE"],
    liensSourcesOfficielles: ["https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32014L0068"],
    liensDocumentsInternes: [],
    statut: "À vérifier",
  },
  {
    id: "reach-clp",
    nom: "REACH / CLP — substances chimiques",
    domaine: "Chimie / matériaux",
    resumeBesoin: "Concerne les alliages, revêtements et substances utilisés dans la fabrication, et les clients du secteur chimie.",
    referentiels: ["Règlement (CE) 1907/2006 (REACH)", "Règlement (CE) 1272/2008 (CLP)"],
    liensSourcesOfficielles: ["https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32006R1907"],
    liensDocumentsInternes: [],
    statut: "À vérifier",
  },
  {
    id: "environnement",
    nom: "Environnement / ICPE",
    domaine: "Environnement",
    resumeBesoin: "Pertinent en cas d'installation sur site propre ou classée chez un client (émissions de poussières notamment).",
    referentiels: ["Nomenclature ICPE"],
    liensSourcesOfficielles: ["https://www.legifrance.gouv.fr/"],
    liensDocumentsInternes: [],
    statut: "À vérifier",
  },
  {
    id: "export",
    nom: "Douanes / export hors UE",
    domaine: "International",
    resumeBesoin: "Pertinent si des équipements ou pièces sont exportés hors UE via le groupe MPE.",
    referentiels: [],
    liensSourcesOfficielles: [],
    liensDocumentsInternes: [],
    statut: "À vérifier",
  },
  {
    id: "ingenierie-be",
    nom: "Responsabilité du bureau d'études / ingénierie",
    domaine: "BE process / maîtrise d'œuvre",
    resumeBesoin:
      "Concerne les missions de conception, dimensionnement et maîtrise d'œuvre d'installations chez le client : garantie décennale (10 ans, désordres affectant la solidité ou la destination de l'ouvrage) et responsabilité civile professionnelle pour le reste (erreurs de conseil, retards, préjudices immatériels).",
    referentiels: ["Loi Spinetta (1978)", "Code civil, art. 1792 et s. (garantie décennale)"],
    liensSourcesOfficielles: [],
    liensDocumentsInternes: [],
    statut: "À vérifier",
  },
  {
    id: "securite-chantier",
    nom: "Sécurité lors des interventions / installations chez le client",
    domaine: "Installation / mise en service",
    resumeBesoin:
      "S'applique dès qu'une équipe MPE intervient sur le site d'un client : plan de prévention obligatoire (entreprise extérieure / entreprise utilisatrice) et, si l'opération relève du bâtiment ou du génie civil avec plusieurs entreprises, coordination SPS + PPSPS.",
    referentiels: ["Code du travail (plan de prévention, entreprises extérieures)", "Coordination SPS"],
    liensSourcesOfficielles: [],
    liensDocumentsInternes: [],
    statut: "À vérifier",
  },
  {
    id: "sous-traitance",
    nom: "Sous-traitance",
    domaine: "Contrats / relations donneur d'ordre-sous-traitant",
    resumeBesoin:
      "MPE peut être donneuse d'ordre ou sous-traitante selon les projets — obligations réciproques (agrément du sous-traitant, garantie de paiement côté donneur d'ordre, action directe côté sous-traitant).",
    referentiels: ["Loi n°75-1334 du 31 décembre 1975"],
    liensSourcesOfficielles: [],
    liensDocumentsInternes: [],
    statut: "À vérifier",
  },
];

async function seed() {
  const db = initFirestore();
  const batch = db.batch();

  for (const r of referentiels) {
    const ref = db.collection("veille").doc("referentiels").collection("items").doc(r.id);
    const existant = await ref.get();
    if (existant.exists) {
      console.log(`- "${r.nom}" existe déjà, non écrasé.`);
      continue;
    }
    batch.set(ref, { ...r, derniereMiseAJour: new Date().toISOString() });
    console.log(`+ "${r.nom}" ajouté.`);
  }

  await batch.commit();
  console.log("Base de connaissances initialisée.");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
