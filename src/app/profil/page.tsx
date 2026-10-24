'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { db, storage } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { PortfolioItem, PRODI_LIST, ProdiType } from '@/types';
import { parseYouTubeVideoId } from '@/lib/media';
import { 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  FileText,
  ExternalLink,
  Camera,
  Video,
  Save,
  Globe,
  Phone,
  Eye,
  Sparkles,
  Maximize2,
  Briefcase
} from 'lucide-react';
import AlumniAvatar from '@/components/profile/AlumniAvatar';
import AlumniActivityHistory from '@/components/profile/AlumniActivityHistory';
import { ProfileHeaderSkeleton } from '@/components/ui/Skeleton';
import { CinemaLightbox } from '@/components/ui/Modal';
import { extractSkills } from '@/components/profile/skills';
import { UserProfile } from '@/types';

interface ExtendedUserProfile extends UserProfile {
  pekerjaanSaatIni?: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms)
  );
  return Promise.race([promise, timeoutPromise]);
}

// Data Dummy Demo untuk Preview Mode Tanpa Login
const DEMO_PROFILE = {
  uid: 'demo-alumni-001',
  namaLengkap: 'Budi Santoso',
  fotoProfil: '',
  prodi: 'Animasi' as ProdiType,
  angkatan: '2020',
  nomorAlumni: 'MMTC-2020-103',
  email: 'budi.santoso@alumni.mmtc.ac.id',
  openToWork: true,
  pekerjaanSaatIni: '3D Animator di Infinite Studios',
  bio: '3D Character Animator & Rigger lulusan STMM MMTC Yogyakarta. Terbiasa menangani pipeline produksi animasi 3D studio, motion graphics penyiaran, serta asset 3D untuk game engine.',
  phone: '081234567890',
  linkedinUrl: 'https://linkedin.com/in/budi-santoso-mmtc',
  cvExternalLink: 'https://drive.google.com/drive/folders/sample-cv',
  cvFileUrl: '',
  portfolio: [
    {
      id: 'demo-1',
      title: '3D Character Animation Showreel 2026',
      type: 'youtube' as const,
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      id: 'demo-2',
      title: 'Broadcast Motion Graphic Package',
      type: 'behance' as const,
      url: 'https://behance.net'
    }
  ]
};

export default function ProfilPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const isDemo = !user;

  const currentProfile = profile || (isDemo ? DEMO_PROFILE : null);

  const [namaLengkap, setNamaLengkap] = useState(currentProfile?.namaLengkap ?? DEMO_PROFILE.namaLengkap);
  const [prodi, setProdi] = useState<ProdiType>(currentProfile?.prodi ?? 'Animasi');
  const [angkatan, setAngkatan] = useState(currentProfile?.angkatan ?? DEMO_PROFILE.angkatan);
  const [openToWork, setOpenToWork] = useState(currentProfile?.openToWork ?? true);
  const [pekerjaanSaatIni, setPekerjaanSaatIni] = useState((currentProfile as ExtendedUserProfile | null)?.pekerjaanSaatIni ?? DEMO_PROFILE.pekerjaanSaatIni);
  const [bio, setBio] = useState(currentProfile?.bio ?? DEMO_PROFILE.bio);
  const [phone, setPhone] = useState(currentProfile?.phone ?? DEMO_PROFILE.phone);
  const [linkedinUrl, setLinkedinUrl] = useState(currentProfile?.linkedinUrl ?? DEMO_PROFILE.linkedinUrl);
  const [cvExternalLink, setCvExternalLink] = useState(currentProfile?.cvExternalLink ?? DEMO_PROFILE.cvExternalLink);

  // Upload file state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Portfolio State
  const [portfolioList, setPortfolioList] = useState<PortfolioItem[]>(currentProfile?.portfolio ?? DEMO_PROFILE.portfolio);
  const [portType, setPortType] = useState<'youtube' | 'pinterest' | 'behance' | 'image' | 'link'>('youtube');
  const [portTitle, setPortTitle] = useState('');
  const [portUrl, setPortUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [cinemaVideo, setCinemaVideo] = useState<{ videoId: string; title: string } | null>(null);

  // Guard against overwriting local uncommitted form inputs when background profile refreshes for same user
  const initializedUidRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (profile && initializedUidRef.current !== profile.uid) {
      initializedUidRef.current = profile.uid;
      setNamaLengkap(profile.namaLengkap || '');
      setProdi(profile.prodi || 'Animasi');
      setAngkatan(profile.angkatan || '');
      setOpenToWork(profile.openToWork ?? true);
      setPekerjaanSaatIni((profile as ExtendedUserProfile).pekerjaanSaatIni || '');
      setBio(profile.bio || '');
      setPhone(profile.phone || '');
      setLinkedinUrl(profile.linkedinUrl || '');
      setCvExternalLink(profile.cvExternalLink || '');
      setPortfolioList(profile.portfolio || []);
    }
  }, [profile]);

  const handleAddPortfolio = async () => {
    if (!portTitle.trim() || !portUrl.trim()) return;
    const newItem: PortfolioItem = {
      id: Date.now().toString(),
      type: portType,
      title: portTitle.trim(),
      url: portUrl.trim(),
    };
    const updatedList = [...portfolioList, newItem];
    setPortfolioList(updatedList);
    setPortTitle('');
    setPortUrl('');

    if (isDemo || !user) {
      setMsg({ type: 'success', text: `[Preview] Berhasil menambahkan "${newItem.title}" ke galeri showreel!` });
      setTimeout(() => setMsg({ type: '', text: '' }), 4000);
      return;
    }

    try {
      await withTimeout(
        setDoc(doc(db, 'users', user.uid), {
          portfolio: updatedList,
          updatedAt: new Date().toISOString()
        }, { merge: true }),
        6000,
        'Koneksi timeout saat menyimpan portofolio'
      );
      await refreshProfile();
      setMsg({ type: 'success', text: `Berhasil menambahkan "${newItem.title}" ke portofolio!` });
      setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    } catch (err: unknown) {
      console.error(err);
      const e = err as Error;
      setMsg({ type: 'error', text: e.message || 'Gagal menyimpan portofolio.' });
    }
  };

  const handleRemovePortfolio = async (id: string) => {
    const updatedList = portfolioList.filter(p => p.id !== id);
    setPortfolioList(updatedList);

    if (isDemo || !user) {
      setMsg({ type: 'success', text: '[Preview] Item portofolio berhasil dihapus dari simulasi.' });
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
      return;
    }

    try {
      await withTimeout(
        setDoc(doc(db, 'users', user.uid), {
          portfolio: updatedList,
          updatedAt: new Date().toISOString()
        }, { merge: true }),
        5000,
        'Koneksi timeout saat menghapus portofolio'
      );
      await refreshProfile();
      setMsg({ type: 'success', text: 'Item portofolio berhasil dihapus.' });
      setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    } catch (err: unknown) {
      console.error(err);
      const e = err as Error;
      setMsg({ type: 'error', text: e.message || 'Gagal menghapus portofolio.' });
    }
  };

  const handleUploadCV = async () => {
    if (!cvFile) return;

    if (cvFile.size > 5 * 1024 * 1024) {
      setMsg({ type: 'error', text: 'Ukuran file CV melebihi batas maksimal 5MB.' });
      return;
    }

    setUploadingCV(true);
    setMsg({ type: '', text: '' });

    if (isDemo || !user) {
      setTimeout(() => {
        setUploadingCV(false);
        setMsg({ type: 'success', text: '[Preview] File CV PDF berhasil disimulasikan terunggah!' });
        setCvFile(null);
      }, 800);
      return;
    }

    try {
      const fileName = `${user.uid}_${Date.now()}_${cvFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storageRef = ref(storage, `cv_documents/${fileName}`);
      await withTimeout(uploadBytes(storageRef, cvFile), 15000, 'Koneksi timeout saat upload file CV');
      const downloadUrl = await getDownloadURL(storageRef);

      await withTimeout(
        setDoc(doc(db, 'users', user.uid), {
          cvFileUrl: downloadUrl,
          updatedAt: new Date().toISOString()
        }, { merge: true }),
        6000,
        'Koneksi timeout saat memperbarui data CV di profil'
      );
      await refreshProfile();
      setMsg({ type: 'success', text: 'File CV berhasil diunggah ke cloud storage!' });
      setCvFile(null);
    } catch (err: unknown) {
      const e = err as Error;
      setMsg({ type: 'error', text: e.message || 'Gagal mengupload file CV.' });
    } finally {
      setUploadingCV(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setMsg({ type: 'error', text: 'Ukuran foto profil melebihi batas maksimal 3MB.' });
      return;
    }

    setUploadingAvatar(true);
    setMsg({ type: '', text: '' });

    if (isDemo || !user) {
      setTimeout(() => {
        setUploadingAvatar(false);
        setMsg({ type: 'success', text: '[Preview] Foto profil berhasil disimulasikan!' });
      }, 700);
      return;
    }

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}.${ext}`);
      await withTimeout(uploadBytes(storageRef, file), 15000, 'Koneksi timeout saat upload foto profil');
      const downloadUrl = await getDownloadURL(storageRef);

      await withTimeout(
        setDoc(doc(db, 'users', user.uid), {
          fotoProfil: downloadUrl,
          updatedAt: new Date().toISOString()
        }, { merge: true }),
        6000,
        'Koneksi timeout saat menyimpan URL foto profil'
      );
      await refreshProfile();
      setMsg({ type: 'success', text: 'Foto profil berhasil diperbarui!' });
    } catch (err: unknown) {
      const e = err as Error;
      setMsg({ type: 'error', text: e.message || 'Gagal mengupload foto profil.' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: '', text: '' });

    if (isDemo || !user) {
      setTimeout(() => {
        setSaving(false);
        setMsg({ type: 'success', text: '✨ [Preview Mode] Seluruh perubahan profil & showreel berhasil disimulasikan!' });
        setTimeout(() => setMsg({ type: '', text: '' }), 4000);
      }, 600);
      return;
    }

    try {
      const updateData: Record<string, unknown> = {
        namaLengkap: namaLengkap.trim() || profile?.namaLengkap || user.displayName || user.email?.split('@')[0] || 'Alumni MMTC',
        nomorAlumni: profile?.nomorAlumni || '',
        prodi: prodi || profile?.prodi || 'Animasi',
        angkatan: angkatan.trim() || profile?.angkatan || '',
        email: profile?.email || user.email || '',
        openToWork: Boolean(openToWork),
        pekerjaanSaatIni: pekerjaanSaatIni.trim(),
        bio: bio.trim(),
        phone: phone.trim(),
        linkedinUrl: linkedinUrl.trim(),
        cvExternalLink: cvExternalLink.trim(),
        portfolio: portfolioList,
        updatedAt: new Date().toISOString()
      };

      await withTimeout(
        setDoc(doc(db, 'users', user.uid), updateData, { merge: true }),
        7000,
        'Koneksi timeout saat menyimpan data profil'
      );
      await refreshProfile();
      setMsg({ type: 'success', text: 'Profil alumni berhasil diperbarui!' });
      setTimeout(() => setMsg({ type: '', text: '' }), 4000);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setMsg({ type: 'error', text: errorObj.message || 'Gagal menyimpan profil.' });
    } finally {
      setSaving(false);
    }
  };

  // Embed Renderer Helper
  const PortfolioImagePreview = ({ url, title }: { url: string; title: string }) => {
    const [hasError, setHasError] = useState(false);

    return (
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-60 flex items-center justify-center p-2">
        {hasError ? (
          <span className="text-xs text-slate-400 py-6">Gambar tidak dapat dimuat</span>
        ) : (
          <img 
            src={url} 
            alt={title} 
            className="w-full h-full max-h-56 object-contain rounded-lg" 
            onError={() => setHasError(true)}
          />
        )}
      </div>
    );
  };

  const renderEmbed = (item: PortfolioItem) => {
    if (item.type === 'youtube') {
      const videoId = parseYouTubeVideoId(item.url);

      return videoId ? (
        <div className="space-y-2">
          <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 bg-black shadow-xs">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              className="w-full h-full border-0"
              title={item.title || 'YouTube video player'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-[10px] text-slate-400 font-medium">YouTube Video</span>
            <button
              type="button"
              onClick={() => setCinemaVideo({ videoId, title: item.title || 'Showreel Alumni' })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-[#0284c7] border border-slate-200 hover:border-sky-200 text-[11px] font-semibold transition cursor-pointer"
            >
              <Maximize2 className="w-3 h-3 text-[#0284c7]" />
              <span>Preview Mode Bioskop</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-red-50 rounded-xl text-xs text-red-600 border border-red-100">
          Format URL YouTube tidak dikenali. Masukkan tautan video YouTube yang valid.
        </div>
      );
    }

    if (item.type === 'image') {
      return <PortfolioImagePreview url={item.url} title={item.title} />;
    }

    return (
      <a 
        href={item.url.startsWith('http') ? item.url : `https://${item.url}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center justify-between p-4 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-200 rounded-2xl transition group"
      >
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-slate-800 group-hover:text-[#0284c7] transition truncate block max-w-[200px]">
            {item.title}
          </span>
          <span className="text-[10px] text-slate-400 capitalize block">
            Platform: {item.type}
          </span>
        </div>
        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0284c7] transition shrink-0" />
      </a>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ProfileHeaderSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafcff] text-slate-900 flex flex-col justify-between font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* DEMO / PREVIEW BANNER JIKA DIAKSES TANPA LOGIN */}
        {isDemo && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-sky-500 to-[#0284c7] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md shadow-sky-500/10 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
              <div>
                <p className="text-xs font-bold leading-tight">Mode Pratinjau Dashboard Alumni (Preview Tanpa Login)</p>
                <p className="text-[11px] text-sky-100">
                  Anda sedang meninjau form profil, avatar uploader visual, showreel 2-kolom, dan pengaturan CV secara langsung.
                </p>
              </div>
            </div>
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-full bg-white text-[#0284c7] text-xs font-bold hover:bg-sky-50 transition shrink-0 text-center shadow-xs"
            >
              Masuk Akun Asli
            </Link>
          </div>
        )}

        {/* PROFILE HEADER CARD */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-400 to-[#0284c7] text-white flex items-center justify-center text-3xl font-bold shadow-xs overflow-hidden border-2 border-white shrink-0">
                <AlumniAvatar src={currentProfile?.fotoProfil} name={namaLengkap || currentProfile?.namaLengkap} />
              </div>

              <label 
                htmlFor="avatar-upload-input" 
                className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col items-center justify-center cursor-pointer text-white text-[10px] font-semibold gap-1"
                title="Ganti Foto Profil"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <>
                    <Camera className="w-5 h-5 text-white" />
                    <span>Ubah Foto</span>
                  </>
                )}
              </label>

              <input
                id="avatar-upload-input"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                disabled={uploadingAvatar}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                }}
              />
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                {namaLengkap || currentProfile?.namaLengkap}
              </h1>
              <p className="text-xs sm:text-sm text-[#0284c7] font-bold mt-1">
                {prodi} • Angkatan {angkatan || currentProfile?.angkatan}
              </p>
              {pekerjaanSaatIni && (
                <p className="text-xs text-slate-700 font-semibold mt-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#0284c7]" />
                  <span>{pekerjaanSaatIni}</span>
                </p>
              )}
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Nomor Alumni: {currentProfile?.nomorAlumni}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Link
              href={currentProfile?.uid ? `/profil/${currentProfile.uid}` : '/open-to-work'}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Lihat Profil Publik</span>
            </Link>

            <label className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 cursor-pointer text-xs font-bold select-none hover:bg-slate-100/70 transition">
              <input
                type="checkbox"
                checked={openToWork}
                onChange={(e) => setOpenToWork(e.target.checked)}
                className="w-4 h-4 text-[#0284c7] rounded bg-white border-slate-300 focus:ring-[#0284c7]"
              />
              <span className={openToWork ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                {openToWork ? '🟢 Status: Open to Work' : '⚪ Status: Tidak Mencari'}
              </span>
            </label>
          </div>
        </div>

        {/* FEEDBACK TOAST / ALERT */}
        {msg.text && (
          <div className={`mb-6 p-4 rounded-2xl text-xs flex items-center gap-2.5 border animate-fade-in ${
            msg.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {msg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{msg.text}</span>
          </div>
        )}

        {/* MAIN LAYOUT: SIDEBAR PINNED TO THE LEFT, SHOWREELS/PORTFOLIO TO THE RIGHT */}
        <div className="flex flex-col lg:flex-row items-start gap-8">
          
          {/* LEFT SIDEBAR: PINNED TO LEFT (320px fixed) */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            
            {/* CV UPLOAD & LINK */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0284c7]" />
                Resume &amp; CV Alumni
              </h3>

              {currentProfile?.cvFileUrl ? (
                <div className="p-3.5 bg-sky-50/80 border border-sky-100 rounded-2xl flex items-center justify-between text-xs">
                  <span className="text-slate-700 truncate max-w-[130px] font-bold">CV PDF Tersimpan</span>
                  <a 
                    href={currentProfile.cvFileUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[#0284c7] hover:underline flex items-center gap-1 font-bold"
                  >
                    Buka PDF <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">Unggah File PDF CV (Maks 5MB)</label>
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#0284c7] file:text-white hover:file:bg-[#0369a1] cursor-pointer"
                />
                {cvFile && (
                  <button
                    type="button"
                    onClick={handleUploadCV}
                    disabled={uploadingCV}
                    className="w-full py-2.5 mt-1 rounded-full bg-slate-900 hover:bg-slate-800 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    {uploadingCV ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Simpan ke Cloud Storage
                  </button>
                )}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-bold text-slate-700">Atau Tautan Google Drive / Cloud</label>
                <input
                  type="url"
                  value={cvExternalLink}
                  onChange={(e) => setCvExternalLink(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
                />
              </div>
            </div>

            {/* CONTACT & SOCIAL */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-3.5 text-xs shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                Kontak &amp; Tautan Profil
              </h3>
              
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Nomor WhatsApp / HP
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#0284c7]" />
                  LinkedIn / Portfolio URL
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT: BIO & SHOWREEL EMBEDS (SUSUN 2 2 / 2 COLUMNS) */}
          <div className="flex-1 w-full space-y-6">
            
            {/* PERSONAL DETAILS & BIO FORM */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Informasi Biodata &amp; Keahlian
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Program Studi</label>
                  <select
                    value={prodi}
                    onChange={(e) => setProdi(e.target.value as ProdiType)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#0284c7] focus:bg-white transition font-medium"
                  >
                    {PRODI_LIST.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tahun Angkatan</label>
                  <input
                    type="text"
                    value={angkatan}
                    onChange={(e) => setAngkatan(e.target.value)}
                    placeholder="2020"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#0284c7]" />
                  Sedang Bekerja di Mana / Posisi Pekerjaan Saat Ini
                </label>
                <input
                  type="text"
                  value={pekerjaanSaatIni}
                  onChange={(e) => setPekerjaanSaatIni(e.target.value)}
                  placeholder="e.g. 3D Animator di Infinite Studios, Broadcast Director di MNC Media, atau Freelance 3D Artist"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Info ini akan tampil di kartu profil Anda pada Beranda, Feed Komunitas, dan Katalog Talenta.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Bio &amp; Ringkasan Portofolio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Ceritakan keahlianmu, software yang dikuasai (Blender, Premiere, Unity, Maya), dan tipe proyek yang dicari..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition leading-relaxed"
                />

                {/* DETECTED SKILLS CHIPS PREVIEW */}
                <div className="mt-2.5 p-3 rounded-2xl bg-sky-50/50 border border-sky-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#0284c7]" />
                      Skill &amp; Software Otomatis Terdeteksi:
                    </span>
                    <span className="text-[10px] text-slate-400">Tampil di katalog Open to Work</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {extractSkills(bio, prodi).map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white border border-sky-200/80 text-[11px] font-semibold text-[#0284c7] shadow-2xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* PORTFOLIO ITEMS SECTION (SHOWREEL GALLERY 2 KOLOM) */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#0284c7]" />
                    Galeri Portofolio &amp; Showreel (Layout 2-Kolom)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Embed video YouTube, karya Behance, atau link portfolio tersusun responsif 2 kolom di desktop
                  </p>
                </div>
              </div>

              {/* INPUT FORM ADD ITEM */}
              <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Platform Karya</label>
                    <select
                      value={portType}
                      onChange={(e) => setPortType(e.target.value as 'youtube' | 'pinterest' | 'behance' | 'image' | 'link')}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#0284c7]"
                    >
                      <option value="youtube">YouTube (Showreel)</option>
                      <option value="behance">Behance (Project)</option>
                      <option value="pinterest">Pinterest (Board/Pin)</option>
                      <option value="image">Direct Image Link</option>
                      <option value="link">Website Eksternal</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Judul Karya / Showreel</label>
                    <input
                      type="text"
                      value={portTitle}
                      onChange={(e) => setPortTitle(e.target.value)}
                      placeholder="e.g. 3D Character Animation Reel 2026"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tautan / Kode Embed
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={portUrl}
                      onChange={(e) => setPortUrl(e.target.value)}
                      placeholder="Paste link YouTube (https://youtu.be/...), iframe embed, link Behance, atau Pinterest"
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7]"
                    />
                    <button
                      type="button"
                      onClick={handleAddPortfolio}
                      disabled={!portTitle.trim() || !portUrl.trim()}
                      className="px-5 py-2 rounded-full bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah
                    </button>
                  </div>
                </div>
              </div>

              {/* LIST OF PORTFOLIO: SUSUN 2 2 (2 COLUMNS) */}
              {portfolioList.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs space-y-1">
                  <p className="font-bold text-slate-600">Belum ada item portofolio yang ditambahkan.</p>
                  <p className="text-slate-400">Masukkan tautan video showreel YouTube atau link portofolio Anda di atas.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {portfolioList.map((item) => (
                    <div key={item.id} className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <span className="text-xs font-bold text-slate-900 truncate" title={item.title}>
                          {item.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePortfolio(item.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-white transition cursor-pointer"
                          title="Hapus Karya"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="w-full">
                        {renderEmbed(item)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AKTIVITAS & RIWAYAT POSTINGAN ALUMNI (LINKEDIN / FACEBOOK STYLE) */}
            <AlumniActivityHistory 
              authorName={namaLengkap || currentProfile?.namaLengkap}
              authorProdi={prodi || currentProfile?.prodi}
              authorAvatar={currentProfile?.fotoProfil}
              isOwner={true}
            />

            {/* SAVE BUTTON */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-sky-500 to-[#0284c7] hover:from-sky-600 hover:to-[#0369a1] text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-2 disabled:opacity-50 transition active:scale-[0.98] cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan Perubahan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Semua Perubahan Profil
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* CINEMA LIGHTBOX PREVIEW */}
        <CinemaLightbox
          isOpen={Boolean(cinemaVideo)}
          onClose={() => setCinemaVideo(null)}
          title={cinemaVideo?.title || 'Preview Showreel'}
          videoId={cinemaVideo?.videoId || ''}
        />
      </main>

      <Footer />
    </div>
  );
}
