'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Icon } from '@iconify/react';
import { Cake, FileEdit, Clock, Tag, X, CalendarPlus } from 'lucide-react';

interface Notification {
  id: string;
  type: 'birthday' | 'edit-request' | 'liquidation' | 'untagging' | 'event-mention';
  title: string;
  message: string;
  time: string;
  read: boolean;
  eventId?: string;
  bookedByUserId?: string;
  bookedByName?: string;
  bookedByProfileUrl?: string;
}

interface ToastNotification extends Notification {
  isExiting?: boolean;
}

// Helper to get userId from localStorage
function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    return JSON.parse(stored)?.id || null;
  } catch {
    return null;
  }
}

const getNotificationIcon = (type: Notification['type'], size: 'sm' | 'md' = 'sm') => {
  const className = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  switch (type) {
    case 'birthday':
      return <Cake className={`${className} text-pink-500`} />;
    case 'edit-request':
      return <FileEdit className={`${className} text-blue-500`} />;
    case 'liquidation':
      return <Clock className={`${className} text-orange-500`} />;
    case 'untagging':
      return <Tag className={`${className} text-purple-500`} />;
    case 'event-mention':
      return <CalendarPlus className={`${className} text-cyan-500`} />;
    default:
      return <Icon icon="mdi:bell" className={`${className} text-gray-500 transition-all duration-300 hover:text-accent hover:scale-110 active:scale-90 active:transition-all active:duration-100`} />;
  }
};

const getNotificationBgColor = (type: Notification['type']) => {
  switch (type) {
    case 'birthday':
      return 'bg-pink-50';
    case 'edit-request':
      return 'bg-blue-50';
    case 'liquidation':
      return 'bg-orange-50';
    case 'untagging':
      return 'bg-purple-50';
    case 'event-mention':
      return 'bg-cyan-50';
    default:
      return 'bg-gray-50';
  }
};

const getNotificationBorderColor = (type: Notification['type']) => {
  switch (type) {
    case 'birthday':
      return 'border-l-pink-500';
    case 'edit-request':
      return 'border-l-blue-500';
    case 'liquidation':
      return 'border-l-orange-500';
    case 'untagging':
      return 'border-l-purple-500';
    case 'event-mention':
      return 'border-l-cyan-500';
    default:
      return 'border-l-gray-500';
  }
};

// Render toast icon - profile picture for event-mention, otherwise standard icon
const renderToastIcon = (notification: ToastNotification) => {
  if (notification.type === 'event-mention') {
    if (notification.bookedByProfileUrl) {
      return (
        <img
          src={notification.bookedByProfileUrl}
          alt={notification.bookedByName || 'User'}
          className="w-10 h-10 rounded-full object-cover border-2 border-[#00AEEF]"
        />
      );
    }
    // Default avatar with blue border
    return (
      <div className="w-10 h-10 rounded-full border-2 border-[#00AEEF] bg-gray-100 flex items-center justify-center">
        <Icon icon="mdi:account" className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  // Standard icon for other notification types
  return (
    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationBgColor(notification.type)}`}>
      {getNotificationIcon(notification.type, 'md')}
    </div>
  );
};

// Desktop Toast Notification Component
const ToastNotificationItem = ({
  notification,
  onClose,
  onClick,
}: {
  notification: ToastNotification;
  onClose: (id: string) => void;
  onClick?: (notification: ToastNotification) => void;
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 p-4 bg-white rounded-lg shadow-lg border-l-4 ${getNotificationBorderColor(
        notification.type
      )} min-w-[320px] max-w-[400px] transform transition-all duration-300 cursor-pointer hover:bg-gray-50 ${
        notification.isExiting
          ? 'translate-x-full opacity-0'
          : 'translate-x-0 opacity-100'
      }`}
    >
      {/* Icon / Profile Picture */}
      {renderToastIcon(notification)}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{notification.title}</p>
        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose(notification.id); }}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const previousNotificationIdsRef = useRef<Set<string>>(new Set());
  const shownToastIdsRef = useRef<Set<string>>(new Set());
  const router = useRouter();
  const pathname = usePathname();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Audio context for notification sounds (persistent)
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context on first user interaction
  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      // Resume if suspended
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    };

    // Initialize on any user interaction
    document.addEventListener('click', initAudio, { once: true });
    document.addEventListener('keydown', initAudio, { once: true });

    return () => {
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
  }, []);

  // Play notification sound using Web Audio API
  const playNotificationSound = useCallback(() => {
    try {
      // Create new context if needed
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;

      // Resume if suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Create oscillator for the notification tone
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set up a pleasant notification tone (two-tone chime)
      oscillator.frequency.setValueAtTime(830, audioContext.currentTime); // G#5
      oscillator.frequency.setValueAtTime(1046, audioContext.currentTime + 0.15); // C6
      oscillator.type = 'sine';

      // Volume envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.02);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.15);
      gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.17);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.4);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }, []);

  // Close toast with animation
  const closeToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isExiting: true } : t))
    );
    // Remove from DOM after animation
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;

    try {
      const res = await fetch('/api/notifications', {
        headers: { 'x-user-id': userId },
      });
      if (res.ok) {
        const data = await res.json();

        // Check for new notifications (after initial load)
        if (!isInitialLoad.current) {
          const newNotifications = data.filter(
            (n: Notification) =>
              !previousNotificationIdsRef.current.has(n.id) &&
              !shownToastIdsRef.current.has(n.id)
          );

          // Show toast for each new notification
          newNotifications.forEach((n: Notification) => {
            // Mark as shown to avoid duplicate toasts
            shownToastIdsRef.current.add(n.id);

            const toastNotification: ToastNotification = { ...n, isExiting: false };
            setToasts((prev) => [...prev, toastNotification]);
            playNotificationSound();

            // Auto-remove after 8 seconds
            setTimeout(() => {
              setToasts((prev) =>
                prev.map((t) => (t.id === n.id ? { ...t, isExiting: true } : t))
              );
              setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== n.id));
              }, 300);
            }, 8000);
          });
        } else {
          // On initial load, just record all IDs without showing toasts
          data.forEach((n: Notification) => {
            previousNotificationIdsRef.current.add(n.id);
          });
        }

        setNotifications(data);
        // Update the ref with current IDs
        data.forEach((n: Notification) => {
          previousNotificationIdsRef.current.add(n.id);
        });
        isInitialLoad.current = false;
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [playNotificationSound]);

  // Fetch notifications on mount and poll every 5 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark notification as read via API
  const markAsReadApi = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });
    } catch {
      // Silently fail
    }
  };

  // Mark all as read when dropdown is opened
  const handleToggleDropdown = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    // Mark all as read when opening the dropdown
    if (newIsOpen) {
      const unreadNotifications = notifications.filter((n) => !n.read);
      unreadNotifications.forEach((n) => markAsReadApi(n.id));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const markAsRead = (id: string) => {
    markAsReadApi(id);
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    notifications.filter((n) => !n.read).forEach((n) => markAsReadApi(n.id));
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  // Handle notification click - navigate to event for event-mention
  const handleNotificationClick = useCallback((notification: Notification) => {
    // Mark as read
    markAsReadApi(notification.id);
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));

    if (notification.type === 'event-mention' && notification.eventId) {
      setIsOpen(false);

      // If not on dashboard, navigate there first with the eventId as query param
      if (pathname !== '/dashboard') {
        // Store eventId in sessionStorage so dashboard can open it after navigation
        sessionStorage.setItem('pendingEventId', notification.eventId);
        router.push('/dashboard');
      } else {
        // Already on dashboard, dispatch custom event to open event modal
        const event = new CustomEvent('openEventModal', {
          detail: { eventId: notification.eventId }
        });
        window.dispatchEvent(event);
      }
    }
  }, [pathname, router]);

  // Handle toast notification click
  const handleToastClick = useCallback((notification: ToastNotification) => {
    // Mark as read
    markAsReadApi(notification.id);
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));

    // Close the toast
    closeToast(notification.id);

    if (notification.type === 'event-mention' && notification.eventId) {
      // If not on dashboard, navigate there first
      if (pathname !== '/dashboard') {
        sessionStorage.setItem('pendingEventId', notification.eventId);
        router.push('/dashboard');
      } else {
        // Already on dashboard, dispatch custom event to open event modal
        const event = new CustomEvent('openEventModal', {
          detail: { eventId: notification.eventId }
        });
        window.dispatchEvent(event);
      }
    }
  }, [pathname, router, closeToast]);

  // Render notification icon - profile picture for event-mention, otherwise standard icon
  const renderNotificationIcon = (notification: Notification, size: 'sm' | 'md' = 'sm') => {
    if (notification.type === 'event-mention') {
      const imgSize = size === 'sm' ? 'w-10 h-10' : 'w-10 h-10';
      if (notification.bookedByProfileUrl) {
        return (
          <img
            src={notification.bookedByProfileUrl}
            alt={notification.bookedByName || 'User'}
            className={`${imgSize} rounded-full object-cover border-2 border-[#00AEEF]`}
          />
        );
      }
      // Default avatar with blue border
      return (
        <div className={`${imgSize} rounded-full border-2 border-[#00AEEF] bg-gray-100 flex items-center justify-center`}>
          <Icon icon="mdi:account" className="w-6 h-6 text-gray-400" />
        </div>
      );
    }

    // Standard icon for other notification types
    return (
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationBgColor(notification.type)}`}>
        {getNotificationIcon(notification.type, size)}
      </div>
    );
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Bell Button */}
        <button
          onClick={handleToggleDropdown}
          className="relative bg-transparent border-none cursor-pointer p-[5px] text-[#666] transition-colors duration-200 hover:text-primary"
        >
          <Icon icon="mdi:bell-outline" width={24} height={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999999] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
              {notifications.some((n) => !n.read) && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                      !notification.read ? 'bg-cyan-50/50' : ''
                    }`}
                  >
                    {/* Icon / Profile Picture */}
                    {renderNotificationIcon(notification)}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button className="w-full text-center text-sm text-cyan-600 hover:text-cyan-700 font-medium">
                View all notifications
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Toast Notifications - Bottom Right */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3">
        {toasts.map((toast) => (
          <ToastNotificationItem
            key={toast.id}
            notification={toast}
            onClose={closeToast}
            onClick={handleToastClick}
          />
        ))}
      </div>
    </>
  );
}
