<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 🤖 AGENTS.md — Panduan Khusus AI Agent (UI/Frontend Development)

> **Peran Agent:** Senior Frontend / UI / UX Engineer  
> **Tujuan Proyek:** Mengembangkan, mempercantik, dan menyempurnakan tampilan antarmuka (UI/UX) portal **Dashboard Alumni STMM MMTC Yogyakarta** agar modern, responsif, elegan, dan berstandar industri tanpa merusak logika backend yang sudah berjalan.

---

## 🛑 ATURAN MUTLAK: JANGAN SENTUH BACKEND (Strict Guardrails)

Backend (Firebase Auth, Cloud Firestore, Firebase Storage, dan Security Rules) **SUDAH SELESAI, STABIL, DAN SUDAH DI-AUDIT SECARA KETAT**. 

### ❌ File yang DILARANG DIBUBAH / DIHAPUS:
1. **`src/lib/*`** (`firebase.ts`, `firestoreRest.ts`, `auth.ts`, `jobs.ts`, `media.ts`)  
   👉 Dilarang mengubah alur data fetching, login/register logic, REST query, atau endpoint API.
2. **`firestore.rules` & `storage.rules`**  
   👉 Dilarang mengedit atau merelaksasi security rules.
3. **`src/context/AuthContext.tsx`**  
   👉 Dilarang mengubah state management auth, session tracking, atau fallback logic.
4. **`src/types/index.ts`**  
   👉 Dilarang menghapus atau mengubah interface inti (`UserProfile`, `JobPosting`, `JobApplication`). Jika butuh interface untuk prop komponen UI murni, definisikan di file komponen masing-masing atau buat file types UI terpisah.
5. **`.env*` & `.env.local`**  
   👉 Jangan pernah membuat perubahan yang mengekspos environment variables ke git.

### ❌ Larangan Teknis & Anti-Pattern:
- **JANGAN** mengubah nama `field` yang dikirim ke form submit (seperti `nomorAlumni`, `prodi`, `angkatan`, `openToWork`, dll.) karena terhubung langsung ke skema Firestore.
- **JANGAN** menggunakan manipulasi DOM langsung (`document.getElementById`, `parent.appendChild`, atau event handler imperatif) yang melanggar siklus render React 19.
- **JANGAN** menginstal library UI raksasa yang tidak perlu. Gunakan **Tailwind CSS v4** dan **Lucide React** yang sudah terpasang.

---

## 🎨 WILAYAH KERJA UTAMA (UI / Frontend Focus)

Agent dipersilakan berkreasi dan memoles bagian-bagian berikut:

### 1. Komponen & Styling
- **`src/components/layout/`**: `Navbar.tsx`, `Footer.tsx` (desain navigasi, menu mobile, animasi dropdown, state active).
- **`src/components/profile/`**: `AlumniAvatar.tsx` (komponen avatar deklaratif), card showreel, badge status.
- **`src/components/ui/`**: Buat komponen baru modular jika diperlukan (e.g. `Modal.tsx`, `Button.tsx`, `Card.tsx`, `Skeleton.tsx`, `Badge.tsx`, `Tabs.tsx`).
- **`src/app/globals.css`**: Pengaturan tema Tailwind v4, custom utility classes, styling scrollbar, glassmorphism, animasi fade-in/scale.

### 2. Halaman-Halaman (Layout, Typography, & UX Flow)
- **`src/app/page.tsx`**: Landing page (Hero banner, statistik alumni, carousel/grid talenta showreel, call-to-action).
- **`src/app/open-to-work/page.tsx`**: Katalog talenta alumni (Card design, search bar, filter tabs prodi, responsive grid, empty state).
- **`src/app/lowongan/page.tsx`**: Bursa kerja (Card lowongan, detail pekerjaan, modal submit lamaran yang rapi & estetik).
- **`src/app/post-lowongan/page.tsx`**: Formulir pasang lowongan kerja (Form layout, label input, helper text, styling tombol).
- **`src/app/profil/page.tsx`**: Editor profil alumni (Avatar uploader visual, showreel gallery grid 2-kolom, form section cards).
- **`src/app/profil/[uid]/page.tsx`**: Halaman profil alumni publik (Portfolio view, link kontak, embed YouTube responsif).
- **`src/app/lamaran/page.tsx`**: Dashboard tracking pelamar & lamaran terkirim (Status badge aesthetic, table/card list, visual CTA).
- **`src/app/login/page.tsx` & `src/app/register/page.tsx`**: Tampilan autentikasi (Card form bersih, visual error alerts yang ramah, tombol aksi kontras).

---

## 🎯 PEDOMAN DESAIN (Design System Guidelines)

1. **Palet Warna STMM MMTC:**
   - **Background Utama:** Bersih & terang (`bg-white` / `bg-slate-50`).
   - **Warna Aksen:** MMTC Blue (`#0284c7` Sky-600, `#0369a1` Sky-700, `#024E82` MMTC Deep Blue).
   - **Teks:** Kontras tinggi dan mudah dibaca (`text-slate-900`, `text-slate-700`, secondary `text-slate-500`).
   - **Status Badge:** Emerald (Accepted/Open to Work), Amber (Pending/Review), Red (Expired/Rejected), Sky (Prodi Badge).
2. **Layout Portofolio / Showreel:**
   - Pertahankan susunan responsif **2 kolom** pada desktop untuk video YouTube embed dan portfolio cards agar tidak memanjang ke bawah sendirian.
3. **Responsivitas:**
   - Mobile-First design: wajib dites pada resolusi **Mobile (375px–420px)**, **Tablet (768px)**, dan **Desktop (1024px–1440px)**.
   - Hindari overflow horizontal (`overflow-x-hidden` jika diperlukan).
4. **Feedback & Loading States:**
   - Ganti spinner polos dengan **Skeleton UI** saat data sedang dimuat agar layout tidak jumping (Cumulative Layout Shift = 0).

---

## 🔄 WORKFLOW GIT (Ambil Repo, Branching, & Pull Request)

Collaborator & Agent WAJIB mengikuti alur Git berikut:

### 1. Setup Awal (Pilih Salah Satu Sesuai Hak Akses)

#### Opsi A: Jika Ditambahkan Sebagai Collaborator Repo
```bash
# 1. Clone repository
git clone https://github.com/farhanditof-max/WebsiteAlumniSTMM.git
cd WebsiteAlumniSTMM

# 2. Pastikan branch utama up-to-date
git checkout main
git pull origin main

# 3. Buat branch baru untuk fitur UI yang dikerjakan
# Format nama: feat/ui-<nama-fitur> atau fix/ui-<nama-fitur>
git checkout -b feat/ui-navbar-redesign
```

#### Opsi B: Jika Menggunakan Fork (External Contributor)
```bash
# 1. Fork repository di GitHub (https://github.com/farhanditof-max/WebsiteAlumniSTMM)
# 2. Clone fork lo
git clone https://github.com/<username-lo>/WebsiteAlumniSTMM.git
cd WebsiteAlumniSTMM

# 3. Hubungkan upstream repo asli
git remote add upstream https://github.com/farhanditof-max/WebsiteAlumniSTMM.git

# 4. Buat branch kerja
git checkout -b feat/ui-hero-banner
```

### 2. Persiapan Environment Lokal
```bash
# Install dependensi
npm install

# Buat file env lokal dari template
cp .env.example .env.local
# (Minta isi kredensial Firebase testing ke owner jika butuh preview data riil)

# Jalankan dev server
npm run dev
```

### 3. Checklist Verifikasi SEBELUM Commit / Push
Sebelum membuat commit, Agent **WAJIB** menjalankan 3 perintah ini dan memastikan **0 ERROR**:
```bash
# 1. Type check
npx tsc --noEmit

# 2. Linter check
npm run lint

# 3. Production build test (memastikan tidak ada SSR / hydration crash)
npm run build
```

### 4. Push & Buat Pull Request (PR)
```bash
# Stage & commit perubahan dengan pesan deskriptif
git add .
git commit -m "feat(ui): redesign card talenta open-to-work dan tambah skeleton loader"

# Push ke branch
git push origin feat/ui-<nama-fitur>

# Buka GitHub dan buat Pull Request ke branch `main` di repo utama:
# farhanditof-max/WebsiteAlumniSTMM (base: main) <- (compare: feat/ui-...)
```

> ⚠️ **PERINGATAN:** JANGAN PERNAH force push (`git push -f`) atau push langsung ke branch `main`! Selalu gunakan Pull Request agar perubahan UI bisa di-review bersama.

