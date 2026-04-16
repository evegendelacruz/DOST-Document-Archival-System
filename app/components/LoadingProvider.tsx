'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import LoadingScreen from './LoadingScreen';

// Hide after this long regardless (safety valve)
const NAV_MAX_SHOW = 1200;

export default function LoadingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);
  const [loading, setLoading] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    // Clear any pending hide timer from a previous navigation
    if (hideTimer.current) clearTimeout(hideTimer.current);

    // Show the loader immediately on navigation
    setLoading(true);

    // Always hide after NAV_MAX_SHOW — page has settled by then
    hideTimer.current = setTimeout(() => setLoading(false), NAV_MAX_SHOW);

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pathname]);

  return (
    <>
      <LoadingScreen visible={loading} />
      {children}
    </>
  );
}
