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
  Compass,
  Building2, 
  Video, 
  Tv, 
  Sparkles,
  Users,
  Briefcase,
  Star,
  CheckCircle2,
  Award,
  ShieldCheck,
  Zap,
  ChevronLeft,
  ChevronRight
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

  // Infinite looping prodi list (4 sets of 6 prodis)
  const LOOP_PRODI_LIST = React.useMemo(() => [
    ...PRODI_LIST.map((p) => ({ ...p, loopKey: `set-0-${p.id}` })),
    ...PRODI_LIST.map((p) => ({ ...p, loopKey: `set-1-${p.id}` })),
    ...PRODI_LIST.map((p) => ({ ...p, loopKey: `set-2-${p.id}` })),
    ...PRODI_LIST.map((p) => ({ ...p, loopKey: `set-3-${p.id}` })),
  ], []);

  // Carousel, Infinite Loop & Momentum Physics State
  const sliderRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isRolling, setIsRolling] = React.useState(false);
  const isDraggingRef = React.useRef(false);
  const dragDistanceRef = React.useRef(0);
  const velocityRef = React.useRef(0);
  const lastXRef = React.useRef(0);
  const lastTimeRef = React.useRef(0);
  const animFrameIdRef = React.useRef<number | null>(null);

  // Wrap check: Seamlessly shift scrollLeft by 1 set width when crossing boundaries
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

  // Stop active inertia animation
  const stopInertia = React.useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    setIsRolling(false);
  }, []);

  // Center to set 1 (out of 4) on initial mount
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

  // Start inertia rolling ("lempar jauh kayak rolling")
  const startFling = (initialVelocity: number) => {
    if (Math.abs(initialVelocity) < 0.12 || !sliderRef.current) return;

    stopInertia();
    setIsRolling(true);

    let currentVel = initialVelocity;
    // Cap max velocity to prevent disorienting runaway speed
    if (currentVel > 3.8) currentVel = 3.8;
    if (currentVel < -3.8) currentVel = -3.8;

    const friction = 0.958; // Silky deceleration
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

  // Mouse Drag & Fling Handlers
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

    // Track instantaneous release velocity with exponential smoothing
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

    // If held still before release, cancel velocity
    if (performance.now() - lastTimeRef.current > 80) {
      velocityRef.current = 0;
      return;
    }

    startFling(velocityRef.current);
  };

  const handleMouseLeave = () => {
    if (isDraggingRef.current) {
      handleMouseUp();
    }
  };

  // Touch Drag & Fling Handlers for Mobile & Tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    stopInertia();
    isDraggingRef.current = true;
    setIsDragging(true);
    const touch = e.touches[0];
    lastXRef.current = touch.pageX;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
    dragDistanceRef.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !sliderRef.current) return;
    const touch = e.touches[0];
    const currentX = touch.pageX;
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
    // Prevent accidental navigation when dragging or inertia rolling
    if (dragDistanceRef.current > 8 || isRolling) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div className="min-h-screen bg-[#fafcff] text-slate-900 flex flex-col selection:bg-[#0284c7] selection:text-white font-sans overflow-x-hidden">
      <Navbar />

      {/* HERO SECTION — AIRY, SKY-BLUE LIGHT AESTHETIC PERSIS REFERENSI (FULL VIEWPORT FIRST SCREEN) */}
      <section className="relative w-full min-h-[calc(100vh-74px)] sm:min-h-[calc(100vh-80px)] flex flex-col justify-between py-8 sm:py-10 lg:py-12 overflow-hidden bg-gradient-to-b from-[#eef8ff] via-[#f7fbff] to-white border-b border-sky-100/60">
        
        {/* Soft Organic Floating Pastel Accents */}
        <div className="absolute top-12 left-1/3 w-3 h-3 rounded-full bg-amber-300 opacity-80" />
        <div className="absolute top-28 left-1/4 w-2 h-2 rounded-full bg-sky-400 opacity-60" />
        <div className="absolute top-20 right-1/4 w-3.5 h-3.5 rounded-full bg-amber-400 opacity-70" />
        <div className="absolute top-44 right-1/3 w-2.5 h-2.5 rounded-full bg-sky-300 opacity-50" />
        <div className="absolute -top-32 right-0 w-[550px] h-[550px] bg-sky-200/35 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-32 w-[450px] h-[450px] bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto">
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
                  <div className="relative inline-flex group">
                    {/* Ambient Glow Aura on Hover */}
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-sky-400 to-blue-600 opacity-30 group-hover:opacity-75 blur-md transition-all duration-500 group-hover:duration-200" />
                    
                    <Link 
                      href="/feed" 
                      className="relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-sky-600 via-[#0284c7] to-sky-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-sky-500/30 group-hover:shadow-sky-500/50 group-hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 overflow-hidden"
                    >
                      {/* Shimmer Light Beam Effect */}
                      <span 
                        aria-hidden="true" 
                        className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none animate-shimmer" 
                      />

                      {/* Interactive Rotating Compass Badge */}
                      <span className="w-6 h-6 rounded-full bg-white/15 group-hover:bg-white/25 flex items-center justify-center transition-all duration-300">
                        <Compass className="w-4 h-4 text-white transition-transform duration-700 ease-out group-hover:rotate-[360deg]" />
                      </span>

                      {/* Label */}
                      <span className="tracking-wide">Jelajahi Alumni Hub</span>

                      {/* Smooth Sliding Arrow */}
                      <ArrowRight className="w-4 h-4 text-white/80 group-hover:text-white transition-transform duration-300 ease-out group-hover:translate-x-1" />
                    </Link>
                  </div>
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

            {/* RIGHT CONTENT: Foto Gedung Kampus STMM MMTC */}
            <div className="lg:col-span-6 relative flex items-center justify-center w-full">
              <ScrollReveal direction="left" delayMs={140} durationMs={800} className="w-full max-w-xl">
                <div className="relative w-full">
                  {/* Foto Gedung */}
                  <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl shadow-sky-900/10 border-2 border-white/90 group max-h-[360px] sm:max-h-[400px] lg:max-h-[440px]">
                    <img 
                      src="/kampus_stmm.jpg" 
                      alt="Gedung Transformasi Digital STMM MMTC Yogyakarta" 
                      className="w-full h-full max-h-[360px] sm:max-h-[400px] lg:max-h-[440px] object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                </div>
              </ScrollReveal>
            </div>

          </div>
        </div>

        {/* BOTTOM HERO SECTION: STATS BAR & SCROLL CUE */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-8 sm:pt-10 pb-2 space-y-4">
          {/* Quick Metrics Bar (Frosted Glass Pill) */}
          <ScrollReveal direction="up" delayMs={180} durationMs={700}>
            <div className="max-w-4xl mx-auto bg-white/85 backdrop-blur-md border border-sky-100/90 rounded-2xl sm:rounded-full p-2.5 sm:px-6 sm:py-3.5 shadow-lg shadow-sky-500/5 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-sky-100">
              
              {/* Metric 1 */}
              <div className="flex items-center gap-3 px-2 py-1 sm:py-0">
                <div className="w-9 h-9 rounded-xl bg-sky-100/70 flex items-center justify-center text-[#0284c7] shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-none">2.500+</h4>
                  <p className="text-[11px] font-semibold text-slate-500 mt-1">Alumni Terkoneksi</p>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="flex items-center gap-3 px-2 sm:pl-6 py-1 sm:py-0">
                <div className="w-9 h-9 rounded-xl bg-indigo-100/70 flex items-center justify-center text-indigo-600 shrink-0">
                  <Tv className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-none">6 Prodi</h4>
                  <p className="text-[11px] font-semibold text-slate-500 mt-1">Spesialisasi Media</p>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="flex items-center gap-3 px-2 sm:pl-6 py-1 sm:py-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-100/70 flex items-center justify-center text-emerald-600 shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-none">150+</h4>
                  <p className="text-[11px] font-semibold text-slate-500 mt-1">Showreel Karya</p>
                </div>
              </div>

              {/* Metric 4 */}
              <div className="flex items-center gap-3 px-2 sm:pl-6 py-1 sm:py-0">
                <div className="w-9 h-9 rounded-xl bg-amber-100/70 flex items-center justify-center text-amber-600 shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-none">94%</h4>
                  <p className="text-[11px] font-semibold text-slate-500 mt-1">Karir Industri Kreatif</p>
                </div>
              </div>

            </div>
          </ScrollReveal>

          {/* Interactive Scroll Down Cue */}
          <div className="flex justify-center pt-0.5">
            <a 
              href="#prodi-section" 
              className="inline-flex flex-col items-center gap-1 text-slate-400 hover:text-sky-600 transition-colors group cursor-pointer"
              title="Scroll untuk melihat Program Studi Unggulan"
            >
              <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase">Eksplorasi Program Studi</span>
              <div className="w-4 h-7 sm:w-5 sm:h-8 rounded-full border-2 border-slate-300 group-hover:border-sky-500 flex items-start justify-center p-1 transition-colors">
                <div className="w-1 h-2 rounded-full bg-slate-400 group-hover:bg-sky-500 animate-bounce" />
              </div>
            </a>
          </div>
        </div>

      </section>

      {/* KLASIFIKASI BIDANG KEAHLIAN / PRODI — SWIPEABLE INTERACTIVE SLIDER */}
      <section id="prodi-section" className="py-20 sm:py-28 bg-slate-50/70 border-b border-slate-100 scroll-mt-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <ScrollReveal direction="up" delayMs={60} durationMs={650}>
            {/* Header with Navigation Arrows */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 sm:mb-12">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#0284c7] bg-sky-50 px-4 py-1.5 rounded-full border border-sky-100 shadow-2xs mb-3">
                  Program Studi Unggulan
                </span>
                <h2 className="text-2xl sm:text-4xl lg:text-[40px] font-bold text-slate-900 leading-tight">
                  Klasifikasi Keahlian Khusus MMTC
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-xl mt-2 leading-relaxed">
                  Geser kartu untuk menemukan talenta alumni dan lowongan berdasarkan spesialisasi bidang studi
                </p>
              </div>

              {/* Carousel Navigation Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-end">
                <button
                  type="button"
                  onClick={() => scrollSlider('left')}
                  className="w-11 h-11 rounded-2xl bg-white hover:bg-sky-50 text-slate-700 hover:text-[#0284c7] border border-slate-200/90 hover:border-sky-300 shadow-sm flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer"
                  title="Geser ke kiri"
                  aria-label="Geser ke kiri"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollSlider('right')}
                  className="w-11 h-11 rounded-2xl bg-white hover:bg-sky-50 text-slate-700 hover:text-[#0284c7] border border-slate-200/90 hover:border-sky-300 shadow-sm flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer"
                  title="Geser ke kanan"
                  aria-label="Geser ke kanan"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </ScrollReveal>

          {/* Swipeable / Scrollable Horizontal Cards Slider */}
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
              className={`flex items-stretch gap-4 sm:gap-5 overflow-x-auto py-8 px-1 select-none scrollbar-none transition-colors ${
                isDragging || isRolling ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {LOOP_PRODI_LIST.map((prodi) => {
                const cardImg = getProdiCardImage(prodi.id);

                return (
                  <div
                    key={prodi.loopKey}
                    className="w-[260px] sm:w-[280px] lg:w-[310px] shrink-0 h-full py-1"
                  >
                    <Link
                      href={`/lowongan?prodi=${encodeURIComponent(prodi.id)}`}
                      onClick={handleCardClick}
                      className="group relative block bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-md hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer select-none"
                      draggable={false}
                    >
                      {/* SVG Card Illustration (High-Definition 1080x1350 Poster) */}
                      <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-100">
                        <img
                          src={cardImg}
                          alt={`Program Studi ${prodi.label} STMM MMTC`}
                          className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                          draggable={false}
                        />

                        {/* Subtle Ambient Vignette / Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                        {/* Interactive Floating Action Arrow Button di Ujung Kanan Bawah */}
                        <div 
                          className="absolute bottom-3.5 right-3.5 sm:bottom-4 sm:right-4 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 backdrop-blur-md border border-white/80 shadow-md flex items-center justify-center text-slate-700 group-hover:bg-[#0284c7] group-hover:text-white group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-sky-500/30 transition-all duration-300 pointer-events-none"
                          title={`Jelajahi ${prodi.label}`}
                        >
                          <ArrowUpRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Swipe Hint */}
          <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[11px] font-medium pt-2 sm:hidden">
            <span>Geser kartu ke samping</span>
            <span className="font-bold text-sky-600">&harr;</span>
          </div>

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

              {/* Right Card: Interactive Action Box with Glow & Glassmorphism */}
              <div className="md:col-span-5 relative group">
                {/* Ambient Glow Aura */}
                <div className="absolute -inset-1 rounded-[36px] bg-gradient-to-tr from-sky-400 via-indigo-400 to-sky-300 opacity-25 group-hover:opacity-50 blur-xl transition-all duration-500 -z-10" />

                <div className="relative bg-white/95 backdrop-blur-xl border border-sky-200/90 rounded-[32px] p-7 sm:p-9 text-center space-y-6 shadow-xl shadow-sky-500/10 transition-all duration-300 hover:-translate-y-1">
                  
                  {/* Top Badge */}
                  <div className="flex justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-700 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Akses Komunitas Resmi MMTC
                    </span>
                  </div>

                  {/* Pricing / Headline */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                      Registrasi Akun
                    </span>
                    <p className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-sky-600 via-[#0284c7] to-indigo-600 bg-clip-text text-transparent tracking-tight">
                      100% Gratis
                    </p>
                    <p className="text-xs font-medium text-slate-500 max-w-xs mx-auto">
                      Khusus alumni, wisudawan &amp; lulusan STMM MMTC Yogyakarta
                    </p>
                  </div>

                  {/* Interactive Action Buttons */}
                  <div className="space-y-3 pt-1">
                    {/* Primary Button with Shimmer & Sliding Arrow */}
                    <Link
                      href="/register"
                      className="group/btn relative w-full py-4 px-6 rounded-full bg-gradient-to-r from-sky-500 via-[#0284c7] to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-sky-500/30 hover:shadow-xl hover:shadow-sky-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden"
                    >
                      {/* Shimmer light sweep */}
                      <span 
                        aria-hidden="true" 
                        className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none animate-shimmer" 
                      />
                      <span>Daftar Akun Alumni Baru</span>
                      <ArrowRight className="w-4 h-4 text-white/90 group-hover/btn:translate-x-1.5 transition-transform duration-200" />
                    </Link>

                    {/* Secondary Button */}
                    <Link
                      href="/post-lowongan"
                      className="group/btn2 w-full py-3.5 px-6 rounded-full bg-slate-50/90 hover:bg-sky-50/80 text-slate-800 hover:text-[#0284c7] font-bold text-xs sm:text-sm border border-slate-200 hover:border-sky-300 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Briefcase className="w-4 h-4 text-slate-500 group-hover/btn2:text-[#0284c7] group-hover/btn2:-rotate-6 transition-transform" />
                      <span>Pasang Lowongan Studio / Proyek</span>
                    </Link>
                  </div>

                  {/* Verification & Perks Strip */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Verifikasi No. Alumni
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      Akses Instan
                    </span>
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
