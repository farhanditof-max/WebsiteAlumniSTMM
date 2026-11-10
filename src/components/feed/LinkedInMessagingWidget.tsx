'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Send, 
  ArrowLeft, 
  Circle, 
  X,
  SquarePen,
  MessageSquare,
  Users,
  Loader2
} from 'lucide-react';
import AlumniAvatar from '@/components/profile/AlumniAvatar';
import { useAuth } from '@/context/AuthContext';
import { 
  collection, 
  doc, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  arrayUnion,
  getDocs 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Message {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  targetUid?: string;
  name: string;
  prodi: string;
  role: string;
  avatar?: string;
  online: boolean;
  unreadCount?: number;
  lastMessage: string;
  lastTime: string;
  messages: Message[];
}

interface RegisteredAlumni {
  uid: string;
  namaLengkap: string;
  prodi?: string;
  angkatan?: string;
  fotoProfil?: string;
  pekerjaanSaatIni?: string;
  role?: string;
}

interface LinkedInMessagingWidgetProps {
  userAvatar?: string;
  userName?: string;
}

export default function LinkedInMessagingWidget({
  userAvatar: propAvatar,
  userName: propName
}: LinkedInMessagingWidgetProps = {}) {
  const { user, profile } = useAuth();
  const userName = propName || profile?.namaLengkap || user?.displayName || 'Alumni STMM';
  const userAvatar = propAvatar || profile?.fotoProfil || user?.photoURL;

  const [isOpen, setIsOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  // New Chat directory state
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [directoryUsers, setDirectoryUsers] = useState<RegisteredAlumni[]>([]);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');

  // 1. Real-time synchronization with Firestore collection 'conversations'
  useEffect(() => {
    if (!user?.uid) return;

    try {
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', user.uid)
      );

      const unsub = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) {
            setConversations([]);
            return;
          }

          const firestoreConvs: Conversation[] = snapshot.docs.map((d) => {
            const data = d.data();
            const participants = (data.participants as string[]) || [];
            const otherUid = participants.find((uid) => uid !== user.uid) || 'peer';
            const otherProfile = data.participantProfiles?.[otherUid] || {};

            const messages: Message[] = (data.messages || []).map(
              (m: { id?: string; senderUid?: string; text?: string; createdAt?: string }) => ({
                id: m.id || `m-${Date.now()}`,
                sender: m.senderUid === user.uid ? 'me' : 'them',
                text: m.text || '',
                time: m.createdAt
                  ? new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                  : 'Baru saja'
              })
            );

            return {
              id: d.id,
              targetUid: otherUid,
              name: otherProfile.namaLengkap || data.otherName || 'Alumni MMTC',
              prodi: otherProfile.prodi || data.otherProdi || 'STMM MMTC',
              role: otherProfile.role || data.otherRole || 'Alumni',
              avatar: otherProfile.fotoProfil || data.otherAvatar || undefined,
              online: true,
              unreadCount: 0,
              lastMessage: data.lastMessage || (messages[messages.length - 1]?.text || ''),
              lastTime: data.updatedAt
                ? new Date(data.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                : 'Baru saja',
              messages
            };
          });

          setConversations(firestoreConvs);
        },
        (error) => {
          console.warn('LinkedInMessagingWidget conversations listener fallback:', error);
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn('LinkedInMessagingWidget Firestore query error:', err);
    }
  }, [user?.uid]);

  // 2. Fetch registered alumni from public_profiles when New Chat view is opened
  const fetchDirectory = async () => {
    if (!user?.uid) return;
    setLoadingDirectory(true);
    try {
      const snap = await getDocs(collection(db, 'public_profiles'));
      const list: RegisteredAlumni[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        const uid = docSnap.id;
        if (uid !== user.uid) {
          list.push({
            uid,
            namaLengkap: d.namaLengkap || 'Alumni STMM',
            prodi: d.prodi || 'STMM MMTC',
            angkatan: d.angkatan || '',
            fotoProfil: d.fotoProfil || '',
            pekerjaanSaatIni: d.pekerjaanSaatIni || d.pekerjaan || 'Alumni'
          });
        }
      });
      setDirectoryUsers(list);
    } catch (err) {
      console.warn('Failed to load registered alumni directory for messaging:', err);
    } finally {
      setLoadingDirectory(false);
    }
  };

  const handleOpenNewChat = () => {
    setIsNewChatOpen(true);
    fetchDirectory();
  };

  // 3. Start or open chat with a specific alumnus
  const startChatWith = useCallback((alumni: RegisteredAlumni) => {
    if (!user?.uid || alumni.uid === user.uid) return;

    const convDocId = `conv_${[user.uid, alumni.uid].sort().join('_')}`;
    const existing = conversations.find(c => c.id === convDocId || c.targetUid === alumni.uid);

    if (!existing) {
      const newConv: Conversation = {
        id: convDocId,
        targetUid: alumni.uid,
        name: alumni.namaLengkap,
        prodi: alumni.prodi || 'Animasi',
        role: alumni.pekerjaanSaatIni || 'Alumni STMM MMTC',
        avatar: alumni.fotoProfil || undefined,
        online: true,
        unreadCount: 0,
        lastMessage: 'Mulai obrolan baru...',
        lastTime: 'Baru saja',
        messages: []
      };
      setConversations(prev => [newConv, ...prev.filter(c => c.id !== convDocId)]);
    }

    setActiveChatId(convDocId);
    setIsNewChatOpen(false);
    setIsOpen(true);
  }, [user, conversations]);

  // 4. Global window event listener to open chat from any component (e.g. Profil page)
  useEffect(() => {
    const handleOpenChatEvent = (e: Event) => {
      const customEvent = e as CustomEvent<RegisteredAlumni>;
      const target = customEvent.detail;
      if (!target || !target.uid || target.uid === user?.uid) return;
      startChatWith(target);
    };

    window.addEventListener('open-alumni-chat', handleOpenChatEvent);
    return () => window.removeEventListener('open-alumni-chat', handleOpenChatEvent);
  }, [user?.uid, startChatWith]);

  const activeConv = useMemo(() => {
    return conversations.find(c => c.id === activeChatId);
  }, [conversations, activeChatId]);

  const totalUnread = useMemo(() => {
    return conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);
  }, [conversations]);

  const handleSelectConv = (id: string) => {
    setActiveChatId(id);
    setIsNewChatOpen(false);
    setConversations(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, unreadCount: 0 };
      }
      return c;
    }));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !activeChatId || !user?.uid) return;

    const textToSend = inputMessage.trim();
    const nowIso = new Date().toISOString();
    const newMsgId = `m-${Date.now()}`;
    const newMsg: Message = {
      id: newMsgId,
      sender: 'me',
      text: textToSend,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    // Optimistic UI update
    setConversations(prev => prev.map(c => {
      if (c.id === activeChatId) {
        return {
          ...c,
          lastMessage: newMsg.text,
          lastTime: 'Baru saja',
          messages: [...c.messages, newMsg]
        };
      }
      return c;
    }));

    setInputMessage('');

    // Determine target UID
    const targetUid = activeConv?.targetUid || (
      activeChatId.startsWith('conv_')
        ? activeChatId.replace('conv_', '').split('_').find(id => id !== user.uid)
        : activeChatId
    );

    if (!targetUid) return;

    const convDocId = activeChatId.startsWith('conv_')
      ? activeChatId
      : `conv_${[user.uid, targetUid].sort().join('_')}`;

    const otherParty = activeConv ? {
      namaLengkap: activeConv.name,
      prodi: activeConv.prodi,
      fotoProfil: activeConv.avatar || '',
      role: activeConv.role
    } : {
      namaLengkap: 'Alumni MMTC',
      prodi: 'STMM MMTC',
      fotoProfil: '',
      role: 'Alumni'
    };

    try {
      await setDoc(doc(db, 'conversations', convDocId), {
        id: convDocId,
        participants: [user.uid, targetUid],
        participantProfiles: {
          [user.uid]: {
            namaLengkap: userName,
            prodi: profile?.prodi || 'Animasi',
            fotoProfil: userAvatar || '',
            role: profile?.pekerjaanSaatIni || 'Alumni STMM MMTC'
          },
          [targetUid]: otherParty
        },
        lastMessage: textToSend,
        updatedAt: nowIso,
        messages: arrayUnion({
          id: newMsgId,
          senderUid: user.uid,
          senderName: userName,
          text: textToSend,
          createdAt: nowIso
        })
      }, { merge: true });
    } catch (err) {
      console.warn('LinkedInMessagingWidget Firestore write warning:', err);
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.prodi.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDirectory = directoryUsers.filter(u =>
    u.namaLengkap.toLowerCase().includes(directorySearch.toLowerCase()) ||
    (u.prodi && u.prodi.toLowerCase().includes(directorySearch.toLowerCase())) ||
    (u.pekerjaanSaatIni && u.pekerjaanSaatIni.toLowerCase().includes(directorySearch.toLowerCase()))
  );

  return (
    <div 
      className={`fixed bottom-0 right-4 sm:right-6 z-40 w-80 sm:w-88 bg-white rounded-t-2xl shadow-2xl border border-slate-200 border-b-0 overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${
        isOpen ? 'h-[480px]' : 'h-13'
      }`}
    >
      {/* ============================================================== */}
      {/* WIDGET HEADER (ALWAYS VISIBLE, CLICK TO TOGGLE)                */}
      {/* ============================================================== */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="h-13 px-4 bg-white hover:bg-slate-50 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none transition shrink-0"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-sky-400 to-[#0284c7] text-white flex items-center justify-center font-bold text-xs shadow-2xs border border-white">
              <AlumniAvatar 
                src={userAvatar || undefined}
                name={userName}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <Circle className="w-2.5 h-2.5 fill-emerald-500 text-white absolute -bottom-0.5 -right-0.5" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              Pesan
            </span>
            {totalUnread > 0 && !isOpen && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
                {totalUnread}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400" onClick={(e) => e.stopPropagation()}>
          {isOpen && !isNewChatOpen && (
            <button
              type="button"
              onClick={handleOpenNewChat}
              className="p-1.5 rounded-lg hover:bg-sky-50 hover:text-[#0284c7] text-slate-500 transition cursor-pointer"
              title="Mulai Chat Baru"
            >
              <SquarePen className="w-4 h-4" />
            </button>
          )}
          <button 
            type="button" 
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-lg hover:bg-slate-100 hover:text-slate-600 transition"
            title={isOpen ? 'Tutup Pesan' : 'Buka Pesan'}
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* WIDGET CONTENT (VISIBLE WHEN EXPANDED)                         */}
      {/* ============================================================== */}
      {isOpen && (
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
          
          {/* VIEW A: NEW CHAT DIRECTORY PICKER */}
          {isNewChatOpen ? (
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              <div className="p-3 bg-white border-b border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewChatOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                  title="Kembali"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    placeholder="Cari nama alumni MMTC..."
                    className="w-full bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div className="p-2 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#0284c7]" />
                <span>Pilih Rekan Alumni Terdaftar</span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {loadingDirectory ? (
                  <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-[#0284c7]" />
                    <span>Memuat daftar alumni...</span>
                  </div>
                ) : filteredDirectory.length > 0 ? (
                  filteredDirectory.map((alumni) => (
                    <div
                      key={alumni.uid}
                      onClick={() => startChatWith(alumni)}
                      className="p-3 bg-white hover:bg-sky-50/60 transition cursor-pointer flex items-center gap-3 group"
                    >
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-tr from-sky-500 to-[#0284c7] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                          <AlumniAvatar src={alumni.fotoProfil} name={alumni.namaLengkap} />
                        </div>
                        <Circle className="w-2.5 h-2.5 fill-emerald-500 text-white absolute -bottom-0.5 -right-0.5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-[#0284c7] transition truncate">
                          {alumni.namaLengkap}
                        </p>
                        <p className="text-[10px] text-[#0284c7] font-semibold truncate">
                          {alumni.prodi} {alumni.angkatan ? `• Angkatan ${alumni.angkatan}` : ''}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {alumni.pekerjaanSaatIni || 'Alumni STMM MMTC'}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg bg-sky-50 text-[#0284c7] text-[10px] font-bold group-hover:bg-[#0284c7] group-hover:text-white transition shrink-0"
                      >
                        Pesan
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">
                    Tidak ada alumni ditemukan.
                  </div>
                )}
              </div>
            </div>
          ) : !activeConv ? (
            
            /* VIEW B: CONVERSATION LIST */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* SEARCH INPUT */}
              <div className="p-3 bg-white border-b border-slate-100 flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari obrolan alumni..."
                    className="w-full bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none"
                  />
                </div>
              </div>

              {/* CONVERSATION LIST */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {filteredConversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConv(conv.id)}
                    className="p-3.5 bg-white hover:bg-sky-50/50 transition cursor-pointer flex items-start gap-3 group"
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-tr from-sky-500 to-[#0284c7] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                        <AlumniAvatar src={conv.avatar} name={conv.name} />
                      </div>
                      {conv.online && (
                        <Circle className="w-2.5 h-2.5 fill-emerald-500 text-white absolute -bottom-0.5 -right-0.5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-[#0284c7] transition truncate">
                          {conv.name}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {conv.lastTime}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#0284c7] font-semibold truncate">
                        {conv.prodi}
                      </p>
                      <p className={`text-xs truncate mt-0.5 ${conv.unreadCount ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                        {conv.lastMessage}
                      </p>
                    </div>

                    {Boolean(conv.unreadCount) && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500 self-center shrink-0" />
                    )}
                  </div>
                ))}

                {filteredConversations.length === 0 && (
                  <div className="p-8 text-center flex flex-col items-center justify-center my-auto">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#0284c7] flex items-center justify-center mb-3 shadow-2xs">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 mb-1">
                      Belum Ada Pesan
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-[210px] leading-relaxed mb-4">
                      Obrolan masih kosong. Cari rekan alumni terdaftar untuk mulai terhubung dan bertukar pesan.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenNewChat}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <SquarePen className="w-3.5 h-3.5" />
                      <span>Mulai Chat Baru</span>
                    </button>
                  </div>
                )}
              </div>

              {/* FOOTER SHORTCUT */}
              <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 px-3">
                <span>Terhubung ke alumni MMTC</span>
                <button
                  type="button"
                  onClick={handleOpenNewChat}
                  className="font-bold text-[#0284c7] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <SquarePen className="w-3 h-3" />
                  <span>Chat Baru</span>
                </button>
              </div>
            </div>
          ) : (
            
            /* VIEW C: ACTIVE CHAT ROOM */
            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {/* CHAT HEADER */}
              <div className="px-3 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between shadow-2xs shrink-0">
                <div className="flex items-center gap-2 truncate">
                  <button
                    type="button"
                    onClick={() => setActiveChatId(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition cursor-pointer"
                    title="Kembali ke daftar pesan"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="relative shrink-0">
                    <div className="w-7 h-7 rounded-lg overflow-hidden bg-gradient-to-tr from-sky-500 to-[#0284c7] text-white flex items-center justify-center font-bold text-[10px]">
                      <AlumniAvatar src={activeConv.avatar} name={activeConv.name} />
                    </div>
                    {activeConv.online && (
                      <Circle className="w-2 h-2 fill-emerald-500 text-white absolute -bottom-0.5 -right-0.5" />
                    )}
                  </div>

                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 truncate leading-tight">
                      {activeConv.name}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium leading-tight">
                      {activeConv.online ? 'Aktif' : 'Offline'} • {activeConv.prodi}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveChatId(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* MESSAGES BUBBLE AREA */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50/50">
                {activeConv.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                    <p className="text-xs font-medium">Belum ada riwayat pesan.</p>
                    <p className="text-[10px] text-slate-400 mt-1">Kirim pesan pertama untuk menyapa {activeConv.name}!</p>
                  </div>
                ) : (
                  activeConv.messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] p-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                          msg.sender === 'me'
                            ? 'bg-[#0284c7] text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-slate-400 px-1 mt-0.5">
                        {msg.time}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* CHAT INPUT FORM */}
              <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-1.5 shrink-0">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSendMessage();
                  }}
                  placeholder="Ketik pesan..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0284c7] focus:bg-white transition"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim()}
                  className="p-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-40 text-white transition shadow-2xs cursor-pointer"
                  title="Kirim Pesan"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
