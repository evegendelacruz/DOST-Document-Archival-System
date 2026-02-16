'use client'
import React, { useRef, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { UserRoundMinus, Eye, EyeOff } from 'lucide-react';

type PageView = 'account-settings' | 'user-management';

const ProfilePage = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<PageView>('account-settings');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
        setShowUploadModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <DashboardLayout activePath="/profile">
      <div className="flex gap-6 p-6 bg-gray-50 min-h-screen">
        {/* Left Panel - Profile Card */}
        <div className="w-72 bg-white rounded-lg shadow-sm p-6 h-fit">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-700">Profile</h2>
            <span className="bg-green-500 text-white text-xs font-medium px-4 py-1.5 rounded-full">
              ADMIN
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

              {/* Upload Button - Positioned outside the image container */}
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

            <h3 className="mt-4 text-base font-bold text-cyan-600">JANE DOE</h3>
            <p className="text-sm text-gray-500">DOSTX000001</p>
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
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="flex-1">
          {currentView === 'account-settings' && <AccountSettings />}
          {currentView === 'user-management' && <UserManagement />}
        </div>
      </div>

      {/* Upload Success Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-100px max-w-sm mx-4 p-6">
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-18px font-bold text-[#146184] text-center mb-6">
              Profile Uploaded Successfully!
            </h2>

            {/* Okay Button */}
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
const AccountSettings = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    birthdate: '',
    password: '',
    contactNo: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSave = () => {
    console.log('Saving changes:', formData);
    setIsEditMode(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowSuccessModal(true);
  };

  const inputBaseClass = "w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none";
  const inputEnabledClass = `${inputBaseClass} focus:ring-1 focus:ring-cyan-500 bg-white`;
  const inputDisabledClass = `${inputBaseClass} bg-gray-100 text-gray-500 cursor-not-allowed`;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-cyan-600 mb-6">Account Settings</h2>

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
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-18px font-bold text-[#146184] text-center mb-6">
              Changes Saved Successfully!
            </h2>

            {/* Okay Button */}
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
const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Sample user data matching the design
  const [users, setUsers] = useState([
    { id: '1', name: 'Jane Doe', idNumber: 'DOSTX000004', email: 'olores.alaiza88@gmail.com', role: 'User' },
    { id: '2', name: 'Christian Harry Paasa', idNumber: 'DOSTX00003', email: 'paasa.harry123@gmail.com', role: 'User' },
    { id: '3', name: 'Evegen P. Dela Cruz', idNumber: 'DOSTX000001', email: 'pangan.kenneth123@gmail.com', role: 'Admin' },
    { id: '4', name: 'Jane Doe', idNumber: 'DOSTX000002', email: 'delacruz.evegen30@gmail.com', role: 'User' },
  ]);

  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers(users.map(user =>
      user.id === userId ? { ...user, role: newRole } : user
    ));
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.idNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-sm text-gray-800">{user.name}</td>
                <td className="px-4 py-4 text-sm text-gray-600">{user.idNumber}</td>
                <td className="px-4 py-4 text-sm text-cyan-600 hover:underline cursor-pointer">{user.email}</td>
                <td className="px-4 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="px-3 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-4">
                  {user.role === 'Admin' ? (
                    <div className="flex items-center justify-center">
                      <UserRoundMinus className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                        title="Approve"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Reject"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
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
    </div>
  );
};

export default ProfilePage;
