'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { createJob } from '@/lib/jobs';
import { PRODI_LIST, ProdiType } from '@/types';
import { 
  PlusCircle, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  Calendar, 
  DollarSign, 
  FileText, 
  GraduationCap,
  Sparkles
} from 'lucide-react';

export default function PostLowonganPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const isDemo = !user;

  const [judul, setJudul] = useState('');
  const [perusahaan, setPerusahaan] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [tipeKerja, setTipeKerja] = useState<'Full-time' | 'Part-time' | 'Freelance' | 'Magang'>('Full-time');
  const [selectedProdi, setSelectedProdi] = useState<ProdiType[]>(['Animasi']);
  const [deskripsi, setDeskripsi] = useState('');
  const [gajiRange, setGajiRange] = useState('');
  const [kualifikasiRaw, setKualifikasiRaw] = useState('');
  const [deadline, setDeadline] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Helper smart format angka atau rentang ke Rupiah
  const formatRupiahString = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) return '';
    if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      const formattedParts = parts.map(part => {
        const digits = part.replace(/\D/g, '');
        return digits ? 'Rp ' + parseInt(digits, 10).toLocaleString('id-ID') : part.trim();
      });
      return formattedParts.join(' - ');
    }
    const cleanNumber = trimmed.replace(/\D/g, '');
    if (cleanNumber) {
      return 'Rp ' + parseInt(cleanNumber, 10).toLocaleString('id-ID');
    }
    return trimmed;
  };

  const handleGajiBlur = () => {
    if (gajiRange) {
      setGajiRange(formatRupiahString(gajiRange));
    }
  };

  const toggleProdi = (p: ProdiType) => {
    if (selectedProdi.includes(p)) {
      if (selectedProdi.length > 1) {
        setSelectedProdi(selectedProdi.filter(item => item !== p));
      }
    } else {
      setSelectedProdi([...selectedProdi, p]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!judul.trim() || !perusahaan.trim() || !lokasi.trim() || !deskripsi.trim()) {
      setError('Mohon lengkapi semua kolom wajib bertanda bintang (*).');
      return;
    }

    setLoading(true);
    setError('');

    if (isDemo || !user) {
      setTimeout(() => {
        setLoading(false);
        setSuccess(true);
        setTimeout(() => {
          router.push('/lowongan');
        }, 1500);
      }, 700);
      return;
    }

    try {
      const kualifikasi = kualifikasiRaw
        .split('\n')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const posterName = profile?.namaLengkap || user.displayName || user.email?.split('@')[0] || 'Alumni MMTC';
      const posterEmail = profile?.email || user.email || '';

      await createJob({
        postedBy: user.uid,
        posterName,
        posterEmail,
        judul: judul.trim(),
        perusahaan: perusahaan.trim(),
        lokasi: lokasi.trim(),
        tipeKerja,
        prodiTarget: selectedProdi,
        deskripsi: deskripsi.trim(),
        kualifikasi,
        gajiRange: gajiRange.trim() || undefined,
        deadline: deadline || undefined
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/lowongan');
      }, 1500);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setError(errorObj.message || 'Gagal memposting lowongan.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <Loader2 className="w-6 h-6 animate-spin text-[#0284c7]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafcff] text-slate-900 flex flex-col justify-between font-sans">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        
        {/* DEMO / PREVIEW BANNER JIKA DIAKSES TANPA LOGIN */}
        {isDemo && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-sky-500 to-[#0284c7] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md shadow-sky-500/10 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
              <div>
                <p className="text-xs font-bold leading-tight">Mode Pratinjau Form Pasang Lowongan (Preview Tanpa Login)</p>
                <p className="text-[11px] text-sky-100">
                  Anda dapat mencoba menginput judul, multi-select prodi, dan simulasi publikasi loker secara langsung.
                </p>
              </div>
            </div>
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-full bg-white text-[#0284c7] text-xs font-bold hover:bg-sky-50 transition shrink-0 text-center shadow-xs"
            >
              Masuk Akun Asli
            </Link>
          </div>
        )}

        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <PlusCircle className="w-3.5 h-3.5" />
            Bursa Karir Alumni
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Pasang Lowongan Kerja Alumni
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm">
            Bantu sesama alumni dan adik tingkat MMTC mendapatkan kesempatan berkarya di perusahaan, stasiun TV, game studio, atau agensi kreatifmu.
          </p>
        </div>

        {success ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-3 shadow-sm animate-fade-in">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Lowongan Berhasil Ditayangkan!</h3>
            <p className="text-xs text-slate-500">Mengarahkan Anda ke daftar lowongan kerja...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* SECTION 1: INFORMASI DASAR */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 space-y-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0284c7]" />
                Detail Posisi &amp; Perusahaan
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Judul Posisi / Pekerjaan *
                  </label>
                  <input
                    type="text"
                    required
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    placeholder="e.g. 3D Animator, Video Editor, Unity Game Developer"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Perusahaan / Studio *
                  </label>
                  <input
                    type="text"
                    required
                    value={perusahaan}
                    onChange={(e) => setPerusahaan(e.target.value)}
                    placeholder="e.g. Infinite Studios, Trans Media, Gameloft"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Lokasi Kerja *
                  </label>
                  <input
                    type="text"
                    required
                    value={lokasi}
                    onChange={(e) => setLokasi(e.target.value)}
                    placeholder="e.g. Jakarta Selatan / Remote / Yogyakarta"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tipe Pekerjaan *
                  </label>
                  <select
                    value={tipeKerja}
                    onChange={(e) => setTipeKerja(e.target.value as 'Full-time' | 'Part-time' | 'Freelance' | 'Magang')}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition font-medium"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Freelance">Freelance / Project-based</option>
                    <option value="Magang">Magang / Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    Perkiraan Gaji (Opsional)
                  </label>
                  <input
                    type="text"
                    value={gajiRange}
                    onChange={(e) => setGajiRange(e.target.value)}
                    onBlur={handleGajiBlur}
                    placeholder="e.g. 7.500.000 atau 5jt - 8jt"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition font-bold text-emerald-700"
                  />
                </div>
              </div>

              {/* BATAS WAKTU LAMARAN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Batas Waktu Lamaran / Deadline (Opsional)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full sm:w-1/2 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
                />
              </div>
            </div>

            {/* SECTION 2: PILIH JURUSAN TARGET */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#0284c7]" />
                Target Program Studi Alumni (Bisa pilih lebih dari satu) *
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PRODI_LIST.map((p) => {
                  const isChecked = selectedProdi.includes(p.id);
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => toggleProdi(p.id)}
                      className={`p-3.5 rounded-2xl border text-left text-xs transition cursor-pointer ${
                        isChecked 
                          ? 'bg-sky-50 border-[#0284c7] text-[#0284c7] font-bold shadow-2xs' 
                          : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">{p.label}</span>
                        {isChecked && <span className="text-[10px] bg-[#0284c7] text-white px-1.5 py-0.2 rounded-full font-bold">✓</span>}
                      </div>
                      <span className="text-[11px] text-slate-500 line-clamp-1 leading-snug">{p.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 3: DESKRIPSI & PERSYARATAN */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#0284c7]" />
                Deskripsi &amp; Persyaratan Kualifikasi
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Deskripsi Pekerjaan &amp; Tanggung Jawab *
                </label>
                <textarea
                  rows={5}
                  required
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  placeholder="Jelaskan mengenai proyek atau pekerjaan, tanggung jawab utama, dan workflow di studio..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kualifikasi &amp; Persyaratan (Tulis satu persyaratan per baris)
                </label>
                <textarea
                  rows={4}
                  value={kualifikasiRaw}
                  onChange={(e) => setKualifikasiRaw(e.target.value)}
                  placeholder="Menguasai software Blender / Maya&#10;Memiliki portfolio atau showreel animasi aktif&#10;Mampu bekerja secara komunikatif dalam tim"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 rounded-full bg-gradient-to-r from-sky-500 to-[#0284c7] hover:from-sky-600 hover:to-[#0369a1] text-white text-sm font-bold shadow-md shadow-sky-500/20 transition flex items-center gap-2 disabled:opacity-50 active:scale-[0.98] cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menerbitkan Lowongan...
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    Tayangkan Lowongan Sekarang
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>

      <Footer />
    </div>
  );
}
