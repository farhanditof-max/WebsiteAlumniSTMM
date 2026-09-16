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
  CheckCircle2
} from 'lucide-react';

export default function PostLowonganPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();

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
    if (!user) {
      setError('Anda harus masuk terlebih dahulu untuk mempublikasikan lowongan.');
      return;
    }

    if (!judul.trim() || !perusahaan.trim() || !lokasi.trim() || !deskripsi.trim()) {
      setError('Mohon lengkapi semua kolom wajib.');
      return;
    }

    setLoading(true);
    setError('');

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

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold">Harap Masuk Terlebih Dahulu</h2>
            <p className="text-xs text-slate-500">Hanya alumni MMTC yang dapat mempublikasikan lowongan kerja.</p>
            <Link 
              href="/login?redirect=/post-lowongan" 
              className="inline-block px-5 py-2.5 rounded-xl bg-[#0284c7] text-white text-xs font-semibold hover:bg-[#0369a1] transition shadow-xs"
            >
              Masuk ke Akun
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Pasang Lowongan Kerja Alumni</h1>
          <p className="text-slate-600 text-xs sm:text-sm">
            Bantu sesama alumni dan adik tingkat MMTC mendapatkan kesempatan berkarya di perusahaan atau studio kreatifmu.
          </p>
        </div>

        {success ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3 shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">Lowongan Berhasil Ditayangkan!</h3>
            <p className="text-xs text-slate-500">Mengarahkan ke daftar lowongan...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Judul Posisi / Pekerjaan *
                </label>
                <input
                  type="text"
                  required
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="e.g. 3D Animator, Video Editor, Unity Developer"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nama Perusahaan / Studio *
                </label>
                <input
                  type="text"
                  required
                  value={perusahaan}
                  onChange={(e) => setPerusahaan(e.target.value)}
                  placeholder="e.g. Infinite Studios, Trans TV, Gameloft"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Lokasi Kerja *
                </label>
                <input
                  type="text"
                  required
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  placeholder="e.g. Jakarta Selatan / Remote"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tipe Pekerjaan *
                </label>
                <select
                  value={tipeKerja}
                  onChange={(e) => setTipeKerja(e.target.value as 'Full-time' | 'Part-time' | 'Freelance' | 'Magang')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Magang">Magang / Internship</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Perkiraan Gaji (Opsional)
                </label>
                <input
                  type="text"
                  value={gajiRange}
                  onChange={(e) => setGajiRange(e.target.value)}
                  onBlur={handleGajiBlur}
                  placeholder="e.g. 7.500.000 atau 5jt - 8jt"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition font-semibold text-emerald-600"
                />
              </div>
            </div>

            {/* BATAS WAKTU LAMARAN (DEADLINE) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Batas Waktu Lamaran / Deadline (Opsional)
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full sm:w-1/2 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
              />
            </div>

            {/* PILIH JURUSAN TARGET */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Target Program Studi Alumni (Bisa pilih lebih dari satu) *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {PRODI_LIST.map((p) => {
                  const isChecked = selectedProdi.includes(p.id);
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => toggleProdi(p.id)}
                      className={`p-3 rounded-xl border text-left text-xs transition ${
                        isChecked 
                          ? 'bg-sky-50 border-[#0284c7] text-[#0284c7] font-semibold' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className="block font-bold">{p.label}</span>
                      <span className="text-[10px] text-slate-500 line-clamp-1">{p.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Deskripsi Pekerjaan & Tanggung Jawab *
              </label>
              <textarea
                rows={5}
                required
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Jelaskan mengenai proyek, peran yang dicari, dan workflow kerja..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kualifikasi & Persyaratan (Satu per baris)
              </label>
              <textarea
                rows={3}
                value={kualifikasiRaw}
                onChange={(e) => setKualifikasiRaw(e.target.value)}
                placeholder="Menguasai Blender / Maya&#10;Memiliki showreel animasi 3D&#10;Dapat bekerja dalam tim studio"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-sm font-semibold shadow-sm transition flex items-center gap-2 disabled:opacity-50"
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
