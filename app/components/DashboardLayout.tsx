'use client';

import { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar, { NavItem } from './Sidebar';
import DOSTLoader from './DOSTLoader';
// import Messenger from './Messenger'; // temporarily disabled

interface DashboardLayoutProps {
  children: React.ReactNode;
  activePath: string;
  sidebarItems?: NavItem[];
}

export default function DashboardLayout({ children, activePath, sidebarItems }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const [res] = await Promise.all([
        fetch('/api/auth/session').catch(() => null),
        new Promise(r => setTimeout(r, 2000)),
      ]);
      if (!res || !res.ok) {
        localStorage.removeItem('user');
        window.location.replace('/');
        return;
      }
      setAuthed(true);
    };

    verify();

    // Handle BFCache restore (back button after logout)
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) verify(); };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

  if (!authed) {
    return <div className="h-screen"><DOSTLoader /></div>;
  }

  return (
    <div className="h-screen flex flex-col bg-[#f5f5f5] overflow-hidden">
      <Header onMenuToggle={() => setMobileOpen(o => !o)} />
      <div className="flex flex-1 min-h-0 relative">
        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-[999] md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <Sidebar
          activePath={activePath}
          items={sidebarItems}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          {children}
        </div>
      </div>
      {/* <Messenger /> */}{/* temporarily disabled */}
    </div>
  );
}
