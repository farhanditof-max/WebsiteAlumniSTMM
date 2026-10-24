'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { UserProfile, PortfolioItem } from '@/types';
import { parseYouTubeVideoId, formatWhatsAppUrl, safeHttpUrl } from '@/lib/media';
import { 
  FileText, 
  ExternalLink, 
  ArrowLeft, 
  Phone, 
  Globe, 
  Mail, 
  Loader2, 
  Video,
  Lock,
  ShieldCheck,
  Clock,
  Send,
  X,
  CheckCircle2
} from 'lucide-react';
import AlumniAvatar from '@/components/profile/AlumniAvatar';
import { useAuth } from '@/context/AuthContext';

export default function PublicProfilePage({ params }: { params: Promise<{ uid: string }> }) {
  const resolvedParams = use(params);
  const rawUid = resolvedParams.uid;
  const cleanUid = rawUid ? decodeURIComponent(rawUid).trim() : '';
  const { user, profile: authProfile } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Status Permintaan Kontak WhatsApp (Proteksi PII sesama Alumni)
  const [contactRequestStatus, setContactRequestStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactPurpose, setContactPurpose] = useState('Peluang Kerja / Proyek');
  const [contactMessage, setContactMessage] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactSuccessMsg, setContactSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!cleanUid) return;
      setLoading(true);

      try {
        // F-21 & F-25: Hanya lookup langsung berdasarkan Document ID (UID) terverifikasi
        // Menutup kebocoran profil & CV alumni non-openToWork via URL parameter tebakan nomorAlumni/email
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
          setProfile({ ...snap.data(), uid: snap.id } as UserProfile);
          return;
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
  }, [cleanUid]);

  // Cek apakah user saat ini sudah pernah meminta kontak target
  useEffect(() => {
    let isMounted = true;
    async function checkContactRequest() {
      if (!user || !profile || user.uid === profile.uid) return;
      try {
        const qReq = query(
          collection(db, 'contact_requests'),
          where('requesterUid', '==', user.uid),
          where('targetUid', '==', profile.uid)
        );
        const snap = await getDocs(qReq);
        if (isMounted) {
          if (!snap.empty) {
            const reqData = snap.docs[0].data();
            setContactRequestStatus(reqData.status as 'pending' | 'approved' | 'rejected');
          } else {
            setContactRequestStatus('none');
          }
        }
      } catch (err) {
        console.warn('Failed to check contact request status:', err);
      }
    }
    checkContactRequest();
    return () => {
      isMounted = false;
    };
  }, [user, profile]);

  const handleSendContactRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (!contactMessage.trim()) {
      setContactError('Mohon isi pesan pengantar keperluan Anda.');
      return;
    }
    setSubmittingContact(true);
    setContactError(null);
    try {
      await addDoc(collection(db, 'contact_requests'), {
        requesterUid: user.uid,
        requesterName: authProfile?.namaLengkap || user.displayName || user.email?.split('@')[0] || 'Alumni STMM',
        requesterEmail: user.email || '',
        requesterProdi: authProfile?.prodi || '',
        targetUid: profile.uid,
        targetName: profile.namaLengkap,
        purpose: contactPurpose,
        message: contactMessage.trim(),
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setContactRequestStatus('pending');
      setShowContactModal(false);
      setContactSuccessMsg('Permintaan akses kontak berhasil diajukan kepada pemilik akun.');
      setTimeout(() => setContactSuccessMsg(null), 5000);
    } catch (err: unknown) {
      const e = err as Error;
      setContactError(e.message || 'Gagal mengirim permintaan kontak.');
    } finally {
      setSubmittingContact(false);
    }
  };

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

  const isOwner = !!user && !!profile && user.uid === profile.uid;

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
              <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                <span>Nomor Alumni:</span>
                {user ? (
                  <span className="text-slate-600 font-semibold">{profile.nomorAlumni}</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <span>••••••••••</span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-sans font-medium">
                      <Lock className="w-2.5 h-2.5" /> Terkunci
                    </span>
                  </span>
                )}
              </div>
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
            {!user ? (
              /* KARTU TERKUNCI (UNTUK PENGUNJUNG PUBLIK BELUM LOGIN) */
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 text-center space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 text-[#0284c7] flex items-center justify-center mx-auto shadow-2xs">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-slate-900">Kontak & CV Terproteksi</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Untuk melindungi privasi alumni STMM MMTC, nomor WhatsApp, email, dan file CV resmi hanya dapat diakses oleh alumni atau perekrut yang sudah masuk.
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/login?redirect=/profil/${encodeURIComponent(cleanUid || rawUid)}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 shadow-xs transition"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Masuk untuk Melihat Kontak
                  </Link>
                </div>

                <p className="text-[11px] text-slate-400 pt-1">
                  Belum punya akun?{' '}
                  <Link href="/register" className="text-[#0284c7] font-semibold hover:underline">
                    Daftar Akun Alumni
                  </Link>
                </p>
              </div>
            ) : (
              /* TAMPILAN RESUME & KONTAK LENGKAP (UNTUK USER TERAUTENTIKASI) */
              <>
                {/* CV BOX */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#0284c7]" />
                      Resume & Dokumen
                    </h3>
                    {profile.openToWork ? (
                      <span className="px-2 py-0.5 rounded-full bg-sky-50 text-[#0284c7] text-[10px] font-semibold border border-sky-100 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Terbuka
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold border border-slate-200">
                        Privat
                      </span>
                    )}
                  </div>

                  {!isOwner && !profile.openToWork ? (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] leading-relaxed">
                      Alumni ini sedang tidak aktif mencari pekerjaan (<em>Not Looking</em>). Dokumen resume dan CV disimpan secara privat oleh pemilik akun.
                    </div>
                  ) : (
                    <>
                      {profile.cvFileUrl && safeHttpUrl(profile.cvFileUrl) ? (
                        <a 
                          href={safeHttpUrl(profile.cvFileUrl)!} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full p-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-100 text-[#0284c7] text-xs font-semibold flex items-center justify-between transition"
                        >
                          <span>Buka CV Resmi (PDF)</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <p className="text-xs text-slate-400">Alumni belum mengunggah file CV PDF.</p>
                      )}

                      {profile.cvExternalLink && safeHttpUrl(profile.cvExternalLink) && (
                        <a 
                          href={safeHttpUrl(profile.cvExternalLink)!} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-between transition"
                        >
                          <span>Link Portfolio / Drive</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        </a>
                      )}
                    </>
                  )}
                </div>

                {/* CONTACT */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-3.5 text-xs shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Kontak Alumni</h3>
                    {isOwner ? (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-slate-500" /> Profil Anda
                      </span>
                    ) : contactRequestStatus === 'approved' ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Akses WA Disetujui
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> WA Terproteksi
                      </span>
                    )}
                  </div>

                  {contactSuccessMsg && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{contactSuccessMsg}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2.5 text-slate-600">
                    <Mail className="w-4 h-4 text-[#0284c7] shrink-0" />
                    <a href={`mailto:${profile.email}`} className="hover:text-[#0284c7] hover:underline truncate">
                      {profile.email}
                    </a>
                  </div>

                  {profile.phone && (
                    <>
                      {isOwner || contactRequestStatus === 'approved' ? (
                        <div className="flex items-center justify-between gap-2.5 text-slate-600">
                          <div className="flex items-center gap-2.5">
                            <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                            <a 
                              href={formatWhatsAppUrl(profile.phone)} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="hover:text-emerald-600 hover:underline font-mono font-medium"
                            >
                              WhatsApp: {profile.phone}
                            </a>
                          </div>
                          {isOwner && (
                            <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-sans font-medium">
                              Kontak Anda
                            </span>
                          )}
                        </div>
                      ) : contactRequestStatus === 'pending' ? (
                        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-amber-900 flex items-center gap-1.5 text-xs">
                              <Clock className="w-3.5 h-3.5 text-amber-600" /> Permintaan Terkirim
                            </span>
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">Menunggu Respon</span>
                          </div>
                          <p className="text-[11px] text-amber-800/90 leading-relaxed">
                            Permintaan akses kontak Anda sedang menunggu konfirmasi dari {profile.namaLengkap}. Nomor WhatsApp akan terbuka otomatis saat disetujui.
                          </p>
                        </div>
                      ) : contactRequestStatus === 'rejected' ? (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-700 text-xs">Akses WhatsApp Belum Diberikan</span>
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">Ditolak</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Alumni saat ini belum bersedia membagikan nomor WhatsApp pribadi. Anda tetap dapat menghubungi via email resmi di atas.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowContactModal(true)}
                            className="mt-1 text-[11px] font-semibold text-[#0284c7] hover:underline cursor-pointer"
                          >
                            Ajukan Permintaan Ulang
                          </button>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-700 font-medium">
                              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>WhatsApp:</span>
                              <span className="font-mono text-slate-400">••••••••••••</span>
                            </div>
                            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 border border-amber-200/60 px-1.5 py-0.5 rounded font-medium">
                              <Lock className="w-2.5 h-2.5" /> Terproteksi
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            Nomor WhatsApp dilindungi privasi agar tidak disalahgunakan. Ajukan permintaan akses kontak agar {profile.namaLengkap} dapat memverifikasi identitas Anda.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowContactModal(true)}
                            className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Minta Akses Kontak WhatsApp
                          </button>
                        </div>
                      )}
                    </>
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

                {/* SHORTCUT KELOLA JIKA MILIK SENDIRI */}
                {user.uid === profile.uid && (
                  <Link
                    href="/profil"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center justify-center gap-2 transition"
                  >
                    Edit Profil Saya
                  </Link>
                )}
              </>
            )}
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

      {/* MODAL MINTA AKSES KONTAK WHATSAPP */}
      {showContactModal && profile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Minta Akses Kontak Alumni</h3>
                  <p className="text-[11px] text-slate-400">Kepada: {profile.namaLengkap}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowContactModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3 text-xs text-sky-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5 text-sky-950">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0284c7]" />
                Verifikasi Identitas Sesama Alumni
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Permintaan ini akan mencantumkan identitas Anda ({authProfile?.namaLengkap || user?.email}) agar pemilik profil tahu siapa yang menghubungi sebelum membagikan nomor WhatsApp.
              </p>
            </div>

            <form onSubmit={handleSendContactRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Keperluan Menghubungi <span className="text-red-500">*</span>
                </label>
                <select
                  value={contactPurpose}
                  onChange={(e) => setContactPurpose(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7]"
                >
                  <option value="Peluang Kerja / Proyek">Peluang Kerja / Proyek Freelance</option>
                  <option value="Kolaborasi Kreatif">Kolaborasi Kreatif / Produksi</option>
                  <option value="Pertanyaan Karir & Networking">Pertanyaan Karir / Networking Alumni</option>
                  <option value="Lainnya">Keperluan Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pesan Pengantar <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Jelaskan secara singkat tujuan Anda meminta nomor WhatsApp..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0284c7] focus:ring-1 focus:ring-[#0284c7] resize-none"
                />
              </div>

              {contactError && (
                <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                  {contactError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingContact || !contactMessage.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {submittingContact ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Kirim Permintaan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
