'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import AuthLayout from '../components/AuthLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [code, setCode] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowVerificationModal(true);
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      if (value && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerificationSubmit = () => {
    setShowVerificationModal(false);
    setShowResetModal(true);
  };

  const handleVerificationBack = () => {
    setShowVerificationModal(false);
    setCode(['', '', '', '']);
  };

  const handleResetSubmit = () => {
    setShowResetModal(false);
    setShowSuccessModal(true);
  };

  const handleResetBack = () => {
    setShowResetModal(false);
    setShowVerificationModal(true);
  };

  const handleOkay = () => {
    setShowSuccessModal(false);
    router.push('/');
  };

  const inputBase = "w-full py-1.5 px-2 border border-[#d0d0d0] rounded-md text-[11px] transition-all duration-200 bg-white focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(20,97,132,0.1)]";

  return (
    <AuthLayout>
      <div className="bg-white rounded-[18px] shadow-[0_10px_40px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.1)] px-[18px] py-3.5 w-full max-w-[290px] max-h-[85vh] overflow-y-auto z-10 relative text-center">
        <h2 className="text-[17px] font-bold text-primary mb-0.5 text-center">Forgot Password</h2>
        <p className="text-center text-[10px] text-[#666] mb-2.5">Check your email for the link</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-[7px]">
            <label htmlFor="email" className="block text-[10px] text-[#666] mb-0.5 font-medium">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputBase}
            />
          </div>

          <button type="submit" className="w-full py-[7px] bg-accent text-white border-none rounded-md text-[11px] font-semibold mt-1.5 cursor-pointer transition-colors duration-200 hover:bg-accent-hover active:translate-y-px">
            Send Verification
          </button>
        </form>

        <Link href="/" className="block mt-5 text-accent no-underline text-sm font-medium text-center hover:underline">Back</Link>
      </div>

      {showVerificationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-[30px] shadow-[0_10px_40px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.15)] py-10 px-[35px] w-full max-w-[350px] text-center">
            <h2 className="text-xl font-bold text-primary mb-2.5">Verification Code</h2>
            <p className="text-[13px] text-[#666] mb-[25px]">Enter the code we sent you.</p>

            <div className="flex justify-center gap-2.5 mb-[25px]">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-[50px] h-[50px] text-center text-xl font-semibold border border-[#d0d0d0] rounded-[10px] outline-none transition-all duration-200 focus:border-accent focus:shadow-[0_0_0_3px_rgba(0,174,239,0.1)]"
                />
              ))}
            </div>

            <button className="w-full py-[13px] bg-accent text-white border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-accent-hover" onClick={handleVerificationSubmit}>
              Submit
            </button>
            <button className="block w-full mt-[15px] py-2.5 bg-transparent border-none text-accent text-sm font-medium cursor-pointer hover:underline" onClick={handleVerificationBack}>
              Back
            </button>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-[30px] shadow-[0_10px_40px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.15)] py-10 px-[35px] w-full max-w-[350px] text-center">
            <h2 className="text-xl font-bold text-primary mb-2.5">Reset Password</h2>
            <p className="text-[13px] text-[#666] mb-[25px]">Check your email for the link</p>

            <div className="text-left mb-2.5">
              <div className="mb-[15px]">
                <label htmlFor="newPassword" className="block text-[10px] text-[#666] mb-0.5 font-medium">Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputBase}
                />
              </div>

              <div className="mb-[15px]">
                <label htmlFor="confirmPassword" className="block text-[10px] text-[#666] mb-0.5 font-medium">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputBase}
                />
              </div>
            </div>

            <button className="w-full py-[13px] bg-accent text-white border-none rounded-[10px] text-[15px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-accent-hover" onClick={handleResetSubmit}>
              Send Verification
            </button>
            <button className="block w-full mt-[15px] py-2.5 bg-transparent border-none text-accent text-sm font-medium cursor-pointer hover:underline" onClick={handleResetBack}>
              Back
            </button>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-[30px] shadow-[0_10px_40px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.15)] py-10 px-[35px] w-full max-w-[350px] text-center">
            <Icon icon="lets-icons:check-fill" className="mb-[15px]" width={60} height={60} color="#22c55e" />
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
