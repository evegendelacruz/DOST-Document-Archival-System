'use client';

import { useState, useEffect } from 'react';
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
  permissionKey?: string;
}


export interface UserPermissions {
  canAccessSetup: boolean;
  canAccessCest: boolean;
  canAccessMaps: boolean;
  canAccessCalendar: boolean;
  canAccessArchival: boolean;
  canManageUsers: boolean;
}


interface SidebarProps {
  activePath: string;
  items?: NavItem[];
  mobileOpen?: boolean;
  onClose?: () => void;
}


function getDefaultItems(activePath: string): NavItem[] {
  return [
    { type: 'link', href: '/dashboard', icon: 'mdi:view-grid', label: 'Dashboard', active: activePath === '/dashboard' },
    { type: 'link', href: '/dashboard', icon: 'mdi:magnify', label: 'Archival', permissionKey: 'canAccessArchival' },
    { type: 'link', href: '/setup', icon: 'mdi:office-building', logo: '/setup-logo.png', label: 'SETUP 4.0', active: activePath === '/setup', permissionKey: 'canAccessSetup' },
    { type: 'link', href: '/cest', icon: 'mdi:leaf', logo: '/cest-sidebar-logo.png', label: 'CEST', active: activePath === '/cest', permissionKey: 'canAccessCest' },
    { type: 'link', href: '/recent-activity', icon: 'mdi:clock-outline', label: 'Recent Activity', active: activePath === '/recent-activity' },
  ];
}


export default function Sidebar({ activePath, items, mobileOpen, onClose }: SidebarProps) {
  const [expanded, setExpanded] = useState(false);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);


  useEffect(() => {
    const fetchPermissions = async () => {
      const stored = localStorage.getItem('user');
      if (!stored) return;

      const { id, role } = JSON.parse(stored);
      setUserRole(role);

      if (role === 'ADMIN') {
        setPermissions({
          canAccessSetup: true,
          canAccessCest: true,
          canAccessMaps: true,
          canAccessCalendar: true,
          canAccessArchival: true,
          canManageUsers: true,
        });
        return;
      }

      if (id) {
        const res = await fetch(`/api/user-permissions/${id}`);
        if (res.ok) {
          const data = await res.json();
          setPermissions(data);
        }
      }
    };

    fetchPermissions();
    const pollInterval = setInterval(fetchPermissions, 3000);
    return () => clearInterval(pollInterval);
  }, []);

  // Close mobile sidebar when navigating
  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const defaultItems = getDefaultItems(activePath);
  const navItems = items || defaultItems;

  const filteredItems = navItems.filter(item => {
    if (!item.permissionKey || !permissions) return true;
    return permissions[item.permissionKey as keyof UserPermissions];
  });

  return (
    <aside
      className={[
        'bg-primary flex flex-col pt-0 transition-all duration-300 shrink-0',
        // Mobile: fixed full-height drawer, slides in from left
        'fixed top-0 left-0 h-full z-[1000] w-[240px]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: static sidebar in the flow, no translate
        'md:relative md:top-auto md:left-auto md:translate-x-0 md:pt-2.5 md:overflow-visible',
        expanded ? 'md:w-[220px]' : 'md:w-[70px]',
      ].join(' ')}
    >
      {/* Mobile drawer header */}
      <div className="md:hidden flex items-center justify-between px-3 py-3 border-b border-white/10 mt-1">
        <span className="text-white font-semibold text-sm tracking-wide">Menu</span>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-7 h-7 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close menu"
        >
          <Icon icon="mdi:close" width={18} height={18} />
        </button>
      </div>

      {/* Desktop expand/collapse button */}
      <button
        className="hidden md:flex absolute top-2.5 -right-3 w-6 h-6 bg-accent border-none rounded-full cursor-pointer items-center justify-center z-10 hover:bg-accent-hover"
        onClick={() => setExpanded(!expanded)}
      >
        <Icon icon={expanded ? 'mdi:chevron-left' : 'mdi:chevron-right'} width={16} height={16} color="#fff" />
      </button>

      <nav className="flex flex-col gap-1 mt-[10px] md:mt-[30px] w-full px-2.5 overflow-hidden">
        {filteredItems.map((item, index) => {
          const iconEl = item.logo
            ? <img src={item.logo} alt="" className="w-[22px] h-[22px] object-contain" />
            : <Icon icon={item.icon} width={22} height={22} />;

          const content = (
            <>
              <span className="flex items-center justify-center min-w-[24px]">{iconEl}</span>
              {item.label && (
                <span
                  className={[
                    'text-sm font-medium transition-opacity duration-200',
                    // Always show on mobile; follow expanded state on desktop
                    'max-md:opacity-100 max-md:pointer-events-auto',
                    expanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
                  ].join(' ')}
                >
                  {item.label}
                </span>
              )}
            </>
          );

          const baseClasses = `h-11 bg-transparent border-none rounded-[10px] cursor-pointer flex items-center gap-3 text-white/70 transition-all duration-200 no-underline whitespace-nowrap px-[13px] hover:bg-white/10 hover:text-white ${item.active ? 'bg-white/20 text-white' : ''}`;

          if (item.type === 'link' && item.href) {
            return (
              <Link key={index} href={item.href} className={baseClasses} onClick={handleNavClick}>
                {content}
              </Link>
            );
          }
          return (
            <button key={index} className={baseClasses} onClick={() => { item.onClick?.(); handleNavClick(); }}>
              {content}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
