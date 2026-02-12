'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import DashboardLayout from '../components/DashboardLayout';
import { NavItem } from '../components/Sidebar';

interface SetupProject {
  id: string;
  code: string;
  title: string;
  firm: string | null;
  address: string | null;
  corporatorName: string | null;
  status: string;
  prioritySector: string | null;
  firmSize: string | null;
  createdAt: string;
}

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
  const [allProjects, setAllProjects] = useState<SetupProject[]>([]);
  const [searchResults, setSearchResults] = useState<SetupProject[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Fetch all projects once for suggestions
  useEffect(() => {
    fetch('/api/setup-projects').then(r => r.json()).then(setAllProjects).catch(() => {});
  }, []);

  // Build suggestions from real project titles, codes, and firms
  const filteredSuggestions = searchQuery.trim()
    ? allProjects
        .flatMap(p => [p.title, `#${p.code}`, p.firm].filter(Boolean) as string[])
        .filter((v, i, a) => a.indexOf(v) === i)
        .filter(s => s.toLowerCase().includes(searchQuery.toLowerCase().replace(/^#/, '')))
        .slice(0, 7)
    : [];

  const performSearch = useCallback((query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    const q = query.toLowerCase().replace(/^#/, '');
    const results = allProjects.filter(p =>
      p.code.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      (p.firm?.toLowerCase().includes(q)) ||
      (p.address?.toLowerCase().includes(q)) ||
      (p.corporatorName?.toLowerCase().includes(q)) ||
      (p.prioritySector?.toLowerCase().includes(q)) ||
      (p.status?.toLowerCase().includes(q))
    );
    setSearchResults(results);
    setSearchLoading(false);
  }, [allProjects]);

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
    performSearch(suggestion);
    setShowResults(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      performSearch(searchQuery);
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
              {searchLoading ? (
                <p className="text-sm text-[#999] text-center py-4">Searching...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-[#999] text-center py-4">No results found for &quot;{searchQuery}&quot;</p>
              ) : searchResults.map((project) => (
                <Link key={project.id} href={`/setup/${project.id}`} className="flex items-start gap-[15px] py-2.5 no-underline border-b border-[#e0e0e0] hover:bg-black/[0.02]">
                  <div>
                    <Icon icon="mdi:account-circle" width={40} height={40} color="#146184" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-primary mb-[5px]">#{project.code}</div>
                    <div className="text-sm font-bold text-primary mb-[5px] whitespace-nowrap overflow-hidden text-ellipsis">{project.title}</div>
                    <div className="text-xs text-[#666]">{project.firm || '—'} | {project.corporatorName || '—'} | Year: {new Date(project.createdAt).getFullYear()}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
