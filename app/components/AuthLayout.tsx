'use client';

import Image from 'next/image';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-container">
      <header className="dost-header">
        <div className="logo-section">
          <div className="logo-circle">
            <Image src="/Logo1.png" alt="DOST Logo" width={48} height={48} />
          </div>
          <div className="header-text">
            <div className="header-subtitle">Provincial Science and Technology Office in Misamis Oriental</div>
            <div className="header-title">Department of Science and Technology</div>
          </div>
        </div>
      </header>

      <div className="background-blur">
        <div className="blur-circle blur-blue-1"></div>
        <div className="blur-circle blur-yellow"></div>
        <div className="blur-circle blur-blue-2"></div>
      </div>

      {children}
    </div>
  );
}
