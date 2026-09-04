import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

/**
 * Initialise Firebase Admin à partir du secret FIREBASE_SERVICE_ACCOUNT
 * (contenu JSON complet de la clé de compte de service, collé tel quel en secret GitHub).
 */
export function initFirestore() {
  if (getApps().length === 0) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT manquant. Voir README étape 6 (compte de service Firebase Admin, projet mpe-suite)."
      );
    }
    const serviceAccount = JSON.parse(raw);
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

/**
 * Vérifie si un identifiant (NOR ou CELEX) existe déjà dans l'historique — base de la déduplication.
 */
export async function existeDeja(db, identifiant) {
  if (!identifiant) return false;
  const snap = await db
    .collection("veille")
    .doc("textes")
    .collection("items")
    .where("identifiant", "==", identifiant)
    .limit(1)
    .get();
  return !snap.empty;
}

/**
 * Écrit un nouveau texte détecté et analysé dans Firestore.
 */
export async function enregistrerTexte(db, texte) {
  const ref = db.collection("veille").doc("textes").collection("items").doc();
  await ref.set({
    ...texte,
    dateDetection: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

/**
 * Charge les seuils depuis Firestore si présents, sinon retourne les valeurs par défaut fournies.
 * Permet d'ajuster les seuils depuis le dashboard sans redéployer le collecteur.
 */
export async function chargerSeuils(db, seuilsParDefaut) {
  const snap = await db.collection("veille").doc("config").collection("params").doc("seuils").get();
  if (snap.exists) return { ...seuilsParDefaut, ...snap.data() };
  return seuilsParDefaut;
}
