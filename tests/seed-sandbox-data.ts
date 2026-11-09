/**
 * Sandbox & Staging Data Seeder for Strix Pentesting
 * Populates synthetic test personas into the Local Firebase Emulator
 *
 * Usage:
 *   npx firebase-tools emulators:exec --only firestore,auth "npm run seed:sandbox"
 */

import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";

const PROJECT_ID = "dashboard-alumni-mmtc-sandbox";

async function seedSandboxData() {
  const hostPort = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8088";
  const [host, portStr] = hostPort.split(":");
  const port = parseInt(portStr || "8088", 10);

  console.log(`Connecting test environment to Firestore Emulator (${host}:${port})...`);

  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: host || "127.0.0.1",
      port: port,
    },
  });

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    // 1. Data Master Alumni Registry (F-04, F-24)
    console.log("1. Seeding alumni_registry...");
    await setDoc(doc(db, "alumni_registry", "REGTEST001"), {
      nomorAlumni: "REGTEST001",
      namaLengkap: "Raden Mas Suryo",
      prodi: "Manajemen Produksi Siaran",
      angkatan: 2020,
      isRegistered: false,
      createdAt: new Date().toISOString(),
    });

    await setDoc(doc(db, "alumni_registry", "REGTEST002"), {
      nomorAlumni: "REGTEST002",
      namaLengkap: "Siti Rahmawati",
      prodi: "Animasi",
      angkatan: 2021,
      isRegistered: true,
      registeredUid: "user_victim_bob",
      createdAt: new Date().toISOString(),
    });

    await setDoc(doc(db, "alumni_registry", "REGTEST003"), {
      nomorAlumni: "REGTEST003",
      namaLengkap: "Dave Recruiter",
      prodi: "Teknologi Rekayasa Multimedia",
      angkatan: 2019,
      isRegistered: true,
      registeredUid: "user_recruiter_dave",
      createdAt: new Date().toISOString(),
    });

    await setDoc(doc(db, "alumni_registry", "REGTEST004"), {
      nomorAlumni: "REGTEST004",
      namaLengkap: "Alice Attacker",
      prodi: "Animasi",
      angkatan: 2022,
      isRegistered: true,
      registeredUid: "user_attacker_alice",
      createdAt: new Date().toISOString(),
    });

    // Seed official 12 STMM MMTC verified alumni
    const initialAlumni = [
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
    for (const a of initialAlumni) {
      await setDoc(doc(db, "alumni_registry", a.nomorAlumni), {
        nomorAlumni: a.nomorAlumni,
        namaLengkap: a.namaLengkap,
        prodi: a.prodi,
        angkatan: a.angkatan,
        isRegistered: false,
        createdAt: new Date().toISOString()
      });
    }

    // 2. Persona B (Victim Alumni: Bob - openToWork: false, Private PII)
    console.log("2. Seeding victim profile (Bob)...");
    await setDoc(doc(db, "users", "user_victim_bob"), {
      uid: "user_victim_bob",
      email: "bob@strix-sandbox.local",
      nomorHp: "081299998888", // PII Target!
      nomorAlumni: "REGTEST002",
      namaLengkap: "Siti Rahmawati",
      prodi: "Animasi",
      angkatan: 2021,
      role: "alumni",
      openToWork: false, // Menolak perekrutan / sembunyikan kontak
      cvUrl: "https://storage.googleapis.com/dashboard-alumni-mmtc.appspot.com/cv_documents/user_victim_bob/cv.pdf",
      portfolio: [
        {
          id: "port_bob_01",
          type: "youtube",
          title: "Showreel 3D",
          description: "Portofolio animasi 3D",
          url: "https://youtube.com/watch?v=sample"
        }
      ],
      createdAt: new Date().toISOString(),
    });

    // Mirrored public profile (whitelist only)
    await setDoc(doc(db, "public_profiles", "user_victim_bob"), {
      uid: "user_victim_bob",
      namaLengkap: "Siti Rahmawati",
      prodi: "Animasi",
      angkatan: 2021,
      openToWork: false,
      portfolio: [
        {
          id: "port_bob_01",
          type: "youtube",
          title: "Showreel 3D",
          description: "Portofolio animasi 3D",
          url: "https://youtube.com/watch?v=sample"
        }
      ],
    });

    // 3. Persona C (Job Poster / Recruiter: Dave)
    console.log("3. Seeding recruiter profile & sample job...");
    await setDoc(doc(db, "users", "user_recruiter_dave"), {
      uid: "user_recruiter_dave",
      email: "dave@mitra-studio.local",
      namaLengkap: "Dave Recruiter",
      role: "alumni",
      nomorAlumni: "REGTEST003",
      prodi: "Teknologi Rekayasa Multimedia",
      angkatan: 2019,
      openToWork: false,
      createdAt: new Date().toISOString(),
    });

    await setDoc(doc(db, "public_profiles", "user_recruiter_dave"), {
      uid: "user_recruiter_dave",
      namaLengkap: "Dave Recruiter",
      prodi: "Teknologi Rekayasa Multimedia",
      angkatan: 2019,
      openToWork: false,
      portfolio: [],
    });

    // Sample active job owned by Dave
    await setDoc(doc(db, "jobs", "job_animator_01"), {
      id: "job_animator_01",
      postedBy: "user_recruiter_dave",
      posterName: "Dave Recruiter",
      posterEmail: "dave@mitra-studio.local",
      judul: "Senior 3D Animator",
      perusahaan: "PT Animasi Nusantara",
      lokasi: "Yogyakarta",
      tipeKerja: "Full-time",
      deskripsi: "Mencari alumni jurusan Animasi MMTC untuk proyek serial televisi animasi.",
      kualifikasi: ["Blender", "Maya", "3D Rigging", "Min 1 tahun pengalaman"],
      prodiTarget: ["Animasi", "Teknologi Rekayasa Multimedia"],
      gajiRange: "Rp 6.000.000 - Rp 9.000.000",
      deadline: "2026-12-31",
      status: "active",
      createdAt: new Date().toISOString(),
    });

    // Sample application submitted by Bob to Dave's job
    await setDoc(doc(db, "applications", "job_animator_01_user_victim_bob"), {
      id: "job_animator_01_user_victim_bob",
      jobId: "job_animator_01",
      applicantUid: "user_victim_bob",
      applicantName: "Siti Rahmawati",
      applicantEmail: "bob@strix-sandbox.local",
      applicantProdi: "Animasi",
      posterUid: "user_recruiter_dave",
      status: "pending",
      pesan: "Halo Pak Dave, ini portofolio animasi saya.",
      cvUrl: "https://storage.googleapis.com/dashboard-alumni-mmtc.appspot.com/cv_documents/user_victim_bob/cv.pdf",
      appliedAt: new Date().toISOString(),
    });

    // 4. Persona A (Attacker Account: Alice)
    console.log("4. Seeding attacker profile (Alice)...");
    await setDoc(doc(db, "users", "user_attacker_alice"), {
      uid: "user_attacker_alice",
      email: "alice@hacker.local",
      namaLengkap: "Alice Attacker",
      nomorAlumni: "REGTEST004",
      prodi: "Animasi",
      angkatan: 2022,
      role: "alumni",
      openToWork: true,
      portfolio: [],
      createdAt: new Date().toISOString(),
    });

    await setDoc(doc(db, "public_profiles", "user_attacker_alice"), {
      uid: "user_attacker_alice",
      namaLengkap: "Alice Attacker",
      prodi: "Animasi",
      angkatan: 2022,
      openToWork: true,
      portfolio: [],
    });

    // 5. Contact Requests (Deterministic ID: requesterUid_targetUid)
    console.log("5. Seeding contact_requests scenarios (Approved & Rejected)...");
    // Scenario 1: Dave requested contact to Bob -> Bob APPROVED (includes disclosed contact details)
    await setDoc(doc(db, "contact_requests", "user_recruiter_dave_user_victim_bob"), {
      id: "user_recruiter_dave_user_victim_bob",
      requesterUid: "user_recruiter_dave",
      requesterName: "Dave Recruiter",
      requesterEmail: "dave@mitra-studio.local",
      targetUid: "user_victim_bob",
      targetName: "Siti Rahmawati",
      pesan: "Halo Siti, tertarik dengan showreel Anda untuk studio kami.",
      status: "approved",
      targetPhone: "081299998888", // Disclosed on approval
      targetEmail: "bob@strix-sandbox.local",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Scenario 2: Alice requested contact to Bob -> Bob REJECTED (anti-spam delete protection test)
    await setDoc(doc(db, "contact_requests", "user_attacker_alice_user_victim_bob"), {
      id: "user_attacker_alice_user_victim_bob",
      requesterUid: "user_attacker_alice",
      requesterName: "Alice Attacker",
      requesterEmail: "alice@hacker.local",
      targetUid: "user_victim_bob",
      targetName: "Siti Rahmawati",
      pesan: "Minta kontak dong.",
      status: "rejected",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 6. Community Feed Posts (5 Initial Curated Posts across MMTC Majors)
    console.log("6. Seeding feed_posts...");
    const curatedFeedPosts = [
      {
        id: "seed-post-01",
        authorUid: "user_seed_budi",
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
        likedBy: ["user_seed_siti", "user_seed_dimas"],
        commentsCount: 2,
        comments: [
          {
            id: "c1",
            authorUid: "user_seed_siti",
            authorName: "Siti Rahmawati",
            authorProdi: "Animasi",
            authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
            text: "Keren banget Mas Budi! Deformasi area bibir dan alis sangat natural. Pakai add-on khusus atau manual rig?",
            createdAt: "2026-10-24T10:15:00.000Z"
          },
          {
            id: "c2",
            authorUid: "user_seed_budi",
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
        authorUid: "user_seed_dimas",
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
        likedBy: ["user_seed_budi"],
        commentsCount: 1,
        comments: [
          {
            id: "c3",
            authorUid: "user_seed_dewi",
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
        authorUid: "user_seed_fajar",
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
        likedBy: ["user_seed_budi", "user_seed_siti", "user_seed_dimas"],
        commentsCount: 1,
        comments: [
          {
            id: "c4",
            authorUid: "user_seed_rian",
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
        authorUid: "user_seed_rian",
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
        likedBy: ["user_seed_fajar"],
        commentsCount: 1,
        comments: [
          {
            id: "c5",
            authorUid: "user_seed_kurniawan",
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
        authorUid: "user_seed_dewi",
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
        likedBy: ["user_seed_budi", "user_seed_fajar"],
        commentsCount: 0,
        comments: [],
        createdAt: "2026-10-26T09:00:00.000Z",
        updatedAt: "2026-10-26T09:00:00.000Z"
      }
    ];

    for (const post of curatedFeedPosts) {
      await setDoc(doc(db, "feed_posts", post.id), post);
    }
  });

  await testEnv.cleanup();
  console.log("✅ Synthetic test dataset successfully seeded into Firestore Emulator!");
}

seedSandboxData().catch((err) => {
  console.error("Error seeding sandbox data:", err);
  process.exit(1);
});
