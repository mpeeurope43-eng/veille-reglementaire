import { readFileSync, writeFileSync } from "node:fs";
import { recupererEurLex } from "./sources/eurlex.js";
import { rechercherLegifrance } from "./sources/legifrance.js";
import { initFirestore, existeDeja, enregistrerTexte, chargerSeuils, chargerAbonnements } from "./lib/firestore.js";
import { analyserTexte } from "./lib/analyze.js";
import { envoyerAlerte } from "./lib/notify.js";

const profil = JSON.parse(readFileSync(new URL("./config/profil.json", import.meta.url)));
const seuilsParDefaut = JSON.parse(readFileSync(new URL("./config/seuils.json", import.meta.url)));
const sourcesConfig = JSON.parse(readFileSync(new URL("./config/sources.json", import.meta.url)));

const log = { debut: new Date().toISOString(), etapes: [], erreurs: [] };

async function main() {
  const db = initFirestore();
  const seuils = await chargerSeuils(db, seuilsParDefaut);
  const abonnements = await chargerAbonnements(db);

  // --- 1. Collecte ---
  const depuisDate = dateIlYA(2); // fenêtre de sécurité de 2 jours pour ne rien manquer entre deux exécutions

  const motsCles = profil.themesReglementaires.flatMap((t) => t.motsClesRecherche);

  const [textesEurLex, textesLegifrance] = await Promise.all([
    recupererEurLex(sourcesConfig.eurlexRssUrl).catch((e) => {
      log.erreurs.push(`EUR-Lex: ${e.message}`);
      return [];
    }),
    rechercherLegifrance({
      pisteApiBaseUrl: sourcesConfig.pisteApiBaseUrl,
      pisteTokenUrl: sourcesConfig.pisteTokenUrl,
      clientId: process.env.PISTE_CLIENT_ID,
      clientSecret: process.env.PISTE_CLIENT_SECRET,
      motsCles,
      depuisDate,
    }).catch((e) => {
      log.erreurs.push(`Légifrance: ${e.message}`);
      return [];
    }),
  ]);

  const tousLesTextes = [...textesEurLex, ...textesLegifrance];
  log.etapes.push(`Collecte : ${tousLesTextes.length} texte(s) trouvé(s) (${textesEurLex.length} EUR-Lex, ${textesLegifrance.length} Légifrance).`);

  // --- 2. Déduplication ---
  const nouveaux = [];
  for (const t of tousLesTextes) {
    const dejaVu = await existeDeja(db, t.identifiant);
    if (!dejaVu) nouveaux.push(t);
  }
  log.etapes.push(`Déduplication : ${nouveaux.length} nouveau(x) texte(s) sur ${tousLesTextes.length}.`);

  if (nouveaux.length === 0) {
    log.etapes.push("Rien de nouveau aujourd'hui — pas d'analyse IA, pas de notification.");
    ecrireLog();
    return;
  }

  // --- 3. Analyse IA + scoring + écriture + alerte ---
  // Petite pause entre chaque appel Gemini : le tier gratuit limite le nombre de requêtes
  // par minute, et enchaîner ~100 analyses sans pause fait échouer la quasi-totalité d'entre
  // elles (429 "quota exceeded"). analyserTexte() gère aussi une reprise automatique en cas
  // de dépassement ponctuel malgré cette pause.
  let nbAlertes = 0;
  let premierTexte = true;
  for (const texte of nouveaux) {
    if (!premierTexte) await attendre(4000);
    premierTexte = false;
    try {
      const analyse = await analyserTexte({ apiKey: process.env.GEMINI_API_KEY, texte, profil });

      await enregistrerTexte(db, {
        ...texte,
        ...analyse,
        alerteEnvoyee: false,
      });

      const critique = analyse.score >= seuils.critiqueMin;
      if (critique && seuils.alerteImmediateActive) {
        // Destinataire principal (ALERT_EMAIL_TO, reçoit tout) + abonnés ciblés par thème
        // (gérés depuis l'onglet Rapport périodique du dashboard), sans doublon.
        const destinataires = new Set();
        if (process.env.ALERT_EMAIL_TO) destinataires.add(process.env.ALERT_EMAIL_TO);
        for (const ab of abonnements) {
          const themes = ab.themes || [];
          const concerne = themes.includes("tous") || (analyse.themeId && themes.includes(analyse.themeId));
          if (concerne) destinataires.add(ab.email);
        }

        for (const destinataire of destinataires) {
          await envoyerAlerte({
            smtpHost: process.env.SMTP_HOST,
            smtpPort: process.env.SMTP_PORT,
            smtpUser: process.env.SMTP_USER,
            smtpPass: process.env.SMTP_PASS,
            destinataire,
            texte,
            analyse,
          });
          nbAlertes++;
        }
      }

      log.etapes.push(`✓ "${texte.titre.slice(0, 80)}" — score ${analyse.score}, impact ${analyse.impact}.`);
    } catch (e) {
      log.erreurs.push(`Analyse "${texte.titre?.slice(0, 60)}": ${e.message}`);
    }
  }

  log.etapes.push(`Terminé. ${nbAlertes} alerte(s) envoyée(s).`);
  ecrireLog();
}

function attendre(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dateIlYA(jours) {
  const d = new Date();
  d.setDate(d.getDate() - jours);
  return d.toISOString().slice(0, 10);
}

function ecrireLog() {
  log.fin = new Date().toISOString();
  writeFileSync("run-log.json", JSON.stringify(log, null, 2));
  console.log(JSON.stringify(log, null, 2));
}

main().catch((e) => {
  log.erreurs.push(`Erreur fatale: ${e.message}`);
  ecrireLog();
  process.exit(1);
});
