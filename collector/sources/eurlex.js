import Parser from "rss-parser";

const parser = new Parser();

/**
 * Récupère les entrées du flux RSS EUR-Lex (recherche sauvegardée par l'utilisateur — voir README étape 4).
 * Extrait le numéro CELEX depuis l'URL quand c'est possible.
 */
export async function recupererEurLex(rssUrl) {
  if (!rssUrl || rssUrl.startsWith("A_REMPLACER")) {
    console.warn("[eurlex] URL de flux RSS non configurée (collector/config/sources.json) — source ignorée.");
    return [];
  }

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
}

function extraireCelex(url) {
  const match = url.match(/CELEX[:%3A]*([0-9A-Z]+)/i);
  return match ? match[1] : null;
}
