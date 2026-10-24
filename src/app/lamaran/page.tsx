'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { getMyApplications, getReceivedApplications, updateApplicationStatus } from '@/lib/jobs';
import { JobApplication } from '@/types';
import { formatWhatsAppUrl, ensureAbsoluteUrl } from '@/lib/media';
import { 
  FileText, 
  Inbox, 
  Send, 
  Loader2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  Calendar
} from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';

export default function LamaranPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [sentApps, setSentApps] = useState<JobApplication[]>([]);
  const [receivedApps, setReceivedApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [sent, received] = await Promise.all([
          getMyApplications(user.uid),
          getReceivedApplications(user.uid)
        ]);
        setSentApps(sent);
        setReceivedApps(received);
      } catch (err) {
        console.error('Failed to load applications:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadData();
    }
  }, [user, authLoading]);

  const handleStatusChange = async (appId: string, newStatus: 'pending' | 'reviewed' | 'accepted' | 'rejected') => {
    setUpdatingId(appId);
    setStatusMsg(null);
    try {
      await updateApplicationStatus(appId, newStatus);
      setReceivedApps((prev) =>
        prev.map((item) => (item.id === appId ? { ...item, status: newStatus } : item))
      );
      const statusLabels: Record<string, string> = {
        pending: 'Menunggu Respon',
        reviewed: 'Sedang Ditinjau',
        accepted: 'Diterima',
        rejected: 'Ditolak'
      };
      setStatusMsg({ type: 'success', text: `Status lamaran berhasil diubah menjadi "${statusLabels[newStatus] || newStatus}".` });
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: unknown) {
      const e = err as Error;
      setStatusMsg({ type: 'error', text: e.message || 'Gagal memperbarui status lamaran.' });
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
        <Navbar />
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0284c7]" />
          <p className="text-xs text-slate-500 font-medium">Memuat data pelamar &amp; lamaran...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <FileText className="w-10 h-10 text-slate-400 mx-auto" />
            <h2 className="text-xl font-bold text-slate-900">Harap Masuk Terlebih Dahulu</h2>
            <p className="text-xs text-slate-500">
              Silakan masuk dengan akun alumni MMTC untuk melihat riwayat lamaran yang Anda kirim dan pelamar yang masuk.
            </p>
            <Link
              href="/login?redirect=/lamaran"
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0284c7] text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            Dashboard Karir
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Manajemen Lamaran Kerja
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm">
            Pantau status lamaran yang kamu kirimkan dan review pelamar yang masuk dari lowongan yang kamu pasang.
          </p>
        </div>

        {statusMsg && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs flex items-center gap-2.5 border animate-fade-in ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-medium">{statusMsg.text}</span>
          </div>
        )}

        {/* MODERN TABS */}
        <div className="flex border-b border-slate-200 mb-8 gap-4">
          <button
            onClick={() => setActiveTab('sent')}
            className={`pb-3.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'sent'
                ? 'border-[#0284c7] text-[#0284c7]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Lamaran Terkirim</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-semibold">
              {sentApps.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`pb-3.5 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'received'
                ? 'border-[#0284c7] text-[#0284c7]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Pelamar Masuk</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-50 text-[#0284c7] border border-sky-100 font-bold">
              {receivedApps.length}
            </span>
          </button>
        </div>

        {/* TAB SENT */}
        {activeTab === 'sent' && (
          <div className="space-y-4">
            {sentApps.length === 0 ? (
              <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl p-8 space-y-3">
                <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">Belum Ada Lamaran Terkirim</h3>
                <p className="text-xs text-slate-500">Kamu belum pernah melamar pekerjaan apapun di portal alumni.</p>
                <Link
                  href="/lowongan"
                  className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-[#0284c7] text-white text-xs font-bold hover:bg-[#0369a1] transition shadow-xs"
                >
                  Jelajahi Lowongan Kerja
                </Link>
              </div>
            ) : (
              sentApps.map((app) => (
                <div key={app.id} className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4 hover:border-slate-300 transition">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900">{app.jobTitle}</h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Dikirim pada: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}
                      </p>
                    </div>
                    <div>
                      <StatusBadge status={app.status} />
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 bg-slate-50/90 p-4 rounded-xl border border-slate-200/70 space-y-1">
                    <span className="font-bold text-slate-600 block">Pesan Cover Letter:</span>
                    <p className="leading-relaxed whitespace-pre-line text-slate-700">{app.pesan}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB RECEIVED */}
        {activeTab === 'received' && (
          <div className="space-y-4">
            {receivedApps.length === 0 ? (
              <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl p-8 space-y-3">
                <Inbox className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">Belum Ada Pelamar Masuk</h3>
                <p className="text-xs text-slate-500">Belum ada alumni yang melamar ke lowongan yang kamu terbitkan.</p>
                <Link
                  href="/post-lowongan"
                  className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-[#0284c7] text-white text-xs font-bold hover:bg-[#0369a1] transition shadow-xs"
                >
                  Pasang Lowongan Baru
                </Link>
              </div>
            ) : (
              receivedApps.map((app) => (
                <div key={app.id} className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4 hover:border-slate-300 transition">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-[#0284c7]" />
                          {app.applicantName}
                        </h4>
                        <Link
                          href={`/profil/${app.applicantUid}`}
                          target="_blank"
                          className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0284c7] font-semibold inline-flex items-center gap-1 transition"
                        >
                          Lihat Profil &amp; Showreel <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                      <p className="text-xs text-[#0284c7] font-semibold mt-1">
                        Prodi: {app.applicantProdi} • Melamar untuk: <strong className="text-slate-800">{app.jobTitle}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tanggal: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}
                      </p>
                    </div>
                    <div>
                      <StatusBadge status={app.status} />
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 bg-slate-50/90 p-4 rounded-xl border border-slate-200/70 space-y-1">
                    <span className="font-bold text-slate-600 block">Pesan dari Pelamar:</span>
                    <p className="leading-relaxed whitespace-pre-line text-slate-700">{app.pesan}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex flex-wrap items-center gap-4 text-slate-600">
                      <span>Email: <strong className="text-slate-900">{app.applicantEmail}</strong></span>
                      {app.applicantPhone && (
                        <a 
                          href={formatWhatsAppUrl(app.applicantPhone)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-emerald-700 hover:underline flex items-center gap-1.5 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          Hubungi WhatsApp ({app.applicantPhone}) <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {app.cvUrl && (
                        <a 
                          href={app.cvUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[#0284c7] hover:underline flex items-center gap-1 font-bold bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Buka CV PDF <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {app.cvExternalLink && (
                        <a 
                          href={ensureAbsoluteUrl(app.cvExternalLink)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-slate-700 hover:text-[#0284c7] hover:underline flex items-center gap-1 font-semibold"
                        >
                          Portofolio Eksternal <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      )}
                    </div>

                    {/* ACTION BUTTONS FOR JOB POSTER */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-semibold">Tindakan:</span>
                      {updatingId === app.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#0284c7]" />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={app.status === 'reviewed'}
                            onClick={() => handleStatusChange(app.id, 'reviewed')}
                            className="px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 text-[11px] font-bold transition disabled:opacity-40 cursor-pointer"
                          >
                            Tinjau
                          </button>
                          <button
                            type="button"
                            disabled={app.status === 'accepted'}
                            onClick={() => handleStatusChange(app.id, 'accepted')}
                            className="px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-[11px] font-bold transition disabled:opacity-40 cursor-pointer"
                          >
                            Terima
                          </button>
                          <button
                            type="button"
                            disabled={app.status === 'rejected'}
                            onClick={() => handleStatusChange(app.id, 'rejected')}
                            className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 text-red-800 hover:bg-red-100 text-[11px] font-bold transition disabled:opacity-40 cursor-pointer"
                          >
                            Tolak
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
