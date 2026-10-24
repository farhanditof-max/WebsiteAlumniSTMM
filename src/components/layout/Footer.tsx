import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/80 text-slate-500 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-10">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-2">
            <div className="space-y-2">
              <img 
                src="/logo_alumnihub.webp" 
                alt="AlumniHub Sekolah Tinggi Multi Media" 
                className="h-14 sm:h-16 w-auto object-contain"
              />
              <span className="text-[11px] text-[#0284c7] font-semibold block">
                Kementerian Komunikasi dan Digital RI
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-md leading-relaxed">
              Platform karir dan jejaring resmi alumni Sekolah Tinggi Multi Media (MMTC) Yogyakarta. Wadah terpadu kolaborasi profesional industri penyiaran, animasi, game, dan teknologi informasi.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Portal Terintegrasi Alumni & Industri Kreatif</span>
            </div>
          </div>

          {/* Program Studi */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3.5">
              Program Studi & Keahlian
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
              <span className="hover:text-slate-900 transition flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Animasi
              </span>
              <span className="hover:text-slate-900 transition flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Game Design
              </span>
              <span className="hover:text-slate-900 transition flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Manajemen Informasi & Komunikasi (MIK)
              </span>
              <span className="hover:text-slate-900 transition flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Manajemen Teknik Studio (Matekstosi)
              </span>
              <span className="hover:text-slate-900 transition flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Manajemen Pemberitaan (Manarita)
              </span>
              <span className="hover:text-slate-900 transition flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Manajemen Produksi Siaran (Manaprodsi)
              </span>
            </div>
          </div>

          {/* Tautan Navigasi */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3.5">
              Tautan Navigasi
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/lowongan" className="text-slate-600 hover:text-[#0284c7] transition inline-flex items-center gap-1">
                  Cari Lowongan <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </Link>
              </li>
              <li>
                <Link href="/open-to-work" className="text-slate-600 hover:text-[#0284c7] transition inline-flex items-center gap-1">
                  Alumni Open to Work <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </Link>
              </li>
              <li>
                <Link href="/post-lowongan" className="text-slate-600 hover:text-[#0284c7] transition inline-flex items-center gap-1">
                  Pasang Lowongan Alumni <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </Link>
              </li>
              <li>
                <Link href="/profil" className="text-slate-600 hover:text-[#0284c7] transition inline-flex items-center gap-1">
                  Portofolio & Showreel <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="mt-12 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© 2026 Ikatan Alumni STMM MMTC Yogyakarta. Hak Cipta Dilindungi.</p>
          <p className="flex items-center gap-1">
            Dikelola bersama Ikatan Alumni MMTC Yogyakarta
          </p>
        </div>
      </div>
    </footer>
  );
}
