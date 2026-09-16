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
  Loader2, 
  Video
} from 'lucide-react';
import AlumniAvatar from '@/components/profile/AlumniAvatar';

export default function PublicProfilePage({ params }: { params: Promise<{ uid: string }> }) {
  const resolvedParams = use(params);
  const rawUid = resolvedParams.uid;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
        <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-black shadow-sm">
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
        className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition group"
      >
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-slate-800 group-hover:text-[#0284c7] transition truncate block max-w-[200px]">
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <Loader2 className="w-6 h-6 animate-spin text-[#0284c7]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Profil Alumni Tidak Ditemukan</h2>
            <p className="text-xs text-slate-500">
              Akun alumni yang kamu cari tidak terdaftar atau telah dinonaktifkan.
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 py-8">
        <div className="mb-6">
          <Link 
            href="/open-to-work" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0284c7] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Katalog Open to Work
          </Link>
        </div>

        {/* PROFILE HEADER CARD */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xs">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-500 to-[#0284c7] text-white flex items-center justify-center text-3xl font-bold shadow-sm overflow-hidden border-2 border-white shrink-0">
              <AlumniAvatar src={profile.fotoProfil} name={profile.namaLengkap} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{profile.namaLengkap}</h1>
              <p className="text-xs sm:text-sm text-[#0284c7] font-semibold mt-0.5">
                {profile.prodi} • Angkatan {profile.angkatan}
              </p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Nomor Alumni: {profile.nomorAlumni}
              </p>
            </div>
          </div>

          <div>
            {profile.openToWork ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Open to Work
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-semibold">
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
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-3.5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0284c7]" />
                Resume & Dokumen
              </h3>

              {profile.cvFileUrl ? (
                <a 
                  href={profile.cvFileUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full p-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-100 text-[#0284c7] text-xs font-semibold flex items-center justify-between transition"
                >
                  <span>Buka CV Resmi (PDF)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <p className="text-xs text-slate-400">Alumni belum mengunggah file CV PDF.</p>
              )}

              {profile.cvExternalLink && (
                <a 
                  href={profile.cvExternalLink.startsWith('http') ? profile.cvExternalLink : `https://${profile.cvExternalLink}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-between transition"
                >
                  <span>Link Portfolio / Drive</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </a>
              )}
            </div>

            {/* CONTACT */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-3.5 text-xs shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">Kontak Alumni</h3>
              
              <div className="flex items-center gap-2.5 text-slate-600">
                <Mail className="w-4 h-4 text-[#0284c7] shrink-0" />
                <a href={`mailto:${profile.email}`} className="hover:text-[#0284c7] hover:underline truncate">
                  {profile.email}
                </a>
              </div>

              {profile.phone && (
                <div className="flex items-center gap-2.5 text-slate-600">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <a 
                    href={formatWhatsAppUrl(profile.phone)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="hover:text-emerald-600 hover:underline"
                  >
                    WhatsApp: {profile.phone}
                  </a>
                </div>
              )}

              {profile.linkedinUrl && (
                <div className="flex items-center gap-2.5 text-slate-600">
                  <Globe className="w-4 h-4 text-[#0284c7] shrink-0" />
                  <a 
                    href={profile.linkedinUrl.startsWith('http') ? profile.linkedinUrl : `https://${profile.linkedinUrl}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="hover:text-[#0284c7] hover:underline truncate"
                  >
                    Profil LinkedIn / Web
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT CONTENT: BIO & SHOWREEL EMBEDS (SUSUN 2 2 / 2 COLUMNS) */}
          <div className="flex-1 w-full space-y-6">
            {profile.bio && (
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-2 shadow-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Tentang / Bio</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* SHOWREELS EMBED SECTION: SUSUN 2 2 (2 COLUMNS) */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3.5">
                <Video className="w-4 h-4 text-[#0284c7]" />
                <h3 className="text-sm font-bold text-slate-900">Galeri Showreel & Portofolio Karya</h3>
              </div>

              {profile.portfolio?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {profile.portfolio.map((item) => (
                    <div key={item.id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 shadow-xs">
                      <span className="text-xs font-bold text-slate-900 block truncate">{item.title}</span>
                      <div className="w-full">
                        {renderEmbed(item)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  Alumni belum menyematkan karya showreel.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
