import Parser from "rss-parser";

const parser = new Parser();

/**
 * Récupère les entrées d'un ou plusieurs flux RSS EUR-Lex (recherches sauvegardées par
 * l'utilisateur — voir README étape 4). Accepte soit une seule URL (chaîne, rétrocompatible),
 * soit un tableau d'URLs — utile car EUR-Lex ne combine fiablement que 2 mots-clés par
 * recherche avec OR ; on peut donc créer une recherche/un flux par thème (2 termes max chacun)
 * plutôt qu'une seule requête géante qui ne fonctionne pas côté EUR-Lex.
 * Extrait le numéro CELEX depuis l'URL quand c'est possible, et déduplique entre flux.
 */
export async function recupererEurLex(rssUrlOuUrls) {
  const urls = (Array.isArray(rssUrlOuUrls) ? rssUrlOuUrls : [rssUrlOuUrls])
    .filter((u) => u && !String(u).startsWith("A_REMPLACER"));

  if (urls.length === 0) {
    console.warn("[eurlex] Aucune URL de flux RSS configurée (collector/config/sources.json) — source ignorée.");
    return [];
  }

  const resultatsParFlux = await Promise.all(
    urls.map(async (rssUrl) => {
      try {
        const feed = await parser.parseURL(rssUrl);
        return (feed.items || []).map((item) => {
          const celex = extraireCelex(item.link || item.guid || "");
          return {
            source: "EUR-Lex",
            juridiction: "Union européenne",
            identifiant: celex || item.guid || item.link,
            titre: item.title || "",
            url: item.link || "",
            datePublication: item.pubDate || item.isoDate || null,
            contenuBrut: item.contentSnippet || item.content || "",
            organisme: "Union européenne",
          };
        });
      } catch (e) {
        console.warn(`[eurlex] Échec lecture du flux ${rssUrl} : ${e.message}`);
        return [];
      }
    })
  );

  // Déduplication entre flux (un même texte peut matcher plusieurs recherches thématiques).
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

function extraireCelex(url) {
  const match = url.match(/CELEX[:%3A]*([0-9A-Z]+)/i);
  return match ? match[1] : null;
}
