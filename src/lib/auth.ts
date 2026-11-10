import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  collection, 
  query, 
  deleteDoc,
  writeBatch,
  updateDoc
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { ProdiType, UserProfile, AlumniRegistryItem } from '@/types';
import { fetchRegisteredNomorAlumniRest, fetchUserByNomorAlumniRest, fetchUserProfileRest } from '@/lib/firestoreRest';

// Hardcoded verified alumni whitelist untuk fallback & inisialisasi awal
export const VERIFIED_ALUMNI_LIST = [
  { nomorAlumni: '903452018000035', nama: 'Dary Halim', prodi: 'Animasi', angkatan: '2018', email: 'dary.halim@alumni.mmtc.ac.id' },
  { nomorAlumni: '903452019000119', nama: 'Maydian Goklas Pratama Simanjuntak', prodi: 'Animasi', angkatan: '2019', email: 'maydian.goklas@alumni.mmtc.ac.id' },
  { nomorAlumni: '903452018000189', nama: 'Farhandito Fadila', prodi: 'Animasi', angkatan: '2019', email: 'farhandito.fadila@alumni.mmtc.ac.id' },
  { nomorAlumni: 'MMTC-2018-001', nama: 'Budi Santoso', prodi: 'Animasi', angkatan: '2018', email: 'budi.santoso@alumni.mmtc.ac.id' },
  { nomorAlumni: 'MMTC-2019-042', nama: 'Siti Rahma', prodi: 'Game Design', angkatan: '2019', email: 'siti.rahmawati@alumni.mmtc.ac.id' },
  { nomorAlumni: 'MMTC-2020-103', nama: 'Andi Pratama', prodi: 'MIK', angkatan: '2020', email: 'andi.pratama@alumni.mmtc.ac.id' },
  { nomorAlumni: 'MMTC-2020-215', nama: 'Dewi Lestari', prodi: 'Matekstosi', angkatan: '2020', email: 'dewi.lestari@alumni.mmtc.ac.id' },
  { nomorAlumni: 'MMTC-2021-088', nama: 'Rian Hidayat', prodi: 'Manarita', angkatan: '2021', email: 'rian.hidayat@alumni.mmtc.ac.id' },
  { nomorAlumni: 'MMTC-2021-120', nama: 'Fajar Nugraha', prodi: 'Manaprodsi', angkatan: '2021', email: 'fajar.nugraha@alumni.mmtc.ac.id' },
  { nomorAlumni: 'MMTC-2022-015', nama: 'Maya Safitri', prodi: 'Animasi', angkatan: '2022', email: 'maya.safitri@alumni.mmtc.ac.id' },
  { nomorAlumni: 'MMTC-2022-064', nama: 'Dimas Aditya', prodi: 'Game Design', angkatan: '2022', email: 'dimas.aditya@alumni.mmtc.ac.id' },
  { nomorAlumni: 'MMTC-2023-031', nama: 'Kurniawan Eko', prodi: 'MIK', angkatan: '2023', email: 'kurniawan.eko@alumni.mmtc.ac.id' },
  { nomorAlumni: 'MMTC-2023-095', nama: 'Nadia Putri', prodi: 'Matekstosi', angkatan: '2023', email: 'nadia.putri@alumni.mmtc.ac.id' },
  { nomorAlumni: 'MMTC-2024-012', nama: 'Bayu Wicaksono', prodi: 'Manarita', angkatan: '2024', email: 'bayu.wicaksono@alumni.mmtc.ac.id' },
  { nomorAlumni: 'MMTC-2024-055', nama: 'Salsabila Rahma', prodi: 'Manaprodsi', angkatan: '2024', email: 'salsabila.rahma@alumni.mmtc.ac.id' },
];

// Normalisasi format Nomor Alumni secara tunggal dan seragam di seluruh aplikasi (F-24)
export function normalizeNomorAlumni(input: string): string {
  if (!input) return '';
  return input
    .trim()
    .replace(/\s+/g, '')
    .replace(/[/._]/g, '-')
    .toUpperCase();
}

/**
 * Mencari data master alumni di shared server DB (/api/db) dan Firestore (koleksi alumni_registry).
 */
export async function getAlumniRegistryRecord(nomor: string): Promise<AlumniRegistryItem | null> {
  const cleanNomor = normalizeNomorAlumni(nomor);
  if (!cleanNomor) return null;

  // 1. Cek di shared server DB (/api/db) terlebih dahulu
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/db?collection=alumni_registry&id=${encodeURIComponent(cleanNomor)}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const { item } = (await res.json()) as { item?: AlumniRegistryItem | null };
        if (item) {
          return { ...item, nomorAlumni: cleanNomor };
        }
      }
    } catch {
      // Fallback to Firestore
    }
  }

  // 2. Lookup langsung di Firestore koleksi alumni_registry (O(1) Document Read)
  try {
    const docRef = doc(db, 'alumni_registry', cleanNomor);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...snap.data(), nomorAlumni: snap.id } as AlumniRegistryItem;
    }
  } catch (err) {
    console.warn('Error reading alumni_registry from Firestore:', err);
  }

  // 3. Fallback ke static VERIFIED_ALUMNI_LIST jika belum ada di Firestore
  const fallback = VERIFIED_ALUMNI_LIST.find(
    (a) => normalizeNomorAlumni(a.nomorAlumni) === cleanNomor
  );
  if (fallback) {
    const match = fallback.nomorAlumni.match(/\b(20\d{2})\b/);
    const inferredAngkatan = fallback.angkatan || (match ? match[1] : '2020');
    return {
      nomorAlumni: fallback.nomorAlumni,
      namaLengkap: fallback.nama,
      prodi: fallback.prodi as ProdiType,
      angkatan: inferredAngkatan,
      isRegistered: false
    };
  }

  return null;
}

/**
 * Verifikasi Nomor Alumni & Validasi Kecocokan Nama Lengkap, Prodi, dan Tahun Angkatan secara ketat.
 * Mencegah manipulasi nomor acak dan memastikan pendaftar adalah alumni asli yang datanya sesuai.
 */
export async function verifyNomorAlumni(
  nomor: string, 
  namaLengkap?: string,
  prodi?: string,
  angkatan?: string
): Promise<{
  nomorAlumni: string;
  nama: string;
  prodi: ProdiType;
  angkatan?: string;
  isRegistered?: boolean;
  registeredUid?: string;
  nameMismatch?: boolean;
  prodiMismatch?: boolean;
  angkatanMismatch?: boolean;
  expectedProdi?: string;
  expectedAngkatan?: string;
} | null> {
  const cleanNomor = normalizeNomorAlumni(nomor);
  if (!cleanNomor) return null;

  const record = await getAlumniRegistryRecord(cleanNomor);
  if (!record) {
    return null;
  }

  // 1. Verifikasi kecocokan nama resmi (jika diisi)
  if (namaLengkap !== undefined && namaLengkap !== null && namaLengkap.trim() !== '') {
    const normInput = namaLengkap.trim().toLowerCase().replace(/\s+/g, ' ');
    const normOfficial = String(record.namaLengkap || '').trim().toLowerCase().replace(/\s+/g, ' ');

    if (normInput !== normOfficial) {
      return {
        nomorAlumni: record.nomorAlumni,
        nama: record.namaLengkap,
        prodi: record.prodi,
        angkatan: record.angkatan,
        isRegistered: record.isRegistered,
        registeredUid: record.registeredUid,
        nameMismatch: true
      };
    }
  }

  // 2. Verifikasi kecocokan program studi resmi (jika diisi)
  if (prodi !== undefined && prodi !== null && prodi.trim() !== '') {
    const normProdiInput = prodi.trim().toLowerCase();
    const normProdiOfficial = String(record.prodi || '').trim().toLowerCase();
    if (normProdiInput !== normProdiOfficial) {
      return {
        nomorAlumni: record.nomorAlumni,
        nama: record.namaLengkap,
        prodi: record.prodi,
        angkatan: record.angkatan,
        isRegistered: record.isRegistered,
        registeredUid: record.registeredUid,
        prodiMismatch: true
      };
    }
  }

  // 3. Verifikasi kecocokan tahun angkatan / lulus resmi (jika diisi)
  if (angkatan !== undefined && angkatan !== null && angkatan.trim() !== '') {
    const normAngkatanInput = angkatan.trim();
    const normAngkatanOfficial = String(record.angkatan || '').trim();
    if (normAngkatanInput !== normAngkatanOfficial) {
      return {
        nomorAlumni: record.nomorAlumni,
        nama: record.namaLengkap,
        prodi: record.prodi,
        angkatan: record.angkatan,
        isRegistered: record.isRegistered,
        registeredUid: record.registeredUid,
        angkatanMismatch: true
      };
    }
  }

  return {
    nomorAlumni: record.nomorAlumni,
    nama: record.namaLengkap,
    prodi: record.prodi,
    angkatan: record.angkatan,
    isRegistered: record.isRegistered,
    registeredUid: record.registeredUid
  };
}

// Ambil nomor alumni yang sudah terdaftar secara live
export async function getRegisteredNomorAlumni(): Promise<string[]> {
  try {
    const numbers = await fetchRegisteredNomorAlumniRest();
    if (numbers && numbers.length >= 0) {
      return numbers;
    }
  } catch (restErr) {
    console.warn('REST getRegisteredNomorAlumni fallback:', restErr);
  }

  try {
    const q = query(collection(db, 'users'));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout fetch registered alumni')), 3000)
    );
    const snap = await Promise.race([getDocs(q), timeoutPromise]);
    const registered: string[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data.nomorAlumni) {
        registered.push(String(data.nomorAlumni).toUpperCase());
      }
    });
    return registered;
  } catch (err) {
    console.warn('Could not fetch registered nomor alumni list:', err);
    return [];
  }
}

export async function registerAlumni(params: {
  email: string;
  password: string;
  nomorAlumni: string;
  namaLengkap: string;
  prodi: ProdiType;
  angkatan: string;
}): Promise<UserProfile> {
  const cleanNomor = normalizeNomorAlumni(params.nomorAlumni);
  const cleanEmail = params.email.trim().toLowerCase();

  // 1. Verifikasi nomor alumni dan kecocokan nama, prodi, dan tahun angkatan resmi terlebih dahulu
  const preVerified = await verifyNomorAlumni(cleanNomor, params.namaLengkap, params.prodi, params.angkatan);
  if (!preVerified) {
    throw new Error(
      `Nomor Alumni "${cleanNomor}" tidak terdaftar dalam database resmi alumni STMM MMTC.`
    );
  }

  if ('nameMismatch' in preVerified && preVerified.nameMismatch) {
    throw new Error(
      `Pendaftaran ditolak: Nama lengkap tidak cocok dengan data resmi nomor alumni "${cleanNomor}". Pastikan penulisan nama sesuai data akademik resmi.`
    );
  }

  if ('prodiMismatch' in preVerified && preVerified.prodiMismatch) {
    throw new Error(
      `Pendaftaran ditolak: Program Studi tidak cocok dengan data resmi nomor alumni "${cleanNomor}".`
    );
  }

  if ('angkatanMismatch' in preVerified && preVerified.angkatanMismatch) {
    throw new Error(
      `Pendaftaran ditolak: Tahun Kelulusan/Angkatan tidak cocok dengan data resmi nomor alumni "${cleanNomor}".`
    );
  }

  // 2. Inisialisasi akun Firebase Auth terlebih dahulu agar pengguna terotentikasi (request.auth != null)
  let userCredential;
  try {
    userCredential = await createUserWithEmailAndPassword(
      auth, 
      cleanEmail, 
      params.password
    );
  } catch (err: unknown) {
    const firebaseError = err as { code?: string; message?: string };
    if (firebaseError.code === 'auth/email-already-in-use') {
      // Pemulihan otomatis jika akun Auth terbuat pada percobaan sebelumnya namun profil belum tersimpan
      try {
        const signinCred = await signInWithEmailAndPassword(auth, cleanEmail, params.password);
        const existingLocalProfile = await fetchUserProfileRest(signinCred.user.uid);
        if (!existingLocalProfile) {
          userCredential = signinCred;
        } else if (normalizeNomorAlumni(existingLocalProfile.nomorAlumni) === cleanNomor) {
          // Pengguna sudah punya profil dengan nomor alumni yang sama -> langsung kembalikan profilnya!
          return existingLocalProfile;
        } else {
          await signOut(auth);
          throw new Error('Alamat email ini sudah terdaftar dan aktif. Silakan langsung Masuk (Login) ke akun Anda.');
        }
      } catch (signinErr: unknown) {
        const sErr = signinErr as { message?: string };
        if (sErr.message?.includes('aktif')) {
          throw signinErr;
        }
        throw new Error('Alamat email ini sudah terdaftar. Silakan gunakan email lain atau langsung Masuk (Login).');
      }
    } else if (firebaseError.code === 'auth/weak-password') {
      throw new Error('Password terlalu lemah. Gunakan minimal 6 karakter.');
    } else if (firebaseError.code === 'auth/invalid-email') {
      throw new Error('Format email tidak valid.');
    } else if (firebaseError.code === 'auth/network-request-failed') {
      throw new Error('Koneksi jaringan internet gagal. Periksa koneksi Anda.');
    } else if (firebaseError.code === 'auth/too-many-requests') {
      throw new Error('Terlalu banyak percobaan pendaftaran gagal. Silakan coba beberapa saat lagi.');
    } else {
      throw new Error(firebaseError.message || 'Gagal mendaftarkan akun di Firebase Auth.');
    }
  }

  const uid = userCredential.user.uid;

  // Cek ulang status klaim nomor alumni
  const verified = await verifyNomorAlumni(cleanNomor, params.namaLengkap, params.prodi, params.angkatan);
  if (!verified) {
    throw new Error(
      `Nomor Alumni "${cleanNomor}" tidak terdaftar dalam database resmi alumni STMM MMTC.`
    );
  }

  if (verified.isRegistered && verified.registeredUid && verified.registeredUid !== uid) {
    try {
      await userCredential.user.delete();
      await signOut(auth);
    } catch {
      // Ignore rollback error
    }
    throw new Error(
      `Nomor Alumni "${cleanNomor}" sudah terdaftar dengan akun lain. Silakan pilih nomor alumni lain yang tersedia atau langsung Masuk (Login).`
    );
  }

  // F-24 & F-04: Ambil prodi & angkatan resmi dari database master alumni_registry
  const officialProdi = verified.prodi || params.prodi;
  const officialAngkatan = String(verified.angkatan || params.angkatan.trim());
  const nowIso = new Date().toISOString();

  const profileData: UserProfile = {
    uid,
    email: cleanEmail,
    nomorAlumni: cleanNomor,
    namaLengkap: verified.nama || params.namaLengkap.trim(),
    prodi: officialProdi,
    angkatan: officialAngkatan,
    openToWork: true, // Aktifkan default agar langsung siap tampil di katalog talenta saat demo
    portfolio: [],
    createdAt: nowIso
  };

  const publicProfileData = {
    uid,
    nomorAlumni: cleanNomor,
    namaLengkap: profileData.namaLengkap,
    prodi: officialProdi,
    angkatan: officialAngkatan,
    openToWork: true,
    portfolio: [],
    createdAt: nowIso,
    updatedAt: nowIso
  };

  // 3. Simpan ke Shared Server DB (/api/db) agar lintas browser langsung sinkron 100%
  let savedToServerDb = false;
  if (typeof window !== 'undefined') {
    try {
      const apiRes = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'registerAlumni',
          uid,
          email: cleanEmail,
          nomorAlumni: cleanNomor,
          profileData,
          publicProfileData
        })
      });
      if (apiRes.ok) {
        savedToServerDb = true;
      }
    } catch (apiErr) {
      console.warn('Server DB register sync warning:', apiErr);
    }
  }

  // 4. Eksekusi klaim dan simpan profil ke Cloud Firestore (atomic batch commit dengan sequential fallback)
  const regRef = doc(db, 'alumni_registry', cleanNomor);
  const userRef = doc(db, 'users', uid);
  const pubRef = doc(db, 'public_profiles', uid);

  try {
    const batch = writeBatch(db);
    batch.update(regRef, {
      isRegistered: true,
      registeredUid: uid,
      registeredEmail: cleanEmail,
      registeredAt: nowIso
    });
    batch.set(userRef, profileData);
    batch.set(pubRef, publicProfileData);
    await batch.commit();
  } catch (batchErr) {
    console.warn('Batch commit fallback to sequential commit:', batchErr);
    try {
      await updateDoc(regRef, {
        isRegistered: true,
        registeredUid: uid,
        registeredEmail: cleanEmail,
        registeredAt: nowIso
      });
      await setDoc(userRef, profileData);
      await setDoc(pubRef, publicProfileData).catch((e) => console.warn('Sync pubRef in fallback failed:', e));
    } catch (commitErr: unknown) {
      // Jika sudah berhasil tersimpan di Shared Server DB (/api/db), jangan batalkan akun Auth!
      if (!savedToServerDb) {
        console.error('Registration commit failed. Rolling back created Firebase Auth user:', commitErr);
        try {
          await userCredential.user.delete();
        } catch (rollbackErr) {
          console.error('Failed to rollback created auth user:', rollbackErr);
        } finally {
          try {
            await signOut(auth);
          } catch {
            // Ignore signout error during rollback
          }
        }
        const errMsg = commitErr instanceof Error ? commitErr.message : 'Gagal menyimpan profil ke database.';
        throw new Error(`Pendaftaran tidak berhasil: ${errMsg}. Akun dibatalkan untuk menghindari akun tanpa data profil, silakan coba mendaftar kembali.`);
      }
    }
  }

  return profileData;
}

export async function loginAlumni(identifier: string, password: string): Promise<User> {
  const cleanIdentifier = identifier.trim();
  let targetEmail = cleanIdentifier.toLowerCase();

  // Jika pengguna memasukkan Nomor Alumni (misal: MMTC-2018-001)
  if (!cleanIdentifier.includes('@')) {
    const normalizedNomor = normalizeNomorAlumni(cleanIdentifier);

    // 1. PRIORITAS UTAMA: Cari email asli yang didaftarkan pengguna di Shared Server DB (/api/db) atau Cloud Firestore
    try {
      const userDoc = await fetchUserByNomorAlumniRest(normalizedNomor);
      if (userDoc?.email) {
        targetEmail = String(userDoc.email).trim().toLowerCase();
      }
    } catch (restErr: unknown) {
      console.warn('REST lookup failed in loginAlumni:', restErr);
    }

    // 2. Fallback ke VERIFIED_ALUMNI_LIST jika belum ada email kustom terdaftar
    if (!targetEmail.includes('@')) {
      const seedMatch = VERIFIED_ALUMNI_LIST.find(
        (a) => normalizeNomorAlumni(a.nomorAlumni) === normalizedNomor
      );
      if (seedMatch && 'email' in seedMatch && seedMatch.email) {
        targetEmail = seedMatch.email;
      }
    }

    // Jika masih belum berhasil ter-resolve ke format email
    if (!targetEmail.includes('@')) {
      throw new Error(`Nomor Alumni "${normalizedNomor}" belum terdaftar. Silakan daftar terlebih dahulu di halaman Registrasi atau masuk menggunakan alamat email Anda.`);
    }
  }

  // Lanjutkan autentikasi dengan email & password
  try {
    const userCredential = await signInWithEmailAndPassword(auth, targetEmail, password);
    return userCredential.user;
  } catch (err: unknown) {
    const firebaseError = err as { code?: string; message?: string };
    if (
      firebaseError.code === 'auth/wrong-password' || 
      firebaseError.code === 'auth/invalid-credential' || 
      firebaseError.code === 'auth/user-not-found'
    ) {
      throw new Error('Email/Nomor Alumni atau kata sandi tidak cocok. Silakan periksa kembali.');
    } else if (firebaseError.code === 'auth/invalid-email') {
      throw new Error('Format alamat email tidak valid. Silakan periksa kembali.');
    } else if (firebaseError.code === 'auth/user-disabled') {
      throw new Error('Akun ini telah dinonaktifkan. Silakan hubungi administrator institusi.');
    } else if (firebaseError.code === 'auth/network-request-failed') {
      throw new Error('Koneksi internet bermasalah. Periksa jaringan Anda.');
    } else if (firebaseError.code === 'auth/too-many-requests') {
      throw new Error('Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat.');
    }
    throw new Error(firebaseError.message || 'Gagal masuk. Silakan coba lagi.');
  }
}

/**
 * Mengambil semua data master alumni dari Shared Server DB (/api/db) & Firestore untuk Admin Panel.
 */
export async function getAllAlumniRegistry(): Promise<AlumniRegistryItem[]> {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/db?collection=alumni_registry', { cache: 'no-store' });
      if (res.ok) {
        const { items } = (await res.json()) as { items?: AlumniRegistryItem[] };
        if (Array.isArray(items) && items.length > 0) {
          return items.sort((a, b) => String(a.nomorAlumni || '').localeCompare(String(b.nomorAlumni || '')));
        }
      }
    } catch {
      // Fallback to Firestore
    }
  }

  try {
    const q = query(collection(db, 'alumni_registry'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const items = snap.docs.map(d => {
        const raw = d.data();
        return {
          ...raw,
          id: d.id,
          nomorAlumni: String(raw.nomorAlumni || d.id),
          namaLengkap: String(raw.namaLengkap || ''),
          prodi: (raw.prodi as ProdiType) || 'Animasi',
          angkatan: String(raw.angkatan || ''),
          isRegistered: Boolean(raw.isRegistered)
        } as AlumniRegistryItem;
      });
      items.sort((a, b) => String(a.nomorAlumni || '').localeCompare(String(b.nomorAlumni || '')));
      return items;
    }
    return [];
  } catch (err) {
    console.warn('getAllAlumniRegistry Firestore error:', err);
    return [];
  }
}

/**
 * Menambahkan data alumni baru ke database master oleh Admin.
 */
export async function addAlumniToRegistry(data: {
  nomorAlumni: string;
  namaLengkap: string;
  prodi: ProdiType;
  angkatan: string;
}): Promise<void> {
  const cleanNomor = normalizeNomorAlumni(data.nomorAlumni);
  const record = {
    nomorAlumni: cleanNomor,
    namaLengkap: data.namaLengkap.trim(),
    prodi: data.prodi,
    angkatan: data.angkatan.trim(),
    isRegistered: false,
    createdAt: new Date().toISOString()
  };

  if (typeof window !== 'undefined') {
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'setDoc',
        collection: 'alumni_registry',
        id: cleanNomor,
        data: record,
        merge: true
      })
    }).catch(() => {});
  }

  const regRef = doc(db, 'alumni_registry', cleanNomor);
  await setDoc(regRef, record).catch(() => {});
}

/**
 * Menghapus data alumni dari database master oleh Admin.
 */
export async function deleteAlumniFromRegistry(nomorAlumni: string): Promise<void> {
  const cleanNomor = normalizeNomorAlumni(nomorAlumni);
  if (typeof window !== 'undefined') {
    await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deleteDoc',
        collection: 'alumni_registry',
        id: cleanNomor
      })
    }).catch(() => {});
  }
  await deleteDoc(doc(db, 'alumni_registry', cleanNomor)).catch(() => {});
}

/**
 * Initial seed data dinonaktifkan demi integritas master data (F2-05).
 */
export async function seedAlumniRegistry(): Promise<number> {
  throw new Error('Fungsi seedAlumniRegistry telah dinonaktifkan demi keamanan integritas basis data master alumni.');
}
