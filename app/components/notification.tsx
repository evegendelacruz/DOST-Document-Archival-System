'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { Cake, FileEdit, Clock, Tag, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'birthday' | 'edit-request' | 'liquidation' | 'untagging';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface ToastNotification extends Notification {
  isExiting?: boolean;
}

// Sample notifications data
const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'birthday',
    title: 'Birthday Reminder',
    message: "It's Jane Doe's birthday today!",
    time: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    type: 'edit-request',
    title: 'Edit Request',
    message: 'Christian Harry Paasa requested to edit Project SETUP-2024-001',
    time: '3 hours ago',
    read: false,
  },
  {
    id: '3',
    type: 'liquidation',
    title: 'Project Liquidation',
    message: 'Project SETUP-2024-005 liquidation deadline: 3 months remaining',
    time: '5 hours ago',
    read: false,
  },
  {
    id: '4',
    type: 'untagging',
    title: 'Upcoming Untagging',
    message: 'Project SETUP-2024-003 untagging: 9 months remaining (Q3)',
    time: '1 day ago',
    read: true,
  },
  {
    id: '5',
    type: 'birthday',
    title: 'Birthday Reminder',
    message: "Evegen P. Dela Cruz's birthday is tomorrow!",
    time: '1 day ago',
    read: true,
  },
  {
    id: '6',
    type: 'liquidation',
    title: 'Project Liquidation',
    message: 'URGENT: Project SETUP-2024-002 liquidation deadline: 15 days remaining!',
    time: '2 days ago',
    read: true,
  },
  {
    id: '7',
    type: 'untagging',
    title: 'Upcoming Untagging',
    message: 'Project SETUP-2024-007 untagging: 3 months remaining (Q1)',
    time: '3 days ago',
    read: true,
  },
];

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
    default:
      return <Icon icon="mdi:bell" className={`${className} text-gray-500`} />;
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
    default:
      return 'border-l-gray-500';
  }
};

// Helper to format liquidation countdown (7 months to 0)
const formatLiquidationCountdown = (months: number, days?: number): string => {
  if (months <= 0 && (!days || days <= 0)) {
    return 'Overdue!';
  }
  if (months <= 0 && days && days > 0) {
    return `${days} day${days > 1 ? 's' : ''} remaining!`;
  }
  return `${months} month${months > 1 ? 's' : ''} remaining`;
};

// Helper to format untagging countdown (12 months, quarterly)
const formatUntaggingCountdown = (months: number): string => {
  if (months <= 0) {
    return 'Due for untagging!';
  }
  const quarter = Math.ceil(months / 3);
  return `${months} month${months > 1 ? 's' : ''} remaining (Q${quarter})`;
};

// Desktop Toast Notification Component
const ToastNotificationItem = ({
  notification,
  onClose,
}: {
  notification: ToastNotification;
  onClose: (id: string) => void;
}) => {
  return (
    <div
      className={`flex items-start gap-3 p-4 bg-white rounded-lg shadow-lg border-l-4 ${getNotificationBorderColor(
        notification.type
      )} min-w-[320px] max-w-[400px] transform transition-all duration-300 ${
        notification.isExiting
          ? 'translate-x-full opacity-0'
          : 'translate-x-0 opacity-100'
      }`}
    >
      {/* Icon */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationBgColor(
          notification.type
        )}`}
      >
        {getNotificationIcon(notification.type, 'md')}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">{notification.title}</p>
        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={() => onClose(notification.id)}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Play notification sound using Web Audio API
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

      // Create oscillator for the notification tone
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set up a pleasant notification tone
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
      oscillator.frequency.setValueAtTime(1108.73, audioContext.currentTime + 0.1); // C#6 note
      oscillator.type = 'sine';

      // Fade in and out
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.15);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch {
      // Audio not supported or blocked, ignore
    }
  }, []);

  // Show toast notification
  const showToast = useCallback((notification: Notification) => {
    const toastNotification: ToastNotification = { ...notification, isExiting: false };
    setToasts((prev) => [...prev, toastNotification]);

    // Auto-remove after 8 seconds (longer duration)
    setTimeout(() => {
      closeToast(notification.id);
    }, 8000);
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

  // Add new notification (can be called from outside or for demo)
  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'time' | 'read'>) => {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        time: 'Just now',
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev]);
      playNotificationSound();
      showToast(newNotification);
    },
    [playNotificationSound, showToast]
  );

  // Demo: Simulate new notifications periodically
  useEffect(() => {
    const demoNotifications = [
      {
        type: 'birthday' as const,
        title: 'Birthday Reminder',
        message: "Don't forget! Maria Santos's birthday is coming up next week.",
      },
      {
        type: 'edit-request' as const,
        title: 'Edit Request',
        message: 'John Smith requested access to edit Project CEST-2024-010.',
      },
      {
        type: 'liquidation' as const,
        title: 'Project Liquidation',
        message: `Project SETUP-2024-012 liquidation: ${formatLiquidationCountdown(2)}`,
      },
      {
        type: 'liquidation' as const,
        title: 'Project Liquidation',
        message: `URGENT: Project SETUP-2024-015 liquidation: ${formatLiquidationCountdown(0, 7)}`,
      },
      {
        type: 'untagging' as const,
        title: 'Upcoming Untagging',
        message: `Project SETUP-2024-008 untagging: ${formatUntaggingCountdown(6)}`,
      },
      {
        type: 'untagging' as const,
        title: 'Upcoming Untagging',
        message: `Project SETUP-2024-011 untagging: ${formatUntaggingCountdown(12)}`,
      },
    ];

    // Demo: Add a random notification after 10 seconds (only once for demo)
    const timeout = setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * demoNotifications.length);
      addNotification(demoNotifications[randomIndex]);
    }, 10000);

    return () => clearTimeout(timeout);
  }, [addNotification]);

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

  // Mark all as read when dropdown is opened
  const handleToggleDropdown = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    // Mark all as read when opening the dropdown
    if (newIsOpen) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
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
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
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
                    onClick={() => markAsRead(notification.id)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                      !notification.read ? 'bg-cyan-50/50' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getNotificationBgColor(
                        notification.type
                      )}`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

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
          />
        ))}
      </div>
    </>
  );
}
