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

  return (
    <AuthLayout>
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h2 className="auth-title" style={{ textAlign: 'center' }}>Forgot Password</h2>
        <p className="auth-subtitle" style={{ textAlign: 'center' }}>Check your email for the link</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button">
            Send Verification
          </button>
        </form>

        <Link href="/" className="back-link">Back</Link>
      </div>

      {showVerificationModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 className="modal-title">Verification Code</h2>
            <p className="modal-subtitle">Enter the code we sent you.</p>

            <div className="code-inputs">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="code-input"
                />
              ))}
            </div>

            <button className="modal-button" onClick={handleVerificationSubmit}>
              Submit
            </button>
            <button className="modal-back-link" onClick={handleVerificationBack}>
              Back
            </button>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 className="modal-title">Reset Password</h2>
            <p className="modal-subtitle">Check your email for the link</p>

            <div className="modal-form">
              <div className="form-group">
                <label htmlFor="newPassword">Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button className="modal-button" onClick={handleResetSubmit}>
              Send Verification
            </button>
            <button className="modal-back-link" onClick={handleResetBack}>
              Back
            </button>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <Icon icon="lets-icons:check-fill" className="success-icon" width={60} height={60} color="#22c55e" />
            <h2 className="modal-title">Password Reset Successfully!</h2>
            <p className="modal-subtitle">You can now sign in with your new password</p>
            <button className="modal-button" onClick={handleOkay}>
              Okay
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
