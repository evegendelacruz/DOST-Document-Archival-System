'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import DashboardLayout from '../components/DashboardLayout';

interface DbConfig {
  activeDb: 'cloud' | 'local';
  lastSync: string | null;
  lastSyncDirection: string | null;
}

interface SyncResult {
  users: number;
  setupProjects: number;
  projectDocuments: number;
  cestProjects: number;
  cestDocuments: number;
  mapPins: number;
  calendarEvents: number;
  archivalRecords: number;
  conversations: number;
  messages: number;
  notifications: number;
  provinces: number;
  municipalities: number;
  barangays: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<DbConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Switch state
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState('');

  // Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncDone, setSyncDone] = useState(false);
  const [syncError, setSyncError] = useState('');

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/db-config');
      if (res.ok) setConfig(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) { router.replace('/'); return; }
      const { role } = JSON.parse(stored);
      if (role !== 'ADMIN') { router.replace('/dashboard'); return; }
    } catch { router.replace('/'); return; }
    fetchConfig();
  }, [fetchConfig, router]);

  const handleSwitch = async (newDb: 'cloud' | 'local') => {
    if (!config || switching || newDb === config.activeDb) return;
    setSwitching(true);
    setSwitchError('');
    try {
      const res = await fetch('/api/db-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeDb: newDb }),
      });
      if (!res.ok) throw new Error('Failed to switch database');
      setConfig(prev => prev ? { ...prev, activeDb: newDb } : prev);
    } catch (e: unknown) {
      setSwitchError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSwitching(false);
    }
  };

  const handleSync = async (from: 'cloud' | 'local', to: 'cloud' | 'local') => {
    if (syncing) return;
    setSyncing(true);
    setSyncResult(null);
    setSyncDone(false);
    setSyncError('');
    try {
      const res = await fetch('/api/db-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      setSyncResult(data.synced);
      setSyncDone(true);
      setConfig(prev => prev ? { ...prev, lastSync: data.lastSync, lastSyncDirection: data.direction } : prev);
      setTimeout(() => setSyncDone(false), 6000);
    } catch (e: unknown) {
      setSyncError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout activePath="/settings">
        <div className="flex items-center justify-center h-64">
          <Icon icon="mdi:loading" width={32} height={32} className="animate-spin text-[#00AEEF]" />
        </div>
      </DashboardLayout>
    );
  }

  const isCloud = config?.activeDb === 'cloud';
  const isLocal = config?.activeDb === 'local';
  const busy = switching || syncing;

  return (
    <DashboardLayout activePath="/settings">
      <div className="max-w-2xl mx-auto py-8 px-4">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1a2233] m-0">Settings</h1>
          <p className="text-[#888] text-sm mt-1">Admin-only system configuration</p>
        </div>

        {/* ── Database Card ── */}
        <div className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.08)] overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-[#f0f0f0] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#e8f4fd] flex items-center justify-center">
              <Icon icon="mdi:database" width={20} height={20} color="#00AEEF" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1a2233] m-0">Database</h2>
              <p className="text-[12px] text-[#999] m-0">Switch active database or sync data between them</p>
            </div>
          </div>

          <div className="p-6">

            {/* ── DB Selector Cards ── */}
            <p className="text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-3">Active Database</p>
            <div className="grid grid-cols-2 gap-4 mb-5">

              {/* Local */}
              <button
                onClick={() => handleSwitch('local')}
                disabled={busy || isLocal}
                className={`relative rounded-xl border-2 p-5 text-left transition-all duration-200 ${
                  isLocal
                    ? 'border-[#00AEEF] bg-[#f0faff] cursor-default'
                    : busy
                    ? 'border-[#e8e8e8] bg-[#fafafa] cursor-not-allowed opacity-60'
                    : 'border-[#e8e8e8] bg-white hover:border-[#00AEEF]/60 hover:bg-[#f9feff] cursor-pointer'
                }`}
              >
                {isLocal && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-[#00AEEF] bg-[#e0f5ff] px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00AEEF] animate-pulse inline-block" />
                    ACTIVE
                  </span>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLocal ? 'bg-[#00AEEF]' : 'bg-[#f0f0f0]'}`}>
                    <Icon icon="mdi:server" width={22} height={22} color={isLocal ? 'white' : '#999'} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#1a2233] m-0">Local PostgreSQL</p>
                    <p className="text-[11px] text-[#888] m-0">localhost:5432</p>
                  </div>
                </div>
                <p className="text-[11px] text-[#aaa] m-0">Offline · Fast · Development</p>
                {!isLocal && !busy && (
                  <p className="text-[10px] text-[#00AEEF] mt-2 m-0 font-medium">Click to switch →</p>
                )}
              </button>

              {/* Cloud */}
              <button
                onClick={() => handleSwitch('cloud')}
                disabled={busy || isCloud}
                className={`relative rounded-xl border-2 p-5 text-left transition-all duration-200 ${
                  isCloud
                    ? 'border-[#7c3aed] bg-[#faf5ff] cursor-default'
                    : busy
                    ? 'border-[#e8e8e8] bg-[#fafafa] cursor-not-allowed opacity-60'
                    : 'border-[#e8e8e8] bg-white hover:border-[#7c3aed]/60 hover:bg-[#fdfaff] cursor-pointer'
                }`}
              >
                {isCloud && (
                  <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-[#7c3aed] bg-[#ede9fe] px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] animate-pulse inline-block" />
                    ACTIVE
                  </span>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCloud ? 'bg-[#7c3aed]' : 'bg-[#f0f0f0]'}`}>
                    <Icon icon="mdi:cloud-outline" width={22} height={22} color={isCloud ? 'white' : '#999'} />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#1a2233] m-0">CockroachDB</p>
                    <p className="text-[11px] text-[#888] m-0">agile-vulture · Cloud</p>
                  </div>
                </div>
                <p className="text-[11px] text-[#aaa] m-0">Online · Scalable · Production</p>
                {!isCloud && !busy && (
                  <p className="text-[10px] text-[#7c3aed] mt-2 m-0 font-medium">Click to switch →</p>
                )}
              </button>
            </div>

            {/* Switch feedback */}
            {switching && (
              <div className="flex items-center gap-3 bg-[#f0faff] border border-[#bae6fd] rounded-xl px-4 py-3 mb-4">
                <Icon icon="mdi:loading" width={18} height={18} color="#00AEEF" className="animate-spin shrink-0" />
                <p className="text-[13px] font-semibold text-[#0284c7] m-0">Switching database...</p>
              </div>
            )}
            {switchError && (
              <div className="flex items-center gap-3 bg-[#fff0f0] border border-[#fca5a5] rounded-xl px-4 py-3 mb-4">
                <Icon icon="mdi:alert-circle-outline" width={18} height={18} color="#dc2626" className="shrink-0" />
                <p className="text-[13px] text-[#dc2626] m-0 flex-1">{switchError}</p>
                <button onClick={() => setSwitchError('')} className="text-[11px] text-[#dc2626] underline bg-none border-none cursor-pointer p-0">Dismiss</button>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-[#f0f0f0] my-5" />

            {/* ── Sync Buttons ── */}
            <p className="text-[12px] font-semibold text-[#888] uppercase tracking-wider mb-3">Sync Data</p>
            <div className="grid grid-cols-2 gap-3 mb-4">

              {/* Cloud → Local */}
              <button
                onClick={() => handleSync('cloud', 'local')}
                disabled={busy}
                className={`flex items-center gap-3 rounded-xl border-2 border-[#e8e8e8] px-4 py-3 text-left transition-all duration-200 ${
                  busy
                    ? 'opacity-60 cursor-not-allowed bg-[#fafafa]'
                    : 'bg-white hover:border-[#7c3aed]/50 hover:bg-[#fdfaff] cursor-pointer'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#ede9fe] flex items-center justify-center shrink-0">
                  <Icon icon="mdi:cloud-download-outline" width={20} height={20} color="#7c3aed" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[12px] font-bold text-[#7c3aed]">Cloud</span>
                    <Icon icon="mdi:arrow-right" width={12} height={12} color="#aaa" />
                    <span className="text-[12px] font-bold text-[#00AEEF]">Local</span>
                  </div>
                  <p className="text-[11px] text-[#aaa] m-0">Pull from CockroachDB</p>
                </div>
              </button>

              {/* Local → Cloud */}
              <button
                onClick={() => handleSync('local', 'cloud')}
                disabled={busy}
                className={`flex items-center gap-3 rounded-xl border-2 border-[#e8e8e8] px-4 py-3 text-left transition-all duration-200 ${
                  busy
                    ? 'opacity-60 cursor-not-allowed bg-[#fafafa]'
                    : 'bg-white hover:border-[#00AEEF]/50 hover:bg-[#f9feff] cursor-pointer'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-[#e0f5ff] flex items-center justify-center shrink-0">
                  <Icon icon="mdi:cloud-upload-outline" width={20} height={20} color="#00AEEF" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[12px] font-bold text-[#00AEEF]">Local</span>
                    <Icon icon="mdi:arrow-right" width={12} height={12} color="#aaa" />
                    <span className="text-[12px] font-bold text-[#7c3aed]">Cloud</span>
                  </div>
                  <p className="text-[11px] text-[#aaa] m-0">Push to CockroachDB</p>
                </div>
              </button>
            </div>

            {/* Sync progress */}
            {syncing && (
              <div className="flex items-center gap-3 bg-[#f0fdf4] border border-[#86efac] rounded-xl px-4 py-3 mb-4">
                <Icon icon="mdi:loading" width={20} height={20} color="#16a34a" className="animate-spin shrink-0" />
                <p className="text-[13px] font-semibold text-[#16a34a] m-0">Syncing data, please wait...</p>
              </div>
            )}

            {/* Sync success */}
            {syncDone && syncResult && (
              <div className="bg-[#f0fdf4] border border-[#86efac] rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon="mdi:check-circle" width={20} height={20} color="#16a34a" />
                  <p className="text-[13px] font-bold text-[#16a34a] m-0">Sync complete!</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(syncResult).map(([key, count]) => (
                    <div key={key} className="bg-white rounded-lg px-3 py-2 border border-[#dcfce7]">
                      <p className="text-[10px] text-[#888] m-0 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-[15px] font-bold text-[#16a34a] m-0">{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sync error */}
            {syncError && (
              <div className="flex items-start gap-3 bg-[#fff0f0] border border-[#fca5a5] rounded-xl px-4 py-3 mb-4">
                <Icon icon="mdi:alert-circle-outline" width={20} height={20} color="#dc2626" className="shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-semibold text-[#dc2626] m-0">Sync Failed</p>
                  <p className="text-[11px] text-[#dc2626]/80 m-0 mt-0.5">{syncError}</p>
                  {(syncError.toLowerCase().includes('table') || syncError.toLowerCase().includes('column') || syncError.toLowerCase().includes('relation')) && (
                    <div className="mt-2 bg-white rounded-lg p-3 border border-[#fca5a5]">
                      <p className="text-[11px] font-semibold text-[#333] m-0 mb-1">Local DB schema not set up yet?</p>
                      <code className="block text-[11px] bg-[#1a2233] text-[#7dd3fc] rounded px-3 py-2 font-mono">
                        npx prisma db push --config prisma.local.config.ts
                      </code>
                    </div>
                  )}
                  <button onClick={() => setSyncError('')} className="mt-2 text-[11px] text-[#dc2626] underline bg-none border-none cursor-pointer p-0">
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Last sync info */}
            {config?.lastSync && !syncing && !syncDone && (
              <div className="flex items-center gap-2 bg-[#f5f7fa] rounded-lg px-4 py-2.5 text-[12px] text-[#666]">
                <Icon icon="mdi:sync" width={15} height={15} color="#00AEEF" />
                <span>Last sync: <strong>{config.lastSyncDirection}</strong> · {new Date(config.lastSync).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Local DB Setup Guide ── */}
        <div className="bg-white rounded-2xl shadow-[0_1px_6px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#f0f0f0] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#fef3c7] flex items-center justify-center">
              <Icon icon="mdi:information-outline" width={20} height={20} color="#d97706" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1a2233] m-0">First-time Local DB Setup</h2>
              <p className="text-[12px] text-[#999] m-0">Run once before switching to Local for the first time</p>
            </div>
          </div>
          <div className="p-6">
            <p className="text-[13px] text-[#555] mb-3">
              Run this command once in your terminal to initialize the local PostgreSQL schema:
            </p>
            <div className="bg-[#1a2233] rounded-xl p-4">
              <code className="block text-[12px] text-[#7dd3fc] font-mono">
                npx prisma db push --config prisma.local.config.ts
              </code>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
