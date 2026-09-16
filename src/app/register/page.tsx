'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerAlumni, VERIFIED_ALUMNI_LIST, getRegisteredNomorAlumni } from '@/lib/auth';
import { PRODI_LIST, ProdiType } from '@/types';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { UserPlus, AlertCircle, Loader2, Info, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { user, profile, setProfileData, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomorAlumni, setNomorAlumni] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [prodi, setProdi] = useState<ProdiType>('Animasi');
  const [angkatan, setAngkatan] = useState('2020');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [registeredNumbers, setRegisteredNumbers] = useState<string[]>(['MMTC-2018-001']);

  useEffect(() => {
    async function loadRegisteredNumbers() {
      const list = await getRegisteredNomorAlumni();
      setRegisteredNumbers(list);
    }
    loadRegisteredNumbers();
  }, []);

  // Auto-fill jika user memilih nomor alumni dari whitelist
  const handleNomorAlumniChange = (value: string) => {
    setNomorAlumni(value);
    const clean = value.trim().replace(/[/._]/g, '-').toUpperCase();
    const found = VERIFIED_ALUMNI_LIST.find(
      (a) => a.nomorAlumni.toUpperCase() === clean
    );
    if (found) {
      if (found.nama) setNamaLengkap(found.nama);
      if (found.prodi) setProdi(found.prodi as ProdiType);
    }
    // Auto infer angkatan dari nomor MMTC-YYYY-XXX
    const parts = clean.split('-');
    if (parts.length >= 2 && /^\d{4}$/.test(parts[1])) {
      setAngkatan(parts[1]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !password || !nomorAlumni.trim() || !namaLengkap.trim()) {
      setError('Mohon lengkapi semua kolom yang wajib diisi.');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal harus terdiri dari 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      const newProfile = await registerAlumni({
        email: email.trim(),
        password,
        nomorAlumni: nomorAlumni.trim(),
        namaLengkap: namaLengkap.trim(),
        prodi,
        angkatan: angkatan.trim()
      });
      
      setProfileData(newProfile);
      setSuccessMsg('Pendaftaran berhasil! Mengarahkan ke halaman Lowongan Kerja...');
      setTimeout(() => {
        router.push('/lowongan');
      }, 1200);
    } catch (err: unknown) {
      console.error('Registration failed:', err);
      const e = err as Error;
      setError(e.message || 'Gagal mendaftar. Pastikan nomor alumni valid dan email belum pernah dipakai.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-lg bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
          <div className="text-center mb-6 space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Pendaftaran Alumni MMTC</h1>
            <p className="text-xs text-slate-500">
              Registrasi resmi menggunakan Nomor Alumni terdaftar kampus STMM MMTC Yogyakarta
            </p>
          </div>

          {user && (
            <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>Anda saat ini masuk sebagai <strong>{profile?.namaLengkap || user.email}</strong>.</span>
              <div className="flex items-center gap-2 shrink-0">
                <Link href="/lowongan" className="font-semibold underline">
                  Ke Dashboard
                </Link>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-red-600 hover:underline font-semibold"
                >
                  Keluar Terlebih Dahulu
                </button>
              </div>
            </div>
          )}

          {/* HINT MVP NOMOR ALUMNI */}
          <div className="mb-5 p-3.5 rounded-xl bg-sky-50 border border-sky-100 text-xs text-[#0284c7]">
            <div className="flex items-center gap-1.5 font-semibold mb-1.5">
              <Info className="w-4 h-4 text-[#0284c7] shrink-0" />
              <span>Pilih / Klik Nomor Alumni Terverifikasi (Database MVP):</span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {VERIFIED_ALUMNI_LIST.map((item) => {
                const cleanItemNo = item.nomorAlumni.toUpperCase();
                const isSelected = nomorAlumni.toUpperCase() === cleanItemNo;
                const isTaken = item.status === 'terdaftar' || registeredNumbers.includes(cleanItemNo);
                return (
                  <button
                    type="button"
                    key={item.nomorAlumni}
                    disabled={isTaken}
                    onClick={() => handleNomorAlumniChange(item.nomorAlumni)}
                    className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                      isSelected
                        ? 'bg-[#0284c7] text-white border-[#0284c7] font-bold shadow-xs'
                        : isTaken
                        ? 'bg-slate-100 text-slate-400 border-slate-200 line-through cursor-not-allowed opacity-60'
                        : 'bg-white hover:bg-sky-100/70 border-sky-200 text-sky-900'
                    }`}
                    title={isTaken ? `${item.nomorAlumni} (${item.nama}) - Sudah terdaftar` : `Gunakan ${item.nomorAlumni}`}
                  >
                    <span>{item.nomorAlumni}</span>
                    <span className="text-[10px] opacity-80">({item.nama})</span>
                    {isTaken && <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded no-underline">Terpakai</span>}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              * Tips: Anda juga bisa mengetik nomor alumni kustom dengan format <span className="font-mono font-medium">MMTC-YYYY-XXX</span> (contoh: MMTC-2023-555).
            </p>
          </div>

          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nomor Alumni *
                </label>
                <input
                  type="text"
                  required
                  value={nomorAlumni}
                  onChange={(e) => handleNomorAlumniChange(e.target.value)}
                  placeholder="MMTC-2020-103"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tahun Angkatan *
                </label>
                <input
                  type="text"
                  required
                  value={angkatan}
                  onChange={(e) => setAngkatan(e.target.value)}
                  placeholder="2020"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Lengkap *
              </label>
              <input
                type="text"
                required
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                placeholder="Budi Santoso"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Program Studi *
              </label>
              <select
                value={prodi}
                onChange={(e) => setProdi(e.target.value as ProdiType)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
              >
                {PRODI_LIST.map((p) => (
                  <option key={p.id} value={p.id} className="text-slate-900">
                    {p.label} - {p.desc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Aktif *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password (min 6 karakter) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-sm shadow-xs transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mendaftarkan Akun...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Daftar Sekarang
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Sudah terdaftar sebelumnya?{' '}
            <Link href="/login" className="text-[#0284c7] font-semibold hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
