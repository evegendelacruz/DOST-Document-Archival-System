'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LoadingScreen({ visible }: { visible: boolean }) {
  const [show, setShow] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (visible) {
      setFadeOut(false);
      setShow(true);
    } else {
      if (show) {
        setFadeOut(true);
        const t = setTimeout(() => setShow(false), 500);
        return () => clearTimeout(t);
      }
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.5s ease',
        pointerEvents: fadeOut ? 'none' : 'all',
      }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Outer glow ring — slow pulse */}
        <span style={{
          position: 'absolute',
          width: 180,
          height: 180,
          borderRadius: 28,
          background: 'rgba(0,174,239,0.10)',
          animation: 'ls-glow 2s ease-in-out infinite',
        }} />

        {/* Mid ring */}
        <span style={{
          position: 'absolute',
          width: 148,
          height: 148,
          borderRadius: 24,
          background: 'rgba(0,174,239,0.07)',
          animation: 'ls-glow 2s ease-in-out 0.35s infinite',
        }} />

        {/* Logo */}
        <div style={{
          width: 120,
          height: 120,
          borderRadius: 20,
          overflow: 'hidden',
          animation: 'ls-pop 0.55s cubic-bezier(0.34,1.56,0.64,1) forwards, ls-breathe 3s ease-in-out 0.6s infinite',
          position: 'relative',
          zIndex: 1,
        }}>
          <Image
            src="/DOST_seal.png"
            alt="DOST Seal"
            width={120}
            height={120}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            priority
          />
        </div>
      </div>

      <style>{`
        @keyframes ls-pop {
          0%   { transform: scale(0.25) rotate(-12deg); opacity: 0; }
          65%  { transform: scale(1.06) rotate(2deg);   opacity: 1; }
          82%  { transform: scale(0.97) rotate(-1deg); }
          100% { transform: scale(1)    rotate(0deg);   opacity: 1; }
        }
        @keyframes ls-breathe {
          0%, 100% { transform: scale(1);    filter: brightness(1); }
          50%       { transform: scale(1.04); filter: brightness(1.06); }
        }
        @keyframes ls-glow {
          0%, 100% { transform: scale(0.92); opacity: 0.6; }
          50%       { transform: scale(1.08); opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
