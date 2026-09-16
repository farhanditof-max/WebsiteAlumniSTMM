import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  query, 
  where, 
  orderBy, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { JobPosting, JobApplication, ProdiType } from '@/types';

import { fetchJobsRest } from '@/lib/firestoreRest';

// Helper timeout race
const withTimeout = <T>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms)
  );
  return Promise.race([promise, timeoutPromise]);
};

// Ambil semua lowongan aktif (bisa difilter prodi)
export async function getJobs(filterProdi?: ProdiType): Promise<JobPosting[]> {
  // 1. Coba REST API terlebih dahulu (sangat cepat ~100ms & tidak pernah hang)
  try {
    const restJobs = await fetchJobsRest();
    if (restJobs && restJobs.length > 0) {
      let jobs = restJobs as JobPosting[];
      if (filterProdi) {
        jobs = jobs.filter(j => j.prodiTarget?.includes(filterProdi));
      }
      return jobs;
    }
  } catch (restErr) {
    console.warn('REST getJobs failed, falling back to Firestore SDK:', restErr);
  }

  try {
    const jobsRef = collection(db, 'jobs');
    const q = query(jobsRef, orderBy('createdAt', 'desc'));
    
    let snap;
    try {
      snap = await withTimeout(getDocs(q), 3000, 'Jobs query timeout');
    } catch (queryErr) {
      console.warn('Ordered query failed or timed out, trying plain query with timeout:', queryErr);
      try {
        snap = await withTimeout(getDocs(jobsRef), 3000, 'Plain jobs query timeout');
      } catch (fallbackErr) {
        console.warn('Plain query also failed or timed out:', fallbackErr);
        return [];
      }
    }

    let jobs = snap.docs.map(d => ({ id: d.id, ...d.data() } as JobPosting));

    // Ensure strict chronological sort even if fallback plain query was used
    jobs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    if (filterProdi) {
      jobs = jobs.filter(j => j.prodiTarget?.includes(filterProdi));
    }
    return jobs;
  } catch (err) {
    console.error('Error getJobs:', err);
    return [];
  }
}

// Buat lowongan baru
export async function createJob(jobData: Omit<JobPosting, 'id' | 'createdAt' | 'status'>): Promise<JobPosting> {
  const rawJob: Record<string, unknown> = {
    ...jobData,
    status: 'active' as const,
    createdAt: new Date().toISOString()
  };

  // Firestore throws error on undefined values, remove them
  const newJob = Object.fromEntries(
    Object.entries(rawJob).filter(([, v]) => v !== undefined)
  );

  const docPromise = addDoc(collection(db, 'jobs'), newJob);
  const docRef = await withTimeout(docPromise, 7000, 'Koneksi timeout saat mempublikasikan lowongan');
  return { id: docRef.id, ...newJob } as unknown as JobPosting;
}

// Kirim lamaran kerja
export async function applyJob(applicationData: Omit<JobApplication, 'id' | 'appliedAt' | 'status'>): Promise<JobApplication> {
  // Cek apakah pelamar sudah pernah mendaftar posisi ini
  try {
    const qCheck = query(
      collection(db, 'applications'),
      where('jobId', '==', applicationData.jobId),
      where('applicantUid', '==', applicationData.applicantUid)
    );
    const existingSnap = await withTimeout(getDocs(qCheck), 3000, 'Check duplicate timeout');
    if (!existingSnap.empty) {
      throw new Error('Anda sudah pernah mengirimkan lamaran untuk lowongan ini. Silakan pantau status di menu Lamaran Saya.');
    }
  } catch (checkErr: unknown) {
    if (checkErr instanceof Error && checkErr.message.includes('sudah pernah')) {
      throw checkErr;
    }
    // Jika timeout check, lanjutkan pengiriman secara non-blocking
  }

  const rawApp: Record<string, unknown> = {
    ...applicationData,
    status: 'pending' as const,
    appliedAt: new Date().toISOString()
  };

  const newApp = Object.fromEntries(
    Object.entries(rawApp).filter(([, v]) => v !== undefined)
  );

  const docPromise = addDoc(collection(db, 'applications'), newApp);
  const docRef = await withTimeout(docPromise, 7000, 'Koneksi timeout saat mengirim lamaran');
  return { id: docRef.id, ...newApp } as unknown as JobApplication;
}

// Ambil lamaran yang masuk untuk lowongan user
export async function getReceivedApplications(posterUid: string): Promise<JobApplication[]> {
  try {
    const q = query(collection(db, 'applications'), where('posterUid', '==', posterUid));
    const snap = await withTimeout(getDocs(q), 5000, 'Received applications timeout');
    const apps = snap.docs.map(d => ({ id: d.id, ...d.data() } as JobApplication));
    apps.sort((a, b) => (b.appliedAt || '').localeCompare(a.appliedAt || ''));
    return apps;
  } catch (err) {
    console.warn('getReceivedApplications timed out or failed:', err);
    return [];
  }
}

// Ambil lamaran yang diajukan oleh user
export async function getMyApplications(applicantUid: string): Promise<JobApplication[]> {
  try {
    const q = query(collection(db, 'applications'), where('applicantUid', '==', applicantUid));
    const snap = await withTimeout(getDocs(q), 5000, 'My applications timeout');
    const apps = snap.docs.map(d => ({ id: d.id, ...d.data() } as JobApplication));
    apps.sort((a, b) => (b.appliedAt || '').localeCompare(a.appliedAt || ''));
    return apps;
  } catch (err) {
    console.warn('getMyApplications timed out or failed:', err);
    return [];
  }
}

// Update status lamaran (dilakukan oleh pemilik lowongan)
export async function updateApplicationStatus(
  applicationId: string, 
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected'
): Promise<void> {
  const docRef = doc(db, 'applications', applicationId);
  await withTimeout(
    updateDoc(docRef, { status, updatedAt: new Date().toISOString() }),
    5000,
    'Koneksi timeout saat memperbarui status lamaran'
  );
}
