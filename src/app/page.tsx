'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { PRODI_LIST } from '@/types';
import { 
  ArrowRight, 
  ArrowUpRight,
  Video, 
  Users, 
  Briefcase,
  CheckCircle2,
  Award,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Play,
  Calendar,
  Handshake,
  BookOpen
} from 'lucide-react';

export default function HomePage() {
  const getProdiCardImage = (id: string) => {
    switch (id) {
      case 'Animasi':
        return '/card_prodi/animasi.svg';
      case 'Matekstosi':
        return '/card_prodi/matekstosi.svg';
      case 'Manarita':
        return '/card_prodi/manarita.svg';
      case 'Manaprodsi':
        return '/card_prodi/manaprodsi.svg';
      case 'MIK':
        return '/card_prodi/mik.svg';
      case 'Game Design':
        return '/card_prodi/game-design.svg';
      default:
        return '/card_prodi/animasi.svg';
    }
  };

  const LOOP_PRODI_LIST = React.useMemo(() => [
    ...PRODI_LIST.map((p) => ({ ...p, loopKey: `set-0-${p.id}` })),
    ...PRODI_LIST.map((p) => ({ ...p, loopKey: `set-1-${p.id}` })),
    ...PRODI_LIST.map((p) => ({ ...p, loopKey: `set-2-${p.id}` })),
    ...PRODI_LIST.map((p) => ({ ...p, loopKey: `set-3-${p.id}` })),
  ], []);

  const sliderRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isRolling, setIsRolling] = React.useState(false);
  const isDraggingRef = React.useRef(false);
  const dragDistanceRef = React.useRef(0);
  const velocityRef = React.useRef(0);
  const lastXRef = React.useRef(0);
  const lastTimeRef = React.useRef(0);
  const animFrameIdRef = React.useRef<number | null>(null);

  const checkWrap = React.useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    const singleWidth = el.scrollWidth / 4;
    if (singleWidth <= 10) return;

    if (el.scrollLeft >= singleWidth * 2.5) {
      el.scrollLeft -= singleWidth;
    } else if (el.scrollLeft <= singleWidth * 0.5) {
      el.scrollLeft += singleWidth;
    }
  }, []);

  const stopInertia = React.useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    setIsRolling(false);
  }, []);

  React.useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    const singleWidth = el.scrollWidth / 4;
    if (singleWidth > 0) {
      el.scrollLeft = singleWidth;
    }
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  const startFling = (initialVelocity: number) => {
    if (Math.abs(initialVelocity) < 0.12 || !sliderRef.current) return;
    stopInertia();
    setIsRolling(true);

    let currentVel = Math.max(-3.8, Math.min(3.8, initialVelocity));
    const friction = 0.958;
    let lastFrameTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(32, now - lastFrameTime);
      lastFrameTime = now;

      if (!sliderRef.current || Math.abs(currentVel) < 0.03) {
        stopInertia();
        return;
      }

      const frameRatio = dt / 16.6;
      sliderRef.current.scrollLeft -= currentVel * 16 * frameRatio;
      checkWrap();

      currentVel *= Math.pow(friction, frameRatio);
      animFrameIdRef.current = requestAnimationFrame(step);
    };

    animFrameIdRef.current = requestAnimationFrame(step);
  };

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      stopInertia();
      const scrollAmount = direction === 'left' ? -340 : 340;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkWrap, 450);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    stopInertia();
    isDraggingRef.current = true;
    setIsDragging(true);
    lastXRef.current = e.pageX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    dragDistanceRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !sliderRef.current) return;
    e.preventDefault();

    const currentX = e.pageX;
    const currentTime = performance.now();
    const deltaX = currentX - lastXRef.current;
    const deltaTime = Math.max(1, currentTime - lastTimeRef.current);

    dragDistanceRef.current += Math.abs(deltaX);
    const instVel = deltaX / deltaTime;
    velocityRef.current = velocityRef.current * 0.3 + instVel * 0.7;

    sliderRef.current.scrollLeft -= deltaX;
    checkWrap();

    lastXRef.current = currentX;
    lastTimeRef.current = currentTime;
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    if (performance.now() - lastTimeRef.current > 80) {
      velocityRef.current = 0;
      return;
    }
    startFling(velocityRef.current);
  };

  const handleMouseLeave = () => {
    if (isDraggingRef.current) handleMouseUp();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    stopInertia();
    isDraggingRef.current = true;
    setIsDragging(true);
    lastXRef.current = e.touches[0].pageX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    dragDistanceRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !sliderRef.current) return;
    const currentX = e.touches[0].pageX;
    const currentTime = performance.now();
    const deltaX = currentX - lastXRef.current;
    const deltaTime = Math.max(1, currentTime - lastTimeRef.current);

    dragDistanceRef.current += Math.abs(deltaX);
    const instVel = deltaX / deltaTime;
    velocityRef.current = velocityRef.current * 0.3 + instVel * 0.7;

    sliderRef.current.scrollLeft -= deltaX;
    checkWrap();

    lastXRef.current = currentX;
    lastTimeRef.current = currentTime;
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);

    if (performance.now() - lastTimeRef.current > 80) {
      velocityRef.current = 0;
      return;
    }
    startFling(velocityRef.current);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (dragDistanceRef.current > 8 || isRolling) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-[#0284c7] selection:text-white font-sans overflow-x-hidden">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative w-full min-h-[calc(100vh-74px)] sm:min-h-[calc(100vh-80px)] flex flex-col justify-between py-10 sm:py-14 lg:py-16 overflow-hidden bg-white border-b border-slate-200/80">
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <img 
            src="/landing_page_hero_raw.jpg" 
            alt="Komunitas Alumni STMM MMTC Yogyakarta" 
            className="w-full h-full object-cover object-[center_top] sm:object-[68%_center] lg:object-[center_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-transparent sm:via-white/55 lg:via-transparent pointer-events-none" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-6 text-left">
              <ScrollReveal direction="up" delayMs={60} durationMs={700}>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900/5 border border-slate-900/10 text-[#1e3a8a] text-xs font-semibold">
                  <GraduationCap className="w-4 h-4 text-[#0284c7]" />
                  <span>Ikatan Alumni STMM &ldquo;MMTC&rdquo; Yogyakarta</span>
                </div>

                {/* Headline bersih tanpa stabilo miring -rotate-1 ala AI */}
                <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-slate-900 leading-[1.12] tracking-tight mt-5">
                  Tetap Terhubung, <br />
                  <span className="text-[#0284c7]">Terus Berkarya</span> <br />
                  Bersama.
                </h1>

                <p className="text-base text-slate-700 max-w-lg leading-relaxed mt-4">
                  Ruang kolaborasi alumni Sekolah Tinggi Multi Media lintas angkatan—tempat berbagi peluang produksi, memamerkan showreel, dan membangun jejaring industri.
                </p>

                <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                  <Link 
                    href="/open-to-work" 
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#024E82] hover:bg-[#1e3a8a] text-white font-semibold text-sm shadow-sm transition-all duration-200 active:scale-[0.99]"
                  >
                    <span>Eksplorasi Talenta</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link 
                    href="/feed" 
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-white/95 hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-300 transition-all duration-200 active:scale-[0.99]"
                  >
                    <Play className="w-3.5 h-3.5 fill-current text-[#0284c7]" />
                    <span>Buka Kabar &amp; Karya Alumni</span>
                  </Link>
                </div>
              </ScrollReveal>
            </div>

            <div className="lg:col-span-6 hidden lg:block min-h-[380px] pointer-events-none" />
          </div>
        </div>

        {/* BOTTOM FEATURE BAR */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-8 sm:pt-10 pb-2 z-10">
          <ScrollReveal direction="up" delayMs={180} durationMs={700}>
            <div className="max-w-5xl mx-auto bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl py-4 px-6 sm:px-8 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/70">
              <div className="flex items-center gap-3.5 px-2 py-1 sm:py-0">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-[#0284c7] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">Jejaring Lintas Angkatan</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Koneksi rekan seprofesi</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 px-2 sm:pl-6 py-1 sm:py-0">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-[#0284c7] flex items-center justify-center shrink-0">
                  <Handshake className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">Bursa Kerja &amp; Kru</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Lowongan studio &amp; proyek</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 px-2 sm:pl-6 py-1 sm:py-0">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-[#0284c7] flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">Agenda &amp; Screening</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Jadwal temu &amp; pameran</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 px-2 sm:pl-6 py-1 sm:py-0">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-[#0284c7] flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-slate-900 leading-tight">Kabar Produksi</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Diskusi alur kerja &amp; riset</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* PROGRAM STUDI SLIDER */}
      <section id="prodi-section" className="py-20 sm:py-24 bg-slate-50 border-b border-slate-200/70 scroll-mt-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" delayMs={60} durationMs={650}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
              <div className="text-left max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0284c7] block mb-2">
                  6 Program Studi STMM MMTC
                </span>
                <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 leading-tight">
                  Telusuri Talenta Berdasarkan Keahlian
                </h2>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Pilih program studi untuk melihat direktori alumni dan lowongan kerja yang relevan dengan bidang produksi.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => scrollSlider('left')}
                  className="w-11 h-11 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs flex items-center justify-center transition cursor-pointer"
                  aria-label="Geser ke kiri"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollSlider('right')}
                  className="w-11 h-11 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs flex items-center justify-center transition cursor-pointer"
                  aria-label="Geser ke kanan"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </ScrollReveal>

          <div className="relative -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div
              ref={sliderRef}
              onScroll={checkWrap}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`flex items-stretch gap-5 overflow-x-auto py-4 px-1 select-none scrollbar-none ${
                isDragging || isRolling ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {LOOP_PRODI_LIST.map((prodi) => {
                const cardImg = getProdiCardImage(prodi.id);
                return (
                  <div
                    key={prodi.loopKey}
                    className="w-[260px] sm:w-[280px] lg:w-[300px] shrink-0 h-full"
                  >
                    <Link
                      href={`/lowongan?prodi=${encodeURIComponent(prodi.id)}`}
                      onClick={handleCardClick}
                      className="group relative block bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer select-none"
                      draggable={false}
                    >
                      <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100">
                        <img
                          src={cardImg}
                          alt={`Program Studi ${prodi.label} STMM MMTC`}
                          className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                          draggable={false}
                        />
                        <div className="absolute bottom-3.5 right-3.5 w-10 h-10 rounded-xl bg-white/95 border border-slate-200 shadow-sm flex items-center justify-center text-slate-800 group-hover:bg-[#024E82] group-hover:text-white group-hover:border-[#024E82] transition-colors duration-200 pointer-events-none">
                          <ArrowUpRight className="w-5 h-5" />
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SPOTLIGHT BANNER */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" delayMs={80} durationMs={750}>
            <div className="bg-[#024E82] rounded-2xl p-8 sm:p-12 text-white shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8 space-y-4">
                  <span className="text-xs font-semibold text-sky-200 uppercase tracking-wider block">
                    Ekosistem Profesi STMM MMTC Yogyakarta
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-bold leading-snug">
                    Jembatan Kolaborasi Industri Penyiaran &amp; Kreatif Digital
                  </h3>
                  <p className="text-sm sm:text-base text-sky-100/90 max-w-2xl leading-relaxed">
                    Berawal dari produksi studio kampus hingga memimpin ruang siar, proyek animasi, dan pengembangan gim nasional. Pajang showreel terbaikmu dan terhubung langsung dengan industri.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/open-to-work"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#024E82] font-bold text-sm hover:bg-sky-50 transition"
                    >
                      Lihat Direktori Talenta
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-3.5 bg-white/10 p-6 rounded-xl border border-white/15">
                  <div className="flex items-center gap-3 text-sm">
                    <Award className="w-5 h-5 text-sky-300 shrink-0" />
                    <span>6 Program Studi Penyiaran &amp; Multimedia</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Video className="w-5 h-5 text-sky-300 shrink-0" />
                    <span>Kurasi Showreel &amp; Portofolio Karya</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="w-5 h-5 text-sky-300 shrink-0" />
                    <span>Akses Langsung ke Perekrut Alumni</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Users className="w-5 h-5 text-sky-300 shrink-0" />
                    <span>Jejaring Lulusan di Studio Nasional</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* BOTTOM CTA: Ganti gaya "SaaS 100% Gratis" menjadi Kartu Klaim Akun Institusi */}
      <section className="py-16 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" delayMs={80} durationMs={750}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-7 space-y-4">
                <span className="text-xs font-bold text-[#0284c7] uppercase tracking-wider block">
                  Pendaftaran &amp; Akses Alumni
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                  Bangun Portofolio &amp; Rekrut Rekan Sealmamater
                </h2>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                  Kelola halaman showreel pribadimu, lamar posisi di berbagai rumah produksi, atau pasang info rekrutmen kru untuk proyek studiomu berikutnya.
                </p>
                <div className="space-y-2.5 pt-2 text-sm text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Terverifikasi khusus civitas &amp; alumni resmi STMM MMTC</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Integrasi pemutar showreel YouTube &amp; dokumen CV PDF</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Publikasi lowongan langsung ke program studi terkait</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-5">
                <div className="bg-white border border-slate-200 rounded-2xl p-7 sm:p-8 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 block">
                        Portal Resmi AlumniHub
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                        Klaim Akun Alumni
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-[#0284c7] flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    Gunakan Nomor Alumni resmi (format <code className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">MMTC-YYYY-XXX</code>) untuk memverifikasi profilmu secara instan.
                  </p>

                  <div className="space-y-3">
                    <Link
                      href="/register"
                      className="w-full py-3.5 px-6 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-sm shadow-2xs transition flex items-center justify-center gap-2"
                    >
                      <span>Verifikasi &amp; Buat Akun</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      href="/post-lowongan"
                      className="w-full py-3.5 px-6 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-sm border border-slate-200 transition flex items-center justify-center gap-2"
                    >
                      <Briefcase className="w-4 h-4 text-slate-600" />
                      <span>Pasang Info Lowongan / Kru</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
