'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { PRODI_LIST } from '@/types';
import { 
  ArrowRight, 
  Search, 
  Building2, 
  Video, 
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
  Play,
  CheckCircle2,
  Award
} from 'lucide-react';

export default function HomePage() {
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
            
            {/* LEFT CONTENT: Heading, Copy, Pill Buttons, Social Proof with ScrollReveal */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <ScrollReveal direction="up" delayMs={60} durationMs={700}>
                {/* Top Tag Pill */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100/80 border border-sky-200 text-xs font-bold text-[#0284c7]">
                  <Sparkles className="w-3.5 h-3.5 text-[#0284c7]" />
                  <span>Portal Karir &amp; Portofolio Resmi MMTC</span>
                </div>

                {/* Big Bold Headline */}
                <h1 className="text-4xl sm:text-6xl lg:text-[60px] font-bold text-slate-900 leading-[1.12] mt-4">
                  Portal Karir &amp; <br />
                  Karya Alumni <span className="inline-flex items-center gap-2 text-[#0284c7]">
                    MMTC
                    <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-amber-400 inline-block shadow-sm" />
                  </span>
                </h1>

                {/* Copywriting */}
                <p className="text-base sm:text-lg text-slate-600 max-w-xl font-normal leading-relaxed mt-4">
                  Wadah terpadu menghubungkan alumni Sekolah Tinggi Multi Media Yogyakarta dengan industri penyiaran, animasi, game studio, dan teknologi kreatif nasional.
                </p>

                {/* Action Buttons (Pill Shapes) */}
                <div className="pt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
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
                <div className="pt-6 flex flex-col sm:flex-row sm:items-center gap-3.5">
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
              </ScrollReveal>
            </div>

            {/* RIGHT CONTENT: Foto Gedung Kampus STMM MMTC dengan ScrollReveal */}
            <div className="lg:col-span-6 relative flex items-center justify-center w-full">
              <ScrollReveal direction="left" delayMs={140} durationMs={800} className="w-full max-w-xl">
                <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl shadow-sky-900/10 border-2 border-white/90 group">
                  <img 
                    src="/kampus_stmm.jpg" 
                    alt="Gedung Transformasi Digital STMM MMTC Yogyakarta" 
                    className="w-full h-auto object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
              </ScrollReveal>
            </div>

          </div>
        </div>
      </section>

      {/* TRUSTED BY / PARTNER LOGO STRIP (CLEAN MONOCHROME) WITH SCROLLREVEAL */}
      <section className="py-10 bg-white border-b border-slate-100 overflow-hidden">
        <ScrollReveal direction="up" delayMs={60} durationMs={700}>
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
        </ScrollReveal>
      </section>

      {/* KLASIFIKASI BIDANG KEAHLIAN / PRODI — STAGGERED SCROLL REVEAL */}
      <section className="py-16 sm:py-20 bg-slate-50/70 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <ScrollReveal direction="up" delayMs={60} durationMs={650}>
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0284c7] bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                Program Studi Unggulan
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-slate-900">
                Klasifikasi Keahlian Khusus MMTC
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Filter lowongan dan temukan talenta alumni berdasarkan spesialisasi bidang studi
              </p>
            </div>
          </ScrollReveal>

          {/* 6 Prodi Cards with Staggered Wave Delays */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {PRODI_LIST.map((prodi, idx) => (
              <ScrollReveal 
                key={prodi.id} 
                direction="up" 
                delayMs={idx * 80} 
                durationMs={600}
                className="h-full"
              >
                <Link
                  href={`/lowongan?prodi=${encodeURIComponent(prodi.id)}`}
                  className="bg-white border border-slate-200/80 rounded-3xl p-5 hover:border-sky-300 hover:shadow-lg hover:shadow-sky-100 hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center group h-full"
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
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* SPOTLIGHT BANNER: WITH SCROLLREVEAL */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" delayMs={80} durationMs={750}>
            <div className="bg-gradient-to-r from-sky-400 via-[#0284c7] to-[#0369a1] rounded-[36px] p-8 sm:p-12 text-white shadow-xl shadow-sky-500/15 relative overflow-hidden">
              
              {/* Background glowing rings */}
              <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                
                {/* Left Column: Avatar & Headline */}
                <div className="lg:col-span-8 space-y-4">
                  <span className="text-xs font-bold text-sky-100 uppercase tracking-wider block">
                    Ikatan Alumni STMM MMTC Yogyakarta
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-bold leading-snug">
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
          </ScrollReveal>
        </div>
      </section>

      {/* BOTTOM CTA: WITH SCROLLREVEAL */}
      <section className="py-16 bg-[#f4f9fd] border-t border-sky-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" delayMs={80} durationMs={750}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              
              {/* Left Card: Value Proposition */}
              <div className="md:col-span-7 space-y-4">
                <span className="text-xs font-bold text-[#0284c7] uppercase tracking-wider block">
                  Bergabung Sekarang
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
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
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
