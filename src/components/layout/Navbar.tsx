'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { 
  Briefcase, 
  PlusCircle, 
  LogOut, 
  Menu, 
  X,
  FileText
} from 'lucide-react';
import AlumniAvatar from '@/components/profile/AlumniAvatar';

export default function Navbar() {
  const { user, profile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo with Official STMM MMTC Logo (Transparent Background) */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <img 
                src="/logo_stmm.png" 
                alt="STMM MMTC Yogyakarta" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 block leading-tight">
                STMM <span className="text-[#0284c7]">MMTC</span>
              </span>
              <span className="block text-[10px] text-slate-500 font-medium tracking-wide">
                Portal Karir & Jejaring Alumni
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-slate-600 hover:text-[#0284c7] transition">
              Beranda
            </Link>
            <Link href="/lowongan" className="text-sm font-medium text-slate-600 hover:text-[#0284c7] transition flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-[#0284c7]" />
              Lowongan Kerja
            </Link>
            <Link href="/open-to-work" className="text-sm font-medium text-slate-600 hover:text-[#0284c7] transition flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Open to Work
            </Link>
            {user && (
              <>
                <Link href="/post-lowongan" className="text-sm font-medium text-slate-600 hover:text-[#0284c7] transition flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  Pasang Lowongan
                </Link>
                <Link href="/lamaran" className="text-sm font-medium text-slate-600 hover:text-[#0284c7] transition flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-600" />
                  Lamaran Saya
                </Link>
              </>
            )}
          </div>

          {/* User Profile / Auth CTA */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link 
                  href="/profil" 
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-[#0284c7] text-white flex items-center justify-center text-xs font-semibold overflow-hidden">
                    <AlumniAvatar src={profile?.fotoProfil} name={profile?.namaLengkap} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">{profile?.namaLengkap || 'Alumni'}</p>
                    <p className="text-[10px] text-[#0284c7] font-medium">{profile?.prodi || 'MMTC'}</p>
                  </div>
                </Link>
                <button
                  onClick={() => logout()}
                  title="Keluar"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                  href="/login" 
                  className="text-sm font-medium text-slate-600 hover:text-[#0284c7] px-3 py-2"
                >
                  Masuk
                </Link>
                <Link 
                  href="/register" 
                  className="text-sm font-semibold px-4 py-2 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-sm transition"
                >
                  Daftar Alumni
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3">
          <Link 
            href="/" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-700 hover:text-[#0284c7] py-2"
          >
            Beranda
          </Link>
          <Link 
            href="/lowongan" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-700 hover:text-[#0284c7] py-2"
          >
            Lowongan Kerja
          </Link>
          <Link 
            href="/open-to-work" 
            onClick={() => setMobileMenuOpen(false)}
            className="block text-emerald-600 font-semibold py-2"
          >
            🟢 Open to Work (Alumni)
          </Link>
          {user ? (
            <>
              <Link 
                href="/post-lowongan" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-slate-700 hover:text-[#0284c7] py-2"
              >
                Pasang Lowongan
              </Link>
              <Link 
                href="/lamaran" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-slate-700 hover:text-[#0284c7] py-2"
              >
                Lamaran Saya
              </Link>
              <Link 
                href="/profil" 
                onClick={() => setMobileMenuOpen(false)}
                className="block text-[#0284c7] font-semibold py-2"
              >
                Profil Saya ({profile?.namaLengkap})
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left text-red-500 py-2"
              >
                Keluar
              </button>
            </>
          ) : (
            <div className="pt-4 flex flex-col gap-2">
              <Link 
                href="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Masuk
              </Link>
              <Link 
                href="/register" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg bg-[#0284c7] text-white font-medium shadow-xs"
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
