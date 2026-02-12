'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';

export default function Header() {
  return (
    <header className="flex justify-between items-center py-2 px-6 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] z-[100] max-md:py-1.5 max-md:px-3.5">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 flex items-center justify-center">
          <Image src="/Logo1.png" alt="DOST Logo" width={36} height={36} className="w-9 h-9 object-contain" />
        </div>
        <div className="flex flex-col">
          <div className="text-[11px] text-[#666] font-bold tracking-[0.3px] max-md:text-[9px]">Provincial Science and Technology Office in Misamis Oriental</div>
          <div className="text-lg text-primary font-bold tracking-[0.2px] max-md:text-[13px]">Department of Science and Technology</div>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <Link href="/maps" className="flex items-center justify-center no-underline w-8 h-8 rounded-full text-accent bg-accent/10 transition-all duration-300 [animation:compassPulse_2.5s_ease-in-out_infinite] hover:bg-accent hover:text-white hover:scale-115 hover:rotate-[15deg] hover:shadow-[0_4px_14px_rgba(0,174,239,0.4)] hover:[animation:none] active:scale-90 active:-rotate-[10deg] active:transition-all active:duration-100" title="Maps">
          <Icon icon="mdi:compass-outline" width={24} height={24} />
        </Link>
        <button className="bg-transparent border-none cursor-pointer p-[5px] text-[#666] transition-colors duration-200 hover:text-primary"><Icon icon="mdi:bell-outline" width={24} height={24} /></button>
        <div className="flex items-center gap-2 pl-3 border-l border-[#e0e0e0]">
          <Icon icon="mdi:account-circle" width={30} height={30} color="#666" />
          <span className="text-[13px] text-[#333] font-medium max-md:hidden">Jane Doe</span>
        </div>
      </div>
    </header>
  );
}
