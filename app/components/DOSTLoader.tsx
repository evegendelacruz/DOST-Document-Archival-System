'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function DOSTLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#f5f5f5] min-h-[60vh] gap-3">
      <style>{`
        @keyframes dost-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          40%       { transform: translateY(-28px) scale(1.08); }
          60%       { transform: translateY(-14px) scale(1.04); }
        }
        @keyframes dost-shadow {
          0%, 100% { transform: scaleX(1); opacity: 0.25; }
          40%       { transform: scaleX(0.5); opacity: 0.1; }
          60%       { transform: scaleX(0.75); opacity: 0.18; }
        }
        .dost-logo-bounce  { animation: dost-bounce 1s ease-in-out infinite; }
        .dost-shadow-pulse { animation: dost-shadow 1s ease-in-out infinite; }
      `}</style>

      <div className="flex flex-col items-center gap-2">
        <div className="dost-logo-bounce">
          <Image src="/Logo1.png" alt="DOST Logo" width={72} height={72} className="object-contain" />
        </div>
        <div className="dost-shadow-pulse w-14 h-2 bg-black/20 rounded-full" />
      </div>

      <p className="text-sm text-primary/60 font-medium tracking-wide">Loading...</p>
    </div>
  );
}
