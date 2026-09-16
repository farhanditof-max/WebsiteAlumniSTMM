import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 text-slate-500 py-14">
      <div className="w-full px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3.5 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <img 
                src="/logo_stmm.png" 
                alt="STMM MMTC Yogyakarta" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base tracking-tight block">STMM &quot;MMTC&quot; YOGYAKARTA</span>
              <span className="text-[11px] text-[#0284c7] font-semibold block">Kementerian Komunikasi dan Informatika RI</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 max-w-md leading-relaxed">
            Portal karir dan jejaring resmi alumni Sekolah Tinggi Multi Media (MMTC) Yogyakarta. Wadah terpadu kolaborasi profesional industri penyiaran, animasi, game, dan teknologi informasi.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Program Studi</h4>
          <ul className="space-y-1.5 text-xs text-slate-500">
            <li>Animasi</li>
            <li>Game Design</li>
            <li>Manajemen Informasi & Komunikasi (MIK)</li>
            <li>Manajemen Teknik Studio (Matekstosi)</li>
            <li>Manajemen Pemberitaan (Manarita)</li>
            <li>Manajemen Produksi Siaran (Manaprodsi)</li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Tautan Karir</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/lowongan" className="hover:text-[#0284c7] transition">Cari Lowongan</Link></li>
            <li><Link href="/open-to-work" className="hover:text-[#0284c7] transition">Alumni Open to Work</Link></li>
            <li><Link href="/post-lowongan" className="hover:text-[#0284c7] transition">Pasang Loker Alumni</Link></li>
            <li><Link href="/profil" className="hover:text-[#0284c7] transition">Portofolio Showreel</Link></li>
          </ul>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400">
        <p>© 2026 Ikatan Alumni STMM MMTC Yogyakarta. Hak Cipta Dilindungi.</p>
        <p className="flex items-center gap-1 mt-2 md:mt-0">
          Kementerian Komunikasi dan Informatika Republik Indonesia
        </p>
      </div>
    </footer>
  );
}
