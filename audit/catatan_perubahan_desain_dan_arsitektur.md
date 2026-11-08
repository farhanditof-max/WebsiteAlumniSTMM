# 🏛️ Catatan Perubahan Desain & Arsitektur Sistem
## Portal Dashboard Alumni STMM MMTC Yogyakarta (Edisi Pasca-Audit Keamanan 2026)

Dokumen ini mendeskripsikan secara komprehensif transformasi arsitektur perangkat lunak dari model awal (*client-side trust*) menuju model **Zero-Trust Backend Governance** sesuai dengan seluruh rekomendasi **Audit Konsolidasi & Deep-Dive Keamanan** (`audit_konsolidasi_deep_dive_dashboard_alumni_stmm_mmtc.md`).

---

## 1. Transformasi Paradigma Arsitektur

Sebelum audit, sistem sangat bergantung pada validasi di sisi client (browser), di mana hak akses dan integritas data hanya dijaga oleh UI. Hal ini menimbulkan celah kritis seperti manipulasi role admin (`role: 'admin'`), kebocoran data pribadi (PII), race condition pada lamaran kerja, dan injeksi XSS.

Arsitektur baru menerapkan 3 lapis pertahanan (*defense-in-depth*):
```
[ Client / Browser (Next.js 16.4.3 / React 19) ]
       │
       ▼  (Lapis 1: UI Guards, Type Guarding, URL Sanitization & Consent Checkboxes)
[ Next.js Edge & Security Headers (CSP, HSTS Preload, X-Frame-Options) ]
       │
       ▼  (Lapis 2: Firebase Security Rules - Type Checking, Field Locking, Deterministic IDs)
[ Firestore & Cloud Storage Engine ]
       ▲
       │  (Lapis 3: Privileged Cloud Functions - Transactions, Admin SDK & PII Sanitizer)
[ Google Cloud Functions (claimAlumni, syncPublicProfile, setAdminRole) ]
```

---

## 2. Pemisahan Data Privat (`users`) dan Profil Publik (`public_profiles`)

### Masalah Awal (F-02, UU PDP)
Sebelumnya seluruh data pengguna disimpan dalam satu koleksi `users/{uid}` yang dapat dibaca oleh publik atau pengguna terotentikasi. Hal ini menyebabkan nomor WhatsApp, email, dan CV pribadi dapat di-scrape secara massal oleh bot atau pihak luar.

### Desain Baru
1. **Koleksi Privat `users/{uid}`:**
   - Menyimpan seluruh data sensitif: `email`, `nomorHp`, `nomorAlumni`, `cvUrl`, `cvFileUrl`, `role`, dan pengaturan notifikasi.
   - **Hak Akses:** Hanya pemilik dokumen (`request.auth.uid == uid`) atau Administrator institusi yang dapat membaca.
   - **Pembaruan:** Field identitas permanen (`['uid','nomorAlumni','prodi','angkatan','role','createdAt']`) dikunci secara mutlak via `locked()` helper.

2. **Koleksi Publik `public_profiles/{uid}`:**
   - Berisi **hanya whitelist field aman**:
     - `namaLengkap`, `prodi`, `angkatan`, `bio`, `keahlian`, `portfolio` (maksimal 12 item), `openToWork`, `avatarUrl`, `domisili`.
   - **Hak Baca:** Publik (`allow read: if true`).
   - **Hak Tulis:** Tertutup bagi seluruh client (`allow write: if false` / Admin only). Dokumen ini dimutakhirkan secara otomatis oleh background Cloud Function `syncPublicProfile`.

---

## 3. Alur Registrasi & Klaim Akun Alumni (`claimAlumni`)

### Masalah Awal (F-04, F-24)
- Form registrasi awal memanggil query nama alumni otomatis saat pengguna mengetik nomor alumni. Ini memungkinkan penyerang menebak nomor dan mengumpulkan daftar nama resmi alumni (Enumeration Attack).
- Penyerang bisa mendaftar dengan nomor alumni milik orang lain tanpa faktor verifikasi kedua.
- Terjadi *race condition* jika dua orang mengklaim nomor yang sama secara bersamaan.

### Desain Baru
1. **Peniadaan Auto-fill Bocoran Nama:**
   - Form pendaftaran (`/register`) mengharuskan pendaftar mengetik nama lengkapnya sendiri.
2. **Klaim Atomik via Callable Function (`claimAlumni`):**
   - Registrasi diproses dalam **Firestore Transaction** di server:
     - Membaca dokumen `alumni_registry/{normalizedNomor}`.
     - Memeriksa apakah nomor sudah pernah diklaim (`claimed == true`).
     - **Verifikasi Faktor Kedua (2FA Match):** Memvalidasi kecocokan nama lengkap pendaftar terhadap nama resmi arsip kampus.
     - Mengunci nomor alumni (`claimed: true, claimedBy: uid`).
     - Menginisialisasi dokumen `users/{uid}` dan `public_profiles/{uid}` secara atomik menggunakan data resmi institusi (mencegah manipulasi prodi/angkatan).

---

## 4. Pola ID Dokumen Deterministik (*Deterministic Document IDs*)

### Masalah Awal (F-06, F-10, F-21)
Sebelumnya penulisan dokumen `applications` dan `contact_requests` menggunakan auto-generated ID acak dari client (`collection(db, 'applications')`). Akibatnya:
- Pelamar dapat melakukan submit berulang kali (spam) pada satu lowongan.
- Terjadi *Time-of-Check to Time-of-Use (TOCTOU)* race condition.
- Target permintaan kontak dapat memanipulasi pesan yang dikirimkan oleh pemohon.

### Desain Baru
1. **Lamaran Kerja (`applications`):**
   - ID dokumen dikunci dengan format deterministik:
     $$\text{Document ID} = \texttt{jobId\_applicantUid}$$
   - Aturan keamanan Firestore memverifikasi:
     `applicationId == request.resource.data.jobId + '_' + request.auth.uid`
   - Hanya 1 dokumen lamaran yang dapat dibuat per pelamar untuk setiap lowongan.
   - Poster lowongan hanya diperbolehkan mengubah field status (`reviewed`, `accepted`, `rejected`) dan dilarang mengubah pesan atau CV pelamar.

2. **Permintaan Akses Kontak (`contact_requests`):**
   - ID dokumen dikunci dengan format deterministik:
     $$\text{Document ID} = \texttt{requesterUid\_targetUid}$$
   - Target hanya dapat mengubah status (`approved` atau `rejected`) via `affectedKeys().hasOnly(['status', 'updatedAt'])`.

---

## 5. Rekayasa Penyimpanan Objek (Storage Rules & Anti-Flooding)

### Masalah Awal (F-03, F-12, F-23)
- Unggahan avatar dan CV menggunakan nama file dinamis dengan timestamp (`avatar_${Date.now()}.jpg`). Pengguna yang sering mengganti foto akan meninggalkan sampah ribuan file di storage (*storage flooding*).
- Evaluasi `allow delete` sebelumnya memeriksa `request.resource.size`, yang menyebabkan crash aturan keamanan karena pada operasi delete `request.resource` selalu bernilai `null` (F-23).
- Format file gambar menerima `.svg`, yang membuka celah Stored Cross-Site Scripting (XSS via embedded JavaScript di dalam XML SVG).

### Desain Baru
1. **Nama File Statis (Self-Overwriting):**
   - Avatar: `avatars/{userId}/avatar.(jpg|jpeg|png|webp)` (maksimal 3MB).
   - CV: `cv_documents/{userId}/cv.pdf` (maksimal 5MB, hanya PDF).
   - Setiap unggahan baru otomatis menimpa file lama, menjaga kuota storage tetap bersih dan hemat biaya.
2. **Pemisahan Operasi Delete:**
   ```javascript
   allow delete: if isOwner(userId);
   allow create, update: if isOwner(userId) && ...
   ```
   Operasi delete tidak lagi menyentuh `request.resource`, menyelesaikan bug F-23 100%.
3. **Blacklist SVG:**
   Tipe MIME dikunci ketat ke `image/(jpeg|png|webp)`. SVG ditolak secara mutlak pada tingkat Rules.

---

## 6. Pemulihan UX & Bug Logika (F-26 & Gaps)

1. **Bug Korupsi Format Gaji di `/post-lowongan` (F-26):**
   - Fungsi `formatRupiahString()` diperbaiki dengan regex cerdas sehingga input seperti `"5jt - 8jt"` atau `"5.000.000 - 8.000.000"` tidak lagi rusak menjadi `"Rp 5 - Rp 8"`.
2. **Modal Detail Lowongan Lengkap (Gap 6.3):**
   - Pelamar dapat membaca seluruh deskripsi, daftar kualifikasi, rentang gaji, dan tanggal deadline secara utuh sebelum mengirim lamaran.
3. **Persetujuan Eksplisit Kontak WhatsApp (F-02, UU PDP):**
   - Pada modal submit lamaran, ditambahkan checkbox *explicit consent*:
     `[x] Bagikan nomor WhatsApp saya kepada poster lowongan ini untuk keperluan komunikasi lanjutan.`
   - Jika tidak dicentang, nomor telepon tidak dikirimkan ke poster.
4. **Sub-tab "Permintaan Kontak yang Saya Ajukan" di `/lamaran` (Gap 6.8):**
   - Alumni dapat melacak status permintaan kontak yang pernah mereka kirimkan ke alumni lain (Pending, Approved, Rejected).
5. **Mitigasi Document ID Spoofing (F-21):**
   - Seluruh pemanggilan spread object diubah dari `{ id: doc.id, ...doc.data() }` menjadi:
     ```typescript
     { ...doc.data(), id: doc.id }
     ```
     Document ID asli dari database selalu menimpa field palsu yang mungkin disisipkan penyerang.
6. **Sanitasi URL XSS (F-07):**
   - Fungsi `safeHttpUrl()` diterapkan pada seluruh link eksternal (portofolio, resume, CV link) untuk menolak skema `javascript:` atau `data:`.

---

## 7. Status Pengujian & Integrasi CI/CD

- **Unit Testing Rules (Bagian 10):** 20/20 skenario uji lulus (*ALL PASS*).
- **TypeScript:** Kompilasi bersih dengan 0 error (`npx tsc --noEmit`).
- **ESLint:** Lolos 100% tanpa error (`npm run lint`).
- **Next.js Production Build:** 12/12 rute halaman terkompilasi sukses dengan Turbopack.
- **GitHub Actions Pipeline:** File `.github/workflows/ci.yml` dikonfigurasi untuk menjalankan typecheck, linter, npm audit, build, dan suite tes Firebase Rules secara otomatis pada setiap pull request dan commit.
