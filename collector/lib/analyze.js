/**
 * Analyse un texte réglementaire avec l'API Gemini (tier gratuit) selon le profil MPE Europe.
 * Répond aux questions du cahier des charges : qu'est-ce qui change, qui est concerné,
 * sommes-nous concernés, quand, quel impact, que faut-il faire.
 */
export async function analyserTexte({ apiKey, texte, profil }) {
  const prompt = construirePrompt(texte, profil);

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`[analyze] Échec appel Gemini : ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const brut = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!brut) throw new Error("[analyze] Réponse Gemini vide ou inattendue.");

  try {
    return JSON.parse(brut);
  } catch (e) {
    throw new Error(`[analyze] Réponse Gemini non JSON : ${brut.slice(0, 300)}`);
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
