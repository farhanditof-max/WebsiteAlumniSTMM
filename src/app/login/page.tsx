'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAlumni } from '@/lib/auth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
          <div className="text-center mb-6 space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Masuk Portal Alumni</h1>
            <p className="text-xs text-slate-500">
              Gunakan Email atau Nomor Alumni MMTC yang sudah terdaftar
            </p>
          </div>

          {user && (
            <div className="mb-5 p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 space-y-2">
              <p>
                Anda sudah masuk sebagai <strong>{profile?.namaLengkap || user.email}</strong>.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <Link
                  href={redirectTarget}
                  className="px-3 py-1.5 rounded-lg bg-[#0284c7] text-white font-medium hover:bg-[#0369a1] transition"
                >
                  Lanjutkan
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-xs text-red-600 hover:underline"
                >
                  Ganti Akun (Keluar)
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
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
              className="w-full py-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-sm shadow-xs transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Masuk ke Akun
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Belum punya akun alumni?{' '}
            <Link href="/register" className="text-[#0284c7] font-semibold hover:underline">
              Daftar di sini
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
