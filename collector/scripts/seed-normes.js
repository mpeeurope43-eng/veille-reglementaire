/**
 * Initialise la collection "Normes applicables" (veille/normes/items) à partir de la liste
 * de départ préparée par Damien (normes techniques NF/EN/ISO pertinentes pour l'activité de
 * MPE Europe), classée par thème réglementaire (mêmes thèmes que collector/config/profil.json
 * et la Base de connaissances).
 *
 * À exécuter une fois (ou après ajout de nouvelles normes à cette liste), manuellement,
 * après avoir configuré FIREBASE_SERVICE_ACCOUNT en local ou en variable d'environnement :
 *
 *   FIREBASE_SERVICE_ACCOUNT="$(cat chemin/vers/service-account.json)" node scripts/seed-normes.js
 *
 * Ou via le workflow GitHub Actions "Initialiser la base de connaissances" (Actions →
 * workflow_dispatch), qui exécute aussi ce script.
 *
 * Sans effet si une norme du même id existe déjà (ne écrase pas le lien que tu aurais déjà
 * renseigné depuis le dashboard) — se relance donc sans risque.
 *
 * "theme" vaut null pour les normes qui ne correspondent à aucun thème réglementaire suivi
 * actuellement (ex. cybersécurité industrielle) — elles apparaissent alors sous "Autre / non
 * classé" dans le dashboard, à reclasser plus tard si un thème dédié est créé.
 */
import { initFirestore } from "../lib/firestore.js";

const normes = [
  // --- Sécurité des machines (obligatoire ou fortement recommandée) ---
  { id: "iso-12100", reference: "NF EN ISO 12100", titre: "Sécurité des machines - Principes généraux de conception - Appréciation du risque et réduction du risque", dateNorme: "2010-12-01", theme: "machines" },
  { id: "iso-13849-1", reference: "NF EN ISO 13849-1", titre: "Sécurité des machines - Parties des systèmes de commande relatives à la sécurité - Partie 1 : principes généraux de conception", dateNorme: "2013-05-01", theme: "machines" },
  { id: "iso-13849-2", reference: "NF EN ISO 13849-2", titre: "Sécurité des machines - Parties des systèmes de commande relatives à la sécurité - Partie 2 : validation", dateNorme: "2012-12-01", theme: "machines" },
  { id: "iso-13850", reference: "NF EN ISO 13850", titre: "Sécurité des machines - Fonction d'arrêt d'urgence - Principes de conception", dateNorme: "2015-12-01", theme: "machines" },
  { id: "iso-13854", reference: "NF EN ISO 13854", titre: "Sécurité des machines - Écartements minimaux pour prévenir les risques d'écrasement de parties du corps humain", dateNorme: "2019-09-01", theme: "machines" },
  { id: "iso-13855", reference: "NF EN ISO 13855", titre: "Sécurité des machines - Positionnement des moyens de protection par rapport à l'approche du corps humain", dateNorme: "2024-12-01", theme: "machines" },
  { id: "iso-13857", reference: "NF EN ISO 13857", titre: "Sécurité des machines - Distances de sécurité empêchant les membres supérieurs et inférieurs d'atteindre les zones dangereuses", dateNorme: "2019-10-01", theme: "machines" },
  { id: "en-61496", reference: "NF EN 61496-1 / -2", titre: "Équipements de protection électrosensibles (ex. barrières immatérielles)", dateNorme: null, theme: "machines" },

  // --- Moyens d'accès et ergonomie ---
  { id: "iso-14122-1", reference: "NF EN ISO 14122-1", titre: "Sécurité des machines - Moyens d'accès permanents aux machines - Partie 1 : choix d'un moyen d'accès et des exigences générales d'accès", dateNorme: "2017-03-01", theme: "machines" },
  { id: "iso-14122-2", reference: "NF EN ISO 14122-2", titre: "Sécurité des machines - Moyens d'accès permanents aux machines - Partie 2 : plates-formes de travail et passerelles", dateNorme: "2017-03-01", theme: "machines" },
  { id: "iso-14122-3", reference: "NF EN ISO 14122-3", titre: "Sécurité des machines - Moyens d'accès permanents aux machines - Partie 3 : escaliers, échelles à marches et garde-corps", dateNorme: "2017-03-01", theme: "machines" },
  { id: "iso-14122-4", reference: "NF EN ISO 14122-4", titre: "Sécurité des machines - Moyens d'accès permanents aux machines - Partie 4 : échelles fixes", dateNorme: "2017-03-01", theme: "machines" },

  // --- Équipements électriques / Automatisme ---
  { id: "en-60204-1", reference: "NF EN 60204-1", titre: "Sécurité des machines – Équipements électriques des machines – Partie 1 : Règles générales", dateNorme: null, theme: "machines" },
  { id: "iec-62061", reference: "NF EN IEC 62061", titre: "Sécurité fonctionnelle des systèmes de commande électriques, électroniques et programmables", dateNorme: null, theme: "machines" },
  { id: "en-61311", reference: "NF EN 61311", titre: "Représentation schématique des circuits électriques", dateNorme: null, theme: "machines" },

  // --- Process, automatisation, fluides ---
  { id: "en-617", reference: "NF EN 617/IN1", titre: "Équipements et systèmes de manutention continue - Prescriptions de sécurité et de CEM pour les équipements de stockage des produits en vrac en silos, soutes, réservoirs et trémies", dateNorme: "2011-02-01", theme: "machines" },
  { id: "en-618", reference: "NF EN 618+A1", titre: "Équipements et systèmes de manutention continue - Prescriptions de sécurité et de CEM pour les équipements de manutention mécanique des produits en vrac à l'exception des transporteurs fixes à courroie", dateNorme: "2011-02-01", theme: "machines" },
  { id: "en-741-in1", reference: "NF EN 741/IN1", titre: "Équipements et systèmes de manutention continue - Prescriptions de sécurité pour les systèmes et leurs composants pour la manutention pneumatique des produits en vrac", dateNorme: "2011-02-01", theme: "machines" },
  { id: "en-741-a1", reference: "NF EN 741+A1", titre: "Équipements et systèmes de manutention continue - Prescriptions de sécurité pour les systèmes et leurs composants pour la manutention pneumatique des produits en vrac", dateNorme: "2011-02-01", theme: "machines" },
  { id: "iso-4413", reference: "NF EN ISO 4413", titre: "Systèmes hydrauliques – Règles de sécurité", dateNorme: null, theme: "machines" },
  { id: "iso-4414", reference: "NF EN ISO 4414", titre: "Systèmes pneumatiques – Règles de sécurité", dateNorme: null, theme: "machines" },
  { id: "iso-1219", reference: "NF EN ISO 1219", titre: "Symboles pour schémas hydrauliques et pneumatiques", dateNorme: null, theme: "machines" },

  // --- Spécifique au secteur agroalimentaire ---
  { id: "en-1672-1", reference: "NF EN 1672-1", titre: "Machines pour les produits alimentaires - Notions fondamentales - Partie 1 : prescriptions relatives à la sécurité", dateNorme: "2016-07-01", theme: "machines" },
  { id: "en-1672-2", reference: "NF EN 1672-2", titre: "Machines pour les produits alimentaires - Notions fondamentales - Partie 2 : prescriptions relatives à l'hygiène et à la nettoyabilité", dateNorme: "2016-07-01", theme: "ehedg" },
  { id: "iso-14159", reference: "ISO 14159", titre: "Sécurité des machines - Prescriptions relatives à l'hygiène lors de la conception des machines", dateNorme: "2008-08-01", theme: "ehedg" },

  // --- Optionnel selon le domaine ---
  { id: "en-62443", reference: "NF EN 62443", titre: "Cybersécurité pour les systèmes d'automatisation industrielle", dateNorme: null, theme: null },
  { id: "en-62079", reference: "NF EN 62079", titre: "Sécurité des machines - Notice d'instructions - Principes rédactionnels généraux", dateNorme: "2019-07-01", theme: "machines" },
  { id: "iso-12163", reference: "ISO 12163", titre: "Procédures de validation des performances", dateNorme: null, theme: "machines" },
  { id: "iso-14123", reference: "ISO 14123-1 / -2", titre: "Risques dus aux substances dangereuses émanant des machines", dateNorme: null, theme: "reach-clp" },

  // --- PID / documentation d'ingénierie ---
  { id: "ansi-isa-5-1", reference: "ANSI/ISA-5.1-2009", titre: "Instrumentation Symbols and Identification", dateNorme: null, theme: "ingenierie-be" },
  { id: "iso-10628-1", reference: "NF EN ISO 10628-1", titre: "Schémas de procédé pour l'industrie chimique et pétrochimique - Partie 1 : spécification des schémas de procédé", dateNorme: null, theme: "ingenierie-be" },
  { id: "iso-10628-2", reference: "NF EN ISO 10628-2", titre: "Schémas de procédé pour l'industrie chimique et pétrochimique - Partie 2 : symboles graphiques", dateNorme: null, theme: "ingenierie-be" },
];

async function seed() {
  const db = initFirestore();
  const batch = db.batch();
  let nbAjoutes = 0;

  for (const n of normes) {
    const ref = db.collection("veille").doc("normes").collection("items").doc(n.id);
    const existant = await ref.get();
    if (existant.exists) {
      console.log(`- "${n.reference}" existe déjà, non écrasé.`);
      continue;
    }
    batch.set(ref, {
      reference: n.reference,
      titre: n.titre,
      dateNorme: n.dateNorme,
      theme: n.theme,
      lien: "",
      statut: "À vérifier",
      derniereMiseAJour: new Date().toISOString(),
    });
    nbAjoutes++;
    console.log(`+ "${n.reference}" ajouté.`);
  }

  if (nbAjoutes > 0) await batch.commit();
  console.log(`Normes applicables : ${nbAjoutes} ajoutée(s) sur ${normes.length}.`);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
