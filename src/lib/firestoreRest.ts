import { UserProfile, JobPosting } from '@/types';

/**
 * Direct REST API fallback for Cloud Firestore.
 * This guarantees 100% reliable data retrieval regardless of browser extensions,
 * WebChannel stream issues, or Cloudflare/proxy buffering.
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dashboard-alumni-mmtc';
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

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
  const id = doc.name ? doc.name.split('/').pop() : '';
  const data: Record<string, unknown> = { id };
  const fields = doc.fields || {};
  for (const [key, val] of Object.entries(fields)) {
    data[key] = parseFirestoreValue(val);
  }
  return data as unknown as T;
}

async function runFirestoreQuery(queryPayload: unknown): Promise<Array<{ name: string; fields?: Record<string, unknown> }>> {
  const runQueryUrl = `${BASE_URL}:runQuery`;
  const res = await fetch(runQueryUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
 * Mengambil talenta Open to Work secara efisien menggunakan structured query REST
 * tanpa perlu mengunduh seluruh koleksi users.
 */
export async function fetchOpenToWorkRest(): Promise<UserProfile[]> {
  try {
    const docs = await runFirestoreQuery({
      structuredQuery: {
        from: [{ collectionId: 'users' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'openToWork' },
            op: 'EQUAL',
            value: { booleanValue: true }
          }
        }
      }
    });

    return docs.map(d => {
      const parsed = parseFirestoreDoc<Record<string, unknown>>(d) || {};
      return {
        uid: (parsed.id as string) || (d.name ? d.name.split('/').pop() : ''),
        ...parsed
      } as unknown as UserProfile;
    });
  } catch (err) {
    console.error('Error in fetchOpenToWorkRest:', err);
    return [];
  }
}

/**
 * Mengembalikan daftar users dengan status openToWork (fallback terfilter untuk mencegah harvesting).
 */
export async function fetchUsersRest(): Promise<UserProfile[]> {
  return fetchOpenToWorkRest();
}

export async function fetchJobsRest(): Promise<JobPosting[]> {
  try {
    const res = await fetch(`${BASE_URL}/jobs`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json() as { documents?: Array<{ name: string; fields?: Record<string, unknown> }> };
    const docs = json.documents || [];
    const jobs = docs
      .map(d => parseFirestoreDoc<JobPosting>(d))
      .filter((j): j is JobPosting => j !== null);
    // Sort descending by createdAt
    jobs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return jobs;
  } catch (err) {
    console.error('Error in fetchJobsRest:', err);
    return [];
  }
}

export async function fetchUserProfileRest(uid: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${BASE_URL}/users/${encodeURIComponent(uid)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json() as { name: string; fields?: Record<string, unknown> };
    const parsed = parseFirestoreDoc<Record<string, unknown>>(json);
    if (!parsed) return null;
    return {
      uid: json.name.split('/').pop() || uid,
      ...parsed
    } as unknown as UserProfile;
  } catch (err) {
    console.error('Error in fetchUserProfileRest:', err);
    return null;
  }
}

/**
 * Mencari alumni berdasarkan Nomor Alumni secara terarah melalui runQuery (limit 1)
 * daripada mengunduh seluruh isi database users ke memori client.
 */
export async function fetchUserByNomorAlumniRest(nomorAlumni: string): Promise<UserProfile | null> {
  const clean = nomorAlumni.trim().toUpperCase();
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
  return {
    uid: (parsed.id as string) || (doc.name ? doc.name.split('/').pop() : ''),
    ...parsed
  } as unknown as UserProfile;
}

/**
 * Mengambil hanya field nomorAlumni dari users terdaftar (proyeksi spesifik)
 */
export async function fetchRegisteredNomorAlumniRest(): Promise<string[]> {
  try {
    const docs = await runFirestoreQuery({
      structuredQuery: {
        select: {
          fields: [{ fieldPath: 'nomorAlumni' }]
        },
        from: [{ collectionId: 'users' }]
      }
    });

    return docs
      .map(d => {
        const val = d.fields?.nomorAlumni;
        const str = parseFirestoreValue(val);
        return str ? String(str).toUpperCase() : '';
      })
      .filter(Boolean);
  } catch (err) {
    console.error('Error in fetchRegisteredNomorAlumniRest:', err);
    return [];
  }
}
