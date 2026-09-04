import nodemailer from "nodemailer";

/**
 * Envoie une alerte email pour un texte au-dessus du seuil critique.
 * Format d'alerte conforme au cahier des charges section 10 : titre, résumé, impact,
 * entreprises concernées, échéance, action recommandée, source.
 */
export async function envoyerAlerte({ smtpHost, smtpPort, smtpUser, smtpPass, destinataire, texte, analyse }) {
  if (!smtpHost || !destinataire) {
    console.warn("[notify] SMTP non configuré — alerte non envoyée (voir README étape 8).");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(smtpPort) || 587,
    secure: Number(smtpPort) === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

  const html = `
    <h2>🔴 Nouvelle évolution réglementaire détectée — ${analyse.impact}</h2>
    <p><strong>Titre :</strong> ${texte.titre}</p>
    <p><strong>Résumé :</strong> ${analyse.resume}</p>
    <p><strong>Impact :</strong> ${analyse.impact} (score ${analyse.score}/100)</p>
    <p><strong>Concerne MPE Europe :</strong> ${analyse.sommesNousConcernes} — ${analyse.justificationPertinence}</p>
    <p><strong>Échéance :</strong> ${analyse.echeanceMiseEnConformite || "non identifiée"}</p>
    <p><strong>Actions recommandées :</strong></p>
    <ul>${(analyse.actionsRecommandees || []).map((a) => `<li>${a}</li>`).join("")}</ul>
    <p><strong>Source officielle :</strong> <a href="${texte.url}">${texte.url}</a></p>
    <hr/>
    <p style="color:#888;font-size:12px;">ANALYSE IA — à vérifier auprès du texte officiel avant toute décision. Généré automatiquement par Veille Réglementaire (MPE Europe).</p>
  `;

  await transporter.sendMail({
    from: `"Veille Réglementaire MPE" <${smtpUser}>`,
    to: destinataire,
    subject: `[Veille réglementaire] ${analyse.impact} — ${texte.titre}`,
    html,
  });

  return true;
}
