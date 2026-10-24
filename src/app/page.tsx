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
  Briefcase,
  Star,
  TrendingUp,
  Heart,
  Play,
  CheckCircle2,
  Award
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
      case 'MIK': return <Terminal className="w-5 h-5 text-sky-600" />;
      case 'Matekstosi': return <Tv className="w-5 h-5 text-blue-600" />;
      case 'Manarita': return <Radio className="w-5 h-5 text-amber-600" />;
      case 'Manaprodsi': return <PlaySquare className="w-5 h-5 text-emerald-600" />;
      default: return <Building2 className="w-5 h-5 text-slate-700" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafcff] text-slate-900 flex flex-col selection:bg-[#0284c7] selection:text-white font-sans overflow-x-hidden">
      <Navbar />

      {/* HERO SECTION — AIRY, SKY-BLUE LIGHT AESTHETIC PERSIS REFERENSI */}
      <section className="relative w-full pt-12 pb-20 sm:pt-16 sm:pb-28 overflow-hidden bg-gradient-to-b from-[#eef8ff] via-[#f7fbff] to-white border-b border-sky-100/60">
        
        {/* Soft Organic Floating Pastel Accents */}
        <div className="absolute top-12 left-1/3 w-3 h-3 rounded-full bg-amber-300 opacity-80" />
        <div className="absolute top-28 left-1/4 w-2 h-2 rounded-full bg-sky-400 opacity-60" />
        <div className="absolute top-20 right-1/4 w-3.5 h-3.5 rounded-full bg-amber-400 opacity-70" />
        <div className="absolute top-44 right-1/3 w-2.5 h-2.5 rounded-full bg-sky-300 opacity-50" />
        <div className="absolute -top-32 right-0 w-[550px] h-[550px] bg-sky-200/35 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-32 w-[450px] h-[450px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* LEFT CONTENT: Heading, Copy, Pill Buttons, Social Proof */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              {/* Top Tag Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100/80 border border-sky-200 text-xs font-bold text-[#0284c7]">
                <Sparkles className="w-3.5 h-3.5 text-[#0284c7]" />
                <span>Portal Karir &amp; Portofolio Resmi MMTC</span>
              </div>

              {/* Big Bold Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-[64px] font-black tracking-tight text-slate-900 leading-[1.08]">
                Portal Karir &amp; <br />
                Karya Alumni <span className="inline-flex items-center gap-2 text-[#0284c7]">
                  MMTC
                  <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-400 inline-block shadow-sm" />
                </span>
              </h1>

              {/* Copywriting */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl font-normal leading-relaxed">
                Wadah terpadu menghubungkan alumni Sekolah Tinggi Multi Media Yogyakarta dengan industri penyiaran, animasi, game studio, dan teknologi kreatif nasional.
              </p>

              {/* Action Buttons (Pill Shapes) */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <Link 
                  href="/lowongan" 
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm sm:text-base shadow-lg shadow-sky-500/25 transition-all duration-200 active:scale-[0.98]"
                >
                  <Search className="w-4 h-4 text-white" />
                  Jelajahi Lowongan
                </Link>
                <Link 
                  href="/open-to-work" 
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm sm:text-base border border-slate-200/90 shadow-xs transition-all active:scale-[0.98]"
                >
                  <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center text-[#0284c7]">
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </div>
                  Katalog Open to Work
                </Link>
              </div>

              {/* Social Proof Strip with Avatars & Stars */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center gap-3.5">
                <div className="flex -space-x-2.5 overflow-hidden">
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-tr from-sky-400 to-[#0284c7] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    FA
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-tr from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    RD
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-tr from-indigo-400 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    AN
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-tr from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    ST
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    +2k
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">
                    Bergabung dengan <strong className="text-slate-900 font-bold">2.500+ alumni MMTC</strong> di industri kreatif
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT CONTENT: Hero Showcase with Campus Photo & Floating Glass Cards */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              
              {/* Center Portrait / Campus Photo Container */}
              <div className="relative w-full max-w-[380px] sm:max-w-[420px] aspect-[4/5] rounded-[40px] border-4 border-white shadow-2xl shadow-sky-500/15 overflow-hidden group">
                
                {/* Real Campus Image */}
                <img 
                  src="/kampus_stmm.jpg" 
                  alt="Gedung Kampus STMM MMTC Yogyakarta" 
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />

                {/* Soft Gradient Overlay for depth & typography readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-sky-900/20 pointer-events-none" />

                {/* Top Institution Badge on Photo */}
                <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-white/40 shadow-xs">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <img src="/logo_stmm.png" alt="Logo STMM" className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800">Kampus STMM MMTC</span>
                </div>

                {/* Bottom Caption Overlay */}
                <div className="absolute bottom-5 left-5 right-5 text-left text-white z-10 space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-sky-500/80 text-[10px] font-bold tracking-wide uppercase">
                    Yogyakarta
                  </span>
                  <h3 className="font-extrabold text-lg sm:text-xl text-white leading-tight">
                    Kampus STMM &ldquo;MMTC&rdquo;
                  </h3>
                  <p className="text-[11px] text-slate-200 leading-snug">
                    Jl. Magelang Km. 6, Sleman • Kementerian Komunikasi dan Digital RI
                  </p>
                </div>
              </div>

              {/* Floating Card 1: Top Right */}
              <div className="absolute -top-4 -right-2 sm:right-0 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3 sm:p-3.5 shadow-lg shadow-slate-200/50 flex items-center gap-2.5 animate-bounce [animation-duration:6s] z-20">
                <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-[#0284c7]">
                  <Heart className="w-4 h-4 fill-[#0284c7]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-900">Karir Kreatif Impian</p>
                  <p className="text-[10px] text-slate-500">Koneksi langsung ke studio</p>
                </div>
              </div>

              {/* Floating Card 2: Left Mid */}
              <div className="absolute top-1/3 -left-4 sm:-left-6 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3.5 shadow-lg shadow-slate-200/50 space-y-1 z-20">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lulusan Terserap</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-slate-900">94.8%</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> +18%
                  </span>
                </div>
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                  <div className="w-4/5 h-full bg-gradient-to-r from-sky-400 to-[#0284c7] rounded-full" />
                </div>
              </div>

              {/* Floating Card 3: Bottom Right */}
              <div className="absolute -bottom-4 right-2 sm:right-4 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-3.5 shadow-lg shadow-slate-200/50 max-w-[210px] space-y-1.5 z-20">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-400 to-[#0284c7] text-white flex items-center justify-center font-bold text-[10px]">
                    DN
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-900 leading-tight">Dito N.</p>
                    <p className="text-[9px] text-[#0284c7] font-semibold">Alumni Animasi &apos;20</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed italic">
                  &ldquo;Dapat job studio dan portofolio showreel di-review langsung lewat portal ini!&rdquo;
                </p>
                <div className="flex text-amber-400 text-[10px]">
                  ★★★★★
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* TRUSTED BY / PARTNER LOGO STRIP (CLEAN MONOCHROME) */}
      <section className="py-10 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Alumni MMTC Berkarir di Berbagai Stasiun TV, Studio Animasi &amp; Industri Kreatif
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-slate-400 font-extrabold text-sm sm:text-base tracking-tight opacity-75">
            <span className="hover:text-slate-700 transition">TVRI NASIONAL</span>
            <span className="hover:text-slate-700 transition">TRANS MEDIA</span>
            <span className="hover:text-slate-700 transition">NET TV</span>
            <span className="hover:text-slate-700 transition">MD ANIMATION</span>
            <span className="hover:text-slate-700 transition">MNC GROUP</span>
            <span className="hover:text-slate-700 transition">GAMELOFT</span>
            <span className="hover:text-slate-700 transition">KOMPAS TV</span>
          </div>
        </div>
      </section>

      {/* KLASIFIKASI BIDANG KEAHLIAN / PRODI — 6 CLEAN ROUNDED VERTICAL CARDS */}
      <section className="py-16 sm:py-20 bg-slate-50/70 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0284c7] bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
              Program Studi Unggulan
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Klasifikasi Keahlian Khusus MMTC
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Filter lowongan dan temukan talenta alumni berdasarkan spesialisasi bidang studi
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {PRODI_LIST.map((prodi) => (
              <Link
                key={prodi.id}
                href={`/lowongan?prodi=${encodeURIComponent(prodi.id)}`}
                className="bg-white border border-slate-200/80 rounded-3xl p-5 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-100 hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center group"
              >
                {/* Circular Pastel Icon Container */}
                <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-sky-100/80 transition-all">
                  {getProdiIcon(prodi.id)}
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#0284c7] transition mb-1">
                  {prodi.label}
                </h3>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {prodi.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SPOTLIGHT BANNER: PERSIS ROUNDED SKY BLUE CARD DI REFERENSI */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-sky-400 via-[#0284c7] to-[#0369a1] rounded-[36px] p-8 sm:p-12 text-white shadow-xl shadow-sky-500/15 relative overflow-hidden">
            
            {/* Background glowing rings */}
            <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Avatar & Headline */}
              <div className="lg:col-span-8 space-y-4">
                <span className="text-xs font-bold text-sky-100 uppercase tracking-wider block">
                  Ikatan Alumni STMM MMTC Yogyakarta
                </span>
                <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-snug">
                  Wadah Kolaborasi Industri Penyiaran &amp; Digital 😊
                </h3>
                <p className="text-xs sm:text-sm text-sky-100 max-w-xl leading-relaxed">
                  Dari tugas studio kampus hingga menjadi technical director, 3D artist, animator studio, and broadcast engineer. Hubungkan portofolio showreel-mu dan dapatkan peluang kerja terbaik.
                </p>
                <div className="pt-2">
                  <Link
                    href="/open-to-work"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#0284c7] font-bold text-xs sm:text-sm hover:bg-sky-50 transition shadow-sm"
                  >
                    Jelajahi Portofolio Alumni
                    <ArrowRight className="w-4 h-4 text-[#0284c7]" />
                  </Link>
                </div>
              </div>

              {/* Right Column: 4 Stat Bullets */}
              <div className="lg:col-span-4 space-y-3.5 bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
                <div className="flex items-center gap-3 text-xs">
                  <Award className="w-5 h-5 text-sky-200 shrink-0" />
                  <span>6 Program Studi Spesialisasi Multimedia</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Video className="w-5 h-5 text-sky-200 shrink-0" />
                  <span>Galeri Showreel 2-Kolom Terverifikasi</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Briefcase className="w-5 h-5 text-sky-200 shrink-0" />
                  <span>Koneksi Langsung ke Pembuka Loker</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Users className="w-5 h-5 text-sky-200 shrink-0" />
                  <span>Jejaring Kolaboratif Lulusan Nasional</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* REAL CONTENT: LIVE LOWONGAN TERBARU */}
      <section className="py-16 bg-[#fafcff] border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0284c7]">Bursa Karir</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                Lowongan Kerja Terkini
              </h2>
            </div>
            <Link 
              href="/lowongan" 
              className="text-xs font-bold text-[#0284c7] hover:underline flex items-center gap-1"
            >
              Lihat Semua Loker <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingJobs ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <JobCardSkeleton />
              <JobCardSkeleton />
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="p-10 rounded-3xl border border-dashed border-slate-200 bg-white text-center text-slate-500 text-xs space-y-2">
              <Briefcase className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold text-slate-700">Belum ada lowongan kerja aktif saat ini.</p>
              <p className="text-slate-400">Jadilah alumni pertama yang mempublikasikan lowongan.</p>
              <Link href="/post-lowongan" className="inline-block mt-2 text-xs font-bold text-[#0284c7] hover:underline">
                + Pasang Lowongan Baru
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {recentJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="p-6 rounded-3xl bg-white border border-slate-200/80 hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-sky-50 border border-sky-100 text-[#0284c7]">
                        {job.tipeKerja}
                      </span>
                      {job.gajiRange && (
                        <span className="text-xs font-extrabold text-emerald-600">
                          {job.gajiRange}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0284c7] transition leading-snug">
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

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {job.prodiTarget?.slice(0, 2).map((p) => (
                        <ProdiBadge key={p} prodi={p} />
                      ))}
                    </div>
                    <Link
                      href="/lowongan"
                      className="px-4 py-2 rounded-full bg-slate-50 hover:bg-[#0284c7] hover:text-white text-slate-800 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200/80"
                    >
                      Lamar Sekarang <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* REAL CONTENT: TALENTA OPEN TO WORK */}
      <section className="py-16 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Talenta Siap Kerja</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                Alumni Open to Work
              </h2>
            </div>
            <Link 
              href="/open-to-work" 
              className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
            >
              Lihat Semua Talenta <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingTalents ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <TalentCardSkeleton />
              <TalentCardSkeleton />
              <TalentCardSkeleton />
              <TalentCardSkeleton />
            </div>
          ) : openTalents.length === 0 ? (
            <div className="p-10 rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center text-slate-500 text-xs space-y-2">
              <p className="font-bold text-slate-700">Belum ada alumni yang memasang status Open to Work.</p>
              <p className="text-slate-400">Aktifkan toggle status Open to Work di menu profil Anda untuk tampil di sini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {openTalents.map((alumni) => (
                <Link
                  key={alumni.uid}
                  href={`/profil/${alumni.uid}`}
                  className="p-5 rounded-3xl bg-white border border-slate-200/80 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-100 hover:-translate-y-1 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between">
                      <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-sky-400 to-[#0284c7] text-white flex items-center justify-center font-bold text-sm overflow-hidden shadow-xs border-2 border-white">
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

      {/* BOTTOM CTA: PERSIS DUAL-CARD DI GAMBAR REFERENSI */}
      <section className="py-16 bg-[#f4f9fd] border-t border-sky-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Left Card: Value Proposition */}
            <div className="md:col-span-7 space-y-4">
              <span className="text-xs font-bold text-[#0284c7] uppercase tracking-wider block">
                Bergabung Sekarang
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Kembangkan Karir &amp; Portofoliomu
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
                Akses terpusat ke jejaring alumni multimedia terbesar di Indonesia. Pasang lowongan untuk studio Anda atau temukan rekan proyek kreatif berikutnya.
              </p>
              <div className="space-y-2 pt-2 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Akses gratis seumur hidup khusus seluruh alumni resmi STMM MMTC</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Showreel galeri YouTube 2-kolom terintegrasi</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Pasang lowongan gratis untuk studio &amp; rumah produksi</span>
                </div>
              </div>
            </div>

            {/* Right Card: Action Box */}
            <div className="md:col-span-5 bg-white border border-sky-200/80 rounded-3xl p-8 text-center space-y-5 shadow-lg shadow-sky-500/5">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registrasi Akun</span>
                <p className="text-3xl font-black text-[#0284c7]">100% Gratis</p>
                <p className="text-xs text-slate-500">Khusus alumni &amp; lulusan STMM MMTC Yogyakarta</p>
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <Link
                  href="/register"
                  className="w-full py-3.5 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm shadow-md shadow-sky-500/25 transition active:scale-[0.98]"
                >
                  Daftar Akun Alumni Baru
                </Link>
                <Link
                  href="/post-lowongan"
                  className="w-full py-3 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition"
                >
                  Pasang Lowongan Studio / Proyek
                </Link>
              </div>

              <p className="text-[11px] text-slate-400">
                ✓ Verifikasi instan menggunakan Nomor Alumni terdaftar
              </p>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
