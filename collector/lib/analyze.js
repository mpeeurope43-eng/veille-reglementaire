/**
 * Analyse un texte réglementaire avec l'API Gemini (tier gratuit) selon le profil MPE Europe.
 * Répond aux questions du cahier des charges : qu'est-ce qui change, qui est concerné,
 * sommes-nous concernés, quand, quel impact, que faut-il faire.
 *
 * Utilise la nouvelle Interactions API (POST /v1beta/interactions, header x-goog-api-key),
 * pas l'ancien endpoint generateContent (?key=...) : depuis septembre 2026, Google AI Studio
 * n'émet plus que des clés "auth" (préfixe "AQ.") et celles-ci sont rejetées (401
 * ACCESS_TOKEN_TYPE_UNSUPPORTED) par l'ancien endpoint. Voir
 * https://ai.google.dev/gemini-api/docs/migrate-to-interactions.
 *
 * Modèle "flash-lite" plutôt que le flash standard : suffisant pour une tâche de
 * classification/extraction structurée, et le tier gratuit lui accorde généralement plus
 * de requêtes/minute que les modèles "flash" les plus récents (ex. gemini-3.8-flash était
 * limité à 5 req/min en tier gratuit, ce qui faisait échouer la majorité des analyses sur
 * un lot de ~100 textes/jour).
 *
 * Gère aussi les erreurs 429 (quota dépassé) avec une reprise automatique : Google indique
 * dans le message d'erreur le délai à respecter ("Please retry in X.Ys"), on l'utilise s'il
 * est présent, sinon on retombe sur un backoff exponentiel.
 */
const MODELE = "gemini-flash-lite-latest";
const DELAI_ENTRE_APPELS_MS = 4000; // marge de sécurité pour rester sous la limite req/min du tier gratuit
const NB_TENTATIVES_MAX = 5;

function attendre(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extraireDelaiSuggere(messageErreur) {
  const m = /retry in (\d+(?:\.\d+)?)s/i.exec(messageErreur || "");
  return m ? Math.ceil(parseFloat(m[1]) * 1000) : null;
}
const SCHEMA_ANALYSE = {
  type: "OBJECT",
  properties: {
    resume: { type: "STRING" },
    quiEstConcerne: { type: "STRING" },
    sommesNousConcernes: {
      type: "STRING",
      enum: ["Oui", "Probablement", "À vérifier", "Non pertinent"],
    },
    justificationPertinence: { type: "STRING" },
    dateEntreeVigueur: { type: "STRING" },
    echeanceMiseEnConformite: { type: "STRING" },
    impact: {
      type: "STRING",
      enum: ["Critique", "Important", "À surveiller", "Informatif"],
    },
    score: { type: "NUMBER" },
    actionsRecommandees: { type: "ARRAY", items: { type: "STRING" } },
    themeId: { type: "STRING" },
  },
  required: [
    "resume",
    "quiEstConcerne",
    "sommesNousConcernes",
    "justificationPertinence",
    "dateEntreeVigueur",
    "echeanceMiseEnConformite",
    "impact",
    "score",
    "actionsRecommandees",
    "themeId",
  ],
};

export async function analyserTexte({ apiKey, texte, profil }) {
  const prompt = construirePrompt(texte, profil);

  for (let tentative = 1; tentative <= NB_TENTATIVES_MAX; tentative++) {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        model: MODELE,
        input: prompt,
        response_format: [
          {
            type: "text",
            mime_type: "application/json",
            schema: SCHEMA_ANALYSE,
          },
        ],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const etapeSortie = (data.steps || []).find((s) => s.type === "model_output");
      const brut = etapeSortie?.content?.find((c) => c.type === "text")?.text;
      if (!brut) throw new Error("[analyze] Réponse Gemini vide ou inattendue.");

      try {
        return JSON.parse(brut);
      } catch (e) {
        throw new Error(`[analyze] Réponse Gemini non JSON : ${brut.slice(0, 300)}`);
      }
    }

    const texteErreur = await res.text();

    if (res.status === 429 && tentative < NB_TENTATIVES_MAX) {
      const delaiSuggere = extraireDelaiSuggere(texteErreur);
      const delai = delaiSuggere ?? tentative * 5000; // backoff si Google ne suggère pas de délai
      await attendre(delai);
      continue;
    }

    throw new Error(`[analyze] Échec appel Gemini : ${res.status} ${texteErreur}`);
  }
}

function construirePrompt(texte, profil) {
  return `Tu es un expert en conformité réglementaire et ingénieur sécurité pour un fabricant/intégrateur d'équipements industriels.

PROFIL DE L'ENTREPRISE (MPE Europe SAS) :
${JSON.stringify(profil, null, 2)}

NOUVEAU TEXTE RÉGLEMENTAIRE DÉTECTÉ :
Titre : ${texte.titre}
Source : ${texte.source}
Organisme : ${texte.organisme}
Date de publication : ${texte.datePublication}
URL officielle : ${texte.url}
Extrait / contenu : ${texte.contenuBrut}

Analyse ce texte et réponds STRICTEMENT en JSON valide avec ces champs exacts, sans aucun texte autour :
{
  "resume": "résumé simple du changement en 2-3 phrases",
  "quiEstConcerne": "entreprises/secteurs/produits/activités potentiellement concernés",
  "sommesNousConcernes": "Oui" | "Probablement" | "À vérifier" | "Non pertinent",
  "justificationPertinence": "pourquoi, en une phrase, en te basant précisément sur le profil ci-dessus",
  "dateEntreeVigueur": "date si identifiable dans le texte, sinon null",
  "echeanceMiseEnConformite": "date si identifiable, sinon null",
  "impact": "Critique" | "Important" | "À surveiller" | "Informatif",
  "score": <entier 0-100, cohérent avec l'impact ci-dessus>,
  "actionsRecommandees": ["action concrète courte", "..."],
  "themeId": "identifiant du thème du profil le plus proche (ex: machines, atex, contact-alimentaire, ehedg, ped, reach-clp, environnement, export), ou null si aucun ne correspond"
}

Sois strict sur "sommesNousConcernes" : si le texte ne correspond à aucune activité, secteur, équipement ou matériau du profil, réponds "Non pertinent" avec un score bas (<20), même si le texte a l'air important en général. N'invente pas de dates ou de faits absents du texte fourni.`;
}
