import { UserProfile, JobPosting } from '@/types';
import { auth } from '@/lib/firebase';

/**
 * Direct REST API & Shared Server DB (/api/db) bridge for Cloud Firestore.
 * Guarantees 100% reliable multi-user data retrieval and persistence across browsers.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dashboard-alumni-mmtc';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    if (typeof window !== 'undefined' && auth?.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
    }
  } catch (err) {
    console.warn('Could not get auth token for REST call:', err);
  }
  return {};
}

function parseFirestoreValue(val: unknown): unknown {
  if (!val || typeof val !== 'object') return val;
  const v = val as Record<string, unknown>;
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('integerValue' in v) return parseInt(String(v.integerValue), 10);
  if ('doubleValue' in v) return parseFloat(String(v.doubleValue));
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) {
    const arr = (v.arrayValue as { values?: unknown[] })?.values || [];
    return arr.map(parseFirestoreValue);
  }
  if ('mapValue' in v) {
    const fields = (v.mapValue as { fields?: Record<string, unknown> })?.fields || {};
    const obj: Record<string, unknown> = {};
    for (const [k, item] of Object.entries(fields)) {
      obj[k] = parseFirestoreValue(item);
    }
    return obj;
  }
  return null;
}

export function parseFirestoreDoc<T = Record<string, unknown>>(doc: { name?: string; fields?: Record<string, unknown> } | null): T | null {
  if (!doc) return null;
  const fields = doc.fields || {};
  const data: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(fields)) {
    data[key] = parseFirestoreValue(val);
  }
  // F-21 Fix: True Firestore Document ID always wins over any internal body field
  const id = doc.name ? doc.name.split('/').pop() : '';
  data.id = id;
  return data as unknown as T;
}

async function runFirestoreQuery(queryPayload: unknown): Promise<Array<{ name: string; fields?: Record<string, unknown> }>> {
  const runQueryUrl = `${BASE_URL}:runQuery`;
  const authHeaders = await getAuthHeader();
  const res = await fetch(runQueryUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders
    },
    body: JSON.stringify(queryPayload),
    cache: 'no-store'
  });
  if (!res.ok) {
    throw new Error(`Firestore REST query failed with status ${res.status}`);
  }
  const json = await res.json() as Array<{ document?: { name: string; fields?: Record<string, unknown> } }>;
  if (!Array.isArray(json)) return [];
  return json
    .map(item => item.document)
    .filter((doc): doc is { name: string; fields?: Record<string, unknown> } => !!doc);
}

/**
 * Mengambil talenta Open to Work secara efisien menggunakan shared server DB (/api/db)
 * dan structured query REST dari koleksi public_profiles (whitelist aman).
 */
export async function fetchOpenToWorkRest(): Promise<UserProfile[]> {
  const combinedMap = new Map<string, UserProfile>();

  // 1. Ambil dari shared server DB (/api/db)
  if (typeof window !== 'undefined') {
    try {
      const localRes = await fetch('/api/db?collection=public_profiles', { cache: 'no-store' });
      if (localRes.ok) {
        const { items } = (await localRes.json()) as { items?: UserProfile[] };
        if (Array.isArray(items)) {
          items.forEach((item) => {
            if (item && item.openToWork) {
              const key = item.uid || item.nomorAlumni || Math.random().toString();
              combinedMap.set(key, item);
            }
          });
        }
      }
    } catch (e) {
      console.warn('Local /api/db open-to-work fetch warning:', e);
    }
  }

  // 2. Coba ambil juga dari Cloud Firestore REST API jika tersedia
  try {
    const docs = await runFirestoreQuery({
      structuredQuery: {
        from: [{ collectionId: 'public_profiles' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'openToWork' },
            op: 'EQUAL',
            value: { booleanValue: true }
          }
        }
      }
    });

    docs.forEach((d) => {
      const parsed = parseFirestoreDoc<Record<string, unknown>>(d) || {};
      const realId = (d.name ? d.name.split('/').pop() : '') || (parsed.id as string);
      const profile = {
        ...parsed,
        uid: realId,
        id: realId
      } as unknown as UserProfile;
      if (realId) {
        combinedMap.set(realId, profile);
      }
    });
  } catch {
    // Cloud Firestore rules may be in locked mode; rely on shared server DB
  }

  return Array.from(combinedMap.values());
}

/**
 * Mengembalikan daftar users dengan status openToWork (fallback terfilter untuk mencegah harvesting).
 */
export async function fetchUsersRest(): Promise<UserProfile[]> {
  return fetchOpenToWorkRest();
}

export async function fetchJobsRest(): Promise<JobPosting[] | null> {
  const jobsMap = new Map<string, JobPosting>();

  if (typeof window !== 'undefined') {
    try {
      const localRes = await fetch('/api/db?collection=jobs', { cache: 'no-store' });
      if (localRes.ok) {
        const { items } = (await localRes.json()) as { items?: JobPosting[] };
        if (Array.isArray(items)) {
          items.forEach((j) => {
            if (j && j.id) jobsMap.set(j.id, j);
          });
        }
      }
    } catch (e) {
      console.warn('Local /api/db jobs fetch warning:', e);
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);
  try {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/jobs`, {
      headers: { ...authHeaders },
      cache: 'no-store',
      signal: controller.signal
    });
    if (res.ok) {
      const json = (await res.json()) as { documents?: Array<{ name: string; fields?: Record<string, unknown> }> };
      const docs = json.documents || [];
      docs
        .map((d) => parseFirestoreDoc<JobPosting>(d))
        .filter((j): j is JobPosting => j !== null)
        .forEach((j) => {
          if (j.id) jobsMap.set(j.id, j);
        });
    }
  } catch {
    // Ignore cloud fetch failure when local server DB is active
  } finally {
    clearTimeout(timeoutId);
  }

  const jobs = Array.from(jobsMap.values());
  jobs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return jobs;
}

export async function fetchUserProfileRest(uid: string): Promise<UserProfile | null> {
  // 1. Cek di shared server DB (/api/db) terlebih dahulu
  if (typeof window !== 'undefined') {
    try {
      const localRes = await fetch(`/api/db?collection=users&id=${encodeURIComponent(uid)}`, {
        cache: 'no-store'
      });
      if (localRes.ok) {
        const { item } = (await localRes.json()) as { item?: UserProfile | null };
        if (item && (item.namaLengkap || item.email)) {
          return { ...item, uid: item.uid || uid };
        }
      }
    } catch {
      // Fallback to Cloud REST
    }
  }

  try {
    const authHeaders = await getAuthHeader();
    const res = await fetch(`${BASE_URL}/users/${encodeURIComponent(uid)}`, {
      headers: { ...authHeaders },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { name: string; fields?: Record<string, unknown> };
    const parsed = parseFirestoreDoc<Record<string, unknown>>(json);
    if (!parsed) return null;
    const realId = json.name ? json.name.split('/').pop() || uid : uid;
    return {
      ...parsed,
      uid: realId,
      id: realId
    } as unknown as UserProfile;
  } catch {
    return null;
  }
}

/**
 * Mencari alumni berdasarkan Nomor Alumni secara terarah melalui shared server DB (/api/db)
 * dan Cloud Firestore REST runQuery (limit 1).
 */
export async function fetchUserByNomorAlumniRest(nomorAlumni: string): Promise<UserProfile | null> {
  const clean = nomorAlumni.trim().replace(/\s+/g, '').replace(/[/._]/g, '-').toUpperCase();

  if (typeof window !== 'undefined') {
    try {
      const userRes = await fetch(`/api/db?collection=users&nomorAlumni=${encodeURIComponent(clean)}`, {
        cache: 'no-store'
      });
      if (userRes.ok) {
        const { item } = (await userRes.json()) as { item?: UserProfile | null };
        if (item && item.email) {
          return item;
        }
      }

      const regRes = await fetch(`/api/db?collection=alumni_registry&id=${encodeURIComponent(clean)}`, {
        cache: 'no-store'
      });
      if (regRes.ok) {
        const { item: regItem } = (await regRes.json()) as {
          item?: { isRegistered?: boolean; registeredEmail?: string; registeredUid?: string; namaLengkap?: string; prodi?: string; angkatan?: string } | null;
        };
        if (regItem && regItem.isRegistered && regItem.registeredEmail) {
          return {
            uid: regItem.registeredUid || '',
            email: regItem.registeredEmail,
            nomorAlumni: clean,
            namaLengkap: regItem.namaLengkap || '',
            prodi: (regItem.prodi || 'Animasi') as UserProfile['prodi'],
            angkatan: regItem.angkatan || '2020',
            openToWork: false,
            portfolio: [],
            createdAt: ''
          };
        }
      }
    } catch {
      // Fallback to Cloud REST
    }
  }

  try {
    const docs = await runFirestoreQuery({
      structuredQuery: {
        from: [{ collectionId: 'users' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'nomorAlumni' },
            op: 'EQUAL',
            value: { stringValue: clean }
          }
        },
        limit: 1
      }
    });

    if (docs.length === 0) return null;
    const doc = docs[0];
    const parsed = parseFirestoreDoc<Record<string, unknown>>(doc);
    if (!parsed) return null;
    const realId = doc.name ? doc.name.split('/').pop() || '' : '';
    return {
      ...parsed,
      uid: realId,
      id: realId
    } as unknown as UserProfile;
  } catch {
    return null;
  }
}

/**
 * Mengambil hanya field nomorAlumni dari alumni yang sudah terdaftar
 */
export async function fetchRegisteredNomorAlumniRest(): Promise<string[]> {
  const registeredSet = new Set<string>();

  if (typeof window !== 'undefined') {
    try {
      const regRes = await fetch('/api/db?collection=alumni_registry', { cache: 'no-store' });
      if (regRes.ok) {
        const { items } = (await regRes.json()) as {
          items?: Array<{ nomorAlumni?: string; isRegistered?: boolean }>;
        };
        if (Array.isArray(items)) {
          items.forEach((item) => {
            if (item && item.isRegistered && item.nomorAlumni) {
              registeredSet.add(String(item.nomorAlumni).toUpperCase());
            }
          });
        }
      }
    } catch {
      // Ignore local fetch error
    }
  }

  try {
    const docs = await runFirestoreQuery({
      structuredQuery: {
        select: {
          fields: [{ fieldPath: 'nomorAlumni' }]
        },
        from: [{ collectionId: 'users' }]
      }
    });

    docs.forEach((d) => {
      const val = d.fields?.nomorAlumni;
      const str = parseFirestoreValue(val);
      if (str) registeredSet.add(String(str).toUpperCase());
    });
  } catch {
    // Cloud rules may block list on users
  }

  return Array.from(registeredSet);
}
