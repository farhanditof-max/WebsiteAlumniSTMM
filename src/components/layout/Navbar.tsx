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
  Compass
} from 'lucide-react';
import AlumniAvatar from '@/components/profile/AlumniAvatar';

export default function Navbar() {
  const pathname = usePathname();
  const { user, profile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 glass-header border-b border-slate-200/80 text-slate-800 shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand Logo with Official STMM MMTC Logo */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0284c7] rounded-xl p-1">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shrink-0 shadow-2xs group-hover:border-[#0284c7]/40 transition">
              <img 
                src="/logo_stmm.png" 
                alt="STMM MMTC Yogyakarta" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 group-hover:text-[#0284c7] transition">
                  STMM <span className="text-[#0284c7]">MMTC</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-[#0284c7] border border-sky-100 hidden sm:inline-block">
                  AlumniHub
                </span>
              </div>
              <span className="block text-[11px] text-slate-500 font-medium tracking-normal -mt-0.5">
                Portal Karir & Jejaring Resmi
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link 
              href="/" 
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                isActive('/') 
                  ? 'bg-slate-100 text-[#0284c7] font-semibold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-4 h-4" />
              Beranda
            </Link>

            <Link 
              href="/lowongan" 
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                isActive('/lowongan') 
                  ? 'bg-sky-50 text-[#0284c7] font-semibold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Briefcase className="w-4 h-4 text-[#0284c7]" />
              Lowongan Kerja
            </Link>

            <Link 
              href="/open-to-work" 
              className={`px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                isActive('/open-to-work') 
                  ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Open to Work
            </Link>

            {user && (
              <>
                <Link 
                  href="/post-lowongan" 
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                    isActive('/post-lowongan') 
                      ? 'bg-slate-100 text-[#0284c7] font-semibold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  Pasang Lowongan
                </Link>

                <Link 
                  href="/lamaran" 
                  className={`px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                    isActive('/lamaran') 
                      ? 'bg-slate-100 text-[#0284c7] font-semibold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4 text-amber-600" />
                  Lamaran Saya
                </Link>
              </>
            )}
          </div>

          {/* User Profile / Auth CTA */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5">
                <Link 
                  href="/profil" 
                  className={`flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-full border transition hover:shadow-2xs ${
                    isActive('/profil')
                      ? 'bg-sky-50/80 border-sky-300 text-[#0284c7]'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-[#0284c7] text-white flex items-center justify-center text-xs font-bold overflow-hidden shadow-2xs">
                    <AlumniAvatar src={profile?.fotoProfil} name={profile?.namaLengkap} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-900 truncate max-w-[130px] leading-tight">
                      {profile?.namaLengkap || 'Alumni MMTC'}
                    </p>
                    <p className="text-[10px] text-[#0284c7] font-medium leading-tight">
                      {profile?.prodi || 'Alumni'}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => logout()}
                  title="Keluar dari akun"
                  className="p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link 
                  href="/login" 
                  className="text-sm font-semibold text-slate-700 hover:text-[#0284c7] px-4 py-2 rounded-xl hover:bg-slate-100/70 transition"
                >
                  Masuk
                </Link>
                <Link 
                  href="/register" 
                  className="text-sm font-semibold px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-xs transition hover:shadow active:scale-[0.98]"
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
              className="p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/98 backdrop-blur-xl border-b border-slate-200 px-4 pt-3 pb-6 space-y-2 animate-fade-in shadow-lg">
          <Link 
            href="/" 
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              isActive('/') ? 'bg-slate-100 text-[#0284c7] font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4 text-slate-400" />
            Beranda
          </Link>
          <Link 
            href="/lowongan" 
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              isActive('/lowongan') ? 'bg-sky-50 text-[#0284c7] font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-4 h-4 text-[#0284c7]" />
            Lowongan Kerja
          </Link>
          <Link 
            href="/open-to-work" 
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
              isActive('/open-to-work') ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200' : 'text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Open to Work (Katalog Talenta)
            </span>
          </Link>

          {user ? (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <Link 
                href="/post-lowongan" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                Pasang Lowongan
              </Link>
              <Link 
                href="/lamaran" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <FileText className="w-4 h-4 text-amber-600" />
                Lamaran Saya
              </Link>
              <Link 
                href="/profil" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold bg-sky-50/80 text-[#0284c7] border border-sky-100"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#0284c7] text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                    <AlumniAvatar src={profile?.fotoProfil} name={profile?.namaLengkap} />
                  </div>
                  <span>Profil Saya ({profile?.namaLengkap || 'Alumni'})</span>
                </div>
                <User className="w-4 h-4" />
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link 
                href="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-slate-200 text-slate-800 font-semibold hover:bg-slate-50 text-sm transition"
              >
                Masuk
              </Link>
              <Link 
                href="/register" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-[#0284c7] text-white font-semibold text-sm shadow-xs transition"
              >
                Daftar Alumni
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
