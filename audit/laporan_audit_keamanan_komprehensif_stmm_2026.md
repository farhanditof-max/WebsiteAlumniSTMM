# LAPORAN AUDIT KEAMANAN KODE SUMBER & DEFENSIVE SECURITY REPORT
## Audit Hybrid White-Box SAST + Metodologi Strix Pentest
**Aplikasi:** Portal Dashboard Alumni STMM MMTC Yogyakarta  
**Teknologi:** Next.js 16 (Turbopack) + React 19 + Firebase (Firestore, Auth, Storage, Cloud Functions)  
**Peran:** Principal Application Security Auditor & Defensive Security Agent  
**Tanggal:** 24 Oktober 2026  
**Status:** Audit Selesai & Terverifikasi Silang (*Cross-File Verified*)

---

## DAFTAR ISI
1. [Ringkasan Eksekutif & Temuan Kritis](#1-ringkasan-eksekutif)
2. [Evaluasi Integritas & Anti-Vaporware (Fase 1)](#fase-1-audit-integritas-pengujian--sinkronisasi-arsitektur)
3. [Audit Kontrol Akses, Privasi Data UU PDP, & Privilege Escalation (Fase 2)](#fase-2-audit-kontrol-akses-privasi-data-uu-pdp--privilege-escalation)
4. [Audit Logic Bugs & Functional Deadlocks (Fase 3)](#fase-3-audit-logic-bugs--functional-deadlocks-fitur-lumpuh)
5. [Audit Validasi Skema, Client-Side DoS, & Sanitasi XSS/CSP (Fase 4)](#fase-4-audit-validasi-skema-client-side-dos--sanitasi-xss-csp)
6. [Matriks Konsolidasi & Rekomendasi Roadmap](#6-matriks-konsolidasi-temuan)

---

## 1. RINGKASAN EKSEKUTIF

Audit keamanan kode sumber (*White-Box SAST*) yang dipadukan dengan metodologi pengujian penetrasi defensif Strix membuktikan bahwa repositori `dashboard-alumni-mmtc` memiliki 3 masalah sistemik utama:

1. **Vaporware Testing & Arsitektur Terfragmentasi:**
   Klaim "ALL PASS" pada unit test rules sebelumnya adalah hasil dari pengujian semu di `tests/rules.runner.ts` yang hanya melakukan pencocokan teks statis (`.includes()`), tanpa menjalankan emulator. Cloud Functions dan koleksi `public_profiles` yang dimaksudkan untuk melindungi privasi berstatus *dormant* (tidak pernah dipanggil oleh frontend).
2. **Pelanggaran Privasi Serius (UU PDP) & BOLA/IDOR:**
   Data pribadi sensitif (Nomor HP WhatsApp, email alumni) dikirim utuh ke memori browser seluruh pengguna yang login melalui dokumen `users/{uid}`, dan dokumen resume CV (`cv.pdf`) di Firebase Storage dapat diunduh bebas oleh pengguna login mana pun tanpa filter status `openToWork`.
3. **Kelumpuhan Fungsional Total (Deadlocks):**
   Terdapat konflik fundamental antara logika kode frontend dan aturan `firestore.rules` yang menyebabkan:
   - Alur pendaftaran akun baru **gagal 100%** (pembacaan master data sebelum autentikasi diblokir rules).
   - Alur login menggunakan Nomor Alumni **gagal 100%**.
   - Alur permintaan kontak WhatsApp **gagal 100%** (tabrakan `addDoc` random ID vs deterministic ID rules).

---

## FASE 1: AUDIT INTEGRITAS PENGUJIAN & SINKRONISASI ARSITEKTUR

### [F1-01 | Tingkat Keparahan: HIGH] Vaporware Security Testing pada CI/CD Pipeline
* **Lokasi File & Baris Kode:**
  * `package.json` (Baris 10, 20–30)
  * `.github/workflows/ci.yml` (Baris 55–75)
  * `tests/run-all-tests.ts` (Baris 10–58)
  * `tests/rules.runner.ts` (Baris 19–50)
  * `tests/rules.test.ts` (Baris 1–48)
* **Akar Masalah (Root Cause):**
  Status pengujian keamanan "100% SUCCESS" yang tercatat di `tests/rules_test_results.txt` dan CI bukanlah hasil dari pengujian rules dinamis di Firebase Local Emulator. Skrip `npm run test:rules` mengeksekusi `tests/run-all-tests.ts`, yang hanya memanggil `tests/rules.runner.ts`. File ini sekadar membaca string file mentah menggunakan `fs.readFileSync` lalu mengecek apakah teks tertentu ada (`.includes(...)`).
  File pengujian unit rules yang asli (`tests/rules.test.ts`) yang menggunakan `@firebase/rules-unit-testing` tidak pernah dijalankan karena tidak ada test runner (seperti Jest atau Vitest) yang dikonfigurasi di `package.json`. Akibatnya, perubahan rules yang merusak alur aplikasi tidak pernah terdeteksi oleh CI.
* **Bukti Kode:**
  `tests/rules.runner.ts` (Baris 39–41):
  ```typescript
  const tc01Passed =
    firestoreRules.includes("request.resource.data.role != 'admin'") &&
    firestoreRules.includes("locked(['role'");
  ```
  `.github/workflows/ci.yml` (Baris 73–74):
  ```yaml
  - name: Run Firebase Rules Acceptance Tests
    run: npm run test:rules
  ```
* **Kode Perbaikan (Remediation Patch):**
  Instal Jest dan `ts-jest`, sediakan konfigurasi runner `jest.config.js`, dan jalankan emulator sungguhan pada script test:
  ```diff
  // package.json
    "scripts": {
  -   "test:rules": "ts-node --project tests/tsconfig.json tests/run-all-tests.ts",
  +   "test:rules": "firebase emulators:exec --only firestore,storage \"jest --config tests/jest.config.js --runInBand\"",
  +   "test:rules:static": "ts-node --project tests/tsconfig.json tests/run-all-tests.ts"
    },
    "devDependencies": {
      "@firebase/rules-unit-testing": "^5.0.2",
  +   "jest": "^29.7.0",
  +   "ts-jest": "^29.2.5",
  +   "@types/jest": "^29.5.14",
  ```

---

### [F1-02 | Tingkat Keparahan: HIGH] Desinkronisasi Arsitektur & Schema Mismatch Cloud Functions vs Client SDK
* **Lokasi File & Baris Kode:**
  * `functions/src/index.ts` (`claimAlumni`, `syncPublicProfile`, `setAdminRole`, Baris 31–146, 153–192, 198–228)
  * `src/types/index.ts` (Baris 18–24, 26–43, 95–105)
  * `firestore.rules` (Baris 106–116)
* **Akar Masalah (Root Cause):**
  1. Frontend sama sekali tidak mengimpor `firebase/functions` atau memanggil fungsi `claimAlumni` dan `setAdminRole`. Backend logic di Cloud Functions berstatus *dead code*.
  2. Terjadi ketidaksinkronan skema penamaan field:
     - `alumni_registry`: Cloud Functions menulis `claimed`, `claimedBy`, `claimedAt`, sedangkan `firestore.rules` dan `src/types/index.ts` memeriksa `isRegistered`, `registeredUid`, `registeredAt`.
     - `users`: Cloud Functions menulis `avatarUrl`, sedangkan antarmuka pengguna membaca `fotoProfil`.
     - `portfolio`: Cloud Functions memetakan `{ judul, deskripsi, platform, url }`, sedangkan tipe TypeScript dan frontend menggunakan `{ id, type, title, url, description }`. Jika Cloud Functions dijalankan, data portofolio publik akan kosong (*undefined*).
* **Bukti Kode:**
  `functions/src/index.ts` (Baris 99–104, 169–174):
  ```typescript
  transaction.update(registryRef, {
    claimed: true,
    claimedBy: uid,
    claimedAt: now,
  });
  ...
  judul: typeof item?.judul === "string" ? item.judul.slice(0, 150) : "",
  platform: typeof item?.platform === "string" ? item.platform : "other",
  ```
* **Kode Perbaikan (Remediation Patch):**
  Harmonisasikan skema data pada `functions/src/index.ts`:
  ```diff
  // functions/src/index.ts
       transaction.update(registryRef, {
  -      claimed: true,
  -      claimedBy: uid,
  -      claimedAt: now,
  +      isRegistered: true,
  +      registeredUid: uid,
  +      registeredAt: now,
         updatedAt: now,
       });
  ...
       const sanitizedPortfolio = rawPortfolio.slice(0, 12).map((item: Record<string, unknown>) => ({
  +      id: typeof item?.id === "string" ? item.id : String(Date.now()),
  +      title: typeof item?.title === "string" ? item.title.slice(0, 150) : (typeof item?.judul === "string" ? item.judul.slice(0, 150) : ""),
  +      description: typeof item?.description === "string" ? item.description.slice(0, 500) : (typeof item?.deskripsi === "string" ? item.deskripsi.slice(0, 500) : ""),
         url: isSafeUrl(item?.url) ? item.url : "",
  +      type: typeof item?.type === "string" ? item.type : (typeof item?.platform === "string" ? item.platform : "link"),
       }));
  ...
  -      avatarUrl: isSafeUrl(userData.avatarUrl) ? userData.avatarUrl : null,
  +      fotoProfil: isSafeUrl(userData.fotoProfil) ? userData.fotoProfil : null,
  ```

---

### [F1-03 | Tingkat Keparahan: MEDIUM] Koleksi `public_profiles` Dormant (Bypass Arsitektural Whitelist)
* **Lokasi File & Baris Kode:**
  * `firestore.rules` (Baris 31–34)
  * `src/app/page.tsx` (Baris 43)
  * `src/app/open-to-work/page.tsx` (Baris 51)
  * `src/app/profil/[uid]/page.tsx` (Baris 56)
  * `src/lib/firestoreRest.ts` (Baris 74)
* **Akar Masalah (Root Cause):**
  Security rules mendefinisikan koleksi whitelist `public_profiles` yang boleh dibaca secara publik (`allow read: if true`). Namun, tidak ada satu pun komponen frontend yang memanfaatkan koleksi ini. Semua halaman publik (`page.tsx`, `open-to-work`, `profil/[uid]`) melakukan kueri langsung ke koleksi sensitif `users`. Hal ini menyebabkan arsitektur isolasi data publik tidak berjalan.
* **Bukti Kode:**
  `src/app/open-to-work/page.tsx` (Baris 51):
  ```typescript
  const q = query(collection(db, 'users'), where('openToWork', '==', true));
  ```
* **Kode Perbaikan (Remediation Patch):**
  Sinkronkan profil publik saat alumni menyimpan data, lalu arahkan pembacaan direktori talenta ke `public_profiles`:
  ```diff
  // src/app/open-to-work/page.tsx
  - const q = query(collection(db, 'users'), where('openToWork', '==', true));
  + const q = query(collection(db, 'public_profiles'), where('openToWork', '==', true));
  ```

---

## FASE 2: AUDIT KONTROL AKSES, PRIVASI DATA (UU PDP), & PRIVILEGE ESCALATION

### [F2-01 | Tingkat Keparahan: CRITICAL] Kebocoran Data Pribadi Sensitif (PII) pada `/users/{userId}` via Document-Level Read
* **Lokasi File & Baris Kode:**
  * `firestore.rules` (Baris 15)
  * `src/app/profil/[uid]/page.tsx` (Baris 56–68, 418–445)
* **Akar Masalah (Root Cause):**
  Pada `firestore.rules`:
  `allow read: if isOwner(userId) || isAdmin() || (signedIn() && resource.data.openToWork == true);`
  Karena Firestore mengevaluasi izin pada tingkat dokumen penuh, pemanggilan `getDoc(doc(db, 'users', cleanUid))` mengirimkan seluruh field dokumen ke browser: `phone`, `email`, `nomorAlumni`, `cvFileUrl`, dan `cvExternalLink`.
  Meskipun UI menyamarkan nomor WhatsApp dengan teks `••••••••••••` saat status kontak belum `approved`, nomor telepon asli target **sudah tersimpan di memori browser pengguna (`profile.phone`)** dan dapat dilihat di inspect tab Network. Ini merupakan pelanggaran prinsip kerahasiaan data pribadi (UU PDP No. 27/2022).
* **Bukti Kode:**
  `src/app/profil/[uid]/page.tsx` (Baris 68, 420):
  ```typescript
  setProfile({ ...snap.data(), uid: snap.id } as UserProfile);
  ...
  <a href={`mailto:${profile.email}`}>{profile.email}</a>
  ```
* **Kode Perbaikan (Remediation Patch):**
  Koleksi privat `users/{userId}` hanya boleh dibaca oleh pemilik akun dan admin. Data publik harus diambil dari `public_profiles`. Nomor kontak privat hanya boleh diberikan melalui dokumen `contact_requests` yang telah disetujui:
  ```diff
  // firestore.rules
       match /users/{userId} {
  -      allow read: if isOwner(userId) || isAdmin() || (signedIn() && resource.data.openToWork == true);
  +      allow read: if isOwner(userId) || isAdmin();
         allow create: if isOwner(userId)
  ```

---

### [F2-02 | Tingkat Keparahan: CRITICAL] Celah Pemalsuan Identitas Akademik pada `allow create` `users/{userId}`
* **Lokasi File & Baris Kode:**
  * `firestore.rules` (Baris 16–19)
  * `src/lib/auth.ts` (Baris 245–260)
* **Akar Masalah (Root Cause):**
  Aturan `allow create` pada `/users/{userId}` di `firestore.rules` hanya memvalidasi `isOwner(userId)`, `uid == userId`, `role != 'admin'`, dan `namaLengkap is string`.
  **Rules sama sekali tidak memvalidasi `nomorAlumni`, `prodi`, dan `angkatan` terhadap koleksi `alumni_registry`**.
  Penyerang dengan akun Firebase Auth baru dapat langsung memanggil SDK `setDoc` dengan menyuntikkan Nomor Alumni, Prodi, dan Angkatan palsu. Karena saat `update` aturan `locked(['nomorAlumni', 'prodi', 'angkatan'])` aktif, data identitas palsu tersebut terkunci secara permanen di basis data alumni resmi.
* **Bukti Kode:**
  `firestore.rules` (Baris 16–19):
  ```rules
  allow create: if isOwner(userId)
                && request.resource.data.uid == userId
                && (!request.resource.data.keys().hasAny(['role']) || request.resource.data.role != 'admin')
                && request.resource.data.namaLengkap is string;
  ```
* **Kode Perbaikan (Remediation Patch):**
  Wajibkan verifikasi eksistensi dan validasi kecocokan data registry di security rules:
  ```diff
  // firestore.rules
       match /users/{userId} {
         allow create: if isOwner(userId)
                       && request.resource.data.uid == userId
                       && (!request.resource.data.keys().hasAny(['role']) || request.resource.data.role != 'admin')
                       && request.resource.data.namaLengkap is string
  +                    && request.resource.data.nomorAlumni is string
  +                    && exists(/databases/$(database)/documents/alumni_registry/$(request.resource.data.nomorAlumni))
  +                    && get(/databases/$(database)/documents/alumni_registry/$(request.resource.data.nomorAlumni)).data.isRegistered == true
  +                    && get(/databases/$(database)/documents/alumni_registry/$(request.resource.data.nomorAlumni)).data.registeredUid == userId
  +                    && request.resource.data.prodi == get(/databases/$(database)/documents/alumni_registry/$(request.resource.data.nomorAlumni)).data.prodi
  +                    && request.resource.data.angkatan == get(/databases/$(database)/documents/alumni_registry/$(request.resource.data.nomorAlumni)).data.angkatan;
  ```

---

### [F2-03 | Tingkat Keparahan: HIGH] Insecurity Master Data `alumni_registry` (Enumerasi & Mass Hijacking)
* **Lokasi File & Baris Kode:**
  * `firestore.rules` (Baris 106–116)
  * `src/lib/auth.ts` (Baris 49–65)
* **Akar Masalah (Root Cause):**
  1. `allow read: if signedIn();` memungkinkan akun apa pun yang terdaftar mengunduh seluruh data master alumni (`getDocs(collection(db, 'alumni_registry'))`), membocorkan seluruh `namaLengkap` resmi yang seharusnya menjadi faktor rahasia verifikasi kedua.
  2. Blok `allow update` tidak mengunci field `namaLengkap` dan `createdAt` dalam fungsi `locked(...)`, memungkinkan pengklaim memodifikasi nama resmi alumni di master data.
  3. Tidak ada batasan kardinalitas 1 UID = 1 Nomor Alumni. Pengguna login dapat melakukan batch update untuk mengklaim banyak nomor alumni sekaligus yang belum terdaftar (`isRegistered == false`).
* **Bukti Kode:**
  `firestore.rules` (Baris 106–116):
  ```rules
  match /alumni_registry/{alumniId} {
    allow read: if signedIn();
    allow create, delete: if isAdmin();
    allow update: if isAdmin() || (
      signedIn()
      && resource.data.isRegistered == false
      && request.resource.data.isRegistered == true
      && request.resource.data.registeredUid == request.auth.uid
      && locked(['nomorAlumni', 'prodi', 'angkatan'])
    );
  }
  ```
* **Kode Perbaikan (Remediation Patch):**
  Kunci field `namaLengkap`, `createdAt`, dan batasi agar satu akun tidak dapat mengklaim lebih dari satu nomor alumni:
  ```diff
  // firestore.rules
       match /alumni_registry/{alumniId} {
         allow read: if signedIn();
         allow create, delete: if isAdmin();
         allow update: if isAdmin() || (
           signedIn()
           && resource.data.isRegistered == false
           && request.resource.data.isRegistered == true
           && request.resource.data.registeredUid == request.auth.uid
  -        && locked(['nomorAlumni', 'prodi', 'angkatan'])
  +        && locked(['nomorAlumni', 'namaLengkap', 'prodi', 'angkatan', 'createdAt'])
  +        && !exists(/databases/$(database)/documents/users/$(request.auth.uid))
         );
       }
  ```

---

### [F2-04 | Tingkat Keparahan: HIGH] Broken Object Level Authorization (BOLA/IDOR) Dokumen CV di Storage
* **Lokasi File & Baris Kode:**
  * `storage.rules` (Baris 22–29)
  * `src/app/profil/page.tsx` (Baris 432)
* **Akar Masalah (Root Cause):**
  Pada `storage.rules`:
  `match /cv_documents/{userId}/{fileName} { allow read: if signedIn(); ... }`
  Aturan ini mengizinkan pengguna mana pun yang login mengunduh berkas CV target. Ditambah dengan penamaan file yang statis (`cv.pdf`), siapa pun yang memiliki UID target dapat langsung mengunduh `cv_documents/{targetUid}/cv.pdf` meskipun alumni tersebut mengatur profilnya menjadi tertutup (`openToWork == false`).
* **Bukti Kode:**
  `storage.rules` (Baris 22–26):
  ```rules
  match /cv_documents/{userId}/{fileName} {
    allow read: if signedIn();
    allow delete: if isOwner(userId);
    allow create, update: if isOwner(userId)
                  && fileName == 'cv.pdf'
  ```
* **Kode Perbaikan (Remediation Patch):**
  Batasi izin baca dokumen CV hanya untuk pemilik akun dan admin:
  ```diff
  // storage.rules
       match /cv_documents/{userId}/{fileName} {
  -      allow read: if signedIn();
  +      allow read: if isOwner(userId) || (signedIn() && request.auth.token.admin == true);
         allow delete: if isOwner(userId);
         allow create, update: if isOwner(userId)
                       && fileName == 'cv.pdf'
  ```

---

### [F2-05 | Tingkat Keparahan: MEDIUM] Inkonsistensi Otorisasi Admin & Risiko Kerusakan Data Master
* **Lokasi File & Baris Kode:**
  * `firestore.rules` (Baris 6)
  * `src/context/AuthContext.tsx` (Baris 73–86)
  * `src/components/layout/Navbar.tsx` (Baris 67, 178)
  * `src/app/admin/alumni/page.tsx` (Baris 161)
  * `src/lib/auth.ts` (Baris 443–460)
* **Akar Masalah (Root Cause):**
  1. `firestore.rules` mengecek status admin melalui ID Token Custom Claims (`request.auth.token.admin == true`), sedangkan UI memeriksa field `profile?.role === 'admin'` dari dokumen Firestore. Jika user memiliki field Firestore `role: 'admin'` tetapi belum memiliki custom claims, UI membuka halaman `/admin/*`, namun seluruh panggilan Firestore diblokir (`permission-denied`).
  2. Fungsi `seedAlumniRegistry()` di `src/lib/auth.ts` diekspor secara publik dan berisiko menimpa data alumni nyata dengan dummy dataset jika terpicu.
* **Bukti Kode:**
  `src/app/admin/alumni/page.tsx` (Baris 161):
  ```typescript
  if (!loading && (!user || profile?.role !== 'admin')) {
  ```
* **Kode Perbaikan (Remediation Patch):**
  Verifikasi custom claims langsung dari token pada `AuthContext` dan hapus fungsi `seedAlumniRegistry`:
  ```diff
  // src/context/AuthContext.tsx
  + const tokenResult = await currentUser.getIdTokenResult();
  + const isAdminClaim = tokenResult.claims.admin === true || tokenResult.claims.role === 'admin';
  ```

---

## FASE 3: AUDIT LOGIC BUGS & FUNCTIONAL DEADLOCKS (FITUR LUMPUH)

### [F3-01 | Tingkat Keparahan: FUNCTIONAL DEADLOCK / CRITICAL] Alur Registrasi Akun Baru Lumpuh Total
* **Lokasi File & Baris Kode:**
  * `src/lib/auth.ts` (`registerAlumni`, Baris 160–208)
  * `firestore.rules` (Baris 15, 107)
* **Akar Masalah (Root Cause):**
  Pada `registerAlumni()`, baris 160 memanggil `verifyNomorAlumni()` yang menjalankan `getDoc(doc(db, 'alumni_registry', cleanNomor))`. Panggilan ini terjadi **SEBELUM** akun dibuat di Firebase Auth (`createUserWithEmailAndPassword()` di baris 218).
  Pada tahap ini pengguna masih anonim (`request.auth == null`).
  Karena `alumni_registry` di `firestore.rules` mewajibkan `signedIn()`, kueri langsung ditolak dengan `permission-denied`. Error ditangkap dan mengembalikan `null`, sehingga alur registrasi selalu gagal dengan pesan:
  `Nomor Alumni ... tidak terdaftar dalam database resmi alumni STMM MMTC.`
  Tidak ada satupun alumni baru yang dapat mendaftar.
* **Bukti Kode:**
  `src/lib/auth.ts` (Baris 160–165, 218–222):
  ```typescript
  const verified = await verifyNomorAlumni(cleanNomor, params.namaLengkap);
  if (!verified) {
    throw new Error(`Nomor Alumni "${cleanNomor}" tidak terdaftar dalam database resmi alumni STMM MMTC.`);
  }
  ...
  userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, params.password);
  ```
* **Kode Perbaikan (Remediation Patch):**
  Buat akun Firebase Auth terlebih dahulu agar pengguna terotentikasi, lalu lakukan verifikasi nomor alumni dan klaim dalam satu WriteBatch:
  ```diff
  // src/lib/auth.ts
   export async function registerAlumni(params: { ... }): Promise<UserProfile> {
     const cleanNomor = normalizeNomorAlumni(params.nomorAlumni);
     const cleanEmail = params.email.trim().toLowerCase();

  +  // 1. Inisialisasi Auth agar memiliki token terotentikasi (request.auth != null)
  +  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, params.password);
  +  const uid = userCredential.user.uid;

     // 2. Sekarang request.auth != null, pembacaan alumni_registry berhasil
     const verified = await verifyNomorAlumni(cleanNomor, params.namaLengkap);
     if (!verified || ('nameMismatch' in verified && verified.nameMismatch)) {
  +    await userCredential.user.delete();
       throw new Error('Nomor Alumni atau Nama Lengkap tidak sesuai arsip resmi.');
     }

  +  // 3. Eksekusi klaim dan simpan profil secara atomik
  +  const batch = writeBatch(db);
  +  batch.update(doc(db, 'alumni_registry', cleanNomor), {
  +    isRegistered: true,
  +    registeredUid: uid,
  +    registeredAt: new Date().toISOString()
  +  });
  +  batch.set(doc(db, 'users', uid), profileData);
  +  await batch.commit();
  ```

---

### [F3-02 | Tingkat Keparahan: FUNCTIONAL DEADLOCK / HIGH] Login Menggunakan Nomor Alumni Lumpuh Total
* **Lokasi File & Baris Kode:**
  * `src/lib/auth.ts` (`loginAlumni`, Baris 303–356)
  * `src/lib/firestoreRest.ts` (Baris 148–174)
  * `firestore.rules` (Baris 15)
* **Akar Masalah (Root Cause):**
  Saat pengguna mencoba login dengan Nomor Alumni, sistem memanggil REST API tanpa otentikasi (gagal 403) lalu fallback ke Firestore SDK:
  `query(collection(db, 'users'), where('nomorAlumni', '==', normalizedNomor))`
  Karena pengguna belum login (`request.auth == null`), aturan `firestore.rules` pada koleksi `users` menolak kueri dengan `permission-denied`. Akibatnya, login dengan nomor alumni selalu gagal.
* **Bukti Kode:**
  `src/lib/auth.ts` (Baris 331–335):
  ```typescript
  const q = query(collection(db, 'users'), where('nomorAlumni', '==', normalizedNomor));
  const snapPromise = getDocs(q);
  ```
* **Kode Perbaikan (Remediation Patch):**
  Gunakan pemetaan email institusi standar berbasis nomor alumni atau lookup via server-side endpoint yang aman:
  ```diff
  // src/lib/auth.ts
  - const userDoc = await fetchUserByNomorAlumniRest(normalizedNomor);
  - if (userDoc?.email) { targetEmail = userDoc.email; }
  + if (!cleanIdentifier.includes('@')) {
  +   targetEmail = `${normalizedNomor.toLowerCase()}@alumni.mmtc.ac.id`;
  + }
  ```

---

### [F3-03 | Tingkat Keparahan: FUNCTIONAL DEADLOCK / HIGH] Pengajuan Permintaan Kontak WhatsApp Gagal 100%
* **Lokasi File & Baris Kode:**
  * `src/app/profil/[uid]/page.tsx` (`handleSendContactRequest`, Baris 123–134)
  * `firestore.rules` (Baris 89–94)
* **Akar Masalah (Root Cause):**
  Pada `firestore.rules`:
  `allow create: if signedIn() && requestId == request.auth.uid + '_' + request.resource.data.targetUid ...`
  Rules mewajibkan Document ID deterministic berformat `${requesterUid}_${targetUid}`.
  Namun `handleSendContactRequest` di frontend memanggil:
  `await addDoc(collection(db, 'contact_requests'), { ... })`
  Fungsi `addDoc()` selalu men-generate auto-ID acak (20 karakter). Karena Document ID acak tidak pernah cocok dengan pola ID yang diwajibkan rules, Firestore selalu menolak pembuatan dokumen dengan `permission-denied`.
* **Bukti Kode:**
  `src/app/profil/[uid]/page.tsx` (Baris 123):
  ```typescript
  await addDoc(collection(db, 'contact_requests'), {
    requesterUid: user.uid,
    targetUid: profile.uid,
  ```
* **Kode Perbaikan (Remediation Patch):**
  Ganti `addDoc` dengan `setDoc` menggunakan deterministic ID:
  ```diff
  // src/app/profil/[uid]/page.tsx
  - await addDoc(collection(db, 'contact_requests'), {
  + const deterministicRequestId = `${user.uid}_${profile.uid}`;
  + await setDoc(doc(db, 'contact_requests', deterministicRequestId), {
      requesterUid: user.uid,
      requesterName: authProfile?.namaLengkap || user.displayName || user.email?.split('@')[0] || 'Alumni STMM',
  ```

---

### [F3-04 | Tingkat Keparahan: FUNCTIONAL DEADLOCK / HIGH] Permintaan REST API Mengembalikan HTTP 403 Forbidden
* **Lokasi File & Baris Kode:**
  * `src/lib/firestoreRest.ts` (`runFirestoreQuery`, Baris 50–55)
  * `firestore.rules` (Baris 15)
* **Akar Masalah (Root Cause):**
  Fungsi `fetch()` di `src/lib/firestoreRest.ts` tidak menyertakan header `Authorization: Bearer <token>`. Firestore REST API memperlakukan request tersebut sebagai anonim. Karena rules pada koleksi privat mewajibkan `signedIn()`, panggilan REST selalu ditolak dengan status HTTP 403 Forbidden.
* **Bukti Kode:**
  `src/lib/firestoreRest.ts` (Baris 50–55):
  ```typescript
  const res = await fetch(runQueryUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(queryPayload),
    cache: 'no-store'
  });
  ```
* **Kode Perbaikan (Remediation Patch):**
  Sertakan token ID pengguna yang sedang login ke header permintaan REST:
  ```diff
  // src/lib/firestoreRest.ts
  + import { auth } from '@/lib/firebase';

    async function runFirestoreQuery(queryPayload: unknown) {
  +   const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
  +   const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  +   if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(runQueryUrl, {
        method: 'POST',
  -     headers: { 'Content-Type': 'application/json' },
  +     headers,
        body: JSON.stringify(queryPayload),
      });
  ```

---

### [F3-05 | Tingkat Keparahan: FUNCTIONAL DEADLOCK / MEDIUM] Form Edit Profil Menampilkan Input Aktif pada Field Terkunci
* **Lokasi File & Baris Kode:**
  * `src/app/profil/page.tsx` (`handleSaveProfile`, Baris 218–219, 520–540)
  * `firestore.rules` (Baris 21)
* **Akar Masalah (Root Cause):**
  Aturan `firestore.rules` baris 21 mengunci field akademik: `locked(['role', 'uid', 'nomorAlumni', 'createdAt', 'prodi', 'angkatan'])`.
  Namun halaman `/profil` tetap menampilkan dropdown aktif untuk `prodi` dan input teks untuk `angkatan`. Jika alumni mencoba mengubah nilai jurusan atau tahun angkatan, Firestore langsung menolak transaksi dengan `permission-denied`, membingungkan pengguna dengan error generik "Gagal menyimpan profil."
* **Bukti Kode:**
  `src/app/profil/page.tsx` (Baris 520–537):
  ```tsx
  <select value={prodi} onChange={(e) => setProdi(e.target.value as ProdiType)}>
  ...
  <input type="text" value={angkatan} onChange={(e) => setAngkatan(e.target.value)} />
  ```
* **Kode Perbaikan (Remediation Patch):**
  Nonaktifkan elemen input `prodi` dan `angkatan` pada formulir profil:
  ```diff
  // src/app/profil/page.tsx
  - <select value={prodi} onChange={(e) => setProdi(e.target.value as ProdiType)} ...>
  + <input
  +   type="text"
  +   value={profile?.prodi || ''}
  +   disabled
  +   className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500 cursor-not-allowed"
  + />
  ```

---

## FASE 4: AUDIT VALIDASI SKEMA, CLIENT-SIDE DOS, & SANITASI XSS/CSP

### [F4-01 | Tingkat Keparahan: HIGH] Stored Client-Side Denial of Service (DoS) pada Lowongan & Portofolio
* **Lokasi File & Baris Kode:**
  * `firestore.rules` (Baris 24, 48–54)
  * `src/app/lowongan/page.tsx` (Baris 346–350)
  * `src/app/profil/[uid]/page.tsx` (Baris 194)
* **Akar Masalah (Root Cause):**
  1. Pada `firestore.rules` saat `update` lowongan kerja, `kualifikasi` dan `prodiTarget` hanya dicek `is list`, tanpa memvalidasi bahwa isinya bertipe string. Jika disuntikkan objek atau tipe data tak terduga, React 19 di `src/app/lowongan/page.tsx` akan crash dengan fatal error: `Objects are not valid as a React child`, melumpuhkan halaman bursa kerja bagi seluruh pengguna.
  2. Pada koleksi `users`, elemen di dalam list `portfolio` tidak divalidasi tipenya. Jika `item.url` berisi non-string (atau null), `src/app/profil/[uid]/page.tsx` yang mengeksekusi `item.url.startsWith('http')` akan melempar `TypeError: item.url.startsWith is not a function`, menyebabkan White Screen of Death pada profil alumni tersebut.
* **Bukti Kode:**
  `src/app/lowongan/page.tsx` (Baris 348):
  ```tsx
  • {k}
  ```
  `src/app/profil/[uid]/page.tsx` (Baris 194):
  ```tsx
  href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
  ```
* **Kode Perbaikan (Remediation Patch):**
  Validasi tipe data di rules dan terapkan type guards pada komponen React:
  ```diff
  // firestore.rules
       match /jobs/{jobId} {
         allow update: if (signedIn()
                       && resource.data.postedBy == request.auth.uid
                       && locked(['postedBy', 'createdAt'])
                       && request.resource.data.judul is string
  +                    && request.resource.data.perusahaan is string
  +                    && request.resource.data.lokasi is string
  +                    && request.resource.data.deskripsi is string
                       && request.resource.data.prodiTarget is list
                       && request.resource.data.kualifikasi is list
                       ) || isAdmin();
       }
  ```
  ```diff
  // src/app/profil/[uid]/page.tsx
  - href={item.url.startsWith('http') ? item.url : `https://${item.url}`}
  + href={typeof item?.url === 'string' && item.url.trim().startsWith('http') ? item.url.trim() : (typeof item?.url === 'string' && item.url.trim() ? `https://${item.url.trim()}` : '#')}
  ```

---

### [F4-02 | Tingkat Keparahan: HIGH] Bypass Anti-Spam via Delete-Recreate pada Lamaran & Permintaan Kontak
* **Lokasi File & Baris Kode:**
  * `firestore.rules` (Baris 78, 102)
* **Akar Masalah (Root Cause):**
  Aturan `delete` pada `applications` dan `contact_requests` mengizinkan pemohon menghapus dokumennya tanpa memeriksa status dokumen. Jika lamaran atau permintaan kontak ditolak (`status == 'rejected'`), pemohon yang ditolak dapat menghapus dokumen lama lalu membuat permohonan baru berstatus `pending`. Ini membuka celah spam berulang terhadap pembuat lowongan atau alumni target.
* **Bukti Kode:**
  `firestore.rules` (Baris 78, 102):
  ```rules
  allow delete: if (signedIn() && resource.data.applicantUid == request.auth.uid) || isAdmin();
  ...
  allow delete: if (signedIn() && resource.data.requesterUid == request.auth.uid) || isAdmin();
  ```
* **Kode Perbaikan (Remediation Patch):**
  Batasi operasi penghapusan mandiri hanya ketika status dokumen masih `pending` (pembatalan pengajuan):
  ```diff
  // firestore.rules
       match /applications/{applicationId} {
  -      allow delete: if (signedIn() && resource.data.applicantUid == request.auth.uid) || isAdmin();
  +      allow delete: if (signedIn() && resource.data.applicantUid == request.auth.uid && resource.data.status == 'pending') || isAdmin();
       }

       match /contact_requests/{requestId} {
  -      allow delete: if (signedIn() && resource.data.requesterUid == request.auth.uid) || isAdmin();
  +      allow delete: if (signedIn() && resource.data.requesterUid == request.auth.uid && resource.data.status == 'pending') || isAdmin();
       }
  ```

---

### [F4-03 | Tingkat Keparahan: MEDIUM] Tautan Eksternal Tanpa Sanitasi `safeHttpUrl()` & CSP Permisif
* **Lokasi File & Baris Kode:**
  * `src/app/profil/page.tsx` (Baris 432)
  * `src/app/profil/[uid]/page.tsx` (Baris 507)
  * `src/app/lamaran/page.tsx` (Baris 374)
  * `next.config.ts` (Baris 20–34)
* **Akar Masalah (Root Cause):**
  1. Pada `src/app/profil/page.tsx` baris 432, `href={profile.cvFileUrl}` tidak dibungkus dengan `safeHttpUrl()`. Hal serupa terjadi pada `linkedinUrl` di profil publik dan `cvExternalLink` di halaman pelacak lamaran. Nilai `javascript:...` dapat dieksekusi saat tautan diklik.
  2. Direktif CSP di `next.config.ts` mengaktifkan `'unsafe-inline'` dan `'unsafe-eval'`, yang menonaktifkan proteksi Content-Security-Policy terhadap serangan injeksi script XSS.
* **Bukti Kode:**
  `src/app/profil/page.tsx` (Baris 432):
  ```tsx
  <a href={profile.cvFileUrl} target="_blank" rel="noreferrer" ...>
  ```
  `next.config.ts` (Baris 23):
  ```typescript
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  ```
* **Kode Perbaikan (Remediation Patch):**
  Bungkus semua tautan eksternal dengan `safeHttpUrl()` dan bersihkan CSP:
  ```diff
  // src/app/profil/page.tsx
  - <a href={profile.cvFileUrl} target="_blank" rel="noreferrer" className="...">
  + {safeHttpUrl(profile.cvFileUrl) && (
  +   <a href={safeHttpUrl(profile.cvFileUrl)!} target="_blank" rel="noopener noreferrer" className="...">
  + )}
  ```
  ```diff
  // next.config.ts
  - "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  + "script-src 'self'",
  ```

---

## 6. MATRIKS KONSOLIDASI TEMUAN

| ID | Kategori | Tingkat Keparahan | Status Logika / Fungsional | Rekomendasi Utama |
|---|---|---|---|---|
| **F2-01** | Kontrol Akses & UU PDP | **CRITICAL** | Kebocoran PII Sensitif | Isolasi pembacaan `/users/{uid}`, alihkan profil publik ke whitelist `public_profiles`. |
| **F2-02** | Otorisasi & Identitas | **CRITICAL** | Identity Spoofing Permanen | Validasi silang `exists()` & data matching ke `alumni_registry` pada `allow create`. |
| **F3-01** | Logic Bug / Deadlock | **CRITICAL** | Registrasi Akun Lumpuh Total | Autentikasi `createUserWithEmailAndPassword` di awal sebelum validasi `alumni_registry`. |
| **F1-01** | Integritas Pengujian | **HIGH** | Vaporware CI Testing | Ganti string matcher dengan Jest runner sungguhan di Firebase Local Emulator. |
| **F1-02** | Arsitektur & Skema | **HIGH** | Cloud Functions Tak Terpakai | Harmonisasikan penamaan field skema antara Functions, Firestore Rules, dan Types. |
| **F2-03** | Kontrol Akses & Enumerasi | **HIGH** | Mass Registry Hijacking | Kunci `namaLengkap`, batasi kardinalitas 1 UID = 1 Nomor Alumni. |
| **F2-04** | Kontrol Akses (BOLA/IDOR) | **HIGH** | Kebocoran File PDF CV | Batasi `read` pada `/cv_documents` hanya untuk `isOwner` dan admin di Storage Rules. |
| **F3-02** | Logic Bug / Deadlock | **HIGH** | Login Nomor Alumni Lumpuh | Gunakan email format virtual terstandarisasi untuk login nomor alumni. |
| **F3-03** | Logic Bug / Deadlock | **HIGH** | Permintaan Kontak Lumpuh | Ganti `addDoc()` dengan `setDoc()` ber-ID deterministic `${user.uid}_${profile.uid}`. |
| **F3-04** | Logic Bug / Deadlock | **HIGH** | REST API HTTP 403 Forbidden | Tambahkan header `Authorization: Bearer <idToken>` pada seluruh panggilan fetch REST. |
| **F4-01** | Skema & Ketersediaan | **HIGH** | Stored Client-Side DoS | Validasi tipe string pada job update dan sanitasi type guard pada React JSX. |
| **F4-02** | Anti-Spam & Otorisasi | **HIGH** | Bypass Rejection Spam | Batasi `allow delete` pada lamaran dan kontak hanya saat status masih `pending`. |
| **F1-03** | Arsitektur & Privasi | **MEDIUM** | Whitelist Mirror Terabaikan | Lakukan data-migration ke `public_profiles` dan arahkan frontend membaca dari sana. |
| **F2-05** | Otorisasi & Integritas | **MEDIUM** | Inkonsistensi Custom Claims | Validasi token claims di `AuthContext` dan eliminasi fungsi `seedAlumniRegistry`. |
| **F3-05** | Logic Bug / Deadlock | **MEDIUM** | Form Profil Terkunci Gagal | Ubah elemen input `prodi` dan `angkatan` di form profil menjadi disabled/read-only. |
| **F4-03** | Sanitasi Input & CSP | **MEDIUM** | Potensi XSS & CSP Lemah | Bungkus seluruh tautan eksternal dengan `safeHttpUrl()` dan bersihkan `'unsafe-inline'`. |

---
*Laporan ini disusun secara defensif berdasarkan audit menyeluruh basis kode aktual repositori `dashboard-alumni-mmtc`.*
