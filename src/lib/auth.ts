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
  where,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { ProdiType, UserProfile, AlumniRegistryItem } from '@/types';

// Hardcoded verified alumni whitelist untuk fallback & inisialisasi awal
export const VERIFIED_ALUMNI_LIST = [
  { nomorAlumni: 'MMTC-2018-001', nama: 'Budi Santoso', prodi: 'Animasi', status: 'terdaftar' },
  { nomorAlumni: 'MMTC-2019-042', nama: 'Siti Rahma', prodi: 'Game Design' },
  { nomorAlumni: 'MMTC-2020-103', nama: 'Andi Pratama', prodi: 'MIK' },
  { nomorAlumni: 'MMTC-2020-215', nama: 'Dewi Lestari', prodi: 'Matekstosi' },
  { nomorAlumni: 'MMTC-2021-088', nama: 'Rian Hidayat', prodi: 'Manarita' },
  { nomorAlumni: 'MMTC-2021-120', nama: 'Fajar Nugraha', prodi: 'Manaprodsi' },
  { nomorAlumni: 'MMTC-2022-015', nama: 'Maya Safitri', prodi: 'Animasi' },
  { nomorAlumni: 'MMTC-2022-064', nama: 'Dimas Aditya', prodi: 'Game Design' },
  { nomorAlumni: 'MMTC-2023-031', nama: 'Kurniawan Eko', prodi: 'MIK' },
  { nomorAlumni: 'MMTC-2023-095', nama: 'Nadia Putri', prodi: 'Matekstosi' },
  { nomorAlumni: 'MMTC-2024-012', nama: 'Bayu Wicaksono', prodi: 'Manarita' },
  { nomorAlumni: 'MMTC-2024-055', nama: 'Salsabila Rahma', prodi: 'Manaprodsi' },
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
 * Mencari data master alumni di Firestore (koleksi alumni_registry).
 */
export async function getAlumniRegistryRecord(nomor: string): Promise<AlumniRegistryItem | null> {
  const cleanNomor = normalizeNomorAlumni(nomor);
  if (!cleanNomor) return null;

  // Lookup langsung di Firestore koleksi alumni_registry (O(1) Document Read)
  try {
    const docRef = doc(db, 'alumni_registry', cleanNomor);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...snap.data(), nomorAlumni: snap.id } as AlumniRegistryItem;
    }
  } catch (err) {
    console.warn('Error reading alumni_registry from Firestore:', err);
  }

  return null;
}

/**
 * Verifikasi Nomor Alumni & Validasi Kecocokan Nama Lengkap secara ketat.
 * Mencegah manipulasi nomor acak dan memastikan pendaftar adalah alumni asli.
 */
export async function verifyNomorAlumni(nomor: string, namaLengkap?: string): Promise<{
  nomorAlumni: string;
  nama: string;
  prodi: ProdiType;
  angkatan?: string;
  isRegistered?: boolean;
  nameMismatch?: boolean;
} | null> {
  const cleanNomor = normalizeNomorAlumni(nomor);
  if (!cleanNomor) return null;

  const record = await getAlumniRegistryRecord(cleanNomor);
  if (!record) {
    // Nomor tidak terdaftar sama sekali di database resmi!
    return null;
  }

  // Jika nama lengkap diberikan (saat registrasi), verifikasi kecocokan nama resmi!
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
        nameMismatch: true
      };
    }
  }

  return {
    nomorAlumni: record.nomorAlumni,
    nama: record.namaLengkap,
    prodi: record.prodi,
    angkatan: record.angkatan,
    isRegistered: record.isRegistered
  };
}

import { fetchRegisteredNomorAlumniRest, fetchUserByNomorAlumniRest } from '@/lib/firestoreRest';

// Ambil nomor alumni yang sudah terdaftar di Firestore secara live
export async function getRegisteredNomorAlumni(): Promise<string[]> {
  try {
    const numbers = await fetchRegisteredNomorAlumniRest();
    if (numbers && numbers.length > 0) {
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
    return ['MMTC-2018-001'];
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
  const cleanNomor = params.nomorAlumni
    .trim()
    .replace(/\s+/g, '')
    .replace(/[/._]/g, '-')
    .toUpperCase();
  const verified = await verifyNomorAlumni(cleanNomor, params.namaLengkap);
  if (!verified) {
    throw new Error(
      `Nomor Alumni "${cleanNomor}" tidak terdaftar dalam database resmi alumni STMM MMTC.`
    );
  }
  if ('nameMismatch' in verified && verified.nameMismatch) {
    throw new Error(
      `Nama lengkap "${params.namaLengkap}" tidak cocok dengan nama terdaftar untuk nomor alumni "${cleanNomor}". Pastikan penulisan nama sesuai data akademik resmi.`
    );
  }

  // Cek apakah nomor alumni sudah pernah dipakai daftar (REST terarah + SDK fallback)
  let isAlreadyRegistered = false;
  let verifiedUniqueness = false;

  try {
    const restUser = await fetchUserByNomorAlumniRest(cleanNomor);
    if (restUser) {
      isAlreadyRegistered = true;
    }
    verifiedUniqueness = true;
  } catch (checkErr) {
    console.warn('REST duplicate check error, falling back to SDK:', checkErr);
  }

  if (!verifiedUniqueness) {
    try {
      const q = query(
        collection(db, 'users'), 
        where('nomorAlumni', '==', cleanNomor)
      );
      const snapPromise = getDocs(q);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Batas waktu pemeriksaan Nomor Alumni terlampaui')), 4000)
      );
      const snap = await Promise.race([snapPromise, timeoutPromise]);
      if (!snap.empty) {
        isAlreadyRegistered = true;
      }
      verifiedUniqueness = true;
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Batas waktu')) {
        throw new Error('Gagal memeriksa status Nomor Alumni karena batas waktu koneksi terlampaui. Silakan periksa koneksi internet Anda dan coba lagi.');
      }
      console.error('Error verifying nomor alumni duplicate:', err);
      throw new Error('Gagal memverifikasi keunikan Nomor Alumni. Silakan coba beberapa saat lagi.');
    }
  }

  if (isAlreadyRegistered) {
    throw new Error(`Nomor Alumni "${cleanNomor}" sudah terdaftar dengan akun lain. Silakan pilih nomor alumni lain yang tersedia atau langsung Masuk (Login).`);
  }

  const cleanEmail = params.email.trim().toLowerCase();

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
      throw new Error('Alamat email ini sudah terdaftar. Silakan gunakan email lain atau langsung Masuk (Login).');
    } else if (firebaseError.code === 'auth/weak-password') {
      throw new Error('Password terlalu lemah. Gunakan minimal 6 karakter.');
    } else if (firebaseError.code === 'auth/invalid-email') {
      throw new Error('Format email tidak valid.');
    } else if (firebaseError.code === 'auth/network-request-failed') {
      throw new Error('Koneksi jaringan internet gagal. Periksa koneksi Anda.');
    } else if (firebaseError.code === 'auth/too-many-requests') {
      throw new Error('Terlalu banyak percobaan pendaftaran gagal. Silakan coba beberapa saat lagi.');
    }
    throw new Error(firebaseError.message || 'Gagal mendaftarkan akun di Firebase Auth.');
  }

  const uid = userCredential.user.uid;

  // F-24 & F-04: Ambil prodi & angkatan resmi dari database master alumni_registry
  const officialProdi = verified.prodi || params.prodi;
  const officialAngkatan = verified.angkatan || params.angkatan.trim();

  const profileData: UserProfile = {
    uid,
    email: cleanEmail,
    nomorAlumni: cleanNomor,
    namaLengkap: verified.nama || params.namaLengkap.trim(),
    prodi: officialProdi,
    angkatan: officialAngkatan,
    openToWork: false, // F-25: Default mati untuk melindungi privasi alumni baru
    portfolio: [],
    createdAt: new Date().toISOString()
  };

  try {
    const setPromise = setDoc(doc(db, 'users', uid), profileData, { merge: true });
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Koneksi timeout saat menyimpan data profil alumni ke database')), 6000)
    );
    await Promise.race([setPromise, timeoutPromise]);
  } catch (err: unknown) {
    console.error('Firestore setDoc failed or timed out in registerAlumni. Rolling back Firebase Auth user:', err);
    try {
      if (userCredential && userCredential.user) {
        await userCredential.user.delete();
      }
    } catch (rollbackErr) {
      console.error('Failed to rollback created auth user:', rollbackErr);
    } finally {
      try {
        await signOut(auth);
      } catch {
        // Ignore signout error during rollback
      }
    }
    const errMsg = err instanceof Error ? err.message : 'Gagal menyimpan profil ke database.';
    throw new Error(`Pendaftaran tidak berhasil: ${errMsg}. Akun dibatalkan untuk menghindari akun tanpa data profil, silakan coba mendaftar kembali.`);
  }

  // F-24: Tandai di database alumni_registry bahwa nomor ini sudah diklaim
  // PENTING: DILARANG menimpa namaLengkap, prodi, atau angkatan di alumni_registry dengan input form!
  try {
    const regRef = doc(db, 'alumni_registry', cleanNomor);
    await setDoc(regRef, {
      isRegistered: true,
      registeredUid: uid,
      registeredAt: new Date().toISOString()
    }, { merge: true });
  } catch (regErr) {
    console.warn('Could not update alumni_registry claim status:', regErr);
  }

  return profileData;
}

export async function loginAlumni(identifier: string, password: string): Promise<User> {
  const cleanIdentifier = identifier.trim();
  let targetEmail = cleanIdentifier.toLowerCase();

  // Jika user memasukkan Nomor Alumni, bukan email
  if (!cleanIdentifier.includes('@')) {
    const normalizedNomor = cleanIdentifier
      .replace(/\s+/g, '')
      .replace(/[/._]/g, '-')
      .toUpperCase();

    // 1. Coba REST API terlebih dahulu (~50ms)
    let foundEmail: string | null = null;
    let restSuccess = false;

    try {
      const userDoc = await fetchUserByNomorAlumniRest(normalizedNomor);
      restSuccess = true;
      if (userDoc?.email) {
        foundEmail = String(userDoc.email).trim().toLowerCase();
      }
    } catch (restErr: unknown) {
      console.warn('REST lookup failed in loginAlumni, falling back to SDK:', restErr);
    }

    if (foundEmail) {
      targetEmail = foundEmail;
    } else if (restSuccess) {
      // REST berhasil menghubungi server tapi user memang tidak ditemukan
      throw new Error(`Nomor Alumni "${normalizedNomor}" tidak ditemukan dalam database terdaftar. Silakan daftar terlebih dahulu atau gunakan email.`);
    } else {
      // Fallback ke Firestore SDK dengan timeout ketat
      try {
        const q = query(
          collection(db, 'users'), 
          where('nomorAlumni', '==', normalizedNomor)
        );
        const snapPromise = getDocs(q);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Koneksi timeout saat mencari Nomor Alumni')), 3000)
        );
        const snap = await Promise.race([snapPromise, timeoutPromise]);
        if (snap.empty) {
          throw new Error(`Nomor Alumni "${normalizedNomor}" tidak ditemukan dalam database terdaftar. Silakan daftar terlebih dahulu atau gunakan email.`);
        }
        const fetchedEmail = snap.docs[0].data().email;
        if (!fetchedEmail) {
          throw new Error('Data email alumni tidak ditemukan.');
        }
        targetEmail = String(fetchedEmail).trim().toLowerCase();
      } catch (sdkErr: unknown) {
        if (sdkErr instanceof Error && sdkErr.message.includes('tidak ditemukan')) {
          throw sdkErr;
        }
        console.error('Error fetching alumni email by nomor:', sdkErr);
        throw new Error('Gagal menemukan data akun dari Nomor Alumni. Pastikan nomor benar atau gunakan email untuk login.');
      }
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
    } else if (firebaseError.code === 'auth/network-request-failed') {
      throw new Error('Koneksi internet bermasalah. Periksa jaringan Anda.');
    } else if (firebaseError.code === 'auth/too-many-requests') {
      throw new Error('Terlalu banyak percobaan gagal. Silakan tunggu beberapa saat.');
    }
    throw new Error(firebaseError.message || 'Gagal masuk. Silakan coba lagi.');
  }
}

/**
 * Mengambil semua data master alumni dari Firestore untuk Admin Panel.
 * F-20 & F-21: Type-guarded dan ID terisolasi.
 */
export async function getAllAlumniRegistry(): Promise<AlumniRegistryItem[]> {
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

  const regRef = doc(db, 'alumni_registry', cleanNomor);
  await setDoc(regRef, {
    nomorAlumni: cleanNomor,
    namaLengkap: data.namaLengkap.trim(),
    prodi: data.prodi,
    angkatan: data.angkatan.trim(),
    isRegistered: false,
    createdAt: new Date().toISOString()
  });
}

/**
 * Menghapus data alumni dari database master oleh Admin.
 */
export async function deleteAlumniFromRegistry(nomorAlumni: string): Promise<void> {
  const cleanNomor = normalizeNomorAlumni(nomorAlumni);
  await deleteDoc(doc(db, 'alumni_registry', cleanNomor));
}

/**
 * Melakukan initial seed data (memasukkan 12 data dummy ke Firestore alumni_registry).
 */
export async function seedAlumniRegistry(): Promise<number> {
  let count = 0;
  for (const item of VERIFIED_ALUMNI_LIST) {
    const parts = item.nomorAlumni.split('-');
    const angkatan = parts.length >= 2 ? parts[1] : '2020';
    const regRef = doc(db, 'alumni_registry', item.nomorAlumni);
    await setDoc(regRef, {
      nomorAlumni: item.nomorAlumni,
      namaLengkap: item.nama,
      prodi: item.prodi,
      angkatan,
      isRegistered: item.status === 'terdaftar',
      createdAt: new Date().toISOString()
    }, { merge: true });
    count++;
  }
  return count;
}

