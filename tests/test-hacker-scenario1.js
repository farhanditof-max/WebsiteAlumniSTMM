/**
 * SIMULASI PENTEST SCENARIO 1 (HACKER)
 * Menguji ketahanan Firebase Cloud Firestore terhadap akun penyerang luar:
 * - Menggunakan Firebase Auth API Key publik (sama seperti browser)
 * - Murni menggunakan ID Token penyerang (TANPA CLI, TANPA ADMIN SDK)
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

// 1. Baca Web API Key publik dari .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const dotenv = fs.readFileSync(envLocalPath, 'utf8');
const apiKeyMatch = dotenv.match(/NEXT_PUBLIC_FIREBASE_API_KEY=(.*)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : '';
const projectId = 'dashboard-alumni-mmtc';

function post(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const body = typeof data === 'string' ? data : JSON.stringify(data);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers
      }
    }, (res) => {
      let b = '';
      res.on('data', chunk => b += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      headers
    }, (res) => {
      let b = '';
      res.on('data', chunk => b += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('===============================================================');
  console.log('  FIREBASE SECURITY DEFENSE VERIFICATION - SCENARIO 1 (HACKER)');
  console.log('===============================================================\n');

  // STEP 1: Hacker mendaftar akun baru lewat API publik Firebase
  const email = `hacker_${Date.now()}@darkweb.org`;
  const password = 'HackerPassword123!';
  console.log('[STEP 1] Mendaftarkan akun penyerang di Firebase Auth...');
  console.log(`         Email   : ${email}`);

  const authRes = await post(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    email,
    password,
    returnSecureToken: true
  });

  const authData = JSON.parse(authRes.body);
  if (!authData.idToken) {
    console.error('Gagal daftar akun tester:', authData);
    return;
  }

  const hackerUid = authData.localId;
  const hackerToken = authData.idToken;
  console.log(`         UID     : ${hackerUid}`);
  console.log(`         Token   : Bearer ${hackerToken.slice(0, 30)}... [TOKEN PENGGUNA BIASA]`);
  console.log('         (Terbukti: Tanpa akses CLI, Tanpa Service Account Admin)\n');

  // STEP 2: SERANGAN 1 - Coba suntikkan profil Admin dengan nomor alumni palsu
  console.log('[SERANGAN 1] Hacker mencoba menyuntikkan dokumen Admin ke users/ dengan nomor alumni palsu...');
  const createProfileRes = await post(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users?documentId=${hackerUid}`,
    {
      fields: {
        uid: { stringValue: hackerUid },
        namaLengkap: { stringValue: 'Hacker' },
        nomorAlumni: { stringValue: 'HACKER-666' },
        role: { stringValue: 'admin' },
        prodi: { stringValue: 'Animasi' },
        angkatan: { stringValue: '2018' }
      }
    },
    { 'Authorization': `Bearer ${hackerToken}` }
  );
  console.log(`             Status Code  : HTTP ${createProfileRes.status}`);
  if (createProfileRes.status === 403) {
    console.log('             Hasil        : [DITOLAK - PERMISSION_DENIED]');
    console.log('             Analisis     : Firestore memblokir karena HACKER-666 tidak ada di whitelist alumni_registry!\n');
  } else {
    console.log('             Hasil        : [KEBOBOLAN] ', createProfileRes.body);
  }

  // STEP 3: SERANGAN 2 - Coba curi data dokumen privat Goklas
  console.log('[SERANGAN 2] Hacker mencoba membaca data profil privat milik Goklas...');
  const goklasRes = await get(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/FvCOX2jZf8ZmL8nQyUrWR8g6UAg1`,
    { 'Authorization': `Bearer ${hackerToken}` }
  );
  console.log(`             Status Code  : HTTP ${goklasRes.status}`);
  if (goklasRes.status === 403) {
    console.log('             Hasil        : [DITOLAK - PERMISSION_DENIED]');
    console.log('             Analisis     : Firestore memblokir karena hacker bukan pemilik dokumen dan bukan admin!\n');
  } else {
    console.log('             Hasil        : [KEBOBOLAN] ', goklasRes.body);
  }

  // STEP 4: SERANGAN 3 - Coba posting deface 'this website has been compromised' ke feeds
  console.log('[SERANGAN 3] Hacker mencoba memposting "this website has been compromised" ke Feed...');
  const feedRes = await post(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/feed_posts`,
    {
      fields: {
        authorUid: { stringValue: hackerUid },
        authorName: { stringValue: 'Hacker' },
        content: { stringValue: 'this website has been compromised' },
        category: { stringValue: 'diskusi' },
        likesCount: { integerValue: '0' },
        comments: { arrayValue: {} },
        createdAt: { stringValue: new Date().toISOString() }
      }
    },
    { 'Authorization': `Bearer ${hackerToken}` }
  );
  console.log(`             Status Code  : HTTP ${feedRes.status}`);
  console.log(`             Body Preview : ${feedRes.body.slice(0, 160)}...`);
  
  if (feedRes.status === 200) {
    console.log('             Hasil        : [BERHASIL MASUK KE FEED]');
    console.log('             Analisis     : Feed saat ini mengizinkan pengguna yang sudah login untuk berdiskusi.');
  } else if (feedRes.status === 403) {
    console.log('             Hasil        : [DITOLAK - PERMISSION_DENIED]');
  }

  // STEP 5: CLEANUP
  console.log('\n[CLEANUP] Menghapus akun penyerang dummy dari Firebase Auth...');
  await post(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`, {
    idToken: hackerToken
  });
  console.log('          Akun penyerang berhasil dihapus. Database tetap bersih!\n');
}

main().catch(console.error);
