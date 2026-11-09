# 🔒 Status & Dokumentasi Security Rules: Firebase Console vs Repository

Dokumen ini disusun untuk memenuhi sinkronisasi aturan keamanan antara **Firebase Console (Production)** dan **Repository Lokal (irestore.rules & storage.rules)**.

---

## 1. Ringkasan Status & Perbandingan

| Parameter | Aturan di Firebase Console (Sebelum Hardening) | Aturan di Repo Saat Ini (irestore.rules & storage.rules) | Status Mitigasi |
| :--- | :--- | :--- | :--- |
| **users/{userId}** | llow read, write: if request.auth != null; (Permissive) | Read dibatasi pemilik/admin; create melarang ole: 'admin' dan wajib validasi ke lumni_registry; update mengunci 6 field krusial (
omorAlumni, prodi, dll); delete hanya admin. | ✅ **F-01, F-02, F-08, F-20, F-22 Terselesaikan** |
| **public_profiles** | Belum ada (Semua data PII langsung terekspos dari users) | llow read: if true; allow write: if isAdmin(); (Mirror whitelist oleh Cloud Function / Admin). | ✅ **F-02 UU PDP Terselesaikan** |
| **jobs/{jobId}** | Tidak ada validasi postedBy == request.auth.uid | Mengunci permanen postedBy ke UID pembuat; validasi tipe data (is string, is list); update mengunci postedBy dan createdAt. | ✅ **F-05, F-20 Terselesaikan** |
| **applications** | ID dokumen acak; tidak ada validasi relasi job-pelamar | **Deterministic ID** ${jobId}_; relasi posterUid diverifikasi ke lowongan; poster hanya boleh ubah status in ['reviewed','accepted','rejected'] dan dilarang merusak pesan pelamar; delete dikunci hanya saat pending. | ✅ **F-06, F-21, F-22, F4-02 Terselesaikan** |
| **contact_requests**| Siapa saja bisa menimpa pesan | **Deterministic ID** ${requesterUid}_; target hanya boleh update status in ['approved','rejected']; delete dikunci hanya saat pending. | ✅ **F-10, F-21, F-22, F4-02 Terselesaikan** |
| **alumni_registry** | Tidak terkunci atau readable publik | Read get untuk signedIn, list/create/delete untuk admin; klaim hanya 1 kali per akun dan field identitas permanen terkunci. | ✅ **F-04, F-24, F2-03 Terselesaikan** |
| **Storage: avatars** | Evaluasi delete gagal (equest.resource == null); menerima file SVG (XSS) | Pemisahan delete dari create/update; regex nama file vatar.(jpg|jpeg|png|webp); SVG ditolak; batas 3MB. | ✅ **F-03, F-12, F-23 Terselesaikan** |
| **Storage: CV** | File dinamis bisa ditimpa / readable publik | Read dikunci hanya untuk owner & admin; nama file statis cv.pdf; batas 5MB; MIME dikunci pplication/pdf. | ✅ **F-03, F-23, F2-04 Terselesaikan** |

---

## 2. Salinan Rules Siap Pakai untuk Firebase Console

Bagi administrator institusi atau repo owner (arhanditof-max), silakan salin aturan berikut langsung ke tab **Rules** di Firebase Console:

### A. Firestore Rules (Buka Firebase Console > Firestore Database > Rules)
`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn()   { return request.auth != null; }
    function isAdmin()    {
      return signedIn() && (
        ('admin' in request.auth.token && request.auth.token.admin == true) ||
        ('role' in request.auth.token && request.auth.token.role == 'admin')
      );
    }
    function isOwner(uid) { return signedIn() && request.auth.uid == uid; }
    function locked(keys) {
      return !request.resource.data.diff(resource.data).affectedKeys().hasAny(keys);
    }

    // Profil Alumni Privat (F-01, F-02, F-08, F-20, F-22):
    // Data privat dibaca hanya oleh pemilik atau admin. Data publik dilayani melalui public_profiles.
    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow create: if isOwner(userId)
                    && request.resource.data.uid == userId
                    && (!request.resource.data.keys().hasAny(['role']) || request.resource.data.role != 'admin')
                    && request.resource.data.namaLengkap is string
                    && request.resource.data.nomorAlumni is string
                    && exists(/databases/$(database)/documents/alumni_registry/$(request.resource.data.nomorAlumni))
                    && get(/databases/$(database)/documents/alumni_registry/$(request.resource.data.nomorAlumni)).data.isRegistered == true
                    && get(/databases/$(database)/documents/alumni_registry/$(request.resource.data.nomorAlumni)).data.registeredUid == userId
                    && request.resource.data.prodi == get(/databases/$(database)/documents/alumni_registry/$(request.resource.data.nomorAlumni)).data.prodi
                    && request.resource.data.angkatan == get(/databases/$(database)/documents/alumni_registry/$(request.resource.data.nomorAlumni)).data.angkatan;
      allow update: if (isOwner(userId)
                    && locked(['role', 'uid', 'nomorAlumni', 'createdAt', 'prodi', 'angkatan'])
                    && request.resource.data.namaLengkap is string
                    && (request.resource.data.openToWork is bool || !request.resource.data.keys().hasAny(['openToWork']))
                    && (!request.resource.data.keys().hasAny(['portfolio']) || (request.resource.data.portfolio is list && request.resource.data.portfolio.size() <= 12))
                    ) || isAdmin();
      allow delete: if isAdmin();
    }

    // Profil Publik Mirror (F-02 Whitelist):
    // Dibaca publik, ditulis hanya oleh Admin atau Cloud Function trigger.
    match /public_profiles/{userId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Lowongan Kerja (F-05, F-20, F-22):
    // postedBy terikat permanen ke request.auth.uid, validasi tipe data ketat.
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
                    && request.resource.data.perusahaan is string
                    && request.resource.data.lokasi is string
                    && request.resource.data.deskripsi is string
                    && request.resource.data.prodiTarget is list
                    && request.resource.data.kualifikasi is list
                    ) || isAdmin();
      allow delete: if (signedIn() && resource.data.postedBy == request.auth.uid) || isAdmin();
    }

    // Lamaran Kerja (F-06, F-21, F-22, F4-02):
    // Deterministic ID: jobId_applicantUid untuk mencegah duplicate spam & race condition.
    match /applications/{applicationId} {
      allow read: if signedIn() && (
        resource.data.applicantUid == request.auth.uid || 
        resource.data.posterUid == request.auth.uid ||
        isAdmin()
      );
      allow create: if signedIn() 
                    && applicationId == request.resource.data.jobId + '_' + request.auth.uid
                    && request.resource.data.applicantUid == request.auth.uid
                    && (!exists(/databases/$(database)/documents/jobs/$(request.resource.data.jobId)) || request.resource.data.posterUid == get(/databases/$(database)/documents/jobs/$(request.resource.data.jobId)).data.postedBy)
                    && request.resource.data.status == 'pending'
                    && request.resource.data.pesan is string;
      allow update: if signedIn() && (
        (
          resource.data.posterUid == request.auth.uid
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'updatedAt'])
          && request.resource.data.status in ['reviewed', 'accepted', 'rejected']
        ) || isAdmin()
      );
      allow delete: if (signedIn() && resource.data.applicantUid == request.auth.uid && resource.data.status == 'pending') || isAdmin();
    }

    // Permintaan Akses Kontak (F-10, F-21, F-22, F4-02):
    // Deterministic ID: requesterUid_targetUid
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
          && (
            request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'updatedAt']) ||
            request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'updatedAt', 'targetPhone', 'targetEmail'])
          )
          && request.resource.data.status in ['approved', 'rejected']
        ) || isAdmin()
      );
      allow delete: if (signedIn() && resource.data.requesterUid == request.auth.uid && resource.data.status == 'pending') || isAdmin();
    }

    // Basis Data Master Alumni (Registry Whitelist F-04, F-24, F2-03):
    match /alumni_registry/{alumniId} {
      allow get: if signedIn();
      allow list, create, delete: if isAdmin();

      allow update: if isAdmin() || (
        signedIn()
        && resource.data.isRegistered == false
        && request.resource.data.isRegistered == true
        && request.resource.data.registeredUid == request.auth.uid
        && locked(['nomorAlumni', 'namaLengkap', 'prodi', 'angkatan', 'createdAt'])
        && !exists(/databases/$(database)/documents/users/$(request.auth.uid))
      );
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}

`

---

### B. Storage Rules (Buka Firebase Console > Storage > Rules)
`javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function signedIn() { return request.auth != null; }
    function isOwner(userId) { return signedIn() && request.auth.uid == userId; }

    // Foto Profil (Avatars):
    // F-03 & F-23: Pisahkan operasi delete dari create/update.
    // Menolak SVG (vektor XSS), batasi ukuran maksimal 3MB, dan nama file tetap untuk mencegah storage flooding.
    match /avatars/{userId}/{fileName} {
      allow read: if true;
      allow delete: if isOwner(userId);
      allow create, update: if isOwner(userId)
                    && fileName.matches('^avatar\\.(jpg|jpeg|png|webp)$')
                    && request.resource.size < 3 * 1024 * 1024
                    && request.resource.contentType.matches('image/(jpeg|png|webp)');
    }

    // Dokumen CV (CV Documents):
    // F-03, F-23, F2-04: Membatasi izin baca hanya untuk pemilik akun dan admin, format PDF maks 5MB dengan nama tetap cv.pdf.
    match /cv_documents/{userId}/{fileName} {
      allow read: if isOwner(userId) || (signedIn() && (
        ('admin' in request.auth.token && request.auth.token.admin == true) ||
        ('role' in request.auth.token && request.auth.token.role == 'admin')
      ));
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

`

---

## 3. Cara Deploy Otomatis via Firebase CLI

Jika sesi login akun pengembang telah diperbarui:
`ash
# 1. Login kembali ke akun Firebase owner
firebase login --reauth

# 2. Deploy aturan keamanan langsung ke console
firebase deploy --only firestore:rules,storage
`
Hasil verifikasi otomatis dapat dipantau di Firebase Console pada menu **Firestore > Rules > Monitor** dan **Storage > Rules**.