'use client';

import Header from './Header';
import Sidebar, { NavItem } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activePath: string;
  sidebarItems?: NavItem[];
}

export default function DashboardLayout({ children, activePath, sidebarItems }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      <Header />
      <div className="flex flex-1">
        <Sidebar activePath={activePath} items={sidebarItems} />
        {children}
      </div>
    </div>
  );
}
