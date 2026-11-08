process.env.NEXT_PUBLIC_FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyFakeKeyForLocalTest1234567890';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dashboard-alumni-mmtc';

import { NextRequest } from 'next/server';
import { GET, POST } from '../src/app/api/db/route';
import { createFeedPost } from '../src/lib/feed';

interface TestCaseResult {
  id: string;
  findingCode: string;
  name: string;
  passed: boolean;
  detail: string;
}

const results: TestCaseResult[] = [];

function record(id: string, findingCode: string, name: string, passed: boolean, detail: string) {
  results.push({ id, findingCode, name, passed, detail });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [${id}] ${findingCode} - ${name}`);
  if (!passed) console.error(`   Details: ${detail}`);
}

async function runTests() {
  console.log('================================================================');
  console.log('   RUN 2 SECURITY AUDIT FINDINGS REMEDIATION VERIFICATION       ');
  console.log('================================================================\n');

  const originalEnv = process.env.NODE_ENV;

  try {
    // -------------------------------------------------------------------------
    // 1. SEC.API.UNAUTHENTICATED_DATABASE_ROUTE.01 (CRITICAL)
    // -------------------------------------------------------------------------
    console.log('--- 1. Testing SEC.API.UNAUTHENTICATED_DATABASE_ROUTE.01 ---');
    
    // 1.1 Production check GET
    (process.env as Record<string, string>).NODE_ENV = 'production';
    const reqProdGet = new NextRequest('http://localhost:3000/api/db?collection=jobs');
    const resProdGet = await GET(reqProdGet);
    const bodyProdGet = await resProdGet.json();
    record(
      'TC-R2-01.1',
      'SEC.API.UNAUTHENTICATED_DATABASE_ROUTE.01',
      'GET /api/db returns 404 in production environment',
      resProdGet.status === 404 && bodyProdGet.error === 'Endpoint disabled in production',
      `Status: ${resProdGet.status}, Body: ${JSON.stringify(bodyProdGet)}`
    );

    // 1.2 Production check POST
    const reqProdPost = new NextRequest('http://localhost:3000/api/db', {
      method: 'POST',
      body: JSON.stringify({ action: 'setDoc', collection: 'users', id: 'u1', data: {} })
    });
    const resProdPost = await POST(reqProdPost);
    const bodyProdPost = await resProdPost.json();
    record(
      'TC-R2-01.2',
      'SEC.API.UNAUTHENTICATED_DATABASE_ROUTE.01',
      'POST /api/db returns 404 in production environment',
      resProdPost.status === 404 && bodyProdPost.error === 'Endpoint disabled in production',
      `Status: ${resProdPost.status}, Body: ${JSON.stringify(bodyProdPost)}`
    );

    // Restore to development for remaining tests
    (process.env as Record<string, string>).NODE_ENV = 'development';

    // 1.3 Privilege escalation via setDoc blocked
    const reqEscalate = new NextRequest('http://localhost:3000/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'setDoc',
        collection: 'users',
        id: 'target_user_test',
        data: { role: 'admin', namaLengkap: 'Attacker' }
      })
    });
    const resEscalate = await POST(reqEscalate);
    const bodyEscalate = await resEscalate.json();
    record(
      'TC-R2-01.3',
      'SEC.API.UNAUTHENTICATED_DATABASE_ROUTE.01',
      'Direct role:admin elevation mutation is rejected with HTTP 403',
      resEscalate.status === 403,
      `Status: ${resEscalate.status}, Body: ${JSON.stringify(bodyEscalate)}`
    );

    // 1.4 Unauthenticated mutation on alumni_registry blocked
    const reqRegSet = new NextRequest('http://localhost:3000/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'setDoc',
        collection: 'alumni_registry',
        id: 'MMTC-INJECT-999',
        data: { nomorAlumni: 'MMTC-INJECT-999', namaLengkap: 'Injected Alum', isRegistered: false }
      })
    });
    const resRegSet = await POST(reqRegSet);
    const bodyRegSet = await resRegSet.json();
    record(
      'TC-R2-01.4',
      'SEC.API.UNAUTHENTICATED_DATABASE_ROUTE.01',
      'Unauthenticated mutation on alumni_registry is rejected with HTTP 403',
      resRegSet.status === 403,
      `Status: ${resRegSet.status}, Body: ${JSON.stringify(bodyRegSet)}`
    );

    // 1.5 Unauthenticated deleteDoc on jobs blocked
    const reqDeleteJob = new NextRequest('http://localhost:3000/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deleteDoc',
        collection: 'jobs',
        id: 'sample_job_delete'
      })
    });
    const resDeleteJob = await POST(reqDeleteJob);
    const bodyDeleteJob = await resDeleteJob.json();
    record(
      'TC-R2-01.5',
      'SEC.API.UNAUTHENTICATED_DATABASE_ROUTE.01',
      'Unauthenticated deleteDoc on jobs is rejected with HTTP 403',
      resDeleteJob.status === 403,
      `Status: ${resDeleteJob.status}, Body: ${JSON.stringify(bodyDeleteJob)}`
    );

    // 1.6 Unauthenticated application status tampering blocked
    // Seed an application first
    const seedApp = new NextRequest('http://localhost:3000/api/db', {
      method: 'POST',
      body: JSON.stringify({
        action: 'setDoc',
        collection: 'applications',
        id: 'tamper_job1_applicant1',
        data: {
          jobId: 'job1',
          applicantUid: 'applicant1',
          posterUid: 'recruiter1',
          status: 'pending'
        }
      })
    });
    await POST(seedApp);

    const reqTamperStatus = new NextRequest('http://localhost:3000/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'setDoc',
        collection: 'applications',
        id: 'tamper_job1_applicant1',
        data: { status: 'accepted' },
        merge: true
      })
    });
    const resTamperStatus = await POST(reqTamperStatus);
    const bodyTamperStatus = await resTamperStatus.json();
    record(
      'TC-R2-01.6',
      'SEC.API.UNAUTHENTICATED_DATABASE_ROUTE.01',
      'Application status tampering by unauthorized caller is rejected with HTTP 403',
      resTamperStatus.status === 403,
      `Status: ${resTamperStatus.status}, Body: ${JSON.stringify(bodyTamperStatus)}`
    );

    // -------------------------------------------------------------------------
    // 2. SEC.API.PII_EXPOSURE_USERS_APPLICATIONS.01 (HIGH)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing SEC.API.PII_EXPOSURE_USERS_APPLICATIONS.01 ---');

    // 2.1 Unfiltered applications dump rejected
    const reqAppDump = new NextRequest('http://localhost:3000/api/db?collection=applications');
    const resAppDump = await GET(reqAppDump);
    const bodyAppDump = await resAppDump.json();
    record(
      'TC-R2-02.1',
      'SEC.API.PII_EXPOSURE_USERS_APPLICATIONS.01',
      'Unfiltered applications collection query is rejected with HTTP 400',
      resAppDump.status === 400 && bodyAppDump.error.includes('posterUid atau applicantUid wajib'),
      `Status: ${resAppDump.status}, Body: ${JSON.stringify(bodyAppDump)}`
    );

    // 2.2 Filtered applications retrieval allowed
    const reqAppFilter = new NextRequest('http://localhost:3000/api/db?collection=applications&posterUid=recruiter_sample');
    const resAppFilter = await GET(reqAppFilter);
    const bodyAppFilter = await resAppFilter.json();
    record(
      'TC-R2-02.2',
      'SEC.API.PII_EXPOSURE_USERS_APPLICATIONS.01',
      'Applications query with posterUid filter is accepted',
      resAppFilter.status === 200 && Array.isArray(bodyAppFilter.items),
      `Status: ${resAppFilter.status}, Items: ${JSON.stringify(bodyAppFilter.items)}`
    );

    // 2.2b Application ID lookup with mismatched posterUid rejected with HTTP 403
    const reqAppIdWrongPoster = new NextRequest('http://localhost:3000/api/db?collection=applications&id=tamper_job1_applicant1&posterUid=attacker_poster');
    const resAppIdWrongPoster = await GET(reqAppIdWrongPoster);
    const bodyAppIdWrongPoster = await resAppIdWrongPoster.json();
    record(
      'TC-R2-02.5',
      'SEC.API.PII_EXPOSURE_USERS_APPLICATIONS.01',
      'Application query by ID with unauthorized posterUid is rejected with HTTP 403',
      resAppIdWrongPoster.status === 403 && bodyAppIdWrongPoster.error.includes('ditolak'),
      `Status: ${resAppIdWrongPoster.status}, Body: ${JSON.stringify(bodyAppIdWrongPoster)}`
    );

    // 2.2c Application ID lookup with authorized posterUid accepted
    const reqAppIdRightPoster = new NextRequest('http://localhost:3000/api/db?collection=applications&id=tamper_job1_applicant1&posterUid=recruiter1');
    const resAppIdRightPoster = await GET(reqAppIdRightPoster);
    const bodyAppIdRightPoster = await resAppIdRightPoster.json();
    record(
      'TC-R2-02.6',
      'SEC.API.PII_EXPOSURE_USERS_APPLICATIONS.01',
      'Application query by ID with authorized posterUid is accepted with HTTP 200',
      resAppIdRightPoster.status === 200 && bodyAppIdRightPoster.item?.jobId === 'job1',
      `Status: ${resAppIdRightPoster.status}, Item: ${JSON.stringify(bodyAppIdRightPoster.item)}`
    );

    // 2.3 Unauthenticated unfiltered users dump rejected
    const reqUserDump = new NextRequest('http://localhost:3000/api/db?collection=users');
    const resUserDump = await GET(reqUserDump);
    const bodyUserDump = await resUserDump.json();
    record(
      'TC-R2-02.3',
      'SEC.API.PII_EXPOSURE_USERS_APPLICATIONS.01',
      'Unauthenticated unfiltered users query is rejected with HTTP 401',
      resUserDump.status === 401,
      `Status: ${resUserDump.status}, Body: ${JSON.stringify(bodyUserDump)}`
    );

    // 2.4 User profile query sanitizes sensitive contact PII for unauthenticated caller
    const seedUserReq = new NextRequest('http://localhost:3000/api/db', {
      method: 'POST',
      body: JSON.stringify({
        action: 'setDoc',
        collection: 'users',
        id: 'pii_test_user',
        data: {
          uid: 'pii_test_user',
          namaLengkap: 'Sensitif User',
          email: 'secret_alumni@stmm.ac.id',
          phone: '081234567890',
          nomorHp: '081234567890',
          cvFileUrl: '/uploads/cvs/confidential.pdf',
          domisili: 'Yogyakarta'
        }
      })
    });
    await POST(seedUserReq);

    const reqUserPublic = new NextRequest('http://localhost:3000/api/db?collection=users&id=pii_test_user');
    const resUserPublic = await GET(reqUserPublic);
    const bodyUserPublic = await resUserPublic.json();
    const fetchedUser = bodyUserPublic.item;
    const piiStripped = fetchedUser &&
      fetchedUser.email === undefined &&
      fetchedUser.phone === undefined &&
      fetchedUser.nomorHp === undefined &&
      fetchedUser.cvFileUrl === undefined &&
      fetchedUser.namaLengkap === 'Sensitif User';
    record(
      'TC-R2-02.4',
      'SEC.API.PII_EXPOSURE_USERS_APPLICATIONS.01',
      'Public user lookup sanitizes email, phone, nomorHp, and cvFileUrl',
      Boolean(piiStripped),
      `Returned item: ${JSON.stringify(fetchedUser)}`
    );

    // -------------------------------------------------------------------------
    // 3. SEC.UPLOAD.UNRESTRICTED_FILE_WRITE_XSS.01 (HIGH)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing SEC.UPLOAD.UNRESTRICTED_FILE_WRITE_XSS.01 ---');

    // 3.1 Reject .html extension
    const reqHtml = new NextRequest('http://localhost:3000/api/db', {
      method: 'POST',
      body: JSON.stringify({
        action: 'uploadFile',
        fileName: 'exploit.html',
        base64Data: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='
      })
    });
    const resHtml = await POST(reqHtml);
    const bodyHtml = await resHtml.json();
    record(
      'TC-R2-03.1',
      'SEC.UPLOAD.UNRESTRICTED_FILE_WRITE_XSS.01',
      'Upload file rejects .html file extension with HTTP 400',
      resHtml.status === 400 && bodyHtml.error.includes('tidak diizinkan'),
      `Status: ${resHtml.status}, Body: ${JSON.stringify(bodyHtml)}`
    );

    // 3.2 Reject .svg extension
    const reqSvg = new NextRequest('http://localhost:3000/api/db', {
      method: 'POST',
      body: JSON.stringify({
        action: 'uploadFile',
        fileName: 'vector.svg',
        base64Data: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='
      })
    });
    const resSvg = await POST(reqSvg);
    const bodySvg = await resSvg.json();
    record(
      'TC-R2-03.2',
      'SEC.UPLOAD.UNRESTRICTED_FILE_WRITE_XSS.01',
      'Upload file rejects .svg file extension with HTTP 400',
      resSvg.status === 400,
      `Status: ${resSvg.status}, Body: ${JSON.stringify(bodySvg)}`
    );

    // 3.3 Reject oversized payload (> 10MB)
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 0x41).toString('base64');
    const reqLarge = new NextRequest('http://localhost:3000/api/db', {
      method: 'POST',
      body: JSON.stringify({
        action: 'uploadFile',
        fileName: 'oversized.pdf',
        base64Data: largeBuffer
      })
    });
    const resLarge = await POST(reqLarge);
    const bodyLarge = await resLarge.json();
    record(
      'TC-R2-03.3',
      'SEC.UPLOAD.UNRESTRICTED_FILE_WRITE_XSS.01',
      'Upload file rejects payloads exceeding 10MB with HTTP 400',
      resLarge.status === 400 && bodyLarge.error.includes('10MB'),
      `Status: ${resLarge.status}, Body: ${JSON.stringify(bodyLarge)}`
    );

    // 3.4 Accept whitelisted .png extension
    const samplePng = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const reqPng = new NextRequest('http://localhost:3000/api/db', {
      method: 'POST',
      body: JSON.stringify({
        action: 'uploadFile',
        fileName: 'avatar.png',
        base64Data: samplePng
      })
    });
    const resPng = await POST(reqPng);
    const bodyPng = await resPng.json();
    record(
      'TC-R2-03.4',
      'SEC.UPLOAD.UNRESTRICTED_FILE_WRITE_XSS.01',
      'Upload file accepts safe .png extension',
      resPng.status === 200 && typeof bodyPng.url === 'string' && bodyPng.url.endsWith('.png'),
      `Status: ${resPng.status}, URL: ${bodyPng.url}`
    );

    // 3.5 Reject disguised SVG payload with .png extension
    const reqDisguisedSvg = new NextRequest('http://localhost:3000/api/db', {
      method: 'POST',
      body: JSON.stringify({
        action: 'uploadFile',
        fileName: 'disguised.png',
        dataUrl: 'data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9ImFsZXJ0KDEpIj48L3N2Zz4='
      })
    });
    const resDisguisedSvg = await POST(reqDisguisedSvg);
    const bodyDisguisedSvg = await resDisguisedSvg.json();
    record(
      'TC-R2-03.5',
      'SEC.UPLOAD.UNRESTRICTED_FILE_WRITE_XSS.01',
      'Upload file rejects disguised SVG payload with .png extension',
      resDisguisedSvg.status === 400 && (bodyDisguisedSvg.error.includes('tidak diizinkan') || bodyDisguisedSvg.error.includes('magic bytes')),
      `Status: ${resDisguisedSvg.status}, Body: ${JSON.stringify(bodyDisguisedSvg)}`
    );

    // 3.6 Reject text/html content disguised with .png extension (magic bytes check)
    const reqFakePng = new NextRequest('http://localhost:3000/api/db', {
      method: 'POST',
      body: JSON.stringify({
        action: 'uploadFile',
        fileName: 'malicious.png',
        base64Data: Buffer.from('<script>alert("xss")</script>').toString('base64')
      })
    });
    const resFakePng = await POST(reqFakePng);
    const bodyFakePng = await resFakePng.json();
    record(
      'TC-R2-03.6',
      'SEC.UPLOAD.UNRESTRICTED_FILE_WRITE_XSS.01',
      'Upload file rejects non-PNG binary with .png extension via magic bytes validation',
      resFakePng.status === 400,
      `Status: ${resFakePng.status}, Body: ${JSON.stringify(bodyFakePng)}`
    );

    // -------------------------------------------------------------------------
    // 4. SEC.AUTH.REGISTRY_BYPASS_SERVER_DB.01 (HIGH)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing SEC.AUTH.REGISTRY_BYPASS_SERVER_DB.01 ---');

    // 4.1 Reject registration of non-existent student number
    const reqFakeNomor = new NextRequest('http://localhost:3000/api/db', {
      method: 'POST',
      body: JSON.stringify({
        action: 'registerAlumni',
        uid: 'fake_actor_uid',
        email: 'fake@attack.com',
        nomorAlumni: 'MMTC-FAKE-999999',
        profileData: { namaLengkap: 'Fake Alum', prodi: 'Animasi', angkatan: '2024' }
      })
    });
    const resFakeNomor = await POST(reqFakeNomor);
    const bodyFakeNomor = await resFakeNomor.json();
    record(
      'TC-R2-04.1',
      'SEC.AUTH.REGISTRY_BYPASS_SERVER_DB.01',
      'registerAlumni rejects nonexistent student number with HTTP 400',
      resFakeNomor.status === 400 && bodyFakeNomor.error.includes('tidak terdaftar'),
      `Status: ${resFakeNomor.status}, Body: ${JSON.stringify(bodyFakeNomor)}`
    );

    // 4.2 Accept valid existing unregistered number
    const reqValidReg = new NextRequest('http://localhost:3000/api/db', {
      method: 'POST',
      body: JSON.stringify({
        action: 'registerAlumni',
        uid: 'budi_real_uid',
        email: 'budi@test.ac.id',
        nomorAlumni: 'MMTC-2018-001',
        profileData: { namaLengkap: 'Budi Santoso', prodi: 'Animasi', angkatan: '2018' }
      })
    });
    const resValidReg = await POST(reqValidReg);
    const bodyValidReg = await resValidReg.json();
    record(
      'TC-R2-04.2',
      'SEC.AUTH.REGISTRY_BYPASS_SERVER_DB.01',
      'registerAlumni succeeds for valid unregistered institutional number',
      resValidReg.status === 200 && bodyValidReg.success === true,
      `Status: ${resValidReg.status}, Body: ${JSON.stringify(bodyValidReg)}`
    );

    // 4.3 Reject registration of already registered number
    const reqDuplicateReg = new NextRequest('http://localhost:3000/api/db', {
      method: 'POST',
      body: JSON.stringify({
        action: 'registerAlumni',
        uid: 'impostor_uid',
        email: 'impostor@test.com',
        nomorAlumni: 'MMTC-2018-001',
        profileData: { namaLengkap: 'Impostor', prodi: 'Animasi', angkatan: '2018' }
      })
    });
    const resDuplicateReg = await POST(reqDuplicateReg);
    const bodyDuplicateReg = await resDuplicateReg.json();
    record(
      'TC-R2-04.3',
      'SEC.AUTH.REGISTRY_BYPASS_SERVER_DB.01',
      'registerAlumni rejects already registered student number with HTTP 400',
      resDuplicateReg.status === 400 && bodyDuplicateReg.error.includes('sudah terdaftar'),
      `Status: ${resDuplicateReg.status}, Body: ${JSON.stringify(bodyDuplicateReg)}`
    );

    // -------------------------------------------------------------------------
    // 5. SEC.CLIENT.UNSANITIZED_FEED_PDF_LINK_XSS.01 (MEDIUM)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing SEC.CLIENT.UNSANITIZED_FEED_PDF_LINK_XSS.01 ---');

    // 5.1 Reject javascript: PDF URL in createFeedPost
    let jsXssCaught = false;
    try {
      await createFeedPost({
        authorUid: 'user-seed-budi',
        authorName: 'Budi Santoso',
        authorProdi: 'Animasi',
        category: 'showreel',
        content: 'Check out thesis document',
        mediaType: 'pdf',
        mediaUrl: 'javascript:alert(document.domain)'
      });
    } catch (err: unknown) {
      jsXssCaught = (err as Error).message.includes('tidak diizinkan') || (err as Error).message.includes('tidak valid');
    }
    record(
      'TC-R2-05.1',
      'SEC.CLIENT.UNSANITIZED_FEED_PDF_LINK_XSS.01',
      'createFeedPost throws error on javascript: pseudo-protocol URL',
      jsXssCaught,
      `Caught: ${jsXssCaught}`
    );

    // 5.2 Reject data: HTML XSS payload
    let dataXssCaught = false;
    try {
      await createFeedPost({
        authorUid: 'user-seed-budi',
        authorName: 'Budi Santoso',
        authorProdi: 'Animasi',
        category: 'showreel',
        content: 'Check out data payload',
        mediaType: 'pdf',
        mediaUrl: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='
      });
    } catch (err: unknown) {
      dataXssCaught = (err as Error).message.includes('tidak diizinkan') || (err as Error).message.includes('tidak valid');
    }
    record(
      'TC-R2-05.2',
      'SEC.CLIENT.UNSANITIZED_FEED_PDF_LINK_XSS.01',
      'createFeedPost throws error on data: base64 HTML scheme URL',
      dataXssCaught,
      `Caught: ${dataXssCaught}`
    );

    // -------------------------------------------------------------------------
    // 6. SEC.API.UPLOAD_FILE_UNDEFINED_BASE64_CRASH.01 (LOW)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing SEC.API.UPLOAD_FILE_UNDEFINED_BASE64_CRASH.01 ---');

    // 6.1 Supports dataUrl parameter alias without throwing 500 TypeError
    const reqDataUrl = new NextRequest('http://localhost:3000/api/db', {
      method: 'POST',
      body: JSON.stringify({
        action: 'uploadFile',
        fileName: 'report.pdf',
        dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCg=='
      })
    });
    const resDataUrl = await POST(reqDataUrl);
    const bodyDataUrl = await resDataUrl.json();
    record(
      'TC-R2-06.1',
      'SEC.API.UPLOAD_FILE_UNDEFINED_BASE64_CRASH.01',
      'uploadFile handles dataUrl parameter alias cleanly without HTTP 500 TypeError',
      resDataUrl.status === 200 && typeof bodyDataUrl.url === 'string',
      `Status: ${resDataUrl.status}, URL: ${bodyDataUrl.url}`
    );

    // 6.2 Missing both dataUrl and base64Data gracefully returns 400
    const reqMissingData = new NextRequest('http://localhost:3000/api/db', {
      method: 'POST',
      body: JSON.stringify({
        action: 'uploadFile',
        fileName: 'empty.pdf'
      })
    });
    const resMissingData = await POST(reqMissingData);
    const bodyMissingData = await resMissingData.json();
    record(
      'TC-R2-06.2',
      'SEC.API.UPLOAD_FILE_UNDEFINED_BASE64_CRASH.01',
      'uploadFile with missing data returns HTTP 400 instead of crashing',
      resMissingData.status === 400,
      `Status: ${resMissingData.status}, Body: ${JSON.stringify(bodyMissingData)}`
    );

  } finally {
    (process.env as Record<string, string>).NODE_ENV = originalEnv;
    try {
      const fs = await import('fs');
      const path = await import('path');
      const dbPath = path.join(process.cwd(), 'data', 'mmtc_cloud_db.json');
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf8');
        const db = JSON.parse(raw);
        if (db.alumni_registry?.['MMTC-2018-001']) {
          db.alumni_registry['MMTC-2018-001'].isRegistered = false;
          delete db.alumni_registry['MMTC-2018-001'].registeredUid;
          delete db.alumni_registry['MMTC-2018-001'].registeredEmail;
          delete db.alumni_registry['MMTC-2018-001'].registeredAt;
        }
        if (db.users) {
          delete db.users['pii_test_user'];
          delete db.users['budi_real_uid'];
          delete db.users['target_user_test'];
        }
        if (db.applications) {
          delete db.applications['tamper_job1_applicant1'];
        }
        if (db.alumni_registry) {
          delete db.alumni_registry['MMTC-INJECT-999'];
        }
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
      }
    } catch {
      // ignore cleanup errors
    }
  }

  console.log('\n================================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  console.log(`TOTAL REMEDIATION TESTS: ${total}`);
  console.log(`PASSED                 : ${passed}`);
  console.log(`FAILED                 : ${failed}`);
  console.log(`STATUS                 : ${failed === 0 ? 'ALL PASS (100%)' : 'FAILURES PRESENT'}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
