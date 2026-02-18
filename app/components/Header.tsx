'use client';


import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import NotificationDropdown from './notification';


export default function Header() {
  const [userName, setUserName] = useState('User');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();


  // Fetch user data including profile image
  const fetchUserData = async () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        if (user.fullName) setUserName(user.fullName);
       
        // Fetch fresh user data including profile image
        if (user.id) {
          const res = await fetch(`/api/users/${user.id}`);
          if (res.ok) {
            const userData = await res.json();
            setProfileImage(userData.profileImageUrl || null);
          }
        }
      }
    } catch {}
  };


  useEffect(() => {
    fetchUserData();


    // Listen for profile image updates
    const handleProfileUpdate = () => {
      fetchUserData();
    };


    window.addEventListener('profileImageUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileImageUpdated', handleProfileUpdate);
  }, []);


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };


    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const handleMyProfile = () => {
    setIsDropdownOpen(false);
    router.push('/profile');
  };


  const handleLogout = () => {
    setIsDropdownOpen(false);
    localStorage.removeItem('user');
    router.push('/');
  };


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
        <Link href="/maps" className="flex items-center justify-center no-underline w-8 h-8 rounded-full color-#666 text-gray-500 transition-all duration-300 hover:bg-accent hover:text-white hover:scale-115 hover:rotate-[15deg] hover:shadow-[0_4px_14px_rgba(0,174,239,0.4)] hover:[animation:none] active:scale-90 active:-rotate-[10deg] active:transition-all active:duration-100" title="Maps">
          <Icon icon="mdi:compass-outline" width={24} height={24} />
        </Link>
        <NotificationDropdown />
       
        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 pl-3 border-l border-[#e0e0e0] bg-transparent cursor-pointer hover:opacity-80 transition-opacity"
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="w-[30px] h-[30px] rounded-full object-cover border-2 border-cyan-400"
              />
            ) : (
              <Icon icon="mdi:account-circle" width={30} height={30} color="#666" />
            )}
            <span className="text-[13px] text-[#333] font-medium max-md:hidden">{userName}</span>
          </button>


          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <button
                onClick={handleMyProfile}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
              >
                <Icon icon="mdi:account-outline" width={20} height={20} />
                <span>My Profile</span>
              </button>
              <div className="border-t border-gray-200 my-1"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
              >
                <Icon icon="mdi:logout" width={20} height={20} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

