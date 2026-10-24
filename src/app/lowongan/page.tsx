'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getJobs, applyJob, getMyApplications } from '@/lib/jobs';
import { useAuth } from '@/context/AuthContext';
import { JobPosting, PRODI_LIST, ProdiType } from '@/types';
import { 
  Briefcase, 
  MapPin, 
  Search, 
  Filter, 
  CheckCircle2, 
  Send, 
  Building2, 
  AlertCircle,
  Loader2,
  X,
  UserCheck,
  Calendar,
  DollarSign
} from 'lucide-react';
import { JobCardSkeleton } from '@/components/ui/Skeleton';
import { ProdiBadge } from '@/components/ui/Badge';

function LowonganContent() {
  const searchParams = useSearchParams();
  const initialProdi = searchParams.get('prodi') as ProdiType | null;

  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProdi, setSelectedProdi] = useState<string>(initialProdi || 'ALL');
  const [selectedTipeKerja, setSelectedTipeKerja] = useState<string>('ALL');
  const [onlyWithSalary, setOnlyWithSalary] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [nowTimestamp] = useState(() => Date.now());
  
  // Apply Modal State
  const [applyingJob, setApplyingJob] = useState<JobPosting | null>(null);
  const [coverNote, setCoverNote] = useState('');
  const [customCvLink, setCustomCvLink] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState('');

  // Sync selectedProdi when URL searchParams changes
  const prodiParam = searchParams.get('prodi');
  const [prevProdiParam, setPrevProdiParam] = useState<string | null>(prodiParam);

  if (prodiParam !== prevProdiParam) {
    setPrevProdiParam(prodiParam);
    setSelectedProdi(prodiParam && PRODI_LIST.some(p => p.id === prodiParam) ? prodiParam : 'ALL');
  }

  // Load jobs already applied by current user
  useEffect(() => {
    if (!user) return;
    const currentUid = user.uid;
    let isMounted = true;
    async function loadMyApplications() {
      try {
        const myApps = await getMyApplications(currentUid);
        if (isMounted) {
          setAppliedJobIds(new Set(myApps.map(a => a.jobId)));
        }
      } catch (e) {
        console.warn('Could not load user applied jobs:', e);
      }
    }
    loadMyApplications();
    return () => { isMounted = false; };
  }, [user]);

  useEffect(() => {
    let ignore = false;
    async function fetchJobs() {
      try {
        const filter = selectedProdi !== 'ALL' ? (selectedProdi as ProdiType) : undefined;
        const data = await getJobs(filter);
        if (!ignore) {
          setJobs(data);
        }
      } catch (err) {
        console.error('Error in fetchJobs:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchJobs();
    return () => {
      ignore = true;
    };
  }, [selectedProdi]);

  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      !q ||
      job.judul.toLowerCase().includes(q) ||
      job.perusahaan.toLowerCase().includes(q) ||
      job.lokasi.toLowerCase().includes(q) ||
      job.prodiTarget?.some(p => p.toLowerCase().includes(q));

    const matchesTipe = selectedTipeKerja === 'ALL' || job.tipeKerja === selectedTipeKerja;
    const matchesSalary = !onlyWithSalary || Boolean(job.gajiRange && job.gajiRange.trim().length > 0);

    return matchesSearch && matchesTipe && matchesSalary;
  });

  const handleOpenApplyModal = (job: JobPosting) => {
    if (job.deadline && !isNaN(Date.parse(job.deadline)) && new Date(job.deadline).setHours(23, 59, 59, 999) < nowTimestamp) {
      return;
    }
    setApplyingJob(job);
    setApplyError('');
    setApplySuccess(false);
    setCoverNote('');
    setCustomCvLink(profile?.cvExternalLink || '');
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !applyingJob) return;

    if (applyingJob.deadline && !isNaN(Date.parse(applyingJob.deadline)) && new Date(applyingJob.deadline).setHours(23, 59, 59, 999) < Date.now()) {
      setApplyError('Batas waktu pendaftaran lowongan ini telah berakhir.');
      return;
    }

    if (applyingJob.postedBy === user.uid) {
      setApplyError('Anda tidak dapat melamar ke lowongan yang Anda terbitkan sendiri.');
      return;
    }

    if (!coverNote.trim()) {
      setApplyError('Mohon tuliskan pesan cover letter singkat.');
      return;
    }

    setApplyLoading(true);
    setApplyError('');
    try {
      const applicantName = profile?.namaLengkap || user.displayName || user.email?.split('@')[0] || 'Alumni MMTC';
      const applicantEmail = profile?.email || user.email || '';
      const applicantProdi = profile?.prodi || 'Animasi';

      await applyJob({
        jobId: applyingJob.id,
        jobTitle: applyingJob.judul,
        applicantUid: user.uid,
        applicantName,
        applicantEmail,
        applicantProdi,
        applicantPhone: profile?.phone,
        posterUid: applyingJob.postedBy,
        pesan: coverNote.trim(),
        cvUrl: profile?.cvFileUrl,
        cvExternalLink: customCvLink.trim() || profile?.cvExternalLink
      });
      setAppliedJobIds((prev) => new Set([...prev, applyingJob.id]));
      setApplySuccess(true);
      setTimeout(() => {
        setApplyingJob(null);
        setApplySuccess(false);
        setCoverNote('');
        setCustomCvLink('');
      }, 2000);
    } catch (err: unknown) {
      const errorObj = err as Error;
      setApplyError(errorObj.message || 'Gagal mengirim lamaran.');
    } finally {
      setApplyLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* HEADER SECTION */}
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#0284c7] text-xs font-semibold">
            <Briefcase className="w-3.5 h-3.5" />
            Bursa Karir Resmi MMTC
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Portal Lowongan Kerja Alumni
          </h1>
          <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
            Eksplorasi kesempatan karir di industri kreatif, penyiaran televisi &amp; radio, game studio, serta IT yang diposting oleh sesama alumni dan mitra terpercaya STMM MMTC Yogyakarta.
          </p>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-2xl mb-8 space-y-4 shadow-2xs">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul posisi, nama studio/perusahaan, prodi, atau kota..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  aria-label="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <Filter className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
              <button
                onClick={() => {
                  setSelectedProdi('ALL');
                  setLoading(true);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedProdi === 'ALL'
                    ? 'bg-[#0284c7] text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                Semua Jurusan
              </button>
              {PRODI_LIST.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProdi(p.id);
                    setLoading(true);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedProdi === p.id
                      ? 'bg-[#0284c7] text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECONDARY FILTER BAR: TIPE KERJA & GAJI TOGGLE */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-slate-400 font-semibold mr-1">Tipe:</span>
              {['ALL', 'Full-time', 'Freelance', 'Magang', 'Part-time'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedTipeKerja(type)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition cursor-pointer ${
                    selectedTipeKerja === type
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {type === 'ALL' ? 'Semua Tipe' : type}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-semibold">
              <input
                type="checkbox"
                checked={onlyWithSalary}
                onChange={(e) => setOnlyWithSalary(e.target.checked)}
                className="w-4 h-4 text-[#0284c7] rounded bg-white border-slate-300 focus:ring-[#0284c7]"
              />
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Cantumkan Gaji
              </span>
            </label>
          </div>
        </div>

        {/* JOB LISTINGS */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <JobCardSkeleton />
            <JobCardSkeleton />
            <JobCardSkeleton />
            <JobCardSkeleton />
            <JobCardSkeleton />
            <JobCardSkeleton />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl p-8 space-y-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Briefcase className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Belum Ada Lowongan Ditemukan</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? `Tidak ada lowongan yang sesuai dengan kata kunci "${searchQuery}".`
                  : 'Belum ada lowongan untuk program studi ini. Jadilah alumni pertama yang memasang lowongan!'}
              </p>
            </div>
            {user && (
              <Link
                href="/post-lowongan"
                className="inline-block px-5 py-2.5 rounded-xl bg-[#0284c7] text-white text-xs font-bold hover:bg-[#0369a1] transition shadow-xs"
              >
                + Pasang Lowongan Baru
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const isMyJob = Boolean(user && job.postedBy === user.uid);
              const hasApplied = Boolean(user && appliedJobIds.has(job.id));
              const isDeadlinePassed = Boolean(
                job.deadline && !isNaN(Date.parse(job.deadline)) && new Date(job.deadline).setHours(23, 59, 59, 999) < nowTimestamp
              );
              return (
                <div 
                  key={job.id} 
                  className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-2xl p-6 flex flex-col justify-between transition hover:shadow-md shadow-2xs group"
                >
                  <div className="space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-100 text-[#0284c7] text-[11px] font-bold">
                          {job.tipeKerja}
                        </span>
                        {job.deadline && !isNaN(Date.parse(job.deadline)) && (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                            isDeadlinePassed
                              ? 'bg-red-50 border-red-200 text-red-700'
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            {isDeadlinePassed ? 'Batas Lewat: ' : 'Batas: '}
                            {new Date(job.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#0284c7] transition leading-snug">
                        {job.judul}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{job.perusahaan}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {job.lokasi}
                      </span>
                      {job.gajiRange && (
                        <span className="text-emerald-700 font-bold flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <DollarSign className="w-3 h-3 text-emerald-600" />
                          {job.gajiRange}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {job.deskripsi}
                    </p>

                    {/* KUALIFIKASI PREVIEW */}
                    {job.kualifikasi && job.kualifikasi.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[11px] font-semibold text-slate-600">Persyaratan Utama:</p>
                        <div className="flex flex-wrap gap-1">
                          {job.kualifikasi.slice(0, 2).map((k, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-slate-700">
                              • {k}
                            </span>
                          ))}
                          {job.kualifikasi.length > 2 && (
                            <span className="text-[10px] text-slate-400 py-0.5 px-1">
                              +{job.kualifikasi.length - 2} lainnya
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* PRODI TARGET TAGS */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.prodiTarget?.map((prodi) => (
                        <ProdiBadge key={prodi} prodi={prodi} />
                      ))}
                    </div>
                  </div>

                  <div className="pt-5 mt-5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Oleh {job.posterName}
                    </span>
                    
                    {isMyJob ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                        <UserCheck className="w-3.5 h-3.5" /> Loker Anda
                      </span>
                    ) : hasApplied ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sudah Dilamar
                      </span>
                    ) : isDeadlinePassed ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold border border-slate-200">
                        Ditutup
                      </span>
                    ) : user ? (
                      <button
                        onClick={() => handleOpenApplyModal(job)}
                        className="px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-2xs transition flex items-center gap-1.5 active:scale-[0.98]"
                      >
                        <Send className="w-3 h-3" />
                        Lamar Posisi
                      </button>
                    ) : (
                      <Link
                        href="/login?redirect=/lowongan"
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
                      >
                        Masuk &amp; Lamar
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* APPLY MODAL */}
        {applyingJob && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 sm:p-7 space-y-5 relative shadow-xl">
              <button 
                onClick={() => setApplyingJob(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Kirim Lamaran Pekerjaan</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Posisi: <strong className="text-slate-800">{applyingJob.judul}</strong> ({applyingJob.perusahaan})
                </p>
              </div>

              {applySuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Lamaran Berhasil Dikirimkan!</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Data profil dan portofolio kamu telah diteruskan ke alumni pembuka lowongan.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-4">
                  {applyError && (
                    <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{applyError}</span>
                    </div>
                  )}

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <p className="font-semibold text-slate-800">Ringkasan Data Pelamar:</p>
                    <p className="text-slate-600">
                      Nama: <span className="text-slate-900 font-medium">{profile?.namaLengkap || user?.displayName || user?.email}</span>
                    </p>
                    <p className="text-slate-600">
                      Prodi &amp; Angkatan: <span className="text-slate-900 font-medium">{profile?.prodi || 'Animasi'} ({profile?.angkatan || '-'})</span>
                    </p>
                    <p className="text-slate-600">
                      CV Terlampir:{' '}
                      <span className="text-[#0284c7] font-semibold">
                        {profile?.cvFileUrl ? 'PDF Resmi Terunggah' : profile?.cvExternalLink ? 'Tautan Portofolio' : 'Belum diunggah di profil'}
                      </span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tautan CV / Portofolio Eksternal (Opsional, e.g. Google Drive/Notion/Dropbox)
                    </label>
                    <input
                      type="url"
                      value={customCvLink}
                      onChange={(e) => setCustomCvLink(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Pesan Singkat / Cover Letter ke Pembuka Lowongan *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={coverNote}
                      onChange={(e) => setCoverNote(e.target.value)}
                      placeholder="Ceritakan sedikit ketertarikanmu pada posisi ini, pengalaman proyek relevan, atau showreel karya terbaikmu..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-[#0284c7] focus:bg-white transition leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setApplyingJob(null)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={applyLoading}
                      className="px-5 py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-xs flex items-center gap-2 disabled:opacity-50 transition active:scale-[0.98]"
                    >
                      {applyLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Mengirim Lamaran...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Kirim Lamaran Sekarang
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function LowonganPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <Loader2 className="w-6 h-6 animate-spin text-[#0284c7]" />
      </div>
    }>
      <LowonganContent />
    </Suspense>
  );
}
