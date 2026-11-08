import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import * as fs from "fs";
import * as path from "path";
import { safeHttpUrl } from "../src/lib/media";

const PROJECT_ID = "dashboard-alumni-mmtc-strix-sandbox";

interface TestReportItem {
  id: string;
  control: string;
  title: string;
  findingCode: string;
  status: "PASS" | "FAIL";
  evidence: string;
}

const testResults: TestReportItem[] = [];

function recordResult(item: TestReportItem) {
  testResults.push(item);
  const statusIcon = item.status === "PASS" ? "✅ [PASS]" : "❌ [FAIL]";
  console.log(`  ${statusIcon} ${item.id}: ${item.title} (${item.findingCode})`);
  if (item.status === "FAIL") {
    console.log(`     Details: ${item.evidence}`);
  }
}

async function runStrixVerification() {
  console.log("===============================================================================");
  console.log("   STRIX DEFENSIVE SECURITY VERIFICATION & COMPLIANCE AUDIT");
  console.log("   Repository: dashboard-alumni-mmtc (branch: fix/security-audit-comprehensive-patches)");
  console.log("   Environment: Firebase Local Emulator (Firestore: 8080, Storage: 9199)");
  console.log("===============================================================================\n");

  const firestoreRulesPath = path.resolve(__dirname, "../firestore.rules");
  const storageRulesPath = path.resolve(__dirname, "../storage.rules");

  if (!fs.existsSync(firestoreRulesPath)) {
    throw new Error(`firestore.rules missing at ${firestoreRulesPath}`);
  }
  if (!fs.existsSync(storageRulesPath)) {
    throw new Error(`storage.rules missing at ${storageRulesPath}`);
  }

  const firestoreRules = fs.readFileSync(firestoreRulesPath, "utf8");
  const storageRules = fs.readFileSync(storageRulesPath, "utf8");

  const hostPort = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8088";
  const [host, portStr] = hostPort.split(":");
  const port = parseInt(portStr || "8088", 10);

  const storageHostPort = process.env.FIREBASE_STORAGE_EMULATOR_HOST || "127.0.0.1:9199";
  const [sHost, sPortStr] = storageHostPort.split(":");
  const sPort = parseInt(sPortStr || "9199", 10);

  console.log(`Initializing Rules Test Environment with live rules (Firestore: ${port}, Storage: ${sPort})...`);
  const testEnv: RulesTestEnvironment = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: firestoreRules,
      host: host || "127.0.0.1",
      port: port,
    },
    storage: {
      rules: storageRules,
      host: sHost || "127.0.0.1",
      port: sPort,
    },
  });

  try {
    // Reset databases to clean state
    await testEnv.clearFirestore();
    await testEnv.clearStorage();

    // -------------------------------------------------------------
    // SEED INITIAL DATASET FOR TESTING
    // -------------------------------------------------------------
    console.log("\n[SETUP] Seeding synthetic test personas & base data...");
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      // Master Alumni Registry
      await db.collection("alumni_registry").doc("REGTEST001").set({
        nomorAlumni: "REGTEST001",
        namaLengkap: "Raden Mas Suryo",
        prodi: "Manajemen Produksi Siaran",
        angkatan: 2020,
        isRegistered: false,
        createdAt: new Date().toISOString(),
      });

      await db.collection("alumni_registry").doc("REGTEST002").set({
        nomorAlumni: "REGTEST002",
        namaLengkap: "Siti Rahmawati",
        prodi: "Animasi",
        angkatan: 2021,
        isRegistered: true,
        registeredUid: "user_victim_bob",
        createdAt: new Date().toISOString(),
      });

      await db.collection("alumni_registry").doc("REGTEST003").set({
        nomorAlumni: "REGTEST003",
        namaLengkap: "Dave Recruiter",
        prodi: "Teknologi Rekayasa Multimedia",
        angkatan: 2019,
        isRegistered: true,
        registeredUid: "user_recruiter_dave",
        createdAt: new Date().toISOString(),
      });

      await db.collection("alumni_registry").doc("REGTEST004").set({
        nomorAlumni: "REGTEST004",
        namaLengkap: "Alice Attacker",
        prodi: "Animasi",
        angkatan: 2022,
        isRegistered: true,
        registeredUid: "user_attacker_alice",
        createdAt: new Date().toISOString(),
      });

      // Users: Bob (Victim) with private PII & CV
      await db.collection("users").doc("user_victim_bob").set({
        uid: "user_victim_bob",
        email: "bob@strix-sandbox.local",
        nomorHp: "081299998888", // Private PII
        nomorAlumni: "REGTEST002",
        namaLengkap: "Siti Rahmawati",
        prodi: "Animasi",
        angkatan: 2021,
        role: "alumni",
        openToWork: false,
        cvUrl: "https://storage.googleapis.com/dashboard-alumni-mmtc.appspot.com/cv_documents/user_victim_bob/cv.pdf",
        portfolio: [
          {
            id: "port_bob_01",
            type: "youtube",
            title: "Showreel 3D",
            description: "Portofolio animasi 3D",
            url: "https://youtube.com/watch?v=sample",
          },
        ],
        createdAt: new Date().toISOString(),
      });

      // Public profile for Bob (stripped of PII)
      await db.collection("public_profiles").doc("user_victim_bob").set({
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
            url: "https://youtube.com/watch?v=sample",
          },
        ],
      });

      // Recruiter Dave
      await db.collection("users").doc("user_recruiter_dave").set({
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

      // Active Job posted by Dave
      await db.collection("jobs").doc("job_animator_01").set({
        id: "job_animator_01",
        postedBy: "user_recruiter_dave",
        posterName: "Dave Recruiter",
        posterEmail: "dave@mitra-studio.local",
        judul: "Senior 3D Animator",
        perusahaan: "PT Animasi Nusantara",
        lokasi: "Yogyakarta",
        tipeKerja: "Full-time",
        deskripsi: "Mencari alumni jurusan Animasi MMTC untuk proyek serial televisi animasi.",
        kualifikasi: ["Blender", "Maya", "3D Rigging"],
        prodiTarget: ["Animasi", "Teknologi Rekayasa Multimedia"],
        deadline: "2026-12-31",
        status: "active",
        createdAt: new Date().toISOString(),
      });

      // Application submitted by Bob to Dave's job
      await db.collection("applications").doc("job_animator_01_user_victim_bob").set({
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

      // Attacker Alice (already exists in registry)
      await db.collection("users").doc("user_attacker_alice").set({
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

      // Contact Request: Dave -> Bob (Approved)
      await db.collection("contact_requests").doc("user_recruiter_dave_user_victim_bob").set({
        id: "user_recruiter_dave_user_victim_bob",
        requesterUid: "user_recruiter_dave",
        requesterName: "Dave Recruiter",
        requesterEmail: "dave@mitra-studio.local",
        targetUid: "user_victim_bob",
        targetName: "Siti Rahmawati",
        pesan: "Halo Siti, tertarik dengan showreel Anda untuk studio kami.",
        status: "approved",
        targetPhone: "081299998888",
        targetEmail: "bob@strix-sandbox.local",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Contact Request: Alice -> Bob (Rejected - anti-spam test target)
      await db.collection("contact_requests").doc("user_attacker_alice_user_victim_bob").set({
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

      // Upload baseline CV file for Bob to Storage
      const bobStorage = context.storage().ref("cv_documents/user_victim_bob/cv.pdf");
      await Promise.resolve(
        bobStorage.put(Buffer.from("%PDF-1.4 dummy pdf content for bob cv"), {
          contentType: "application/pdf",
        })
      );

      // Upload baseline avatar for Alice
      const aliceAvatar = context.storage().ref("avatars/user_attacker_alice/avatar.jpg");
      await Promise.resolve(
        aliceAvatar.put(Buffer.from("fake-jpeg-data"), {
          contentType: "image/jpeg",
        })
      );
    });

    console.log("Seeding complete. Executing 7 Security Controls Verification Suite...\n");

    // =========================================================================
    // KONTROL 1: Penegakan Otorisasi Role Admin (Vertical Escalation Prevention)
    // =========================================================================
    console.log("--- KONTROL 1: Otorisasi Role Admin & Pencegahan Eskalasi Hak Akses ---");
    {
      const aliceContext = testEnv.authenticatedContext("user_attacker_alice");
      const unauthContext = testEnv.unauthenticatedContext();
      const adminContext = testEnv.authenticatedContext("admin_officer", { admin: true });

      // 1.1 Alice tries to self-elevate to admin via update
      try {
        await assertFails(
          aliceContext.firestore().collection("users").doc("user_attacker_alice").update({
            role: "admin",
          })
        );
        recordResult({
          id: "SEC-CTL-01.1",
          control: "Kontrol 1: Otorisasi Role Admin",
          title: "Pengguna biasa dilarang meng-update role menjadi 'admin' pada dokumen sendiri",
          findingCode: "F-01",
          status: "PASS",
          evidence: "Request ditolak permission-denied oleh locked(['role']).",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-01.1",
          control: "Kontrol 1: Otorisasi Role Admin",
          title: "Pengguna biasa dilarang meng-update role menjadi 'admin' pada dokumen sendiri",
          findingCode: "F-01",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 1.2 Alice tries to create another document or overwrite with role: 'admin'
      try {
        const dummyNewUser = testEnv.authenticatedContext("user_newbie");
        await assertFails(
          dummyNewUser.firestore().collection("users").doc("user_newbie").set({
            uid: "user_newbie",
            namaLengkap: "New Admin",
            nomorAlumni: "REGTEST001",
            role: "admin",
          })
        );
        recordResult({
          id: "SEC-CTL-01.2",
          control: "Kontrol 1: Otorisasi Role Admin",
          title: "Pembuatan akun baru dengan payload role: 'admin' secara langsung ditolak",
          findingCode: "F-01",
          status: "PASS",
          evidence: "Rules memeriksa request.resource.data.role != 'admin' saat create.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-01.2",
          control: "Kontrol 1: Otorisasi Role Admin",
          title: "Pembuatan akun baru dengan payload role: 'admin' secara langsung ditolak",
          findingCode: "F-01",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 1.3 Alice attempts to delete her user document directly
      try {
        await assertFails(
          aliceContext.firestore().collection("users").doc("user_attacker_alice").delete()
        );
        recordResult({
          id: "SEC-CTL-01.3",
          control: "Kontrol 1: Otorisasi Role Admin",
          title: "Pengguna non-admin dilarang menghapus akun langsung dari client (delete users/{uid})",
          findingCode: "F-22",
          status: "PASS",
          evidence: "allow delete: if isAdmin() memblokir aksi hapus non-admin.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-01.3",
          control: "Kontrol 1: Otorisasi Role Admin",
          title: "Pengguna non-admin dilarang menghapus akun langsung dari client (delete users/{uid})",
          findingCode: "F-22",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 1.4 Admin role via custom claim successfully executes privileged actions
      try {
        await assertSucceeds(
          adminContext.firestore().collection("users").doc("user_attacker_alice").update({
            catatanAdmin: "Akun diverifikasi institusi",
          })
        );
        recordResult({
          id: "SEC-CTL-01.4",
          control: "Kontrol 1: Otorisasi Role Admin",
          title: "Admin resmi (token.admin == true) berhasil melakukan administrasi pada profil alumni",
          findingCode: "F-01",
          status: "PASS",
          evidence: "isAdmin() mengizinkan bypass field lock dan update administratif.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-01.4",
          control: "Kontrol 1: Otorisasi Role Admin",
          title: "Admin resmi (token.admin == true) berhasil melakukan administrasi pada profil alumni",
          findingCode: "F-01",
          status: "FAIL",
          evidence: err.message,
        });
      }
    }

    // =========================================================================
    // KONTROL 2: Perlindungan Kerahasiaan PII Dokumen Privat users/{uid}
    // =========================================================================
    console.log("\n--- KONTROL 2: Perlindungan Kerahasiaan PII & Isolasi Data Privat ---");
    {
      const aliceContext = testEnv.authenticatedContext("user_attacker_alice");
      const unauthContext = testEnv.unauthenticatedContext();
      const bobContext = testEnv.authenticatedContext("user_victim_bob");
      const adminContext = testEnv.authenticatedContext("admin_officer", { admin: true });

      // 2.1 Alice attempts to read Bob's private user document (Contains nomorHp, private email, cvUrl)
      try {
        await assertFails(
          aliceContext.firestore().collection("users").doc("user_victim_bob").get()
        );
        recordResult({
          id: "SEC-CTL-02.1",
          control: "Kontrol 2: Kerahasiaan PII",
          title: "Penyerang (Alice) ditolak saat mencoba membaca dokumen privat korban (Bob)",
          findingCode: "F-02, F-25",
          status: "PASS",
          evidence: "isOwner(userId) || isAdmin() menolak pembacaan users/user_victim_bob oleh user_attacker_alice.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-02.1",
          control: "Kontrol 2: Kerahasiaan PII",
          title: "Penyerang (Alice) ditolak saat mencoba membaca dokumen privat korban (Bob)",
          findingCode: "F-02, F-25",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 2.2 Unauthenticated user attempts to read Bob's private document
      try {
        await assertFails(
          unauthContext.firestore().collection("users").doc("user_victim_bob").get()
        );
        recordResult({
          id: "SEC-CTL-02.2",
          control: "Kontrol 2: Kerahasiaan PII",
          title: "Pengguna anonim/unauthenticated dilarang mengakses dokumen users/{uid}",
          findingCode: "F-02",
          status: "PASS",
          evidence: "Pengguna tanpa autentikasi menerima permission-denied.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-02.2",
          control: "Kontrol 2: Kerahasiaan PII",
          title: "Pengguna anonim/unauthenticated dilarang mengakses dokumen users/{uid}",
          findingCode: "F-02",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 2.3 Bob can read his own document
      try {
        await assertSucceeds(
          bobContext.firestore().collection("users").doc("user_victim_bob").get()
        );
        recordResult({
          id: "SEC-CTL-02.3",
          control: "Kontrol 2: Kerahasiaan PII",
          title: "Pemilik sah (Bob) dapat membaca dokumen profil privat miliknya",
          findingCode: "F-02",
          status: "PASS",
          evidence: "isOwner(userId) mengevaluasi true dan mengizinkan get().",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-02.3",
          control: "Kontrol 2: Kerahasiaan PII",
          title: "Pemilik sah (Bob) dapat membaca dokumen profil privat miliknya",
          findingCode: "F-02",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 2.4 Public profile mirror is readable by unauthenticated users (whitelist projection)
      try {
        await assertSucceeds(
          unauthContext.firestore().collection("public_profiles").doc("user_victim_bob").get()
        );
        recordResult({
          id: "SEC-CTL-02.4",
          control: "Kontrol 2: Kerahasiaan PII",
          title: "Koleksi public_profiles (whitelist tanpa nomor HP/CV) dapat dibaca publik",
          findingCode: "F-02",
          status: "PASS",
          evidence: "allow read: if true pada public_profiles/{userId} berhasil.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-02.4",
          control: "Kontrol 2: Kerahasiaan PII",
          title: "Koleksi public_profiles (whitelist tanpa nomor HP/CV) dapat dibaca publik",
          findingCode: "F-02",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 2.5 Non-admin cannot write to public_profiles
      try {
        await assertFails(
          aliceContext.firestore().collection("public_profiles").doc("user_victim_bob").set({
            namaLengkap: "Bob Hacked",
          })
        );
        recordResult({
          id: "SEC-CTL-02.5",
          control: "Kontrol 2: Kerahasiaan PII",
          title: "Pengguna biasa dilarang memodifikasi public_profiles (hanya Admin/Cloud Functions)",
          findingCode: "F-02",
          status: "PASS",
          evidence: "allow write: if isAdmin() mencegah modifikasi publik oleh sembarang user.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-02.5",
          control: "Kontrol 2: Kerahasiaan PII",
          title: "Pengguna biasa dilarang memodifikasi public_profiles (hanya Admin/Cloud Functions)",
          findingCode: "F-02",
          status: "FAIL",
          evidence: err.message,
        });
      }
    }

    // =========================================================================
    // KONTROL 3: Isolasi Data Lamaran Pekerjaan (BOLA/IDOR Protection)
    // =========================================================================
    console.log("\n--- KONTROL 3: Isolasi Data Lamaran Pekerjaan (Anti BOLA/IDOR) ---");
    {
      const aliceContext = testEnv.authenticatedContext("user_attacker_alice");
      const bobContext = testEnv.authenticatedContext("user_victim_bob");
      const daveContext = testEnv.authenticatedContext("user_recruiter_dave");

      // 3.1 Alice tries to read Bob's job application (BOLA/IDOR attempt)
      try {
        await assertFails(
          aliceContext
            .firestore()
            .collection("applications")
            .doc("job_animator_01_user_victim_bob")
            .get()
        );
        recordResult({
          id: "SEC-CTL-03.1",
          control: "Kontrol 3: BOLA/IDOR Lamaran",
          title: "Pihak ketiga (Alice) ditolak saat mencoba membaca lamaran milik Bob (BOLA)",
          findingCode: "F-06",
          status: "PASS",
          evidence: "Rules membatasi read hanya pada applicantUid, posterUid, atau admin.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-03.1",
          control: "Kontrol 3: BOLA/IDOR Lamaran",
          title: "Pihak ketiga (Alice) ditolak saat mencoba membaca lamaran milik Bob (BOLA)",
          findingCode: "F-06",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 3.2 Bob (applicant) reads his own application
      try {
        await assertSucceeds(
          bobContext
            .firestore()
            .collection("applications")
            .doc("job_animator_01_user_victim_bob")
            .get()
        );
        recordResult({
          id: "SEC-CTL-03.2",
          control: "Kontrol 3: BOLA/IDOR Lamaran",
          title: "Pelamar sah (Bob) berhasil membaca dokumen lamarannya sendiri",
          findingCode: "F-06",
          status: "PASS",
          evidence: "resource.data.applicantUid == request.auth.uid memberikan izin baca.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-03.2",
          control: "Kontrol 3: BOLA/IDOR Lamaran",
          title: "Pelamar sah (Bob) berhasil membaca dokumen lamarannya sendiri",
          findingCode: "F-06",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 3.3 Dave (job poster) reads application submitted to his job
      try {
        await assertSucceeds(
          daveContext
            .firestore()
            .collection("applications")
            .doc("job_animator_01_user_victim_bob")
            .get()
        );
        recordResult({
          id: "SEC-CTL-03.3",
          control: "Kontrol 3: BOLA/IDOR Lamaran",
          title: "Pemilik lowongan (Dave) berhasil membaca lamaran yang masuk ke lowongannya",
          findingCode: "F-06",
          status: "PASS",
          evidence: "resource.data.posterUid == request.auth.uid memberikan izin baca ke job owner.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-03.3",
          control: "Kontrol 3: BOLA/IDOR Lamaran",
          title: "Pemilik lowongan (Dave) berhasil membaca lamaran yang masuk ke lowongannya",
          findingCode: "F-06",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 3.4 Alice attempts to modify Bob's application
      try {
        await assertFails(
          aliceContext
            .firestore()
            .collection("applications")
            .doc("job_animator_01_user_victim_bob")
            .update({
              status: "rejected",
            })
        );
        recordResult({
          id: "SEC-CTL-03.4",
          control: "Kontrol 3: BOLA/IDOR Lamaran",
          title: "Pihak ketiga (Alice) ditolak saat memodifikasi status lamaran korban",
          findingCode: "F-06",
          status: "PASS",
          evidence: "Alice bukan posterUid maupun admin sehingga update ditolak.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-03.4",
          control: "Kontrol 3: BOLA/IDOR Lamaran",
          title: "Pihak ketiga (Alice) ditolak saat memodifikasi status lamaran korban",
          findingCode: "F-06",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 3.5 Poster (Dave) attempts to tamper with applicant message/CV
      try {
        await assertFails(
          daveContext
            .firestore()
            .collection("applications")
            .doc("job_animator_01_user_victim_bob")
            .update({
              status: "reviewed",
              pesan: "Pesan telah dimodifikasi oleh recruiter",
            })
        );
        recordResult({
          id: "SEC-CTL-03.5",
          control: "Kontrol 3: BOLA/IDOR Lamaran",
          title: "Pemilik lowongan dilarang memanipulasi pesan/CV pelamar saat update status",
          findingCode: "F-06, F-22",
          status: "PASS",
          evidence: "affectedKeys().hasOnly(['status', 'updatedAt']) menolak tampering isi lamaran.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-03.5",
          control: "Kontrol 3: BOLA/IDOR Lamaran",
          title: "Pemilik lowongan dilarang memanipulasi pesan/CV pelamar saat update status",
          findingCode: "F-06, F-22",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 3.6 Poster (Dave) updates only status enum
      try {
        await assertSucceeds(
          daveContext
            .firestore()
            .collection("applications")
            .doc("job_animator_01_user_victim_bob")
            .update({
              status: "reviewed",
            })
        );
        recordResult({
          id: "SEC-CTL-03.6",
          control: "Kontrol 3: BOLA/IDOR Lamaran",
          title: "Pemilik lowongan diizinkan memperbarui status lamaran ke nilai enum yang sah ('reviewed')",
          findingCode: "F-06",
          status: "PASS",
          evidence: "Update dengan status enum yang sah ('reviewed') berhasil dieksekusi.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-03.6",
          control: "Kontrol 3: BOLA/IDOR Lamaran",
          title: "Pemilik lowongan diizinkan memperbarui status lamaran ke nilai enum yang sah ('reviewed')",
          findingCode: "F-06",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 3.7 Non-deterministic document ID injection attempt
      try {
        await assertFails(
          aliceContext
            .firestore()
            .collection("applications")
            .doc("random_spoofed_app_id")
            .set({
              jobId: "job_animator_01",
              applicantUid: "user_attacker_alice",
              status: "pending",
              pesan: "Lamaran dengan ID sembarang",
            })
        );
        recordResult({
          id: "SEC-CTL-03.7",
          control: "Kontrol 3: BOLA/IDOR Lamaran",
          title: "Pengajuan lamaran dengan Document ID acak/non-deterministik ditolak oleh Rules",
          findingCode: "F-06, F-21",
          status: "PASS",
          evidence: "applicationId == jobId + '_' + request.auth.uid menolak ID selain pola deterministik.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-03.7",
          control: "Kontrol 3: BOLA/IDOR Lamaran",
          title: "Pengajuan lamaran dengan Document ID acak/non-deterministik ditolak oleh Rules",
          findingCode: "F-06, F-21",
          status: "FAIL",
          evidence: err.message,
        });
      }
    }

    // =========================================================================
    // KONTROL 4: Validasi Integritas Nomor Alumni terhadap Master Registry
    // =========================================================================
    console.log("\n--- KONTROL 4: Validasi Nomor Alumni terhadap Database Master (Anti-Spoofing) ---");
    {
      const aliceContext = testEnv.authenticatedContext("user_attacker_alice");

      // 4.1 Create user with fake non-existent nomorAlumni
      try {
        const fakeUserContext = testEnv.authenticatedContext("user_fake_01");
        await assertFails(
          fakeUserContext.firestore().collection("users").doc("user_fake_01").set({
            uid: "user_fake_01",
            namaLengkap: "Fake Alumni",
            nomorAlumni: "REG_TIDAK_TERDAFTAR_999",
            prodi: "Animasi",
            angkatan: 2021,
          })
        );
        recordResult({
          id: "SEC-CTL-04.1",
          control: "Kontrol 4: Integritas Nomor Alumni",
          title: "Pendaftaran user baru dengan nomor alumni palsu (tidak ada di alumni_registry) ditolak",
          findingCode: "F-04, F2-02",
          status: "PASS",
          evidence: "exists(/databases/$(database)/documents/alumni_registry/...) gagal verifikasi.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-04.1",
          control: "Kontrol 4: Integritas Nomor Alumni",
          title: "Pendaftaran user baru dengan nomor alumni palsu (tidak ada di alumni_registry) ditolak",
          findingCode: "F-04, F2-02",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 4.2 Create user stealing already registered nomorAlumni (Bob's REGTEST002)
      try {
        const impersonatorContext = testEnv.authenticatedContext("user_impersonator");
        await assertFails(
          impersonatorContext.firestore().collection("users").doc("user_impersonator").set({
            uid: "user_impersonator",
            namaLengkap: "Impersonator Bob",
            nomorAlumni: "REGTEST002", // Already registered to user_victim_bob
            prodi: "Animasi",
            angkatan: 2021,
          })
        );
        recordResult({
          id: "SEC-CTL-04.2",
          control: "Kontrol 4: Integritas Nomor Alumni",
          title: "Pendaftaran user baru membajak nomor alumni yang sudah terdaftar ke akun lain ditolak",
          findingCode: "F-04, F2-02",
          status: "PASS",
          evidence: "alumni_registry.registeredUid == userId memblokir pendaftaran akun kembar/pembajak.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-04.2",
          control: "Kontrol 4: Integritas Nomor Alumni",
          title: "Pendaftaran user baru membajak nomor alumni yang sudah terdaftar ke akun lain ditolak",
          findingCode: "F-04, F2-02",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 4.3 Tampering permanent identity fields (nomorAlumni / prodi / angkatan) on update
      try {
        await assertFails(
          aliceContext.firestore().collection("users").doc("user_attacker_alice").update({
            nomorAlumni: "REGTEST001",
          })
        );
        recordResult({
          id: "SEC-CTL-04.3",
          control: "Kontrol 4: Integritas Nomor Alumni",
          title: "Pengguna dilarang mengubah nomorAlumni permanen pada profil yang telah aktif",
          findingCode: "F-08, F-24",
          status: "PASS",
          evidence: "locked(['nomorAlumni']) memblokir manipulasi nomor alumni.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-04.3",
          control: "Kontrol 4: Integritas Nomor Alumni",
          title: "Pengguna dilarang mengubah nomorAlumni permanen pada profil yang telah aktif",
          findingCode: "F-08, F-24",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 4.4 Non-admin modifying master alumni_registry
      try {
        await assertFails(
          aliceContext.firestore().collection("alumni_registry").doc("REGTEST001").set({
            nomorAlumni: "REGTEST001",
            namaLengkap: "Altered by Alice",
            isRegistered: true,
          })
        );
        recordResult({
          id: "SEC-CTL-04.4",
          control: "Kontrol 4: Integritas Nomor Alumni",
          title: "Pengguna biasa ditolak saat mencoba menulis/mengubah data master di alumni_registry",
          findingCode: "F-04",
          status: "PASS",
          evidence: "allow create, delete: if isAdmin() melindungi master alumni_registry.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-04.4",
          control: "Kontrol 4: Integritas Nomor Alumni",
          title: "Pengguna biasa ditolak saat mencoba menulis/mengubah data master di alumni_registry",
          findingCode: "F-04",
          status: "FAIL",
          evidence: err.message,
        });
      }
    }

    // =========================================================================
    // KONTROL 5: Pembatasan Penghapusan Dokumen Hanya pada Status Pending
    // =========================================================================
    console.log("\n--- KONTROL 5: Pembatasan Penghapusan Dokumen (Anti-Spam & Status Lock) ---");
    {
      const aliceContext = testEnv.authenticatedContext("user_attacker_alice");
      const daveContext = testEnv.authenticatedContext("user_recruiter_dave");
      const bobContext = testEnv.authenticatedContext("user_victim_bob");

      // 5.1 Alice attempts to delete rejected contact request (Anti-Spam Rejection Bypass)
      try {
        await assertFails(
          aliceContext
            .firestore()
            .collection("contact_requests")
            .doc("user_attacker_alice_user_victim_bob")
            .delete()
        );
        recordResult({
          id: "SEC-CTL-05.1",
          control: "Kontrol 5: Anti-Spam Deletion",
          title: "Pengirim dilarang menghapus contact_requests yang berstatus 'rejected' (mencegah spam ulang)",
          findingCode: "F4-02, F-10",
          status: "PASS",
          evidence: "resource.data.status == 'pending' memblokir penghapusan dokumen yang telah ditolak.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-05.1",
          control: "Kontrol 5: Anti-Spam Deletion",
          title: "Pengirim dilarang menghapus contact_requests yang berstatus 'rejected' (mencegah spam ulang)",
          findingCode: "F4-02, F-10",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 5.2 Dave attempts to delete approved contact request
      try {
        await assertFails(
          daveContext
            .firestore()
            .collection("contact_requests")
            .doc("user_recruiter_dave_user_victim_bob")
            .delete()
        );
        recordResult({
          id: "SEC-CTL-05.2",
          control: "Kontrol 5: Anti-Spam Deletion",
          title: "Pengguna dilarang menghapus contact_requests yang berstatus 'approved'",
          findingCode: "F4-02",
          status: "PASS",
          evidence: "resource.data.status == 'pending' memblokir penghapusan dokumen kontak yang disetujui.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-05.2",
          control: "Kontrol 5: Anti-Spam Deletion",
          title: "Pengguna dilarang menghapus contact_requests yang berstatus 'approved'",
          findingCode: "F4-02",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 5.3 Requester deletes a contact request while still in 'pending' status
      try {
        // Create a temporary pending contact request
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
          await ctx.firestore().collection("contact_requests").doc("user_attacker_alice_temp_pending").set({
            id: "user_attacker_alice_temp_pending",
            requesterUid: "user_attacker_alice",
            targetUid: "temp_target",
            status: "pending",
            message: "Temporary pending request",
          });
        });

        await assertSucceeds(
          aliceContext
            .firestore()
            .collection("contact_requests")
            .doc("user_attacker_alice_temp_pending")
            .delete()
        );
        recordResult({
          id: "SEC-CTL-05.3",
          control: "Kontrol 5: Anti-Spam Deletion",
          title: "Pengirim diizinkan membatalkan/menghapus contact_requests jika status masih 'pending'",
          findingCode: "F4-02",
          status: "PASS",
          evidence: "resource.data.status == 'pending' mengizinkan pembatalan oleh pemilik.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-05.3",
          control: "Kontrol 5: Anti-Spam Deletion",
          title: "Pengirim diizinkan membatalkan/menghapus contact_requests jika status masih 'pending'",
          findingCode: "F4-02",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 5.4 Applicant cannot delete application after recruiter changes status to reviewed/accepted/rejected
      try {
        // Update Bob's application status to reviewed first
        await testEnv.withSecurityRulesDisabled(async (ctx) => {
          await ctx.firestore().collection("applications").doc("job_animator_01_user_victim_bob").update({
            status: "reviewed",
          });
        });

        await assertFails(
          bobContext
            .firestore()
            .collection("applications")
            .doc("job_animator_01_user_victim_bob")
            .delete()
        );
        recordResult({
          id: "SEC-CTL-05.4",
          control: "Kontrol 5: Anti-Spam Deletion",
          title: "Pelamar dilarang menghapus berkas lamaran setelah status diubah dari 'pending'",
          findingCode: "F-06, F4-02",
          status: "PASS",
          evidence: "allow delete: if status == 'pending' menjaga integritas jejak rekrutmen.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-05.4",
          control: "Kontrol 5: Anti-Spam Deletion",
          title: "Pelamar dilarang menghapus berkas lamaran setelah status diubah dari 'pending'",
          findingCode: "F-06, F4-02",
          status: "FAIL",
          evidence: err.message,
        });
      }
    }

    // =========================================================================
    // KONTROL 6: Kebijakan Akses Berkas Resume CV pada Cloud Storage
    // =========================================================================
    console.log("\n--- KONTROL 6: Kebijakan Akses Berkas Resume CV & Avatar di Cloud Storage ---");
    {
      const aliceContext = testEnv.authenticatedContext("user_attacker_alice");
      const bobContext = testEnv.authenticatedContext("user_victim_bob");
      const unauthContext = testEnv.unauthenticatedContext();
      const adminContext = testEnv.authenticatedContext("admin_officer", { admin: true });

      // 6.1 Alice attempts to read/download Bob's CV (BOLA on storage)
      try {
        const bobCvRef = aliceContext.storage().ref("cv_documents/user_victim_bob/cv.pdf");
        await assertFails(bobCvRef.getDownloadURL());
        recordResult({
          id: "SEC-CTL-06.1",
          control: "Kontrol 6: Akses Berkas Storage CV",
          title: "Pihak ketiga (Alice) ditolak saat mencoba mengunduh dokumen CV privat milik Bob",
          findingCode: "F-03, F2-04",
          status: "PASS",
          evidence: "Storage rules cv_documents/{userId}/{fileName} membatasi read ke isOwner(userId) || isAdmin().",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-06.1",
          control: "Kontrol 6: Akses Berkas Storage CV",
          title: "Pihak ketiga (Alice) ditolak saat mencoba mengunduh dokumen CV privat milik Bob",
          findingCode: "F-03, F2-04",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 6.2 Unauthenticated user attempts to download Bob's CV
      try {
        const bobCvRef = unauthContext.storage().ref("cv_documents/user_victim_bob/cv.pdf");
        await assertFails(bobCvRef.getDownloadURL());
        recordResult({
          id: "SEC-CTL-06.2",
          control: "Kontrol 6: Akses Berkas Storage CV",
          title: "Pengguna anonim ditolak saat mencoba mengunduh dokumen CV privat",
          findingCode: "F-03",
          status: "PASS",
          evidence: "Unauthenticated context menerima permission-denied saat getDownloadURL.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-06.2",
          control: "Kontrol 6: Akses Berkas Storage CV",
          title: "Pengguna anonim ditolak saat mencoba mengunduh dokumen CV privat",
          findingCode: "F-03",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 6.3 Bob reads his own CV
      try {
        const bobCvRef = bobContext.storage().ref("cv_documents/user_victim_bob/cv.pdf");
        await assertSucceeds(bobCvRef.getDownloadURL());
        recordResult({
          id: "SEC-CTL-06.3",
          control: "Kontrol 6: Akses Berkas Storage CV",
          title: "Pemilik sah (Bob) berhasil mendapatkan akses download URL untuk CV miliknya",
          findingCode: "F-03",
          status: "PASS",
          evidence: "isOwner(userId) mengevaluasi true pada storage rules.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-06.3",
          control: "Kontrol 6: Akses Berkas Storage CV",
          title: "Pemilik sah (Bob) berhasil mendapatkan akses download URL untuk CV miliknya",
          findingCode: "F-03",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 6.4 Admin reads Bob's CV
      try {
        const bobCvRef = adminContext.storage().ref("cv_documents/user_victim_bob/cv.pdf");
        await assertSucceeds(bobCvRef.getDownloadURL());
        recordResult({
          id: "SEC-CTL-06.4",
          control: "Kontrol 6: Akses Berkas Storage CV",
          title: "Admin institusi berhasil mengunduh berkas CV untuk keperluan audit/verifikasi",
          findingCode: "F-03",
          status: "PASS",
          evidence: "request.auth.token.admin == true mengizinkan pembacaan berkas CV.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-06.4",
          control: "Kontrol 6: Akses Berkas Storage CV",
          title: "Admin institusi berhasil mengunduh berkas CV untuk keperluan audit/verifikasi",
          findingCode: "F-03",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 6.5 Uploading non-PDF file to cv_documents (e.g. SVG or EXE)
      try {
        const dangerousFileRef = aliceContext.storage().ref("cv_documents/user_attacker_alice/cv.pdf");
        await assertFails(
          Promise.resolve(
            dangerousFileRef.put(Buffer.from("<svg onload=alert(1)>"), {
              contentType: "image/svg+xml",
            })
          )
        );
        recordResult({
          id: "SEC-CTL-06.5",
          control: "Kontrol 6: Akses Berkas Storage CV",
          title: "Storage Rules menolak berkas non-PDF (misal MIME SVG) pada folder cv_documents",
          findingCode: "F-03, F-12",
          status: "PASS",
          evidence: "request.resource.contentType == 'application/pdf' memvalidasi MIME type berkas.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-06.5",
          control: "Kontrol 6: Akses Berkas Storage CV",
          title: "Storage Rules menolak berkas non-PDF (misal MIME SVG) pada folder cv_documents",
          findingCode: "F-03, F-12",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 6.6 Enforcing static filename cv.pdf (prevent storage flooding)
      try {
        const arbitraryFileRef = aliceContext.storage().ref("cv_documents/user_attacker_alice/random_name.pdf");
        await assertFails(
          Promise.resolve(
            arbitraryFileRef.put(Buffer.from("%PDF-1.4 sample content"), {
              contentType: "application/pdf",
            })
          )
        );
        recordResult({
          id: "SEC-CTL-06.6",
          control: "Kontrol 6: Akses Berkas Storage CV",
          title: "Storage Rules mengunci nama file CV hanya 'cv.pdf' untuk mencegah penumpukan file sembarang",
          findingCode: "F-03, F-23",
          status: "PASS",
          evidence: "fileName == 'cv.pdf' menolak nama berkas selain pola baku.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-06.6",
          control: "Kontrol 6: Akses Berkas Storage CV",
          title: "Storage Rules mengunci nama file CV hanya 'cv.pdf' untuk mencegah penumpukan file sembarang",
          findingCode: "F-03, F-23",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 6.7 Rejecting SVG vector in avatars (Anti-XSS in storage)
      try {
        const svgAvatarRef = aliceContext.storage().ref("avatars/user_attacker_alice/avatar.svg");
        await assertFails(
          Promise.resolve(
            svgAvatarRef.put(Buffer.from("<svg onload=alert('XSS')>"), {
              contentType: "image/svg+xml",
            })
          )
        );
        recordResult({
          id: "SEC-CTL-06.7",
          control: "Kontrol 6: Akses Berkas Storage CV",
          title: "Storage Rules menolak avatar berformat SVG yang berpotensi menjadi vektor Stored XSS",
          findingCode: "F-12",
          status: "PASS",
          evidence: "contentType.matches('image/(jpeg|png|webp)') secara tegas menolak format vektor SVG.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-06.7",
          control: "Kontrol 6: Akses Berkas Storage CV",
          title: "Storage Rules menolak avatar berformat SVG yang berpotensi menjadi vektor Stored XSS",
          findingCode: "F-12",
          status: "FAIL",
          evidence: err.message,
        });
      }

      // 6.8 Deletion evaluated safely without crash on null request.resource
      try {
        const avatarDeleteRef = aliceContext.storage().ref("avatars/user_attacker_alice/avatar.jpg");
        await assertSucceeds(avatarDeleteRef.delete());
        recordResult({
          id: "SEC-CTL-06.8",
          control: "Kontrol 6: Akses Berkas Storage CV",
          title: "Storage Rules memisahkan allow delete sehingga penghapusan file tidak mengalami error null request.resource",
          findingCode: "F-23",
          status: "PASS",
          evidence: "allow delete: if isOwner(userId) berhasil menghapus berkas milik sendiri.",
        });
      } catch (err: any) {
        recordResult({
          id: "SEC-CTL-06.8",
          control: "Kontrol 6: Akses Berkas Storage CV",
          title: "Storage Rules memisahkan allow delete sehingga penghapusan file tidak mengalami error null request.resource",
          findingCode: "F-23",
          status: "FAIL",
          evidence: err.message,
        });
      }
    }

    // =========================================================================
    // KONTROL 7: Sanitasi Skema URL Eksternal pada safeHttpUrl()
    // =========================================================================
    console.log("\n--- KONTROL 7: Sanitasi Skema URL Eksternal (Anti-XSS safeHttpUrl) ---");
    {
      const xssVectors = [
        { payload: "javascript:alert(document.cookie)", desc: "Skema javascript: langsung" },
        { payload: "JAVASCRIPT:alert(1)", desc: "Skema javascript: dengan huruf kapital" },
        { payload: "   javascript:alert(1)   ", desc: "Skema javascript: dengan leading whitespace" },
        { payload: "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==", desc: "Skema data: HTML base64 XSS" },
        { payload: "data:image/svg+xml;utf8,<svg onload=alert(1)>", desc: "Skema data: SVG inline script" },
        { payload: "vbscript:msgbox(\"Pwned\")", desc: "Skema vbscript: execution" },
        { payload: "file:///etc/passwd", desc: "Skema file: LFI / local resource access" },
        { payload: "blob:http://localhost:3000/d745c918-0951", desc: "Skema blob: pseudo protocol" },
      ];

      let allXssBlocked = true;
      let failureDetail = "";

      for (const vec of xssVectors) {
        const sanitized = safeHttpUrl(vec.payload);
        if (sanitized !== null) {
          allXssBlocked = false;
          failureDetail += `Vektor lolos: ${vec.payload} -> ${sanitized}; `;
        }
      }

      recordResult({
        id: "SEC-CTL-07.1",
        control: "Kontrol 7: Sanitasi URL Eksternal",
        title: "Penolakan mutlak terhadap skema berbahaya (javascript:, data:, vbscript:, file:, blob:)",
        findingCode: "F-07, F4-03",
        status: allXssBlocked ? "PASS" : "FAIL",
        evidence: allXssBlocked
          ? "Seluruh 8 vektor URI berbahaya berhasil dinetralkan (mengembalikan null)."
          : failureDetail,
      });

      // 7.2 Legitimate HTTP/HTTPS URL normalization
      const validUrl1 = safeHttpUrl("https://mmtc.ac.id/showcase");
      const validUrl2 = safeHttpUrl("http://mitra-industri.com");
      const validUrl3 = safeHttpUrl("github.com/alumni-mmtc");

      const validUrlsPassed =
        validUrl1 === "https://mmtc.ac.id/showcase" &&
        validUrl2 === "http://mitra-industri.com/" &&
        validUrl3 === "https://github.com/alumni-mmtc";

      recordResult({
        id: "SEC-CTL-07.2",
        control: "Kontrol 7: Sanitasi URL Eksternal",
        title: "Normalisasi URL HTTP/HTTPS sah dan auto-prefixing protokol https:// pada tautan web",
        findingCode: "F-07",
        status: validUrlsPassed ? "PASS" : "FAIL",
        evidence: validUrlsPassed
          ? `Tautan valid terurai sempurna: ${validUrl1}, ${validUrl2}, ${validUrl3}`
          : `Gagal normalisasi: url1=${validUrl1}, url2=${validUrl2}, url3=${validUrl3}`,
      });

      // 7.3 Whitelisted host enforcement
      const allowedHosts = ["youtube.com", "youtu.be"];
      const ytValid1 = safeHttpUrl("https://www.youtube.com/watch?v=sample12345", allowedHosts);
      const ytValid2 = safeHttpUrl("https://youtu.be/sample12345", allowedHosts);
      const ytPhishing = safeHttpUrl("https://evil-phishing-youtube.com/watch", allowedHosts);

      const whitelistPassed =
        ytValid1 !== null &&
        ytValid2 !== null &&
        ytPhishing === null;

      recordResult({
        id: "SEC-CTL-07.3",
        control: "Kontrol 7: Sanitasi URL Eksternal",
        title: "Enforcement whitelist host/domain untuk embed media sensitif (youtube.com & youtu.be)",
        findingCode: "F-07, F-12",
        status: whitelistPassed ? "PASS" : "FAIL",
        evidence: whitelistPassed
          ? "Domain youtube.com & youtu.be diterima, domain phishing ditolak null."
          : `Gagal whitelist: yt1=${ytValid1}, yt2=${ytValid2}, phishing=${ytPhishing}`,
      });
    }

    // =========================================================================
    // KONTROL 8: KEAMANAN FEED KOMUNITAS, MEDIA STORAGE, & PERCAKAPAN
    // =========================================================================
    console.log("\n--- KONTROL 8: Keamanan Feed Jejaring Sosial & Widget Pesan Real-Time ---");
    {
      const unauthContext = testEnv.unauthenticatedContext();
      const unauthDb = unauthContext.firestore();
      const bobContext = testEnv.authenticatedContext("user_victim_bob");
      const bobDb = bobContext.firestore();
      const aliceContext = testEnv.authenticatedContext("user_attacker_alice");
      const aliceDb = aliceContext.firestore();

      // Seed synthetic post for Bob
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("feed_posts").doc("feed_seed_bob").set({
          authorUid: "user_victim_bob",
          authorName: "Siti Rahmawati",
          authorProdi: "Animasi",
          category: "showreel",
          content: "Showreel resmi 3D Rigging Bob",
          likesCount: 0,
          likedBy: [],
          comments: [],
          commentsCount: 0,
          createdAt: new Date().toISOString()
        });
      });

      // 8.1 Anonim dapat membaca feed_posts
      let unauthCanReadFeed = false;
      try {
        const snap = await unauthDb.collection("feed_posts").doc("feed_seed_bob").get();
        unauthCanReadFeed = snap.exists;
      } catch {
        unauthCanReadFeed = false;
      }

      recordResult({
        id: "SEC-CTL-08.1",
        control: "Kontrol 8: Feed & Pesan",
        title: "Pengguna anonim/unauthenticated dapat membaca koleksi feed_posts (public read)",
        findingCode: "F-FEED-01",
        status: unauthCanReadFeed ? "PASS" : "FAIL",
        evidence: unauthCanReadFeed
          ? "Dokumen feed_posts berhasil dibaca tanpa autentikasi (sesuai spesifikasi read-only)."
          : "Gagal: Pengguna anonim terblokir saat membaca feed_posts.",
      });

      // 8.2 Anonim ditolak saat membuat postingan baru
      let anonPostBlocked = false;
      try {
        await assertFails(
          unauthDb.collection("feed_posts").doc("feed_anon_post").set({
            authorUid: "anon_user",
            authorName: "Anonymous",
            category: "diskusi",
            content: "Postingan tanpa login",
            likesCount: 0,
            comments: []
          })
        );
        anonPostBlocked = true;
      } catch {
        anonPostBlocked = false;
      }

      recordResult({
        id: "SEC-CTL-08.2",
        control: "Kontrol 8: Feed & Pesan",
        title: "Pengguna anonim ditolak saat mencoba membuat postingan feed (wajib login)",
        findingCode: "F-FEED-01",
        status: anonPostBlocked ? "PASS" : "FAIL",
        evidence: anonPostBlocked
          ? "Rules menolak pembuatan postingan feed oleh pengunjung anonim."
          : "Gagal: Pengunjung anonim diizinkan membuat postingan feed.",
      });

      // 8.3 Bob berhasil membuat postingan feed miliknya
      let bobPostSuccess = false;
      try {
        await assertSucceeds(
          bobDb.collection("feed_posts").doc("feed_bob_post_new").set({
            authorUid: "user_victim_bob",
            authorName: "Siti Rahmawati",
            category: "showreel",
            content: "Postingan showreel Blender baru oleh Bob",
            likesCount: 0,
            comments: [],
            createdAt: new Date().toISOString()
          })
        );
        bobPostSuccess = true;
      } catch {
        bobPostSuccess = false;
      }

      recordResult({
        id: "SEC-CTL-08.3",
        control: "Kontrol 8: Feed & Pesan",
        title: "Pengguna alumni yang login berhasil membuat postingan feed miliknya sendiri",
        findingCode: "F-FEED-02",
        status: bobPostSuccess ? "PASS" : "FAIL",
        evidence: bobPostSuccess
          ? "Postingan baru berhasil dibuat oleh pemilik akun dengan data valid."
          : "Gagal: Pembuatan postingan feed ditolak untuk pemilik akun yang sah.",
      });

      // 8.4 Alice ditolak spoofing authorUid
      let aliceSpoofBlocked = false;
      try {
        await assertFails(
          aliceDb.collection("feed_posts").doc("feed_spoofed_post").set({
            authorUid: "user_victim_bob", // Spoofed!
            authorName: "Bob Spoofed",
            category: "diskusi",
            content: "Alice mencoba memalsukan identitas Bob",
            likesCount: 0,
            comments: []
          })
        );
        aliceSpoofBlocked = true;
      } catch {
        aliceSpoofBlocked = false;
      }

      recordResult({
        id: "SEC-CTL-08.4",
        control: "Kontrol 8: Feed & Pesan",
        title: "Pengguna dilarang memalsukan authorUid akun lain pada feed_posts (anti-spoofing)",
        findingCode: "F-FEED-02, F-21",
        status: aliceSpoofBlocked ? "PASS" : "FAIL",
        evidence: aliceSpoofBlocked
          ? "Rules menolak pembuatan postingan jika authorUid != request.auth.uid."
          : "Gagal: Penyerang diizinkan memalsukan authorUid pengguna lain.",
      });

      // 8.5 Alice ditolak menghapus postingan milik Bob (BOLA)
      let aliceDeleteBlocked = false;
      try {
        await assertFails(
          aliceDb.collection("feed_posts").doc("feed_seed_bob").delete()
        );
        aliceDeleteBlocked = true;
      } catch {
        aliceDeleteBlocked = false;
      }

      recordResult({
        id: "SEC-CTL-08.5",
        control: "Kontrol 8: Feed & Pesan",
        title: "Penyerang ditolak saat mencoba menghapus postingan milik alumni lain (BOLA protection)",
        findingCode: "F-FEED-03, F-06",
        status: aliceDeleteBlocked ? "PASS" : "FAIL",
        evidence: aliceDeleteBlocked
          ? "Rules menolak penghapusan feed_posts oleh non-pemilik (authorUid != auth.uid)."
          : "Gagal: Pihak ketiga diizinkan menghapus postingan orang lain.",
      });

      // 8.6 Alice dapat memberikan Like/Komentar pada postingan Bob
      let aliceInteractionSuccess = false;
      try {
        await assertSucceeds(
          aliceDb.collection("feed_posts").doc("feed_seed_bob").update({
            likesCount: 1,
            likedBy: ["user_attacker_alice"],
            updatedAt: new Date().toISOString()
          })
        );
        aliceInteractionSuccess = true;
      } catch {
        aliceInteractionSuccess = false;
      }

      recordResult({
        id: "SEC-CTL-08.6",
        control: "Kontrol 8: Feed & Pesan",
        title: "Pengguna lain yang login diizinkan berinteraksi (Like & Komentar) pada feed",
        findingCode: "F-FEED-04",
        status: aliceInteractionSuccess ? "PASS" : "FAIL",
        evidence: aliceInteractionSuccess
          ? "Pembaruan field interaksi (likesCount, likedBy, updatedAt) diterima secara aman."
          : "Gagal: Pembaruan like/komentar oleh pengguna login ditolak.",
      });

      // 8.7 Alice ditolak mengubah konten teks postingan milik Bob
      let aliceTamperContentBlocked = false;
      try {
        await assertFails(
          aliceDb.collection("feed_posts").doc("feed_seed_bob").update({
            content: "Konten telah dibajak oleh Alice!"
          })
        );
        aliceTamperContentBlocked = true;
      } catch {
        aliceTamperContentBlocked = false;
      }

      recordResult({
        id: "SEC-CTL-08.7",
        control: "Kontrol 8: Feed & Pesan",
        title: "Pengguna lain ditolak saat mencoba merusak atau menyunting konten teks postingan orang lain",
        findingCode: "F-FEED-04, F-22",
        status: aliceTamperContentBlocked ? "PASS" : "FAIL",
        evidence: aliceTamperContentBlocked
          ? "Rules melarang modifikasi content oleh pengguna selain pemilik postingan."
          : "Gagal: Pihak ketiga diizinkan mengubah konten postingan orang lain.",
      });

      // 8.8 Storage Rules menolak file SVG berbahaya pada feed_media (Anti-XSS F-12)
      let svgMediaBlocked = false;
      try {
        const svgRef = aliceContext.storage().ref("feed_media/user_attacker_alice/payload.svg");
        await assertFails(
          Promise.resolve(
            svgRef.put(Buffer.from("<svg onload=alert(document.domain)>"), {
              contentType: "image/svg+xml"
            })
          )
        );
        svgMediaBlocked = true;
      } catch {
        svgMediaBlocked = false;
      }

      recordResult({
        id: "SEC-CTL-08.8",
        control: "Kontrol 8: Feed & Pesan",
        title: "Storage Rules menolak berkas SVG berbahaya pada folder feed_media (Anti-XSS)",
        findingCode: "F-12, F-FEED-05",
        status: svgMediaBlocked ? "PASS" : "FAIL",
        evidence: svgMediaBlocked
          ? "Upload berkas SVG ditolak oleh contentType validator Storage Rules."
          : "Gagal: Berkas SVG berbahaya diizinkan diunggah ke feed_media.",
      });

      // 8.9 Storage Rules mengizinkan file JPEG dan PDF sah pada feed_media
      let validMediaAllowed = false;
      try {
        const imgRef = bobContext.storage().ref("feed_media/user_victim_bob/photo.jpg");
        await assertSucceeds(
          Promise.resolve(
            imgRef.put(Buffer.from("fake-jpg-content"), {
              contentType: "image/jpeg"
            })
          )
        );
        const pdfRef = bobContext.storage().ref("feed_media/user_victim_bob/document.pdf");
        await assertSucceeds(
          Promise.resolve(
            pdfRef.put(Buffer.from("%PDF-1.4 sample content"), {
              contentType: "application/pdf"
            })
          )
        );
        validMediaAllowed = true;
      } catch {
        validMediaAllowed = false;
      }

      recordResult({
        id: "SEC-CTL-08.9",
        control: "Kontrol 8: Feed & Pesan",
        title: "Storage Rules mengizinkan upload berkas gambar JPEG/PNG dan dokumen PDF pada feed_media",
        findingCode: "F-FEED-05",
        status: validMediaAllowed ? "PASS" : "FAIL",
        evidence: validMediaAllowed
          ? "Berkas JPEG dan PDF berukuran sah (<10MB) berhasil diunggah oleh pemilik."
          : "Gagal: Berkas sah ditolak oleh Storage Rules.",
      });

      // 8.10 Akses percakapan conversations ditolak untuk non-partisipan (BOLA Chat)
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("conversations").doc("conv_bob_dave").set({
          participants: ["user_victim_bob", "user_recruiter_dave"],
          lastMessage: "Halo Bob, ini Dave",
          updatedAt: new Date().toISOString()
        });
      });

      let chatBolaBlocked = false;
      try {
        await assertFails(
          aliceDb.collection("conversations").doc("conv_bob_dave").get()
        );
        chatBolaBlocked = true;
      } catch {
        chatBolaBlocked = false;
      }

      recordResult({
        id: "SEC-CTL-08.10",
        control: "Kontrol 8: Feed & Pesan",
        title: "Pihak ketiga (Alice) ditolak saat mencoba membaca percakapan privat antara Bob dan Dave (BOLA Chat)",
        findingCode: "F-CONV-01, F-06",
        status: chatBolaBlocked ? "PASS" : "FAIL",
        evidence: chatBolaBlocked
          ? "Rules membatasi pembacaan percakapan hanya untuk UID yang ada di array participants."
          : "Gagal: Pihak ketiga diizinkan mengintip percakapan orang lain.",
      });

      // 8.11 Peserta sah berhasil membaca percakapan
      let chatParticipantAllowed = false;
      try {
        await assertSucceeds(
          bobDb.collection("conversations").doc("conv_bob_dave").get()
        );
        chatParticipantAllowed = true;
      } catch {
        chatParticipantAllowed = false;
      }

      recordResult({
        id: "SEC-CTL-08.11",
        control: "Kontrol 8: Feed & Pesan",
        title: "Peserta percakapan yang sah (Bob) berhasil membaca riwayat percakapan",
        findingCode: "F-CONV-01",
        status: chatParticipantAllowed ? "PASS" : "FAIL",
        evidence: chatParticipantAllowed
          ? "Akses percakapan diberikan kepada peserta yang terdaftar di participants."
          : "Gagal: Peserta sah ditolak membaca percakapan miliknya.",
      });
    }

  } finally {
    await testEnv.cleanup();
  }

  // =========================================================================
  // REKAPITULASI DAN OUTPUT LAPORAN
  // =========================================================================
  const total = testResults.length;
  const passed = testResults.filter((r) => r.status === "PASS").length;
  const failed = total - passed;

  console.log("\n===============================================================================");
  console.log("   STRIX DEFENSIVE SECURITY VERIFICATION SUMMARY RESULT");
  console.log("===============================================================================");
  console.log(`Total Test Scenarios : ${total}`);
  console.log(`Passed               : ${passed}`);
  console.log(`Failed               : ${failed}`);
  console.log(`Compliance Score     : ${((passed / total) * 100).toFixed(1)}%`);
  console.log(`Status               : ${failed === 0 ? "PASSED (SECURE)" : "FAILURES DETECTED"}`);
  console.log("===============================================================================\n");

  const reportPath = path.resolve(__dirname, "strix_verification_report.json");
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        summary: { total, passed, failed, score: `${((passed / total) * 100).toFixed(1)}%` },
        results: testResults,
      },
      null,
      2
    ),
    "utf8"
  );
  console.log(`Verification log artifact saved to: ${reportPath}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runStrixVerification().catch((err) => {
  console.error("FATAL ERROR in Strix verification suite:", err);
  process.exit(1);
});
