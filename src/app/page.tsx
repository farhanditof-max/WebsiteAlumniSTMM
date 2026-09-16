'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { PRODI_LIST, JobPosting, UserProfile } from '@/types';
import { getJobs } from '@/lib/jobs';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { 
  ArrowRight, 
  Search, 
  Building2, 
  MapPin, 
  Video, 
  ChevronRight,
  Tv, 
  Gamepad2, 
  Film, 
  Radio, 
  Terminal,
  PlaySquare
} from 'lucide-react';
import AlumniAvatar from '@/components/profile/AlumniAvatar';
import { fetchOpenToWorkRest } from '@/lib/firestoreRest';

export default function HomePage() {
  const [recentJobs, setRecentJobs] = useState<JobPosting[]>([]);
  const [openTalents, setOpenTalents] = useState<UserProfile[]>([]);

  useEffect(() => {
    async function loadLiveContent() {
      try {
        const jobs = await getJobs();
        setRecentJobs(jobs.slice(0, 4));

        try {
          const restTalents = await fetchOpenToWorkRest();
          if (restTalents && restTalents.length > 0) {
            setOpenTalents(restTalents.slice(0, 4));
          } else {
            const qTalent = query(collection(db, 'users'), where('openToWork', '==', true), limit(4));
            const timeoutPromise = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Home talents timeout')), 4000)
            );
            const snap = await Promise.race([getDocs(qTalent), timeoutPromise]).catch(() => null);
            if (snap && !snap.empty) {
              const talents = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
              setOpenTalents(talents);
            }
          }
        } catch (talentErr) {
          console.warn('Talents fetch error:', talentErr);
        }
      } catch (err) {
        console.warn('loadLiveContent error:', err);
      }
    }
    loadLiveContent();
  }, []);

  const getProdiIcon = (id: string) => {
    switch (id) {
      case 'Animasi': return <Film className="w-5 h-5 text-slate-700" />;
      case 'Game Design': return <Gamepad2 className="w-5 h-5 text-slate-700" />;
      case 'MIK': return <Terminal className="w-5 h-5 text-slate-700" />;
      case 'Matekstosi': return <Tv className="w-5 h-5 text-slate-700" />;
      case 'Manarita': return <Radio className="w-5 h-5 text-slate-700" />;
      case 'Manaprodsi': return <PlaySquare className="w-5 h-5 text-slate-700" />;
      default: return <Building2 className="w-5 h-5 text-slate-700" />;
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-[#0284c7] selection:text-white font-sans">
      <Navbar />

      {/* HERO SECTION — FULL WIDTH DENGAN WARNA BIRU KHAS STMM MMTC */}
      <section className="w-full bg-[#0240d6] text-white py-16 sm:py-20 lg:py-24 border-b border-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl space-y-6">
            
            {/* Minimal Subhead Tag */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs text-white">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="font-semibold text-white">Kementerian Komunikasi dan Digital RI</span>
              <span className="text-blue-200">/</span>
              <span className="text-blue-100">STMM MMTC Yogyakarta</span>
            </div>

            {/* Headline Bersih & Tegas */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08]">
              Portal Karir & Jejaring <br />
              Alumni STMM MMTC
            </h1>

            {/* Direct & Functional Copywriting */}
            <p className="text-base sm:text-lg text-blue-100 max-w-2xl font-normal leading-relaxed">
              Infrastruktur terpusat untuk penelusuran karir penyiaran, animasi, game, dan teknologi informasi. Dirancang khusus bagi alumni Sekolah Tinggi Multi Media Yogyakarta.
            </p>

            {/* Clean Functional Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link 
                href="/lowongan" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-[#0240d6] font-bold text-sm hover:bg-blue-50 transition active:scale-[0.99] shadow-md"
              >
                <Search className="w-4 h-4 text-[#0284c7]" />
                Cari Lowongan Kerja
              </Link>
              <Link 
                href="/open-to-work" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-sm font-semibold transition active:scale-[0.99]"
              >
                Katalog Open to Work
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-blue-100 hover:text-white text-sm transition font-medium"
              >
                Registrasi Akun Baru →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HIGHLIGHT: JURUSAN & FILTER LANGSUNG (CLEAN WHITE) */}
      <section className="py-16 border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0240d6]">Program Studi</p>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Klasifikasi Bidang Keahlian</h2>
            </div>
            <p className="text-xs text-slate-500">Filter lowongan instan berdasarkan jurusan</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {PRODI_LIST.map((prodi) => (
              <Link
                key={prodi.id}
                href={`/lowongan?prodi=${encodeURIComponent(prodi.id)}`}
                className="p-4 rounded-xl bg-white border border-slate-200/90 hover:border-[#0240d6]/60 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center mb-3 group-hover:bg-blue-50 group-hover:border-blue-200 transition">
                  {getProdiIcon(prodi.id)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-[#0240d6] transition">{prodi.label}</h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{prodi.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* REAL CONTENT SECTION: LIVE LOWONGAN TERBARU (CLEAN WHITE) */}
      <section className="py-16 border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0240d6]">Bursa Karir</p>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Lowongan Kerja Terkini</h2>
            </div>
            <Link 
              href="/lowongan" 
              className="text-xs font-semibold text-[#0240d6] hover:underline flex items-center gap-1"
            >
              Lihat Semua Loker <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
              Belum ada lowongan kerja aktif. Silakan pasang lowongan pertama Anda.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="p-5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {job.tipeKerja}
                      </span>
                      {job.gajiRange && (
                        <span className="text-xs font-semibold text-[#0240d6]">
                          {job.gajiRange}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">{job.judul}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {job.perusahaan} • <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.lokasi}
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {job.deskripsi}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {job.prodiTarget?.slice(0, 2).map((p) => (
                        <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {p}
                        </span>
                      ))}
                    </div>
                    <Link
                      href="/lowongan"
                      className="text-xs font-semibold text-slate-900 hover:text-[#0240d6] transition flex items-center gap-1"
                    >
                      Lamar Sekarang <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* REAL CONTENT SECTION: TALENTA OPEN TO WORK (CLEAN WHITE) */}
      <section className="py-16 border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Talenta Siap Kerja</p>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">Alumni Open to Work</h2>
            </div>
            <Link 
              href="/open-to-work" 
              className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
            >
              Lihat Semua Alumni <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {openTalents.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
              Belum ada alumni yang memasang status Open to Work.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {openTalents.map((alumni) => (
                <Link
                  key={alumni.uid}
                  href={`/profil/${alumni.uid}`}
                  className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-11 h-11 rounded-xl bg-[#0240d6] text-white flex items-center justify-center font-bold text-sm overflow-hidden shadow-xs">
                        <AlumniAvatar src={alumni.fotoProfil} name={alumni.namaLengkap} />
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Siap Kerja
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0240d6] transition truncate">
                        {alumni.namaLengkap}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {alumni.prodi} • {alumni.angkatan}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
                        {alumni.bio || 'Alumni aktif Sekolah Tinggi Multi Media Yogyakarta.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Video className="w-3.5 h-3.5 text-[#0240d6]" />
                      {alumni.portfolio?.length || 0} Karya
                    </span>
                    <span className="text-[#0240d6] font-semibold text-xs flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                      Profil <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* BOTTOM TRUST / BANNER SECTION (FULL WIDTH FLAT MMTC BLUE MENTOK KANAN KIRI) */}
      <section className="w-full bg-[#0240d6] text-white py-14 sm:py-16 border-t border-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Punya Lowongan Proyek atau Posisi Full-Time?
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              Pasang lowongan gratis khusus untuk talenta penyiaran, animator, technical artist, dan software engineer lulusan MMTC.
            </p>
          </div>
          <Link
            href="/post-lowongan"
            className="px-7 py-3.5 rounded-xl bg-white text-[#0240d6] hover:bg-blue-50 font-bold text-sm transition shrink-0 shadow-md active:scale-[0.99]"
          >
            Pasang Lowongan Sekarang
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
