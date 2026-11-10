import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  arrayUnion, 
  arrayRemove, 
  increment,
  Unsubscribe 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { FeedPost, FeedComment, FeedCategory } from '@/types';
import { safeHttpUrl } from '@/lib/media';

/**
 * 5 Data Postingan Kurasi Awal untuk Fallback & Demo Presentasi
 * Mewakili berbagai Program Studi STMM MMTC dengan showreel, kolaborasi, dan diskusi.
 */
export const INITIAL_CURATED_POSTS: FeedPost[] = [
  {
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
    commentsCount: 3,
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
  {
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
  {
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
    commentsCount: 2,
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
  {
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
  {
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
];

/**
 * Helper untuk mengonversi File ke Base64 Data URL saat upload ke server lokal (/api/db)
 */
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Listener Real-Time (Cloud Server DB + Firestore) untuk Feed Postingan Komunitas.
 * Mendukung sinkronisasi real-time antar semua pengguna/browser tanpa perlu add friend terlebih dahulu.
 */
export function subscribeToFeedPosts(
  callback: (posts: FeedPost[]) => void
): Unsubscribe {
  let isCancelled = false;
  let firestoreUnsub: Unsubscribe = () => {};
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  const fetchSharedFeed = async (): Promise<FeedPost[] | null> => {
    if (typeof window === 'undefined') return null;
    try {
      const res = await fetch('/api/db?collection=feed_posts', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.items) && json.items.length > 0) {
          return json.items.map((data: Record<string, unknown>) => ({
            ...data,
            id: String(data.id || ''),
            comments: Array.isArray(data.comments) ? data.comments : [],
            likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
            likesCount: Number(data.likesCount || 0),
            commentsCount: Number(data.commentsCount || 0)
          })) as FeedPost[];
        }
      }
    } catch {
      // ignore
    }
    return null;
  };

  if (typeof window !== 'undefined') {
    // 1. Load immediately from shared server DB (/api/db)
    fetchSharedFeed().then((posts) => {
      if (!isCancelled && posts) {
        callback(posts);
      }
    });

    // 2. Poll every 2.5 seconds so any post/like/comment from any browser/user appears automatically
    pollInterval = setInterval(async () => {
      if (isCancelled) return;
      const posts = await fetchSharedFeed();
      if (!isCancelled && posts) {
        callback(posts);
      }
    }, 2500);

    const handleFeedEvent = () => {
      fetchSharedFeed().then((posts) => {
        if (!isCancelled && posts) {
          callback(posts);
        }
      });
    };
    window.addEventListener('mmtc_feed_updated', handleFeedEvent);

    const cleanupWindow = () => {
      window.removeEventListener('mmtc_feed_updated', handleFeedEvent);
    };

    try {
      const q = query(
        collection(db, 'feed_posts'),
        orderBy('createdAt', 'desc')
      );

      firestoreUnsub = onSnapshot(
        q,
        async (snapshot) => {
          if (isCancelled) return;
          const sharedPosts = await fetchSharedFeed();
          if (sharedPosts && sharedPosts.length > 0) {
            callback(sharedPosts);
            return;
          }
          if (snapshot.empty) {
            callback(INITIAL_CURATED_POSTS);
            return;
          }

          const posts: FeedPost[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              ...data,
              id: d.id,
              comments: Array.isArray(data.comments) ? data.comments : [],
              likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
              likesCount: Number(data.likesCount || 0),
              commentsCount: Number(data.commentsCount || 0)
            } as FeedPost;
          });

          callback(posts);
        },
        async () => {
          const sharedPosts = await fetchSharedFeed();
          if (!isCancelled) {
            callback(sharedPosts || INITIAL_CURATED_POSTS);
          }
        }
      );
    } catch {
      // fallback already handled by pollInterval & initial fetch
    }

    return () => {
      isCancelled = true;
      if (pollInterval) clearInterval(pollInterval);
      cleanupWindow();
      firestoreUnsub();
    };
  }

  // Non-browser environment (e.g. Node CLI / Emulator tests)
  try {
    const q = query(
      collection(db, 'feed_posts'),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          callback(INITIAL_CURATED_POSTS);
          return;
        }

        const posts: FeedPost[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            comments: Array.isArray(data.comments) ? data.comments : [],
            likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
            likesCount: Number(data.likesCount || 0),
            commentsCount: Number(data.commentsCount || 0)
          } as FeedPost;
        });

        callback(posts);
      },
      (error) => {
        console.warn('subscribeToFeedPosts Firestore listener fallback to curated:', error);
        callback(INITIAL_CURATED_POSTS);
      }
    );
  } catch (err) {
    console.warn('subscribeToFeedPosts setup error:', err);
    callback(INITIAL_CURATED_POSTS);
    return () => {};
  }
}

/**
 * Membuat postingan feed komunitas baru di Database & Firestore,
 * mendukung upload file gambar/PDF ke Storage / Server.
 */
export async function createFeedPost(
  params: {
    authorUid: string;
    authorName: string;
    authorProdi: string;
    authorAngkatan?: string;
    authorRole?: string;
    authorAvatar?: string;
    nomorAlumni?: string;
    category: FeedCategory;
    content: string;
    hashtags?: string[];
    mediaType?: 'youtube' | 'image' | 'pdf';
    mediaUrl?: string;
    mediaTitle?: string;
    mediaSize?: string;
  },
  file?: File | null
): Promise<FeedPost> {
  const content = params.content.trim();
  if (!content) {
    throw new Error('Konten postingan tidak boleh kosong.');
  }
  if (content.length > 3000) {
    throw new Error('Panjang konten melebihi batas 3000 karakter.');
  }

  let finalMediaType = params.mediaType;
  let finalMediaUrl = params.mediaUrl;
  let finalMediaTitle = params.mediaTitle;
  let finalMediaSize = params.mediaSize;

  // Jika melampirkan file foto atau dokumen PDF
  if (file) {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Ukuran berkas maksimal 10 MB.');
    }

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
      throw new Error('Format berkas tidak didukung. Harap unggah foto (JPEG/PNG/WebP) atau dokumen PDF.');
    }

    if (file.type === 'image/svg+xml') {
      throw new Error('Berkas format SVG tidak diizinkan demi keamanan.');
    }

    // Tentukan tipe media
    finalMediaType = isPdf ? 'pdf' : 'image';
    finalMediaTitle = file.name;
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    finalMediaSize = `${sizeInMb} MB`;

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    let uploadedUrl = '';

    // 1. Coba upload ke Server DB (/api/db) jika di browser
    if (typeof window !== 'undefined') {
      try {
        const dataUrl = await fileToDataUrl(file);
        const uploadRes = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'uploadFile',
            folder: `feed_media_${params.authorUid}`,
            fileName: cleanFileName,
            dataUrl
          })
        });
        if (uploadRes.ok) {
          const upJson = await uploadRes.json();
          if (upJson.url) uploadedUrl = upJson.url;
        }
      } catch {
        // fallback to Firebase Storage below
      }
    }

    // 2. Coba upload ke Firebase Storage jika belum berhasil atau di environment test
    if (!uploadedUrl) {
      try {
        const storagePath = `feed_media/${params.authorUid}/${Date.now()}_${cleanFileName}`;
        const storageRef = ref(storage, storagePath);
        const snapshot = await uploadBytes(storageRef, file, {
          contentType: file.type
        });
        uploadedUrl = await getDownloadURL(snapshot.ref);
      } catch (storageErr) {
        if (!uploadedUrl) throw storageErr;
      }
    }

    finalMediaUrl = uploadedUrl;
  } else if (params.mediaType === 'youtube' && params.mediaUrl) {
    const sanitized = safeHttpUrl(params.mediaUrl, ['youtube.com', 'youtu.be']);
    if (!sanitized) {
      throw new Error('Tautan YouTube tidak valid.');
    }
    finalMediaUrl = sanitized;
  } else if (params.mediaType === 'pdf' && params.mediaUrl) {
    const sanitized = safeHttpUrl(params.mediaUrl);
    if (!sanitized) {
      throw new Error('Tautan berkas PDF tidak valid atau protokol URL tidak diizinkan.');
    }
    finalMediaUrl = sanitized;
  } else if (params.mediaUrl) {
    const sanitized = safeHttpUrl(params.mediaUrl);
    if (!sanitized) {
      throw new Error('Tautan berkas media tidak valid atau protokol URL tidak diizinkan.');
    }
    finalMediaUrl = sanitized;
  }

  const now = new Date().toISOString();
  const postData: Omit<FeedPost, 'id'> = {
    authorUid: params.authorUid,
    authorName: params.authorName,
    authorProdi: params.authorProdi,
    authorAngkatan: params.authorAngkatan || '',
    authorRole: params.authorRole || '',
    authorAvatar: params.authorAvatar || '',
    nomorAlumni: params.nomorAlumni || '',
    category: params.category,
    content,
    hashtags: params.hashtags || [],
    ...(finalMediaType ? { mediaType: finalMediaType } : {}),
    ...(finalMediaUrl ? { mediaUrl: finalMediaUrl } : {}),
    ...(finalMediaTitle ? { mediaTitle: finalMediaTitle } : {}),
    ...(finalMediaSize ? { mediaSize: finalMediaSize } : {}),
    likesCount: 0,
    likedBy: [],
    commentsCount: 0,
    comments: [],
    createdAt: now,
    updatedAt: now
  };

  let createdId = '';
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addDoc',
          collection: 'feed_posts',
          data: postData
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.id) {
          createdId = json.id;
          window.dispatchEvent(new Event('mmtc_feed_updated'));
        }
      }
    } catch {
      // ignore
    }
  }

  try {
    const docRef = await addDoc(collection(db, 'feed_posts'), postData);
    if (!createdId) createdId = docRef.id;
  } catch (err) {
    if (!createdId) throw err;
  }

  return {
    id: createdId,
    ...postData
  };
}

/**
 * Toggle Like/Unlike pada postingan dengan update atomik untuk seluruh user.
 */
export async function toggleLikePost(
  postId: string,
  userUid: string,
  isCurrentlyLiked: boolean
): Promise<void> {
  const now = new Date().toISOString();
  let apiSucceeded = false;

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggleLike',
          postId,
          userUid,
          isCurrentlyLiked
        })
      });
      if (res.ok) {
        apiSucceeded = true;
        window.dispatchEvent(new Event('mmtc_feed_updated'));
      }
    } catch {
      // ignore
    }
  }

  try {
    const postRef = doc(db, 'feed_posts', postId);
    await updateDoc(postRef, {
      likedBy: isCurrentlyLiked ? arrayRemove(userUid) : arrayUnion(userUid),
      likesCount: increment(isCurrentlyLiked ? -1 : 1),
      updatedAt: now
    });
  } catch (err) {
    if (!apiSucceeded) throw err;
  }
}

/**
 * Menambahkan komentar baru ke sebuah postingan feed untuk seluruh user.
 */
export async function addPostComment(
  postId: string,
  commentData: {
    authorUid: string;
    authorName: string;
    authorProdi: string;
    authorAvatar?: string;
    text: string;
  }
): Promise<FeedComment> {
  const cleanText = commentData.text.trim();
  if (!cleanText) {
    throw new Error('Komentar tidak boleh kosong.');
  }
  if (cleanText.length > 1000) {
    throw new Error('Komentar maksimal 1000 karakter.');
  }

  const now = new Date().toISOString();
  const newComment: FeedComment = {
    id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    authorUid: commentData.authorUid,
    authorName: commentData.authorName,
    authorProdi: commentData.authorProdi,
    authorAvatar: commentData.authorAvatar || '',
    text: cleanText,
    createdAt: now
  };

  let apiSucceeded = false;
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addComment',
          postId,
          comment: newComment
        })
      });
      if (res.ok) {
        apiSucceeded = true;
        window.dispatchEvent(new Event('mmtc_feed_updated'));
      }
    } catch {
      // ignore
    }
  }

  try {
    const postRef = doc(db, 'feed_posts', postId);
    await updateDoc(postRef, {
      comments: arrayUnion(newComment),
      commentsCount: increment(1),
      updatedAt: now
    });
  } catch (err) {
    if (!apiSucceeded) throw err;
  }

  return newComment;
}

/**
 * Menghapus dokumen postingan dari Database & Firestore.
 */
export async function deleteFeedPost(postId: string): Promise<void> {
  let apiSucceeded = false;
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteDoc',
          collection: 'feed_posts',
          id: postId
        })
      });
      if (res.ok) {
        apiSucceeded = true;
        window.dispatchEvent(new Event('mmtc_feed_updated'));
      }
    } catch {
      // ignore
    }
  }

  try {
    const postRef = doc(db, 'feed_posts', postId);
    await deleteDoc(postRef);
  } catch (err) {
    if (!apiSucceeded) throw err;
  }
}

/**
 * Mengambil postingan yang dibuat oleh alumni tertentu (untuk /aktivitas & profil).
 */
export async function getUserFeedPosts(authorUid: string): Promise<FeedPost[]> {
  if (!authorUid) return [];

  if (typeof window !== 'undefined') {
    try {
      const res = await fetch(`/api/db?collection=feed_posts&authorUid=${encodeURIComponent(authorUid)}`, {
        cache: 'no-store'
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.items) && json.items.length > 0) {
          const mapped = json.items.map((data: Record<string, unknown>) => ({
            ...data,
            id: String(data.id || ''),
            comments: Array.isArray(data.comments) ? data.comments : [],
            likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
            likesCount: Number(data.likesCount || 0),
            commentsCount: Number(data.commentsCount || 0)
          })) as FeedPost[];
          mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          return mapped;
        }
      }
    } catch {
      // fallback below
    }
  }

  try {
    // Query by authorUid without mandatory composite index
    const q1 = query(
      collection(db, 'feed_posts'),
      where('authorUid', '==', authorUid)
    );
    const snap1 = await getDocs(q1);
    let docs = snap1.docs;

    // If no docs and authorUid might be a nomorAlumni, also query by nomorAlumni
    if (docs.length === 0) {
      const q2 = query(
        collection(db, 'feed_posts'),
        where('nomorAlumni', '==', authorUid)
      );
      const snap2 = await getDocs(q2);
      docs = snap2.docs;
    }

    if (docs.length > 0) {
      const list = docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          comments: Array.isArray(data.comments) ? data.comments : [],
          likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
          likesCount: Number(data.likesCount || 0),
          commentsCount: Number(data.commentsCount || 0)
        } as FeedPost;
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return list;
    }
    return [];
  } catch (err) {
    console.warn('getUserFeedPosts error, fallback to curated matches:', err);
  }

  // Filter fallback jika ada postingan contoh milik authorUid
  return INITIAL_CURATED_POSTS.filter((p) => p.authorUid === authorUid || p.nomorAlumni === authorUid);
}
