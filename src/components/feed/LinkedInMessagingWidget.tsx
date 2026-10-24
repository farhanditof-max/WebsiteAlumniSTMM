'use client';

import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Send, 
  ArrowLeft, 
  Circle, 
  X
} from 'lucide-react';
import AlumniAvatar from '@/components/profile/AlumniAvatar';

interface Message {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
}

interface Conversation {
  id: string;
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

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    name: 'Sarah Pradipta',
    prodi: 'Animasi',
    role: '3D Animator di Infinite Studios',
    online: true,
    unreadCount: 1,
    lastMessage: 'Boleh minta kontak WhatsApp-nya Bud buat diskusi rig Blender?',
    lastTime: '10m',
    messages: [
      { id: 'm1', sender: 'them', text: 'Halo Budi! Showreel rigging kamu di feed keren banget.', time: '14:20' },
      { id: 'm2', sender: 'me', text: 'Halo Sar! Makasih banyak ya, kemarin coba explore auto-rigging add-on.', time: '14:22' },
      { id: 'm3', sender: 'them', text: 'Boleh minta kontak WhatsApp-nya Bud buat diskusi rig Blender?', time: '14:25' }
    ]
  },
  {
    id: 'conv-2',
    name: 'Dimas Wicaksono',
    prodi: 'Matekstosi',
    role: 'Broadcast Director di MNC Media',
    online: true,
    unreadCount: 1,
    lastMessage: 'Halo Mas Budi, lowongan broadcast engineer di MNC masih buka ya.',
    lastTime: '1j',
    messages: [
      { id: 'm4', sender: 'them', text: 'Halo Mas Budi, lowongan broadcast engineer di MNC masih buka ya. Kalau ada alumni MMTC yang mau apply bisa langsung info saya.', time: '13:30' }
    ]
  },
  {
    id: 'conv-3',
    name: 'Rian Kusuma',
    prodi: 'Manaprod',
    role: 'Producer di Lumina Lab',
    online: false,
    lastMessage: 'Showreel kamu udah aku tonton, mantap banget visualnya!',
    lastTime: '1h',
    messages: [
      { id: 'm5', sender: 'them', text: 'Showreel kamu udah aku tonton, mantap banget visualnya!', time: 'Kemarin' },
      { id: 'm6', sender: 'me', text: 'Siap Mas Rian, terima kasih banyak apresiasinya!', time: 'Kemarin' }
    ]
  },
  {
    id: 'conv-4',
    name: 'Gilang Ramadhan',
    prodi: 'Game',
    role: 'Unity Gameplay Programmer',
    online: false,
    lastMessage: 'Thank you sudah baca GDD game indie kami!',
    lastTime: '2h',
    messages: [
      { id: 'm7', sender: 'them', text: 'Thank you sudah baca GDD game indie kami!', time: '2 hari lalu' }
    ]
  }
];

export default function LinkedInMessagingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [inputMessage, setInputMessage] = useState('');

  const activeConv = conversations.find(c => c.id === activeChatId);

  const totalUnread = conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);

  const handleSelectConv = (id: string) => {
    setActiveChatId(id);
    // Mark as read
    setConversations(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, unreadCount: 0 };
      }
      return c;
    }));
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !activeChatId) return;

    const newMsg: Message = {
      id: `m-${Date.now()}`,
      sender: 'me',
      text: inputMessage.trim(),
      time: 'Baru saja'
    };

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

    // Simulated short auto reply after 1.5s
    setTimeout(() => {
      const replyMsg: Message = {
        id: `reply-${Date.now()}`,
        sender: 'them',
        text: 'Siap Mas, terima kasih ya! Nanti kita sambung lagi diskusinya.',
        time: 'Baru saja'
      };

      setConversations(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return {
            ...c,
            lastMessage: replyMsg.text,
            lastTime: 'Baru saja',
            messages: [...c.messages, replyMsg]
          };
        }
        return c;
      }));
    }, 1500);
  };

  const filteredConversations = conversations.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.prodi.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div 
      className={`fixed bottom-0 right-4 sm:right-6 z-40 w-80 sm:w-88 bg-white rounded-t-2xl shadow-2xl border border-slate-200 border-b-0 overflow-hidden flex flex-col transition-all duration-300 ease-in-out ${
        isOpen ? 'h-[460px]' : 'h-13'
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
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-[#0284c7] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              P
            </div>
            <Circle className="w-2.5 h-2.5 fill-emerald-500 text-white absolute -bottom-0.5 -right-0.5" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              Pesan Alumni
            </span>
            {totalUnread > 0 && !isOpen && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs">
                {totalUnread}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 text-slate-400">
          <button 
            type="button" 
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
          
          {/* VIEW A: CONVERSATION LIST */}
          {!activeConv ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* SEARCH INPUT */}
              <div className="p-3 bg-white border-b border-slate-100">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
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
                  <div className="p-8 text-center text-xs text-slate-400">
                    Tidak ada percakapan ditemukan.
                  </div>
                )}
              </div>

              {/* FOOTER SHORTCUT */}
              <div className="p-2.5 bg-white border-t border-slate-100 text-center text-[11px] text-slate-400">
                <span>Terhubung langsung dengan alumni STMM MMTC</span>
              </div>
            </div>
          ) : (
            
            /* VIEW B: ACTIVE CHAT ROOM */
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
                      {activeConv.online ? 'Aktif sekarang' : 'Offline'} • {activeConv.prodi}
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
                {activeConv.messages.map(msg => (
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
                ))}
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
