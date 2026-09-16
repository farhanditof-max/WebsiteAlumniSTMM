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
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle
} from 'lucide-react';

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <CheckCircle className="w-3.5 h-3.5" /> Diterima
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5" /> Ditolak
          </span>
        );
      case 'reviewed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
            <Eye className="w-3.5 h-3.5" /> Sedang Ditinjau
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 border border-sky-100 text-[#0284c7] text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" /> Menunggu Respon
          </span>
        );
    }
  };

  if (authLoading || (user && loading)) {
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">Manajemen Lamaran Kerja</h1>
          <p className="text-slate-600 text-xs sm:text-sm">
            Pantau status lamaran yang kamu kirimkan dan kelola lamaran yang masuk dari lowongan yang kamu pasang.
          </p>
        </div>

        {statusMsg && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs flex items-center gap-2 border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* TABS */}
        <div className="flex border-b border-slate-200 mb-8">
          <button
            onClick={() => setActiveTab('sent')}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'sent'
                ? 'border-[#0284c7] text-[#0284c7]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            Lamaran Saya Dikirim ({sentApps.length})
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'received'
                ? 'border-[#0284c7] text-[#0284c7]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Pelamar yang Masuk ({receivedApps.length})
          </button>
        </div>

        {/* TAB SENT */}
        {activeTab === 'sent' && (
          <div className="space-y-4">
            {sentApps.length === 0 ? (
              <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl p-8 space-y-2">
                <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">Belum Ada Lamaran Terkirim</h3>
                <p className="text-xs text-slate-500">Kamu belum pernah melamar pekerjaan apapun di portal alumni.</p>
                <Link
                  href="/lowongan"
                  className="inline-block mt-2 px-4 py-2 rounded-xl bg-[#0284c7] text-white text-xs font-semibold hover:bg-[#0369a1] transition"
                >
                  Jelajahi Lowongan Kerja
                </Link>
              </div>
            ) : (
              sentApps.map((app) => (
                <div key={app.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{app.jobTitle}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Dikirim pada: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}
                      </p>
                    </div>
                    <div>{getStatusBadge(app.status)}</div>
                  </div>
                  <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-500 block mb-1">Catatan Cover Letter:</span>
                    <p className="leading-relaxed">{app.pesan}</p>
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
              <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl p-8 space-y-2">
                <Inbox className="w-8 h-8 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">Belum Ada Pelamar Masuk</h3>
                <p className="text-xs text-slate-500">Belum ada alumni yang melamar ke lowongan yang kamu terbitkan.</p>
                <Link
                  href="/post-lowongan"
                  className="inline-block mt-2 px-4 py-2 rounded-xl bg-[#0284c7] text-white text-xs font-semibold hover:bg-[#0369a1] transition"
                >
                  Pasang Lowongan Baru
                </Link>
              </div>
            ) : (
              receivedApps.map((app) => (
                <div key={app.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900">{app.applicantName}</h4>
                        <Link
                          href={`/profil/${app.applicantUid}`}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-sky-50 hover:bg-sky-100 border border-sky-200 text-[#0284c7] font-semibold inline-flex items-center gap-1 transition"
                        >
                          Lihat Profil & Showreel <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                      <p className="text-xs text-[#0284c7] font-semibold mt-0.5">
                        Prodi: {app.applicantProdi} • Lowongan: {app.jobTitle}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Melamar pada: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '-'}
                      </p>
                    </div>
                    <div>{getStatusBadge(app.status)}</div>
                  </div>

                  <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-500 block mb-1">Pesan dari Pelamar:</span>
                    <p className="leading-relaxed">{app.pesan}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 text-xs">
                    <div className="flex flex-wrap items-center gap-4 text-slate-600">
                      <span>Email: <strong className="text-slate-800">{app.applicantEmail}</strong></span>
                      {app.applicantPhone && (
                        <a 
                          href={formatWhatsAppUrl(app.applicantPhone)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                        >
                          WhatsApp ({app.applicantPhone}) <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {app.cvUrl && (
                        <a 
                          href={app.cvUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[#0284c7] hover:underline flex items-center gap-1 font-semibold"
                        >
                          Buka CV PDF <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {app.cvExternalLink && (
                        <a 
                          href={ensureAbsoluteUrl(app.cvExternalLink)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-[#0284c7] hover:underline flex items-center gap-1 font-semibold"
                        >
                          Portofolio Eksternal <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {/* ACTION BUTTONS FOR JOB POSTER */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">Ubah Status:</span>
                      {updatingId === app.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#0284c7]" />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={app.status === 'reviewed'}
                            onClick={() => handleStatusChange(app.id, 'reviewed')}
                            className="px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 text-[11px] font-semibold transition disabled:opacity-40"
                          >
                            Tinjau
                          </button>
                          <button
                            type="button"
                            disabled={app.status === 'accepted'}
                            onClick={() => handleStatusChange(app.id, 'accepted')}
                            className="px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold transition disabled:opacity-40"
                          >
                            Terima
                          </button>
                          <button
                            type="button"
                            disabled={app.status === 'rejected'}
                            onClick={() => handleStatusChange(app.id, 'rejected')}
                            className="px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-[11px] font-semibold transition disabled:opacity-40"
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
