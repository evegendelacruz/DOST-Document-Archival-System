'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from '../components/AuthLayout';
import { Eye, EyeOff } from 'lucide-react';

type FieldStatus = 'idle' | 'checking' | 'available' | 'taken';

export default function SignUpPage() {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [birthday, setBirthday] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [nameStatus, setNameStatus] = useState<FieldStatus>('idle');
  const [emailStatus, setEmailStatus] = useState<FieldStatus>('idle');
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{ type: 'success' | 'error' | 'waiting' | 'approved'; message: string } | null>(null);
  const [registeredUserId, setRegisteredUserId] = useState<string | null>(null);
  const router = useRouter();
  const nameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emailDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check name availability
  useEffect(() => {
    if (nameDebounce.current) clearTimeout(nameDebounce.current);
    const trimmed = fullname.trim();
    if (trimmed.length < 2) { setNameStatus('idle'); return; }
    setNameStatus('checking');
    nameDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-name?fullName=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setNameStatus(data.exists ? 'taken' : 'available');
      } catch { setNameStatus('idle'); }
    }, 500);
    return () => { if (nameDebounce.current) clearTimeout(nameDebounce.current); };
  }, [fullname]);

  // Check email availability
  useEffect(() => {
    if (emailDebounce.current) clearTimeout(emailDebounce.current);
    const trimmed = email.trim();
    if (trimmed.length < 5 || !trimmed.includes('@')) { setEmailStatus('idle'); return; }
    setEmailStatus('checking');
    emailDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setEmailStatus(data.exists ? 'taken' : 'available');
      } catch { setEmailStatus('idle'); }
    }, 500);
    return () => { if (emailDebounce.current) clearTimeout(emailDebounce.current); };
  }, [email]);

  // Poll for approval status
  useEffect(() => {
    if (!registeredUserId || modal?.type !== 'waiting') return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/users/${registeredUserId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.isApproved) {
            setModal({ type: 'approved', message: 'Your account has been approved! Redirecting to login...' });
            clearInterval(pollInterval);
            setTimeout(() => {
              router.push('/');
            }, 2000);
          }
        }
      } catch {
        // silently fail
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [registeredUserId, modal?.type, router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (nameStatus === 'taken') { setError('Full name is already taken'); return; }
    if (emailStatus === 'taken') { setError('Email is already registered'); return; }
    if (contactNo.length > 0 && !contactNoValid) { setError('Contact number must be 11 digits starting with 09'); return; }
    if (!hasMinLength || !hasNumber || !hasSpecial) { setError('Password does not meet requirements'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName: fullname, contactNo: contactNo || null, birthday: birthday || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setModal({ type: 'error', message: data.error || 'Registration failed. Please try again.' });
        return;
      }
      setRegisteredUserId(data.id);
      setModal({ type: 'waiting', message: 'Your registration is pending admin approval. Please wait...' });
    } catch {
      setModal({ type: 'error', message: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const contactNoValid = contactNo.length === 11 && contactNo.startsWith('09');

  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const passwordValid = hasMinLength && hasNumber && hasSpecial;
  const passwordTouched = password.length > 0;

  const inputClass = (status: FieldStatus) =>
    status === 'taken' ? 'border-red-600 shadow-[0_0_0_2px_rgba(220,38,38,0.1)]' : status === 'available' ? 'border-green-600 shadow-[0_0_0_2px_rgba(22,163,74,0.1)]' : '';

  const inputBase = "w-full py-1.5 px-2 border border-[#d0d0d0] rounded-md text-[11px] transition-all duration-200 bg-white focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(20,97,132,0.1)] max-[480px]:py-[5px] max-[480px]:px-[7px] max-[480px]:text-[10px] max-[480px]:rounded-[5px]";

  return (
    <AuthLayout>
      <div className="w-full h-full overflow-y-auto px-4 py-10">
        <div className="bg-white rounded-[18px] shadow-[0_10px_40px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.1)] px-[25px] py-2.5 w-full max-w-[290px] min-h-[85vh] max-h-[90vh] z-10 relative mt-18 mx-auto flex flex-col justify-center max-[480px]:max-w-full max-[480px]:mx-2.5 max-[480px]:px-4 max-[480px]:rounded-[14px] max-[480px]:min-h-[85vh] max-[480px]:max-h-[85vh] max-[480px]:mt-12 mb-8">
        <h2 className="text-[19px] font-bold text-primary mb-0.5 text-left max-[480px]:text-base">Sign Up</h2>
        <p className="text-left text-[12px] text-[#666] mb-2.5 max-[480px]:text-[9px] max-[480px]:mb-2">
          Have an account? <Link href="/" className="text-accent no-underline font-bold hover:underline">Click here</Link>
        </p>

        <form onSubmit={handleSignUp}>
          {error && <div className="bg-red-100 text-red-600 py-2 px-3 rounded-lg text-xs mb-3.5 text-center max-[480px]:py-1.5 max-[480px]:px-2 max-[480px]:text-[10px] max-[480px]:mb-2">{error}</div>}
          <div className="mb-[7px] max-[480px]:mb-1.5">
            <label htmlFor="fullname" className="block text-[11px] text-[#666] mb-0.5 font-medium max-[480px]:text-[9px] max-[480px]:mb-px">Full Name</label>
            <input
              type="text"
              id="fullname"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              required
              className={`${inputBase} ${inputClass(nameStatus)}`}
            />
            {nameStatus === 'checking' && <span className="inline-block w-3 h-3 mt-1 border-2 border-[#d0d0d0] border-t-primary rounded-full [animation:spin_0.6s_linear_infinite]" />}
            {nameStatus === 'taken' && <span className="block text-[10px] mt-[3px] text-red-600 max-[480px]:text-[8px]">Name already exists</span>}
            {nameStatus === 'available' && <span className="block text-[10px] mt-[3px] text-green-600 max-[480px]:text-[8px]">Name is available</span>}
          </div>

          <div className="mb-[7px] max-[480px]:mb-1.5">
            <label htmlFor="email" className="block text-[11px] text-[#666] mb-0.5 font-medium max-[480px]:text-[9px] max-[480px]:mb-px">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`${inputBase} ${inputClass(emailStatus)}`}
            />
            {emailStatus === 'checking' && <span className="inline-block w-3 h-3 mt-1 border-2 border-[#d0d0d0] border-t-primary rounded-full [animation:spin_0.6s_linear_infinite]" />}
            {emailStatus === 'taken' && <span className="block text-[10px] mt-[3px] text-red-600 max-[480px]:text-[8px]">Email already registered</span>}
            {emailStatus === 'available' && <span className="block text-[10px] mt-[3px] text-green-600 max-[480px]:text-[8px]">Email is available</span>}
          </div>

          <div className="mb-[7px] max-[480px]:mb-1.5">
            <label htmlFor="contactNo" className="block text-[11px] text-[#666] mb-0.5 font-medium max-[480px]:text-[9px] max-[480px]:mb-px">Contact Number</label>
            <input
              type="tel"
              id="contactNo"
              value={contactNo}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                setContactNo(val);
              }}
              placeholder="e.g. 09123456789"
              className={`${inputBase} ${contactNo.length > 0 ? (contactNoValid ? 'border-green-600 shadow-[0_0_0_2px_rgba(22,163,74,0.1)]' : 'border-red-600 shadow-[0_0_0_2px_rgba(220,38,38,0.1)]') : ''}`}
            />
            {contactNo.length > 0 && !contactNoValid && (
              <span className="block text-[10px] mt-[3px] text-red-600 max-[480px]:text-[8px]">Invalid number</span>
            )}
          </div>

          <div className="mb-[7px] max-[480px]:mb-1.5">
            <label htmlFor="birthday" className="block text-[11px] text-[#666] mb-0.5 font-medium max-[480px]:text-[9px] max-[480px]:mb-px">Birthday</label>
            <input
              type="date"
              id="birthday"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className={inputBase}
            />
          </div>

          <div className="mb-[7px] max-[480px]:mb-1.5">
            <label htmlFor="password" className="block text-[11px] text-[#666] mb-0.5 font-medium max-[480px]:text-[9px] max-[480px]:mb-px">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`${inputBase} pr-8 max-[480px]:pr-7 ${passwordTouched ? (passwordValid ? 'border-green-600 shadow-[0_0_0_2px_rgba(22,163,74,0.1)]' : 'border-red-600 shadow-[0_0_0_2px_rgba(220,38,38,0.1)]') : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#666] hover:text-primary transition-colors max-[480px]:right-1.5"
              >
                {showPassword ? <EyeOff size={16} className="max-[480px]:w-3.5 max-[480px]:h-3.5" /> : <Eye size={16} className="max-[480px]:w-3.5 max-[480px]:h-3.5" />}
              </button>
            </div>
            {passwordTouched && !passwordValid && (
              <div className="flex flex-col gap-0.5 mt-1 max-[480px]:gap-px">
                <span className={`pw-rule text-[10px] flex items-center gap-1 max-[480px]:text-[8px] ${hasMinLength ? 'pass text-green-600' : 'fail text-red-600'}`}>At least 8 characters</span>
                <span className={`pw-rule text-[10px] flex items-center gap-1 max-[480px]:text-[8px] ${hasNumber ? 'pass text-green-600' : 'fail text-red-600'}`}>Contains a number</span>
                <span className={`pw-rule text-[10px] flex items-center gap-1 max-[480px]:text-[8px] ${hasSpecial ? 'pass text-green-600' : 'fail text-red-600'}`}>Contains a special character</span>
              </div>
            )}
          </div>

          <div className="mb-[7px] max-[480px]:mb-1.5">
            <label htmlFor="confirmPassword" className="block text-[11px] text-[#666] mb-0.5 font-medium max-[480px]:text-[9px] max-[480px]:mb-px">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={`${inputBase} pr-8 max-[480px]:pr-7`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#666] hover:text-primary transition-colors max-[480px]:right-1.5"
              >
                {showConfirmPassword ? <EyeOff size={16} className="max-[480px]:w-3.5 max-[480px]:h-3.5" /> : <Eye size={16} className="max-[480px]:w-3.5 max-[480px]:h-3.5" />}
              </button>
            </div>
          </div>

            <button type="submit" className="w-full py-[7px] bg-accent text-white border-none rounded-md text-[12px] font-semibold mt-1.5 cursor-pointer transition-colors duration-200 hover:bg-accent-hover active:translate-y-px max-[480px]:py-1.5 max-[480px]:text-[10px] max-[480px]:rounded-[5px]" disabled={loading || nameStatus === 'taken' || emailStatus === 'taken' || (passwordTouched && !passwordValid) || (contactNo.length > 0 && !contactNoValid)}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => { if (modal.type === 'error') setModal(null); }}>
          <div className="bg-white rounded-2xl py-7 px-6 max-w-[300px] w-[90%] text-center shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-[480px]:max-w-[260px] max-[480px]:py-[22px] max-[480px]:px-[18px]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3.5 flex justify-center">
              {modal.type === 'approved' && (
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="24" fill="#16a34a" />
                  <path d="M15 24l6 6 12-12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {modal.type === 'waiting' && (
                <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-500 rounded-full animate-spin" />
              )}
              {modal.type === 'error' && (
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="24" fill="#dc2626" />
                  <path d="M16 16l16 16M32 16l-16 16" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <h3 className="text-base font-bold text-[#333] mb-1.5 max-[480px]:text-sm">
              {modal.type === 'approved' && 'Account Approved!'}
              {modal.type === 'waiting' && 'Waiting for Approval'}
              {modal.type === 'error' && 'Registration Failed'}
            </h3>
            <p className="text-xs text-[#666] mb-[18px] max-[480px]:text-[11px]">{modal.message}</p>
            {modal.type === 'error' && (
              <button
                className="w-full py-[9px] border-none rounded-lg text-xs font-semibold cursor-pointer text-white transition-opacity duration-200 hover:opacity-90 bg-red-600"
                onClick={() => setModal(null)}
              >
                Try Again
              </button>
            )}
            {modal.type === 'approved' && (
              <p className="text-xs text-cyan-600 font-medium">Redirecting to login...</p>
            )}
            {modal.type === 'waiting' && (
              <p className="text-xs text-gray-500">This page will update automatically when approved.</p>
            )}
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
