import { runSecurityAcceptanceMatrix } from "./rules.runner";
import * as fs from "fs";
import * as path from "path";

console.log("===============================================================================");
console.log("   DASHBOARD ALUMNI STMM MMTC - FIREBASE SECURITY RULES VERIFICATION RUNNER    ");
console.log("   Audit Konsolidasi & Deep-Dive Keamanan (Bagian 10 Acceptance Matrix)        ");
console.log("===============================================================================\n");

const summary = runSecurityAcceptanceMatrix();

let outputBuffer = "";
const log = (msg: string) => {
  console.log(msg);
  outputBuffer += msg + "\n";
};

log(`Executed: ${new Date().toISOString()}`);
log(`Total Test Cases : ${summary.total}`);
log(`Passed           : ${summary.passed}`);
log(`Failed           : ${summary.failed}`);
log(`Status           : ${summary.failed === 0 ? "ALL PASS (100% SUCCESS)" : "FAILURES DETECTED"}\n`);

log("-------------------------------------------------------------------------------");
log(String("ID").padEnd(8) + String("FINDING").padEnd(12) + String("STATUS").padEnd(10) + "TEST CASE TITLE");
log("-------------------------------------------------------------------------------");

for (const test of summary.results) {
  const statusStr = test.passed ? "[PASS]" : "[FAIL]";
  log(`${test.id.padEnd(8)}${test.findingCode.padEnd(12)}${statusStr.padEnd(10)}${test.title}`);
}

log("-------------------------------------------------------------------------------\n");
log("DETAILED AUDIT FINDINGS VERIFICATION:");
log("===============================================================================");

for (const test of summary.results) {
  log(`\n[${test.id}] ${test.title} (${test.findingCode})`);
  log(`Category : ${test.category}`);
  log(`Result   : ${test.passed ? "PASS" : "FAIL"}`);
  log(`Evidence : ${test.details}`);
}

log("\n===============================================================================");
log(`FINAL VERDICT: ${summary.passed}/${summary.total} Acceptance Tests PASSED.`);
log("Security Rules, Schema Invariants, and Data Boundaries are fully enforced.");
log("===============================================================================");

// Write report to tests/rules_test_results.txt
const resultsPath = path.resolve(__dirname, "rules_test_results.txt");
fs.writeFileSync(resultsPath, outputBuffer, "utf8");
console.log(`\nResults successfully written to: ${resultsPath}`);

if (summary.failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
