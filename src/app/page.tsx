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
  PlaySquare,
  Sparkles,
  Users,
  Briefcase
} from 'lucide-react';
import AlumniAvatar from '@/components/profile/AlumniAvatar';
import { fetchOpenToWorkRest } from '@/lib/firestoreRest';
import { JobCardSkeleton, TalentCardSkeleton } from '@/components/ui/Skeleton';
import { OpenToWorkBadge, ProdiBadge } from '@/components/ui/Badge';

export default function HomePage() {
  const [recentJobs, setRecentJobs] = useState<JobPosting[]>([]);
  const [openTalents, setOpenTalents] = useState<UserProfile[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingTalents, setLoadingTalents] = useState(true);

  useEffect(() => {
    async function loadLiveContent() {
      // 1. Load Recent Jobs
      try {
        const jobs = await getJobs();
        setRecentJobs(jobs.slice(0, 4));
      } catch (err) {
        console.warn('loadLiveContent jobs error:', err);
      } finally {
        setLoadingJobs(false);
      }

      // 2. Load Open to Work Talents
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
      } finally {
        setLoadingTalents(false);
      }
    }
    loadLiveContent();
  }, []);

  const getProdiIcon = (id: string) => {
    switch (id) {
      case 'Animasi': return <Film className="w-5 h-5 text-indigo-600" />;
      case 'Game Design': return <Gamepad2 className="w-5 h-5 text-purple-600" />;
      case 'MIK': return <Terminal className="w-5 h-5 text-blue-600" />;
      case 'Matekstosi': return <Tv className="w-5 h-5 text-sky-600" />;
      case 'Manarita': return <Radio className="w-5 h-5 text-amber-600" />;
      case 'Manaprodsi': return <PlaySquare className="w-5 h-5 text-emerald-600" />;
      default: return <Building2 className="w-5 h-5 text-slate-700" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-[#0284c7] selection:text-white font-sans">
      <Navbar />

      {/* HERO SECTION — FULL WIDTH MMTC BLUE IDENTITY */}
      <section className="relative w-full bg-gradient-to-br from-[#0232a8] via-[#0240d6] to-[#0284c7] text-white py-16 sm:py-24 border-b border-blue-700 overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs text-white shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">Kementerian Komunikasi dan Digital RI</span>
              <span className="text-blue-200">/</span>
              <span className="text-blue-100">STMM MMTC Yogyakarta</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              Portal Karir, Portofolio &amp; Jejaring Alumni MMTC
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base lg:text-lg text-blue-100 font-normal leading-relaxed">
              Jembatan profesional resmi alumni Sekolah Tinggi Multi Media Yogyakarta. Temukan talenta kreatif penyiaran, animator, game developer, hingga peluang karir di industri multimedia nasional.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link 
                href="/lowongan" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#0240d6] font-bold text-sm hover:bg-blue-50 transition active:scale-[0.98] shadow-md"
              >
                <Search className="w-4 h-4 text-[#0284c7]" />
                Jelajahi Lowongan Kerja
              </Link>
              <Link 
                href="/open-to-work" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/25 text-sm font-semibold transition active:scale-[0.98] backdrop-blur-xs"
              >
                Katalog Open to Work
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center px-4 py-3 rounded-xl text-blue-100 hover:text-white text-xs sm:text-sm transition font-medium"
              >
                Daftar Akun Alumni →
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Highlights / Stats Strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-white/15">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <Users className="w-5 h-5 text-sky-300 shrink-0" />
              <div>
                <p className="text-xs text-blue-200">Jejaring Alumni</p>
                <p className="text-sm font-bold">Lulusan Siap Kerja</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <Briefcase className="w-5 h-5 text-emerald-300 shrink-0" />
              <div>
                <p className="text-xs text-blue-200">Bursa Karir</p>
                <p className="text-sm font-bold">Loker Terverifikasi</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <Video className="w-5 h-5 text-amber-300 shrink-0" />
              <div>
                <p className="text-xs text-blue-200">Showreel Media</p>
                <p className="text-sm font-bold">Embed Portfolio 2-Kolom</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
              <Sparkles className="w-5 h-5 text-pink-300 shrink-0" />
              <div>
                <p className="text-xs text-blue-200">Program Studi</p>
                <p className="text-sm font-bold">6 Jurusan Spesialis</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KLASIFIKASI BIDANG KEAHLIAN / PRODI */}
      <section className="py-14 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0284c7]">Program Studi</p>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Klasifikasi Bidang Keahlian MMTC</h2>
            </div>
            <p className="text-xs text-slate-500">Filter lowongan instan berdasarkan peminatan jurusan</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {PRODI_LIST.map((prodi) => (
              <Link
                key={prodi.id}
                href={`/lowongan?prodi=${encodeURIComponent(prodi.id)}`}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#0284c7]/60 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group shadow-2xs"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mb-3 group-hover:bg-sky-50 group-hover:border-sky-200 transition">
                  {getProdiIcon(prodi.id)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0284c7] transition">{prodi.label}</h3>
                  <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 leading-snug">{prodi.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE LOWONGAN TERBARU */}
      <section className="py-14 bg-slate-50/60 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0284c7]">Bursa Karir</p>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Lowongan Kerja Terkini</h2>
            </div>
            <Link 
              href="/lowongan" 
              className="text-xs font-semibold text-[#0284c7] hover:text-[#0369a1] hover:underline flex items-center gap-1"
            >
              Lihat Semua Loker <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingJobs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <JobCardSkeleton />
              <JobCardSkeleton />
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-slate-300 bg-white text-center text-slate-500 text-xs space-y-2">
              <Briefcase className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-semibold text-slate-700">Belum ada lowongan kerja aktif saat ini.</p>
              <p className="text-slate-400">Jadilah yang pertama mempublikasikan lowongan untuk alumni MMTC.</p>
              <Link href="/post-lowongan" className="inline-block mt-2 text-xs font-bold text-[#0284c7] hover:underline">
                + Pasang Lowongan Baru
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 shadow-2xs group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                        {job.tipeKerja}
                      </span>
                      {job.gajiRange && (
                        <span className="text-xs font-bold text-[#0284c7]">
                          {job.gajiRange}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0284c7] transition leading-snug">
                      {job.judul}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {job.perusahaan} • <MapPin className="w-3.5 h-3.5 text-slate-400" /> {job.lokasi}
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {job.deskripsi}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {job.prodiTarget?.slice(0, 2).map((p) => (
                        <ProdiBadge key={p} prodi={p} />
                      ))}
                    </div>
                    <Link
                      href="/lowongan"
                      className="text-xs font-bold text-[#0284c7] hover:text-[#0369a1] transition flex items-center gap-1 group-hover:translate-x-0.5"
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

      {/* TALENTA OPEN TO WORK */}
      <section className="py-14 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Talenta Siap Kerja</p>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Alumni Open to Work</h2>
            </div>
            <Link 
              href="/open-to-work" 
              className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
            >
              Lihat Semua Talenta <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingTalents ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <TalentCardSkeleton />
              <TalentCardSkeleton />
              <TalentCardSkeleton />
              <TalentCardSkeleton />
            </div>
          ) : openTalents.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-slate-500 text-xs space-y-2">
              <p className="font-semibold text-slate-700">Belum ada alumni yang memasang status Open to Work.</p>
              <p className="text-slate-400">Aktifkan toggle status Open to Work di menu profil Anda untuk tampil di sini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {openTalents.map((alumni) => (
                <Link
                  key={alumni.uid}
                  href={`/profil/${alumni.uid}`}
                  className="p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between group shadow-2xs"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-[#0284c7] text-white flex items-center justify-center font-bold text-sm overflow-hidden shadow-2xs border-2 border-white">
                        <AlumniAvatar src={alumni.fotoProfil} name={alumni.namaLengkap} />
                      </div>
                      <OpenToWorkBadge pulse={false} />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0284c7] transition truncate">
                        {alumni.namaLengkap}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {alumni.prodi} • Angkatan {alumni.angkatan}
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                        {alumni.bio || 'Alumni aktif Sekolah Tinggi Multi Media MMTC Yogyakarta.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3.5 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 text-[11px] font-medium">
                      <Video className="w-3.5 h-3.5 text-[#0284c7]" />
                      {alumni.portfolio?.length || 0} Karya Showreel
                    </span>
                    <span className="text-[#0284c7] font-bold text-xs flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                      Profil <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* BOTTOM BANNER SECTION */}
      <section className="w-full bg-[#0240d6] text-white py-14 sm:py-16 border-t border-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Punya Lowongan Proyek atau Posisi Full-Time?
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              Pasang lowongan gratis khusus untuk talenta penyiaran, animator, technical artist, dan software engineer lulusan STMM MMTC Yogyakarta.
            </p>
          </div>
          <Link
            href="/post-lowongan"
            className="px-7 py-3.5 rounded-xl bg-white text-[#0240d6] hover:bg-blue-50 font-bold text-sm transition shrink-0 shadow-md active:scale-[0.98]"
          >
            Pasang Lowongan Sekarang
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
