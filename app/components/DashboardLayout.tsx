'use client';

import { useState } from 'react';
import Header from './Header';
import Sidebar, { NavItem } from './Sidebar';
// import Messenger from './Messenger'; // temporarily disabled

interface DashboardLayoutProps {
  children: React.ReactNode;
  activePath: string;
  sidebarItems?: NavItem[];
}

export default function DashboardLayout({ children, activePath, sidebarItems }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
