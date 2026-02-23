'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';

interface User {
  id: string;
  fullName: string;
  profileImageUrl: string | null;
}

interface UserMentionInputProps {
  selectedUserIds: string[];
  onSelectionChange: (userIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function UserMentionInput({
  selectedUserIds,
  onSelectionChange,
  placeholder = 'Type @ to mention users...',
  disabled = false,
}: UserMentionInputProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch users on mount
  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
      })
      .catch(() => {});
  }, []);

  // Filter users based on input after '@'
  const filterUsers = useCallback(
    (searchText: string) => {
      const atIndex = searchText.lastIndexOf('@');
      if (atIndex === -1) {
        setShowDropdown(false);
        return;
      }

      const query = searchText.slice(atIndex + 1).toLowerCase();
      const filtered = users.filter(
        (user) =>
          !selectedUserIds.includes(user.id) &&
          user.fullName.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
      setShowDropdown(filtered.length > 0);
      setHighlightedIndex(0);
    },
    [users, selectedUserIds]
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    filterUsers(value);
  };

  // Handle user selection
  const selectUser = (user: User) => {
    onSelectionChange([...selectedUserIds, user.id]);
    setInputValue('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // Remove a selected user
  const removeUser = (userId: string) => {
    onSelectionChange(selectedUserIds.filter((id) => id !== userId));
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredUsers.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && filteredUsers[highlightedIndex]) {
      e.preventDefault();
      selectUser(filteredUsers[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get selected users details
  const selectedUsers = users.filter((user) => selectedUserIds.includes(user.id));

  return (
    <div className="relative">
      {/* Selected users as chips */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-1.5 px-2 py-1 bg-primary/10 rounded-full text-xs"
            >
              {user.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={user.fullName}
                  className="w-4 h-4 rounded-full object-cover"
                />
              ) : (
                <Icon
                  icon="mdi:account-circle"
                  width={16}
                  height={16}
                  className="text-primary"
                />
              )}
              <span className="text-primary font-medium">{user.fullName}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeUser(user.id)}
                  className="ml-0.5 text-primary/60 hover:text-primary transition-colors"
                >
                  <Icon icon="mdi:close" width={14} height={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Input field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.includes('@')) {
              filterUsers(inputValue);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-2.5 py-1.5 border border-[#d0d0d0] rounded text-sm focus:outline-none focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
        />

        {/* Dropdown */}
        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
          >
            {filteredUsers.map((user, index) => (
              <div
                key={user.id}
                onClick={() => selectUser(user)}
                className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${
                  index === highlightedIndex ? 'bg-primary/10' : 'hover:bg-gray-50'
                }`}
              >
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt={user.fullName}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <Icon
                    icon="mdi:account-circle"
                    width={32}
                    height={32}
                    className="text-gray-400"
                  />
                )}
                <span className="text-sm text-gray-700">{user.fullName}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {!disabled && (
        <p className="text-[10px] text-gray-400 mt-1">
          Type @ to search and mention users
        </p>
      )}
    </div>
  );
}
