'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from '../components/AuthLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resetError, setResetError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        setShowOtpModal(true);
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      setOtp(pasted.split(''));
      otpRefs.current[3]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 4) {
      setOtpError('Please enter the 4-digit code');
      return;
    }
    setOtpError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error);
      } else {
        setShowOtpModal(false);
        setShowResetModal(true);
      }
    } catch {
      setOtpError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setOtpError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOtpError(data.error);
      } else {
        setOtp(['', '', '', '']);
        otpRefs.current[0]?.focus();
        setOtpError('');
      }
    } catch {
      setOtpError('Failed to resend code');
    } finally {
      setResendLoading(false);
    }
  };

  const handleResetSubmit = async () => {
    setResetError('');
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.join(''), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error);
      } else {
        setShowResetModal(false);
        setShowSuccessModal(true);
      }
    } catch {
      setResetError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpBack = () => {
    setShowOtpModal(false);
    setOtp(['', '', '', '']);
    setOtpError('');
  };

  const handleResetBack = () => {
    setShowResetModal(false);
    setResetError('');
  };

  const handleOkay = () => {
    setShowSuccessModal(false);
    router.push('/');
  };

  const inputBase = "w-full py-1.5 px-2 border border-[#d0d0d0] rounded-md text-[11px] transition-all duration-200 bg-white focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(20,97,132,0.1)]";

  return (
    <AuthLayout>
      <div className="bg-white rounded-[18px] shadow-[0_10px_40px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.1)] px-[25px] py-2.5 w-full max-w-[290px] min-h-[43vh] max-h-[50vh] overflow-y-auto z-10 relative text-center flex flex-col justify-center leading-[1.7]">
        <h2 className="text-[18px] font-bold text-primary mb-0.5 text-left">Forgot Password</h2>
        <p className="text-left text-[11px] text-[#666] mb-2.5">Enter your email to receive a verification code</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-[7px]">
            <label htmlFor="email" className="block text-[11px] text-[#666] mb-0.5 font-medium text-left">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputBase}
            />
          </div>

          {error && <p className="text-red-500 text-[10px] mb-1">{error}</p>}

          <button type="submit" disabled={loading} className="w-full py-[7px] bg-accent text-white border-none rounded-md text-[12px] font-semibold mt-2 cursor-pointer transition-colors duration-200 hover:bg-accent-hover active:translate-y-px disabled:opacity-50">
            {loading ? 'Sending...' : 'Send Code'}
          </button>
        </form>

        <Link href="/" className="block mt-2 text-accent no-underline text-[12px] font-bold text-center hover:underline">Back</Link>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-[30px] shadow-[0_10px_40px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.15)] py-10 px-[35px] w-full max-w-[350px] text-center">
            <h2 className="text-xl font-bold text-primary mb-2.5">Verification Code</h2>
            <p className="text-[13px] text-[#666] mb-[25px]">Enter the 4-digit code sent to your email</p>

            <div className="flex justify-center gap-3 mb-6" onPaste={handleOtpPaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { otpRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-14 h-14 text-center text-2xl font-bold border-2 border-[#d0d0d0] rounded-lg focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(20,97,132,0.1)] transition-all duration-200"
                />
              ))}
            </div>

            {otpError && <p className="text-red-500 text-[12px] mb-2.5">{otpError}</p>}

            <button disabled={loading} className="w-full py-[13px] bg-accent text-white border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-accent-hover disabled:opacity-50" onClick={handleVerifyOtp}>
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button disabled={resendLoading} className="block w-full mt-[10px] py-2.5 bg-transparent border-none text-accent text-sm font-medium cursor-pointer hover:underline disabled:opacity-50" onClick={handleResendOtp}>
              {resendLoading ? 'Resending...' : 'Resend Code'}
            </button>
            <button className="block w-full mt-[5px] py-2.5 bg-transparent border-none text-[#666] text-sm font-medium cursor-pointer hover:underline" onClick={handleOtpBack}>
              Back
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-[30px] shadow-[0_10px_40px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.15)] py-10 px-[35px] w-full max-w-[350px] text-center">
            <h2 className="text-[19px] font-bold text-primary mb-2.5 text-left">Reset Password</h2>
            <p className="text-[12px] text-[#666] mb-[25px] text-left">Enter your new password</p>

            <div className="mb-[15px]">
              <label htmlFor="newPassword" className="block text-[11px] text-[#666] mb-0.5 font-medium text-left">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`${inputBase} pr-8`}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#666] hover:text-primary transition-colors"
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              </div>


              <div className="mb-[15px]">
                <label htmlFor="confirmPassword" className="block text-[11px] text-[#666] mb-0.5 font-medium text-left">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${inputBase} pr-8`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#666] hover:text-primary transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

            {resetError && <p className="text-red-500 text-[12px] mb-2.5">{resetError}</p>}

            <button disabled={loading} className="w-full py-[13px] bg-accent text-white border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-accent-hover disabled:opacity-50" onClick={handleResetSubmit}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button className="block w-full mt-[15px] py-2.5 bg-transparent border-none text-accent text-sm font-medium cursor-pointer hover:underline" onClick={handleResetBack}>
              Back
            </button>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-[30px] shadow-[0_10px_40px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.15)] py-10 px-[35px] w-full max-w-[350px] text-center">
            <div className="flex justify-center mb-[15px]">
              <Icon icon="lets-icons:check-fill" width={60} height={60} color="#22c55e" />
            </div>
            <h2 className="text-xl font-bold text-primary mb-2.5">Password Reset Successfully!</h2>
            <p className="text-[13px] text-[#666] mb-[25px]">You can now sign in with your new password</p>
            <button className="w-full py-[13px] bg-accent text-white border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-accent-hover" onClick={handleOkay}>
              Okay
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
