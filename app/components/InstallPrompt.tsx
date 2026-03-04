'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed (running in standalone)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInStandaloneMode(standalone);
    if (standalone) return;

    // Check if user already dismissed
    if (sessionStorage.getItem('install-dismissed')) return;

    // Detect iOS Safari
    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !/crios|fxios/i.test(ua);
    setIsIOS(ios);

    if (ios) {
      // Show iOS instructions banner
      setShowBanner(true);
      return;
    }

    // Android/Desktop: listen for Chrome's install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowBanner(false);
    sessionStorage.setItem('install-dismissed', '1');
  };

  if (!showBanner || dismissed || isInStandaloneMode) return null;

  // iOS Safari instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <Icon icon="mdi:close" width={18} height={18} />
        </button>
        <div className="flex items-center gap-3 mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192x192.png" alt="DOST DAS" className="w-10 h-10 rounded-xl" />
          <div>
            <p className="font-bold text-sm text-gray-800">Install DOST DAS</p>
            <p className="text-xs text-gray-500">Add to your home screen</p>
          </div>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          Tap <span className="inline-flex items-center gap-0.5 font-semibold text-blue-600">
            <Icon icon="mdi:export-variant" width={14} height={14} />Share
          </span> then <span className="font-semibold text-blue-600">&quot;Add to Home Screen&quot;</span> to install this app.
        </p>
      </div>
    );
  }

  // Android / Desktop Chrome
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-80 z-[9999] bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
      >
        <Icon icon="mdi:close" width={18} height={18} />
      </button>
      <div className="flex items-center gap-3 mb-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192x192.png" alt="DOST DAS" className="w-10 h-10 rounded-xl" />
        <div>
          <p className="font-bold text-sm text-gray-800">Install DOST DAS</p>
          <p className="text-xs text-gray-500">Use as a full-screen app</p>
        </div>
      </div>
      <button
        onClick={handleInstall}
        className="w-full py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
      >
        Install App
      </button>
    </div>
  );
}
