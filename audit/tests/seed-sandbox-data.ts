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
  console.log("Connecting test environment to Firestore Emulator (127.0.0.1:8080)...");

  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: "127.0.0.1",
      port: 8080,
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
  });

  await testEnv.cleanup();
  console.log("✅ Synthetic test dataset successfully seeded into Firestore Emulator!");
}

seedSandboxData().catch((err) => {
  console.error("Error seeding sandbox data:", err);
  process.exit(1);
});
