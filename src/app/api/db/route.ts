import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'mmtc_cloud_db.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

interface DbSchema {
  alumni_registry: Record<string, Record<string, unknown>>;
  users: Record<string, Record<string, unknown>>;
  public_profiles: Record<string, Record<string, unknown>>;
  feed_posts: Record<string, Record<string, unknown>>;
  jobs: Record<string, Record<string, unknown>>;
  applications: Record<string, Record<string, unknown>>;
  conversations: Record<string, Record<string, unknown>>;
}

const INITIAL_ALUMNI_REGISTRY: Record<string, Record<string, unknown>> = {
  '903452018000035': {
    nomorAlumni: '903452018000035',
    namaLengkap: 'Dary Halim',
    prodi: 'Animasi',
    angkatan: '2018',
    isRegistered: false,
    createdAt: '2026-11-09T00:00:00.000Z'
  },
  '903452019000119': {
    nomorAlumni: '903452019000119',
    namaLengkap: 'Maydian Goklas Pratama Simanjuntak',
    prodi: 'Animasi',
    angkatan: '2019',
    isRegistered: false,
    createdAt: '2026-11-09T00:00:00.000Z'
  },
  '903452018000189': {
    nomorAlumni: '903452018000189',
    namaLengkap: 'Farhandito Fadila',
    prodi: 'Animasi',
    angkatan: '2018',
    isRegistered: false,
    createdAt: '2026-11-09T00:00:00.000Z'
  },
  'MMTC-2018-001': {
    nomorAlumni: 'MMTC-2018-001',
    namaLengkap: 'Budi Santoso',
    prodi: 'Animasi',
    angkatan: '2018',
    isRegistered: false,
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  'MMTC-2019-042': {
    nomorAlumni: 'MMTC-2019-042',
    namaLengkap: 'Siti Rahma',
    prodi: 'Game Design',
    angkatan: '2019',
    isRegistered: false,
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  'MMTC-2020-103': {
    nomorAlumni: 'MMTC-2020-103',
    namaLengkap: 'Andi Pratama',
    prodi: 'MIK',
    angkatan: '2020',
    isRegistered: false,
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  'MMTC-2020-215': {
    nomorAlumni: 'MMTC-2020-215',
    namaLengkap: 'Dewi Lestari',
    prodi: 'Matekstosi',
    angkatan: '2020',
    isRegistered: false,
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  'MMTC-2021-088': {
    nomorAlumni: 'MMTC-2021-088',
    namaLengkap: 'Rian Hidayat',
    prodi: 'Manarita',
    angkatan: '2021',
    isRegistered: false,
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  'MMTC-2021-120': {
    nomorAlumni: 'MMTC-2021-120',
    namaLengkap: 'Fajar Nugraha',
    prodi: 'Manaprodsi',
    angkatan: '2021',
    isRegistered: false,
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  'MMTC-2022-015': {
    nomorAlumni: 'MMTC-2022-015',
    namaLengkap: 'Maya Safitri',
    prodi: 'Animasi',
    angkatan: '2022',
    isRegistered: false,
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  'MMTC-2022-064': {
    nomorAlumni: 'MMTC-2022-064',
    namaLengkap: 'Dimas Aditya',
    prodi: 'Game Design',
    angkatan: '2022',
    isRegistered: false,
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  'MMTC-2023-031': {
    nomorAlumni: 'MMTC-2023-031',
    namaLengkap: 'Kurniawan Eko',
    prodi: 'MIK',
    angkatan: '2023',
    isRegistered: false,
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  'MMTC-2023-095': {
    nomorAlumni: 'MMTC-2023-095',
    namaLengkap: 'Nadia Putri',
    prodi: 'Matekstosi',
    angkatan: '2023',
    isRegistered: false,
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  'MMTC-2024-012': {
    nomorAlumni: 'MMTC-2024-012',
    namaLengkap: 'Bayu Wicaksono',
    prodi: 'Manarita',
    angkatan: '2024',
    isRegistered: false,
    createdAt: '2026-10-01T00:00:00.000Z'
  },
  'MMTC-2024-055': {
    nomorAlumni: 'MMTC-2024-055',
    namaLengkap: 'Salsabila Rahma',
    prodi: 'Manaprodsi',
    angkatan: '2024',
    isRegistered: false,
    createdAt: '2026-10-01T00:00:00.000Z'
  }
};

const INITIAL_PUBLIC_PROFILES: Record<string, Record<string, unknown>> = {
  'showcase-dimas': {
    uid: 'showcase-dimas',
    nomorAlumni: 'MMTC-2022-064',
    namaLengkap: 'Dimas Aditya',
    prodi: 'Game Design',
    angkatan: '2022',
    pekerjaanSaatIni: 'Technical Game Designer & Unreal Developer',
    domisili: 'Yogyakarta',
    bio: 'Game Designer & Gameplay Programmer dengan fokus pada mekanik combat RPG di Unreal Engine 5 dan Unity 3D.',
    openToWork: true,
    hasCv: true,
    fotoProfil: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    portfolio: [
      {
        id: 'p-dimas-1',
        title: 'Unreal Engine 5 Combat System Prototype',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        type: 'youtube',
        createdAt: '2026-10-20T08:00:00.000Z'
      }
    ],
    createdAt: '2026-10-20T08:00:00.000Z',
    updatedAt: '2026-10-24T08:00:00.000Z'
  },
  'showcase-dewi': {
    uid: 'showcase-dewi',
    nomorAlumni: 'MMTC-2020-215',
    namaLengkap: 'Dewi Lestari',
    prodi: 'Matekstosi',
    angkatan: '2020',
    pekerjaanSaatIni: 'Acoustic Engineer & Audio Post Specialist',
    domisili: 'Jakarta Selatan',
    bio: 'Spesialis tata suara film, foley artist, dan broadcast audio mixing engineer bersertifikasi Dolby Atmos.',
    openToWork: true,
    hasCv: true,
    fotoProfil: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    portfolio: [
      {
        id: 'p-dewi-1',
        title: 'Showreel Sound Design & Foley Film Pendek',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        type: 'youtube',
        createdAt: '2026-10-21T08:00:00.000Z'
      }
    ],
    createdAt: '2026-10-21T08:00:00.000Z',
    updatedAt: '2026-10-24T08:00:00.000Z'
  },
  'showcase-maya': {
    uid: 'showcase-maya',
    nomorAlumni: 'MMTC-2022-015',
    namaLengkap: 'Maya Safitri',
    prodi: 'Animasi',
    angkatan: '2022',
    pekerjaanSaatIni: '3D Character Animator & Storyboard Artist',
    domisili: 'Yogyakarta',
    bio: '3D Character Animator berpengalaman di Blender dan Maya untuk produksi serial animasi dan game cinematic.',
    openToWork: true,
    hasCv: true,
    fotoProfil: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    portfolio: [
      {
        id: 'p-maya-1',
        title: '3D Character Acting & Lip Sync Reel 2026',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        type: 'youtube',
        createdAt: '2026-10-22T08:00:00.000Z'
      }
    ],
    createdAt: '2026-10-22T08:00:00.000Z',
    updatedAt: '2026-10-24T08:00:00.000Z'
  }
};

const INITIAL_FEED_POSTS: Record<string, Record<string, unknown>> = {
  'seed-post-01': {
    id: 'seed-post-01',
    authorUid: 'user-seed-budi',
    authorName: 'Budi Santoso',
    authorProdi: 'Animasi',
    authorAngkatan: '2018',
    authorRole: 'Senior 3D Artist & Lead Rigger',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    nomorAlumni: 'MMTC-2018-001',
    category: 'showreel',
    content: 'Halo rekan-rekan alumni MMTC! Baru saja merilis breakdown rigging dan animasi karakter untuk project film pendek terbaru kami. Fokus pada expressive facial blendshapes & cloth simulation di Blender. Kritik dan masukan sangat dinantikan!',
    hashtags: ['#AnimasiMMTC', '#3DRigging', '#Blender3D', '#ShowreelAlumni'],
    mediaType: 'youtube',
    mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    mediaTitle: 'Breakdown 3D Rigging & Facial Animation 2026',
    likesCount: 24,
    likedBy: ['user-seed-siti', 'user-seed-dimas'],
    commentsCount: 2,
    comments: [
      {
        id: 'c1',
        authorUid: 'user-seed-siti',
        authorName: 'Siti Rahmawati',
        authorProdi: 'Animasi',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        text: 'Keren banget Mas Budi! Deformasi area bibir dan alis sangat natural. Pakai add-on khusus atau manual rig?',
        createdAt: '2026-10-24T10:15:00.000Z'
      },
      {
        id: 'c2',
        authorUid: 'user-seed-budi',
        authorName: 'Budi Santoso',
        authorProdi: 'Animasi',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        text: 'Terima kasih Mbak Siti! Full manual rig digabung corrective shape keys biar gerakannya tajam.',
        createdAt: '2026-10-24T10:45:00.000Z'
      }
    ],
    createdAt: '2026-10-24T09:30:00.000Z',
    updatedAt: '2026-10-24T10:45:00.000Z'
  },
  'seed-post-02': {
    id: 'seed-post-02',
    authorUid: 'user-seed-dimas',
    authorName: 'Dimas Aditya',
    authorProdi: 'Game Design',
    authorAngkatan: '2022',
    authorRole: 'Technical Game Designer',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    nomorAlumni: 'MMTC-2022-064',
    category: 'kolaborasi',
    content: 'Open recruitment untuk project game indie RPG Nusantara (Unreal Engine 5). Kami sedang membutuhkan 1 orang Technical Sound Designer (alumni Matekstosi / MIK) dan 1 orang Concept Artist. Work-from-anywhere, revenue-share based.',
    hashtags: ['#GameDevMMTC', '#UnrealEngine5', '#LokerIndie', '#KolaborasiAlumni'],
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    mediaTitle: 'Concept Art & Level Design Preview.jpg',
    mediaSize: '1.8 MB',
    likesCount: 19,
    likedBy: ['user-seed-budi'],
    commentsCount: 1,
    comments: [
      {
        id: 'c3',
        authorUid: 'user-seed-dewi',
        authorName: 'Dewi Lestari',
        authorProdi: 'Matekstosi',
        authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        text: 'Tertarik Mas Dimas! Portofolio foley dan dynamic sound cues saya sudah ada di profil.',
        createdAt: '2026-10-25T14:20:00.000Z'
      }
    ],
    createdAt: '2026-10-25T11:00:00.000Z',
    updatedAt: '2026-10-25T14:20:00.000Z'
  },
  'seed-post-03': {
    id: 'seed-post-03',
    authorUid: 'user-seed-fajar',
    authorName: 'Fajar Nugraha',
    authorProdi: 'Manaprodsi',
    authorAngkatan: '2021',
    authorRole: 'Broadcast Producer & Live Stream Director',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    nomorAlumni: 'MMTC-2021-120',
    category: 'pencapaian',
    content: 'Alhamdulillah, tim produksi kami baru saja menyelesaikan siaran langsung Festival Musik Nasional 3 hari non-stop dengan 16 kamera multi-cam setup dan 0 dropped frames. Bangga bisa berkolaborasi dengan sesama alumni MMTC lintas angkatan!',
    hashtags: ['#Manaprodsi', '#LiveBroadcast', '#MultiCam', '#ProudMMTC'],
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80',
    mediaTitle: 'Production Control Room Setup.jpg',
    mediaSize: '2.4 MB',
    likesCount: 38,
    likedBy: ['user-seed-budi', 'user-seed-siti', 'user-seed-dimas'],
    commentsCount: 1,
    comments: [
      {
        id: 'c4',
        authorUid: 'user-seed-rian',
        authorName: 'Rian Hidayat',
        authorProdi: 'Manarita',
        authorAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
        text: 'Mantap Mas Fajar! Liputan dan switching kameranya smooth banget di siaran kemarin.',
        createdAt: '2026-10-25T17:05:00.000Z'
      }
    ],
    createdAt: '2026-10-25T16:40:00.000Z',
    updatedAt: '2026-10-25T17:05:00.000Z'
  },
  'seed-post-04': {
    id: 'seed-post-04',
    authorUid: 'user-seed-rian',
    authorName: 'Rian Hidayat',
    authorProdi: 'Manarita',
    authorAngkatan: '2021',
    authorRole: 'Digital Journalist & News Anchor',
    authorAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    nomorAlumni: 'MMTC-2021-088',
    category: 'diskusi',
    content: 'Bagaimana pandangan rekan-rekan mengenai adaptasi AI Generatif dalam penulisan naskah berita investigasi dan automated fact-checking? Di newsroom kami sudah mulai integrasi, tapi etika jurnalistik tetap nomor satu.',
    hashtags: ['#JurnalistikDigital', '#AIinMedia', '#ManaritaMMTC', '#DiskusiMedia'],
    likesCount: 15,
    likedBy: ['user-seed-fajar'],
    commentsCount: 1,
    comments: [
      {
        id: 'c5',
        authorUid: 'user-seed-kurniawan',
        authorName: 'Kurniawan Eko',
        authorProdi: 'MIK',
        authorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
        text: 'Human-in-the-loop mutlak diperlukan Mas Rian. LLM bagus untuk ringkasan cepat, tapi verifikasi primer harus tangan jurnalis.',
        createdAt: '2026-10-26T08:12:00.000Z'
      }
    ],
    createdAt: '2026-10-26T07:30:00.000Z',
    updatedAt: '2026-10-26T08:12:00.000Z'
  },
  'seed-post-05': {
    id: 'seed-post-05',
    authorUid: 'user-seed-dewi',
    authorName: 'Dewi Lestari',
    authorProdi: 'Matekstosi',
    authorAngkatan: '2020',
    authorRole: 'Acoustic Engineer & Audio Post Specialist',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    nomorAlumni: 'MMTC-2020-215',
    category: 'showreel',
    content: 'Dokumentasi panduan setup Dolby Atmos 7.1.4 untuk studio pascaproduksi independen. Saya sertakan panduan kalibrasi SPL meter dan diagram akustik ruangan dalam format PDF.',
    hashtags: ['#Matekstosi', '#DolbyAtmos', '#AudioEngineering', '#StudioSetup'],
    mediaType: 'pdf',
    mediaUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    mediaTitle: 'Panduan_Setup_Dolby_Atmos_7.1.4_MMTC.pdf',
    mediaSize: '3.1 MB',
    likesCount: 29,
    likedBy: ['user-seed-budi', 'user-seed-fajar', 'user-seed-kurniawan'],
    commentsCount: 0,
    comments: [],
    createdAt: '2026-10-26T09:00:00.000Z',
    updatedAt: '2026-10-26T09:00:00.000Z'
  }
};

const INITIAL_JOBS: Record<string, Record<string, unknown>> = {
  'job-seed-01': {
    id: 'job-seed-01',
    judul: 'Senior 3D Character Rigger & Animator',
    perusahaan: 'Infinite Studios',
    lokasi: 'Batam / Hybrid Yogyakarta',
    tipe: 'Full-time',
    prodiTarget: ['Animasi', 'Game Design'],
    deskripsi: 'Bertanggung jawab membangun sistem rigging karakter 3D dan facial blendshapes untuk produksi serial animasi internasional menggunakan Blender & Maya.',
    kualifikasi: [
      'Lulusan D4 Animasi atau Teknologi Permainan STMM MMTC Yogyakarta',
      'Menguasai rigging karakter, weight painting, dan Python expression di Blender/Maya',
      'Memiliki showreel animasi/rigging terbaru'
    ],
    kontakEmail: 'recruitment@infinitestudios.id',
    postedBy: 'seed-recruiter-1',
    posterName: 'Budi Santoso (Alumni 2018)',
    status: 'active',
    createdAt: '2026-10-25T09:00:00.000Z'
  },
  'job-seed-02': {
    id: 'job-seed-02',
    judul: 'Broadcast Technical Director & Audio Engineer',
    perusahaan: 'MNC Media Group',
    lokasi: 'Jakarta Barat (On-site)',
    tipe: 'Full-time',
    prodiTarget: ['Matekstosi', 'Manaprodsi'],
    deskripsi: 'Mengelola sistem operasional studio penyiaran multi-kamera, vision mixer switcher, dan audio mixing console untuk program siaran langsung nasional.',
    kualifikasi: [
      'Alumni D4 Matekstosi atau Manaprodsi STMM MMTC Yogyakarta',
      'Memahami sistem routing SDI/NDI, intercom, dan digital audio mixing',
      'Siap bekerja dalam sistem shift produksi televisi'
    ],
    kontakEmail: 'career@mncgroup.com',
    postedBy: 'seed-recruiter-2',
    posterName: 'Fajar Nugraha (Alumni 2021)',
    status: 'active',
    createdAt: '2026-10-25T14:30:00.000Z'
  },
  'job-seed-03': {
    id: 'job-seed-03',
    judul: 'Digital News Producer & Investigative Journalist',
    perusahaan: 'Kompas TV & Digital Network',
    lokasi: 'Jakarta Pusat / Yogyakarta Bureau',
    tipe: 'Full-time',
    prodiTarget: ['Manarita', 'MIK', 'Manaprodsi'],
    deskripsi: 'Menyusun riset liputan mendalam, naskah berita multiplatform, serta mengelola distribusi konten jurnalisme visual di kanal televisi dan digital.',
    kualifikasi: [
      'Alumni D3 Manarita, D4 MIK, atau D4 Manaprodsi STMM MMTC',
      'Memiliki kemampuan jurnalistik, riset data, dan storytelling visual yang kuat',
      'Menguasai alur kerja newsroom digital modern'
    ],
    kontakEmail: 'hrd@kompas.tv',
    postedBy: 'seed-recruiter-3',
    posterName: 'Rian Hidayat (Alumni 2021)',
    status: 'active',
    createdAt: '2026-10-26T08:00:00.000Z'
  }
};

function loadDb(): DbSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial: DbSchema = {
        alumni_registry: { ...INITIAL_ALUMNI_REGISTRY },
        users: {},
        public_profiles: { ...INITIAL_PUBLIC_PROFILES },
        feed_posts: { ...INITIAL_FEED_POSTS },
        jobs: { ...INITIAL_JOBS },
        applications: {},
        conversations: {}
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<DbSchema>;
    // Ensure all master alumni exist
    const registry = { ...INITIAL_ALUMNI_REGISTRY, ...(parsed.alumni_registry || {}) };
    return {
      alumni_registry: registry,
      users: parsed.users || {},
      public_profiles: parsed.public_profiles || { ...INITIAL_PUBLIC_PROFILES },
      feed_posts: parsed.feed_posts || { ...INITIAL_FEED_POSTS },
      jobs: parsed.jobs || { ...INITIAL_JOBS },
      applications: parsed.applications || {},
      conversations: parsed.conversations || {}
    };
  } catch (err) {
    console.error('Error loading local server DB:', err);
    return {
      alumni_registry: { ...INITIAL_ALUMNI_REGISTRY },
      users: {},
      public_profiles: { ...INITIAL_PUBLIC_PROFILES },
      feed_posts: { ...INITIAL_FEED_POSTS },
      jobs: { ...INITIAL_JOBS },
      applications: {},
      conversations: {}
    };
  }
}

function saveDb(db: DbSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving local server DB:', err);
  }
}

function getAuthenticatedUid(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      if (token.includes('.')) {
        try {
          const parts = token.split('.');
          if (parts.length >= 2) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            return payload.user_id || payload.sub || payload.uid || null;
          }
        } catch {
          // invalid token payload
        }
      } else {
        return token;
      }
    }
  }
  const xUid = req.headers.get('x-user-uid');
  if (xUid && typeof xUid === 'string') return xUid.trim();
  return null;
}

function sanitizeUserProfile(user: Record<string, unknown>): Record<string, unknown> {
  const safe = { ...user };
  delete safe.email;
  delete safe.phone;
  delete safe.nomorHp;
  delete safe.cvFileUrl;
  delete safe.cvExternalLink;
  delete safe.cvUrl;
  delete safe.alamat;
  delete safe.address;
  return safe;
}

export async function GET(req: NextRequest) {
  // SEC.API.UNAUTHENTICATED_DATABASE_ROUTE.01: Production guard
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Endpoint disabled in production' }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const collectionName = searchParams.get('collection') as keyof DbSchema | null;
  const id = searchParams.get('id');
  const nomorAlumni = searchParams.get('nomorAlumni');
  const authorUid = searchParams.get('authorUid');
  const posterUid = searchParams.get('posterUid');
  const applicantUid = searchParams.get('applicantUid');

  const db = loadDb();

  if (!collectionName || !(collectionName in db)) {
    return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
  }

  const col = db[collectionName];
  const callerUid = getAuthenticatedUid(req);
  const caller = callerUid ? db.users[callerUid] : null;
  const isAdmin = caller?.role === 'admin';

  // 1. Applications collection protection (SEC.API.PII_EXPOSURE_USERS_APPLICATIONS.01)
  // Must reject unfiltered dumps. Query parameter posterUid or applicantUid is required.
  if (collectionName === 'applications') {
    if (!posterUid && !applicantUid) {
      return NextResponse.json(
        { error: 'Filter posterUid atau applicantUid wajib disertakan untuk mengakses lamaran' },
        { status: 400 }
      );
    }

    if (id) {
      const item = col[id] || null;
      if (!item) {
        return NextResponse.json({ item: null, doc: null });
      }
      const isAuthorized =
        (posterUid && item.posterUid === posterUid) ||
        (applicantUid && item.applicantUid === applicantUid) ||
        (callerUid && (callerUid === item.posterUid || callerUid === item.applicantUid || isAdmin));

      if (!isAuthorized) {
        return NextResponse.json({ error: 'Akses lamaran ditolak' }, { status: 403 });
      }
      return NextResponse.json({ item, doc: item });
    }

    let items = Object.values(col);
    if (posterUid && applicantUid) {
      items = items.filter((doc) => doc.posterUid === posterUid && doc.applicantUid === applicantUid);
    } else if (posterUid) {
      items = items.filter((doc) => doc.posterUid === posterUid);
    } else if (applicantUid) {
      items = items.filter((doc) => doc.applicantUid === applicantUid);
    }
    return NextResponse.json({ items });
  }

  // 2. Users collection protection (SEC.API.PII_EXPOSURE_USERS_APPLICATIONS.01)
  // Reject unauthenticated unfiltered dumps; sanitize contact PII unless authenticated owner.
  if (collectionName === 'users') {
    if (id) {
      const item = col[id] || null;
      if (!item) {
        return NextResponse.json({ item: null, doc: null });
      }
      const isOwner = Boolean(callerUid && (callerUid === item.uid || callerUid === item.id || callerUid === id));
      const returnedItem = isOwner ? item : sanitizeUserProfile(item);
      return NextResponse.json({ item: returnedItem, doc: returnedItem });
    }

    if (nomorAlumni) {
      const clean = nomorAlumni.trim().replace(/\s+/g, '').replace(/[/._]/g, '-').toUpperCase();
      const found = Object.values(col).find(
        (doc) => String(doc.nomorAlumni || '').trim().replace(/\s+/g, '').replace(/[/._]/g, '-').toUpperCase() === clean
      ) || null;
      if (!found) {
        return NextResponse.json({ item: null, doc: null });
      }
      const isOwner = Boolean(callerUid && (callerUid === found.uid || callerUid === found.id));
      const returnedItem = isOwner ? found : sanitizeUserProfile(found);
      return NextResponse.json({ item: returnedItem, doc: returnedItem });
    }

    // Unfiltered retrieval of users collection:
    // Requires authorization header (rejects anonymous scrapers / unauthorized network callers)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required to query users' }, { status: 401 });
    }

    const items = Object.values(col).map((doc) => {
      const isOwner = Boolean(callerUid && (callerUid === doc.uid || callerUid === doc.id));
      return isOwner ? doc : sanitizeUserProfile(doc);
    });
    return NextResponse.json({ items });
  }

  // 3. Alumni registry collection protection (prevent anonymous scraping of master records)
  if (collectionName === 'alumni_registry') {
    if (id) {
      const clean = id.trim().replace(/\s+/g, '').replace(/[/._]/g, '-').toUpperCase();
      const item = col[clean] || col[id] || null;
      if (!item) {
        return NextResponse.json({ item: null, doc: null });
      }
      return NextResponse.json({ item, doc: item });
    }

    // Unfiltered retrieval requires authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required to query alumni_registry' }, { status: 401 });
    }

    const items = Object.values(col);
    return NextResponse.json({ items });
  }

  // 4. General collections (public_profiles, jobs, feed_posts, etc.)
  if (id) {
    const item = col[id] || null;
    return NextResponse.json({ item, doc: item });
  }

  if (nomorAlumni) {
    const clean = nomorAlumni.trim().replace(/\s+/g, '').replace(/[/._]/g, '-').toUpperCase();
    const found = Object.values(col).find(
      (doc) => String(doc.nomorAlumni || '').trim().replace(/\s+/g, '').replace(/[/._]/g, '-').toUpperCase() === clean
    ) || null;
    return NextResponse.json({ item: found, doc: found });
  }

  let items = Object.values(col);

  if (authorUid) {
    items = items.filter((doc) => doc.authorUid === authorUid);
  }

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  // SEC.API.UNAUTHENTICATED_DATABASE_ROUTE.01: Production guard
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Endpoint disabled in production' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { action } = body;
    const db = loadDb();
    const callerUid = getAuthenticatedUid(req);
    const caller = callerUid ? db.users[callerUid] : null;
    const isAdmin = caller?.role === 'admin';

    if (action === 'setDoc') {
      const { collection: colName, id, data, merge } = body as {
        collection: keyof DbSchema;
        id: string;
        data: Record<string, unknown>;
        merge?: boolean;
      };
      if (!colName || !(colName in db) || !id) {
        return NextResponse.json({ error: 'Missing collection or id' }, { status: 400 });
      }

      // Safeguard against privilege escalation (SEC.API.UNAUTHENTICATED_DATABASE_ROUTE.01):
      // Prevent unauthorized setting of role to 'admin'
      if (data && typeof data === 'object' && 'role' in data && data.role === 'admin') {
        if (!isAdmin) {
          return NextResponse.json({ error: 'Forbidden: Role elevation to admin is prohibited' }, { status: 403 });
        }
      }

      // Safeguard alumni_registry: only administrators can create or mutate master registry records
      if (colName === 'alumni_registry') {
        if (!isAdmin) {
          return NextResponse.json({ error: 'Forbidden: Modifying alumni registry requires administrative privileges' }, { status: 403 });
        }
      }

      // Safeguard applications: prevent applicants or unauthenticated callers from changing status
      if (colName === 'applications') {
        const existing = db.applications[id];
        if (existing && data && typeof data === 'object' && 'status' in data && data.status !== 'pending' && data.status !== existing.status) {
          const isJobPoster = callerUid && (callerUid === existing.posterUid || isAdmin);
          if (!isJobPoster) {
            return NextResponse.json({ error: 'Forbidden: Only the job poster can change application status' }, { status: 403 });
          }
        }
      }

      // Safeguard users: if callerUid is present and updating an existing user, verify ownership
      if (colName === 'users') {
        if (callerUid && callerUid !== id && !isAdmin) {
          return NextResponse.json({ error: 'Forbidden: Cannot modify another user profile' }, { status: 403 });
        }
      }

      const existing = db[colName][id] || {};
      const updated: Record<string, unknown> = merge ? { ...existing, ...data, id } : { ...data, id };
      db[colName][id] = updated;

      // If updating public_profiles with a nomorAlumni, remove duplicate synthetic showcase card with same nomorAlumni
      if (colName === 'public_profiles') {
        const userNomor = String(updated.nomorAlumni || db.users[id]?.nomorAlumni || '').toUpperCase();
        if (userNomor) {
          updated.nomorAlumni = userNomor;
          for (const key of Object.keys(db.public_profiles)) {
            if (key !== id && key.startsWith('showcase-') && String(db.public_profiles[key]?.nomorAlumni || '').toUpperCase() === userNomor) {
              delete db.public_profiles[key];
            }
          }
        }
      }

      saveDb(db);
      return NextResponse.json({ item: updated });
    }

    if (action === 'addDoc') {
      const { collection: colName, data, customId } = body as {
        collection: keyof DbSchema;
        data: Record<string, unknown>;
        customId?: string;
      };
      if (!colName || !(colName in db)) {
        return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
      }

      // Safeguard against privilege escalation
      if (data && typeof data === 'object' && 'role' in data && data.role === 'admin') {
        if (!isAdmin) {
          return NextResponse.json({ error: 'Forbidden: Role elevation to admin is prohibited' }, { status: 403 });
        }
      }

      // Safeguard alumni_registry
      if (colName === 'alumni_registry') {
        if (!isAdmin) {
          return NextResponse.json({ error: 'Forbidden: Adding to alumni registry requires administrative privileges' }, { status: 403 });
        }
      }

      const newId = customId || `${colName.replace(/s$/, '')}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const item = { ...data, id: newId };
      db[colName][newId] = item;
      saveDb(db);
      return NextResponse.json({ item, id: newId });
    }

    if (action === 'deleteDoc') {
      const { collection: colName, id } = body as {
        collection: keyof DbSchema;
        id: string;
      };
      if (!colName || !(colName in db) || !id) {
        return NextResponse.json({ error: 'Missing collection or id' }, { status: 400 });
      }

      // Safeguard users collection from arbitrary deletion
      if (colName === 'users') {
        if (!isAdmin) {
          return NextResponse.json({ error: 'Forbidden: Cannot delete user records' }, { status: 403 });
        }
      }

      // Safeguard alumni_registry
      if (colName === 'alumni_registry') {
        if (!isAdmin) {
          return NextResponse.json({ error: 'Forbidden: Cannot delete alumni registry records' }, { status: 403 });
        }
      }

      // Safeguard jobs collection: only poster or admin can delete
      if (colName === 'jobs') {
        const job = db.jobs[id];
        if (!isAdmin && (!job || !callerUid || callerUid !== job.postedBy)) {
          return NextResponse.json({ error: 'Forbidden: Only the job poster or admin can delete this job' }, { status: 403 });
        }
      }

      // Safeguard applications: only applicant, poster, or admin
      if (colName === 'applications') {
        const app = db.applications[id];
        if (!isAdmin && (!app || !callerUid || (callerUid !== app.applicantUid && callerUid !== app.posterUid))) {
          return NextResponse.json({ error: 'Forbidden: Cannot delete application' }, { status: 403 });
        }
      }

      // Safeguard feed_posts: only author or admin
      if (colName === 'feed_posts') {
        const post = db.feed_posts[id];
        if (!isAdmin && (!post || !callerUid || callerUid !== post.authorUid)) {
          return NextResponse.json({ error: 'Forbidden: Only the author or admin can delete this post' }, { status: 403 });
        }
      }

      delete db[colName][id];
      saveDb(db);
      return NextResponse.json({ deleted: true });
    }

    if (action === 'registerAlumni') {
      const { uid, email, nomorAlumni, profileData, publicProfileData } = body as {
        uid: string;
        email: string;
        nomorAlumni?: string;
        profileData?: Record<string, unknown>;
        publicProfileData?: Record<string, unknown>;
      };

      if (!nomorAlumni || !uid || !profileData) {
        return NextResponse.json({ error: 'Parameter registrasi tidak lengkap' }, { status: 400 });
      }

      const cleanNomor = nomorAlumni.trim().replace(/\s+/g, '').replace(/[/._]/g, '-').toUpperCase();
      const registryEntry = db.alumni_registry[cleanNomor];

      // SEC.AUTH.REGISTRY_BYPASS_SERVER_DB.01:
      // Do NOT auto-create arbitrary unregistered student numbers.
      // Check that cleanNomor already exists in db.alumni_registry and isRegistered !== true.
      if (!registryEntry) {
        return NextResponse.json({ error: 'Nomor alumni tidak terdaftar dalam database institusi' }, { status: 400 });
      }

      if (registryEntry.isRegistered === true) {
        return NextResponse.json({ error: 'Nomor alumni ini sudah terdaftar sebelumnya' }, { status: 400 });
      }

      const now = new Date().toISOString();

      db.alumni_registry[cleanNomor] = {
        ...registryEntry,
        nomorAlumni: cleanNomor,
        namaLengkap: profileData.namaLengkap || registryEntry.namaLengkap,
        prodi: registryEntry.prodi || profileData.prodi,
        angkatan: registryEntry.angkatan || profileData.angkatan,
        isRegistered: true,
        registeredUid: uid,
        registeredEmail: email,
        registeredAt: now
      };

      db.users[uid] = { ...profileData, uid, id: uid };
      db.public_profiles[uid] = { ...(publicProfileData || {}), uid, id: uid, nomorAlumni: cleanNomor };

      // Deduplicate synthetic showcase profile if same nomorAlumni
      for (const key of Object.keys(db.public_profiles)) {
        if (key !== uid && key.startsWith('showcase-') && String(db.public_profiles[key]?.nomorAlumni || '').toUpperCase() === cleanNomor) {
          delete db.public_profiles[key];
        }
      }

      saveDb(db);
      return NextResponse.json({ success: true, profile: db.users[uid] });
    }

    if (action === 'toggleLike') {
      const { postId, userUid } = body as { postId: string; userUid: string };
      const post = db.feed_posts[postId];
      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      const likedBy = Array.isArray(post.likedBy) ? [...(post.likedBy as string[])] : [];
      const alreadyLiked = likedBy.includes(userUid);
      const updatedLikedBy = alreadyLiked
        ? likedBy.filter((u) => u !== userUid)
        : [...likedBy, userUid];
      const currentLikes = Number(post.likesCount || 0);
      const updatedLikes = alreadyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1;

      post.likedBy = updatedLikedBy;
      post.likesCount = updatedLikes;
      post.updatedAt = new Date().toISOString();
      db.feed_posts[postId] = post;
      saveDb(db);
      return NextResponse.json({ item: post });
    }

    if (action === 'addComment') {
      const { postId, comment } = body as { postId: string; comment: Record<string, unknown> };
      const post = db.feed_posts[postId];
      if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }
      const comments = Array.isArray(post.comments) ? [...(post.comments as Record<string, unknown>[])] : [];
      comments.push(comment);
      post.comments = comments;
      post.commentsCount = comments.length;
      post.updatedAt = new Date().toISOString();
      db.feed_posts[postId] = post;
      saveDb(db);
      return NextResponse.json({ item: post, comment });
    }

    if (action === 'uploadFile') {
      // SEC.API.UPLOAD_FILE_UNDEFINED_BASE64_CRASH.01:
      // Handle both dataUrl and base64Data parameter aliases and defensively verify string presence
      const rawData = body.base64Data || body.dataUrl;
      if (!rawData || typeof rawData !== 'string' || rawData.trim() === '') {
        return NextResponse.json({ error: 'Data berkas tidak valid atau kosong' }, { status: 400 });
      }

      // SEC.UPLOAD.UNRESTRICTED_FILE_WRITE_XSS.01:
      // Strictly validate file extensions against a safe whitelist (reject .html, .svg, .js, etc.)
      const rawFileName = typeof body.fileName === 'string' ? body.fileName : 'file';
      const extMatch = rawFileName.match(/\.([a-zA-Z0-9]+)$/);
      const ext = extMatch ? extMatch[1].toLowerCase() : '';
      const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

      if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json({
          error: `Ekstensi berkas .${ext || 'unknown'} tidak diizinkan. Hanya format berikut yang diperbolehkan: ${ALLOWED_EXTENSIONS.join(', ')}`
        }, { status: 400 });
      }

      // Check MIME type in dataUrl if provided
      if (rawData.startsWith('data:')) {
        const mimeMatch = rawData.match(/^data:([a-zA-Z0-9.+_-]+\/[a-zA-Z0-9.+_-]+);base64,/);
        if (mimeMatch) {
          const mime = mimeMatch[1].toLowerCase();
          const ALLOWED_MIMES = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'application/pdf'
          ];
          if (!ALLOWED_MIMES.includes(mime)) {
            return NextResponse.json({
              error: `Tipe MIME ${mime} tidak diizinkan demi keamanan`
            }, { status: 400 });
          }
        }
      }

      const base64Clean = rawData.includes(',') ? rawData.split(',')[1] : rawData;
      let buffer: Buffer;
      try {
        buffer = Buffer.from(base64Clean, 'base64');
      } catch {
        return NextResponse.json({ error: 'Gagal menguraikan konten berkas base64' }, { status: 400 });
      }

      if (buffer.length === 0) {
        return NextResponse.json({ error: 'Berkas kosong (0 bytes)' }, { status: 400 });
      }

      // Enforce file size bounds (max 10MB)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      if (buffer.length > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'Ukuran file melebihi batas maksimal 10MB' }, { status: 400 });
      }

      // Magic byte verification and XML/HTML/SVG inspection
      const headerSnippet = buffer.subarray(0, Math.min(buffer.length, 512)).toString('utf8').toLowerCase();
      if (
        headerSnippet.includes('<svg') ||
        headerSnippet.includes('<?xml') ||
        headerSnippet.includes('<!doctype') ||
        headerSnippet.includes('<html') ||
        headerSnippet.includes('<script')
      ) {
        return NextResponse.json({ error: 'Konten berkas terindikasi format XML/HTML/SVG yang tidak diizinkan demi keamanan' }, { status: 400 });
      }

      // Validate magic bytes for format integrity
      if (ext === 'png') {
        // PNG magic bytes: 0x89 0x50 0x4E 0x47
        if (buffer.length < 4 || buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
          return NextResponse.json({ error: 'Format berkas PNG tidak valid (magic bytes mismatch)' }, { status: 400 });
        }
      } else if (ext === 'jpg' || ext === 'jpeg') {
        // JPEG magic bytes: 0xFF 0xD8
        if (buffer.length < 2 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
          return NextResponse.json({ error: 'Format berkas JPEG tidak valid (magic bytes mismatch)' }, { status: 400 });
        }
      } else if (ext === 'pdf') {
        // PDF magic bytes: %PDF- (0x25 0x50 0x44 0x46)
        if (buffer.length < 4 || buffer[0] !== 0x25 || buffer[1] !== 0x50 || buffer[2] !== 0x44 || buffer[3] !== 0x46) {
          return NextResponse.json({ error: 'Format berkas PDF tidak valid (magic bytes mismatch)' }, { status: 400 });
        }
      }

      const targetFolder = (typeof body.folder === 'string' ? body.folder.replace(/[^a-zA-Z0-9_-]/g, '') : '') || 'media';
      const targetDir = path.join(UPLOADS_DIR, targetFolder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      const rawBase = path.basename(rawFileName, path.extname(rawFileName)).replace(/[^a-zA-Z0-9_-]/g, '_');
      const cleanName = `${Date.now()}_${rawBase || 'upload'}.${ext}`;
      const filePath = path.join(targetDir, cleanName);
      fs.writeFileSync(filePath, buffer);
      const publicUrl = `/uploads/${targetFolder}/${cleanName}`;
      return NextResponse.json({ url: publicUrl });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const e = err as Error;
    console.error('Error in POST /api/db:', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
