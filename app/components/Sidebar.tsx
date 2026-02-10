'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';

export interface NavItem {
  type: 'link' | 'button';
  href?: string;
  icon: string;
  logo?: string;
  label?: string;
  active?: boolean;
  onClick?: () => void;
}

interface SidebarProps {
  activePath: string;
  items?: NavItem[];
}

function getDefaultItems(activePath: string): NavItem[] {
  return [
    { type: 'link', href: '/dashboard', icon: 'mdi:view-grid', label: 'Dashboard', active: activePath === '/dashboard' },
    { type: 'link', href: '/dashboard', icon: 'mdi:magnify', label: 'Archival' },
    { type: 'link', href: '/setup', icon: 'mdi:office-building', logo: '/setup-logo.png', label: 'SETUP 4.0', active: activePath === '/setup' },
    { type: 'link', href: '/cest', icon: 'mdi:leaf', logo: '/cest-logo.png', label: 'CEST', active: activePath === '/cest' },
    { type: 'button', icon: 'mdi:clock-outline', label: 'Recent Activity' },
  ];
}

export default function Sidebar({ activePath, items }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const navItems = items || getDefaultItems(activePath);

  return (
    <aside className={`sidebar ${expanded ? 'expanded' : ''}`}>
      <button className="sidebar-toggle" onClick={() => setExpanded(!expanded)}>
        <Icon icon={expanded ? "mdi:chevron-left" : "mdi:chevron-right"} width={16} height={16} color="#fff" />
      </button>
      <nav className="sidebar-nav">
        {navItems.map((item, index) => {
          const iconEl = item.logo
            ? <img src={item.logo} alt="" className="nav-item-logo" />
            : <Icon icon={item.icon} width={22} height={22} />;
          const content = (
            <>
              <span className="nav-item-icon">{iconEl}</span>
              {item.label && <span className="nav-item-label">{item.label}</span>}
            </>
          );
          if (item.type === 'link' && item.href) {
            return (
              <Link key={index} href={item.href} className={`nav-item ${item.active ? 'active' : ''}`}>
                {content}
              </Link>
            );
          }
          return (
            <button key={index} className={`nav-item ${item.active ? 'active' : ''}`} onClick={item.onClick}>
              {content}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
