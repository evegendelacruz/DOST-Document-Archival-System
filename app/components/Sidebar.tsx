'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';

export interface NavItem {
  type: 'link' | 'button';
  href?: string;
  icon: string;
  logo?: string;
  active?: boolean;
  onClick?: () => void;
}

interface SidebarProps {
  activePath: string;
  items?: NavItem[];
}

function getDefaultItems(activePath: string): NavItem[] {
  return [
    { type: 'link', href: '/dashboard', icon: 'mdi:view-grid', active: activePath === '/dashboard' },
    { type: 'link', href: '/dashboard', icon: 'mdi:magnify' },
    { type: 'link', href: '/setup', icon: 'mdi:office-building', logo: '/setup-logo.png', active: activePath === '/setup' },
    { type: 'link', href: '/cest', icon: 'mdi:leaf', logo: '/cest-logo.png', active: activePath === '/cest' },
    { type: 'button', icon: 'mdi:clock-outline' },
  ];
}

export default function Sidebar({ activePath, items }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navItems = items || getDefaultItems(activePath);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
        <Icon icon={collapsed ? "mdi:chevron-right" : "mdi:chevron-left"} width={20} height={20} color="#fff" />
      </button>
      <nav className="sidebar-nav">
        {navItems.map((item, index) => {
          const iconEl = item.logo
            ? <img src={item.logo} alt="" className="nav-item-logo" />
            : <Icon icon={item.icon} width={24} height={24} />;
          if (item.type === 'link' && item.href) {
            return (
              <Link key={index} href={item.href} className={`nav-item ${item.active ? 'active' : ''}`}>
                {iconEl}
              </Link>
            );
          }
          return (
            <button key={index} className={`nav-item ${item.active ? 'active' : ''}`} onClick={item.onClick}>
              {iconEl}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
