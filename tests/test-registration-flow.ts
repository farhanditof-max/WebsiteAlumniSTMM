import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import * as fs from "fs";
import * as path from "path";

async function run() {
  console.log("=== Testing Registration Flow with getAfter Rules ===");

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

  // 1. Setup admin seed in alumni_registry
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const adminDb = context.firestore();
    await adminDb.collection("alumni_registry").doc("MMTC-2018-001").set({
      nomorAlumni: "MMTC-2018-001",
      namaLengkap: "Budi Santoso",
      prodi: "Animasi",
      angkatan: "2018",
      isRegistered: false,
      createdAt: new Date().toISOString()
    });
    console.log("Seeded MMTC-2018-001 (Budi Santoso, Animasi, 2018) in alumni_registry");
  });

  // 2. Simulate Budi registering via atomic batch commit as signedIn user "budi_uid"
  const budiContext = testEnv.authenticatedContext("budi_uid");
  const budiDb = budiContext.firestore();

  const regRef = budiDb.collection("alumni_registry").doc("MMTC-2018-001");
  const userRef = budiDb.collection("users").doc("budi_uid");

  const batch = budiDb.batch();
  batch.update(regRef, {
    isRegistered: true,
    registeredUid: "budi_uid",
    registeredAt: new Date().toISOString()
  });
  batch.set(userRef, {
    uid: "budi_uid",
    email: "budi@santoso.com",
    nomorAlumni: "MMTC-2018-001",
    namaLengkap: "Budi Santoso",
    prodi: "Animasi",
    angkatan: "2018",
    openToWork: false,
    portfolio: [],
    createdAt: new Date().toISOString()
  });

  console.log("Executing atomic batch commit for Budi Santoso...");
  await assertSucceeds(batch.commit());
  console.log("✅ SUCCESS: Atomic batch commit for Budi Santoso succeeded with getAfter rules!");

  // 3. Verify that trying to claim the same nomorAlumni a second time fails
  const attackerContext = testEnv.authenticatedContext("attacker_uid");
  const attackerDb = attackerContext.firestore();
  const attackerBatch = attackerDb.batch();
  attackerBatch.update(attackerDb.collection("alumni_registry").doc("MMTC-2018-001"), {
    isRegistered: true,
    registeredUid: "attacker_uid"
  });
  attackerBatch.set(attackerDb.collection("users").doc("attacker_uid"), {
    uid: "attacker_uid",
    email: "attacker@test.com",
    nomorAlumni: "MMTC-2018-001",
    namaLengkap: "Fake Budi",
    prodi: "Animasi",
    angkatan: "2018"
  });
  console.log("Testing that duplicate registration for already registered alumni fails...");
  await assertFails(attackerBatch.commit());
  console.log("✅ SUCCESS: Second registration for MMTC-2018-001 properly rejected!");

  await testEnv.cleanup();
  console.log("All registration flow tests passed!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
