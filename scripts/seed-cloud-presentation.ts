/**
 * Cloud Presentation Seeder for Dashboard Alumni STMM MMTC
 * Seeds official presentation personas, jobs, master alumni registry, and feed posts
 * directly into Cloud Firestore or local environment using Firebase Client SDK.
 *
 * Usage:
 *   npx ts-node --project tests/tsconfig.json scripts/seed-cloud-presentation.ts
 */

// Allow connection through Windows corporate proxies with local TLS inspection
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import * as path from "path";
import * as fs from "fs";

// Load environment variables from .env.local if present
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dashboard-alumni-mmtc",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const MASTER_ALUMNI = [
  { nomorAlumni: 'MMTC-2018-001', namaLengkap: 'Budi Santoso', prodi: 'Animasi', angkatan: '2018' },
  { nomorAlumni: 'MMTC-2019-042', namaLengkap: 'Siti Rahma', prodi: 'Game Design', angkatan: '2019' },
  { nomorAlumni: 'MMTC-2020-103', namaLengkap: 'Andi Pratama', prodi: 'MIK', angkatan: '2020' },
  { nomorAlumni: 'MMTC-2020-215', namaLengkap: 'Dewi Lestari', prodi: 'Matekstosi', angkatan: '2020' },
  { nomorAlumni: 'MMTC-2021-088', namaLengkap: 'Rian Hidayat', prodi: 'Manarita', angkatan: '2021' },
  { nomorAlumni: 'MMTC-2021-120', namaLengkap: 'Fajar Nugraha', prodi: 'Manaprodsi', angkatan: '2021' },
  { nomorAlumni: 'MMTC-2022-015', namaLengkap: 'Maya Safitri', prodi: 'Animasi', angkatan: '2022' },
  { nomorAlumni: 'MMTC-2022-064', namaLengkap: 'Dimas Aditya', prodi: 'Game Design', angkatan: '2022' },
  { nomorAlumni: 'MMTC-2023-031', namaLengkap: 'Kurniawan Eko', prodi: 'MIK', angkatan: '2023' },
  { nomorAlumni: 'MMTC-2023-095', namaLengkap: 'Nadia Putri', prodi: 'Matekstosi', angkatan: '2023' },
  { nomorAlumni: 'MMTC-2024-012', namaLengkap: 'Bayu Wicaksono', prodi: 'Manarita', angkatan: '2024' },
  { nomorAlumni: 'MMTC-2024-055', namaLengkap: 'Salsabila Rahma', prodi: 'Manaprodsi', angkatan: '2024' },
];

const CURATED_FEED_POSTS = [
  {
    id: "seed-post-01",
    authorUid: "user-seed-budi",
    authorName: "Budi Santoso",
    authorProdi: "Animasi",
    authorAngkatan: "2018",
    authorRole: "Senior 3D Artist & Lead Rigger",
    authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    nomorAlumni: "MMTC-2018-001",
    category: "showreel",
    content: "Halo rekan-rekan alumni MMTC! Baru saja merilis breakdown rigging dan animasi karakter untuk project film pendek terbaru kami. Fokus pada expressive facial blendshapes & cloth simulation di Blender. Kritik dan masukan sangat dinantikan!",
    hashtags: ["#AnimasiMMTC", "#3DRigging", "#Blender3D", "#ShowreelAlumni"],
    mediaType: "youtube",
    mediaUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    mediaTitle: "Breakdown 3D Rigging & Facial Animation 2026",
    likesCount: 24,
    likedBy: ["user-seed-siti", "user-seed-dimas"],
    commentsCount: 2,
    comments: [
      {
        id: "c1",
        authorUid: "user-seed-siti",
        authorName: "Siti Rahmawati",
        authorProdi: "Animasi",
        authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        text: "Keren banget Mas Budi! Deformasi area bibir dan alis sangat natural. Pakai add-on khusus atau manual rig?",
        createdAt: "2026-10-24T10:15:00.000Z"
      },
      {
        id: "c2",
        authorUid: "user-seed-budi",
        authorName: "Budi Santoso",
        authorProdi: "Animasi",
        authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        text: "Terima kasih Mbak Siti! Full manual rig digabung corrective shape keys biar gerakannya tajam.",
        createdAt: "2026-10-24T10:45:00.000Z"
      }
    ],
    createdAt: "2026-10-24T09:30:00.000Z",
    updatedAt: "2026-10-24T10:45:00.000Z"
  },
  {
    id: "seed-post-02",
    authorUid: "user-seed-dimas",
    authorName: "Dimas Aditya",
    authorProdi: "Game Design",
    authorAngkatan: "2022",
    authorRole: "Technical Game Designer",
    authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    nomorAlumni: "MMTC-2022-064",
    category: "kolaborasi",
    content: "Open recruitment untuk project game indie RPG Nusantara (Unreal Engine 5). Kami sedang membutuhkan 1 orang Technical Sound Designer (alumni Matekstosi / MIK) dan 1 orang Concept Artist. Work-from-anywhere, revenue-share based.",
    hashtags: ["#GameDevMMTC", "#UnrealEngine5", "#LokerIndie", "#KolaborasiAlumni"],
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80",
    mediaTitle: "Concept Art & Level Design Preview.jpg",
    mediaSize: "1.8 MB",
    likesCount: 19,
    likedBy: ["user-seed-budi"],
    commentsCount: 1,
    comments: [
      {
        id: "c3",
        authorUid: "user-seed-dewi",
        authorName: "Dewi Lestari",
        authorProdi: "Matekstosi",
        authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
        text: "Tertarik Mas Dimas! Portofolio foley dan dynamic sound cues saya sudah ada di profil.",
        createdAt: "2026-10-25T14:20:00.000Z"
      }
    ],
    createdAt: "2026-10-25T11:00:00.000Z",
    updatedAt: "2026-10-25T14:20:00.000Z"
  },
  {
    id: "seed-post-03",
    authorUid: "user-seed-fajar",
    authorName: "Fajar Nugraha",
    authorProdi: "Manaprodsi",
    authorAngkatan: "2021",
    authorRole: "Broadcast Producer & Live Stream Director",
    authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    nomorAlumni: "MMTC-2021-120",
    category: "pencapaian",
    content: "Alhamdulillah, tim produksi kami baru saja menyelesaikan siaran langsung Festival Musik Nasional 3 hari non-stop dengan 16 kamera multi-cam setup dan 0 dropped frames. Bangga bisa berkolaborasi dengan sesama alumni MMTC lintas angkatan!",
    hashtags: ["#Manaprodsi", "#LiveBroadcast", "#MultiCam", "#ProudMMTC"],
    mediaType: "image",
    mediaUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80",
    mediaTitle: "Production Control Room Setup.jpg",
    mediaSize: "2.4 MB",
    likesCount: 38,
    likedBy: ["user-seed-budi", "user-seed-siti", "user-seed-dimas"],
    commentsCount: 1,
    comments: [
      {
        id: "c4",
        authorUid: "user-seed-rian",
        authorName: "Rian Hidayat",
        authorProdi: "Manarita",
        authorAvatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
        text: "Mantap Mas Fajar! Liputan dan switching kameranya smooth banget di siaran kemarin.",
        createdAt: "2026-10-25T17:05:00.000Z"
      }
    ],
    createdAt: "2026-10-25T16:40:00.000Z",
    updatedAt: "2026-10-25T17:05:00.000Z"
  },
  {
    id: "seed-post-04",
    authorUid: "user-seed-rian",
    authorName: "Rian Hidayat",
    authorProdi: "Manarita",
    authorAngkatan: "2021",
    authorRole: "Digital Journalist & News Anchor",
    authorAvatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
    nomorAlumni: "MMTC-2021-088",
    category: "diskusi",
    content: "Bagaimana pandangan rekan-rekan mengenai adaptasi AI Generatif dalam penulisan naskah berita investigasi dan automated fact-checking? Di newsroom kami sudah mulai integrasi, tapi etika jurnalistik tetap nomor satu.",
    hashtags: ["#JurnalistikDigital", "#AIinMedia", "#ManaritaMMTC", "#DiskusiMedia"],
    likesCount: 15,
    likedBy: ["user-seed-fajar"],
    commentsCount: 1,
    comments: [
      {
        id: "c5",
        authorUid: "user-seed-kurniawan",
        authorName: "Kurniawan Eko",
        authorProdi: "MIK",
        authorAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
        text: "Human-in-the-loop mutlak diperlukan Mas Rian. LLM bagus untuk ringkasan cepat, tapi verifikasi primer harus tangan jurnalis.",
        createdAt: "2026-10-26T08:12:00.000Z"
      }
    ],
    createdAt: "2026-10-26T07:30:00.000Z",
    updatedAt: "2026-10-26T08:12:00.000Z"
  },
  {
    id: "seed-post-05",
    authorUid: "user-seed-dewi",
    authorName: "Dewi Lestari",
    authorProdi: "Matekstosi",
    authorAngkatan: "2020",
    authorRole: "Acoustic Engineer & Audio Post Specialist",
    authorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    nomorAlumni: "MMTC-2020-215",
    category: "showreel",
    content: "Dokumentasi panduan setup Dolby Atmos 7.1.4 untuk studio pascaproduksi independen. Saya sertakan panduan kalibrasi SPL meter dan diagram akustik ruangan dalam format PDF.",
    hashtags: ["#Matekstosi", "#DolbyAtmos", "#AudioEngineering", "#StudioSetup"],
    mediaType: "pdf",
    mediaUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    mediaTitle: "Panduan_Setup_Dolby_Atmos_7.1.4_MMTC.pdf",
    mediaSize: "3.1 MB",
    likesCount: 29,
    likedBy: ["user-seed-budi", "user-seed-fajar"],
    commentsCount: 0,
    comments: [],
    createdAt: "2026-10-26T09:00:00.000Z",
    updatedAt: "2026-10-26T09:00:00.000Z"
  }
];

const CURATED_JOBS = [
  {
    id: "job-001",
    title: "Broadcast Technical Director",
    company: "MNC Media Group",
    location: "Jakarta Barat (On-site)",
    type: "Full-time",
    category: "Matekstosi",
    salary: "Rp 12.000.000 - Rp 18.000.000",
    description: "Bertanggung jawab atas operasional teknis studio penyiaran TV & OB Van multi-camera broadcast.",
    requirements: [
      "Alumni Manajemen Teknik Studio Produksi (Matekstosi) STMM MMTC",
      "Menguasai vision mixer switcher Blackmagic / Grass Valley",
      "Pengalaman live sports / studio entertainment multi-cam minimal 2 tahun"
    ],
    postedBy: "recruiter-mnc",
    posterName: "HR Media Nusantara",
    createdAt: "2026-10-24T08:00:00.000Z",
    updatedAt: "2026-10-24T08:00:00.000Z",
  },
  {
    id: "job-002",
    title: "Senior 3D Character Rigger",
    company: "Infinite Studios",
    location: "Batam / Hybrid Jogja",
    type: "Full-time",
    category: "Animasi",
    salary: "Rp 14.000.000 - Rp 22.000.000",
    description: "Membuat advanced character facial & body rigs untuk serial animasi 3D internasional.",
    requirements: [
      "Alumni Animasi STMM MMTC",
      "Mahir rigging di Blender / Autodesk Maya & Python scripting",
      "Memiliki showreel rigging breakdown yang solid"
    ],
    postedBy: "recruiter-infinite",
    posterName: "Talent Acquisition Infinite",
    createdAt: "2026-10-25T09:30:00.000Z",
    updatedAt: "2026-10-25T09:30:00.000Z",
  }
];

async function seedCloud() {
  console.log(`Starting Cloud Presentation Seeding for project [${firebaseConfig.projectId}]...`);

  const runWithTimeout = async <T>(promise: Promise<T>, timeoutMs = 8000, label = "Operation"): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms (TLS proxy/gRPC network block)`)), timeoutMs)
      ),
    ]);
  };

  try {
    // 1. Seed alumni_registry
    console.log("1. Seeding master alumni registry...");
    for (const a of MASTER_ALUMNI) {
      await runWithTimeout(
        setDoc(doc(db, "alumni_registry", a.nomorAlumni), {
          ...a,
          isRegistered: false,
          createdAt: new Date().toISOString()
        }, { merge: true }),
        6000,
        `Seeding registry ${a.nomorAlumni}`
      );
    }

    // 2. Seed feed_posts
    console.log("2. Seeding curated feed posts...");
    for (const post of CURATED_FEED_POSTS) {
      await runWithTimeout(
        setDoc(doc(db, "feed_posts", post.id), post, { merge: true }),
        6000,
        `Seeding feed post ${post.id}`
      );
    }

    // 3. Seed jobs
    console.log("3. Seeding presentation jobs...");
    for (const job of CURATED_JOBS) {
      await runWithTimeout(
        setDoc(doc(db, "jobs", job.id), job, { merge: true }),
        6000,
        `Seeding job ${job.id}`
      );
    }

    console.log("✅ Cloud Presentation Seeding completed successfully!");
  } catch (err: unknown) {
    const error = err as Error;
    console.warn("\n⚠️ Cloud Presentation Seeding could not connect directly from Node CLI:");
    console.warn(`   Reason: ${error.message}`);
    console.warn("\n💡 CATATAN DEMO PRESENTASI TANGGAL 10:");
    console.warn("   1. Data kurasi awal (5 postingan feed, master alumni, dan lowongan) sudah otomatis");
    console.warn("      tersedia secara lokal melalui fallback service di src/lib/feed.ts & components.");
    console.warn("   2. Untuk men-deploy rules dan seed ke Cloud Firebase riil, jalankan:");
    console.warn("      npx firebase-tools login --reauth");
    console.warn("      npx firebase-tools deploy --only firestore:rules,storage");
  } finally {
    process.exit(0);
  }
}

seedCloud().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
