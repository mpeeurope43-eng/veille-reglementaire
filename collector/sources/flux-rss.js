import Parser from "rss-parser";

const parser = new Parser();

/**
 * Récupère les entrées d'une liste de flux RSS génériques additionnels (ex: recherches
 * sauvegardées AFNOR "enquêtes publiques", alertes ECHA REACH/CLP, etc.) — même principe que
 * eurlex.js mais sans extraction CELEX (spécifique à EUR-Lex), et avec le nom de la source
 * défini dans collector/config/sources.json (champ "autresFluxRss": [{ "nom": "...", "url":
 * "..." }]).
 *
 * Ces flux sont fusionnés avec EUR-Lex et Légifrance dans index.js — chaque texte détecté
 * passe par la même analyse IA et le même stockage.
 */
export async function recupererFluxGeneriques(autresFluxRss) {
  const flux = (Array.isArray(autresFluxRss) ? autresFluxRss : [])
    .filter((f) => f && f.url && !String(f.url).startsWith("A_REMPLACER"));

  if (flux.length === 0) return [];

  const resultatsParFlux = await Promise.all(
    flux.map(async ({ nom, url }) => {
      try {
        const feed = await parser.parseURL(url);
        return (feed.items || []).map((item) => ({
          source: nom || "Source additionnelle",
          juridiction: nom || "Source additionnelle",
          identifiant: item.guid || item.link,
          titre: item.title || "",
          url: item.link || "",
          datePublication: item.pubDate || item.isoDate || null,
          contenuBrut: item.contentSnippet || item.content || "",
          organisme: nom || "Source additionnelle",
        }));
      } catch (e) {
        console.warn(`[flux-rss] Échec lecture du flux "${nom}" (${url}) : ${e.message}`);
        return [];
      }
    })
  );

  const vus = new Set();
  const tous = [];
  for (const item of resultatsParFlux.flat()) {
    const cle = item.identifiant || item.url;
    if (vus.has(cle)) continue;
    vus.add(cle);
    tous.push(item);
  }
  return tous;
}
