'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Trash2, 
  FileText, 
  PlusCircle, 
  Maximize2, 
  Calendar, 
  ExternalLink, 
  Check,
  ArrowLeft,
  Briefcase
} from 'lucide-react';
import AlumniAvatar from '@/components/profile/AlumniAvatar';
import { CinemaLightbox } from '@/components/ui/Modal';
import { parseYouTubeVideoId } from '@/lib/media';
import { UserProfile } from '@/types';

interface ExtendedUserProfile extends UserProfile {
  pekerjaanSaatIni?: string;
}

export interface UserActivityPost {
  id: string;
  authorName: string;
  authorProdi: string;
  authorAngkatan?: string;
  authorRole?: string;
  authorAvatar?: string;
  timeAgo: string;
  category: 'showreel' | 'kolaborasi' | 'diskusi' | 'pencapaian';
  content: string;
  hashtags?: string[];
  mediaType?: 'youtube' | 'image' | 'pdf';
  mediaUrl?: string;
  mediaTitle?: string;
  mediaSize?: string;
  likesCount: number;
  commentsCount?: number;
}

const DEFAULT_POSTS: UserActivityPost[] = [
  {
    id: 'user-post-1',
    authorName: 'Budi Santoso',
    authorProdi: 'Animasi',
    authorAngkatan: '2020',
    authorRole: '3D Animator di Infinite Studios',
    timeAgo: '1 hari yang lalu',
    category: 'showreel',
    content: 'Baru saja merilis breakdown rigging character stylized untuk project open-source animasi MMTC. Fokus pada face controls dan flexible spine setup di Blender. Silakan tonton showreel-nya di bawah ya rekan-rekan!',
    hashtags: ['#Blender3D', '#RiggingBreakdown', '#AnimasiMMTC', '#CharacterArt'],
    mediaType: 'youtube',
    mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    mediaTitle: '3D Facial & Body Rigging Breakdown 2026',
    likesCount: 38,
    commentsCount: 6
  },
  {
    id: 'user-post-2',
    authorName: 'Budi Santoso',
    authorProdi: 'Animasi',
    authorAngkatan: '2020',
    authorRole: '3D Animator di Infinite Studios',
    timeAgo: '4 hari yang lalu',
    category: 'diskusi',
    content: 'Sharing tips workflow animasi kamera di Unreal Engine 5 untuk keperluan sinematik broadcast. Menggabungkan teknik blocking kamera klasik MMTC dengan Sequencer UE5. Ada yang tertarik adakan sharing session santai weekend ini?',
    hashtags: ['#UnrealEngine5', '#Cinematography', '#MMTCAlumni', '#VirtualProduction'],
    mediaType: 'image',
    mediaUrl: '/kampus_stmm.jpg',
    mediaTitle: 'Virtual Production Studio Setup Memories',
    likesCount: 52,
    commentsCount: 11
  }
];

export default function AktivitasPage() {
  const { user, profile } = useAuth();

  const currentUser = {
    name: profile?.namaLengkap || user?.displayName || 'Budi Santoso',
    prodi: profile?.prodi || 'Animasi',
    angkatan: profile?.angkatan || '2020',
    role: (profile as ExtendedUserProfile | null)?.pekerjaanSaatIni || '3D Animator di Infinite Studios',
    avatar: profile?.fotoProfil || ''
  };

  const [posts, setPosts] = useState<UserActivityPost[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('alumni_user_posts');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const existingIds = new Set(parsed.map((p: UserActivityPost) => p.id));
            return [
              ...parsed,
              ...DEFAULT_POSTS.filter(p => !existingIds.has(p.id))
            ];
          }
        }
      } catch {
        // ignore
      }
    }
    return DEFAULT_POSTS;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('semua');
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [cinemaVideo, setCinemaVideo] = useState<{ videoId: string; title: string } | null>(null);
  const [actionAlert, setActionAlert] = useState<string>('');

  const handleToggleLike = (id: string) => {
    setLikedPosts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDeletePost = (id: string) => {
    const updated = posts.filter(p => p.id !== id);
    setPosts(updated);
    try {
      localStorage.setItem('alumni_user_posts', JSON.stringify(updated));
    } catch {
      // ignore
    }
    setActionAlert('Postingan berhasil dihapus dari riwayat aktivitas Anda.');
    setTimeout(() => setActionAlert(''), 3000);
  };

  const handleShare = (post: UserActivityPost) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/feed#${post.id}`);
      setActionAlert('Tautan postingan berhasil disalin ke clipboard!');
      setTimeout(() => setActionAlert(''), 2500);
    }
  };

  const filteredPosts = posts.filter(post => {
    if (selectedCategory === 'semua') return true;
    return post.category === selectedCategory;
  });

  const totalLikes = posts.reduce((acc, curr) => acc + curr.likesCount + (likedPosts[curr.id] ? 1 : 0), 0);
  const totalComments = posts.reduce((acc, curr) => acc + (curr.commentsCount || 0), 0);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'showreel':
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">🎬 Showreel</span>;
      case 'kolaborasi':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">🤝 Kolaborasi</span>;
      case 'pencapaian':
        return <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold">🏆 Prestasi</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">💡 Diskusi</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafcff] text-slate-900 flex flex-col justify-between font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        
        {/* TOP BACK SHORTCUT */}
        <div className="mb-6">
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#0284c7] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Feed Komunitas</span>
          </Link>
        </div>

        {/* HERO HEADER: MANAGE POSTS & ACTIVITY (FACEBOOK / LINKEDIN STYLE) */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-tr from-sky-400 to-[#0284c7] text-white flex items-center justify-center text-2xl font-bold shadow-xs border-2 border-white ring-4 ring-sky-50 shrink-0">
                <AlumniAvatar src={currentUser.avatar} name={currentUser.name} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0284c7] block">
                  Dashboard Kelola Postingan
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">
                  Postingan &amp; Aktivitas {currentUser.name}
                </h1>
                <p className="text-xs text-slate-600 font-medium mt-1 flex items-center gap-2 flex-wrap">
                  <span>{currentUser.prodi} MMTC • Angkatan {currentUser.angkatan}</span>
                  {currentUser.role && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[#0284c7]">
                        <Briefcase className="w-3 h-3" />
                        {currentUser.role}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/feed"
                className="px-5 py-2.5 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Buat Postingan Baru</span>
              </Link>
            </div>
          </div>

          {/* 3 SUMMARY STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4 border-t border-slate-100">
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Postingan Anda
              </span>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                {posts.length} <span className="text-xs text-slate-500 font-normal">Konten</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100">
              <span className="text-[11px] font-bold text-[#0284c7] uppercase tracking-wider block">
                Total Apresiasi / Suka
              </span>
              <p className="text-xl sm:text-2xl font-bold text-[#0284c7] mt-1">
                {totalLikes} <span className="text-xs text-sky-600 font-normal">Suka</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                Total Interaksi Komentar
              </span>
              <p className="text-xl sm:text-2xl font-bold text-emerald-700 mt-1">
                {totalComments} <span className="text-xs text-emerald-600 font-normal">Komentar</span>
              </p>
            </div>
          </div>
        </div>

        {/* NOTIFICATION ALERT */}
        {actionAlert && (
          <div className="mb-6 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-2xs">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionAlert}</span>
          </div>
        )}

        {/* FILTER CATEGORY PILLS */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'semua', label: 'Semua Postingan' },
              { id: 'showreel', label: '🎬 Showreel' },
              { id: 'diskusi', label: '💡 Diskusi' },
              { id: 'kolaborasi', label: '🤝 Kolaborasi' },
              { id: 'pencapaian', label: '🏆 Prestasi' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition cursor-pointer select-none ${
                  selectedCategory === tab.id
                    ? 'bg-[#0284c7] text-white font-bold shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 font-medium">
            Menampilkan {filteredPosts.length} dari {posts.length} postingan
          </span>
        </div>

        {/* POSTS LIST (MANAGEABLE CARDS) */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-3xl p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Belum ada postingan dalam kategori ini
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Bagikan karya video showreel, update produksi, atau buka diskusi baru bersama sesama alumni STMM MMTC.
            </p>
            <div className="pt-2">
              <Link
                href="/feed"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold transition shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Buat Postingan di Feed</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {filteredPosts.map((post) => {
              const isLiked = likedPosts[post.id];
              const currentLikes = post.likesCount + (isLiked ? 1 : 0);
              const ytId = post.mediaType === 'youtube' && post.mediaUrl ? parseYouTubeVideoId(post.mediaUrl) : null;

              return (
                <div 
                  key={post.id}
                  className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 hover:border-sky-200 hover:shadow-xs transition"
                >
                  {/* HEADER ROW */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-tr from-sky-400 to-[#0284c7] text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                        <AlumniAvatar 
                          src={post.authorAvatar || currentUser.avatar} 
                          name={post.authorName || currentUser.name} 
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900">
                            {post.authorName || currentUser.name}
                          </span>
                          <span className="text-xs text-[#0284c7] font-semibold">
                            • {post.authorProdi || currentUser.prodi}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-300" />
                          <span>{post.timeAgo}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getCategoryBadge(post.category)}
                      
                      {/* DELETE POST BUTTON */}
                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Hapus Postingan dari Riwayat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* CONTENT TEXT */}
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>

                  {/* HASHTAGS */}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {post.hashtags.map((tag) => (
                        <span key={tag} className="text-xs font-semibold text-[#0284c7] hover:underline cursor-pointer">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* MEDIA ATTACHMENTS */}
                  {post.mediaType === 'youtube' && post.mediaUrl && ytId && (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}?rel=0`}
                        title={post.mediaTitle || 'Showreel'}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full border-0"
                      />
                      <button
                        type="button"
                        onClick={() => setCinemaVideo({ videoId: ytId, title: post.mediaTitle || 'Showreel' })}
                        className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black/90 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md opacity-90 hover:opacity-100 transition shadow-sm cursor-pointer z-10"
                        title="Mode Bioskop Layar Penuh"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                        <span>Mode Bioskop</span>
                      </button>
                    </div>
                  )}

                  {post.mediaType === 'image' && post.mediaUrl && (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-80 bg-slate-100">
                      <img 
                        src={post.mediaUrl} 
                        alt={post.mediaTitle || 'Media Foto'}
                        className="w-full h-auto max-h-80 object-cover"
                      />
                    </div>
                  )}

                  {post.mediaType === 'pdf' && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {post.mediaTitle || 'Dokumen PDF'}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {post.mediaSize || 'PDF Document'} • Terverifikasi Alumni MMTC
                          </p>
                        </div>
                      </div>
                      {post.mediaUrl && post.mediaUrl !== '#' && (
                        <a
                          href={post.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-[#0284c7] hover:bg-sky-50 text-xs font-bold transition shrink-0"
                        >
                          Buka PDF
                        </a>
                      )}
                    </div>
                  )}

                  {/* ACTION BAR / FOOTER */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-slate-500 text-xs">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => handleToggleLike(post.id)}
                        className={`flex items-center gap-1.5 transition cursor-pointer select-none ${
                          isLiked ? 'text-red-500 font-bold' : 'hover:text-red-500'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                        <span>{currentLikes} Suka</span>
                      </button>

                      <Link
                        href="/feed"
                        className="flex items-center gap-1.5 hover:text-[#0284c7] transition"
                      >
                        <MessageSquare className="w-4 h-4 text-slate-400" />
                        <span>{post.commentsCount || 0} Komentar</span>
                      </Link>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleShare(post)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 hover:text-[#0284c7] transition cursor-pointer"
                        title="Salin Tautan Postingan"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      <Link
                        href="/feed"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0284c7] hover:underline"
                      >
                        <span>Lihat di Feed</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CINEMA LIGHTBOX */}
        <CinemaLightbox
          isOpen={Boolean(cinemaVideo)}
          onClose={() => setCinemaVideo(null)}
          title={cinemaVideo?.title || 'Preview Showreel'}
          videoId={cinemaVideo?.videoId || ''}
        />
      </main>

      <Footer />
    </div>
  );
}
