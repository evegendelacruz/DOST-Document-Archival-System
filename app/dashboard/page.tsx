'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import DashboardLayout from '../components/DashboardLayout';
import { NavItem } from '../components/Sidebar';

const searchSuggestions = [
  'Acquisition of Equipment for the Mass Production',
  'DOST and USTP Developed Technology',
  'Best Friend Goodies',
  'Technology Transfer',
  'Research and Development',
  'Equipment Procurement',
  'Mass Production Project'
];

const archivalData = [
  { id: 1, user: 'Jane Doe', title: 'Acquisition of Equipment for the Mass Production of DOST and USTP Developed Technolog...', company: 'Best Friend Goodies', contact: 'Ms. Nenita M. Tan', year: '2025' },
  { id: 2, user: 'Jane Doe', title: 'Acquisition of Equipment for the Mass Production of DOST and USTP Developed Technolog...', company: 'Best Friend Goodies', contact: 'Ms. Nenita M. Tan', year: '2025' },
  { id: 3, user: 'Jane Doe', title: 'Acquisition of Equipment for the Mass Production of DOST and USTP Developed Technolog...', company: 'Best Friend Goodies', contact: 'Ms. Nenita M. Tan', year: '2025' },
  { id: 4, user: 'Jane Doe', title: 'Acquisition of Equipment for the Mass Production of DOST and USTP Developed Technolog...', company: 'Best Friend Goodies', contact: 'Ms. Nenita M. Tan', year: '2025' },
  { id: 5, user: 'Jane Doe', title: 'Acquisition of Equipment for the Mass Production of DOST and USTP Developed Technolog...', company: 'Best Friend Goodies', contact: 'Ms. Nenita M. Tan', year: '2025' }
];

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 7 : day;
};

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function DashboardPage() {
  const [activeNav, setActiveNav] = useState('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(1);
  const [currentYear, setCurrentYear] = useState(2026);

  const filteredSuggestions = searchSuggestions.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else { setCurrentMonth(currentMonth - 1); }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else { setCurrentMonth(currentMonth + 1); }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(!!e.target.value.trim());
    if (!e.target.value.trim()) setShowResults(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setShowResults(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowResults(true);
      setShowSuggestions(false);
    }
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);
    const days = [];

    for (let i = firstDay - 1; i > 0; i--) days.push({ day: daysInPrevMonth - i + 1, currentMonth: false });
    for (let i = 1; i <= daysInMonth; i++) days.push({ day: i, currentMonth: true });
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) days.push({ day: i, currentMonth: false });

    return days;
  };

  const calendarDays = generateCalendarDays();

  const sidebarItems: NavItem[] = [
    { type: 'button', icon: 'mdi:view-grid', label: 'Dashboard', active: activeNav === 'calendar', onClick: () => setActiveNav('calendar') },
    { type: 'button', icon: 'mdi:magnify', label: 'Archival', active: activeNav === 'archival', onClick: () => { setActiveNav('archival'); setShowResults(false); } },
    { type: 'link', href: '/setup', icon: 'mdi:office-building', logo: '/setup-logo.png', label: 'SETUP 4.0' },
    { type: 'link', href: '/cest', icon: 'mdi:leaf', logo: '/cest-logo.png', label: 'CEST' },
    { type: 'button', icon: 'mdi:clock-outline', label: 'Recent Activity' },
  ];

  return (
    <DashboardLayout activePath="/dashboard" sidebarItems={sidebarItems}>
      <main className={`flex-1 py-10 px-[60px] flex flex-col items-center max-md:py-[30px] max-md:px-5 ${showResults ? 'items-start' : ''}`}>
        {activeNav === 'calendar' && (
          <div className="flex w-full gap-[30px] items-stretch">
            <div className="flex-1 bg-white rounded-[15px] p-[30px] shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-center gap-5 mb-[25px]">
                <button className="bg-transparent border-none cursor-pointer p-[5px] flex items-center justify-center hover:opacity-70" onClick={handlePrevMonth}>
                  <Icon icon="mdi:chevron-left" width={24} height={24} color="#00AEEF" />
                </button>
                <h2 className="text-[28px] font-bold text-primary text-center">{monthNames[currentMonth]} {currentYear}</h2>
                <button className="bg-transparent border-none cursor-pointer p-[5px] flex items-center justify-center hover:opacity-70" onClick={handleNextMonth}>
                  <Icon icon="mdi:chevron-right" width={24} height={24} color="#00AEEF" />
                </button>
              </div>
              <div className="w-full">
                <div className="grid grid-cols-7 mb-2.5">
                  {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-primary p-2.5 tracking-[1px]">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 border border-[#e0e0e0] border-r-0 border-b-0">
                  {calendarDays.map((day, index) => (
                    <div key={index} className={`min-h-[80px] p-2 border-r border-b border-[#e0e0e0] bg-white ${(index % 7 === 5 || index % 7 === 6) ? 'bg-[#e8f4f8]' : ''}`}>
                      <span className={`text-sm font-medium ${!day.currentMonth ? 'text-[#ccc]' : 'text-primary'}`}>{day.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="w-[280px] shrink-0 flex flex-col">
              <button className="flex items-center justify-center gap-2 w-full py-[15px] px-[25px] bg-accent text-white border-none rounded-[30px] text-base font-semibold cursor-pointer transition-colors duration-200 mb-5 hover:bg-accent-hover">
                <Icon icon="mdi:plus" width={20} height={20} />
                Book Appointment
              </button>
              <div className="bg-white rounded-[15px] p-[30px] shadow-[0_2px_10px_rgba(0,0,0,0.05)] flex-1">
                <h3 className="text-[22px] font-bold text-primary mb-[15px]">Upcoming Events</h3>
                <p className="text-sm text-[#999] italic">No upcoming events yet...</p>
              </div>
            </div>
          </div>
        )}

        {activeNav === 'archival' && !showResults && (
          <>
            <h1 className="text-5xl font-bold text-primary mb-[30px] max-md:text-[32px]">Archival</h1>
            <div className="relative w-full max-w-[600px]">
              <input
                type="text"
                className="w-full py-[15px] pr-[50px] pl-5 border border-[#d0d0d0] rounded-[30px] text-base bg-white shadow-[0_4px_15px_rgba(0,0,0,0.08)] transition-all duration-200 focus:outline-none focus:border-primary focus:shadow-[0_4px_15px_rgba(20,97,132,0.15)] placeholder:text-[#999]"
                placeholder="Search here"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              <Icon icon="mdi:magnify" className="absolute right-5 top-1/2 -translate-y-1/2 text-[#999]" width={20} height={20} />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-[#d0d0d0] border-t-0 rounded-b-[15px] shadow-[0_4px_15px_rgba(0,0,0,0.1)] max-h-[250px] overflow-y-auto z-50">
                  {filteredSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center gap-3 py-3 px-5 cursor-pointer transition-colors duration-200 hover:bg-[#f5f5f5]" onClick={() => handleSuggestionClick(suggestion)}>
                      <Icon icon="mdi:magnify" width={16} height={16} color="#999" />
                      <span className="text-sm text-[#333]">{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeNav === 'archival' && showResults && (
          <div className="w-full max-w-[800px] self-start">
            <div className="relative w-full mb-[30px] z-50">
              <input
                type="text"
                className="w-full py-3 pr-[50px] pl-5 border border-[#d0d0d0] rounded-[25px] text-sm bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-all duration-200 focus:outline-none focus:border-primary"
                placeholder="Search here"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              <Icon icon="mdi:magnify" className="absolute right-[15px] top-1/2 -translate-y-1/2 text-[#999]" width={20} height={20} />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-[#d0d0d0] border-t-0 rounded-b-[15px] shadow-[0_4px_15px_rgba(0,0,0,0.1)] max-h-[250px] overflow-y-auto z-50">
                  {filteredSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center gap-3 py-3 px-5 cursor-pointer transition-colors duration-200 hover:bg-[#f5f5f5]" onClick={() => handleSuggestionClick(suggestion)}>
                      <Icon icon="mdi:magnify" width={16} height={16} color="#999" />
                      <span className="text-sm text-[#333]">{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-[15px]">
              {archivalData.map((item) => (
                <div key={item.id} className="flex items-start gap-[15px] py-2.5 cursor-pointer border-b border-[#e0e0e0] hover:bg-black/[0.02]">
                  <div>
                    <Icon icon="mdi:account-circle" width={40} height={40} color="#146184" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#333] mb-[5px]">{item.user}</div>
                    <div className="text-sm font-bold text-primary mb-[5px] whitespace-nowrap overflow-hidden text-ellipsis">{item.title}</div>
                    <div className="text-xs text-[#666]">{item.company} | {item.contact} | Year:{item.year}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
