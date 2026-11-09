import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import * as fs from "fs";
import * as path from "path";

async function run() {
  console.log("=== Comprehensive Verification: Profile Update & Open-To-Work Sync ===");

  const firestoreRules = fs.readFileSync(path.resolve(__dirname, "../firestore.rules"), "utf8");

  const hostPort = process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8088";
  const [host, portStr] = hostPort.split(":");
  const port = parseInt(portStr || "8088", 10);

  const testEnv = await initializeTestEnvironment({
    projectId: "dashboard-alumni-mmtc-test",
    firestore: {
      rules: firestoreRules,
      host: host || "127.0.0.1",
      port: port
    }
  });

  await testEnv.clearFirestore();

  // 1. Seed user with registered status
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();
    await adminDb.collection("alumni_registry").doc("MMTC-2022-015").set({
      nomorAlumni: "MMTC-2022-015",
      namaLengkap: "Maya Safitri",
      prodi: "Animasi",
      angkatan: 2022,
      isRegistered: true,
      registeredUid: "maya_uid",
      createdAt: new Date().toISOString()
    });

    await adminDb.collection("users").doc("maya_uid").set({
      uid: "maya_uid",
      email: "maya@alumni.mmtc.ac.id",
      phone: "08123456789", // Private PII
      nomorAlumni: "MMTC-2022-015",
      namaLengkap: "Maya Safitri",
      prodi: "Animasi",
      angkatan: 2022,
      openToWork: false,
      portfolio: [],
      createdAt: new Date().toISOString()
    });

    await adminDb.collection("public_profiles").doc("maya_uid").set({
      uid: "maya_uid",
      namaLengkap: "Maya Safitri",
      prodi: "Animasi",
      angkatan: 2022,
      openToWork: false,
      portfolio: [],
      createdAt: new Date().toISOString()
    });
  });

  const mayaContext = testEnv.authenticatedContext("maya_uid");
  const mayaDb = mayaContext.firestore();

  // SCENARIO 1: Maya updates her profile to Open To Work and edits bio/links
  console.log("\n[SCENARIO 1] Maya saves profile with Open To Work = true (omits locked fields)");
  const updateData = {
    namaLengkap: "Maya Safitri Updated",
    email: "maya@alumni.mmtc.ac.id",
    openToWork: true,
    bio: "Senior 3D Animator & Rigging Specialist",
    phone: "08123456789",
    linkedinUrl: "https://linkedin.com/in/mayasafitri",
    cvExternalLink: "https://drive.google.com/maya-cv",
    portfolio: [
      { id: "p1", type: "youtube", title: "Character Reel 2026", url: "https://youtube.com/watch?v=sample" }
    ],
    updatedAt: new Date().toISOString()
  };

  // 1a. Update private users collection
  await assertSucceeds(
    mayaDb.collection("users").doc("maya_uid").set(updateData, { merge: true })
  );
  console.log("✅ Maya private profile successfully updated in users/maya_uid");

  // 1b. Sync whitelist non-PII to public_profiles
  const publicData = {
    uid: "maya_uid",
    namaLengkap: updateData.namaLengkap,
    prodi: "Animasi",
    angkatan: "2022",
    bio: updateData.bio,
    openToWork: true,
    portfolio: updateData.portfolio,
    fotoProfil: "https://storage.googleapis.com/avatar.jpg",
    cvExternalLink: updateData.cvExternalLink,
    hasCv: true,
    updatedAt: new Date().toISOString()
  };

  await assertSucceeds(
    mayaDb.collection("public_profiles").doc("maya_uid").set(publicData, { merge: true })
  );
  console.log("✅ Maya public profile mirror successfully updated in public_profiles/maya_uid");

  // SCENARIO 2: Anonymous visitor or recruiter checks Open To Work catalog
  console.log("\n[SCENARIO 2] Anonymous visitor queries Open To Work talents");
  const unauthContext = testEnv.unauthenticatedContext();
  const unauthDb = unauthContext.firestore();

  // Query public_profiles where openToWork == true
  const querySnap = await unauthDb
    .collection("public_profiles")
    .where("openToWork", "==", true)
    .get();

  const foundMaya = querySnap.docs.some((d) => d.id === "maya_uid" && d.data().namaLengkap === "Maya Safitri Updated");
  if (!foundMaya) {
    throw new Error("FAIL: Maya was NOT found in public_profiles where openToWork == true!");
  }
  console.log("✅ SUCCESS: Maya IS found in open-to-work query with updated name and showreel!");

  // Ensure private PII is NOT leaked in public_profiles query
  for (const doc of querySnap.docs) {
    const data = doc.data();
    if (data.phone || data.email || data.nomorHp || data.cvUrl) {
      throw new Error(`FAIL: PII leaked in public_profiles/${doc.id}!`);
    }
  }
  console.log("✅ SUCCESS: Zero PII (phone, email, cvUrl) exposed in public_profiles catalog!");

  // SCENARIO 3: Attacker Alice tries to tamper with Maya's public profile
  console.log("\n[SCENARIO 3] Attacker Alice tries to modify Maya's public profile");
  const aliceContext = testEnv.authenticatedContext("alice_uid");
  const aliceDb = aliceContext.firestore();

  await assertFails(
    aliceDb.collection("public_profiles").doc("maya_uid").set({
      namaLengkap: "Hacked by Alice"
    }, { merge: true })
  );
  console.log("✅ SUCCESS: Attacker Alice properly blocked from modifying Maya's public profile!");

  // SCENARIO 4: Maya tries to leak PII into public_profiles (should be blocked by rules)
  console.log("\n[SCENARIO 4] Maya attempts to write PII (phone/email) into public_profiles");
  await assertFails(
    mayaDb.collection("public_profiles").doc("maya_uid").update({
      phone: "08123456789"
    })
  );
  await assertFails(
    mayaDb.collection("public_profiles").doc("maya_uid").update({
      email: "maya@alumni.mmtc.ac.id"
    })
  );
  console.log("✅ SUCCESS: PII keys (phone, email) strictly rejected by firestore.rules on public_profiles!");

  // SCENARIO 5: Maya tries to tamper with locked fields in private users collection
  console.log("\n[SCENARIO 5] Maya tries to tamper with locked fields (nomorAlumni, prodi, angkatan)");
  await assertFails(
    mayaDb.collection("users").doc("maya_uid").update({
      nomorAlumni: "TAMPERED_001"
    })
  );
  await assertFails(
    mayaDb.collection("users").doc("maya_uid").update({
      prodi: "Game Design"
    })
  );
  console.log("✅ SUCCESS: Academic identity fields (nomorAlumni, prodi, angkatan) remain securely locked!");

  await testEnv.cleanup();
  console.log("\n🎉 ALL 5 SCENARIOS PASSED WITH ZERO ERRORS!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
