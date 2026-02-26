'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';

// ─── Types ───────────────────────────────────────────────────────────────────

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
  messages: Message[]; // last message only, from list endpoint
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({ src, name, size = 10, isGroup = false }: {
  src?: string | null;
  name: string;
  size?: number;
  isGroup?: boolean;
}) {
  const cls = `w-${size} h-${size} rounded-full`;
  if (src) return <img src={src} alt={name} className={`${cls} object-cover`} />;
  return (
    <div className={`${cls} bg-cyan-100 flex items-center justify-center flex-shrink-0`}>
      <Icon
        icon={isGroup ? 'mdi:account-group' : 'mdi:account'}
        width={size * 2.2}
        className="text-cyan-600"
      />
    </div>
  );
}

// ─── Chat Window ─────────────────────────────────────────────────────────────

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
  const inputRef = useRef<HTMLInputElement>(null);

  const name = getConvName(conv, meId);
  const avatar = getConvAvatar(conv, meId);

  // Count messages from others (not sent by me)
  const othersCount = messages.filter(m => m.senderId !== meId).length;

  // While open, keep lastSeenCount in sync. While minimized, it stays frozen.
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
    } catch { /* network errors are silent */ }
  }, [conv.id, meId]);

  // Poll for new messages every 2 s
  useEffect(() => {
    loadMessages();
    const t = setInterval(loadMessages, 2000);
    return () => clearInterval(t);
  }, [loadMessages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (!minimized) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, minimized]);

  // Mark as read when window is open
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
      if (res.ok) {
        setInput('');
        loadMessages();
      }
    } catch { /* silent */ } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-col bg-white rounded-t-xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] border border-b-0 border-gray-200 w-[300px] overflow-hidden">
      {/* Header */}
      <div
        className={`flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 cursor-pointer select-none transition-colors ${
          tabUnread > 0 ? 'bg-cyan-50 hover:bg-cyan-100' : 'bg-white hover:bg-gray-50'
        }`}
        onClick={onMinimize}
      >
        <div className="relative">
          <Avatar src={avatar} name={name} size={8} isGroup={conv.isGroup} />
          {!conv.isGroup && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white" />
          )}
        </div>
        <span className={`flex-1 font-semibold text-sm truncate ${tabUnread > 0 ? 'text-cyan-600' : 'text-gray-800'}`}>
          {name}
        </span>
        {tabUnread > 0 && (
          <span className="min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-1 flex-shrink-0">
            {tabUnread > 9 ? '9+' : tabUnread}
          </span>
        )}
        <div className="flex items-center gap-0.5">
          <span className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors">
            <Icon icon={minimized ? 'mdi:chevron-up' : 'mdi:minus'} width={14} />
          </span>
          <button
            onClick={e => { e.stopPropagation(); onClose(); }}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1 transition-colors"
          >
            <Icon icon="mdi:close" width={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      {!minimized && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-1 h-[280px]">
            {messages.length === 0 ? (
              <p className="text-center text-gray-400 text-xs mt-10">No messages yet. Say hi! 👋</p>
            ) : (
              messages.map(msg => {
                const isMe = msg.senderId === meId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-1`}>
                    {!isMe && (
                      <Avatar src={msg.sender.profileImageUrl} name={msg.sender.fullName} size={6} />
                    )}
                    <div
                      className={`max-w-[75%] px-3 py-1.5 text-sm break-words ${
                        isMe
                          ? 'bg-cyan-500 text-white rounded-2xl rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm'
                      }`}
                    >
                      {conv.isGroup && !isMe && (
                        <p className="text-[10px] font-semibold text-cyan-600 mb-0.5">{msg.sender.fullName}</p>
                      )}
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Aa"
              className="flex-1 text-sm px-3 py-1.5 rounded-full border border-gray-200 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-200"
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className="text-cyan-500 hover:text-cyan-600 disabled:text-gray-300 transition-colors p-1 flex-shrink-0"
            >
              <Icon icon="mdi:send" width={20} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Messenger Component ─────────────────────────────────────────────────

export default function Messenger() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allUsers, setAllUsers] = useState<UserBasic[]>([]);
  const [openChats, setOpenChats] = useState<Conversation[]>([]); // full objects
  const [minimized, setMinimized] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  const [meId, setMeId] = useState<string | null>(null);

  useEffect(() => {
    setMeId(getCurrentUserId());
  }, []);

  // ── Fetch conversations (poll) ──────────────────────────────────────────────
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

  // ── Fetch all users when panel opens ───────────────────────────────────────
  useEffect(() => {
    if (!panelOpen || !meId) return;
    fetch('/api/users', { headers: { 'x-user-id': meId } })
      .then(r => r.ok ? r.json() : [])
      .then((data: UserBasic[]) => setAllUsers(data.filter(u => u.id !== meId)))
      .catch(() => {});
  }, [panelOpen, meId]);

  // ── Close panel on outside click ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Open a chat window triggered from the header MessengerDropdown ─────────
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

  // ── Open a chat window ─────────────────────────────────────────────────────
  const openChat = (conv: Conversation) => {
    setOpenChats(prev => {
      if (prev.find(c => c.id === conv.id)) return prev;
      return [...prev.slice(-2), conv]; // store full object — no lookup needed
    });
    setMinimized(prev => { const s = new Set(prev); s.delete(conv.id); return s; });
    setPanelOpen(false);
  };

  // ── Start direct chat ──────────────────────────────────────────────────────
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

  // ── Create group chat ──────────────────────────────────────────────────────
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

  // ── Derived state ──────────────────────────────────────────────────────────
  const unread = meId ? conversations.filter(c => isConvUnread(c, meId)).length : 0;


  const filteredConvs = conversations.filter(c =>
    getConvName(c, meId ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = allUsers.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  if (!meId) return null;

  return (
    <div className="fixed bottom-0 right-0 z-[200] flex items-end gap-2 px-4 pb-3 pointer-events-none">

      {/* ── Open Chat Windows (docked to footer row) ─────────────────────── */}
      <div className="flex items-end gap-2 pointer-events-auto">
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

      {/* ── Panel + Float Button ─────────────────────────────────────────── */}
      <div className="relative pointer-events-auto" ref={panelRef}>

        {/* Conversation panel — floats above the button */}
        {panelOpen && (
          <div className="absolute bottom-[calc(100%+10px)] right-0 w-[320px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[500px]">

            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-bold text-gray-900 text-base">Chats</h3>
              <div className="flex gap-0.5">
                <button
                  onClick={() => { setShowGroupForm(v => !v); setSearch(''); }}
                  title="New group"
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                >
                  <Icon icon="mdi:account-multiple-plus-outline" width={18} />
                </button>
                <button
                  onClick={() => setPanelOpen(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                >
                  <Icon icon="mdi:close" width={18} />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-3 py-2 flex-shrink-0">
              <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
                <Icon icon="mdi:magnify" width={16} className="text-gray-400 flex-shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search Messenger"
                  className="bg-transparent flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Group chat form */}
            {showGroupForm && (
              <div className="px-3 pb-3 border-b border-gray-100 flex-shrink-0">
                <p className="text-xs font-semibold text-gray-500 mb-2">New Group Chat</p>
                <input
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder="Group name (optional)"
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-cyan-400 mb-2"
                />
                <p className="text-[11px] text-gray-400 mb-1">Select 2 or more members:</p>
                <div className="max-h-[100px] overflow-y-auto space-y-0.5 mb-2">
                  {allUsers.map(u => (
                    <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(u.id)}
                        onChange={e =>
                          setSelectedUserIds(prev =>
                            e.target.checked ? [...prev, u.id] : prev.filter(x => x !== u.id)
                          )
                        }
                        className="accent-cyan-500 w-3.5 h-3.5"
                      />
                      <span className="text-xs text-gray-700">{u.fullName}</span>
                    </label>
                  ))}
                </div>
                <button
                  onClick={createGroup}
                  disabled={selectedUserIds.length < 2}
                  className="w-full text-xs bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-200 disabled:text-gray-400 text-white py-1.5 rounded-lg transition-colors font-semibold"
                >
                  Create Group
                </button>
              </div>
            )}

            {/* List */}
            <div className="overflow-y-auto flex-1">

              {/* Conversations */}
              {filteredConvs.map(conv => {
                const name = getConvName(conv, meId);
                const avatar = getConvAvatar(conv, meId);
                const lastMsg = conv.messages[0];
                const unreadConv = isConvUnread(conv, meId);

                return (
                  <button
                    key={conv.id}
                    onClick={() => openChat(conv)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex-shrink-0">
                      <Avatar src={avatar} name={name} size={10} isGroup={conv.isGroup} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${unreadConv ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {name}
                      </p>
                      {lastMsg && (
                        <p className={`text-xs truncate ${unreadConv ? 'font-semibold text-gray-700' : 'text-gray-400'}`}>
                          {lastMsg.senderId === meId ? 'You: ' : ''}{lastMsg.content}
                        </p>
                      )}
                    </div>
                    {unreadConv && <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 flex-shrink-0" />}
                  </button>
                );
              })}

              {/* People results when searching */}
              {search && filteredUsers.length > 0 && (
                <>
                  <p className="px-4 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">People</p>
                  {filteredUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => startDirect(u.id)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                    >
                      <Avatar src={u.profileImageUrl} name={u.fullName} size={10} />
                      <span className="text-sm text-gray-700">{u.fullName}</span>
                    </button>
                  ))}
                </>
              )}

              {/* Empty state */}
              {filteredConvs.length === 0 && !search && (
                <p className="text-center text-gray-400 text-sm py-10 px-4">
                  No conversations yet.<br />
                  <span className="text-xs">Search for someone to start chatting!</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Floating button — docked to footer */}
        <button
          onClick={() => setPanelOpen(v => !v)}
          className="w-14 h-14 rounded-full bg-cyan-500 hover:bg-cyan-600 shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 relative"
          title="Messenger"
        >
          <Icon icon="mdi:message-text" width={26} className="text-white" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 bg-red-500 rounded-full text-white text-[11px] font-bold flex items-center justify-center px-1">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
