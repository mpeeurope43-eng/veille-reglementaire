/**
 * Client pour l'API Légifrance via PISTE (DILA) — source officielle française.
 *
 * ⚠️ À VALIDER : la structure exacte des requêtes de l'API Légifrance (endpoints /search,
 * noms des champs "fond", "recherche", etc.) est reconstituée à partir de la documentation
 * publique PISTE et du projet open source pylegifrance, mais n'a pas pu être testée en
 * conditions réelles dans cet environnement (pas de compte PISTE disponible ici).
 * Une fois le compte PISTE créé (README étape 3), vérifier ce module contre la doc technique
 * de ton application PISTE (onglet "Documentation" de l'API Légifrance) et ajuster si besoin.
 */

let cachedToken = null;
let cachedTokenExpiry = 0;

async function obtenirToken(tokenUrl, clientId, clientSecret) {
  if (cachedToken && Date.now() < cachedTokenExpiry) return cachedToken;

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "openid",
    }),
  });

  if (!res.ok) {
    throw new Error(`[legifrance] Échec authentification PISTE : ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedToken = data.access_token;
  // marge de sécurité de 60s avant expiration
  cachedTokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

/**
 * Recherche les textes JORF récents correspondant aux mots-clés du profil (un thème à la fois,
 * pour rester lisible et limiter la taille des requêtes).
 */
export async function rechercherLegifrance({ pisteApiBaseUrl, pisteTokenUrl, clientId, clientSecret, motsCles, depuisDate }) {
  if (!clientId || !clientSecret) {
    console.warn("[legifrance] PISTE_CLIENT_ID / PISTE_CLIENT_SECRET non configurés — source ignorée.");
    return [];
  }

  const token = await obtenirToken(pisteTokenUrl, clientId, clientSecret);

  const resultats = [];

  for (const motCle of motsCles) {
    const body = {
      recherche: {
        champs: [
          {
            typeChamp: "ALL",
            criteres: [{ typeRecherche: "UN_DES_MOTS", valeur: motCle, operateur: "ET" }],
            operateur: "ET",
          },
        ],
        filtres: [
          {
            facette: "DATE_PUBLICATION",
            dates: { start: depuisDate, end: null },
          },
        ],
        pageNumber: 1,
        pageSize: 20,
        sort: "PUBLICATION_DATE_DESC",
      },
      fond: "JORF",
    };

    const res = await fetch(`${pisteApiBaseUrl}/search`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(`[legifrance] Recherche échouée pour "${motCle}" : ${res.status} ${await res.text()}`);
      continue;
    }

    const data = await res.json();
    for (const item of data.results || []) {
      resultats.push({
        source: "Légifrance (JORF)",
        juridiction: "France",
        identifiant: item.nor || item.id || item.titre,
        titre: item.titre || item.titreLong || "",
        url: item.id ? `https://www.legifrance.gouv.fr/jorf/id/${item.id}` : "",
        datePublication: item.datePublication || null,
        contenuBrut: item.texteResume || item.titreLong || "",
        organisme: item.ministere || "France — Journal officiel",
      });
    }
  }

  // Déduplication interne (un même texte peut matcher plusieurs mots-clés)
  const parIdentifiant = new Map();
  for (const r of resultats) parIdentifiant.set(r.identifiant, r);
  return [...parIdentifiant.values()];
}
