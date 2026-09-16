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
  Loader2,
  Video
} from 'lucide-react';

import { fetchOpenToWorkRest } from '@/lib/firestoreRest';
import AlumniAvatar from '@/components/profile/AlumniAvatar';

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* HEADER SECTION */}
        <div className="mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Katalog Talenta Kreatif & Penyiaran
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Alumni MMTC <span className="text-emerald-600">Open to Work</span>
          </h1>
          <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
            Daftar alumni yang siap direkrut untuk proyek lepas (freelance), full-time studio, maupun kolaborasi kreatif. Tinjau showreel dan hubungi langsung.
          </p>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl mb-8 space-y-4 shadow-xs">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari talenta berdasarkan nama, nomor alumni, keahlian, atau prodi..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
              <button
                onClick={() => setSelectedProdi('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedProdi === 'ALL'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                Semua Jurusan
              </button>
              {PRODI_LIST.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProdi(p.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedProdi === p.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TALENT GRID */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <p className="text-sm">Memuat talenta alumni...</p>
          </div>
        ) : filteredAlumni.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl p-8 space-y-3">
            <User className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">Belum Ada Talenta di Kategori Ini</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Belum ada alumni yang memasang status Open to Work di program studi ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAlumni.map((alumni) => (
              <div 
                key={alumni.uid}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-6 flex flex-col justify-between transition hover:shadow-md group"
              >
                <div className="space-y-4">
                  {/* TOP: AVATAR & PRODI BADGE */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-[#0284c7] text-white flex items-center justify-center text-xl font-bold overflow-hidden shadow-xs border-2 border-white">
                        <AlumniAvatar src={alumni.fotoProfil} name={alumni.namaLengkap} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0284c7] transition">
                          {alumni.namaLengkap}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {alumni.prodi} • {alumni.angkatan}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold whitespace-nowrap">
                      Open to Work
                    </span>
                  </div>

                  {/* BIO */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {alumni.bio || 'Alumni belum menambahkan bio singkat.'}
                  </p>

                  {/* PORTFOLIO SNAPSHOT BADGES */}
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-medium">
                      <Video className="w-3.5 h-3.5 text-[#0284c7]" />
                      {alumni.portfolio?.length || 0} Karya Showreel
                    </span>
                    {(alumni.cvFileUrl || alumni.cvExternalLink) && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[#0284c7] font-medium">
                          <FileText className="w-3.5 h-3.5" />
                          CV Ready
                        </span>
                      </>
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
                    className="px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 hover:border-[#0284c7]/40 transition flex items-center gap-1.5"
                  >
                    Lihat Profil & Showreel
                    <ArrowRight className="w-3.5 h-3.5 text-[#0284c7]" />
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
