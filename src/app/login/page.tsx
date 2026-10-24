'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAlumni } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { LogIn, AlertCircle, Loader2, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function getSafeRedirect(target: string | null, fallback = '/lowongan'): string {
  if (!target) return fallback;
  const trimmed = target.trim();
  // Validasi agar hanya menerima relative internal path, tolak protokol eksternal atau format //
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/\\') &&
    !trimmed.includes('://') &&
    !trimmed.includes('\\')
  ) {
    return trimmed;
  }
  return fallback;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = getSafeRedirect(searchParams.get('redirect'));

  const { user, profile, logout } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError('Mohon isi email / nomor alumni dan kata sandi.');
      return;
    }

    setLoading(true);

    try {
      await loginAlumni(identifier, password);
      router.push(redirectTarget);
    } catch (err: unknown) {
      console.error('Login error:', err);
      const e = err as Error;
      setError(e.message || 'Gagal masuk. Periksa email/nomor alumni dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 py-12 sm:py-16">
        <div className="w-full max-w-md bg-white border border-slate-200/90 p-8 sm:p-9 rounded-3xl shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 p-2 flex items-center justify-center mx-auto shadow-2xs mb-3">
              <img 
                src="/logo_stmm.png" 
                alt="STMM MMTC" 
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Masuk Portal Alumni</h1>
            <p className="text-xs text-slate-500">
              Gunakan Email atau Nomor Alumni MMTC yang sudah terdaftar
            </p>
          </div>

          {user && (
            <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-800 space-y-2">
              <p>
                Anda saat ini sudah masuk sebagai <strong>{profile?.namaLengkap || user.email}</strong>.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <Link
                  href={redirectTarget}
                  className="px-3.5 py-1.5 rounded-xl bg-[#0284c7] text-white font-bold hover:bg-[#0369a1] transition shadow-2xs"
                >
                  Lanjutkan ke Dashboard
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-xs text-red-600 hover:underline font-semibold"
                >
                  Ganti Akun (Keluar)
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email atau Nomor Alumni
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="nama@email.com atau MMTC-2020-103"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Kata Sandi
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm shadow-xs transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses Masuk...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Masuk ke Portal
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
            Belum punya akun alumni?{' '}
            <Link href="/register" className="text-[#0284c7] font-bold hover:underline">
              Daftar Alumni di sini
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <Loader2 className="w-6 h-6 animate-spin text-[#0284c7]" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
