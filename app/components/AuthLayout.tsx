'use client';

import Image from 'next/image';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[url('/BG.png')] bg-center bg-cover bg-no-repeat px-4">
      <header className="absolute top-0 left-0 right-0 px-[30px] py-2.5 bg-gradient-to-r from-white to-white/90 shadow-[0_2px_8px_rgba(0,0,0,0.1)] z-20 max-md:px-5 max-md:py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center">
            <Image src="/Logo1.png" alt="DOST Logo" width={36} height={36} className="w-9 h-9 object-contain" />
          </div>
          <div className="hidden sm:flex flex-col">
            <div className="text-[11px] text-[#666] font-bold tracking-[0.3px]">Provincial Science and Technology Office in Misamis Oriental</div>
            <div className="text-lg text-primary font-bold tracking-[0.2px]">Department of Science and Technology</div>
          </div>
        </div>
      </header>

      <div className="block">
        <div className="absolute rounded-full blur-[80px] opacity-40 w-[300px] h-[300px] bg-[#b3d9f0] top-[20%] left-[-5%]"></div>
        <div className="absolute rounded-full blur-[80px] opacity-40 w-[250px] h-[250px] bg-[#f5e5a8] bottom-[15%] left-[10%]"></div>
        <div className="absolute rounded-full blur-[80px] opacity-40 w-[280px] h-[280px] bg-[#b3d9f0] bottom-[20%] right-[-5%]"></div>
      </div>

      {children}
    </div>
  );
}