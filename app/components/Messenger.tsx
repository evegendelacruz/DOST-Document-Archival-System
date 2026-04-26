'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserBasic {
  id: string;
  fullName: string;
  profileImageUrl: string | null;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: UserBasic;
}

interface Participant {
  userId: string;
  lastReadAt: string | null;
  user: UserBasic;
}

interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  updatedAt: string;
  participants: Participant[];
  messages: Message[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored)?.id ?? null : null;
  } catch { return null; }
}

function getConvName(conv: Conversation, meId: string): string {
  if (conv.isGroup && conv.name) return conv.name;
  const other = conv.participants.find(p => p.userId !== meId);
  return other?.user.fullName ?? 'Unknown';
}

function getConvAvatar(conv: Conversation, meId: string): string | null {
  if (conv.isGroup) return null;
  return conv.participants.find(p => p.userId !== meId)?.user.profileImageUrl ?? null;
}

function isConvUnread(conv: Conversation, meId: string): boolean {
  const lastMsg = conv.messages[0];
  if (!lastMsg || lastMsg.senderId === meId) return false;
  const me = conv.participants.find(p => p.userId === meId);
  if (!me?.lastReadAt) return true;
  return new Date(lastMsg.createdAt) > new Date(me.lastReadAt);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 36, isGroup = false, online = false }: {
  src?: string | null;
  name: string;
  size?: number;
  isGroup?: boolean;
  online?: boolean;
}) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {src ? (
        <img
          src={src}
          alt={name}
          className="rounded-full object-cover w-full h-full"
        />
      ) : (
        <div
          className="rounded-full bg-[#e4e6eb] flex items-center justify-center w-full h-full"
        >
          <Icon
            icon={isGroup ? 'mdi:account-group' : 'mdi:account'}
            width={size * 0.55}
            className="text-[#65676b]"
          />
        </div>
      )}
      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-[#31a24c]"
          style={{ width: size * 0.3, height: size * 0.3 }}
        />
      )}
    </div>
  );
}

// ─── Chat Window (Facebook Messenger style) ───────────────────────────────────

function ChatWindow({
  conv,
  meId,
  onClose,
  onMinimize,
  minimized,
}: {
  conv: Conversation;
  meId: string;
  onClose: () => void;
  onMinimize: () => void;
  minimized: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const name = getConvName(conv, meId);
  const avatar = getConvAvatar(conv, meId);
  const othersCount = messages.filter(m => m.senderId !== meId).length;

  useEffect(() => {
    if (!minimized) setLastSeenCount(othersCount);
  }, [minimized, othersCount]);

  const tabUnread = minimized ? Math.max(0, othersCount - lastSeenCount) : 0;

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conv.id}/messages`, {
        headers: { 'x-user-id': meId },
      });
      if (res.ok) setMessages(await res.json());
    } catch { /* silent */ }
  }, [conv.id, meId]);

  useEffect(() => {
    loadMessages();
    const t = setInterval(loadMessages, 2000);
    return () => clearInterval(t);
  }, [loadMessages]);

  useEffect(() => {
    if (!minimized && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, minimized]);

  useEffect(() => {
    if (!minimized) {
      fetch(`/api/conversations/${conv.id}/read`, {
        method: 'PATCH',
        headers: { 'x-user-id': meId },
      }).catch(() => {});
    }
  }, [conv.id, meId, minimized, messages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/conversations/${conv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': meId },
        body: JSON.stringify({ content: input.trim() }),
      });
      if (res.ok) { setInput(''); loadMessages(); }
    } catch { /* silent */ } finally { setSending(false); }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div
      className="flex flex-col bg-white rounded-t-2xl overflow-hidden"
      style={{
        width: 328,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
        border: '1px solid rgba(0,0,0,0.08)',
        borderBottom: 'none',
        animation: 'msgrSlideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <style>{`
        @keyframes msgrSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* ── Header ── */}
      <div
        className="flex items-center gap-2.5 px-3 py-2 cursor-pointer select-none"
        style={{ background: '#fff', borderBottom: minimized ? 'none' : '1px solid #e4e6eb' }}
        onClick={onMinimize}
      >
        <Avatar src={avatar} name={name} size={36} isGroup={conv.isGroup} online={!conv.isGroup} />

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-[#050505] truncate leading-tight">{name}</p>
          {!conv.isGroup && (
            <p className="text-[11px] text-[#31a24c] font-medium leading-tight">Active now</p>
          )}
        </div>

        {tabUnread > 0 && (
          <span className="min-w-[18px] h-[18px] bg-[#0084ff] rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 flex-shrink-0">
            {tabUnread > 9 ? '9+' : tabUnread}
          </span>
        )}

        <div className="flex items-center gap-0.5 flex-shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={onMinimize}
            className="w-7 h-7 rounded-full hover:bg-[#e4e6eb] flex items-center justify-center transition-colors text-[#65676b]"
            title={minimized ? 'Expand' : 'Minimise'}
          >
            <Icon icon={minimized ? 'mdi:chevron-up' : 'mdi:minus'} width={16} />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-[#e4e6eb] flex items-center justify-center transition-colors text-[#65676b]"
            title="Close"
          >
            <Icon icon="mdi:close" width={16} />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      {!minimized && (
        <>
          {/* Messages */}
          <div
            ref={scrollRef}
            className="overflow-y-auto px-3 py-2 space-y-1"
            style={{ height: 380, background: '#fff' }}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Avatar src={avatar} name={name} size={56} isGroup={conv.isGroup} />
                <p className="text-[13px] font-semibold text-[#050505]">{name}</p>
                <p className="text-[12px] text-[#65676b]">Say hi to start chatting! 👋</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderId === meId;
                const prevMsg = messages[idx - 1];
                const showAvatar = !isMe && (idx === 0 || prevMsg?.senderId !== msg.senderId);
                return (
                  <div key={msg.id} className={`flex items-end gap-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {!isMe && (
                      <div style={{ width: 28, flexShrink: 0 }}>
                        {showAvatar && (
                          <Avatar src={msg.sender.profileImageUrl} name={msg.sender.fullName} size={28} />
                        )}
                      </div>
                    )}
                    <div className="flex flex-col" style={{ maxWidth: '72%' }}>
                      {conv.isGroup && !isMe && showAvatar && (
                        <span className="text-[10px] text-[#65676b] font-semibold ml-1 mb-0.5">{msg.sender.fullName}</span>
                      )}
                      <div
                        className="px-3 py-2 text-[13px] break-words leading-snug"
                        style={{
                          borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          background: isMe ? '#0084ff' : '#e4e6eb',
                          color: isMe ? '#fff' : '#050505',
                          wordBreak: 'break-word',
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input row */}
          <div className="flex items-center gap-2 px-3 py-2" style={{ borderTop: '1px solid #e4e6eb' }}>
            <div className="flex-1 flex items-center bg-[#f0f2f5] rounded-full px-3 py-1.5 gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Aa"
                className="flex-1 bg-transparent text-[13px] text-[#050505] outline-none placeholder-[#65676b]"
                autoFocus
              />
            </div>
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                background: input.trim() ? '#0084ff' : 'transparent',
                color: input.trim() ? '#fff' : '#0084ff',
              }}
            >
              <Icon icon={input.trim() ? 'mdi:send' : 'mdi:thumb-up'} width={18} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Messenger ────────────────────────────────────────────────────────────

export default function Messenger() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allUsers, setAllUsers] = useState<UserBasic[]>([]);
  const [openChats, setOpenChats] = useState<Conversation[]>([]);
  const [minimized, setMinimized] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const [meId, setMeId] = useState<string | null>(null);

  useEffect(() => { setMeId(getCurrentUserId()); }, []);

  const loadConversations = useCallback(async () => {
    if (!meId) return;
    try {
      const res = await fetch('/api/conversations', { headers: { 'x-user-id': meId } });
      if (res.ok) setConversations(await res.json());
    } catch { /* silent */ }
  }, [meId]);

  useEffect(() => {
    if (!meId) return;
    loadConversations();
    const t = setInterval(loadConversations, 2000);
    return () => clearInterval(t);
  }, [loadConversations, meId]);

  useEffect(() => {
    if (!panelOpen || !meId) return;
    fetch('/api/users', { headers: { 'x-user-id': meId } })
      .then(r => r.ok ? r.json() : [])
      .then((data: UserBasic[]) => setAllUsers(data.filter(u => u.id !== meId)))
      .catch(() => {});
  }, [panelOpen, meId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const conv = (e as CustomEvent<Conversation>).detail;
      setConversations(prev => prev.find(c => c.id === conv.id) ? prev : [conv, ...prev]);
      setOpenChats(prev => {
        if (prev.find(c => c.id === conv.id)) return prev;
        return [...prev.slice(-2), conv];
      });
      setMinimized(prev => { const s = new Set(prev); s.delete(conv.id); return s; });
    };
    window.addEventListener('messenger-open-chat', handler);
    return () => window.removeEventListener('messenger-open-chat', handler);
  }, []);

  const openChat = (conv: Conversation) => {
    setOpenChats(prev => {
      if (prev.find(c => c.id === conv.id)) return prev;
      return [...prev.slice(-2), conv];
    });
    setMinimized(prev => { const s = new Set(prev); s.delete(conv.id); return s; });
    setPanelOpen(false);
  };

  const startDirect = async (userId: string) => {
    if (!meId) return;
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': meId },
        body: JSON.stringify({ participantIds: [userId], isGroup: false }),
      });
      if (res.ok) {
        const conv: Conversation = await res.json();
        setConversations(prev => prev.find(c => c.id === conv.id) ? prev : [conv, ...prev]);
        openChat(conv);
      }
    } catch { /* silent */ }
  };

  const createGroup = async () => {
    if (!meId || selectedUserIds.length < 2) return;
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': meId },
        body: JSON.stringify({ participantIds: selectedUserIds, isGroup: true, name: groupName || 'Group Chat' }),
      });
      if (res.ok) {
        const conv: Conversation = await res.json();
        setConversations(prev => [conv, ...prev]);
        setShowGroupForm(false);
        setSelectedUserIds([]);
        setGroupName('');
        openChat(conv);
      }
    } catch { /* silent */ }
  };

  const closeChat = (id: string) => {
    setOpenChats(prev => prev.filter(c => c.id !== id));
    setMinimized(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const toggleMinimize = (id: string) => {
    setMinimized(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const unread = meId ? conversations.filter(c => isConvUnread(c, meId)).length : 0;

  const filteredConvs = conversations.filter(c =>
    getConvName(c, meId ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = allUsers.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  if (!meId) return null;

  return (
    <div className="fixed bottom-0 right-0 z-[200] flex items-end gap-3 px-4 pb-0 pointer-events-none">

      {/* ── Open Chat Windows ─────────────────────────────────────────────── */}
      <div className="flex items-end gap-3 pointer-events-auto">
        {openChats.map(conv => (
          <ChatWindow
            key={conv.id}
            conv={conv}
            meId={meId}
            onClose={() => closeChat(conv.id)}
            onMinimize={() => toggleMinimize(conv.id)}
            minimized={minimized.has(conv.id)}
          />
        ))}
      </div>

      {/* ── Panel + Float Button ──────────────────────────────────────────── */}
      <div className="relative pointer-events-auto pb-4" ref={panelRef}>

        {/* Conversation panel */}
        {panelOpen && (
          <div
            className="absolute bottom-[calc(100%+8px)] right-0 bg-white rounded-2xl flex flex-col overflow-hidden"
            style={{
              width: 360,
              maxHeight: 540,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
              border: '1px solid rgba(0,0,0,0.08)',
              animation: 'msgrPanelIn 0.2s cubic-bezier(0.34,1.4,0.64,1)',
            }}
          >
            <style>{`
              @keyframes msgrPanelIn {
                from { opacity: 0; transform: scale(0.95) translateY(10px); transform-origin: bottom right; }
                to   { opacity: 1; transform: scale(1) translateY(0); transform-origin: bottom right; }
              }
            `}</style>

            {/* Panel header */}
            <div className="px-4 pt-4 pb-2 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[22px] font-bold text-[#050505]">Chats</h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setShowGroupForm(v => !v); setSearch(''); }}
                    title="New group chat"
                    className="w-9 h-9 rounded-full bg-[#e4e6eb] hover:bg-[#d8dadf] flex items-center justify-center transition-colors text-[#050505]"
                  >
                    <Icon icon="mdi:account-multiple-plus-outline" width={20} />
                  </button>
                  <button
                    onClick={() => setPanelOpen(false)}
                    className="w-9 h-9 rounded-full bg-[#e4e6eb] hover:bg-[#d8dadf] flex items-center justify-center transition-colors text-[#050505]"
                  >
                    <Icon icon="mdi:close" width={20} />
                  </button>
                </div>
              </div>

              {/* Search bar */}
              <div className="flex items-center gap-2 bg-[#f0f2f5] rounded-full px-3 py-2">
                <Icon icon="mdi:magnify" width={16} className="text-[#65676b] flex-shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search Messenger"
                  className="bg-transparent flex-1 text-[14px] outline-none text-[#050505] placeholder-[#65676b]"
                />
              </div>
            </div>

            {/* Group chat form */}
            {showGroupForm && (
              <div className="px-4 pb-3 border-b border-[#e4e6eb] flex-shrink-0">
                <p className="text-[12px] font-semibold text-[#65676b] mb-2 uppercase tracking-wide">New Group Chat</p>
                <input
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="Group name (optional)"
                  className="w-full text-[13px] px-3 py-2 rounded-lg border border-[#e4e6eb] focus:outline-none focus:border-[#0084ff] mb-2"
                />
                <p className="text-[11px] text-[#65676b] mb-1.5">Select 2 or more members:</p>
                <div className="max-h-[90px] overflow-y-auto space-y-0.5 mb-2">
                  {allUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-[#f0f2f5] px-2 py-1 rounded-lg">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(u.id)}
                        onChange={e =>
                          setSelectedUserIds(prev =>
                            e.target.checked ? [...prev, u.id] : prev.filter(x => x !== u.id)
                          )
                        }
                        className="w-4 h-4 accent-[#0084ff]"
                      />
                      <span className="text-[13px] text-[#050505]">{u.fullName}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={createGroup}
                  disabled={selectedUserIds.length < 2}
                  className="w-full text-[13px] font-semibold py-2 rounded-lg transition-colors"
                  style={{
                    background: selectedUserIds.length >= 2 ? '#0084ff' : '#e4e6eb',
                    color: selectedUserIds.length >= 2 ? '#fff' : '#65676b',
                  }}
                >
                  Create Group
                </button>
              </div>
            )}

            {/* Conversation list */}
            <div className="overflow-y-auto flex-1">
              {filteredConvs.length > 0 && (
                <div className="px-2 pt-1 pb-1">
                  {filteredConvs.map(conv => {
                    const cname = getConvName(conv, meId);
                    const cavatar = getConvAvatar(conv, meId);
                    const lastMsg = conv.messages[0];
                    const unreadConv = isConvUnread(conv, meId);
                    return (
                      <button
                        key={conv.id}
                        onClick={() => openChat(conv)}
                        className="w-full flex items-center gap-3 px-2 py-2 hover:bg-[#f0f2f5] rounded-xl transition-colors text-left"
                      >
                        <Avatar src={cavatar} name={cname} size={44} isGroup={conv.isGroup} online={!conv.isGroup} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-[14px] truncate leading-snug ${unreadConv ? 'font-bold text-[#050505]' : 'font-medium text-[#050505]'}`}>
                            {cname}
                          </p>
                          <div className="flex items-center gap-1">
                            {lastMsg && (
                              <p className={`text-[12px] truncate flex-1 ${unreadConv ? 'font-semibold text-[#050505]' : 'text-[#65676b]'}`}>
                                {lastMsg.senderId === meId ? 'You: ' : ''}{lastMsg.content}
                              </p>
                            )}
                            {lastMsg && (
                              <span className="text-[11px] text-[#65676b] flex-shrink-0">· {timeAgo(lastMsg.createdAt)}</span>
                            )}
                          </div>
                        </div>
                        {unreadConv && (
                          <div className="w-3 h-3 rounded-full bg-[#0084ff] flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* People when searching */}
              {search && filteredUsers.length > 0 && (
                <div className="px-2 pb-2">
                  <p className="px-2 py-1 text-[11px] font-semibold text-[#65676b] uppercase tracking-wide">People</p>
                  {filteredUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => startDirect(u.id)}
                      className="w-full flex items-center gap-3 px-2 py-2 hover:bg-[#f0f2f5] rounded-xl transition-colors text-left"
                    >
                      <Avatar src={u.profileImageUrl} name={u.fullName} size={44} online />
                      <span className="text-[14px] font-medium text-[#050505]">{u.fullName}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {filteredConvs.length === 0 && !search && (
                <div className="flex flex-col items-center justify-center py-12 px-6 gap-2">
                  <div className="w-16 h-16 rounded-full bg-[#f0f2f5] flex items-center justify-center mb-1">
                    <Icon icon="mdi:message-text-outline" width={32} className="text-[#65676b]" />
                  </div>
                  <p className="text-[14px] font-semibold text-[#050505]">Your chats</p>
                  <p className="text-[13px] text-[#65676b] text-center">
                    Search for someone to start chatting.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating button */}
        <button
          onClick={() => setPanelOpen(v => !v)}
          className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 relative"
          style={{ background: '#0084ff' }}
          title="Messenger"
        >
          <Icon icon="mdi:facebook-messenger" width={28} className="text-white" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 bg-red-500 rounded-full text-white text-[11px] font-bold flex items-center justify-center px-1 border-2 border-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
