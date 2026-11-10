'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Briefcase, 
  PlusCircle, 
  LogOut, 
  Menu, 
  X, 
  FileText, 
  User, 
  Compass, 
  Users,
  ChevronDown,
  Settings,
  Bell,
  Heart,
  MessageSquare,
  CheckCheck
} from 'lucide-react';
import AlumniAvatar from '@/components/profile/AlumniAvatar';
import { subscribeToFeedPosts } from '@/lib/feed';

interface ExtendedProfile {
  namaLengkap?: string;
  prodi?: string;
  angkatan?: string;
  fotoProfil?: string;
  pekerjaanSaatIni?: string;
}

interface NotificationItem {
  id: string;
  type: 'like' | 'comment' | 'job' | 'application';
  title: string;
  description: string;
  time: string;
  link: string;
  read: boolean;
  name?: string;
}

function formatRelativeTime(isoString?: string): string {
  if (!isoString) return 'Baru saja';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'Baru saja';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m lalu`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}j lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}h lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const mobileNotificationRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Real-time listener untuk notifikasi Like & Komentar pada postingan feed pengguna
  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    const currentUid = user.uid;

    const unsub = subscribeToFeedPosts((posts) => {
      // Cari postingan milik pengguna yang sedang login
      const myPosts = posts.filter(
        (p) => p.authorUid === currentUid || (profile?.nomorAlumni && p.nomorAlumni === profile.nomorAlumni)
      );

      const items: (NotificationItem & { timestamp: number })[] = [];

      // Baca status baca dari localStorage per user
      let readIds = new Set<string>();
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(`alumni_notif_read_${currentUid}`);
          if (raw) readIds = new Set(JSON.parse(raw));
        } catch {
          // ignore
        }
      }

      myPosts.forEach((post) => {
        // 1. Notifikasi Komentar dari alumni lain
        (post.comments || []).forEach((c) => {
          if (c.authorUid && c.authorUid !== currentUid) {
            const commentText = (c.text || (c as unknown as { content?: string }).content || '').trim();
            const notifId = `comment_${c.id || c.createdAt}`;
            const timeMs = c.createdAt ? new Date(c.createdAt).getTime() : Date.now();
            items.push({
              id: notifId,
              type: 'comment',
              title: `${c.authorName || 'Alumni MMTC'} mengomentari postingan Anda`,
              description: commentText ? `"${commentText}"` : `Pada postingan "${post.content.slice(0, 45)}..."`,
              time: formatRelativeTime(c.createdAt),
              link: '/feed',
              read: readIds.has(notifId),
              name: c.authorName,
              timestamp: timeMs
            });
          }
        });

        // 2. Notifikasi Like dari alumni lain
        (post.likedBy || []).forEach((likerUid) => {
          if (likerUid !== currentUid) {
            const notifId = `like_${post.id}_${likerUid}`;
            // Cari nama pemberi like dari riwayat komentar atau alias akun terdaftar
            const commenter = (post.comments || []).find((c) => c.authorUid === likerUid);
            const likerName = commenter?.authorName 
              || (likerUid === 'FvCOX2jZf8ZmL8nQyUrWR8g6UAg1' ? 'Maydian Goklas Pratama Simanjuntak' : 'Seorang alumni');
            const timeMs = post.updatedAt 
              ? new Date(post.updatedAt).getTime() 
              : (post.createdAt ? new Date(post.createdAt).getTime() : Date.now());
            items.push({
              id: notifId,
              type: 'like',
              title: `${likerName} menyukai postingan Anda`,
              description: `"${post.content.slice(0, 50)}${post.content.length > 50 ? '...' : ''}"`,
              time: formatRelativeTime(post.updatedAt || post.createdAt),
              link: '/feed',
              read: readIds.has(notifId),
              name: likerName,
              timestamp: timeMs
            });
          }
        });
      });

      // Urutkan notifikasi terbaru paling atas
      items.sort((a, b) => b.timestamp - a.timestamp);

      setNotifications(items);
    });

    return () => unsub();
  }, [user?.uid, profile?.nomorAlumni]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (typeof window !== 'undefined' && user?.uid) {
      try {
        const allIds = notifications.map((n) => n.id);
        localStorage.setItem(`alumni_notif_read_${user.uid}`, JSON.stringify(allIds));
      } catch {
        // ignore
      }
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    );
    if (typeof window !== 'undefined' && user?.uid) {
      try {
        const currentRead: string[] = JSON.parse(localStorage.getItem(`alumni_notif_read_${user.uid}`) || '[]');
        if (!currentRead.includes(item.id)) {
          localStorage.setItem(`alumni_notif_read_${user.uid}`, JSON.stringify([...currentRead, item.id]));
        }
      } catch {
        // ignore
      }
    }
    setNotificationOpen(false);
    router.push(item.link);
  };

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setProfileDropdownOpen(false);
      }
      if (
        notificationRef.current && !notificationRef.current.contains(target) &&
        (!mobileNotificationRef.current || !mobileNotificationRef.current.contains(target))
      ) {
        setNotificationOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const demoStorageRaw = React.useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {};
      window.addEventListener('storage', onStoreChange);
      window.addEventListener('alumnihub_profile_updated', onStoreChange);
      return () => {
        window.removeEventListener('storage', onStoreChange);
        window.removeEventListener('alumnihub_profile_updated', onStoreChange);
      };
    },
    () => (typeof window !== 'undefined' ? localStorage.getItem('mmtc_demo_profile') : null),
    () => null
  );

  const demoStorageProfile = React.useMemo<ExtendedProfile | null>(() => {
    if (!demoStorageRaw) return null;
    try {
      return JSON.parse(demoStorageRaw) as ExtendedProfile;
    } catch {
      return null;
    }
  }, [demoStorageRaw]);

  // User login state (hanya aktif jika user benar-benar login)
  const effectiveUser = user;
  const displayProfile: ExtendedProfile | null = profile 
    ? (profile as unknown as ExtendedProfile)
    : (user && demoStorageProfile ? demoStorageProfile : null);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const renderNotificationDropdownContent = () => (
    <>
      {/* Notification Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-slate-900">Notifikasi</h4>
          {unreadCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-[#0284c7]">
              {unreadCount} Baru
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
              Semua dibaca
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="text-[11px] font-bold text-[#0284c7] hover:text-[#0369a1] hover:underline flex items-center gap-1 transition cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Tandai dibaca</span>
          </button>
        )}
      </div>

      {/* Notification Items List */}
      <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-50">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Belum ada notifikasi baru untukmu.
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition select-none ${
                !item.read ? 'bg-sky-50/40' : 'bg-white'
              }`}
            >
              {/* Notification Category Icon */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                item.type === 'like' ? 'bg-rose-50 border-rose-100 text-rose-500' :
                item.type === 'comment' ? 'bg-sky-50 border-sky-100 text-sky-600' :
                item.type === 'job' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                'bg-emerald-50 border-emerald-100 text-emerald-600'
              }`}>
                {item.type === 'like' && <Heart className="w-4 h-4 fill-rose-500" />}
                {item.type === 'comment' && <MessageSquare className="w-4 h-4" />}
                {item.type === 'job' && <Briefcase className="w-4 h-4" />}
                {item.type === 'application' && <FileText className="w-4 h-4" />}
              </div>

              {/* Notification Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <p className={`text-xs leading-snug ${!item.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                    {item.title}
                  </p>
                  {!item.read && (
                    <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
                  {item.description}
                </p>
                <p className="text-[10px] text-slate-400 font-medium mt-1">
                  {item.time}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notification Footer Link */}
      <div className="p-2 border-t border-slate-100 bg-slate-50/60">
        <button
          type="button"
          onClick={() => {
            setNotificationOpen(false);
            router.push('/feed');
          }}
          className="w-full py-1.5 text-center text-xs font-bold text-[#0284c7] hover:text-[#0369a1] hover:underline cursor-pointer"
        >
          Lihat Semua Aktivitas di Linimasa &rarr;
        </button>
      </div>
    </>
  );

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-sky-100 text-slate-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[64px] sm:min-h-[68px] py-2">
          
          {/* Brand Logo - Official AlumniHub Graphic (-10px to h-[52px] sm:h-[57px]) */}
          <Link href="/" className="flex items-center group focus:outline-none py-0.5 shrink-0">
            <img 
              src="/logo_alumnihub.png" 
              alt="AlumniHub Sekolah Tinggi Multi Media" 
              className="h-[38px] sm:h-[42px] w-auto object-contain group-hover:opacity-90 transition-opacity"
            />
          </Link>

          {/* Desktop Navigation - Clean Text Navigation without pill containers */}
          <div className="hidden md:flex items-center gap-6 lg:gap-8 h-9">
            <Link 
              href="/" 
              className={`text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                pathname === '/' 
                  ? 'text-[#0284c7] font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className={`w-4 h-4 ${pathname === '/' ? 'text-[#0284c7]' : 'text-slate-400'}`} />
              <span>Beranda</span>
            </Link>

            <Link 
              href="/feed" 
              className={`text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive('/feed') || isActive('/beranda')
                  ? 'text-[#0284c7] font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className={`w-4 h-4 ${isActive('/feed') || isActive('/beranda') ? 'text-[#0284c7]' : 'text-slate-400'}`} />
              <span>Feed</span>
            </Link>

            <Link 
              href="/lowongan" 
              className={`text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive('/lowongan') 
                  ? 'text-[#0284c7] font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className={`w-4 h-4 ${isActive('/lowongan') ? 'text-[#0284c7]' : 'text-slate-400'}`} />
              <span>Lowongan</span>
            </Link>

            <Link 
              href="/open-to-work" 
              className={`text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive('/open-to-work') 
                  ? 'text-emerald-600 font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Open to Work</span>
            </Link>
          </div>

          {/* User Profile / Auth CTA */}
          <div className="hidden md:flex items-center gap-2.5">
            {effectiveUser ? (
              <div className="flex items-center gap-2">
                {/* Notification Bell Trigger & Dropdown Popover */}
                <div className="relative" ref={notificationRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationOpen(!notificationOpen);
                      setProfileDropdownOpen(false);
                    }}
                    className={`relative w-9 h-9 rounded-xl transition-colors cursor-pointer select-none flex items-center justify-center ${
                      notificationOpen
                        ? 'text-[#0284c7]'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                    }`}
                    aria-label="Lihat Notifikasi"
                    aria-expanded={notificationOpen}
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Desktop Notification Popover */}
                  {notificationOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-[380px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 py-1 z-50 animate-fade-in overflow-hidden">
                      {renderNotificationDropdownContent()}
                    </div>
                  )}
                </div>

                {/* Profile Trigger Button & Dropdown Popover */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className={`flex items-center gap-2 h-9 px-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer select-none ${
                      profileDropdownOpen || isActive('/profil')
                        ? 'text-[#0284c7] font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    aria-expanded={profileDropdownOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-400 to-[#0284c7] text-white flex items-center justify-center text-xs font-bold overflow-hidden shadow-2xs">
                      <AlumniAvatar src={displayProfile?.fotoProfil} name={displayProfile?.namaLengkap} />
                    </div>
                    <span className="hidden lg:inline leading-none">
                      Me
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180 text-[#0284c7]' : ''}`} />
                  </button>

                  {/* LinkedIn-style Profile Menu Dropdown */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-[350px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-fade-in overflow-hidden">
                      {/* USER PROFILE SUMMARY CARD (LEGA & PROPORSI ELEGAN) */}
                      <div className="p-5 border-b border-slate-100 space-y-4">
                        <div className="flex items-start gap-3.5">
                          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-tr from-sky-400 to-[#0284c7] text-white flex items-center justify-center text-xl font-bold shadow-xs ring-4 ring-sky-50 shrink-0 border border-slate-100">
                            <AlumniAvatar src={displayProfile?.fotoProfil} name={displayProfile?.namaLengkap} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-base font-bold text-slate-900 leading-snug truncate">
                              {displayProfile?.namaLengkap || 'Dary Halim'}
                            </h4>
                            <p className="text-xs text-slate-600 font-medium leading-relaxed mt-0.5 line-clamp-2">
                              {displayProfile?.pekerjaanSaatIni || `${displayProfile?.prodi || 'Animasi'} • Angkatan ${displayProfile?.angkatan || '2020'}`}
                            </p>
                            <p className="text-[11px] font-semibold text-[#0087cc] mt-1 flex items-center gap-1.5">
                              <span>{displayProfile?.prodi || 'Animasi'} MMTC</span>
                              <span className="text-slate-300">•</span>
                              <span>Angkatan {displayProfile?.angkatan || '2020'}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* SECTION: AKUN */}
                      <div className="py-2 px-3 border-b border-slate-100">
                        <p className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Akun
                        </p>
                        <Link
                          href="/profil"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>Setting Profil &amp; Privasi</span>
                        </Link>
                        <Link
                          href="/open-to-work"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                        >
                          <div className="flex items-center gap-3">
                            <Briefcase className="w-4 h-4 text-slate-400" />
                            <span>Status Open to Work</span>
                          </div>
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-2xs" />
                        </Link>
                      </div>

                      {/* SECTION: KELOLA */}
                      <div className="py-2 px-3 border-b border-slate-100">
                        <p className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Kelola
                        </p>
                        <Link
                          href="/aktivitas"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                        >
                          <Users className="w-4 h-4 text-slate-400" />
                          <span>Kelola Postingan &amp; Aktivitas</span>
                        </Link>
                        <Link
                          href="/lamaran"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                        >
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span>Status Lamaran Terkirim</span>
                        </Link>
                        <Link
                          href="/post-lowongan"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                        >
                          <Briefcase className="w-4 h-4 text-slate-400" />
                          <span>Pasang Lowongan Kerja</span>
                        </Link>
                      </div>

                      {/* SECTION: SIGN OUT / KELUAR (SELALU MUNCUL) */}
                      <div className="p-3 bg-slate-50/60 border-t border-slate-100 space-y-2">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            if (user) {
                              logout();
                            } else {
                              router.push('/login');
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 transition shadow-2xs cursor-pointer active:scale-[0.99]"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Keluar (Sign Out)</span>
                        </button>

                        {!user && (
                          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
                            <span>Mode Pratinjau Demo</span>
                            <Link
                              href="/login"
                              onClick={() => setProfileDropdownOpen(false)}
                              className="font-bold text-[#0284c7] hover:underline"
                            >
                              Masuk Akun Riil
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link 
                  href="/login" 
                  className="text-sm font-bold text-slate-700 hover:text-[#0284c7] px-4 py-2.5 rounded-xl hover:bg-slate-50 transition"
                >
                  Masuk
                </Link>
                <Link 
                  href="/register" 
                  className="text-sm font-bold px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-[#0284c7] hover:from-sky-600 hover:to-[#0369a1] text-white shadow-md shadow-sky-500/25 transition active:scale-[0.98]"
                >
                  Daftar Alumni
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Actions: Notification Bell + Menu Toggle */}
          <div className="md:hidden flex items-center gap-2">
            {effectiveUser && (
              <div className="relative" ref={mobileNotificationRef}>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationOpen(!notificationOpen);
                    setMobileMenuOpen(false);
                  }}
                  className={`relative p-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer ${
                    notificationOpen
                      ? 'text-[#0284c7]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                  }`}
                  aria-label="Notifikasi"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Mobile Notification Popover */}
                {notificationOpen && (
                  <div className="fixed inset-x-3 top-[76px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 py-1 z-50 animate-fade-in overflow-hidden max-h-[75vh] flex flex-col">
                    {renderNotificationDropdownContent()}
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                setNotificationOpen(false);
              }}
              className="p-2.5 rounded-2xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-sky-100 px-4 pt-3 pb-6 space-y-2 animate-fade-in shadow-lg">
          <Link 
            href="/" 
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium transition ${
              pathname === '/' ? 'bg-sky-50 text-[#0284c7] font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4 text-slate-400" />
            Beranda
          </Link>
          <Link 
            href="/feed" 
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium transition ${
              isActive('/feed') || isActive('/beranda') ? 'bg-sky-50 text-[#0284c7] font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 text-[#0284c7]" />
            Feed Alumni
          </Link>
          <Link 
            href="/lowongan" 
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium transition ${
              isActive('/lowongan') ? 'bg-sky-50 text-[#0284c7] font-bold' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-4 h-4 text-[#0284c7]" />
            Lowongan Kerja
          </Link>
          <Link 
            href="/open-to-work" 
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition ${
              isActive('/open-to-work') ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200' : 'text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Open to Work (Katalog Talenta)
            </span>
          </Link>

          {effectiveUser ? (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <Link 
                href="/post-lowongan" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                Pasang Lowongan
              </Link>
              <Link 
                href="/lamaran" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <FileText className="w-4 h-4 text-amber-600" />
                Lamaran Saya
              </Link>
              <Link 
                href="/profil" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold bg-sky-50 text-[#0284c7] border border-sky-100"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#0284c7] text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                    <AlumniAvatar src={displayProfile?.fotoProfil} name={displayProfile?.namaLengkap} />
                  </div>
                  <span>Setting Profil ({displayProfile?.namaLengkap || 'Alumni'})</span>
                </div>
                <User className="w-4 h-4" />
              </Link>
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 rounded-2xl transition"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              ) : null}
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link 
                href="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl border border-slate-200 text-slate-800 font-bold hover:bg-slate-50 text-sm transition"
              >
                Masuk
              </Link>
              <Link 
                href="/register" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-xl bg-gradient-to-r from-sky-500 to-[#0284c7] text-white font-bold text-sm shadow-md shadow-sky-500/25 transition"
              >
                Daftar Alumni
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
