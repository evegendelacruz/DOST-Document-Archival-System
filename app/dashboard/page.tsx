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
      <main className={`main-content ${showResults ? 'has-results' : ''}`}>
        {activeNav === 'calendar' && (
          <div className="calendar-view">
            <div className="calendar-container">
              <div className="calendar-nav">
                <button className="calendar-nav-btn" onClick={handlePrevMonth}>
                  <Icon icon="mdi:chevron-left" width={24} height={24} color="#00AEEF" />
                </button>
                <h2 className="calendar-title">{monthNames[currentMonth]} {currentYear}</h2>
                <button className="calendar-nav-btn" onClick={handleNextMonth}>
                  <Icon icon="mdi:chevron-right" width={24} height={24} color="#00AEEF" />
                </button>
              </div>
              <div className="calendar-grid">
                <div className="calendar-header">
                  {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(day => (
                    <div key={day} className={`calendar-day-name ${day === 'SATURDAY' || day === 'SUNDAY' ? 'weekend' : ''}`}>{day}</div>
                  ))}
                </div>
                <div className="calendar-body">
                  {calendarDays.map((day, index) => (
                    <div key={index} className={`calendar-cell ${!day.currentMonth ? 'other-month' : ''} ${(index % 7 === 5 || index % 7 === 6) ? 'weekend' : ''}`}>
                      <span className="cell-day">{day.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="events-sidebar">
              <button className="book-appointment-btn">
                <Icon icon="mdi:plus" width={20} height={20} />
                Book Appointment
              </button>
              <div className="events-card">
                <h3 className="events-title">Upcoming Events</h3>
                <p className="no-events">No upcoming events yet...</p>
              </div>
            </div>
          </div>
        )}

        {activeNav === 'archival' && !showResults && (
          <>
            <h1 className="page-title">Archival</h1>
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search here"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              <Icon icon="mdi:magnify" className="search-icon" width={20} height={20} />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="search-suggestions">
                  {filteredSuggestions.map((suggestion, index) => (
                    <div key={index} className="suggestion-item" onClick={() => handleSuggestionClick(suggestion)}>
                      <Icon icon="mdi:magnify" width={16} height={16} color="#999" />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeNav === 'archival' && showResults && (
          <div className="results-container">
            <div className="results-search-container">
              <input
                type="text"
                className="results-search-input"
                placeholder="Search here"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              <Icon icon="mdi:magnify" className="results-search-icon" width={20} height={20} />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="search-suggestions">
                  {filteredSuggestions.map((suggestion, index) => (
                    <div key={index} className="suggestion-item" onClick={() => handleSuggestionClick(suggestion)}>
                      <Icon icon="mdi:magnify" width={16} height={16} color="#999" />
                      <span>{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="results-list">
              {archivalData.map((item) => (
                <div key={item.id} className="result-item">
                  <div className="result-avatar">
                    <Icon icon="mdi:account-circle" width={40} height={40} color="#146184" />
                  </div>
                  <div className="result-content">
                    <div className="result-user">{item.user}</div>
                    <div className="result-title">{item.title}</div>
                    <div className="result-meta">{item.company} | {item.contact} | Year:{item.year}</div>
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
