import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDocs, 
  collection, 
  query, 
  where 
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { ProdiType, UserProfile } from '@/types';

// Hardcoded verified alumni whitelist untuk MVP & testing
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

export async function verifyNomorAlumni(nomor: string) {
  const cleanNomor = nomor
    .trim()
    .replace(/\s+/g, '')
    .replace(/[/._]/g, '-')
    .toUpperCase();
  // 1. Cek kecocokan di database whitelist
  const found = VERIFIED_ALUMNI_LIST.find(
    (a) => a.nomorAlumni.toUpperCase() === cleanNomor
  );
  if (found) return found;

  // 2. Format validasi standar MMTC (MMTC-YYYY-XXX atau STMM-YYYY-XXX, 1-5 digit nomor urut)
  const standardPattern = /^(MMTC|STMM)-\d{4}-\d{1,5}$/i;
  if (standardPattern.test(cleanNomor)) {
    return {
      nomorAlumni: cleanNomor,
      nama: '',
      prodi: 'Animasi' as ProdiType
    };
  }

  return null;
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
  const verified = await verifyNomorAlumni(cleanNomor);
  if (!verified) {
    throw new Error(
      'Format Nomor Alumni tidak valid. Gunakan format MMTC-YYYY-XXX (contoh: MMTC-2022-015) atau pilih dari daftar yang tersedia.'
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

  const profileData: UserProfile = {
    uid,
    email: cleanEmail,
    nomorAlumni: cleanNomor,
    namaLengkap: params.namaLengkap.trim(),
    prodi: params.prodi,
    angkatan: params.angkatan.trim(),
    openToWork: true,
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
