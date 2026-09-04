import { readFileSync, writeFileSync } from "node:fs";
import { recupererEurLex } from "./sources/eurlex.js";
import { rechercherLegifrance } from "./sources/legifrance.js";
import { initFirestore, existeDeja, enregistrerTexte, chargerSeuils } from "./lib/firestore.js";
import { analyserTexte } from "./lib/analyze.js";
import { envoyerAlerte } from "./lib/notify.js";

const profil = JSON.parse(readFileSync(new URL("./config/profil.json", import.meta.url)));
const seuilsParDefaut = JSON.parse(readFileSync(new URL("./config/seuils.json", import.meta.url)));
const sourcesConfig = JSON.parse(readFileSync(new URL("./config/sources.json", import.meta.url)));

const log = { debut: new Date().toISOString(), etapes: [], erreurs: [] };

async function main() {
  const db = initFirestore();
  const seuils = await chargerSeuils(db, seuilsParDefaut);

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
  let nbAlertes = 0;
  for (const texte of nouveaux) {
    try {
      const analyse = await analyserTexte({ apiKey: process.env.GEMINI_API_KEY, texte, profil });

      await enregistrerTexte(db, {
        ...texte,
        ...analyse,
        alerteEnvoyee: false,
      });

      const critique = analyse.score >= seuils.critiqueMin;
      if (critique && seuils.alerteImmediateActive) {
        await envoyerAlerte({
          smtpHost: process.env.SMTP_HOST,
          smtpPort: process.env.SMTP_PORT,
          smtpUser: process.env.SMTP_USER,
          smtpPass: process.env.SMTP_PASS,
          destinataire: process.env.ALERT_EMAIL_TO,
          texte,
          analyse,
        });
        nbAlertes++;
      }

      log.etapes.push(`✓ "${texte.titre.slice(0, 80)}" — score ${analyse.score}, impact ${analyse.impact}.`);
    } catch (e) {
      log.erreurs.push(`Analyse "${texte.titre?.slice(0, 60)}": ${e.message}`);
    }
  }

  log.etapes.push(`Terminé. ${nbAlertes} alerte(s) envoyée(s).`);
  ecrireLog();
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
