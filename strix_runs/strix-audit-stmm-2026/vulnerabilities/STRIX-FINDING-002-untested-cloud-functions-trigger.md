# STRIX-FINDING-002: Untested Background Sync Cloud Trigger & Public Profile CV Badge Data Model Inconsistency

- **Finding ID:** `STRIX-FINDING-002`
- **Severity:** Medium
- **CVSS v3.1:** `5.3` (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N`)
- **CWE:** CWE-436 (Interpretation Conflict)
- **Status:** Open (Tracked for implementation)
- **Affected Assets:**
  - `functions/src/index.ts` (lines 155–195)
  - `src/app/open-to-work/page.tsx` (lines 210–218)
  - Endpoint: Firestore background trigger `onWrite(users/{uid})`

---

## 1. Description & Technical Root Cause

1. **Untested Background Synchronization:**
   The codebase relies on a Firebase Cloud Function background trigger (`syncPublicProfile` in `functions/src/index.ts`) to mirror changes from private user documents (`users/{uid}`) to public projection documents (`public_profiles/{uid}`). However, the local automated test suite (`npm run test:strix` / `tests/strix-security-verification.ts`) only starts the Firestore and Storage emulators (`--only firestore,storage`), omitting the Firebase Functions emulator. Consequently, the trigger execution has zero automated regression testing in CI/CD.

2. **Data Model / UI Badge Inconsistency:**
   To comply with the Indonesian Personal Data Protection Act (UU PDP) and rule F-02, `syncPublicProfile` strips private contact information and resume URLs (`cvUrl` and `cvFileUrl`) before writing to `public_profiles`:
   ```typescript
   const publicData = {
     uid,
     namaLengkap: typeof userData.namaLengkap === "string" ? userData.namaLengkap : "",
     prodi: typeof userData.prodi === "string" ? userData.prodi : "",
     angkatan: typeof userData.angkatan === "number" || typeof userData.angkatan === "string" ? userData.angkatan : "",
     bio: typeof userData.bio === "string" ? userData.bio.slice(0, 500) : "",
     keahlian: Array.isArray(userData.keahlian) ? userData.keahlian.slice(0, 20) : [],
     portfolio: sanitizedPortfolio,
     openToWork: Boolean(userData.openToWork),
     fotoProfil: isSafeUrl(userData.fotoProfil) ? userData.fotoProfil : (isSafeUrl(userData.avatarUrl) ? userData.avatarUrl : null),
     domisili: typeof userData.domisili === "string" ? userData.domisili.slice(0, 100) : "",
     updatedAt: admin.firestore.FieldValue.serverTimestamp(),
   };
   ```
   However, on the public talent catalog page (`src/app/open-to-work/page.tsx`), the "CV Ready" indicator badge checks:
   ```tsx
   {(alumni.cvFileUrl || alumni.cvExternalLink) && (
     <>
       <span>•</span>
       <span className="flex items-center gap-1 text-[#0284c7] font-medium">
         <FileText className="w-3.5 h-3.5" />
         CV Ready
       </span>
     </>
   )}
   ```
   Because `cvFileUrl` is intentionally omitted from `public_profiles` for privacy reasons, this condition will evaluate to `false` for every alumnus who uploaded a CV to Firebase Storage, causing the badge to never appear for public visitors.

---

## 2. Proof of Concept & Reproduction

1. Authenticate as Bob (`user_victim_bob`).
2. Bob uploads a CV document (`cv.pdf`) and updates his profile with `cvUrl` pointing to Storage.
3. The background Cloud Function runs and writes `public_profiles/user_victim_bob`.
4. Check the document fields in `public_profiles/user_victim_bob`:
   ```json
   {
     "uid": "user_victim_bob",
     "namaLengkap": "Siti Rahmawati",
     "prodi": "Animasi",
     "openToWork": true
   }
   ```
   Notice that neither `cvFileUrl` nor a boolean flag `hasCv` exists.
5. As an anonymous user or recruiter, navigate to `/open-to-work`.
6. Inspect the card for Bob:
   - The card shows `X Karya Showreel`.
   - The `CV Ready` badge is **missing** despite Bob having an active CV on file.

---

## 3. Impact

- **UI Inaccuracy:** Talent recruiters cannot see which alumni have a ready-to-review CV without clicking through to individual profiles.
- **Architectural Fragility:** Lack of automated tests for Cloud Functions means breaking schema changes in `users/{uid}` could fail silently in production without triggering alarms in CI.

---

## 4. Remediation

1. **Add `hasCv` Boolean Flag in Whitelist Projection:**
   In `functions/src/index.ts`:
   ```typescript
   hasCv: Boolean(userData.cvUrl || userData.cvFileUrl || userData.cvExternalLink),
   ```
   This safely communicates that a resume exists without exposing the underlying storage URL or PII.

2. **Update UI Check in `src/app/open-to-work/page.tsx`:**
   ```tsx
   {(alumni.hasCv || alumni.cvFileUrl || alumni.cvExternalLink) && (
     <>
       <span>•</span>
       <span className="flex items-center gap-1 text-[#0284c7] font-medium">
         <FileText className="w-3.5 h-3.5" />
         CV Ready
       </span>
     </>
   )}
   ```

3. **Incorporate Functions Emulator in CI Test Script:**
   Update `package.json` `test:strix` to start the functions emulator:
   ```json
   "test:strix": "npx firebase-tools emulators:exec --only firestore,storage,functions \"ts-node --project tests/tsconfig.json tests/strix-security-verification.ts\""
   ```
