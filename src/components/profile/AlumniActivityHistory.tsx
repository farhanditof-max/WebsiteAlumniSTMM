'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  FileText, 
  PlusCircle, 
  Maximize2, 
  Calendar, 
  Sparkles, 
  ExternalLink, 
  Check 
} from 'lucide-react';
import AlumniAvatar from '@/components/profile/AlumniAvatar';
import { CinemaLightbox } from '@/components/ui/Modal';
import { parseYouTubeVideoId } from '@/lib/media';

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

const DEFAULT_USER_POSTS: UserActivityPost[] = [
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

interface AlumniActivityHistoryProps {
  authorName?: string;
  authorProdi?: string;
  authorAvatar?: string;
  isOwner?: boolean;
}

export default function AlumniActivityHistory({
  authorName = 'Budi Santoso',
  authorProdi = 'Animasi',
  authorAvatar = '',
  isOwner = true
}: AlumniActivityHistoryProps) {
  const [posts] = useState<UserActivityPost[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('alumni_user_posts');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const existingIds = new Set(parsed.map((p: UserActivityPost) => p.id));
            return [
              ...parsed,
              ...DEFAULT_USER_POSTS.filter(p => !existingIds.has(p.id))
            ];
          }
        }
      } catch {
        // ignore
      }
    }
    return DEFAULT_USER_POSTS;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('semua');
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [cinemaVideo, setCinemaVideo] = useState<{ videoId: string; title: string } | null>(null);
  const [copyAlert, setCopyAlert] = useState(false);

  const handleToggleLike = (id: string) => {
    setLikedPosts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleShare = (post: UserActivityPost) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/feed#${post.id}`);
      setCopyAlert(true);
      setTimeout(() => setCopyAlert(false), 2500);
    }
  };

  const filteredPosts = posts.filter(post => {
    if (selectedCategory === 'semua') return true;
    return post.category === selectedCategory;
  });

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
    <div id="aktivitas" className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 space-y-6 shadow-sm scroll-mt-24">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0284c7]" />
              Aktivitas &amp; Riwayat Postingan
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-[#0284c7] font-bold text-xs border border-sky-100">
              {posts.length} Postingan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Riwayat publikasi showreel, kolaborasi tim, dan diskusi yang Anda bagikan di komunitas alumni STMM MMTC
          </p>
        </div>

        {isOwner && (
          <Link
            href="/feed"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold transition shadow-2xs shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Buat Postingan Baru</span>
          </Link>
        )}
      </div>

      {/* FILTER TABS (LINKEDIN / FACEBOOK STYLE) */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'semua', label: 'Semua' },
          { id: 'showreel', label: '🎬 Showreel' },
          { id: 'diskusi', label: '💡 Diskusi' },
          { id: 'kolaborasi', label: '🤝 Kolaborasi' },
          { id: 'pencapaian', label: '🏆 Prestasi' }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer select-none ${
              selectedCategory === tab.id
                ? 'bg-[#0284c7] text-white font-bold shadow-2xs'
                : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* COPY ALERT NOTIFICATION */}
      {copyAlert && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Tautan postingan berhasil disalin ke clipboard!</span>
        </div>
      )}

      {/* POSTS LIST */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl p-6 space-y-2">
          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">Tidak ada postingan dalam kategori ini</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Bagikan karya portofolio, diskusi teknologi, atau update terbaru Anda langsung ke feed alumni.
          </p>
          <div className="pt-2">
            <Link
              href="/feed"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold transition shadow-2xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Publikasikan Sekarang</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => {
            const isLiked = likedPosts[post.id];
            const currentLikes = post.likesCount + (isLiked ? 1 : 0);
            const ytId = post.mediaType === 'youtube' && post.mediaUrl ? parseYouTubeVideoId(post.mediaUrl) : null;

            return (
              <div 
                key={post.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-3.5 hover:border-sky-200 hover:shadow-xs transition"
              >
                {/* POST HEADER */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-sky-400 to-[#0284c7] text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                      <AlumniAvatar 
                        src={post.authorAvatar || authorAvatar} 
                        name={post.authorName || authorName} 
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">
                          {post.authorName || authorName}
                        </span>
                        <span className="text-[11px] text-[#0284c7] font-semibold">
                          • {post.authorProdi || authorProdi}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-300" />
                        <span>{post.timeAgo}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {getCategoryBadge(post.category)}
                  </div>
                </div>

                {/* POST CONTENT */}
                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {/* HASHTAGS */}
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {post.hashtags.map((tag) => (
                      <span key={tag} className="text-[11px] font-semibold text-[#0284c7] hover:underline cursor-pointer">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* MEDIA ATTACHMENT */}
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
                      className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black/90 text-white text-[10px] font-bold flex items-center gap-1.5 backdrop-blur-md opacity-90 hover:opacity-100 transition shadow-sm cursor-pointer z-10"
                      title="Mode Bioskop Layar Penuh"
                    >
                      <Maximize2 className="w-3 h-3 text-sky-400" />
                      <span>Mode Bioskop</span>
                    </button>
                  </div>
                )}

                {post.mediaType === 'image' && post.mediaUrl && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-72 bg-slate-100">
                    <img 
                      src={post.mediaUrl} 
                      alt={post.mediaTitle || 'Media Foto'}
                      className="w-full h-auto max-h-72 object-cover"
                    />
                  </div>
                )}

                {post.mediaType === 'pdf' && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {post.mediaTitle || 'Dokumen PDF'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {post.mediaSize || 'PDF Document'} • Terverifikasi Alumni MMTC
                        </p>
                      </div>
                    </div>
                    {post.mediaUrl && post.mediaUrl !== '#' && (
                      <a
                        href={post.mediaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-[#0284c7] hover:bg-sky-50 text-[11px] font-bold transition shrink-0"
                      >
                        Buka PDF
                      </a>
                    )}
                  </div>
                )}

                {/* POST FOOTER / INTERACTION BAR */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-500 text-xs">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1.5 transition cursor-pointer select-none ${
                        isLiked ? 'text-red-500 font-bold' : 'hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      <span>{currentLikes} Suka</span>
                    </button>

                    <Link
                      href="/feed"
                      className="flex items-center gap-1.5 hover:text-[#0284c7] transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
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
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    <Link
                      href="/feed"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0284c7] hover:underline"
                    >
                      <span>Buka di Feed</span>
                      <ExternalLink className="w-3 h-3" />
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
    </div>
  );
}
