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
    <aside className={`${expanded ? 'w-[220px]' : 'w-[70px]'} bg-primary flex flex-col pt-2.5 relative transition-[width] duration-300 overflow-visible z-[1000]`}>
      <button className="absolute top-2.5 -right-3 w-6 h-6 bg-accent border-none rounded-full cursor-pointer flex items-center justify-center z-10 hover:bg-accent-hover" onClick={() => setExpanded(!expanded)}>
        <Icon icon={expanded ? "mdi:chevron-left" : "mdi:chevron-right"} width={16} height={16} color="#fff" />
      </button>
      <nav className="flex flex-col gap-1 mt-[30px] w-full px-2.5 overflow-hidden">
        {navItems.map((item, index) => {
          const iconEl = item.logo
            ? <img src={item.logo} alt="" className="w-[22px] h-[22px] object-contain" />
            : <Icon icon={item.icon} width={22} height={22} />;
          const content = (
            <>
              <span className="flex items-center justify-center min-w-[24px]">{iconEl}</span>
              {item.label && <span className={`text-sm font-medium transition-opacity duration-200 ${expanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>{item.label}</span>}
            </>
          );
          const baseClasses = `h-11 bg-transparent border-none rounded-[10px] cursor-pointer flex items-center gap-3 text-white/70 transition-all duration-200 no-underline whitespace-nowrap px-[13px] hover:bg-white/10 hover:text-white ${item.active ? 'bg-white/20 text-white' : ''}`;
          if (item.type === 'link' && item.href) {
            return (
              <Link key={index} href={item.href} className={baseClasses}>
                {content}
              </Link>
            );
          }
          return (
            <button key={index} className={baseClasses} onClick={item.onClick}>
              {content}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
