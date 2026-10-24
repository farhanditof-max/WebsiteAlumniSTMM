'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { UserProfile, PRODI_LIST } from '@/types';
import { 
  Search, 
  Filter, 
  User, 
  ArrowRight, 
  FileText, 
  Video,
  X,
  Briefcase
} from 'lucide-react';
import { fetchOpenToWorkRest } from '@/lib/firestoreRest';
import AlumniAvatar from '@/components/profile/AlumniAvatar';
import { TalentCardSkeleton } from '@/components/ui/Skeleton';
import { OpenToWorkBadge } from '@/components/ui/Badge';
import { extractSkills } from '@/components/profile/skills';

interface ExtendedUserProfile extends UserProfile {
  pekerjaanSaatIni?: string;
  pekerjaan?: string;
}

export default function OpenToWorkPage() {
  const [alumniList, setAlumniList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProdi, setSelectedProdi] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function fetchOpenToWorkAlumni() {
      setLoading(true);

      // 1. Coba REST API terarah terlebih dahulu (~100ms & efisien tanpa full collection dump)
      try {
        const otUsers = await fetchOpenToWorkRest();
        if (isMounted && otUsers.length > 0) {
          setAlumniList(otUsers);
          setLoading(false);
          return;
        }
      } catch (restErr) {
        console.warn('REST fetch failed in open-to-work, trying SDK:', restErr);
      }

      // 2. Fallback ke Firestore SDK dengan timeout ketat
      try {
        const q = query(collection(db, 'users'), where('openToWork', '==', true));
        const fetchPromise = getDocs(q);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('OpenToWork fetch timeout')), 3000)
        );
        const snap = await Promise.race([fetchPromise, timeoutPromise]);
        if (isMounted) {
          const list = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
          setAlumniList(list);
        }
      } catch (err) {
        console.error('Error fetching open to work alumni:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchOpenToWorkAlumni();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredAlumni = alumniList.filter((a) => {
    const matchesProdi = selectedProdi === 'ALL' || a.prodi === selectedProdi;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q ||
      a.namaLengkap?.toLowerCase().includes(q) ||
      a.bio?.toLowerCase().includes(q) ||
      a.prodi?.toLowerCase().includes(q) ||
      a.nomorAlumni?.toLowerCase().includes(q) ||
      a.angkatan?.toLowerCase().includes(q);
    return matchesProdi && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* HEADER SECTION */}
        <div className="mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Katalog Talenta Kreatif &amp; Penyiaran
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Alumni MMTC <span className="text-emerald-600">Open to Work</span>
          </h1>
          <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
            Daftar talenta alumni yang siap direkrut untuk proyek lepas (freelance), full-time studio, maupun kolaborasi kreatif. Tinjau karya showreel 2-kolom dan hubungi langsung via WhatsApp atau Email.
          </p>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-2xl mb-8 space-y-4 shadow-2xs">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari talenta berdasarkan nama, keahlian, nomor alumni, atau prodi..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  aria-label="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
              <button
                onClick={() => setSelectedProdi('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedProdi === 'ALL'
                    ? 'bg-[#0284c7] text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                Semua Jurusan ({alumniList.length})
              </button>
              {PRODI_LIST.map((p) => {
                const count = alumniList.filter(a => a.prodi === p.id).length;
                const isSelected = selectedProdi === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProdi(p.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#0284c7] text-white shadow-2xs'
                        : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    {p.label} {count > 0 ? `(${count})` : ''}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* TALENT GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TalentCardSkeleton />
            <TalentCardSkeleton />
            <TalentCardSkeleton />
            <TalentCardSkeleton />
            <TalentCardSkeleton />
            <TalentCardSkeleton />
          </div>
        ) : filteredAlumni.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl p-8 space-y-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <User className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Belum Ada Talenta di Kategori Ini</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery 
                  ? `Tidak ditemukan talenta alumni yang cocok dengan kata kunci "${searchQuery}".` 
                  : 'Belum ada alumni yang memasang status Open to Work di program studi ini.'}
              </p>
            </div>
            {(searchQuery || selectedProdi !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedProdi('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Reset Filter Pencarian
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAlumni.map((alumni) => (
              <div 
                key={alumni.uid}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-6 flex flex-col justify-between transition hover:shadow-md group shadow-2xs"
              >
                <div className="space-y-4">
                  {/* TOP: AVATAR & PRODI BADGE */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-[#0284c7] text-white flex items-center justify-center text-xl font-bold overflow-hidden shadow-2xs border-2 border-white shrink-0">
                        <AlumniAvatar src={alumni.fotoProfil} name={alumni.namaLengkap} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0284c7] transition leading-snug">
                          {alumni.namaLengkap}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {alumni.prodi} • Angkatan {alumni.angkatan}
                        </p>
                        {((alumni as ExtendedUserProfile).pekerjaanSaatIni || (alumni as ExtendedUserProfile).pekerjaan) && (
                          <p className="text-[11px] text-[#0284c7] font-semibold mt-0.5 flex items-center gap-1 truncate max-w-[200px]">
                            <Briefcase className="w-3 h-3 shrink-0" />
                            <span className="truncate">{(alumni as ExtendedUserProfile).pekerjaanSaatIni || (alumni as ExtendedUserProfile).pekerjaan}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <OpenToWorkBadge pulse={false} />
                  </div>

                  {/* BIO */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {alumni.bio || 'Alumni aktif Sekolah Tinggi Multi Media Yogyakarta.'}
                  </p>

                  {/* SOFTWARE & SKILL CHIPS */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {extractSkills(alumni.bio, alumni.prodi).map((skill) => (
                      <span 
                        key={skill} 
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* PORTFOLIO SNAPSHOT BADGES */}
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-medium bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                      <Video className="w-3.5 h-3.5 text-[#0284c7]" />
                      {alumni.portfolio?.length || 0} Karya Showreel
                    </span>
                    {(alumni.cvFileUrl || alumni.cvExternalLink) && (
                      <span className="flex items-center gap-1 text-[#0284c7] font-semibold bg-sky-50 px-2 py-1 rounded-md border border-sky-100">
                        <FileText className="w-3.5 h-3.5" />
                        CV Ready
                      </span>
                    )}
                  </div>
                </div>

                {/* BOTTOM: VIEW PROFILE BUTTON */}
                <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {alumni.nomorAlumni}
                  </span>

                  <Link
                    href={`/profil/${alumni.uid}`}
                    className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-[#0284c7] hover:text-white text-slate-800 text-xs font-semibold border border-slate-200/80 transition-all flex items-center gap-1.5 group-hover:border-[#0284c7]"
                  >
                    Lihat Profil &amp; Showreel
                    <ArrowRight className="w-3.5 h-3.5 text-[#0284c7] group-hover:text-white transition" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
