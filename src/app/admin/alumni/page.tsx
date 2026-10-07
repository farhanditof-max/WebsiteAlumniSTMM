'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { 
  getAllAlumniRegistry, 
  addAlumniToRegistry, 
  deleteAlumniFromRegistry, 
  seedAlumniRegistry 
} from '@/lib/auth';
import { PRODI_LIST, ProdiType, AlumniRegistryItem } from '@/types';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Search, 
  RefreshCw, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Database,
  ArrowLeft,
  X,
  Plus
} from 'lucide-react';

export default function AdminAlumniRegistryPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [alumniList, setAlumniList] = useState<AlumniRegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProdi, setSelectedProdi] = useState<string>('ALL');
  
  // Modal / Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [nomorAlumni, setNomorAlumni] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [prodi, setProdi] = useState<ProdiType>('Animasi');
  const [angkatan, setAngkatan] = useState('2024');
  const [submitting, setSubmitting] = useState(false);

  // Status notifications
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [activatingAdmin, setActivatingAdmin] = useState(false);

  const fetchRegistry = async () => {
    setLoading(true);
    try {
      const data = await getAllAlumniRegistry();
      setAlumniList(data);
    } catch (err) {
      console.error('Failed to load alumni registry:', err);
      setStatusMsg({ type: 'error', text: 'Gagal memuat master data alumni dari database.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await getAllAlumniRegistry();
        if (isMounted) {
          setAlumniList(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load alumni registry:', err);
        if (isMounted) {
          setStatusMsg({ type: 'error', text: 'Gagal memuat master data alumni dari database.' });
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleNomorChange = (val: string) => {
    setNomorAlumni(val);
    const clean = val.trim().toUpperCase();
    const parts = clean.split('-');
    if (parts.length >= 2 && /^\d{4}$/.test(parts[1])) {
      setAngkatan(parts[1]);
    }
  };

  const handleAddAlumni = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomorAlumni.trim() || !namaLengkap.trim()) {
      setStatusMsg({ type: 'error', text: 'Nomor Alumni dan Nama Lengkap wajib diisi.' });
      return;
    }

    setSubmitting(true);
    setStatusMsg(null);

    try {
      await addAlumniToRegistry({
        nomorAlumni: nomorAlumni.trim(),
        namaLengkap: namaLengkap.trim(),
        prodi,
        angkatan: angkatan.trim()
      });

      setStatusMsg({ 
        type: 'success', 
        text: `Data alumni "${namaLengkap}" (${nomorAlumni.trim()}) berhasil ditambahkan ke database master.` 
      });
      setShowAddModal(false);
      setNomorAlumni('');
      setNamaLengkap('');
      await fetchRegistry();
    } catch (err: unknown) {
      const e = err as Error;
      setStatusMsg({ type: 'error', text: e.message || 'Gagal menambahkan alumni ke registry.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noAlumni: string, nama: string) => {
    if (!confirm(`Hapus data alumni "${nama}" (${noAlumni}) dari database resmi? Alumni ini tidak akan bisa mendaftar akun web lagi.`)) {
      return;
    }

    try {
      await deleteAlumniFromRegistry(noAlumni);
      setStatusMsg({ type: 'success', text: `Data alumni "${noAlumni}" berhasil dihapus.` });
      setAlumniList(prev => prev.filter(a => a.nomorAlumni !== noAlumni));
    } catch (err: unknown) {
      const e = err as Error;
      setStatusMsg({ type: 'error', text: e.message || 'Gagal menghapus data alumni.' });
    }
  };

  const handleSeed = async () => {
    if (!confirm('Inisialisasi database master dengan 12 data dummy awal STMM MMTC?')) return;
    setSeeding(true);
    setStatusMsg(null);
    try {
      const count = await seedAlumniRegistry();
      setStatusMsg({ type: 'success', text: `Berhasil menyimpan ${count} data alumni resmi ke Firestore alumni_registry.` });
      await fetchRegistry();
    } catch (err: unknown) {
      const e = err as Error;
      setStatusMsg({ type: 'error', text: e.message || 'Gagal melakukan seeding data.' });
    } finally {
      setSeeding(false);
    }
  };

  const handleActivateSelfAdmin = async () => {
    if (!user) return;
    setActivatingAdmin(true);
    try {
      await setDoc(doc(db, 'users', user.uid), { role: 'admin' }, { merge: true });
      await refreshProfile();
      setStatusMsg({ type: 'success', text: 'Selamat! Akun Anda berhasil diangkat sebagai Administrator Portal STMM MMTC.' });
    } catch (err: unknown) {
      const e = err as Error;
      setStatusMsg({ type: 'error', text: e.message || 'Gagal mengaktifkan role admin.' });
    } finally {
      setActivatingAdmin(false);
    }
  };

  const filteredList = alumniList.filter(item => {
    const matchesProdi = selectedProdi === 'ALL' || item.prodi === selectedProdi;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q || 
      item.nomorAlumni.toLowerCase().includes(q) ||
      item.namaLengkap.toLowerCase().includes(q) ||
      item.angkatan.includes(q);
    return matchesProdi && matchesSearch;
  });

  const registeredCount = alumniList.filter(a => a.isRegistered).length;
  const unclaimedCount = alumniList.length - registeredCount;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* TOP BREADCRUMB & HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0284c7] transition mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Beranda
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin Portal — Master Data Alumni</h1>
                <p className="text-xs text-slate-500">Basis data resmi alumni STMM MMTC untuk verifikasi pendaftaran akun baru.</p>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSeed}
              disabled={seeding}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition disabled:opacity-50 cursor-pointer"
              title="Masukkan 12 data dummy ke Firestore jika koleksi masih kosong"
            >
              {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5 text-purple-600" />}
              Seed 12 Data Awal
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Alumni Baru
            </button>
          </div>
        </div>

        {/* ADMIN ROLE STATUS NOTICE */}
        {user && profile?.role !== 'admin' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="font-semibold">Akun Anda saat ini belum berstatus Administrator.</p>
                <p className="text-amber-700 text-[11px]">Sebagai pengembang atau pemilik sistem, Anda dapat mengaktifkan status admin akun Anda secara instan.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleActivateSelfAdmin}
              disabled={activatingAdmin}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition inline-flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
            >
              {activatingAdmin ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              Aktifkan Role Admin Akun Ini
            </button>
          </div>
        )}

        {/* STATUS MESSAGES */}
        {statusMsg && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs flex items-center gap-2 border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* METRICS STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Master Data</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{alumniList.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">Data resmi terdaftar di database</p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Sudah Buat Akun Web</p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">{registeredCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Alumni aktif yang sudah registrasi</p>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Belum Registrasi</p>
            <p className="text-2xl font-extrabold text-amber-700 mt-1">{unclaimedCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Nomor resmi siap diklaim pendaftar</p>
          </div>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 mb-6 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor alumni, nama, angkatan..."
              className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-500 font-medium shrink-0">Prodi:</span>
            <select
              value={selectedProdi}
              onChange={(e) => setSelectedProdi(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-purple-600"
            >
              <option value="ALL">Semua Program Studi</option>
              {PRODI_LIST.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchRegistry}
              disabled={loading}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title="Segarkan data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* MASTER DATA TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-purple-600" />
              <p className="text-xs">Memuat master data alumni dari database...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Database className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">Tidak ada data alumni yang cocok dengan pencarian.</p>
              <p className="text-[11px] text-slate-400">Coba kata kunci lain atau tambahkan alumni baru.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">No.</th>
                    <th className="py-3 px-4">Nomor Alumni</th>
                    <th className="py-3 px-4">Nama Lengkap Resmi</th>
                    <th className="py-3 px-4">Program Studi</th>
                    <th className="py-3 px-4">Angkatan</th>
                    <th className="py-3 px-4">Status Akun Web</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((alumni, idx) => (
                    <tr key={alumni.nomorAlumni} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {alumni.nomorAlumni}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {alumni.namaLengkap}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-sky-50 text-[#0284c7] font-semibold text-[10px] border border-sky-100">
                          {alumni.prodi}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{alumni.angkatan}</td>
                      <td className="py-3.5 px-4">
                        {alumni.isRegistered ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Sudah Terdaftar
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                            Belum Klaim Akun
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(alumni.nomorAlumni, alumni.namaLengkap)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Hapus data alumni ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODAL TAMBAH ALUMNI BARU */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tambah Data Alumni Baru</h3>
                  <p className="text-[11px] text-slate-400">Masukkan nomor dan nama resmi mahasiswa/alumni STMM.</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAlumni} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Alumni <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nomorAlumni}
                  onChange={(e) => handleNomorChange(e.target.value)}
                  placeholder="Contoh: MMTC-2024-105 atau STMM-2023-010"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 font-mono uppercase focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">Format standar: MMTC-YYYY-XXX atau STMM-YYYY-XXX</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Resmi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  placeholder="Contoh: Muhammad Farhan Dito"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                />
                <p className="text-[10px] text-slate-400 mt-1">Pendaftar wajib mengetik nama ini secara cocok agar bisa register.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Program Studi <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={prodi}
                    onChange={(e) => setProdi(e.target.value as ProdiType)}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                  >
                    {PRODI_LIST.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun Angkatan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={angkatan}
                    onChange={(e) => setAngkatan(e.target.value)}
                    placeholder="2024"
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      Simpan ke Database
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
