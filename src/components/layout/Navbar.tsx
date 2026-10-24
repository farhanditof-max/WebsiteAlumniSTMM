'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Briefcase, 
  PlusCircle, 
  LogOut, 
  Menu, 
  X,
  FileText,
  User,
  Compass,
  Users
} from 'lucide-react';
import AlumniAvatar from '@/components/profile/AlumniAvatar';

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Jika sedang preview halaman dashboard tanpa login, aktifkan simulasi tampilan user login
  const isDashboardRoute = pathname === '/profil' || pathname === '/post-lowongan' || pathname === '/lamaran' || pathname === '/feed' || pathname === '/beranda';
  const effectiveUser = user || (isDashboardRoute ? { uid: 'demo-user', email: 'budi.santoso@alumni.mmtc.ac.id' } : null);
  const effectiveProfile = profile || (isDashboardRoute ? { namaLengkap: 'Budi Santoso', prodi: 'Animasi', fotoProfil: '' } : null);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-sky-100 text-slate-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          
          {/* Brand Logo - Official AlumniHub Graphic */}
          <Link href="/" className="flex items-center group focus:outline-none py-1 shrink-0">
            <img 
              src="/logo_alumnihub.webp" 
              alt="AlumniHub Sekolah Tinggi Multi Media" 
              className="h-[35px] sm:h-[40px] w-auto object-contain group-hover:opacity-90 transition-opacity"
            />
          </Link>

          {/* Desktop Navigation - Clean Rounded Pill Links */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/80">
            <Link 
              href="/" 
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                pathname === '/' 
                  ? 'bg-white text-[#0284c7] shadow-xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-slate-400" />
              <span>Beranda</span>
            </Link>

            <Link 
              href="/feed" 
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive('/feed') || isActive('/beranda')
                  ? 'bg-white text-[#0284c7] shadow-xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>Feed</span>
            </Link>

            <Link 
              href="/lowongan" 
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive('/lowongan') 
                  ? 'bg-white text-[#0284c7] shadow-xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>Lowongan</span>
            </Link>

            <Link 
              href="/open-to-work" 
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive('/open-to-work') 
                  ? 'bg-white text-emerald-700 shadow-xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Open to Work</span>
            </Link>

            {effectiveUser && (
              <Link 
                href="/lamaran" 
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive('/lamaran') 
                    ? 'bg-white text-[#0284c7] shadow-xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>Lamaran</span>
              </Link>
            )}
          </div>

          {/* User Profile / Auth CTA */}
          <div className="hidden md:flex items-center gap-2.5">
            {effectiveUser ? (
              <div className="flex items-center gap-2">
                <Link 
                  href="/post-lowongan" 
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 border shadow-2xs whitespace-nowrap ${
                    isActive('/post-lowongan')
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200/80'
                  }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Pasang Loker</span>
                </Link>

                <Link 
                  href="/profil" 
                  className={`flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full border transition hover:shadow-xs ${
                    isActive('/profil')
                      ? 'bg-sky-50 border-sky-300 text-[#0284c7]'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-400 to-[#0284c7] text-white flex items-center justify-center text-xs font-bold overflow-hidden shadow-2xs">
                    <AlumniAvatar src={effectiveProfile?.fotoProfil} name={effectiveProfile?.namaLengkap} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[100px] leading-tight">
                      {effectiveProfile?.namaLengkap || 'Alumni MMTC'}
                    </p>
                    <p className="text-[10px] text-[#0284c7] font-semibold leading-tight">
                      {effectiveProfile?.prodi || 'Alumni'}
                    </p>
                  </div>
                </Link>

                {user ? (
                  <button
                    onClick={() => logout()}
                    title="Keluar dari akun"
                    className="p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                    aria-label="Logout"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                    Preview
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link 
                  href="/login" 
                  className="text-sm font-bold text-slate-700 hover:text-[#0284c7] px-4 py-2.5 rounded-full hover:bg-slate-50 transition"
                >
                  Masuk
                </Link>
                <Link 
                  href="/register" 
                  className="text-sm font-bold px-6 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-[#0284c7] hover:from-sky-600 hover:to-[#0369a1] text-white shadow-md shadow-sky-500/25 transition active:scale-[0.98]"
                >
                  Daftar Alumni
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-sky-100 px-4 pt-3 pb-6 space-y-2 animate-fade-in shadow-lg">
          <Link 
            href="/" 
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium transition ${
              pathname === '/' ? 'bg-sky-50 text-[#0284c7] font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4 text-slate-400" />
            Beranda
          </Link>
          <Link 
            href="/feed" 
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium transition ${
              isActive('/feed') || isActive('/beranda') ? 'bg-sky-50 text-[#0284c7] font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 text-[#0284c7]" />
            Feed Alumni
          </Link>
          <Link 
            href="/lowongan" 
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium transition ${
              isActive('/lowongan') ? 'bg-sky-50 text-[#0284c7] font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-4 h-4 text-[#0284c7]" />
            Lowongan Kerja
          </Link>
          <Link 
            href="/open-to-work" 
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition ${
              isActive('/open-to-work') ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200' : 'text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Open to Work (Katalog Talenta)
            </span>
          </Link>

          {effectiveUser ? (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <Link 
                href="/post-lowongan" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                Pasang Lowongan
              </Link>
              <Link 
                href="/lamaran" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <FileText className="w-4 h-4 text-amber-600" />
                Lamaran Saya
              </Link>
              <Link 
                href="/profil" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold bg-sky-50 text-[#0284c7] border border-sky-100"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#0284c7] text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                    <AlumniAvatar src={effectiveProfile?.fotoProfil} name={effectiveProfile?.namaLengkap} />
                  </div>
                  <span>Profil Saya ({effectiveProfile?.namaLengkap || 'Alumni'})</span>
                </div>
                <User className="w-4 h-4" />
              </Link>
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 rounded-2xl transition"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              ) : null}
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link 
                href="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-full border border-slate-200 text-slate-800 font-bold hover:bg-slate-50 text-sm transition"
              >
                Masuk
              </Link>
              <Link 
                href="/register" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-full bg-gradient-to-r from-sky-500 to-[#0284c7] text-white font-bold text-sm shadow-md shadow-sky-500/25 transition"
              >
                Daftar Alumni
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
