# 🎓 Dashboard Alumni MMTC Yogyakarta

Portal web resmi jejaring alumni, direktori talenta kreatif (*Open to Work*), dan bursa lowongan kerja bagi lulusan **Sekolah Tinggi Multi Media (STMM "MMTC") Yogyakarta** — Kementerian Komunikasi dan Digital RI.

---

## 🚀 Fitur Utama

- **Directory Alumni & Open to Work**: Eksplorasi profil alumni dari seluruh Program Studi MMTC (Animasi, Game Design, MIK, Matekstosi, Manarita, Manaprodsi) lengkap dengan badge keahlian dan status kesiapan kerja.
- **Portofolio Kreatif & Showreel Embed**: Integrasi responsif 2-kolom untuk video YouTube Showreel, Behance, Artstation, Pinterest, dan tautan portofolio eksternal.
- **Bursa Lowongan Kerja & Rekrutmen Internal**: Publikasi lowongan kerja oleh alumni untuk sesama alumni dengan filter program studi dan validasi deadline.
- **Pelacakan Lamaran & Kontak Cepat**: Ajukan lamaran dengan cover letter & CV PDF, pelacakan status lamaran real-time, serta tombol direct WhatsApp (`wa.me`) untuk recruiter.
- **Verifikasi Nomor Alumni & Autentikasi Aman**: Validasi format identitas alumni MMTC (`MMTC-YYYY-XXX`) dengan proteksi keamanan Firebase Auth, Firestore Security Rules, dan Storage Rules.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **UI Library**: [React 19](https://react.dev/) & [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend & Database**: [Google Firebase v12](https://firebase.google.com/)
  - **Firebase Authentication** (Email & Password)
  - **Cloud Firestore** (Database dokumen profil, lowongan, dan lamaran)
  - **Firebase Storage** (Penyimpanan CV PDF & foto avatar)

---

## 📦 Panduan Instalasi Lokal

### 1. Clone Repository
```bash
git clone https://github.com/farhanditof-max/WebsiteAlumniSTMM.git
cd WebsiteAlumniSTMM
```

### 2. Pasang Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Lalu lengkapi konfigurasi kredensial Firebase web app Anda di `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=dashboard-alumni-mmtc.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=dashboard-alumni-mmtc
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=dashboard-alumni-mmtc.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

### 4. Jalankan Development Server
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

---

## 🔒 Firebase Security Rules

Project ini sudah dilengkapi security rules siap-pakai:
- `firestore.rules`: Membatasi pembacaan dan penulisan dokumen berdasarkan kepemilikan UID pengguna.
- `storage.rules`: Membatasi pengunggahan file CV (maksimal 5MB, format PDF) dan foto profil avatar (maksimal 3MB).

Deploy aturan ke Firebase via Firebase CLI:
```bash
firebase deploy --only firestore:rules,storage
```

---

## 🌐 Deployment (Vercel)

Proyek ini dioptimasi penuh untuk dideploy langsung ke **Vercel**:
1. Push repository ini ke GitHub.
2. Buka dashboard [Vercel](https://vercel.com) dan pilih **Add New Project**.
3. Hubungkan repository GitHub Anda.
4. Masukkan Environment Variables sesuai isi file `.env.local`.
5. Klik **Deploy**.

---

## 📜 Lisensi & Hak Cipta

Dikembangkan untuk Komunitas Alumni STMM "MMTC" Yogyakarta. Dilindungi hak cipta © 2026.
