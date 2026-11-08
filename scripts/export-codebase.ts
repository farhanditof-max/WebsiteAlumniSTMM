import * as fs from 'fs';
import * as path from 'path';

const files = [
  "package.json",
  "tsconfig.json",
  "next.config.ts",
  "firestore.rules",
  "storage.rules",
  "firebase.json",
  "firestore.indexes.json",
  ".firebaserc",
  ".env.example",
  "AGENTS.md",
  "src/types/index.ts",
  "src/lib/firebase.ts",
  "src/lib/auth.ts",
  "src/lib/jobs.ts",
  "src/lib/media.ts",
  "src/lib/firestoreRest.ts",
  "src/lib/feed.ts",
  "src/context/AuthContext.tsx",
  "src/components/layout/Navbar.tsx",
  "src/components/layout/Footer.tsx",
  "src/components/profile/AlumniAvatar.tsx",
  "src/components/profile/AlumniActivityHistory.tsx",
  "src/components/profile/skills.ts",
  "src/components/feed/LinkedInMessagingWidget.tsx",
  "src/components/ui/Badge.tsx",
  "src/components/ui/Modal.tsx",
  "src/components/ui/ShareModal.tsx",
  "src/components/ui/Skeleton.tsx",
  "src/app/globals.css",
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/app/login/page.tsx",
  "src/app/register/page.tsx",
  "src/app/lowongan/page.tsx",
  "src/app/post-lowongan/page.tsx",
  "src/app/open-to-work/page.tsx",
  "src/app/feed/page.tsx",
  "src/app/aktivitas/page.tsx",
  "src/app/profil/page.tsx",
  "src/app/profil/[uid]/page.tsx",
  "src/app/lamaran/page.tsx",
  "src/app/admin/alumni/page.tsx",
  "functions/package.json",
  "functions/src/index.ts",
  ".github/workflows/ci.yml",
  "tests/tsconfig.json",
  "tests/rules.runner.ts",
  "tests/rules.test.ts",
  "tests/run-all-tests.ts",
  "tests/test-registration-flow.ts",
  "tests/test-profile-update.ts",
  "tests/seed-sandbox-data.ts",
  "tests/strix-security-verification.ts",
  "scripts/seed-cloud-presentation.ts",
  "scripts/export-codebase.ts",
  "strix_runs/strix-audit-stmm-2026/penetration_test_report.md",
  "strix_runs/strix-audit-stmm-2026/vulnerabilities/STRIX-FINDING-001-login-nomor-alumni-defect.md",
  "strix_runs/strix-audit-stmm-2026/vulnerabilities/STRIX-FINDING-002-untested-cloud-functions-trigger.md"
];

const now = new Date();
const dateStr = now.toISOString().replace('T', ' ').substring(0, 19);

let output = `================================================================================
CODEBASE AUDIT & SECURITY REVISION - DASHBOARD ALUMNI STMM MMTC
Generated: ${dateStr}
Branch: fix/security-audit-comprehensive-patches
================================================================================\n\n`;

for (const relPath of files) {
  const fullPath = path.resolve(process.cwd(), relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File missing: ${relPath}`);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const normalizedRel = relPath.replace(/\//g, '\\');
  output += `================================================================================
FILE: ${normalizedRel}
================================================================================
${content.trimEnd()}\n\n`;
}

const rootOut = path.resolve(process.cwd(), 'codebase.txt');
const auditOut = path.resolve(process.cwd(), 'audit', 'codebase.txt');

fs.writeFileSync(rootOut, output, 'utf8');
fs.writeFileSync(auditOut, output, 'utf8');

console.log(`Successfully updated codebase.txt (${output.length} bytes, ${files.length} files) in root and audit/`);
