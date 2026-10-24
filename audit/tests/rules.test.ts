/**
 * Firebase Security Rules Acceptance Test Suite
 * Based on Bagian 10 Audit Konsolidasi & Deep-Dive Keamanan STMM MMTC (F-01 s/d F-25)
 *
 * Requirements:
 * - Runs with `@firebase/rules-unit-testing` against Firebase Local Emulator
 * - Can be executed via: npm run test:rules or in GitHub Actions CI
 */

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import * as fs from "fs";
import * as path from "path";

const PROJECT_ID = "dashboard-alumni-mmtc-test";

describe("Firebase Rules Security Acceptance Tests (Bagian 10)", () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: fs.readFileSync(path.resolve(__dirname, "../firestore.rules"), "utf8"),
        host: "127.0.0.1",
        port: 8080,
      },
      storage: {
        rules: fs.readFileSync(path.resolve(__dirname, "../storage.rules"), "utf8"),
        host: "127.0.0.1",
        port: 9199,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.clearStorage();
  });

  // ==========================================
  // 1. OTORISASI & IDENTITAS (F-01, F-04, F-08, F-21, F-22)
  // ==========================================
  describe("1. Otorisasi dan Identitas", () => {
    it("TC-01: Pengguna biasa TIDAK DAPAT menulis role: 'admin' ke dokumen sendiri (F-01)", async () => {
      const userAlice = testEnv.authenticatedContext("user_alice");
      const userRef = userAlice.firestore().collection("users").doc("user_alice");

      // Coba buat dengan role admin
      await assertFails(
        userRef.set({
          uid: "user_alice",
          namaLengkap: "Alice Normal",
          role: "admin",
        })
      );
    });

    it("TC-02: Pengguna biasa tidak dapat menimpa identitas permanen (nomorAlumni, prodi, angkatan) (F-08)", async () => {
      // Seed data resmi
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("users").doc("user_alice").set({
          uid: "user_alice",
          namaLengkap: "Alice Resmi",
          nomorAlumni: "ALUMNI001",
          prodi: "Manajemen Produksi Siaran",
          angkatan: 2020,
          role: "alumni",
          createdAt: new Date(),
        });
      });

      const userAlice = testEnv.authenticatedContext("user_alice");
      const userRef = userAlice.firestore().collection("users").doc("user_alice");

      // Coba ubah nomor alumni atau prodi
      await assertFails(
        userRef.update({
          nomorAlumni: "ALUMNI999_TAMPERED",
        })
      );

      await assertFails(
        userRef.update({
          prodi: "Teknik Studio Siaran",
        })
      );

      // Pembaruan nama yang sah diizinkan
      await assertSucceeds(
        userRef.update({
          namaLengkap: "Alice Resmi Updated",
        })
      );
    });

    it("TC-03: Pengguna dilarang melakukan delete langsung pada users/{uid} (F-22)", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("users").doc("user_alice").set({
          uid: "user_alice",
          namaLengkap: "Alice",
        });
      });

      const userAlice = testEnv.authenticatedContext("user_alice");
      await assertFails(
        userAlice.firestore().collection("users").doc("user_alice").delete()
      );
    });

    it("TC-04: Non-admin tidak dapat mengubah master alumni_registry (F-04)", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("alumni_registry").doc("REG001").set({
          nomorAlumni: "REG001",
          namaLengkap: "Budi Master",
          prodi: "Animasi",
          angkatan: 2021,
          isRegistered: true,
          registeredUid: "other_user",
        });
      });

      const userBob = testEnv.authenticatedContext("user_bob");
      await assertFails(
        userBob.firestore().collection("alumni_registry").doc("REG001").update({
          namaLengkap: "Bob Hacked",
        })
      );
    });
  });

  // ==========================================
  // 2. PRIVASI DATA (F-02, F-06, F-25)
  // ==========================================
  describe("2. Privasi Data & Kontrol Akses", () => {
    it("TC-05: Anonim hanya dapat membaca public_profiles, dilarang mengakses users privat (F-02)", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("users").doc("user_alice").set({
          uid: "user_alice",
          namaLengkap: "Alice",
          email: "alice@private.com",
          nomorHp: "08123456789",
          openToWork: false,
        });
        await context.firestore().collection("public_profiles").doc("user_alice").set({
          uid: "user_alice",
          namaLengkap: "Alice",
          prodi: "Animasi",
        });
      });

      const unauthed = testEnv.unauthenticatedContext();
      // Gagal baca users privat
      await assertFails(
        unauthed.firestore().collection("users").doc("user_alice").get()
      );
      // Berhasil baca public_profiles
      await assertSucceeds(
        unauthed.firestore().collection("public_profiles").doc("user_alice").get()
      );
    });

    it("TC-06: User A dilarang membaca lamaran milik User B (F-06)", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("applications").doc("job1_alice").set({
          jobId: "job1",
          applicantUid: "user_alice",
          posterUid: "recruiter_hr",
          status: "pending",
          pesan: "Lamaran Alice",
        });
      });

      const userEve = testEnv.authenticatedContext("user_eve");
      await assertFails(
        userEve.firestore().collection("applications").doc("job1_alice").get()
      );

      const userAlice = testEnv.authenticatedContext("user_alice");
      await assertSucceeds(
        userAlice.firestore().collection("applications").doc("job1_alice").get()
      );
    });
  });

  // ==========================================
  // 3. INTEGRITAS LOWONGAN & DETERMINISTIC ID (F-05, F-06, F-10, F-20, F-21)
  // ==========================================
  describe("3. Integritas Data & Anti-Spoofing", () => {
    it("TC-07: Pembuat lowongan dilarang memalsukan postedBy (F-05)", async () => {
      const userAlice = testEnv.authenticatedContext("user_alice");
      await assertFails(
        userAlice.firestore().collection("jobs").doc("job123").set({
          postedBy: "user_victim_bob", // Spoofed!
          judul: "Software Engineer",
          perusahaan: "PT Tech",
          lokasi: "Jakarta",
          deskripsi: "Deskripsi",
          prodiTarget: ["Teknologi Rekayasa Multimedia"],
          kualifikasi: ["React", "TypeScript"],
        })
      );
    });

    it("TC-08: Tipe data salah (prodiTarget bukan list) ditolak oleh Rules (F-20)", async () => {
      const userAlice = testEnv.authenticatedContext("user_alice");
      await assertFails(
        userAlice.firestore().collection("jobs").doc("job124").set({
          postedBy: "user_alice",
          judul: "Software Engineer",
          perusahaan: "PT Tech",
          lokasi: "Jakarta",
          deskripsi: "Deskripsi",
          prodiTarget: 12345, // Salah tipe data (number bukan list)
          kualifikasi: ["React"],
        })
      );
    });

    it("TC-09: Enforce Deterministic ID pada applications `${jobId}_${applicantUid}` (F-06, F-21)", async () => {
      const userAlice = testEnv.authenticatedContext("user_alice");
      // ID acak sembarangan ditolak
      await assertFails(
        userAlice.firestore().collection("applications").doc("random_spoofed_id").set({
          jobId: "job99",
          applicantUid: "user_alice",
          status: "pending",
          pesan: "Halo saya melamar",
        })
      );

      // ID deterministik yang sah diterima
      await assertSucceeds(
        userAlice.firestore().collection("applications").doc("job99_user_alice").set({
          jobId: "job99",
          applicantUid: "user_alice",
          status: "pending",
          pesan: "Halo saya melamar",
        })
      );
    });

    it("TC-10: Poster dilarang merusak pesan/CV pelamar saat update status (F-06, F-22)", async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore().collection("applications").doc("job99_user_alice").set({
          jobId: "job99",
          applicantUid: "user_alice",
          posterUid: "recruiter_hr",
          status: "pending",
          pesan: "Pesan asli pelamar",
        });
      });

      const recruiter = testEnv.authenticatedContext("recruiter_hr");
      // Coba ubah pesan pelamar
      await assertFails(
        recruiter.firestore().collection("applications").doc("job99_user_alice").update({
          pesan: "Pesan telah dimanipulasi",
          status: "reviewed",
        })
      );

      // Hanya ubah status diperbolehkan
      await assertSucceeds(
        recruiter.firestore().collection("applications").doc("job99_user_alice").update({
          status: "reviewed",
        })
      );
    });
  });

  // ==========================================
  // 4. STORAGE RULES (F-03, F-12, F-23)
  // ==========================================
  describe("4. Storage Security Rules", () => {
    it("TC-11: Penghapusan avatar milik sendiri berhasil tanpa crash request.resource == null (F-23)", async () => {
      const userAlice = testEnv.authenticatedContext("user_alice");
      const fileRef = userAlice.storage().ref("avatars/user_alice/avatar.jpg");

      // Delete dievaluasi terhadap allow delete: isOwner(userId)
      await assertSucceeds(fileRef.delete());
    });

    it("TC-12: Menolak upload gambar format SVG berbahaya (XSS vector) (F-12)", async () => {
      const userAlice = testEnv.authenticatedContext("user_alice");
      const fileRef = userAlice.storage().ref("avatars/user_alice/avatar.svg");

      await assertFails(
        fileRef.put(Buffer.from("<svg onload=alert(1)>"), {
          contentType: "image/svg+xml",
        })
      );
    });
  });
});
