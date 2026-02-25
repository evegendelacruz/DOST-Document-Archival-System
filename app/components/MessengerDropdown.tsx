'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';

// ─── Types (same shape as Messenger.tsx) ─────────────────────────────────────

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

export interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  updatedAt: string;
  participants: Participant[];
  messages: Message[];
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
  return conv.participants.find(p => p.userId !== meId)?.user.fullName ?? 'Unknown';
}

function getConvAvatar(conv: Conversation, meId: string): string | null {
  if (conv.isGroup) return null;
  return conv.participants.find(p => p.userId !== meId)?.user.profileImageUrl ?? null;
}

function isConvUnread(conv: Conversation, meId: string): boolean {
  const last = conv.messages[0];
  if (!last || last.senderId === meId) return false;
  const me = conv.participants.find(p => p.userId === meId);
  if (!me?.lastReadAt) return true;
  return new Date(last.createdAt) > new Date(me.lastReadAt);
}

// ─── Small avatar ─────────────────────────────────────────────────────────────

function Avatar({ src, name, isGroup = false }: { src?: string | null; name: string; isGroup?: boolean }) {
  if (src) return <img src={src} alt={name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />;
  return (
    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
      <Icon icon={isGroup ? 'mdi:account-group' : 'mdi:account'} width={22} className="text-cyan-600" />
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function MessengerDropdown() {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allUsers, setAllUsers] = useState<UserBasic[]>([]);
  const [search, setSearch] = useState('');
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [meId, setMeId] = useState<string | null>(null);

  useEffect(() => {
    setMeId(getCurrentUserId());
  }, []);

  // ── Poll conversations ────────────────────────────────────────────────────
  const loadConvs = useCallback(async () => {
    if (!meId) return;
    try {
      const res = await fetch('/api/conversations', { headers: { 'x-user-id': meId } });
      if (res.ok) setConversations(await res.json());
    } catch { /* silent */ }
  }, [meId]);

  useEffect(() => {
    if (!meId) return;
    loadConvs();
    const t = setInterval(loadConvs, 2000);
    return () => clearInterval(t);
  }, [loadConvs, meId]);

  // ── Load users when panel opens ───────────────────────────────────────────
  useEffect(() => {
    if (!open || !meId) return;
    fetch('/api/users', { headers: { 'x-user-id': meId } })
      .then(r => r.ok ? r.json() : [])
      .then((data: UserBasic[]) => setAllUsers(data.filter(u => u.id !== meId)))
      .catch(() => {});
  }, [open, meId]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Open a chat window via Messenger component ────────────────────────────
  const openChat = (conv: Conversation) => {
    window.dispatchEvent(new CustomEvent('messenger-open-chat', { detail: conv }));
    setOpen(false);
  };

  // ── Start direct chat ─────────────────────────────────────────────────────
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

  // ── Create group chat ─────────────────────────────────────────────────────
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

  // ── Derived ───────────────────────────────────────────────────────────────
  const unread = meId ? conversations.filter(c => isConvUnread(c, meId)).length : 0;

  const filteredConvs = conversations.filter(c =>
    getConvName(c, meId ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = allUsers.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={wrapperRef}>
      {/* ── Trigger button ──────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative flex items-center justify-center w-8 h-8 rounded-full text-gray-500 transition-all duration-300 hover:bg-accent hover:text-white hover:scale-115 hover:shadow-[0_4px_14px_rgba(0,174,239,0.4)] active:scale-90 active:transition-all active:duration-100"
        title="Messenger"
      >
        <Icon icon={open ? 'mdi:message-text' : 'mdi:message-text-outline'} width={24} height={24} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center px-0.5 leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ──────────────────────────────────────────────── */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[320px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[500px] z-[150]">

          {/* Header */}
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
                onClick={() => setOpen(false)}
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

          {/* Group form */}
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

          {/* Conversation list */}
          <div className="overflow-y-auto flex-1">
            {filteredConvs.map(conv => {
              const name = getConvName(conv, meId ?? '');
              const avatar = getConvAvatar(conv, meId ?? '');
              const lastMsg = conv.messages[0];
              const unreadConv = isConvUnread(conv, meId ?? '');

              return (
                <button
                  key={conv.id}
                  onClick={() => openChat(conv)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <Avatar src={avatar} name={name} isGroup={conv.isGroup} />
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

            {/* People section when searching */}
            {search && filteredUsers.length > 0 && (
              <>
                <p className="px-4 py-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">People</p>
                {filteredUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => startDirect(u.id)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Avatar src={u.profileImageUrl} name={u.fullName} />
                    <span className="text-sm text-gray-700">{u.fullName}</span>
                  </button>
                ))}
              </>
            )}

            {filteredConvs.length === 0 && !search && (
              <p className="text-center text-gray-400 text-sm py-10 px-4">
                No conversations yet.<br />
                <span className="text-xs">Search for someone to start chatting!</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
