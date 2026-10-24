'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { UserProfile, PortfolioItem } from '@/types';
import { parseYouTubeVideoId, formatWhatsAppUrl } from '@/lib/media';
import { 
  FileText, 
  ExternalLink, 
  ArrowLeft, 
  Phone, 
  Globe, 
  Mail, 
  Video,
  User,
  Share2,
  Maximize2,
  Sparkles,
  Briefcase
} from 'lucide-react';
import AlumniAvatar from '@/components/profile/AlumniAvatar';
import { ProfileHeaderSkeleton } from '@/components/ui/Skeleton';
import { OpenToWorkBadge } from '@/components/ui/Badge';
import { CinemaLightbox } from '@/components/ui/Modal';
import { ShareModal } from '@/components/ui/ShareModal';
import { extractSkills } from '@/components/profile/skills';
import AlumniActivityHistory from '@/components/profile/AlumniActivityHistory';

interface ExtendedUserProfile extends UserProfile {
  pekerjaanSaatIni?: string;
  pekerjaan?: string;
}

export default function PublicProfilePage({ params }: { params: Promise<{ uid: string }> }) {
  const resolvedParams = use(params);
  const rawUid = resolvedParams.uid;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [cinemaVideo, setCinemaVideo] = useState<{ videoId: string; title: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!rawUid) return;
      const cleanUid = decodeURIComponent(rawUid).trim();
      setLoading(true);

      try {
        // 1. Coba lookup langsung berdasarkan Document ID (UID Firebase Auth)
        const docRef = doc(db, 'users', cleanUid);
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Profile fetch timeout')), 4000)
        );
        let snap;
        try {
          snap = await Promise.race([getDoc(docRef), timeout]);
        } catch {
          snap = null;
        }

        if (snap && snap.exists()) {
          setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
          return;
        }

        // 2. Coba lookup berdasarkan nomorAlumni
        const normalizedNomor = cleanUid.replace(/\s+/g, '').replace(/[/._]/g, '-').toUpperCase();
        const qNomor = query(collection(db, 'users'), where('nomorAlumni', '==', normalizedNomor));
        const timeoutQ = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), 3500)
        );
        const snapNomor = await Promise.race([getDocs(qNomor), timeoutQ]).catch(() => null);

        if (snapNomor && !snapNomor.empty) {
          const docItem = snapNomor.docs[0];
          setProfile({ uid: docItem.id, ...docItem.data() } as UserProfile);
          return;
        }

        // 3. Coba lookup berdasarkan email jika parameter adalah email
        if (cleanUid.includes('@')) {
          const qEmail = query(collection(db, 'users'), where('email', '==', cleanUid.toLowerCase()));
          const snapEmail = await Promise.race([getDocs(qEmail), timeoutQ]).catch(() => null);
          if (snapEmail && !snapEmail.empty) {
            const docItem = snapEmail.docs[0];
            setProfile({ uid: docItem.id, ...docItem.data() } as UserProfile);
            return;
          }
        }

        setProfile(null);
      } catch (err) {
        console.error('Error loadProfile:', err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [rawUid]);

  const PortfolioImagePreview = ({ url, title }: { url: string; title: string }) => {
    const [hasError, setHasError] = useState(false);

    return (
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-64 flex items-center justify-center p-2">
        {hasError ? (
          <span className="text-xs text-slate-400 py-6">Gambar tidak dapat dimuat</span>
        ) : (
          <img 
            src={url} 
            alt={title} 
            className="w-full h-full max-h-60 object-contain rounded-lg" 
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
          <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-black shadow-xs">
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
              <span>Mode Bioskop</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-red-50 rounded-xl text-xs text-red-600 border border-red-100">
          Format URL atau tag Embed YouTube tidak dikenali.
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
        className="flex items-center justify-between p-4 bg-slate-50 hover:bg-sky-50/60 border border-slate-200 hover:border-sky-200 rounded-xl transition group"
      >
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-slate-800 group-hover:text-[#0284c7] transition truncate block max-w-[240px]">
            {item.title}
          </span>
          <span className="text-[10px] text-slate-400 capitalize block">
            Platform: {item.type}
          </span>
        </div>
        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#0284c7] transition shrink-0" />
      </a>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ProfileHeaderSkeleton />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="h-64 bg-white rounded-2xl animate-pulse border border-slate-200" />
            <div className="lg:col-span-2 h-96 bg-white rounded-2xl animate-pulse border border-slate-200" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Profil Alumni Tidak Ditemukan</h2>
            <p className="text-xs text-slate-500">
              Akun alumni yang kamu cari tidak terdaftar atau telah dinonaktifkan dari sistem.
            </p>
            <Link 
              href="/open-to-work" 
              className="inline-block px-5 py-2.5 rounded-xl bg-[#0284c7] text-white text-xs font-semibold hover:bg-[#0369a1] transition shadow-xs"
            >
              Kembali ke Katalog Open to Work
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
        {/* TOP NAVIGATION / BREADCRUMB */}
        <div className="mb-6 flex items-center justify-between">
          <Link 
            href="/open-to-work" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0284c7] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Katalog Open to Work
          </Link>

          <button
            onClick={() => setIsShareOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-2xs cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#0284c7]" />
            <span>Bagikan Profil</span>
          </button>
        </div>

        {/* PROFILE HEADER CARD */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xs">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-[#0284c7] text-white flex items-center justify-center text-3xl font-bold shadow-2xs overflow-hidden border-2 border-white shrink-0">
              <AlumniAvatar src={profile.fotoProfil} name={profile.namaLengkap} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {profile.namaLengkap}
              </h1>
              <p className="text-xs sm:text-sm text-[#0284c7] font-semibold mt-1">
                {profile.prodi} • Angkatan {profile.angkatan}
              </p>
              {((profile as ExtendedUserProfile).pekerjaanSaatIni || (profile as ExtendedUserProfile).pekerjaan) && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-800 mt-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#0284c7]" />
                  <span>Bekerja di: {(profile as ExtendedUserProfile).pekerjaanSaatIni || (profile as ExtendedUserProfile).pekerjaan}</span>
                </div>
              )}
              <p className="text-[11px] text-slate-400 font-mono mt-1">
                Nomor Alumni: {profile.nomorAlumni}
              </p>

              {/* TECHNICAL SKILL BADGES */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {extractSkills(profile.bio || '', profile.prodi || '').map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-sky-50 border border-sky-100 text-[11px] font-medium text-[#0284c7]"
                  >
                    <Sparkles className="w-2.5 h-2.5 opacity-70" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            {profile.openToWork ? (
              <OpenToWorkBadge />
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-semibold">
                Sedang Tidak Mencari Proyek
              </span>
            )}
          </div>
        </div>

        {/* MAIN TWO-COLUMN LAYOUT: SIDEBAR PINNED TO THE LEFT, EMBEDS EXPANDED TO THE RIGHT */}
        <div className="flex flex-col lg:flex-row items-start gap-8">
          
          {/* LEFT SIDEBAR: PINNED TO LEFT (Width fixed: 320px) */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            
            {/* CV BOX */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-3.5 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0284c7]" />
                Resume &amp; Dokumen
              </h3>

              {profile.cvFileUrl ? (
                <a 
                  href={profile.cvFileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full p-3.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-100 text-[#0284c7] text-xs font-bold flex items-center justify-between transition group"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0284c7]" />
                    Buka CV Resmi (PDF)
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                </a>
              ) : (
                <p className="text-xs text-slate-400">Alumni belum mengunggah file CV PDF.</p>
              )}

              {profile.cvExternalLink && (
                <a 
                  href={profile.cvExternalLink.startsWith('http') ? profile.cvExternalLink : `https://${profile.cvExternalLink}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-between transition group"
                >
                  <span>Link Portfolio / Google Drive</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition" />
                </a>
              )}
            </div>

            {/* CONTACT CARD */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 text-xs shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Kontak Alumni
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-600 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <Mail className="w-4 h-4 text-[#0284c7] shrink-0" />
                  <a href={`mailto:${profile.email}`} className="hover:text-[#0284c7] hover:underline truncate font-medium">
                    {profile.email}
                  </a>
                </div>

                {profile.phone && (
                  <div className="flex items-center gap-3 text-slate-600 p-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <a 
                      href={formatWhatsAppUrl(profile.phone)} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="hover:text-emerald-700 hover:underline font-semibold text-emerald-800 truncate"
                    >
                      WhatsApp: {profile.phone}
                    </a>
                  </div>
                )}

                {profile.linkedinUrl && (
                  <div className="flex items-center gap-3 text-slate-600 p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <Globe className="w-4 h-4 text-[#0284c7] shrink-0" />
                    <a 
                      href={profile.linkedinUrl.startsWith('http') ? profile.linkedinUrl : `https://${profile.linkedinUrl}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="hover:text-[#0284c7] hover:underline truncate font-medium"
                    >
                      Tautan LinkedIn / Web
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT CONTENT: BIO & SHOWREEL EMBEDS (SUSUN 2 KOLOM DI DESKTOP) */}
          <div className="flex-1 w-full space-y-6">
            {profile.bio && (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 space-y-2.5 shadow-2xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Tentang Alumni / Bio Singkat
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* SHOWREELS EMBED SECTION: SUSUN 2 KOLOM DESKTOP */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 space-y-6 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-[#0284c7]" />
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Galeri Showreel &amp; Portofolio Karya
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">
                  {profile.portfolio?.length || 0} Karya Tersemat
                </span>
              </div>

              {profile.portfolio?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {profile.portfolio.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200 hover:border-slate-300 transition space-y-3 shadow-2xs flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <span className="text-xs font-bold text-slate-900 block truncate" title={item.title}>
                          {item.title}
                        </span>
                        <div className="w-full">
                          {renderEmbed(item)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <Video className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-600">Alumni belum menyematkan karya showreel.</p>
                  <p className="text-slate-400">Portofolio video YouTube, Pinterest, atau Behance akan tampil di sini.</p>
                </div>
              )}
            </div>

            {/* AKTIVITAS & RIWAYAT POSTINGAN ALUMNI (LINKEDIN / FACEBOOK STYLE) */}
            <AlumniActivityHistory 
              authorName={profile.namaLengkap}
              authorProdi={profile.prodi}
              authorAvatar={profile.fotoProfil}
              isOwner={false}
            />
          </div>
        </div>

        {/* CINEMA LIGHTBOX MODAL */}
        <CinemaLightbox
          isOpen={Boolean(cinemaVideo)}
          onClose={() => setCinemaVideo(null)}
          title={cinemaVideo?.title || 'Showreel Alumni STMM MMTC'}
          videoId={cinemaVideo?.videoId || ''}
        />

        {/* SHARE MODAL */}
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          title={profile.namaLengkap}
          subtitle={`${profile.prodi} • Angkatan ${profile.angkatan}`}
          shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
        />
      </main>

      <Footer />
    </div>
  );
}
