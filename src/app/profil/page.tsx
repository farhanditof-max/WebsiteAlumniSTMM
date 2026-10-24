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
  Eye
} from 'lucide-react';
import AlumniAvatar from '@/components/profile/AlumniAvatar';
import { ProfileHeaderSkeleton } from '@/components/ui/Skeleton';

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms)
  );
  return Promise.race([promise, timeoutPromise]);
}

export default function ProfilPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();

  const [namaLengkap, setNamaLengkap] = useState(profile?.namaLengkap ?? '');
  const [prodi, setProdi] = useState<ProdiType>(profile?.prodi ?? 'Animasi');
  const [angkatan, setAngkatan] = useState(profile?.angkatan ?? '');
  const [openToWork, setOpenToWork] = useState(profile?.openToWork ?? true);
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedinUrl ?? '');
  const [cvExternalLink, setCvExternalLink] = useState(profile?.cvExternalLink ?? '');

  // Upload file state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // New Portfolio State
  const [portfolioList, setPortfolioList] = useState<PortfolioItem[]>(profile?.portfolio ?? []);
  const [portType, setPortType] = useState<'youtube' | 'pinterest' | 'behance' | 'image' | 'link'>('youtube');
  const [portTitle, setPortTitle] = useState('');
  const [portUrl, setPortUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Guard against overwriting local uncommitted form inputs when background profile refreshes for same user
  const initializedUidRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (profile && initializedUidRef.current !== profile.uid) {
      initializedUidRef.current = profile.uid;
      setNamaLengkap(profile.namaLengkap || '');
      setProdi(profile.prodi || 'Animasi');
      setAngkatan(profile.angkatan || '');
      setOpenToWork(profile.openToWork ?? true);
      setBio(profile.bio || '');
      setPhone(profile.phone || '');
      setLinkedinUrl(profile.linkedinUrl || '');
      setCvExternalLink(profile.cvExternalLink || '');
      setPortfolioList(profile.portfolio || []);
    }
  }, [profile]);

  const handleAddPortfolio = async () => {
    if (!portTitle.trim() || !portUrl.trim() || !user) return;
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

    // Auto-save langsung ke database Firestore dengan setDoc merge
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
    if (!user) return;
    const updatedList = portfolioList.filter(p => p.id !== id);
    setPortfolioList(updatedList);

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
    if (!cvFile || !user) return;

    if (cvFile.size > 5 * 1024 * 1024) {
      setMsg({ type: 'error', text: 'Ukuran file CV melebihi batas maksimal 5MB.' });
      return;
    }

    setUploadingCV(true);
    setMsg({ type: '', text: '' });

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
    if (!file || !user) return;

    if (file.size > 3 * 1024 * 1024) {
      setMsg({ type: 'error', text: 'Ukuran foto profil melebihi batas maksimal 3MB.' });
      return;
    }

    setUploadingAvatar(true);
    setMsg({ type: '', text: '' });

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
    if (!user) return;
    setSaving(true);
    setMsg({ type: '', text: '' });

    try {
      const updateData: Record<string, unknown> = {
        namaLengkap: namaLengkap.trim() || profile?.namaLengkap || user.displayName || user.email?.split('@')[0] || 'Alumni MMTC',
        nomorAlumni: profile?.nomorAlumni || '',
        prodi: prodi || profile?.prodi || 'Animasi',
        angkatan: angkatan.trim() || profile?.angkatan || '',
        email: profile?.email || user.email || '',
        openToWork: Boolean(openToWork),
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
        <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-black shadow-2xs">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="w-full h-full border-0"
            title={item.title || 'YouTube video player'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
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
        className="flex items-center justify-between p-3.5 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-200 rounded-xl transition group"
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

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold">Harap Masuk Terlebih Dahulu</h2>
            <p className="text-xs text-slate-500">Silakan login untuk mengelola portofolio &amp; CV alumni.</p>
            <Link href="/login" className="inline-block px-5 py-2.5 rounded-xl bg-[#0284c7] text-white text-xs font-semibold hover:bg-[#0369a1] transition shadow-xs">
              Masuk ke Akun
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* PROFILE HEADER CARD */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xs">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-[#0284c7] text-white flex items-center justify-center text-3xl font-bold shadow-2xs overflow-hidden border-2 border-white shrink-0">
                <AlumniAvatar src={profile?.fotoProfil} name={namaLengkap || profile?.namaLengkap} />
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
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {namaLengkap || profile?.namaLengkap}
              </h1>
              <p className="text-xs sm:text-sm text-[#0284c7] font-semibold mt-1">
                {prodi} • Angkatan {angkatan || profile?.angkatan}
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Nomor Alumni: {profile?.nomorAlumni}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {profile?.uid && (
              <Link
                href={`/profil/${profile.uid}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition shadow-2xs"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Lihat Profil Publik</span>
              </Link>
            )}

            <label className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer text-xs font-semibold select-none hover:bg-slate-100/70 transition">
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
          <div className={`mb-6 p-4 rounded-xl text-xs flex items-center gap-2.5 border animate-fade-in ${
            msg.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {msg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{msg.text}</span>
          </div>
        )}

        {/* MAIN LAYOUT: SIDEBAR PINNED TO THE LEFT, SHOWREELS/PORTFOLIO TO THE RIGHT */}
        <div className="flex flex-col lg:flex-row items-start gap-8">
          
          {/* LEFT SIDEBAR: PINNED TO LEFT (320px fixed) */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            
            {/* CV UPLOAD & LINK */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0284c7]" />
                Resume &amp; CV Alumni
              </h3>

              {profile?.cvFileUrl && (
                <div className="p-3.5 bg-sky-50/80 border border-sky-100 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-slate-700 truncate max-w-[130px] font-semibold">CV PDF Tersimpan</span>
                  <a 
                    href={profile.cvFileUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[#0284c7] hover:underline flex items-center gap-1 font-bold"
                  >
                    Buka PDF <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-slate-600">Unggah File PDF CV (Maks 5MB)</label>
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#0284c7] file:text-white hover:file:bg-[#0369a1] cursor-pointer"
                />
                {cvFile && (
                  <button
                    type="button"
                    onClick={handleUploadCV}
                    disabled={uploadingCV}
                    className="w-full py-2 mt-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition shadow-2xs"
                  >
                    {uploadingCV ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Simpan ke Cloud Storage
                  </button>
                )}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-semibold text-slate-600">Atau Tautan Google Drive / Cloud</label>
                <input
                  type="url"
                  value={cvExternalLink}
                  onChange={(e) => setCvExternalLink(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
                />
              </div>
            </div>

            {/* CONTACT & SOCIAL */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-3.5 text-xs shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                Kontak &amp; Tautan Profil
              </h3>
              
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  Nomor WhatsApp / HP
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#0284c7]" />
                  LinkedIn / Portfolio URL
                </label>
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT: BIO & SHOWREEL EMBEDS (SUSUN 2 2 / 2 COLUMNS) */}
          <div className="flex-1 w-full space-y-6">
            
            {/* PERSONAL DETAILS & BIO FORM */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 space-y-4 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Informasi Biodata &amp; Keahlian
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                    placeholder="Nama Lengkap"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Program Studi</label>
                  <select
                    value={prodi}
                    onChange={(e) => setProdi(e.target.value as ProdiType)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#0284c7] focus:bg-white transition font-medium"
                  >
                    {PRODI_LIST.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tahun Angkatan</label>
                  <input
                    type="text"
                    value={angkatan}
                    onChange={(e) => setAngkatan(e.target.value)}
                    placeholder="2020"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bio &amp; Ringkasan Portofolio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Ceritakan keahlianmu, software yang dikuasai (Blender, Premiere, Unity, Maya), dan tipe proyek yang dicari..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition leading-relaxed"
                />
              </div>
            </div>

            {/* PORTFOLIO ITEMS SECTION */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Video className="w-4 h-4 text-[#0284c7]" />
                    Galeri Portofolio &amp; Showreel
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Embed video YouTube, karya Behance, atau link portfolio (ditampilkan dalam susunan 2-kolom pada desktop)
                  </p>
                </div>
              </div>

              {/* INPUT FORM ADD ITEM */}
              <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Platform Karya</label>
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
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Judul Karya / Showreel</label>
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
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
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
                      className="px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah
                    </button>
                  </div>
                </div>
              </div>

              {/* LIST OF PORTFOLIO: SUSUN 2 2 (2 COLUMNS) */}
              {portfolioList.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs space-y-1">
                  <p className="font-semibold text-slate-600">Belum ada item portofolio yang ditambahkan.</p>
                  <p className="text-slate-400">Masukkan tautan video showreel YouTube atau link portofolio Anda di atas.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {portfolioList.map((item) => (
                    <div key={item.id} className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <span className="text-xs font-bold text-slate-900 truncate" title={item.title}>
                          {item.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePortfolio(item.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-white transition"
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

            {/* SAVE BUTTON */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-xs flex items-center gap-2 disabled:opacity-50 transition active:scale-[0.99]"
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
      </main>

      <Footer />
    </div>
  );
}
