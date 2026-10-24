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
  Send, 
  Sparkles, 
  Video, 
  Image as ImageIcon, 
  UserPlus, 
  Check, 
  Flame, 
  Hash, 
  Users, 
  Calendar, 
  Maximize2, 
  Briefcase
} from 'lucide-react';
import AlumniAvatar from '@/components/profile/AlumniAvatar';
import { OpenToWorkBadge, ProdiBadge } from '@/components/ui/Badge';
import { CinemaLightbox } from '@/components/ui/Modal';
import { ShareModal } from '@/components/ui/ShareModal';
import { parseYouTubeVideoId } from '@/lib/media';

interface CommentItem {
  id: string;
  authorName: string;
  authorProdi: string;
  authorAvatar?: string;
  text: string;
  timeAgo: string;
}

interface FeedPost {
  id: string;
  authorName: string;
  authorProdi: string;
  authorAngkatan: string;
  authorRole: string;
  authorAvatar?: string;
  nomorAlumni: string;
  timeAgo: string;
  category: 'showreel' | 'kolaborasi' | 'diskusi' | 'pencapaian';
  content: string;
  hashtags: string[];
  mediaType?: 'youtube' | 'image';
  mediaUrl?: string;
  mediaTitle?: string;
  likesCount: number;
  isLiked?: boolean;
  comments: CommentItem[];
  isFollowing?: boolean;
}

const INITIAL_POSTS: FeedPost[] = [
  {
    id: 'post-1',
    authorName: 'Sarah Pradipta',
    authorProdi: 'Animasi',
    authorAngkatan: '2020',
    authorRole: '3D Animator & Rigger di Infinite Studios',
    nomorAlumni: 'MMTC-2020-ANM-042',
    timeAgo: '2 jam yang lalu',
    category: 'showreel',
    content: 'Halo teman-teman alumni! Senang banget akhirnya bisa share breakdown showreel 3D Character Rigging & Animation yang kami kerjakan menggunakan Blender & Maya. Silakan tonton showreel-nya di bawah ya! Untuk teman-teman sesama alumni Animasi MMTC yang mau diskusi seputar pipeline game engine Unity / Unreal, let\'s connect! 🚀',
    hashtags: ['#AnimasiMMTC', '#Blender3D', '#CharacterRigging', '#Showreel2026'],
    mediaType: 'youtube',
    mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    mediaTitle: '3D Character Animation & Rigging Breakdown Reel 2026',
    likesCount: 42,
    isLiked: false,
    isFollowing: false,
    comments: [
      {
        id: 'c-1',
        authorName: 'Budi Santoso',
        authorProdi: 'Animasi',
        text: 'Keren banget rigging facials-nya Sar! Pake add-on Blender apa manual shape keys?',
        timeAgo: '1 jam yang lalu'
      },
      {
        id: 'c-2',
        authorName: 'Sarah Pradipta',
        authorProdi: 'Animasi',
        text: '@Budi Santoso Kombinasi Rigify custom rig sama corrective blend shapes manual Bud!',
        timeAgo: '45 menit yang lalu'
      }
    ]
  },
  {
    id: 'post-2',
    authorName: 'Dimas Wicaksono',
    authorProdi: 'Matekstosi',
    authorAngkatan: '2019',
    authorRole: 'Broadcast Technical Director di MNC Media Group',
    nomorAlumni: 'MMTC-2019-MTK-019',
    timeAgo: '5 jam yang lalu',
    category: 'pencapaian',
    content: 'Nostalgia memori saat masih praktikum di Studio TV STMM MMTC dulu, dari belajar switcher Blackmagic sampai sekarang handle Live Production OB Van multi-kamera di Jakarta. Proud to be part of MMTC Alumni! Buat adik-adik tingkat yang mau tanya-tanya seputar karir broadcast engineering, pintu selalu terbuka.',
    hashtags: ['#Broadcasting', '#StudioTVMMTC', '#BroadcastEngineering', '#MediaProduction'],
    mediaType: 'image',
    mediaUrl: '/kampus_stmm.jpg',
    mediaTitle: 'Studio Production & Campus Memories STMM MMTC',
    likesCount: 68,
    isLiked: true,
    isFollowing: true,
    comments: [
      {
        id: 'c-3',
        authorName: 'Rian Kusuma',
        authorProdi: 'Manaprod',
        text: 'Mantap Mas Dimas! Dulu switcher Studio 2 MMTC sering kita pakai bareng ya haha.',
        timeAgo: '3 jam yang lalu'
      }
    ]
  },
  {
    id: 'post-3',
    authorName: 'Rian Kusuma',
    authorProdi: 'Manaprod',
    authorAngkatan: '2021',
    authorRole: 'Producer & Director di Lumina Creative Lab',
    nomorAlumni: 'MMTC-2021-MNP-088',
    timeAgo: '1 hari yang lalu',
    category: 'kolaborasi',
    content: '🚨 [CALL FOR CREW / KOLABORASI ALUMNI]\nTim produksi kami sedang membutuhkan 1 orang Motion Graphic Artist & 1 Colorist (DaVinci Resolve) untuk proyek iklan komersil brand otomotif bulan depan (remote/hybrid Jogja-Jakarta). Fee profesional bersaing.\n\nAlumni yang berminat silakan komen atau langsung hubungi via profil!',
    hashtags: ['#KolaborasiMMTC', '#LokerKreatif', '#CariCrew', '#MotionGraphics'],
    likesCount: 31,
    isLiked: false,
    isFollowing: false,
    comments: [
      {
        id: 'c-4',
        authorName: 'Eka Pratama',
        authorProdi: 'Animasi',
        text: 'Minat Mas Rian! Portofolio showreel after effects saya ada di profil.',
        timeAgo: '20 jam yang lalu'
      }
    ]
  },
  {
    id: 'post-4',
    authorName: 'Anisa Rahmawati',
    authorProdi: 'Manarita',
    authorAngkatan: '2022',
    authorRole: 'News Presenter & Digital Journalist',
    nomorAlumni: 'MMTC-2022-MNR-014',
    timeAgo: '2 hari yang lalu',
    category: 'pencapaian',
    content: 'Alhamdulillah karya liputan dokumenter tim kami berhasil terpilih masuk nominasi Festival Film Pendek & Jurnalistik Mahasiswa 2026. Terima kasih banyak atas bimbingan para dosen dan ekosistem kampus STMM MMTC Yogyakarta yang selalu mengasah intuisi kami di lapangan. Maju terus pers kampus dan alumni MMTC!',
    hashtags: ['#ManaritaMMTC', '#JurnalismeKreatif', '#FestivalFilm', '#Dokumenter'],
    likesCount: 84,
    isLiked: false,
    isFollowing: false,
    comments: []
  }
];

const SUGGESTED_CONNECTIONS = [
  {
    id: 's-1',
    name: 'Gilang Ramadhan',
    prodi: 'Game',
    angkatan: '2021',
    role: 'Unity Gameplay Programmer',
    mutual: 8
  },
  {
    id: 's-2',
    name: 'Jessica Meliana',
    prodi: 'MIK',
    angkatan: '2020',
    role: 'Product Designer / UI UX',
    mutual: 14
  },
  {
    id: 's-3',
    name: 'Rahmat Hidayat',
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

export default function FeedPage() {
  const { user, profile } = useAuth();

  // Simulated logged-in user profile
  const currentUser = {
    name: profile?.namaLengkap || user?.displayName || 'Budi Santoso',
    prodi: profile?.prodi || 'Animasi',
    angkatan: profile?.angkatan || '2020',
    role: '3D Artist & Motion Designer',
    avatar: profile?.fotoProfil || ''
  };

  const [posts, setPosts] = useState<FeedPost[]>(INITIAL_POSTS);
  const [selectedFilter, setSelectedFilter] = useState<string>('semua');
  
  // Post Creator State
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'showreel' | 'kolaborasi' | 'diskusi' | 'pencapaian'>('diskusi');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState<'youtube' | 'image' | 'none'>('none');
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

  // Handlers
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setIsPosting(true);

    setTimeout(() => {
      const createdPost: FeedPost = {
        id: `post-${Date.now()}`,
        authorName: currentUser.name,
        authorProdi: currentUser.prodi,
        authorAngkatan: currentUser.angkatan,
        authorRole: currentUser.role,
        authorAvatar: currentUser.avatar,
        nomorAlumni: 'MMTC-2020-ANM-001',
        timeAgo: 'Baru saja',
        category: newCategory,
        content: newContent.trim(),
        hashtags: [`#AlumniMMTC`, `#${currentUser.prodi}MMTC`],
        mediaType: newMediaType !== 'none' ? newMediaType : undefined,
        mediaUrl: newMediaUrl.trim() || undefined,
        mediaTitle: newMediaType === 'youtube' ? 'Video Showreel' : undefined,
        likesCount: 1,
        isLiked: true,
        comments: []
      };

      setPosts([createdPost, ...posts]);
      setNewContent('');
      setNewMediaUrl('');
      setNewMediaType('none');
      setIsPosting(false);
      setPostAlert('🎉 Postingan Anda berhasil diterbitkan di Beranda Alumni!');
      setTimeout(() => setPostAlert(''), 4000);
    }, 400);
  };

  const handleToggleLike = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isCurrentlyLiked = post.isLiked;
        return {
          ...post,
          isLiked: !isCurrentlyLiked,
          likesCount: isCurrentlyLiked ? post.likesCount - 1 : post.likesCount + 1
        };
      }
      return post;
    }));
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const newComment: CommentItem = {
      id: `c-${Date.now()}`,
      authorName: currentUser.name,
      authorProdi: currentUser.prodi,
      text,
      timeAgo: 'Baru saja'
    };

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [...p.comments, newComment]
        };
      }
      return p;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    setExpandedComments(prev => ({ ...prev, [postId]: true }));
  };

  const handleToggleFollow = (authorKey: string) => {
    setFollowedAlumni(prev => ({
      ...prev,
      [authorKey]: !prev[authorKey]
    }));
  };

  const handleToggleConnect = (userId: string) => {
    setConnectedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const filteredPosts = posts.filter(post => {
    if (selectedFilter === 'semua') return true;
    return post.category === selectedFilter;
  });

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
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                Beranda &amp; Jejaring Sosial Alumni STMM MMTC
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500 text-white font-bold">
                  Community Feed
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Tempat alumni lintas angkatan saling berbagi showreel, update produksi, dan terhubung satu sama lain.
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
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs text-center space-y-4">
              <div className="relative mx-auto w-18 h-18 rounded-2xl overflow-hidden border-2 border-white shadow-xs bg-gradient-to-tr from-sky-500 to-[#0284c7] flex items-center justify-center text-white text-2xl font-bold">
                <AlumniAvatar src={currentUser.avatar} name={currentUser.name} />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">{currentUser.name}</h3>
                <p className="text-xs text-[#0284c7] font-semibold mt-0.5">
                  {currentUser.prodi} • Angkatan {currentUser.angkatan}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                  {currentUser.role}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-center">
                <OpenToWorkBadge />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/profil"
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-[#0284c7] border border-slate-200 text-xs font-semibold text-slate-700 transition"
                >
                  Edit Profil Saya
                </Link>
              </div>
            </div>

            {/* CATEGORY FILTER NAVIGATION */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-1 text-xs">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                Kategori Beranda
              </h4>
              
              {[
                { id: 'semua', label: 'Semua Postingan', icon: Sparkles },
                { id: 'showreel', label: '🎬 Karya & Showreel', icon: Video },
                { id: 'kolaborasi', label: '🤝 Cari Crew & Kolaborasi', icon: Users },
                { id: 'pencapaian', label: '🏆 Prestasi & Berita', icon: Flame },
                { id: 'diskusi', label: '💡 Tips & Diskusi', icon: MessageSquare },
              ].map(cat => {
                const IconComponent = cat.icon;
                const active = selectedFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedFilter(cat.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-semibold transition cursor-pointer text-left ${
                      active
                        ? 'bg-sky-50 text-[#0284c7] font-bold shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${active ? 'text-[#0284c7]' : 'text-slate-400'}`} />
                    <span>{cat.label}</span>
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
            
            {/* POST CREATOR CARD */}
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
              {newMediaType !== 'none' && (
                <div className="p-3 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    {newMediaType === 'youtube' ? 'Tautan Video YouTube (Showreel)' : 'URL Foto / Gambar BTS Syuting'}
                  </label>
                  <input
                    type="text"
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    placeholder={newMediaType === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://... atau paste link gambar'}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#0284c7]"
                  />
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
                    onClick={() => setNewMediaType(newMediaType === 'image' ? 'none' : 'image')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      newMediaType === 'image'
                        ? 'bg-sky-50 text-[#0284c7] border border-sky-200'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-[#0284c7]" />
                    <span>Foto BTS</span>
                  </button>

                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as 'showreel' | 'kolaborasi' | 'diskusi' | 'pencapaian')}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none"
                  >
                    <option value="diskusi">💡 Diskusi</option>
                    <option value="showreel">🎬 Showreel</option>
                    <option value="kolaborasi">🤝 Kolaborasi</option>
                    <option value="pencapaian">🏆 Prestasi</option>
                  </select>
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
                        <Link href={`/profil/${encodeURIComponent(post.nomorAlumni)}`} className="shrink-0">
                          <div className="w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-tr from-sky-500 to-[#0284c7] text-white flex items-center justify-center font-bold text-base shadow-2xs hover:opacity-90 transition">
                            <AlumniAvatar src={post.authorAvatar} name={post.authorName} />
                          </div>
                        </Link>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link 
                              href={`/profil/${encodeURIComponent(post.nomorAlumni)}`}
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
