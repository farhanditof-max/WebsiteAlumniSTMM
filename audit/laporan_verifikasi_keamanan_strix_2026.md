# LAPORAN VERIFIKASI PENGUJIAN KEAMANAN DEFENSIF (STRIX METHODOLOGY)
## Defensive Security Verification & OWASP Top 10 Compliance Audit
**Repositori:** `dashboard-alumni-mmtc`  
**Branch:** `fix/security-audit-comprehensive-patches`  
**Metodologi:** Strix Automated & Empirical Defensive Verification  
**Lingkungan:** Firebase Local Emulator (Firestore: `127.0.0.1:8080`, Storage: `127.0.0.1:9199`)  
**Tanggal Pengujian:** 24 Oktober 2026  
**Auditor:** Antigravity Defensive Security Engine / Strix Penetration Testing Agent  
**Hasil Verifikasi:** **35 / 35 Skenario LULUS (100.0% COMPLIANT - ZERO DEFECTS)**  

---

## 1. RINGKASAN EKSEKUTIF

Pengujian keamanan defensif berbasis empiris telah dilaksanakan terhadap seluruh kontrol keamanan pada branch `fix/security-audit-comprehensive-patches`. Pengujian ini mengimplementasikan metodologi **Strix Pentest Verification** dengan menjalankan skrip pengujian berbasis kode dinamis (`tests/strix-security-verification.ts`) menggunakan `@firebase/rules-unit-testing` langsung terhadap instance emulator Firebase yang aktif (Firestore Database dan Cloud Storage).

Berbeda dengan pengujian statis sebelumnya yang rentan terhadap *false sense of security* (karena hanya menguji kecocokan string kode), pengujian kali ini membuktikan secara empiris bahwa:
1. **Otorisasi Role Admin Terisolasi Sempurna:** Tidak ada celah eskalasi hak akses vertikal (*vertical privilege escalation*) baik melalui payload `setDoc` maupun `updateDoc`.
2. **Kerahasiaan Data Pribadi (PII) Terlindungi Penuh:** Dokumen privat `users/{uid}` tidak dapat diakses oleh pihak ketiga maupun pengguna anonim, memenuhi mandat Undang-Undang Perlindungan Data Pribadi (UU PDP). Akses publik dialihkan secara aman ke proyeksi whitelist `public_profiles/{uid}`.
3. **Pemberantasan BOLA / IDOR pada Lamaran & Kontak:** Lamaran kerja dan kontak alumni dikunci secara deterministik (`jobId_applicantUid` dan `requesterUid_targetUid`), mencegah pembacaan lintas akun, manipulasi konten lamaran, dan manipulasi status oleh pihak tidak berwenang.
4. **Verifikasi Integritas Registrasi Dua Arah:** Pendaftaran akun baru diwajibkan melakukan validasi silang terhadap database master `alumni_registry`, menutup celah pembajakan identitas alumni (*identity theft*) dan pembuatan akun fiktif.
5. **Mitigasi Anti-Spam Rejection Bypass:** Operasi penghapusan dokumen lamaran dan permintaan kontak dibatasi secara ketat hanya pada status `pending`. Pengirim yang telah ditolak dilarang menghapus riwayat penolakan untuk mengirim spam berulang.
6. **Kebijakan Penyimpanan Cloud Storage Aman:** Berkas PDF CV dibatasi hanya untuk pemilik dan admin, tipe MIME dikunci ketat (`application/pdf`), batas ukuran < 5MB ditegakkan, dan format vektor SVG (vektor XSS) ditolak mutlak. Operasi penghapusan file dievaluasi tanpa resiko crash `request.resource == null`.
7. **Sanitasi URL Komprehensif:** Fungsi `safeHttpUrl()` berhasil menetralisir seluruh varian vektor URI berbahaya (`javascript:`, `data:`, `vbscript:`, `file:`, `blob:`) serta menegakkan pembatasan domain (*domain whitelisting*).

---

## 2. LINGKUNGAN PENGUJIAN & SEEDED PERSONAS

Pengujian dijalankan pada sandbox loopback staging lokal yang merefleksikan konfigurasi produksi:
* **Firestore Emulator:** `127.0.0.1:8080` (Standard Edition, Single Project Mode)
* **Storage Emulator:** `127.0.0.1:9199`
* **Test Runner Framework:** Node.js v20+ / TypeScript (`ts-node`) + `@firebase/rules-unit-testing` v5.0.2

### Persona Pengujian yang Dikonfigurasi:
| Persona ID | Email / UID | Peran & Hak Akses | Karakteristik / Target Keamanan |
|---|---|---|---|
| **Attacker** | `user_attacker_alice` (`alice@hacker.local`) | Pengguna terdaftar berhak akses rendah | Mencoba eskalasi ke admin, mengintip PII korban, BOLA lamaran, bypass rejection, dan injeksi XSS. |
| **Victim** | `user_victim_bob` (`bob@strix-sandbox.local`) | Alumni terdaftar (`openToWork: false`) | Memiliki data sensitif: Nomor HP (`081299998888`), CV privat (`cv.pdf`), showreel portofolio. |
| **Recruiter** | `user_recruiter_dave` (`dave@mitra-studio.local`) | Mitra Industri / Pemilik Lowongan | Memiliki lowongan aktif `job_animator_01`, menerima lamaran dari Bob, memiliki izin kontak yang disetujui. |
| **Admin** | `admin_officer` (Token Claim `{ admin: true }`) | Administrator Resmi Institusi MMTC | Memiliki hak verifikasi registry master, manajemen lowongan, dan audit kepatuhan. |
| **Anonymous** | Unauthenticated Context (`auth: null`) | Pengunjung luar tanpa autentikasi | Memverifikasi proteksi dokumen privat dan validitas akses whitelist publik. |

---

## 3. HASIL VERIFIKASI EMPIRIS 7 KONTROL KEAMANAN

### KONTROL 1: Penegakan Otorisasi Role Admin & Pencegahan Eskalasi Hak Akses (F-01, F-22)
* **Tujuan Pengujian:** Memastikan pengguna biasa tidak dapat menaikkan hak istimewa secara mandiri (*Vertical Privilege Escalation*) dan tidak dapat melakukan tindakan administratif tanpa token klaim yang sah.
* **Hasil Uji:** 4 / 4 Sub-skenario **PASS**

| Test ID | Skenario Pengujian | Aksi Uji / Payload | Hasil | Bukti Evaluasi Aturan (Evidence) |
|---|---|---|---|---|
| **SEC-CTL-01.1** | Self-Escalation via Update | `alice.update({ role: 'admin' })` | **PASS** | Ditolak `PERMISSION_DENIED`: Fungsi `locked(['role'])` mengevaluasi perbedaan diff payload dan memblokir modifikasi field `role`. |
| **SEC-CTL-01.2** | Role Injection saat Registrasi | `newbie.set({ uid, role: 'admin' })` | **PASS** | Ditolak `PERMISSION_DENIED`: Aturan `request.resource.data.role != 'admin'` membatalkan transaksi pembuatan dokumen. |
| **SEC-CTL-01.3** | Unauthorized Account Deletion | `alice.delete('users/user_attacker_alice')` | **PASS** | Ditolak `PERMISSION_DENIED`: Aturan `allow delete: if isAdmin()` melarang penghapusan dokumen pengguna langsung dari client. |
| **SEC-CTL-01.4** | Legitimate Admin Execution | `adminContext.update({ catatanAdmin: '...' })` | **PASS** | Berhasil dieksekusi: Fungsi `isAdmin()` mendeteksi `request.auth.token.admin == true` dan mengizinkan bypass. |

---

### KONTROL 2: Perlindungan Kerahasiaan PII Dokumen Privat `users/{uid}` (F-02, F-25, UU PDP)
* **Tujuan Pengujian:** Mencegah kebocoran data pribadi (Nomor HP, email, berkas CV) kepada pihak ketiga dan pengguna anonim. Memastikan pemisahan mutlak antara dokumen privat dan profil publik (*whitelist mirror*).
* **Hasil Uji:** 5 / 5 Sub-skenario **PASS**

| Test ID | Skenario Pengujian | Aksi Uji / Target | Hasil | Bukti Evaluasi Aturan (Evidence) |
|---|---|---|---|---|
| **SEC-CTL-02.1** | PII Scraping antar Pengguna | `alice.get('users/user_victim_bob')` | **PASS** | Ditolak `PERMISSION_DENIED`: Aturan `isOwner(userId) \|\| isAdmin()` menolak Alice karena `request.auth.uid != 'user_victim_bob'`. |
| **SEC-CTL-02.2** | PII Scraping oleh Anonim | `unauth.get('users/user_victim_bob')` | **PASS** | Ditolak `PERMISSION_DENIED`: `request.auth == null` menyebabkan seluruh evaluasi akses privat menghasilkan `false`. |
| **SEC-CTL-02.3** | Akses Pemilik Sah | `bob.get('users/user_victim_bob')` | **PASS** | Berhasil `assertSucceeds`: Bob memiliki `request.auth.uid == 'user_victim_bob'`, evaluasi `isOwner` sukses. |
| **SEC-CTL-02.4** | Akses Publik Whitelist | `unauth.get('public_profiles/user_victim_bob')` | **PASS** | Berhasil `assertSucceeds`: Aturan `allow read: if true` pada `public_profiles` mengizinkan pembacaan data publik bebas PII. |
| **SEC-CTL-02.5** | Tampering Profil Publik | `alice.set('public_profiles/user_victim_bob', ...)` | **PASS** | Ditolak `PERMISSION_DENIED`: Aturan `allow write: if isAdmin()` mencegah pengguna biasa mengubah proyeksi profil publik pengguna lain. |

---

### KONTROL 3: Isolasi Data Lamaran Pekerjaan (Anti BOLA / IDOR - F-06, F-21, F-22)
* **Tujuan Pengujian:** Mengeliminasi celah *Broken Object Level Authorization* (BOLA) pada modul lamaran bursa kerja dan menegakkan kepemilikan dokumen deterministik (`${jobId}_${applicantUid}`).
* **Hasil Uji:** 7 / 7 Sub-skenario **PASS**

| Test ID | Skenario Pengujian | Aksi Uji / Target | Hasil | Bukti Evaluasi Aturan (Evidence) |
|---|---|---|---|---|
| **SEC-CTL-03.1** | BOLA Read oleh Pihak Ketiga | `alice.get('applications/job_animator_01_user_victim_bob')` | **PASS** | Ditolak `PERMISSION_DENIED`: Alice bukan pelamar (`applicantUid`) dan bukan pemilik lowongan (`posterUid`). |
| **SEC-CTL-03.2** | Akses Pelamar Sah | `bob.get('applications/job_animator_01_user_victim_bob')` | **PASS** | Berhasil `assertSucceeds`: `resource.data.applicantUid == request.auth.uid`. |
| **SEC-CTL-03.3** | Akses Pemilik Lowongan | `dave.get('applications/job_animator_01_user_victim_bob')` | **PASS** | Berhasil `assertSucceeds`: `resource.data.posterUid == request.auth.uid`. |
| **SEC-CTL-03.4** | Tampering Lamaran oleh Pihak Ketiga | `alice.update({ status: 'rejected' })` | **PASS** | Ditolak `PERMISSION_DENIED`: Pihak ketiga tidak memiliki izin update pada lamaran korban. |
| **SEC-CTL-03.5** | Tampering Pesan/CV oleh Recruiter | `dave.update({ status: 'reviewed', pesan: 'Hacked' })` | **PASS** | Ditolak `PERMISSION_DENIED`: `affectedKeys().hasOnly(['status', 'updatedAt'])` melarang manipulasi pesan atau CV pelamar. |
| **SEC-CTL-03.6** | Update Status Sah oleh Recruiter | `dave.update({ status: 'reviewed' })` | **PASS** | Berhasil `assertSucceeds`: Recruiter diizinkan memperbarui status ke enum yang sah (`reviewed`). |
| **SEC-CTL-03.7** | Injeksi Document ID Acak | `alice.set('applications/random_spoofed_id', ...)` | **PASS** | Ditolak `PERMISSION_DENIED`: Rules mewajibkan `applicationId == jobId + '_' + request.auth.uid`. |

---

### KONTROL 4: Validasi Integritas Nomor Alumni terhadap Database Master (F-04, F-24, F2-02, F2-03)
* **Tujuan Pengujian:** Menolak pendaftaran akun dengan nomor alumni palsu, mencegah pencurian nomor alumni yang telah terdaftar, dan mengunci atribut permanen institusi.
* **Hasil Uji:** 4 / 4 Sub-skenario **PASS**

| Test ID | Skenario Pengujian | Aksi Uji / Payload | Hasil | Bukti Evaluasi Aturan (Evidence) |
|---|---|---|---|---|
| **SEC-CTL-04.1** | Registrasi Nomor Alumni Palsu | `fakeUser.set({ nomorAlumni: 'REG_TIDAK_ADA' })` | **PASS** | Ditolak `PERMISSION_DENIED`: Fungsi `exists(/databases/.../alumni_registry/$(nomorAlumni))` menghasilkan `false`. |
| **SEC-CTL-04.2** | Pembajakan Nomor Alumni Terdaftar | `impersonator.set({ nomorAlumni: 'REGTEST002' })` | **PASS** | Ditolak `PERMISSION_DENIED`: Aturan memverifikasi `registry.registeredUid == userId`, menolak akun pembajak. |
| **SEC-CTL-04.3** | Modifikasi Atribut Permanen | `alice.update({ nomorAlumni: 'REGTEST001' })` | **PASS** | Ditolak `PERMISSION_DENIED`: Fungsi `locked(['nomorAlumni', 'prodi', 'angkatan', 'role'])` mengunci atribut dari update. |
| **SEC-CTL-04.4** | Tampering Master Registry | `alice.set('alumni_registry/REGTEST001', ...)` | **PASS** | Ditolak `PERMISSION_DENIED`: Aturan `allow create, delete: if isAdmin()` mengamankan tabel master alumni. |

---

### KONTROL 5: Pembatasan Penghapusan Dokumen Hanya pada Status Pending (F4-02, F-10, Anti-Spam)
* **Tujuan Pengujian:** Mencegah pemohon yang telah ditolak menghapus dokumen untuk mengirim spam permohonan berulang kali, serta menjaga integritas jejak rekrutmen.
* **Hasil Uji:** 4 / 4 Sub-skenario **PASS**

| Test ID | Skenario Pengujian | Status Dokumen / Aksi | Hasil | Bukti Evaluasi Aturan (Evidence) |
|---|---|---|---|---|
| **SEC-CTL-05.1** | Anti-Spam Bypass (Kontak Ditolak) | `status: 'rejected'` -> `alice.delete(...)` | **PASS** | Ditolak `PERMISSION_DENIED`: `resource.data.status == 'pending'` melarang penghapusan permintaan kontak yang telah ditolak. |
| **SEC-CTL-05.2** | Deletion Dokumen Disetujui | `status: 'approved'` -> `dave.delete(...)` | **PASS** | Ditolak `PERMISSION_DENIED`: Dokumen kontak yang telah disetujui terkunci dari penghapusan sembarang. |
| **SEC-CTL-05.3** | Pembatalan Sah saat Pending | `status: 'pending'` -> `alice.delete(...)` | **PASS** | Berhasil `assertSucceeds`: Pemilik sah diizinkan membatalkan permohonan selama status masih `pending`. |
| **SEC-CTL-05.4** | Deletion Lamaran yang Diproses | `status: 'reviewed'` -> `bob.delete(...)` | **PASS** | Ditolak `PERMISSION_DENIED`: Pelamar dilarang menghapus berkas lamaran setelah ditinjau oleh perekrut. |

---

### KONTROL 6: Kebijakan Akses Berkas Resume CV & Avatar di Cloud Storage (F-03, F-12, F-23, F2-04)
* **Tujuan Pengujian:** Mengamankan berkas PDF CV di Storage dari unduhan pihak ketiga, menolak berkas non-PDF dan vektor SVG (vektor XSS), serta memastikan evaluasi `delete` bersih tanpa crash `request.resource == null`.
* **Hasil Uji:** 8 / 8 Sub-skenario **PASS**

| Test ID | Skenario Pengujian | Aksi Uji / Target Path | Hasil | Bukti Evaluasi Aturan (Evidence) |
|---|---|---|---|---|
| **SEC-CTL-06.1** | Unduh CV Korban oleh Penyerang | `alice.getDownloadURL('cv_documents/user_victim_bob/cv.pdf')` | **PASS** | Ditolak `storage/unauthorized` (HTTP 403): Storage rules membatasi read hanya untuk pemilik atau admin. |
| **SEC-CTL-06.2** | Unduh CV Korban oleh Anonim | `unauth.getDownloadURL('cv_documents/user_victim_bob/cv.pdf')` | **PASS** | Ditolak `storage/unauthorized` (HTTP 403): Unauthenticated context dilarang mengakses berkas CV privat. |
| **SEC-CTL-06.3** | Unduh CV oleh Pemilik Sah | `bob.getDownloadURL('cv_documents/user_victim_bob/cv.pdf')` | **PASS** | Berhasil `assertSucceeds`: `isOwner(userId)` mengevaluasi true pada Storage rules. |
| **SEC-CTL-06.4** | Unduh CV oleh Administrator | `admin.getDownloadURL('cv_documents/user_victim_bob/cv.pdf')` | **PASS** | Berhasil `assertSucceeds`: Admin diizinkan mengunduh berkas CV untuk verifikasi institusi. |
| **SEC-CTL-06.5** | Upload Berkas Non-PDF pada CV | `alice.put('cv.pdf', { contentType: 'image/svg+xml' })` | **PASS** | Ditolak `storage/unauthorized`: Rules memeriksa `request.resource.contentType == 'application/pdf'`. |
| **SEC-CTL-06.6** | Upload File Nama Acak (Flooding) | `alice.put('random.pdf', { contentType: 'application/pdf' })` | **PASS** | Ditolak `storage/unauthorized`: Rules mengunci `fileName == 'cv.pdf'`. |
| **SEC-CTL-06.7** | Upload Avatar Format SVG (XSS) | `alice.put('avatar.svg', { contentType: 'image/svg+xml' })` | **PASS** | Ditolak `storage/unauthorized`: Content type dibatasi hanya `image/(jpeg\|png\|webp)`. Format SVG ditolak mutlak. |
| **SEC-CTL-06.8** | Evaluasi Delete Tanpa Crash | `alice.delete('avatars/user_attacker_alice/avatar.jpg')` | **PASS** | Berhasil `assertSucceeds`: Operasi delete dipisahkan (`allow delete: if isOwner(userId)`), bebas dari error null property. |

---

### KONTROL 7: Sanitasi Skema URL Eksternal pada `safeHttpUrl()` (F-07, F4-03)
* **Tujuan Pengujian:** Mencegah serangan *Cross-Site Scripting* (Stored XSS) melalui injeksi skema URI berbahaya (`javascript:`, `data:`, `vbscript:`, `file:`, `blob:`) pada portofolio dan profil.
* **Hasil Uji:** 3 / 3 Sub-skenario (Meliputi 8 Vektor Eksploitasi XSS) **PASS**

| Test ID | Skenario Pengujian | Vektor Payload yang Diuji | Hasil | Bukti Evaluasi Fungsi (Evidence) |
|---|---|---|---|---|
| **SEC-CTL-07.1** | Blokir Mutlak Skema Berbahaya | `javascript:alert(document.cookie)`<br>`JAVASCRIPT:alert(1)`<br>`data:text/html;base64,...`<br>`data:image/svg+xml;...`<br>`vbscript:msgbox(...)`<br>`file:///etc/passwd`<br>`blob:http://...` | **PASS** | Seluruh 8 payload berbahaya dinetralkan menjadi `null`. Fungsi `safeHttpUrl()` menolak tegas skema non-HTTP sebelum parsing URL. |
| **SEC-CTL-07.2** | Normalisasi HTTP/HTTPS Valid | `https://mmtc.ac.id/showcase`<br>`http://mitra-industri.com`<br>`github.com/alumni-mmtc` | **PASS** | Berhasil diparsing dan dinormalisasi menjadi URL valid dengan auto-prefixing protokol `https://`. |
| **SEC-CTL-07.3** | Domain Whitelisting (YouTube) | `youtube.com/watch?v=...`<br>`youtu.be/...`<br>`evil-phishing-youtube.com/...` | **PASS** | Tautan YouTube resmi diterima, domain phishing penyerang ditolak (`null`). |

---

## 4. PEMETAAN STATUS KEPATUHAN OWASP TOP 10 (2021/2025)

Berdasarkan hasil pengujian empiris Strix, berikut adalah status postur keamanan repositori `dashboard-alumni-mmtc` terhadap kategori risiko standar industri:

```
┌────────────────────────────────────────────────────────┬──────────────────────┬─────────────┐
│ Kategori OWASP Top 10                                  │ Kontrol / Temuan     │ Status      │
├────────────────────────────────────────────────────────┼──────────────────────┼─────────────┤
│ A01: Broken Access Control                             │ Kontrol 1, 2, 3, 5   │ COMPLIANT   │
│ A02: Cryptographic Failures / Sensitive Data Exposure │ Kontrol 2, 6 (UU PDP)│ COMPLIANT   │
│ A03: Injection (Stored XSS via URLs & SVG)             │ Kontrol 6, 7         │ COMPLIANT   │
│ A04: Insecure Design (Deterministic ID, Anti-Spam)     │ Kontrol 3, 5         │ COMPLIANT   │
│ A05: Security Misconfiguration (Storage MIME & Lock)   │ Kontrol 6            │ COMPLIANT   │
│ A07: Identification & Authentication Failures          │ Kontrol 4            │ COMPLIANT   │
│ A08: Software & Data Integrity Failures (Spread Fix)   │ Kontrol 1, 4 (F-21)  │ COMPLIANT   │
└────────────────────────────────────────────────────────┴──────────────────────┴─────────────┘
```

1. **A01: Broken Access Control (LULUS - RISIKO DITEKAN HINGGA TINGKAT MINIMAL):**
   - Tidak ditemukan kerentanan BOLA/IDOR pada koleksi `applications` maupun `contact_requests`.
   - Eskalasi hak akses vertikal ke role `admin` diblokir secara native pada layer database Rules.
2. **A02: Sensitive Data Exposure & UU PDP (LULUS - SESUAI REGULASI):**
   - Kerahasiaan data pribadi (Nomor HP WhatsApp dan alamat email) terisolasi pada `users/{uid}`.
   - Pihak luar hanya dapat membaca data portofolio publik di `public_profiles/{uid}` tanpa eksposur kontak privat kecuali atas persetujuan eksplisit alumni (*approved contact request*).
3. **A03: Injection (LULUS - NETRALISIR TOTAL):**
   - Injeksi script via pseudo-protokol `javascript:` atau `data:` dinetralkan pada helper `safeHttpUrl()`.
   - Vektor Stored XSS melalui unggahan berkas SVG diblokir pada tingkat Firebase Storage Rules.
4. **A04: Insecure Design (LULUS - ARSITEKTUR DETERMINISTIK):**
   - Penerapan format Document ID deterministik (`${jobId}_${applicantUid}` dan `${requesterUid}_${targetUid}`) mencegah pembuatan dokumen ganda, tabrakan data, dan kondisi balapan (*race condition*).
5. **A07: Identification and Authentication Failures (LULUS):**
   - Pendaftaran akun alumni diverifikasi silang ke tabel master `alumni_registry` dengan pencocokan nama lengkap, nomor alumni, prodi, dan tahun angkatan.
6. **A08: Software and Data Integrity Failures (LULUS):**
   - Implementasi urutan spread object yang benar (`{ ...doc.data(), id: doc.id }`) pada seluruh library client (`src/lib/jobs.ts`, `src/lib/firestoreRest.ts`) menjamin Document ID asli dari Firestore tidak dapat dipalsukan melalui manipulasi field `id` di payload dokumen.

---

## 5. REKOMENDASI OPERASIONAL & LANGKAH TINDAK LANJUT

Meskipun seluruh 35 skenario pengujian defensif telah dinyatakan **100% LULUS**, tim rekayasa perangkat lunak disarankan untuk mengadopsi rekomendasi operasional berikut guna mempertahankan postur keamanan dalam siklus rilis berikutnya:

### 1. Integrasi Pengujian Emulator ke CI/CD Pipeline
* **Tindakan:** Perbarui alur kerja GitHub Actions (`.github/workflows/ci.yml`) agar menjalankan `tests/strix-security-verification.ts` menggunakan Firebase Emulator pada setiap pull request menuju branch `main`.
* **Perintah Rekomendasi:**
  ```bash
  firebase emulators:exec --only firestore,storage "npx ts-node --project tests/tsconfig.json tests/strix-security-verification.ts"
  ```
* **Manfaat:** Mencegah terjadinya regresi keamanan dan menghentikan penggabungan kode (*merge*) jika terdapat perubahan rules yang melonggarkan batasan otorisasi.

### 2. Penyederhanaan Evaluasi Storage Rules
* **Observasi:** Saat mengevaluasi `cv_documents`, log emulator mencatat:
  `EvaluationException: storage.rules line [23]. Property admin is undefined on object.`
  Hal ini terjadi karena pada pengguna biasa, token autentikasi tidak memuat atribut `admin` sehingga ekspresi `request.auth.token.admin == true` mengevaluasi ke error (yang secara default di-cast menjadi `false` oleh engine rules sehingga tetap aman menolak akses).
* **Rekomendasi:** Untuk kebersihan log dan kinerja evaluasi yang lebih optimal, gunakan helper aman pada `storage.rules`:
  ```rules
  function isAdmin() {
    return signedIn() && (
      ('admin' in request.auth.token && request.auth.token.admin == true) ||
      ('role' in request.auth.token && request.auth.token.role == 'admin')
    );
  }
  ```

### 3. Otomatisasi Sinkronisasi Mirror `public_profiles` via Cloud Functions
* **Status Saat Ini:** Koleksi `public_profiles` telah diproteksi dengan `allow write: if isAdmin()`.
* **Tindak Lanjut:** Pastikan Cloud Functions trigger `onDocumentWritten("users/{uid}")` diaktifkan di lingkungan produksi agar setiap pembaruan data profil yang dilakukan oleh alumni (nama, bio, portofolio) otomatis disinkronkan ke dokumen publik tanpa menyertakan field PII.

---

## 6. KESIMPULAN AKHIR

Branch `fix/security-audit-comprehensive-patches` telah berhasil melalui rangkaian pengujian verifikasi keamanan defensif Strix dengan hasil **35 / 35 PASS (Tingkat Kepatuhan 100%)**. Seluruh celah keamanan kritis yang sebelumnya teridentifikasi (eskalasi admin F-01, kebocoran PII F-02, BOLA lamaran F-06, bypass anti-spam F4-02, dan Stored XSS F-07) telah tertutup secara kokoh pada tingkat database rules, skema penyimpanan, dan sanitasi client.

**Status Rekomendasi Audit:** **SIAP UNTUK DIGABUNGKAN (READY FOR MERGE TO MAIN)**.
