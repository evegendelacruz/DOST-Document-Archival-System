'use client'
import React, { useRef, useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Eye, EyeOff, UserRoundMinus, Check, X } from 'lucide-react';

type PageView = 'account-settings' | 'user-management' | 'user-log';

interface UserData {
  id: string;
  email: string;
  fullName: string;
  contactNo: string | null;
  birthday: string | null;
  role: string;
  isApproved: boolean;
  profileImageUrl: string | null;
  createdAt: string;
}

const ProfilePage = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<PageView>('account-settings');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUser = useCallback(async () => {
    const stored = localStorage.getItem('user');
    if (!stored) return;
    const { id } = JSON.parse(stored);
    if (!id) return;
    const res = await fetch(`/api/users/${id}`);
    if (res.ok) {
      const data = await res.json();
      setUser(data);
      setProfileImage(data.profileImageUrl || null);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setProfileImage(base64);

      await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileImageUrl: base64 }),
      });

      setShowUploadModal(true);
    };
    reader.readAsDataURL(file);
  };

  return (
    <DashboardLayout activePath="/profile">
      <div className="flex gap-6 p-6 bg-gray-50 min-h-screen">
        {/* Left Panel - Profile Card */}
        <div className="w-72 bg-white rounded-lg shadow-sm p-6 h-fit">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-700">Profile</h2>
            <span className="bg-green-500 text-white text-xs font-medium px-4 py-1.5 rounded-full">
              {user?.role || 'STAFF'}
            </span>
          </div>

          <div className="flex flex-col items-center mb-6">
            {/* Profile Image Container */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-cyan-400 shadow-lg bg-gray-100">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUploadClick}
                className="absolute bottom-1 right-1 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center shadow-md hover:bg-cyan-600 transition-colors cursor-pointer z-10 border-2 border-white"
                title="Upload photo"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <h3 className="mt-4 text-base font-bold text-cyan-600">
              {user?.fullName?.toUpperCase() || 'Loading...'}
            </h3>
            <p className="text-sm text-gray-500">
              {user?.id ? `DOSTX${user.id.slice(0, 6).toUpperCase()}` : ''}
            </p>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setCurrentView('account-settings')}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors text-sm ${
                currentView === 'account-settings'
                  ? 'bg-cyan-50 text-cyan-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Account Settings
            </button>

            {user?.role === 'ADMIN' && (
              <button
                onClick={() => setCurrentView('user-management')}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors text-sm ${
                  currentView === 'user-management'
                    ? 'bg-cyan-50 text-cyan-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                User Management
              </button>
            )}

            <button
              onClick={() => setCurrentView('user-log')}
              className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors text-sm ${
                currentView === 'user-log'
                  ? 'bg-cyan-50 text-cyan-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              User Log
            </button>
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1">
          {currentView === 'account-settings' && user && (
            <AccountSettings user={user} onSave={fetchUser} />
          )}
          {currentView === 'user-management' && user && (
            <UserManagement currentUserId={user.id} />
          )}
          {currentView === 'user-log' && user && (
            <UserLog currentUserId={user.id} currentUserRole={user.role} />
          )}
        </div>
      </div>

      {/* Upload Success Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-100px max-w-sm mx-4 p-6">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-18px font-bold text-[#146184] text-center mb-6">
              Profile Uploaded Successfully!
            </h2>
            <button
              onClick={() => setShowUploadModal(false)}
              className="block w-25 py-1 mx-auto bg-cyan-500 text-white text-xs-s rounded-lg hover:bg-cyan-600 transition-colors"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

// Account Settings Component
const AccountSettings = ({ user, onSave }: { user: UserData; onSave: () => void }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    birthdate: '',
    password: '',
    contactNo: '',
    confirmPassword: ''
  });

  useEffect(() => {
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      birthdate: user.birthday ? user.birthday.slice(0, 10) : '',
      contactNo: user.contactNo || '',
      password: '',
      confirmPassword: '',
    });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    setError('');
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
    // Reset form to current user data
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      birthdate: user.birthday ? user.birthday.slice(0, 10) : '',
      contactNo: user.contactNo || '',
      password: '',
      confirmPassword: '',
    });
  };

  const handleSave = async () => {
    setError('');

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const payload: Record<string, string> = {
      fullName: formData.fullName,
      email: formData.email,
      contactNo: formData.contactNo,
      birthday: formData.birthdate,
    };

    if (formData.password.trim()) {
      payload.password = formData.password;
    }

    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to save changes.');
      return;
    }

    setIsEditMode(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowSuccessModal(true);
    onSave();
  };

  const inputBaseClass = "w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none";
  const inputEnabledClass = `${inputBaseClass} focus:ring-1 focus:ring-cyan-500 bg-white`;
  const inputDisabledClass = `${inputBaseClass} bg-gray-100 text-gray-500 cursor-not-allowed`;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-cyan-600 mb-6">Account Settings</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded">{error}</div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1.5">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            disabled={!isEditMode}
            className={isEditMode ? inputEnabledClass : inputDisabledClass}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1.5">Birthdate</label>
          <input
            type="date"
            name="birthdate"
            value={formData.birthdate}
            onChange={handleChange}
            disabled={!isEditMode}
            className={isEditMode ? inputEnabledClass : inputDisabledClass}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1.5">Contact No.</label>
          <input
            type="tel"
            name="contactNo"
            value={formData.contactNo}
            onChange={handleChange}
            disabled={!isEditMode}
            className={isEditMode ? inputEnabledClass : inputDisabledClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-xs text-gray-600 mb-1.5">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={!isEditMode}
            className={isEditMode ? inputEnabledClass : inputDisabledClass}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={!isEditMode}
              placeholder={isEditMode ? "Leave blank to keep current" : ""}
              className={`${isEditMode ? inputEnabledClass : inputDisabledClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => isEditMode && setShowPassword(!showPassword)}
              disabled={!isEditMode}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${isEditMode ? 'text-gray-500 hover:text-gray-700 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1.5">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={!isEditMode}
              className={`${isEditMode ? inputEnabledClass : inputDisabledClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => isEditMode && setShowConfirmPassword(!showConfirmPassword)}
              disabled={!isEditMode}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${isEditMode ? 'text-gray-500 hover:text-gray-700 cursor-pointer' : 'text-gray-400 cursor-not-allowed'}`}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {isEditMode ? (
          <>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-sm bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="px-5 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={handleEditClick}
            className="px-5 py-2 text-sm bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
          >
            Edit Account
          </button>
        )}
      </div>

      {/* Save Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-100px max-w-sm mx-4 p-6">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-18px font-bold text-[#146184] text-center mb-6">
              Changes Saved Successfully!
            </h2>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="block w-25 py-1 mx-auto bg-cyan-500 text-white text-xs-s rounded-lg hover:bg-cyan-600 transition-colors"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// User Management Component
interface UserPermissions {
  canAccessSetup: boolean;
  canAccessCest: boolean;
  canAccessMaps: boolean;
  canAccessCalendar: boolean;
  canAccessArchival: boolean;
  canManageUsers: boolean;
}

const UserManagement = ({ currentUserId }: { currentUserId: string }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState<string | null>(null);
  const [showRevokeModal, setShowRevokeModal] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [permissions, setPermissions] = useState<UserPermissions>({
    canAccessSetup: true,
    canAccessCest: true,
    canAccessMaps: true,
    canAccessCalendar: true,
    canAccessArchival: true,
    canManageUsers: false,
  });

  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  const handleDelete = async (userId: string) => {
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    if (res.ok) {
      setUsers(users.filter(u => u.id !== userId));
      setShowDeleteModal(null);
      setSuccessMessage('User deleted successfully!');
      setShowSuccessModal(true);
    }
  };

  const handleApprove = async (userId: string) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isApproved: true }),
    });
    if (res.ok) {
      setUsers(users.map(u => u.id === userId ? { ...u, isApproved: true } : u));
      setShowApproveModal(null);
      setSuccessMessage('User approved successfully!');
      setShowSuccessModal(true);
    }
  };

  const handleRevoke = async (userId: string) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isApproved: false }),
    });
    if (res.ok) {
      setUsers(users.map(u => u.id === userId ? { ...u, isApproved: false } : u));
      setShowRevokeModal(null);
      setSuccessMessage('User access revoked successfully!');
      setShowSuccessModal(true);
    }
  };

  const handleReject = async (userId: string) => {
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    if (res.ok) {
      setUsers(users.filter(u => u.id !== userId));
      setShowRejectModal(null);
      setSuccessMessage('User registration rejected!');
      setShowSuccessModal(true);
    }
  };

  const handleRowClick = async (user: UserData) => {
    setSelectedUser(user);

    // Fetch user permissions
    const res = await fetch(`/api/user-permissions/${user.id}`);
    if (res.ok) {
      const data = await res.json();
      setPermissions({
        canAccessSetup: data.canAccessSetup,
        canAccessCest: data.canAccessCest,
        canAccessMaps: data.canAccessMaps,
        canAccessCalendar: data.canAccessCalendar,
        canAccessArchival: data.canAccessArchival,
        canManageUsers: data.canManageUsers,
      });
    }
    setShowAccessModal(true);
  };

  const handlePermissionChange = (key: keyof UserPermissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    if (!selectedUser) return;

    const res = await fetch(`/api/user-permissions/${selectedUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(permissions),
    });

    if (res.ok) {
      setShowConfirmModal(false);
      setShowAccessModal(false);
      setSuccessMessage('Access control updated successfully!');
      setShowSuccessModal(true);
    }
  };

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-cyan-600 mb-4">User Management</h2>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative w-72">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search User"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-cyan-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">ID Number</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleRowClick(user)}
              >
                <td className="px-4 py-4 text-sm text-gray-800">{user.fullName}</td>
                <td className="px-4 py-4 text-sm text-gray-600">DOSTX{user.id.slice(0, 6).toUpperCase()}</td>
                <td className="px-4 py-4 text-sm text-cyan-600 hover:underline">{user.email}</td>
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={user.role === 'ADMIN' ? 'Admin' : 'Staff'}
                    onChange={(e) => handleRoleChange(user.id, e.target.value === 'Admin' ? 'ADMIN' : 'STAFF')}
                    disabled={user.id === currentUserId}
                    className="px-3 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <option value="Staff">Staff</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  {user.id === currentUserId ? (
                    <div className="flex items-center justify-center">
                      <span className="text-xs text-gray-400 italic">You</span>
                    </div>
                  ) : user.isApproved ? (
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => setShowRevokeModal(user.id)}
                        className="p-1.5 hover:bg-red-50 rounded-full transition-colors group"
                        title="Revoke user access"
                      >
                        <UserRoundMinus className="w-5 h-5 text-cyan-500 group-hover:text-red-500 transition-colors" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowApproveModal(user.id)}
                        className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                        title="Approve user"
                      >
                        <Check className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={() => setShowRejectModal(user.id)}
                        className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Reject user"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No users found matching your search.
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-800 text-center mb-2">Delete User</h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleDelete(showDeleteModal)}
                className="px-5 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-5 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm mx-4 p-6">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-gray-800 text-center mb-2">Approve User</h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              Are you sure you want to approve this user? They will be able to access the system.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleApprove(showApproveModal)}
                className="px-5 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => setShowApproveModal(null)}
                className="px-5 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Access Confirmation Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm mx-4 p-6">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <UserRoundMinus className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-gray-800 text-center mb-2">Revoke Access</h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              Are you sure you want to revoke this user's access? They will no longer be able to log in.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleRevoke(showRevokeModal)}
                className="px-5 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
              >
                Revoke Access
              </button>
              <button
                onClick={() => setShowRevokeModal(null)}
                className="px-5 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Registration Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm mx-4 p-6">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h2 className="text-lg font-bold text-gray-800 text-center mb-2">Reject Registration</h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              Are you sure you want to reject this registration? The user will be removed from the system.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => handleReject(showRejectModal)}
                className="px-5 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => setShowRejectModal(null)}
                className="px-5 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Access Control Modal */}
      {showAccessModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-cyan-600">Access Control</h2>
              <button
                onClick={() => setShowAccessModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Configure access permissions for <span className="font-semibold text-gray-800">{selectedUser.fullName}</span>
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <span className="text-sm text-gray-700">SETUP Projects</span>
                <input
                  type="checkbox"
                  checked={permissions.canAccessSetup}
                  onChange={() => handlePermissionChange('canAccessSetup')}
                  className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <span className="text-sm text-gray-700">CEST Projects</span>
                <input
                  type="checkbox"
                  checked={permissions.canAccessCest}
                  onChange={() => handlePermissionChange('canAccessCest')}
                  className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <span className="text-sm text-gray-700">Maps</span>
                <input
                  type="checkbox"
                  checked={permissions.canAccessMaps}
                  onChange={() => handlePermissionChange('canAccessMaps')}
                  className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <span className="text-sm text-gray-700">Calendar</span>
                <input
                  type="checkbox"
                  checked={permissions.canAccessCalendar}
                  onChange={() => handlePermissionChange('canAccessCalendar')}
                  className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <span className="text-sm text-gray-700">Archival</span>
                <input
                  type="checkbox"
                  checked={permissions.canAccessArchival}
                  onChange={() => handlePermissionChange('canAccessArchival')}
                  className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <span className="text-sm text-gray-700">User Management</span>
                <input
                  type="checkbox"
                  checked={permissions.canManageUsers}
                  onChange={() => handlePermissionChange('canManageUsers')}
                  className="w-5 h-5 text-cyan-600 rounded focus:ring-cyan-500"
                />
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowAccessModal(false)}
                className="px-5 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClick}
                className="px-5 py-2 text-sm bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-lg shadow-xl max-w-sm mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-800 text-center mb-2">Confirm Changes</h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              Are you sure you want to save the access control changes for this user?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleConfirmSave}
                className="px-5 py-2 text-sm bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-lg shadow-xl max-w-sm mx-4 p-6">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-lg font-bold text-[#146184] text-center mb-6">
              {successMessage || 'Action completed successfully!'}
            </h2>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="block w-full py-2 mx-auto bg-cyan-500 text-white text-sm rounded-lg hover:bg-cyan-600 transition-colors"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// User Log Component
interface UserLogData {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
}

interface UserLogProps {
  currentUserId: string;
  currentUserRole: string;
}

const UserLog = ({ currentUserId, currentUserRole }: UserLogProps) => {
  const [logs, setLogs] = useState<UserLogData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const isAdmin = currentUserRole === 'ADMIN';

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await fetch('/api/user-logs');
      if (res.ok) {
        const data = await res.json();
        // If staff, filter to only show their own logs
        if (!isAdmin) {
          setLogs(data.filter((log: UserLogData) => log.userId === currentUserId));
        } else {
          setLogs(data);
        }
      }
    };
    fetchLogs();
  }, [currentUserId, isAdmin]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const filteredLogs = logs.filter(log =>
    log.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-cyan-600 mb-4">
        {isAdmin ? 'User Log' : 'My Login History'}
      </h2>

      {/* Search Bar - Only show for admins */}
      {isAdmin && (
        <div className="mb-6">
          <div className="relative w-72">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search User"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-cyan-50">
              {isAdmin && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Role</th>
                </>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Time</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-cyan-700 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                {isAdmin && (
                  <>
                    <td className="px-4 py-4 text-sm text-gray-800">{log.user.fullName}</td>
                    <td className="px-4 py-4 text-sm text-cyan-600">{log.user.email}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        log.user.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {log.user.role}
                      </span>
                    </td>
                  </>
                )}
                <td className="px-4 py-4 text-sm text-gray-600">{formatDate(log.timestamp)}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{formatTime(log.timestamp)}</td>
                <td className="px-4 py-4">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                    {log.action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {isAdmin ? 'No login logs found.' : 'No login history found.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
