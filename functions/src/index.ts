import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/**
 * Normalizes Alumni Registration Number
 */
function normalizeNomorAlumni(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Sanitizes URLs to prevent XSS (javascript: or data: injections)
 */
function isSafeUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return trimmed.startsWith("https://") || trimmed.startsWith("http://");
}

/**
 * Callable Function: claimAlumni
 * Implements F-01, F-04, F-24:
 * - Server-side atomic validation against `alumni_registry`
 * - Validates second-factor (name matching)
 * - Prevents race conditions (TOCTOU) via Firestore Transaction
 * - Creates private `users/{uid}` and mirrored `public_profiles/{uid}` with official data
 */
export const claimAlumni = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Pengguna harus masuk terlebih dahulu untuk mengklaim akun alumni."
    );
  }

  const uid = context.auth.uid;
  const userEmail = context.auth.token.email || "";
  const rawNomor = data?.nomorAlumni;
  const inputNama = data?.namaLengkap;

  if (!rawNomor || typeof rawNomor !== "string" || !inputNama || typeof inputNama !== "string") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Nomor alumni dan nama lengkap wajib diisi."
    );
  }

  const normalizedNomor = normalizeNomorAlumni(rawNomor);
  const trimmedNama = inputNama.trim().toLowerCase();

  const registryRef = db.collection("alumni_registry").doc(normalizedNomor);
  const userRef = db.collection("users").doc(uid);
  const publicProfileRef = db.collection("public_profiles").doc(uid);

  return await db.runTransaction(async (transaction) => {
    // 1. Cek apakah user sudah terdaftar di users/{uid}
    const userDoc = await transaction.get(userRef);
    if (userDoc.exists && userDoc.data()?.nomorAlumni) {
      throw new functions.https.HttpsError(
        "already-exists",
        "Akun Anda sudah terhubung dengan data alumni."
      );
    }

    // 2. Baca data master registry
    const registryDoc = await transaction.get(registryRef);
    if (!registryDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "Nomor alumni tidak ditemukan dalam data master institusi."
      );
    }

    const masterData = registryDoc.data()!;

    // 3. Cek apakah nomor alumni sudah pernah diklaim oleh UID lain
    if (masterData.claimed && masterData.claimedBy && masterData.claimedBy !== uid) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Nomor alumni ini sudah terdaftar oleh pengguna lain. Silakan hubungi bagian administrasi."
      );
    }

    // 4. Verifikasi faktor kedua: Pencocokan nama resmi dengan nama input
    const masterNama = String(masterData.namaLengkap || "").trim().toLowerCase();
    if (masterNama !== trimmedNama) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Nama lengkap yang Anda masukkan tidak cocok dengan arsip data alumni resmi."
      );
    }

    const now = admin.firestore.FieldValue.serverTimestamp();

    // 5. Tandai nomor alumni sebagai diklaim (Atomic Lock)
    transaction.update(registryRef, {
      claimed: true,
      claimedBy: uid,
      claimedAt: now,
      updatedAt: now,
    });

    // 6. Tulis dokumen privat users/{uid}
    const userData = {
      uid,
      email: userEmail,
      namaLengkap: masterData.namaLengkap, // Menggunakan nama resmi master
      nomorAlumni: normalizedNomor,
      prodi: masterData.prodi,
      angkatan: masterData.angkatan,
      role: "alumni",
      openToWork: false,
      portfolio: [],
      emailJobAlerts: true,
      createdAt: now,
      updatedAt: now,
    };
    transaction.set(userRef, userData, { merge: true });

    // 7. Tulis dokumen profil publik public_profiles/{uid} (hanya field whitelist)
    const publicProfileData = {
      uid,
      namaLengkap: masterData.namaLengkap,
      prodi: masterData.prodi,
      angkatan: masterData.angkatan,
      openToWork: false,
      portfolio: [],
      updatedAt: now,
    };
    transaction.set(publicProfileRef, publicProfileData, { merge: true });

    return {
      success: true,
      message: "Verifikasi alumni berhasil. Profil resmi telah diaktifkan.",
      alumni: {
        namaLengkap: masterData.namaLengkap,
        prodi: masterData.prodi,
        angkatan: masterData.angkatan,
        nomorAlumni: normalizedNomor,
      },
    };
  });
});

/**
 * Background Trigger: syncPublicProfile
 * Memastikan setiap pembaruan pada `users/{uid}` hanya mengekspos field aman (whitelist)
 * ke `public_profiles/{uid}` tanpa pernah mengekspos email, no telpon, atau CV pribadi.
 */
export const syncPublicProfile = functions.firestore
  .document("users/{uid}")
  .onWrite(async (change, context) => {
    const uid = context.params.uid;
    const publicProfileRef = db.collection("public_profiles").doc(uid);

    // Jika user dihapus, hapus juga profil publik
    if (!change.after.exists) {
      await publicProfileRef.delete();
      return;
    }

    const userData = change.after.data() || {};

    // Filter sanitasi portfolio (maksimal 12 dan validasi HTTP/HTTPS)
    const rawPortfolio = Array.isArray(userData.portfolio) ? userData.portfolio : [];
    const sanitizedPortfolio = rawPortfolio.slice(0, 12).map((item: Record<string, unknown>) => ({
      judul: typeof item?.judul === "string" ? item.judul.slice(0, 150) : "",
      deskripsi: typeof item?.deskripsi === "string" ? item.deskripsi.slice(0, 500) : "",
      url: isSafeUrl(item?.url) ? item.url : "",
      platform: typeof item?.platform === "string" ? item.platform : "other",
    }));

    // Data whitelist yang aman dibaca publik
    const publicData = {
      uid,
      namaLengkap: typeof userData.namaLengkap === "string" ? userData.namaLengkap : "",
      prodi: typeof userData.prodi === "string" ? userData.prodi : "",
      angkatan: typeof userData.angkatan === "number" || typeof userData.angkatan === "string" ? userData.angkatan : "",
      bio: typeof userData.bio === "string" ? userData.bio.slice(0, 500) : "",
      keahlian: Array.isArray(userData.keahlian) ? userData.keahlian.slice(0, 20) : [],
      portfolio: sanitizedPortfolio,
      openToWork: Boolean(userData.openToWork),
      avatarUrl: isSafeUrl(userData.avatarUrl) ? userData.avatarUrl : null,
      domisili: typeof userData.domisili === "string" ? userData.domisili.slice(0, 100) : "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await publicProfileRef.set(publicData, { merge: true });
  });

/**
 * Callable Function: setAdminRole
 * Memberikan custom claims { admin: true } oleh super-admin yang sah (F-01).
 */
export const setAdminRole = functions.https.onCall(async (data, context) => {
  // Hanya admin dengan custom claim admin == true yang dapat memberikan hak admin ke akun lain
  if (!context.auth || context.auth.token.admin !== true) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Hanya administrator resmi institusi yang memiliki otoritas ini."
    );
  }

  const targetUid = data?.targetUid;
  const makeAdmin = Boolean(data?.isAdmin);

  if (!targetUid || typeof targetUid !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "targetUid wajib diisi.");
  }

  // Set Firebase Auth Custom Claims
  await admin.auth().setCustomUserClaims(targetUid, { admin: makeAdmin });

  // Update role di dokumen Firestore pengguna
  await db.collection("users").doc(targetUid).update({
    role: makeAdmin ? "admin" : "alumni",
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    targetUid,
    role: makeAdmin ? "admin" : "alumni",
  };
});
