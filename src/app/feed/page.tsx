'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Send, 
  LayoutGrid,
  Video, 
  Paperclip,
  FileText,
  UploadCloud,
  X,
  ExternalLink,
  UserPlus, 
  Check, 
  Award,
  Hash, 
  Users, 
  Calendar, 
  Maximize2, 
  Briefcase,
  ChevronDown,
  MapPin,
  Lock,
  Loader2
} from 'lucide-react';
import AlumniAvatar from '@/components/profile/AlumniAvatar';
import { OpenToWorkBadge, ProdiBadge } from '@/components/ui/Badge';
import { CinemaLightbox } from '@/components/ui/Modal';
import { ShareModal } from '@/components/ui/ShareModal';

import { parseYouTubeVideoId, safeHttpUrl } from '@/lib/media';
import { 
  subscribeToFeedPosts, 
  createFeedPost, 
  toggleLikePost, 
  addPostComment, 
  INITIAL_CURATED_POSTS 
} from '@/lib/feed';
import { UserProfile, FeedCategory } from '@/types';

interface ExtendedUserProfile extends UserProfile {
  pekerjaanSaatIni?: string;
  domisili?: string;
}

export interface FeedPostUI {
  id: string;
  authorUid?: string;
  authorName: string;
  authorProdi: string;
  authorAngkatan?: string;
  authorRole?: string;
  authorAvatar?: string;
  nomorAlumni?: string;
  timeAgo: string;
  category: FeedCategory;
  content: string;
  hashtags?: string[];
  mediaType?: 'youtube' | 'image' | 'pdf';
  mediaUrl?: string;
  mediaTitle?: string;
  mediaSize?: string;
  likesCount: number;
  likedBy?: string[];
  isLiked?: boolean;
  commentsCount?: number;
  comments: Array<{
    id: string;
    authorUid?: string;
    authorName: string;
    authorProdi?: string;
    authorAvatar?: string;
    text: string;
    timeAgo?: string;
    createdAt?: string;
  }>;
  isFollowing?: boolean;
}

function formatTimeAgo(isoString?: string): string {
  if (!isoString) return 'Baru saja';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} hari yang lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

const DEFAULT_POSTS: FeedPostUI[] = INITIAL_CURATED_POSTS.map(p => ({
  ...p,
  timeAgo: formatTimeAgo(p.createdAt),
  isLiked: false,
  isFollowing: false,
  comments: (p.comments || []).map(c => ({
    ...c,
    timeAgo: formatTimeAgo(c.createdAt)
  }))
}));

const SUGGESTED_CONNECTIONS = [
  {
    id: 's-1',
    name: 'Tito Ari Pratama',
    prodi: 'Game',
    angkatan: '2021',
    role: 'Unity Gameplay Programmer',
    mutual: 8
  },
  {
    id: 's-2',
    name: 'Via Ruby',
    prodi: 'MIK',
    angkatan: '2020',
    role: 'Product Designer / UI UX',
    mutual: 14
  },
  {
    id: 's-3',
    name: 'Adam Narotama',
    prodi: 'Matekstosi',
    angkatan: '2019',
    role: 'Audio Post & Sound Designer',
    mutual: 5
  }
];

const TRENDING_TOPICS = [
  { tag: '#FestivalFilmMMTC', count: '142 postingan' },
  { tag: '#Animasi3D', count: '98 postingan' },
  { tag: '#BroadcastEngineer', count: '76 postingan' },
  { tag: '#BlenderCommunity', count: '63 postingan' },
  { tag: '#LokerAlumniJogja', count: '51 postingan' }
];

const POST_CATEGORIES = [
  { id: 'diskusi' as const, label: 'Obrolan & Diskusi', icon: MessageSquare, desc: 'Tanya jawab, opini & wawasan produksi' },
  { id: 'showreel' as const, label: 'Karya & Showreel', icon: Video, desc: 'Karya video, animasi, 3D & portofolio' },
  { id: 'kolaborasi' as const, label: 'Kolaborasi & Kru', icon: Users, desc: 'Ajak proyek, tim lepas & riset bersama' },
  { id: 'pencapaian' as const, label: 'Kabar & Capaian', icon: Award, desc: 'Rilis karya, penghargaan & kabar karir' }
];

export default function FeedPage() {
  const { user, profile, loading: authLoading } = useAuth();

  // Logged-in user profile with clean per-user data (kosongan default)
  const currentUser = {
    name: profile?.namaLengkap || user?.displayName || 'Alumni MMTC',
    prodi: profile?.prodi || '',
    angkatan: profile?.angkatan || '',
    bio: profile?.bio || '',
    role: (profile as ExtendedUserProfile | null)?.pekerjaanSaatIni || '',
    domisili: (profile as ExtendedUserProfile | null)?.domisili || '',
    avatar: profile?.fotoProfil || ''
  };

  const [posts, setPosts] = useState<FeedPostUI[]>(DEFAULT_POSTS);

  useEffect(() => {
    const unsub = subscribeToFeedPosts((fetched) => {
      if (fetched && fetched.length > 0) {
        const mapped: FeedPostUI[] = fetched.map(p => ({
          ...p,
          timeAgo: formatTimeAgo(p.createdAt),
          isLiked: user ? (p.likedBy?.includes(user.uid) || false) : false,
          comments: (p.comments || []).map(c => ({
            ...c,
            timeAgo: formatTimeAgo(c.createdAt)
          }))
        }));
        setPosts(mapped);
      }
    });
    return () => unsub();
  }, [user]);
  const [selectedFilter, setSelectedFilter] = useState<string>('semua');
  
  // Post Creator State
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'showreel' | 'kolaborasi' | 'diskusi' | 'pencapaian'>('diskusi');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState<'youtube' | 'media' | 'none'>('none');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState<string>('');
  const [attachedFileType, setAttachedFileType] = useState<'image' | 'pdf'>('image');
  const [isPosting, setIsPosting] = useState(false);
  const [postAlert, setPostAlert] = useState('');

  // Active commenting map: postId -> comment text
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({
    'post-1': true
  });

  // Modals state
  const [cinemaVideo, setCinemaVideo] = useState<{ videoId: string; title: string } | null>(null);
  const [shareData, setShareData] = useState<{ title: string; subtitle: string; url: string } | null>(null);
  const [followedAlumni, setFollowedAlumni] = useState<Record<string, boolean>>({
    'post-2': true
  });
  const [connectedUsers, setConnectedUsers] = useState<Record<string, boolean>>({});

  // Custom Category Dropdown State
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFile(file);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    setAttachedFileType(isPdf ? 'pdf' : 'image');
    setAttachedPreview(URL.createObjectURL(file));
  };

  const handleRemoveAttachment = () => {
    setAttachedFile(null);
    setAttachedPreview('');
    setNewMediaUrl('');
  };

  // Handlers
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    if (!user) {
      setPostAlert('Silakan masuk dengan akun alumni untuk menerbitkan kiriman.');
      setTimeout(() => setPostAlert(''), 4000);
      return;
    }

    setIsPosting(true);

    try {
      let finalMediaType: 'youtube' | 'image' | 'pdf' | undefined = undefined;
      let finalMediaUrl: string | undefined = undefined;
      let finalMediaTitle: string | undefined = undefined;
      let finalMediaSize: string | undefined = undefined;

      if (newMediaType === 'youtube' && newMediaUrl.trim()) {
        finalMediaType = 'youtube';
        finalMediaUrl = newMediaUrl.trim();
        finalMediaTitle = 'Video Showreel';
      } else if (newMediaType === 'media') {
        if (attachedFile) {
          finalMediaType = attachedFileType;
          finalMediaTitle = attachedFile.name;
          finalMediaSize = `${(attachedFile.size / (1024 * 1024)).toFixed(1)} MB`;
        } else if (newMediaUrl.trim()) {
          const isPdf = newMediaUrl.toLowerCase().includes('.pdf');
          finalMediaType = isPdf ? 'pdf' : 'image';
          finalMediaUrl = newMediaUrl.trim();
          finalMediaTitle = isPdf ? 'Dokumen PDF Alumni' : 'Media Foto';
        }
      }

      const created = await createFeedPost({
        authorUid: user.uid,
        authorName: currentUser.name,
        authorProdi: currentUser.prodi,
        authorAngkatan: currentUser.angkatan,
        authorRole: currentUser.role,
        authorAvatar: currentUser.avatar,
        nomorAlumni: profile?.nomorAlumni || 'MMTC-2020-001',
        category: newCategory,
        content: newContent.trim(),
        hashtags: [`#AlumniMMTC`, `#${currentUser.prodi}MMTC`],
        mediaType: finalMediaType,
        mediaUrl: finalMediaUrl,
        mediaTitle: finalMediaTitle,
        mediaSize: finalMediaSize
      }, attachedFile);

      const optimisticPost: FeedPostUI = {
        ...created,
        timeAgo: 'Baru saja',
        isLiked: false,
        isFollowing: false,
        comments: []
      };

      setPosts(prev => [optimisticPost, ...prev.filter(p => p.id !== optimisticPost.id)]);

      // Save to localStorage per-user so profile history immediately shows this post
      try {
        if (user?.uid) {
          const userKey = `alumni_posts_${user.uid}`;
          const stored = localStorage.getItem(userKey);
          const existing = stored ? JSON.parse(stored) : [];
          localStorage.setItem(userKey, JSON.stringify([optimisticPost, ...existing]));
          // Remove legacy global key if present to prevent cross-account bleeding
          localStorage.removeItem('alumni_user_posts');
        }
      } catch {
        // ignore
      }

      setNewContent('');
      setNewMediaUrl('');
      setAttachedFile(null);
      setAttachedPreview('');
      setNewMediaType('none');
      setPostAlert('Kiriman berhasil tayang di beranda komunitas.');
      setTimeout(() => setPostAlert(''), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      console.error('Error creating post:', err);
      setPostAlert(`Gagal menerbitkan kiriman: ${msg}`);
      setTimeout(() => setPostAlert(''), 4000);
    } finally {
      setIsPosting(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!user) {
      setPostAlert('Silakan masuk dengan akun alumni untuk menyukai kiriman.');
      setTimeout(() => setPostAlert(''), 3000);
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const isCurrentlyLiked = post.isLiked ?? post.likedBy?.includes(user.uid) ?? false;

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const newLiked = !isCurrentlyLiked;
        const newLikedBy = newLiked
          ? [...(p.likedBy || []), user.uid]
          : (p.likedBy || []).filter(uid => uid !== user.uid);
        return {
          ...p,
          isLiked: newLiked,
          likedBy: newLikedBy,
          likesCount: newLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1)
        };
      }
      return p;
    }));

    try {
      await toggleLikePost(postId, user.uid, isCurrentlyLiked);
    } catch (err) {
      console.warn('Like toggle sync error:', err);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user) {
      setPostAlert('Silakan masuk dengan akun alumni untuk ikut berdiskusi.');
      setTimeout(() => setPostAlert(''), 3000);
      return;
    }

    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const nowIso = new Date().toISOString();
    // eslint-disable-next-line react-hooks/purity
    const commentId = `c-${Date.now()}`;
    const optimisticComment = {
      id: commentId,
      authorUid: user.uid,
      authorName: currentUser.name,
      authorProdi: currentUser.prodi,
      authorAvatar: currentUser.avatar,
      text,
      timeAgo: 'Baru saja',
      createdAt: nowIso
    };

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          commentsCount: (p.commentsCount || p.comments.length) + 1,
          comments: [...p.comments, optimisticComment]
        };
      }
      return p;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    setExpandedComments(prev => ({ ...prev, [postId]: true }));

    try {
      await addPostComment(postId, {
        authorUid: user.uid,
        authorName: currentUser.name,
        authorProdi: currentUser.prodi,
        authorAvatar: currentUser.avatar,
        text
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem';
      console.error('Error adding comment:', err);
      setPostAlert(`Gagal mengirim komentar: ${msg}`);
      setTimeout(() => setPostAlert(''), 3000);
    }
  };

  const handleToggleFollow = (authorKey: string) => {
    if (!user) {
      setPostAlert('Silakan masuk dengan akun alumni untuk mulai mengikuti.');
      setTimeout(() => setPostAlert(''), 3000);
      return;
    }
    setFollowedAlumni(prev => ({
      ...prev,
      [authorKey]: !prev[authorKey]
    }));
  };

  const handleToggleConnect = (userId: string) => {
    if (!user) {
      setPostAlert('Silakan masuk dengan akun alumni untuk mulai terhubung.');
      setTimeout(() => setPostAlert(''), 3000);
      return;
    }
    setConnectedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const filteredPosts = posts.filter(post => {
    if (selectedFilter === 'semua') return true;
    return post.category === selectedFilter;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0284c7]" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 flex items-center justify-center">
          <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#0284c7] flex items-center justify-center mx-auto border border-sky-100 shadow-xs">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Masuk untuk Melihat Feed
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Ruang interaksi, showreel, dan jejaring komunitas ini eksklusif bagi alumni STMM MMTC yang telah terdaftar.
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <Link
                href="/login?redirect=/feed"
                className="w-full py-3.5 px-4 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm shadow-xs transition flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                Masuk ke Akun Alumni
              </Link>
              <Link
                href="/register"
                className="w-full py-3 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm border border-slate-200 transition flex items-center justify-center gap-2"
              >
                Belum punya akun? Daftar
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* BANNER PREVIEW / GREETING */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-sky-50/50 border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-[#0284c7] text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900">
                Ruang Komunitas Alumni MMTC
              </h1>
              <p className="text-xs text-slate-600">
                Bagikan progres produksi, rilis showreel terbaru, atau cari kru lintas angkatan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/open-to-work"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition shadow-2xs"
            >
              <Briefcase className="w-3.5 h-3.5 text-[#0284c7]" />
              Katalog Talenta
            </Link>
          </div>
        </div>

        {/* 3-COLUMN LAYOUT (LINKEDIN / X STYLE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ============================================================== */}
          {/* LEFT SIDEBAR: PROFILE SUMMARY & CATEGORY NAV (COL-SPAN 3)       */}
          {/* ============================================================== */}
          <div className="hidden lg:block lg:col-span-3 space-y-5 sticky top-24">
            
            {/* MINI PROFILE CARD */}
            {user ? (
              <div className="bg-white border border-slate-200/90 rounded-[28px] p-3.5 shadow-sm space-y-3">
                {/* TOP PORTRAIT PHOTO */}
                <div className="w-full aspect-[4/4.2] rounded-[22px] overflow-hidden bg-slate-100 relative group flex items-center justify-center">
                  <img
                    src={currentUser.avatar || '/default_avatar.png'}
                    alt={currentUser.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/default_avatar.png';
                    }}
                  />
                </div>

                {/* PROFILE INFO */}
                <div className="space-y-1.5 px-1">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight truncate">
                    {currentUser.name}
                  </h3>
                  {currentUser.bio ? (
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-3">
                      {currentUser.bio}
                    </p>
                  ) : null}
                  {currentUser.role ? (
                    <p className="text-xs text-slate-700 font-semibold leading-snug truncate pt-0.5">
                      {currentUser.role}
                    </p>
                  ) : null}
                  {currentUser.domisili ? (
                    <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{currentUser.domisili}</span>
                    </p>
                  ) : null}
                  {(currentUser.prodi || currentUser.angkatan) ? (
                    <p className="text-[11px] font-bold text-[#0087cc] pt-0.5">
                      {currentUser.prodi} {currentUser.angkatan ? `• Angkatan ${currentUser.angkatan}` : ''}
                    </p>
                  ) : null}
                  {!currentUser.bio && !currentUser.role && (
                    <p className="text-[11px] text-slate-400 italic pt-0.5">
                      Lengkapi bio & data kamu di halaman profil.
                    </p>
                  )}
                </div>

                {/* ACTION BUTTON */}
                <div className="pt-2 border-t border-slate-100/80">
                  <Link
                    href="/profil"
                    className="w-full py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition active:scale-[0.98] shadow-2xs block text-center"
                  >
                    Edit Profil
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-100 text-[#0284c7] flex items-center justify-center font-bold text-xl shadow-xs">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Portal Alumni MMTC</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Masuk untuk mempublikasikan karya, memberi tanggapan, dan terhubung dengan sesama alumni.
                  </p>
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    href="/login"
                    className="w-full py-2 px-3 rounded-xl bg-[#0087cc] hover:bg-[#0077b5] text-white text-xs font-bold transition shadow-xs"
                  >
                    Masuk Akun
                  </Link>
                  <Link
                    href="/register"
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition"
                  >
                    Daftar Akun Baru
                  </Link>
                </div>
              </div>
            )}

            {/* CATEGORY FILTER NAVIGATION */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1 text-xs">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                Topik Kiriman
              </h4>
              
              {[
                { id: 'semua', label: 'Semua Postingan' },
                { id: 'showreel', label: 'Karya & Showreel' },
                { id: 'kolaborasi', label: 'Cari Crew & Kolaborasi' },
                { id: 'pencapaian', label: 'Prestasi & Berita' },
                { id: 'diskusi', label: 'Tips & Diskusi' },
              ].map(cat => {
                const active = selectedFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedFilter(cat.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold transition cursor-pointer text-left ${
                      active
                        ? 'bg-sky-50 text-[#0087cc] font-bold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{cat.label}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-[#0087cc]" />}
                  </button>
                );
              })}
            </div>

            {/* POPULAR HASHTAGS */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-2.5 text-xs">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#0284c7]" />
                Topik Hangat MMTC
              </h4>
              <div className="space-y-1.5">
                {TRENDING_TOPICS.map(item => (
                  <div key={item.tag} className="flex items-center justify-between px-2 py-1 hover:bg-slate-50 rounded-lg transition">
                    <span className="font-semibold text-slate-700 hover:text-[#0284c7] cursor-pointer">
                      {item.tag}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* CENTER COLUMN: MAIN FEED & POST CREATOR (COL-SPAN 6)            */}
          {/* ============================================================== */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* POST CREATOR CARD / VISITOR BANNER */}
            {!user ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-[#0284c7] flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                      Ikut Berbagi Karya &amp; Diskusi
                    </h2>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Masuk dengan akun alumni untuk mengunggah showreel, mencari kru produksi, atau mengomentari kiriman rekan.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                  <Link
                    href="/login"
                    className="flex-1 sm:flex-initial text-center px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold transition shadow-xs"
                  >
                    Masuk Akun
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 sm:flex-initial text-center px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition shadow-2xs"
                  >
                    Daftar
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-2xs space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-tr from-sky-500 to-[#0284c7] text-white flex items-center justify-center font-bold">
                    <AlumniAvatar src={currentUser.avatar} name={currentUser.name} />
                  </div>
                <div className="flex-1">
                  <textarea
                    rows={2}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Bagikan karya showreel, update syuting, atau ajak kolaborasi..."
                    className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition resize-none"
                  />
                </div>
              </div>

              {/* MEDIA ATTACHMENT INPUT (IF TOGGLED) */}
              {newMediaType === 'youtube' && (
                <div className="p-3.5 rounded-2xl bg-red-50/60 border border-red-100 space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Tautan Video YouTube (Showreel)
                  </label>
                  <input
                    type="text"
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-red-400"
                  />
                </div>
              )}

              {newMediaType === 'media' && (
                <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-[#0284c7]" />
                      Lampirkan Media (Foto Gambar atau Dokumen PDF)
                    </label>
                    {attachedFile && (
                      <button
                        type="button"
                        onClick={handleRemoveAttachment}
                        className="text-[11px] text-red-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" /> Hapus
                      </button>
                    )}
                  </div>

                  {attachedFile ? (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-sky-200">
                      {attachedFileType === 'pdf' ? (
                        <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                      ) : (
                        <img
                          src={attachedPreview}
                          alt="Preview"
                          className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200"
                        />
                      )}
                      <div className="flex-1 truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">{attachedFile.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {attachedFileType === 'pdf' ? 'Dokumen PDF' : 'Gambar / Foto'} • {(attachedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-sky-300 bg-white hover:bg-sky-50/50 cursor-pointer transition">
                        <UploadCloud className="w-6 h-6 text-[#0284c7] mb-1" />
                        <span className="text-xs font-bold text-slate-700">Pilih Berkas Foto atau Dokumen PDF</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Mendukung file Gambar (JPG, PNG, WEBP) atau Dokumen PDF</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf,.pdf"
                          onChange={handleFileAttachment}
                          className="hidden"
                        />
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">atau URL:</span>
                        <input
                          type="text"
                          value={newMediaUrl}
                          onChange={(e) => setNewMediaUrl(e.target.value)}
                          placeholder="Paste link gambar atau link PDF..."
                          className="flex-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#0284c7]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ACTION TOOLBAR */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setNewMediaType(newMediaType === 'youtube' ? 'none' : 'youtube')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      newMediaType === 'youtube'
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5 text-red-500" />
                    <span>Video / Showreel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewMediaType(newMediaType === 'media' ? 'none' : 'media')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      newMediaType === 'media'
                        ? 'bg-sky-50 text-[#0284c7] border border-sky-200'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Paperclip className="w-3.5 h-3.5 text-[#0284c7]" />
                    <span>Media</span>
                  </button>

                  {/* CUSTOM STYLED CATEGORY DROPDOWN */}
                  <div className="relative" ref={categoryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer select-none ${
                        categoryDropdownOpen
                          ? 'bg-sky-50 text-[#0284c7] border-sky-300 shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                      aria-expanded={categoryDropdownOpen}
                      aria-haspopup="listbox"
                    >
                      <span className="text-[#0284c7]">
                        {(() => {
                          const ActiveIcon = POST_CATEGORIES.find(c => c.id === newCategory)?.icon || MessageSquare;
                          return <ActiveIcon className="w-3.5 h-3.5" />;
                        })()}
                      </span>
                      <span>
                        {POST_CATEGORIES.find(c => c.id === newCategory)?.label || 'Diskusi'}
                      </span>
                      <ChevronDown 
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                          categoryDropdownOpen ? 'rotate-180 text-[#0284c7]' : ''
                        }`} 
                      />
                    </button>

                    {categoryDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-56 sm:w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-1.5 z-30 animate-fade-in">
                        <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Pilih Kategori Postingan
                        </div>
                        <div className="space-y-1">
                          {POST_CATEGORIES.map((cat) => {
                            const isSelected = newCategory === cat.id;
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  setNewCategory(cat.id);
                                  setCategoryDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-sky-50 text-[#0284c7] font-bold'
                                    : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-[#0284c7] shrink-0">
                                    {(() => {
                                      const ItemIcon = cat.icon;
                                      return <ItemIcon className="w-3.5 h-3.5" />;
                                    })()}
                                  </span>
                                  <div>
                                    <p className="text-xs font-bold leading-tight">{cat.label}</p>
                                    <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{cat.desc}</p>
                                  </div>
                                </div>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-[#0284c7] shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCreatePost}
                  disabled={!newContent.trim() || isPosting}
                  className="px-5 py-2 rounded-full bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                >
                  <Send className="w-3 h-3" />
                  <span>Publikasikan</span>
                </button>
              </div>

              {postAlert && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-in fade-in">
                  {postAlert}
                </div>
              )}
            </div>
          )}

            {/* FEED FILTER TABS (MOBILE & TABLET VISIBLE) */}
            <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {['semua', 'showreel', 'kolaborasi', 'pencapaian', 'diskusi'].map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedFilter(f)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer capitalize ${
                    selectedFilter === f
                      ? 'bg-[#0284c7] text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* FEED LIST */}
            <div className="space-y-5">
              {filteredPosts.map(post => {
                const isPostLiked = post.isLiked;
                const isFollowingPostAuthor = followedAlumni[post.id] ?? post.isFollowing;
                const commentsOpen = Boolean(expandedComments[post.id]);
                const videoId = post.mediaUrl ? parseYouTubeVideoId(post.mediaUrl) : null;

                return (
                  <article
                    key={post.id}
                    className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4 transition hover:border-slate-300"
                  >
                    {/* POST HEADER: AUTHOR INFO & CONNECT/FOLLOW BUTTON */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Link href={`/profil/${encodeURIComponent(post.authorUid || post.nomorAlumni || '')}`} className="shrink-0">
                          <div className="w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-tr from-sky-500 to-[#0284c7] text-white flex items-center justify-center font-bold text-base shadow-2xs hover:opacity-90 transition">
                            <AlumniAvatar src={post.authorAvatar} name={post.authorName} />
                          </div>
                        </Link>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link 
                              href={`/profil/${encodeURIComponent(post.authorUid || post.nomorAlumni || '')}`}
                              className="text-xs sm:text-sm font-bold text-slate-900 hover:text-[#0284c7] transition"
                            >
                              {post.authorName}
                            </Link>
                            <ProdiBadge prodi={post.authorProdi} />
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {post.authorRole} • Angkatan {post.authorAngkatan}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {post.timeAgo}
                          </p>
                        </div>
                      </div>

                      {/* CONNECT / FOLLOW BUTTON */}
                      <button
                        type="button"
                        onClick={() => handleToggleFollow(post.id)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                          isFollowingPostAuthor
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200/70'
                        }`}
                      >
                        {isFollowingPostAuthor ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Mengikuti</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" />
                            <span>+ Ikuti</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* POST CONTENT TEXT */}
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>

                    {/* HASHTAGS */}
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {post.hashtags.map(tag => (
                          <span
                            key={tag}
                            className="text-[11px] font-semibold text-[#0284c7] hover:underline cursor-pointer"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* MEDIA EMBED (YOUTUBE / IMAGE) */}
                    {post.mediaType === 'youtube' && videoId && (
                      <div className="space-y-2 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200">
                        <div className="relative aspect-video w-full bg-black">
                          <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            className="w-full h-full border-0"
                            title={post.mediaTitle || 'Showreel Video'}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
                          <span className="text-xs font-semibold truncate pr-3">{post.mediaTitle}</span>
                          <button
                            type="button"
                            onClick={() => setCinemaVideo({ videoId, title: post.mediaTitle || 'Showreel Alumni' })}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-[11px] font-semibold transition shrink-0 cursor-pointer"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Mode Bioskop</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {post.mediaType === 'image' && post.mediaUrl && (
                      <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-80 bg-slate-100 flex items-center justify-center">
                        <img 
                          src={post.mediaUrl} 
                          alt={post.mediaTitle || 'Foto Postingan'}
                          className="w-full h-full max-h-80 object-cover"
                        />
                      </div>
                    )}

                    {post.mediaType === 'pdf' && (
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-sky-50/60 border border-slate-200 hover:border-sky-200 transition group">
                        <div className="flex items-center gap-3.5 truncate pr-3">
                          <div className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-2xs">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div className="truncate text-left">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-[#0284c7] transition truncate">
                              {post.mediaTitle || 'Dokumen PDF Alumni'}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              Dokumen PDF • {post.mediaSize || 'Berkas Dokumen'}
                            </span>
                          </div>
                        </div>
                        {(() => {
                          const rawUrl = (post.mediaUrl || '').trim();
                          const isSafeRelative = rawUrl.startsWith('/') && !rawUrl.startsWith('//') && !rawUrl.startsWith('/\\');
                          const safeUrl = isSafeRelative ? rawUrl : (safeHttpUrl(rawUrl) || '#');
                          const isSafe = safeUrl !== '#';

                          return (
                            <a
                              href={safeUrl}
                              target={isSafe ? '_blank' : undefined}
                              rel="noopener noreferrer"
                              onClick={!isSafe ? (e) => e.preventDefault() : undefined}
                              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-sky-300 text-xs font-bold text-[#0284c7] shadow-2xs transition inline-flex items-center gap-1.5 shrink-0"
                            >
                              <span>Buka PDF</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          );
                        })()}
                      </div>
                    )}

                    {/* ACTION TOOLBAR: LIKE, COMMENT, SHARE */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-4">
                        {/* LIKE BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleToggleLike(post.id)}
                          className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition cursor-pointer ${
                            isPostLiked
                              ? 'text-rose-600 font-bold bg-rose-50'
                              : 'text-slate-600 hover:text-rose-600 hover:bg-slate-50'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isPostLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span>{post.likesCount} Suka</span>
                        </button>

                        {/* COMMENT BUTTON */}
                        <button
                          type="button"
                          onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !commentsOpen }))}
                          className="flex items-center gap-1.5 py-1 px-2 rounded-lg text-slate-600 hover:text-[#0284c7] hover:bg-slate-50 transition cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.comments.length} Komentar</span>
                        </button>
                      </div>

                      {/* SHARE BUTTON */}
                      <button
                        type="button"
                        onClick={() => setShareData({
                          title: `Postingan dari ${post.authorName} (Alumni STMM MMTC)`,
                          subtitle: post.content.slice(0, 100) + '...',
                          url: typeof window !== 'undefined' ? `${window.location.origin}/feed#${post.id}` : ''
                        })}
                        className="flex items-center gap-1.5 py-1 px-2 rounded-lg text-slate-600 hover:text-[#0284c7] hover:bg-slate-50 transition cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Bagikan</span>
                      </button>
                    </div>

                    {/* EXPANDABLE COMMENTS SECTION */}
                    {commentsOpen && (
                      <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
                        {/* LIST COMMENTS */}
                        {post.comments.map(c => (
                          <div key={c.id} className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-2xl">
                            <div className="w-7 h-7 rounded-xl bg-slate-200 overflow-hidden flex items-center justify-center font-bold text-[10px] text-slate-600 shrink-0">
                              {c.authorName.charAt(0)}
                            </div>
                            <div className="flex-1 space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-900">{c.authorName}</span>
                                <span className="text-[10px] text-slate-400">{c.timeAgo}</span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">{c.text}</p>
                            </div>
                          </div>
                        ))}

                        {/* INPUT ADD COMMENT */}
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="text"
                            value={commentInputs[post.id] || ''}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddComment(post.id);
                            }}
                            placeholder="Tulis tanggapan atau apresiasi..."
                            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddComment(post.id)}
                            disabled={!commentInputs[post.id]?.trim()}
                            className="p-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-40 text-white transition cursor-pointer"
                            title="Kirim Komentar"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>

          {/* ============================================================== */}
          {/* RIGHT SIDEBAR: REKOMENDASI ALUMNI & EVENTS (COL-SPAN 3)         */}
          {/* ============================================================== */}
          <div className="hidden lg:block lg:col-span-3 space-y-5 sticky top-24">
            
            {/* PEOPLE YOU MAY KNOW / SUGGESTED CONNECTIONS */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-[#0284c7]" />
                  Rekomendasi Alumni
                </h3>
              </div>

              <div className="space-y-3.5">
                {SUGGESTED_CONNECTIONS.map(person => {
                  const isConnected = connectedUsers[person.id];
                  return (
                    <div key={person.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-[#0284c7] text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {person.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 truncate">{person.name}</p>
                          <p className="text-[10px] text-[#0284c7] font-medium">{person.prodi} &apos;{person.angkatan.slice(2)}</p>
                          <p className="text-[10px] text-slate-400 truncate">{person.role}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleConnect(person.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 cursor-pointer ${
                          isConnected
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 hover:bg-[#0284c7] hover:text-white text-slate-700'
                        }`}
                      >
                        {isConnected ? 'Terhubung' : '+ Connect'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <Link
                  href="/open-to-work"
                  className="text-xs font-semibold text-[#0284c7] hover:underline inline-flex items-center gap-1"
                >
                  Lihat Semua Talenta Alumni ↗
                </Link>
              </div>
            </div>

            {/* UPCOMING MMTC EVENTS & WORKSHOPS */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#0284c7]" />
                Agenda &amp; Event Kampus
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#0284c7] font-bold">
                    <span>15 November 2026</span>
                    <span className="bg-sky-100 px-1.5 py-0.5 rounded text-sky-800">Screening</span>
                  </div>
                  <p className="font-bold text-slate-800 text-xs">MMTC Short Film Showcase 2026</p>
                  <p className="text-[11px] text-slate-500">Auditorium STMM MMTC Yogyakarta</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-emerald-700 font-bold">
                    <span>22 November 2026</span>
                    <span className="bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-800">Online</span>
                  </div>
                  <p className="font-bold text-slate-800 text-xs">Webinar: Karir Game &amp; 3D Engine</p>
                  <p className="text-[11px] text-slate-500">Sharing session bersama Alumni di Industri</p>
                </div>
              </div>
            </div>

            {/* FOOTER MINI LINKS */}
            <div className="text-[11px] text-slate-400 text-center space-y-1 p-2">
              <p>© 2026 STMM MMTC Yogyakarta AlumniHub</p>
              <p>Kementerian Komunikasi dan Digital RI</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* CINEMA LIGHTBOX MODAL */}
      <CinemaLightbox
        isOpen={Boolean(cinemaVideo)}
        onClose={() => setCinemaVideo(null)}
        title={cinemaVideo?.title || 'Showreel Alumni'}
        videoId={cinemaVideo?.videoId || ''}
      />

      {/* SHARE MODAL */}
      <ShareModal
        isOpen={Boolean(shareData)}
        onClose={() => setShareData(null)}
        title={shareData?.title || 'Beranda Alumni STMM MMTC'}
        subtitle={shareData?.subtitle}
        shareUrl={shareData?.url || ''}
      />
    </div>
  );
}
