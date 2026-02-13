'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import DashboardLayout from '../components/DashboardLayout';
import { NavItem } from '../components/Sidebar';
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface BookingFormData {
  eventTitle: string;
  eventDate: string;
  location: string;
  bookedBy: string;
  priorityLevel: string;
  bookedPersonnel: string;
  bookedService: string;
  staffInvolved: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  bookedBy: string;
  bookedService: string;
  bookedPersonnel: string;
  priority: 'Done' | 'High' | 'Normal' | 'Urgent' | 'Low' | 'Ongoing';
  staffInvolved: string;
}

const priorityColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  Done: { bg: 'bg-[#e8f5e9]', text: 'text-[#4caf50]', border: 'border-l-[#4caf50]', dot: 'bg-[#4caf50]' },
  High: { bg: 'bg-[#fff3e0]', text: 'text-[#ff9800]', border: 'border-l-[#ff9800]', dot: 'bg-[#ff9800]' },
  Normal: { bg: 'bg-[#f5f5f5]', text: 'text-[#9e9e9e]', border: 'border-l-[#9e9e9e]', dot: 'bg-[#9e9e9e]' },
  Urgent: { bg: 'bg-[#e3f2fd]', text: 'text-[#00AEEF]', border: 'border-l-[#00AEEF]', dot: 'bg-[#00AEEF]' },
  Low: { bg: 'bg-[#f3e5f5]', text: 'text-[#9c27b0]', border: 'border-l-[#9c27b0]', dot: 'bg-[#9c27b0]' },
  Ongoing: { bg: 'bg-[#fff8e1]', text: 'text-[#ffc107]', border: 'border-l-[#ffc107]', dot: 'bg-[#ffc107]' },
};

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
  return day; 
};

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const getEventsForDate = (year: number, month: number, day: number, events: CalendarEvent[]) => {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return events.filter(e => e.date === dateStr);
};

const isToday = (year: number, month: number, day: number) => {
  const today = new Date();
  return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
};

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
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBookingConfirm, setShowBookingConfirm] = useState(false);
  const [bookingStatus, setBookingStatus] = useState<'success' | 'error'>('success');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [bookingForm, setBookingForm] = useState<BookingFormData>({
    eventTitle: '',
    eventDate: '',
    location: '',
    bookedBy: '',
    priorityLevel: '',
    bookedPersonnel: '',
    bookedService: '',
    staffInvolved: '',
  });
  const [serviceOptions, setServiceOptions] = useState<string[]>(['Transportation', 'Catering', 'Equipment', 'Venue']);
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch all projects once for suggestions
  useEffect(() => {
    fetch('/api/setup-projects').then(r => r.json()).then(setAllProjects).catch(() => {});
  }, []);

  // Fetch calendar events from API
  const fetchEvents = useCallback(() => {
    fetch('/api/calendar-events')
      .then(r => r.json())
      .then(setEvents)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

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

  const handleBookingInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({ ...prev, [name]: value }));
  };

  const handleConfirmBooking = async () => {
  // Validate required fields
  const errors: string[] = [];

  if (!bookingForm.eventTitle.trim()) {
    errors.push('Event Title is required');
  }
  if (!bookingForm.eventDate) {
    errors.push('Event Date is required');
  }
  if (!bookingForm.location.trim()) {
    errors.push('Location is required');
  }
  if (!bookingForm.priorityLevel) {
    errors.push('Priority Level is required');
  }

  if (errors.length > 0) {
    setValidationErrors(errors);
    return;
  }

  // Clear validation errors if validation passes
  setValidationErrors([]);

  try {
    const res = await fetch('/api/calendar-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: bookingForm.eventTitle,
        date: bookingForm.eventDate,
        location: bookingForm.location,
        bookedBy: bookingForm.bookedBy || 'N/A',
        bookedService: bookingForm.bookedService || 'N/A',
        bookedPersonnel: bookingForm.bookedPersonnel || 'N/A',
        priority: bookingForm.priorityLevel,
        staffInvolved: bookingForm.staffInvolved || 'N/A',
      }),
    });

    if (!res.ok) throw new Error('Failed to create event');

    const created = await res.json();
    setEvents(prev => [...prev, created]);
    setBookingStatus('success');
    setShowBookingConfirm(true);
    setShowBookingModal(false);

    // Reset form
    setBookingForm({
      eventTitle: '',
      eventDate: '',
      location: '',
      bookedBy: '',
      priorityLevel: '',
      bookedPersonnel: '',
      bookedService: '',
      staffInvolved: '',
    });
  } catch {
    setBookingStatus('error');
    setShowBookingConfirm(true);
  }
};


  const closeBookingModal = () => {
  setShowBookingModal(false);
  setShowAddService(false);
  setNewServiceName('');
  setValidationErrors([]);
};

  // Sort events: Today first, then Urgent/High/Normal for future dates, Done at bottom
  const sortedEvents = [...events].sort((a, b) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    dateA.setHours(0, 0, 0, 0);
    dateB.setHours(0, 0, 0, 0);

    const isAToday = dateA.getTime() === today.getTime();
    const isBToday = dateB.getTime() === today.getTime();
    const isADone = a.priority === 'Done';
    const isBDone = b.priority === 'Done';

    // Today events first
    if (isAToday && !isBToday) return -1;
    if (!isAToday && isBToday) return 1;

    // Done events last
    if (isADone && !isBDone) return 1;
    if (!isADone && isBDone) return -1;

    // Sort by date (ascending)
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }

    // Same date: sort by priority
    const priorityOrder: Record<string, number> = {
      'Urgent': 1,
      'High': 2,
      'Normal': 3,
      'Low': 4,
      'Ongoing': 5,
      'Done': 6
    };
    return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
  });

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === '__add_new__') {
      setShowAddService(true);
    } else {
      setBookingForm(prev => ({ ...prev, bookedService: e.target.value }));
    }
  };

  const handleAddNewService = () => {
    if (newServiceName.trim() && !serviceOptions.includes(newServiceName.trim())) {
      setServiceOptions(prev => [...prev, newServiceName.trim()]);
      setBookingForm(prev => ({ ...prev, bookedService: newServiceName.trim() }));
    }
    setShowAddService(false);
    setNewServiceName('');
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetailModal(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setEditingEvent(event);
    setShowEditModal(true);
  };

  const handleDeleteEvent = (event: CalendarEvent) => {
    setEventToDelete(event);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteEvent = async () => {
    if (eventToDelete) {
      try {
        await fetch(`/api/calendar-events/${eventToDelete.id}`, { method: 'DELETE' });
      } catch {
        // silently fail
      }
      setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
      setShowDeleteConfirm(false);
      setEventToDelete(null);
    }
  };

  const handleSaveEdit = async () => {
    if (editingEvent) {
      try {
        const res = await fetch(`/api/calendar-events/${editingEvent.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: editingEvent.title,
            date: editingEvent.date,
            location: editingEvent.location,
            bookedBy: editingEvent.bookedBy,
            bookedService: editingEvent.bookedService,
            bookedPersonnel: editingEvent.bookedPersonnel,
            priority: editingEvent.priority,
            staffInvolved: editingEvent.staffInvolved,
          }),
        });
        if (!res.ok) throw new Error('Failed to update event');
        const updated = await res.json();
        setEvents(prev => prev.map(e => e.id === updated.id ? updated : e));
      } catch {
        // silently fail — keep local state as-is
      }
      setShowEditModal(false);
      setEditingEvent(null);
    }
  };

  const generateCalendarDays = () => {
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);
  const days = [];

  // Add previous month's days
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: daysInPrevMonth - i, currentMonth: false });
  }
  
  // Add current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, currentMonth: true });
  }
  
  // Add next month's days to fill the grid
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, currentMonth: false });
  }

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
      <main className={`flex-1 py-6 px-[60px] flex flex-col items-center max-md:py-[30px] max-md:px-5 ${showResults ? 'items-start' : ''}`}>
        {activeNav === 'calendar' && (
          <div className="flex w-full gap-[30px] items-start">
            <div className="flex-1 bg-white rounded-[15px] p-[30px] shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-center gap-5 mb-2">
                <button className="bg-transparent border-none cursor-pointer p-[5px] flex items-center justify-center hover:opacity-70" onClick={handlePrevMonth}>
                  <Icon icon="mdi:chevron-left" width={24} height={24} color="#00AEEF" />
                </button>
                <h2 className="text-[28px] font-bold text-primary text-center">{monthNames[currentMonth]} {currentYear}</h2>
                <button className="bg-transparent border-none cursor-pointer p-[5px] flex items-center justify-center hover:opacity-70" onClick={handleNextMonth}>
                  <Icon icon="mdi:chevron-right" width={24} height={24} color="#00AEEF" />
                </button>
              </div>
              {/* Legend */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-[#4caf50]"></div>
                  <span className="text-xs text-[#666]">Done</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-[#ff9800]"></div>
                  <span className="text-xs text-[#666]">High</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-[#9e9e9e]"></div>
                  <span className="text-xs text-[#666]">Normal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-[#00AEEF]"></div>
                  <span className="text-xs text-[#666]">Today</span>
                </div>
              </div>
              <div className="w-full">
                <div className="grid grid-cols-7 mb-2.5">
                  {['SUNDAY','MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-primary p-2.5 tracking-[1px]">{day}</div>
                  ))}
                </div>
               <div className="grid grid-cols-7 border border-[#e0e0e0] border-r-0 border-b-0">
                {calendarDays.map((day, index) => {
                  const dayEvents = day.currentMonth ? getEventsForDate(currentYear, currentMonth, day.day, events) : [];
                  const isTodayDate = day.currentMonth && isToday(currentYear, currentMonth, day.day);
                  return (
                    <div
                      key={index}
                      className={`min-h-[80px] p-1.5 border-r border-b border-[#e0e0e0] ${(index % 7 === 0 || index % 7 === 6) ? 'bg-[#e8f4f8]' : 'bg-white'}`}
                    >
                      {isTodayDate ? (
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#00AEEF] ">
                          <span className="text-sm font-medium text-white">{day.day}</span>
                        </div>
                      ) : (
                        <span className={`text-sm font-medium ${!day.currentMonth ? 'text-[#ccc]' : 'text-primary'}`}>
                          {day.day}
                        </span>
                      )}
                      <div className="mt-1 flex flex-col gap-0.5">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            onClick={() => handleEventClick(event)}
                            className={`flex items-center gap-1 px-1 py-0.5 rounded text-[10px] truncate cursor-pointer transition-all hover:scale-105 hover:shadow-sm group relative ${priorityColors[event.priority]?.bg || 'bg-gray-100'}`}
                            title={`${event.title}\n${event.location}\n${event.bookedBy}`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityColors[event.priority]?.dot || 'bg-gray-400'}`}></div>
                            <span className={`truncate ${priorityColors[event.priority]?.text || 'text-gray-600'}`}>{event.title}</span>
                            {/* Tooltip */}
                            <div className="absolute left-0 bottom-full mb-1 hidden group-hover:block z-50 w-48 p-2 bg-white rounded-lg shadow-lg border border-gray-200 text-left">
                              <p className="text-xs font-bold text-primary mb-1">{event.title}</p>
                              <p className="text-[10px] text-gray-600"><span className="font-semibold">Date:</span> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                              <p className="text-[10px] text-gray-600"><span className="font-semibold">Location:</span> {event.location}</p>
                              <p className="text-[10px] text-gray-600"><span className="font-semibold">Booked by:</span> {event.bookedBy}</p>
                              <p className="text-[10px] text-gray-600"><span className="font-semibold">Priority:</span> <span className={priorityColors[event.priority]?.text}>{event.priority}</span></p>
                            </div>
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <span className="text-[9px] text-[#999] pl-1">+{dayEvents.length - 2} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>
            </div>
            <div className="w-[300px] shrink-0 flex flex-col">
              <button
                onClick={() => setShowBookingModal(true)}
                className="flex items-center justify-center gap-2 w-full py-[15px] px-[25px] bg-accent text-white border-none rounded-[30px] text-base font-semibold cursor-pointer transition-colors duration-200 mb-5 hover:bg-accent-hover"
              >
                <Icon icon="mdi:plus" width={20} height={20} />
                Book Appointment
              </button>
              <div className="bg-white rounded-[15px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.05)] flex flex-col overflow-hidden h-[580px]">
                <h3 className="text-xl font-bold text-primary mb-4 text-center shrink-0">Upcoming Events</h3>
                <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1">
                {sortedEvents.length === 0 ? (
                  <p className="text-sm text-[#999] italic">No upcoming events yet...</p>
                ) : (
                  sortedEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`border-l-4 ${priorityColors[event.priority]?.border || 'border-l-gray-400'} bg-white rounded-r-lg p-3 shadow-[0_1px_4px_rgba(0,0,0,0.08)]`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h4 className="text-sm font-bold text-primary leading-tight flex-1">{event.title}</h4>
                        <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded ${priorityColors[event.priority]?.bg || 'bg-gray-100'} ${priorityColors[event.priority]?.text || 'text-gray-600'}`}>
                          {event.priority}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#666] leading-relaxed space-y-0.5">
                        <p><span className="font-semibold text-[#333]">Event Date:</span> {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        <p><span className="font-semibold text-[#333]">Location:</span> {event.location}</p>
                        <p><span className="font-semibold text-[#333]">Booked by:</span> {event.bookedBy}</p>
                        <p><span className="font-semibold text-[#333]">Service:</span> {event.bookedService}</p>
                        <p className="flex items-center gap-1">
                          <span className="font-semibold text-[#333]">Personnel:</span>
                          <Icon icon="mdi:account" width={12} height={12} className="text-primary" />
                          {event.bookedPersonnel}
                        </p>
                        <p><span className="font-semibold text-[#333]">Staff Involved:</span> {event.staffInvolved}</p>
                      </div>
                      <div className="flex justify-end gap-1.5 mt-2.5 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="p-1.5 text-primary bg-primary/10 rounded hover:bg-primary/20 transition-colors"
                          title="Edit event"
                        >
                          <Icon icon="mdi:pencil" width={14} height={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event)}
                          className="p-1.5 text-red-500 bg-red-50 rounded hover:bg-red-100 transition-colors"
                          title="Delete event"
                        >
                          <Icon icon="mdi:delete" width={14} height={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              </div>
            </div>
          </div>
        )}

        {activeNav === 'archival' && !showResults && (
          <>
            <h1 className="text-6xl font-bold text-primary mb-[20px] mt-8 max-md:text-[32px] mt-25">Archival</h1>
            <div className="relative w-full max-w-[600px] mt-2">
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

      {/* Add Service Modal */}
      {showAddService && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[300]">
          <div className="bg-white rounded-lg w-full max-w-[300px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            <h3 className="text-base font-bold text-primary mb-3">Add New Service</h3>
            <input
              type="text"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              placeholder="Enter service name"
              className="w-full px-3 py-2 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setShowAddService(false); setNewServiceName(''); }}
                className="px-4 py-2 bg-gray-200 text-gray-600 rounded text-sm font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNewService}
                className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary-dark"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Appointment Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-[10px] w-full max-w-[420px] p-6 relative shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
            <button
              onClick={closeBookingModal}
              className="absolute top-3 right-3 text-[#999] hover:text-[#666] bg-transparent border-none cursor-pointer"
            >
              <Icon icon="mdi:close" width={20} height={20} />
            </button>

            <h2 className="text-xl font-bold text-primary mb-0.5">Book Appointment</h2>
            <p className="text-xs text-[#666] mb-4">Complete the form to confirm your appointment request.</p>

            {validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Icon icon="mdi:alert-circle" width={18} height={18} className="text-red-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-red-700 mb-1">Please fix the following errors:</p>
                  <ul className="text-xs text-red-600 list-disc list-inside space-y-0.5">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-[#333] mb-1">
                  Event Title<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="eventTitle"
                  value={bookingForm.eventTitle}
                  onChange={handleBookingInputChange}
                  className="w-full px-2.5 py-1.5 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#333] mb-1">
                    Event Date<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="eventDate"
                    value={bookingForm.eventDate}
                    onChange={handleBookingInputChange}
                    className="w-full px-2.5 py-1.5 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#333] mb-1">
                    Location<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={bookingForm.location}
                    onChange={handleBookingInputChange}
                    className="w-full px-2.5 py-1.5 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#333] mb-1">
                    Booked by:
                  </label>
                  <input
                    type="text"
                    name="bookedBy"
                    value={bookingForm.bookedBy}
                    onChange={handleBookingInputChange}
                    className="w-full px-2.5 py-1.5 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#333] mb-1">
                    Priority Level<span className="text-red-500">*</span>
                  </label>
                  <select
                    name="priorityLevel"
                    value={bookingForm.priorityLevel}
                    onChange={handleBookingInputChange}
                    className="w-full px-2.5 py-1.5 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="">Select priority</option>
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Normal">Normal</option>
                    <option value="Low">Low</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#333] mb-1">
                    Booked Personnel (optional)
                  </label>
                  <input
                    type="text"
                    name="bookedPersonnel"
                    value={bookingForm.bookedPersonnel}
                    onChange={handleBookingInputChange}
                    className="w-full px-2.5 py-1.5 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#333] mb-1">
                    Booked Service (optional)
                  </label>
                  <select
                    name="bookedService"
                    value={bookingForm.bookedService}
                    onChange={handleServiceChange}
                    className="w-full px-2.5 py-1.5 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="">Select service</option>
                    {serviceOptions.map((service) => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                    <option value="__add_new__" style={{ color: '#146184', fontWeight: 'bold' }}>+ Add Service Option</option>
                  </select>
                </div>
              </div>

              <div>
              <label className="block text-xs font-medium text-[#333] mb-1">
                Staff Involved (optional)
              </label>
              <input
                type="text"
                name="staffInvolved"
                value={bookingForm.staffInvolved}
                onChange={handleBookingInputChange}
                placeholder="e.g., John, Mary, Peter"
                className="w-full px-2.5 py-1.5 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary"
              />
            </div>

              <button
                onClick={handleConfirmBooking}
                className="mt-2 w-[160px] mx-auto py-2.5 px-5 bg-accent text-white border-none rounded-[10px] text-sm font-semibold cursor-pointer transition-colors duration-200 hover:bg-primary-dark"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {showEventDetailModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-[10px] w-full max-w-[400px] p-6 relative shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
            <button
              onClick={() => { setShowEventDetailModal(false); setSelectedEvent(null); }}
              className="absolute top-3 right-3 text-[#999] hover:text-[#666] bg-transparent border-none cursor-pointer"
            >
              <Icon icon="mdi:close" width={20} height={20} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className={`w-3 h-3 rounded-full ${priorityColors[selectedEvent.priority]?.dot}`}></div>
              <h2 className="text-xl font-bold text-primary">{selectedEvent.title}</h2>
            </div>

            <div className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 ${priorityColors[selectedEvent.priority]?.bg} ${priorityColors[selectedEvent.priority]?.text}`}>
              {selectedEvent.priority}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Icon icon="mdi:calendar" width={18} height={18} className="text-primary mt-0.5" />
                <div>
                  <p className="font-semibold text-[#333]">Event Date</p>
                  <p className="text-[#666]">{new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon icon="mdi:map-marker" width={18} height={18} className="text-primary mt-0.5" />
                <div>
                  <p className="font-semibold text-[#333]">Location</p>
                  <p className="text-[#666]">{selectedEvent.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon icon="mdi:account" width={18} height={18} className="text-primary mt-0.5" />
                <div>
                  <p className="font-semibold text-[#333]">Booked by</p>
                  <p className="text-[#666]">{selectedEvent.bookedBy}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon icon="mdi:room-service" width={18} height={18} className="text-primary mt-0.5" />
                <div>
                  <p className="font-semibold text-[#333]">Booked Service</p>
                  <p className="text-[#666]">{selectedEvent.bookedService}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon icon="mdi:account-tie" width={18} height={18} className="text-primary mt-0.5" />
                <div>
                  <p className="font-semibold text-[#333]">Booked Personnel</p>
                  <p className="text-[#666]">{selectedEvent.bookedPersonnel}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Icon icon="mdi:account-group" width={18} height={18} className="text-primary mt-0.5" />
                <div>
                  <p className="font-semibold text-[#333]">Staff Involved</p>
                  <p className="text-[#666]">{selectedEvent.staffInvolved}</p>
                </div>
            </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowEventDetailModal(false); handleEditEvent(selectedEvent); }}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Icon icon="mdi:pencil" width={16} height={16} />
                Edit
              </button>
              <button
                onClick={() => { setShowEventDetailModal(false); setSelectedEvent(null); }}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && editingEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-[10px] w-full max-w-[420px] p-6 relative shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
            <button
              onClick={() => { setShowEditModal(false); setEditingEvent(null); }}
              className="absolute top-3 right-3 text-[#999] hover:text-[#666] bg-transparent border-none cursor-pointer"
            >
              <Icon icon="mdi:close" width={20} height={20} />
            </button>

            <h2 className="text-xl font-bold text-primary mb-4">Edit Event</h2>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-[#333] mb-1">Event Title</label>
                <input
                  type="text"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#333] mb-1">Event Date</label>
                  <input
                    type="date"
                    value={editingEvent.date}
                    onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#333] mb-1">Location</label>
                  <input
                    type="text"
                    value={editingEvent.location}
                    onChange={(e) => setEditingEvent({ ...editingEvent, location: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#333] mb-1">Booked by</label>
                  <input
                    type="text"
                    value={editingEvent.bookedBy}
                    onChange={(e) => setEditingEvent({ ...editingEvent, bookedBy: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#333] mb-1">Priority Level</label>
                  <select
                    value={editingEvent.priority}
                    onChange={(e) => setEditingEvent({ ...editingEvent, priority: e.target.value as CalendarEvent['priority'] })}
                    className="w-full px-2.5 py-1.5 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary bg-white"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Normal">Normal</option>
                    <option value="Low">Low</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#333] mb-1">Booked Personnel</label>
                  <input
                    type="text"
                    value={editingEvent.bookedPersonnel}
                    onChange={(e) => setEditingEvent({ ...editingEvent, bookedPersonnel: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#333] mb-1">Booked Service</label>
                  <select
                    value={editingEvent.bookedService}
                    onChange={(e) => setEditingEvent({ ...editingEvent, bookedService: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary bg-white"
                  >
                    {serviceOptions.map((service) => (
                      <option key={service} value={service}>{service}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#333] mb-1">Staff Involved</label>
                <input
                  type="text"
                  value={editingEvent.staffInvolved}
                  onChange={(e) => setEditingEvent({ ...editingEvent, staffInvolved: e.target.value })}
                  placeholder="e.g., John, Mary, Peter"
                  className="w-full px-2.5 py-1.5 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => { setShowEditModal(false); setEditingEvent(null); }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && eventToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[250]">
          <div className="bg-white rounded-[10px] w-full max-w-[350px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <Icon icon="mdi:delete-alert" width={24} height={24} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-center text-[#333] mb-2">Delete Event</h3>
            <p className="text-sm text-center text-[#666] mb-4">
              Are you sure you want to delete <span className="font-semibold text-primary">{eventToDelete.title}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => { setShowDeleteConfirm(false); setEventToDelete(null); }}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteEvent}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Confirmation Modal */}
      {showBookingConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[250]">
          <div className="bg-white rounded-[10px] w-full max-w-[350px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.15)]">
            <div className="flex items-center justify-center mx-auto mb-4 mt-3">
              {bookingStatus === 'success' ? (
                <Icon icon="bi:check-circle-fill" width={45} height={45} color="#14AE5C" />
              ) : (
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
                  <Icon icon="mdi:alert-circle" width={45} height={45} className="text-red-500" />
                </div>
              )}
            </div>
            <h3 className="text-[24px] font-bold text-center mb-2" style={{ color: '#146184' }}>
              {bookingStatus === 'success' ? 'Booking Successful!' : 'Booking Failed'}
            </h3>
            <p className="text-[12px] text-center text-[#666] mb-6" style={{color: '#7B777C'}}>
              {bookingStatus === 'success' 
                ? 'Your appointment has been successfully booked and added to the calendar.' 
                : 'There was an error processing your booking. Please try again.'}
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setShowBookingConfirm(false)}
                className={`px-6 py-2 text-sm font-medium text-white rounded-lg transition-colors ${bookingStatus === 'success' ? 'bg-[#00AEEF] hover:bg-[#00AEEF]' : 'bg-red-500 hover:bg-red-600'}`}
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
