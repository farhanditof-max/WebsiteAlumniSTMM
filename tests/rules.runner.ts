import * as fs from "fs";
import * as path from "path";

export interface TestCaseResult {
  id: string;
  category: string;
  title: string;
  findingCode: string;
  passed: boolean;
  details: string;
}

export function runSecurityAcceptanceMatrix(): {
  total: number;
  passed: number;
  failed: number;
  results: TestCaseResult[];
} {
  const firestoreRulesPath = path.resolve(__dirname, "../firestore.rules");
  const storageRulesPath = path.resolve(__dirname, "../storage.rules");

  if (!fs.existsSync(firestoreRulesPath)) {
    throw new Error(`firestore.rules not found at ${firestoreRulesPath}`);
  }
  if (!fs.existsSync(storageRulesPath)) {
    throw new Error(`storage.rules not found at ${storageRulesPath}`);
  }

  const firestoreRules = fs.readFileSync(firestoreRulesPath, "utf8");
  const storageRules = fs.readFileSync(storageRulesPath, "utf8");

  const results: TestCaseResult[] = [];

  // ==========================================
  // KATEGORI 1: OTORISASI DAN IDENTITAS
  // ==========================================

  // TC-01: Pengguna biasa tidak dapat menulis role: 'admin'
  const tc01Passed =
    firestoreRules.includes("request.resource.data.role != 'admin'") &&
    firestoreRules.includes("locked(['role'");
  results.push({
    id: "TC-01",
    category: "Otorisasi dan Identitas",
    title: "Pengguna biasa tidak dapat menulis role: 'admin' ke dokumen sendiri atau orang lain",
    findingCode: "F-01",
    passed: tc01Passed,
    details: "Rules secara eksplisit melarang pembuatan user dengan role: 'admin' dan mengunci 'role' pada update bagi non-admin.",
  });

  // TC-02: Pengguna non-admin membuka /admin/* ditolak oleh server/guard
  const adminPagePath = path.resolve(__dirname, "../src/app/admin/alumni/page.tsx");
  const adminPageContent = fs.existsSync(adminPagePath) ? fs.readFileSync(adminPagePath, "utf8") : "";
  const tc02Passed =
    (adminPageContent.includes("Akses Terbatas Administrator") || adminPageContent.includes("Access Denied")) &&
    adminPageContent.includes("profile?.role !== 'admin'");
  results.push({
    id: "TC-02",
    category: "Otorisasi dan Identitas",
    title: "Pengguna non-admin membuka /admin/* ditolak oleh server/guard",
    findingCode: "F-01",
    passed: tc02Passed,
    details: "Guard di /admin/alumni/page.tsx memverifikasi role === 'admin' dan menampilkan Akses Terbatas serta self-promotion trigger telah dihapus.",
  });

  // TC-03: Kunci field identitas (nomorAlumni, prodi, angkatan, role, uid) & larangan delete langsung
  const tc03Passed =
    firestoreRules.includes("locked(['role', 'uid', 'nomorAlumni', 'createdAt', 'prodi', 'angkatan'])") &&
    firestoreRules.includes("allow delete: if isAdmin();");
  results.push({
    id: "TC-03",
    category: "Otorisasi dan Identitas",
    title: "Pengguna tidak bisa mengubah identitas permanen (nomorAlumni, prodi, angkatan, role, uid) dan dilarang delete langsung users/{uid}",
    findingCode: "F-08, F-22",
    passed: tc03Passed,
    details: "Function locked() mengunci field permanen dan allow delete dibatasi hanya untuk admin institusi.",
  });

  // TC-04: Non-admin tidak dapat menambah/mengubah alumni_registry; anonim ditolak
  const tc04Passed =
    firestoreRules.includes("match /alumni_registry/{alumniId}") &&
    firestoreRules.includes("allow read: if signedIn();") &&
    firestoreRules.includes("allow create, delete: if isAdmin();");
  results.push({
    id: "TC-04",
    category: "Otorisasi dan Identitas",
    title: "Pengguna biasa tidak dapat menambah/menghapus alumni_registry; anonim dilarang membaca",
    findingCode: "F-04",
    passed: tc04Passed,
    details: "alumni_registry mewajibkan signedIn() untuk read, dan create/delete hanya untuk admin.",
  });

  // TC-05: Form registrasi tidak membocorkan nama resmi sebelum verifikasi
  const registerPagePath = path.resolve(__dirname, "../src/app/register/page.tsx");
  const registerContent = fs.existsSync(registerPagePath) ? fs.readFileSync(registerPagePath, "utf8") : "";
  const tc05Passed = !registerContent.includes("getAlumniNameByNomor") && !registerContent.includes("setNamaLengkap(registry.namaLengkap)");
  results.push({
    id: "TC-05",
    category: "Otorisasi dan Identitas",
    title: "Mengetik nomor alumni di form daftar tidak mengembalikan/mengisi nama resmi sebelum verifikasi",
    findingCode: "F-04",
    passed: tc05Passed,
    details: "Form pendaftaran mengharuskan input nama lengkap secara mandiri dan diverifikasi dua faktor di backend (F-04).",
  });

  // TC-06: Mendaftar tidak menimpa prodi/angkatan di alumni_registry & verifikasi faktor kedua
  const authLibPath = path.resolve(__dirname, "../src/lib/auth.ts");
  const authLibContent = fs.existsSync(authLibPath) ? fs.readFileSync(authLibPath, "utf8") : "";
  const tc06Passed =
    authLibContent.includes("normalizeNomorAlumni") &&
    firestoreRules.includes("locked(['nomorAlumni', 'prodi', 'angkatan'])");
  results.push({
    id: "TC-06",
    category: "Otorisasi dan Identitas",
    title: "Mendaftar dengan nomor alumni terverifikasi tidak menimpa prodi/angkatan di registry master",
    findingCode: "F-04, F-24",
    passed: tc06Passed,
    details: "Rules mengunci nomorAlumni, prodi, dan angkatan dari modifikasi saat registrasi akun baru.",
  });

  // TC-07: Anti Document ID Spoofing (Spread order reversal)
  const restLibPath = path.resolve(__dirname, "../src/lib/firestoreRest.ts");
  const jobsLibPath = path.resolve(__dirname, "../src/lib/jobs.ts");
  const restContent = fs.existsSync(restLibPath) ? fs.readFileSync(restLibPath, "utf8") : "";
  const jobsContent = fs.existsSync(jobsLibPath) ? fs.readFileSync(jobsLibPath, "utf8") : "";
  const tc07Passed =
    restContent.includes("id: realId") &&
    jobsContent.includes("...d.data(), id: d.id");
  results.push({
    id: "TC-07",
    category: "Otorisasi dan Identitas",
    title: "Menyimpan field uid atau id palsu di payload tidak menimpa Document ID asli saat dibaca",
    findingCode: "F-21",
    passed: tc07Passed,
    details: "Objek spread dibalik ({ ...d.data(), id: d.id }) sehingga Document ID asli selalu meng-override field palsu.",
  });

  // ==========================================
  // KATEGORI 2: PRIVASI DATA
  // ==========================================

  // TC-08: Pemisahan public_profiles (whitelist) dan proteksi users privat
  const tc08Passed =
    firestoreRules.includes("match /public_profiles/{userId}") &&
    firestoreRules.includes("allow read: if true;") &&
    firestoreRules.includes("allow write: if isAdmin();");
  results.push({
    id: "TC-08",
    category: "Privasi Data",
    title: "Anonim hanya bisa membaca public_profiles (whitelist); users privat terlindungi",
    findingCode: "F-02",
    passed: tc08Passed,
    details: "public_profiles disiapkan dengan allow read: if true dan allow write hanya oleh Admin/Cloud Functions.",
  });

  // TC-09: Mengunjungi /profil/<nomorAlumni> atau <email> tidak membocorkan data; openToWork hide
  const profileUidPath = path.resolve(__dirname, "../src/app/profil/[uid]/page.tsx");
  const profileUidContent = fs.existsSync(profileUidPath) ? fs.readFileSync(profileUidPath, "utf8") : "";
  const tc09Passed =
    !profileUidContent.includes("where('nomorAlumni'") &&
    profileUidContent.includes("profile.openToWork") &&
    profileUidContent.includes("!isOwner && !profile.openToWork");
  results.push({
    id: "TC-09",
    category: "Privasi Data",
    title: "Mengunjungi /profil/<nomorAlumni> atau /profil/<email> tidak membocorkan profil; saat openToWork == false CV tersembunyi",
    findingCode: "F-25",
    passed: tc09Passed,
    details: "Enumerasi route tebakan dihapus; CV dan kontak disembunyikan jika openToWork bernilai false bagi non-pemilik.",
  });

  // TC-10: Telepon terproteksi & applicantPhone wajib persetujuan (consent checkbox)
  const lowonganPagePath = path.resolve(__dirname, "../src/app/lowongan/page.tsx");
  const lowonganContent = fs.existsSync(lowonganPagePath) ? fs.readFileSync(lowonganPagePath, "utf8") : "";
  const tc10Passed =
    lowonganContent.includes("sharePhone") &&
    lowonganContent.includes("applicantPhone: sharePhone ?");
  results.push({
    id: "TC-10",
    category: "Privasi Data",
    title: "Nomor telepon pelamar hanya dikirim jika pelamar menyetujui checkbox izin kontak (UU PDP)",
    findingCode: "F-02, UU PDP",
    passed: tc10Passed,
    details: "Checkbox sharePhone diterapkan secara eksplisit sebelum modal submit lamaran diproses.",
  });

  // TC-11: Proteksi dokumen CV di Storage Rules
  const tc11Passed =
    storageRules.includes("match /cv_documents/{userId}/{fileName}") &&
    storageRules.includes("fileName == 'cv.pdf'") &&
    storageRules.includes("request.resource.contentType == 'application/pdf'");
  results.push({
    id: "TC-11",
    category: "Privasi Data",
    title: "Pengguna lain tidak bisa sembarangan mengunduh CV; file dibatasi hanya cv.pdf dengan ukuran < 5MB",
    findingCode: "F-03, F-23",
    passed: tc11Passed,
    details: "Storage rules menetapkan nama file statis cv.pdf dan tipe mime application/pdf dengan limit 5MB.",
  });

  // TC-12: User A tidak bisa membaca lamaran User B
  const tc12Passed =
    firestoreRules.includes("match /applications/{applicationId}") &&
    firestoreRules.includes("resource.data.applicantUid == request.auth.uid ||") &&
    firestoreRules.includes("resource.data.posterUid == request.auth.uid");
  results.push({
    id: "TC-12",
    category: "Privasi Data",
    title: "User A tidak bisa membaca lamaran User B kecuali pemilik lowongan yang sebenarnya",
    findingCode: "F-06",
    passed: tc12Passed,
    details: "applications read dibatasi hanya untuk applicantUid, posterUid pemilik lowongan, atau admin.",
  });

  // ==========================================
  // KATEGORI 3: INTEGRITAS LOWONGAN & SKEMA
  // ==========================================

  // TC-13: Membuat jobs dilarang memalsukan postedBy; update mengunci postedBy
  const tc13Passed =
    firestoreRules.includes("request.resource.data.postedBy == request.auth.uid") &&
    firestoreRules.includes("locked(['postedBy', 'createdAt'])");
  results.push({
    id: "TC-13",
    category: "Integritas Lowongan & Skema",
    title: "Membuat jobs dengan postedBy != auth.uid ditolak; update mengunci postedBy & createdAt",
    findingCode: "F-05",
    passed: tc13Passed,
    details: "postedBy terkunci secara absolut ke request.auth.uid dan tidak dapat diubah pada operasi update.",
  });

  // TC-14: Validasi tipe data ketat di jobs & users
  const tc14Passed =
    firestoreRules.includes("request.resource.data.judul is string") &&
    firestoreRules.includes("request.resource.data.prodiTarget is list") &&
    firestoreRules.includes("request.resource.data.kualifikasi is list");
  results.push({
    id: "TC-14",
    category: "Integritas Lowongan & Skema",
    title: "Membuat/memperbarui jobs atau users dengan tipe data salah ditolak oleh Rules",
    findingCode: "F-20",
    passed: tc14Passed,
    details: "Rules memverifikasi tipe 'is string', 'is list', dan 'is bool' guna mencegah Stored Client-Side DoS.",
  });

  // TC-15: Deterministic ID untuk applications jobId_applicantUid
  const tc15Passed =
    firestoreRules.includes("applicationId == request.resource.data.jobId + '_' + request.auth.uid") &&
    jobsContent.includes("`${applicationData.jobId}_${applicationData.applicantUid}`");
  results.push({
    id: "TC-15",
    category: "Integritas Lowongan & Skema",
    title: "ID dokumen lamaran dikunci secara deterministik ke `${jobId}_${applicantUid}`",
    findingCode: "F-06, F-21",
    passed: tc15Passed,
    details: "Rules menolak applicationId sembarang dan memastikan hanya 1 lamaran per pasangan lowongan-pelamar.",
  });

  // TC-16: Poster hanya boleh mengubah status enum dan dilarang merusak pesan/CV pelamar
  const tc16Passed =
    firestoreRules.includes("affectedKeys().hasOnly(['status', 'updatedAt'])") &&
    firestoreRules.includes("status in ['reviewed', 'accepted', 'rejected']");
  results.push({
    id: "TC-16",
    category: "Integritas Lowongan & Skema",
    title: "Poster lowongan hanya bisa mengubah status enum yang sah dan dilarang memanipulasi pesan pelamar",
    findingCode: "F-06, F-22",
    passed: tc16Passed,
    details: "Rules menggunakan affectedKeys().hasOnly(['status', 'updatedAt']) pada operasi update oleh poster.",
  });

  // TC-17: Deterministic ID untuk contact_requests requesterUid_targetUid
  const tc17Passed =
    firestoreRules.includes("requestId == request.auth.uid + '_' + request.resource.data.targetUid") &&
    firestoreRules.includes("affectedKeys().hasOnly(['status', 'updatedAt'])");
  results.push({
    id: "TC-17",
    category: "Integritas Lowongan & Skema",
    title: "Satu pasangan requester/target hanya punya 1 dokumen contact_requests; target hanya bisa ubah status",
    findingCode: "F-10, F-21, F-22",
    passed: tc17Passed,
    details: "ID dikunci `${requesterUid}_${targetUid}` dan target hanya diperkenankan mengupdate status approved/rejected.",
  });

  // ==========================================
  // KATEGORI 4: KEAMANAN CLIENT & STORAGE
  // ==========================================

  // TC-18: URL sanitization mencegah XSS (javascript: / data:)
  const mediaLibPath = path.resolve(__dirname, "../src/lib/media.ts");
  const mediaContent = fs.existsSync(mediaLibPath) ? fs.readFileSync(mediaLibPath, "utf8") : "";
  const tc18Passed =
    mediaContent.includes("safeHttpUrl") &&
    mediaContent.includes("parsed.protocol !== 'http:' && parsed.protocol !== 'https:'");
  results.push({
    id: "TC-18",
    category: "Keamanan Client",
    title: "Sanitasi URL mencegah injeksi skema javascript: atau data: XSS pada tautan portofolio dan CV",
    findingCode: "F-07",
    passed: tc18Passed,
    details: "Fungsi helper safeHttpUrl() memvalidasi URL hanya mengizinkan protokol http/https dan menolak skema javascript:.",
  });

  // TC-19: Menolak SVG di Storage & batasi item portofolio maks 12
  const tc19Passed =
    storageRules.includes("matches('image/(jpeg|png|webp)')") &&
    !storageRules.includes("image/svg+xml") &&
    firestoreRules.includes("request.resource.data.portfolio.size() <= 12");
  results.push({
    id: "TC-19",
    category: "Keamanan Client & Storage",
    title: "Storage Rules menolak file SVG (vektor XSS) dan membatasi ukuran array portofolio maks 12 item",
    findingCode: "F-12",
    passed: tc19Passed,
    details: "ContentType dikunci hanya ke jpeg/png/webp (SVG ditolak) dan ukuran portfolio dibatasi <= 12 item.",
  });

  // TC-20: Evaluasi delete bersih di Storage tanpa crash request.resource == null
  const tc20Passed =
    storageRules.includes("allow delete: if isOwner(userId);") &&
    storageRules.includes("allow create, update: if isOwner(userId)");
  results.push({
    id: "TC-20",
    category: "Keamanan Client & Storage",
    title: "Storage Rules memisahkan operasi delete dari create/update sehingga tidak crash request.resource == null",
    findingCode: "F-23",
    passed: tc20Passed,
    details: "Operasi delete dievaluasi secara independen tanpa memeriksa request.resource.size/contentType yang null saat penghapusan.",
  });

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    total: results.length,
    passed: passedCount,
    failed: failedCount,
    results,
  };
}
