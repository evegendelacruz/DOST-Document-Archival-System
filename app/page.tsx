'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from './components/AuthLayout';

const DEMO_ACCOUNT = {
  email: 'admin@dost.gov.ph',
  password: 'password123'
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (email === DEMO_ACCOUNT.email && password === DEMO_ACCOUNT.password) {
      router.push('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <h2 className="auth-title">Log In</h2>
        <p className="auth-subtitle">
          No Account yet? <Link href="/signup" className="auth-link">Click here</Link>
        </p>

        <form onSubmit={handleLogin}>
          {error && <div className="error-message">{error}</div>}
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

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Link href="/forgot-password" className="forgot-password">Forgot Password?</Link>
          </div>

          <button type="submit" className="auth-button">
            Login
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
