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
    <div className="dashboard-container">
      <Header />
      <div className="dashboard-layout">
        <Sidebar activePath={activePath} items={sidebarItems} />
        {children}
      </div>
    </div>
  );
}
