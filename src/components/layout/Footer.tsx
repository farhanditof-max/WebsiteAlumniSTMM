import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/80 text-slate-500 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-5">
            <div className="space-y-2">
              <img 
                src="/logo_alumnihub.png" 
                alt="AlumniHub Sekolah Tinggi Multi Media" 
                className="h-11 sm:h-12 w-auto object-contain"
              />
              <span className="text-[11px] text-[#0284c7] font-semibold block">
                Kementerian Komunikasi dan Digital RI
              </span>
            </div>
            <p className="text-xs text-slate-600 max-w-md leading-relaxed">
              Platform karir dan jejaring resmi alumni Sekolah Tinggi Multi Media (MMTC) Yogyakarta. Wadah terpadu kolaborasi profesional industri penyiaran, animasi, game, dan teknologi informasi.
            </p>
            <div className="pt-1 flex items-center gap-2 text-[11px] text-slate-400">
              <span>Portal Terintegrasi Alumni &amp; Industri Kreatif</span>
            </div>
          </div>

          {/* Program Studi: 1 Baris Vertikal ke Bawah */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3.5">
              Program Studi &amp; Keahlian
            </h4>
            <div className="flex flex-col space-y-2 text-xs text-slate-600">
              <span className="hover:text-slate-900 transition cursor-default">
                Animasi
              </span>
              <span className="hover:text-slate-900 transition cursor-default">
                Game Design
              </span>
              <span className="hover:text-slate-900 transition cursor-default">
                Manajemen Informasi &amp; Komunikasi (MIK)
              </span>
              <span className="hover:text-slate-900 transition cursor-default">
                Manajemen Teknik Studio (Matekstosi)
              </span>
              <span className="hover:text-slate-900 transition cursor-default">
                Manajemen Pemberitaan (Manarita)
              </span>
              <span className="hover:text-slate-900 transition cursor-default">
                Manajemen Produksi Siaran (Manaprodsi)
              </span>
            </div>
          </div>

          {/* Tautan Navigasi */}
          <div className="md:col-span-3">
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
