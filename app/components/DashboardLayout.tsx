'use client';

import Header from './Header';
import Sidebar, { NavItem } from './Sidebar';
import Messenger from './Messenger';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activePath: string;
  sidebarItems?: NavItem[];
}

export default function DashboardLayout({ children, activePath, sidebarItems }: DashboardLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-[#f5f5f5] overflow-hidden">
      <Header />
      <div className="flex flex-1 min-h-0">
        <Sidebar activePath={activePath} items={sidebarItems} />
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
          {children}
        </div>
      </div>
      <Messenger />
    </div>
  );
}
