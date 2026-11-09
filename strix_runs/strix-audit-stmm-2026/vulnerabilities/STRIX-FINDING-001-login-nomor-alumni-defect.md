# STRIX-FINDING-001: Authentication Disconnect via Synthetic Email Domain in Alumni Login

- **Finding ID:** `STRIX-FINDING-001`
- **Severity:** High
- **CVSS v3.1:** `7.5` (`CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H`)
- **CWE:** CWE-287 (Improper Authentication)
- **Status:** Fixed (Remediated in `src/lib/auth.ts` and `src/app/login/page.tsx`)
- **Affected Assets:**
  - `src/lib/auth.ts` (lines 288–321)
  - `src/app/login/page.tsx` (lines 40–129)
  - Endpoint: `/login` (POST authentication handler)

---

## 1. Description & Technical Root Cause

During registration (`registerAlumni` in `src/lib/auth.ts`), users provide their real personal email address, password, and institutional Nomor Alumni. The system registers the account in Firebase Authentication using `createUserWithEmailAndPassword(auth, cleanEmail, password)`. The `nomorAlumni` is persisted in Firestore under `users/{uid}` and cross-referenced in `alumni_registry/{nomor}`.

In the login implementation (`loginAlumni`), client code attempted to accommodate users who inputted their `nomorAlumni` instead of their email by fabricating a synthetic email address:
```typescript
if (!cleanIdentifier.includes('@')) {
  const normalizedNomor = normalizeNomorAlumni(cleanIdentifier);
  targetEmail = `${normalizedNomor.toLowerCase()}@alumni.mmtc.ac.id`;
}
```
Because no Firebase Auth user account was ever registered with domain `@alumni.mmtc.ac.id`, calling `signInWithEmailAndPassword(auth, targetEmail, password)` failed with `auth/user-not-found` or `auth/invalid-credential`. Furthermore, Firestore security rules (F3-02, F-02) forbid unauthenticated queries across `users` collection to look up an email from a `nomorAlumni` (preventing PII enumeration and scraping).

The user interface in `src/app/login/page.tsx` compounded this issue by labeling the input `Email atau Nomor Alumni` and offering placeholder `nama@email.com atau MMTC-2020-103`, misleading users into attempting login with their Nomor Alumni.

---

## 2. Proof of Concept & Reproduction

1. Register an alumnus account on `/register`:
   - Email: `budi.santoso@gmail.com`
   - Password: `SecretPassword123!`
   - Nomor Alumni: `MMTC-2018-001`
   - Nama Lengkap: `Budi Santoso`
2. Account is created in Firebase Auth with `email = budi.santoso@gmail.com`.
3. Open `/login`.
4. Enter `MMTC-2018-001` in the identifier field and `SecretPassword123!` as password.
5. Submit form.
6. **Observed Result:** Client invokes `signInWithEmailAndPassword(auth, "mmtc-2018-001@alumni.mmtc.ac.id", "SecretPassword123!")`. Firebase Auth responds with `auth/user-not-found`. The user cannot log in.

---

## 3. Impact

- **Availability / Denial of Service:** Legitimate registered alumni who attempt to log in using their Nomor Alumni are blocked from accessing the portal.
- **User Experience Disconnect:** Frustration and repeated failed login attempts, potentially triggering rate limiting (`auth/too-many-requests`).

---

## 4. Remediation & Fix Applied

1. **Auth Helper (`src/lib/auth.ts`):**
   - Removed the synthetic `@alumni.mmtc.ac.id` bypass.
   - Enforce that the identifier contains `@`. If missing, immediately throw:
     `"Silakan masukkan alamat email yang Anda daftarkan saat registrasi alumni."`
   - Pass `cleanIdentifier.toLowerCase()` directly to `signInWithEmailAndPassword`.

2. **Login View (`src/app/login/page.tsx`):**
   - Updated header subtext: `"Gunakan alamat email yang terdaftar saat registrasi alumni"`.
   - Updated form label: `"Alamat Email Terdaftar"`.
   - Updated input placeholder: `"nama@email.com"`.
   - Added helper guidance: `"Nomor Alumni digunakan untuk verifikasi akademik saat pertama kali mendaftar."`
   - Added instant client validation in `handleSubmit`:
     ```typescript
     if (!identifier.trim().includes('@')) {
       setError('Login portal alumni menggunakan alamat email terdaftar. Nomor Alumni hanya digunakan untuk verifikasi akademik saat registrasi.');
       return;
     }
     ```

---

## 5. Verification

- `npx tsc --noEmit`: 0 errors.
- Manual test with non-email input triggers clear immediate error.
- Valid email authentication delegates cleanly to Firebase Auth.
