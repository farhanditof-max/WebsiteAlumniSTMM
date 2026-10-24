# 📋 Status & Dokumentasi Security Rules: Firebase Console vs Repository

Dokumen ini disusun untuk memenuhi permintaan audit Bagian 11 mengenai sinkronisasi aturan keamanan antara **Firebase Console (Production)** dan **Repository Lokal (`firestore.rules` & `storage.rules`)**.

---

## 1. Ringkasan Status & Perbandingan

| Parameter | Aturan di Firebase Console (Sebelum Hardening) | Aturan di Repo Saat Ini (`firestore.rules` & `storage.rules`) | Status Mitigasi |
| :--- | :--- | :--- | :--- |
| **users/{userId}** | `allow read, write: if request.auth != null;` (Permissive) | Read dibatasi pemilik/admin; create melarang `role: 'admin'`; update mengunci 6 field krusial (`nomorAlumni`, `prodi`, dll); delete hanya admin. | ✅ **F-01, F-02, F-08, F-20, F-22 Terselesaikan** |
| **public_profiles** | Belum ada (Semua data PII langsung terekspos dari `users`) | `allow read: if true; allow write: if isAdmin();` (Mirror whitelist oleh Cloud Function). | ✅ **F-02 UU PDP Terselesaikan** |
| **jobs/{jobId}** | Tidak ada validasi `postedBy == request.auth.uid` | Mengunci permanen `postedBy` ke UID pembuat; validasi tipe data (`is string`, `is list`); update mengunci `postedBy` dan `createdAt`. | ✅ **F-05, F-20 Terselesaikan** |
| **applications** | ID dokumen acak; tidak ada validasi relasi job-pelamar | **Deterministic ID** `${jobId}_${applicantUid}`; poster hanya boleh ubah `status in ['reviewed','accepted','rejected']` dan dilarang merusak pesan pelamar. | ✅ **F-06, F-21, F-22 Terselesaikan** |
| **contact_requests**| Siapa saja bisa menimpa pesan | **Deterministic ID** `${requesterUid}_${targetUid}`; target hanya boleh update `status in ['approved','rejected']`. | ✅ **F-10, F-21, F-22 Terselesaikan** |
| **alumni_registry** | Tidak terkunci atau readable publik | Read dibatasi `signedIn()`; write/delete hanya Admin institusi; klaim atomik via Cloud Function / transaction. | ✅ **F-04, F-24 Terselesaikan** |
| **Storage: avatars** | Evaluasi `delete` gagal (`request.resource == null`); menerima file SVG (XSS) | Pemisahan `delete` dari `create/update`; regex nama file `avatar.(jpg|jpeg|png|webp)`; SVG ditolak; batas 3MB. | ✅ **F-03, F-12, F-23 Terselesaikan** |
| **Storage: CV** | File dinamis bisa ditimpa / multi-upload flooding | Nama file statis `cv.pdf`; batas 5MB; MIME dikunci `application/pdf`. | ✅ **F-03, F-23 Terselesaikan** |

---

## 2. Salinan Rules Siap Pakai untuk Firebase Console

Bagi administrator institusi atau repo owner (`farhanditof-max`), silakan salin aturan berikut langsung ke tab **Rules** di Firebase Console:

### A. Firestore Rules (Buka Firebase Console > Firestore Database > Rules)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn()   { return request.auth != null; }
    function isAdmin()    { return signedIn() && (request.auth.token.admin == true || request.auth.token.role == 'admin'); }
    function isOwner(uid) { return signedIn() && request.auth.uid == uid; }
    function locked(keys) {
      return !request.resource.data.diff(resource.data).affectedKeys().hasAny(keys);
    }

    // Profil Alumni Privat (F-01, F-02, F-08, F-20, F-22):
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin() || (signedIn() && resource.data.openToWork == true);
      allow create: if isOwner(userId)
                    && request.resource.data.uid == userId
                    && (!request.resource.data.keys().hasAny(['role']) || request.resource.data.role != 'admin')
                    && request.resource.data.namaLengkap is string;
      allow update: if (isOwner(userId)
                    && locked(['role', 'uid', 'nomorAlumni', 'createdAt', 'prodi', 'angkatan'])
                    && request.resource.data.namaLengkap is string
                    && (request.resource.data.openToWork is bool || !request.resource.data.keys().hasAny(['openToWork']))
                    && (!request.resource.data.keys().hasAny(['portfolio']) || (request.resource.data.portfolio is list && request.resource.data.portfolio.size() <= 12))
                    ) || isAdmin();
      allow delete: if isAdmin();
    }

    // Profil Publik Mirror (F-02 Whitelist):
    match /public_profiles/{userId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Lowongan Kerja (F-05, F-20, F-22):
    match /jobs/{jobId} {
      allow read: if true;
      allow create: if signedIn()
                    && request.resource.data.postedBy == request.auth.uid
                    && request.resource.data.judul is string
                    && request.resource.data.perusahaan is string
                    && request.resource.data.lokasi is string
                    && request.resource.data.deskripsi is string
                    && request.resource.data.prodiTarget is list
                    && request.resource.data.kualifikasi is list;
      allow update: if (signedIn()
                    && resource.data.postedBy == request.auth.uid
                    && locked(['postedBy', 'createdAt'])
                    && request.resource.data.judul is string
                    && request.resource.data.prodiTarget is list
                    && request.resource.data.kualifikasi is list
                    ) || isAdmin();
      allow delete: if (signedIn() && resource.data.postedBy == request.auth.uid) || isAdmin();
    }

    // Lamaran Kerja (F-06, F-21, F-22):
    match /applications/{applicationId} {
      allow read: if signedIn() && (
        resource.data.applicantUid == request.auth.uid || 
        resource.data.posterUid == request.auth.uid ||
        isAdmin()
      );
      allow create: if signedIn() 
                    && applicationId == request.resource.data.jobId + '_' + request.auth.uid
                    && request.resource.data.applicantUid == request.auth.uid
                    && request.resource.data.status == 'pending'
                    && request.resource.data.pesan is string;
      allow update: if signedIn() && (
        (
          resource.data.posterUid == request.auth.uid
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'updatedAt'])
          && request.resource.data.status in ['reviewed', 'accepted', 'rejected']
        ) || isAdmin()
      );
      allow delete: if (signedIn() && resource.data.applicantUid == request.auth.uid) || isAdmin();
    }

    // Permintaan Akses Kontak (F-10, F-21, F-22):
    match /contact_requests/{requestId} {
      allow read: if signedIn() && (
        resource.data.requesterUid == request.auth.uid || 
        resource.data.targetUid == request.auth.uid ||
        isAdmin()
      );
      allow create: if signedIn() 
                    && requestId == request.auth.uid + '_' + request.resource.data.targetUid
                    && request.resource.data.requesterUid == request.auth.uid
                    && request.resource.data.targetUid != request.auth.uid
                    && request.resource.data.status == 'pending'
                    && request.resource.data.message is string;
      allow update: if signedIn() && (
        (
          resource.data.targetUid == request.auth.uid
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'updatedAt'])
          && request.resource.data.status in ['approved', 'rejected']
        ) || isAdmin()
      );
      allow delete: if (signedIn() && resource.data.requesterUid == request.auth.uid) || isAdmin();
    }

    // Basis Data Master Alumni (Registry Whitelist F-04, F-24):
    match /alumni_registry/{alumniId} {
      allow read: if signedIn();
      allow create, delete: if isAdmin();
      allow update: if isAdmin() || (
        signedIn()
        && resource.data.isRegistered == false
        && request.resource.data.isRegistered == true
        && request.resource.data.registeredUid == request.auth.uid
        && locked(['nomorAlumni', 'prodi', 'angkatan'])
      );
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

### B. Storage Rules (Buka Firebase Console > Storage > Rules)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function signedIn() { return request.auth != null; }
    function isOwner(userId) { return signedIn() && request.auth.uid == userId; }

    // Foto Profil (Avatars):
    match /avatars/{userId}/{fileName} {
      allow read: if true;
      allow delete: if isOwner(userId);
      allow create, update: if isOwner(userId)
                    && fileName.matches('^avatar\\.(jpg|jpeg|png|webp)$')
                    && request.resource.size < 3 * 1024 * 1024
                    && request.resource.contentType.matches('image/(jpeg|png|webp)');
    }

    // Dokumen CV (CV Documents):
    match /cv_documents/{userId}/{fileName} {
      allow read: if signedIn();
      allow delete: if isOwner(userId);
      allow create, update: if isOwner(userId)
                    && fileName == 'cv.pdf'
                    && request.resource.size < 5 * 1024 * 1024
                    && request.resource.contentType == 'application/pdf';
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 3. Cara Deploy Otomatis via Firebase CLI

Jika sesi login akun pengembang telah diperbarui:
```bash
# 1. Login kembali ke akun Firebase owner
firebase login --reauth

# 2. Deploy aturan keamanan langsung ke console
firebase deploy --only firestore:rules,storage
```
Hasil verifikasi otomatis dapat dipantau di Firebase Console pada menu **Firestore > Rules > Monitor** dan **Storage > Rules**.
