'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';

export default function Header() {
  return (
    <header className="dashboard-header">
      <div className="header-left">
        <div className="logo-circle">
          <Image src="/Logo1.png" alt="DOST Logo" width={48} height={48} />
        </div>
        <div className="header-text">
          <div className="header-subtitle">Provincial Science and Technology Office in Misamis Oriental</div>
          <div className="header-title">Department of Science and Technology</div>
        </div>
      </div>
      <div className="header-right">
        <Link href="/maps" className="header-icon-btn header-maps-btn" title="Maps">
          <Icon icon="mdi:compass-outline" width={24} height={24} />
        </Link>
        <button className="header-icon-btn"><Icon icon="mdi:link-variant" width={24} height={24} /></button>
        <button className="header-icon-btn"><Icon icon="mdi:bell-outline" width={24} height={24} /></button>
        <div className="user-info">
          <Icon icon="mdi:account-circle" width={36} height={36} color="#666" />
          <span className="user-name">Jane Doe</span>
        </div>
      </div>
    </header>
  );
}
