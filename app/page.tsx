'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from './components/AuthLayout';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid email or password');
        return;
      }

      // Store user info in localStorage
      localStorage.setItem('user', JSON.stringify(data));
      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white rounded-[18px] shadow-[0_10px_40px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.1)] px-[18px] py-3.5 w-full max-w-[290px] max-h-[85vh] overflow-y-auto z-10 relative max-[480px]:max-w-full max-[480px]:mx-2.5 max-[480px]:px-4 max-[480px]:rounded-[14px] max-[480px]:max-h-[80vh]">
        <h2 className="text-[17px] font-bold text-primary mb-0.5 text-left max-[480px]:text-base">Log In</h2>
        <p className="text-left text-[10px] text-[#666] mb-2.5 max-[480px]:text-[9px] max-[480px]:mb-2">
          No Account yet? <Link href="/signup" className="text-accent no-underline font-medium hover:underline">Click here</Link>
        </p>

        <form onSubmit={handleLogin}>
          {error && <div className="bg-red-100 text-red-600 py-2 px-3 rounded-lg text-xs mb-3.5 text-center max-[480px]:py-1.5 max-[480px]:px-2 max-[480px]:text-[10px] max-[480px]:mb-2">{error}</div>}
          <div className="mb-[7px] max-[480px]:mb-1.5">
            <label htmlFor="email" className="block text-[10px] text-[#666] mb-0.5 font-medium max-[480px]:text-[9px] max-[480px]:mb-px">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full py-1.5 px-2 border border-[#d0d0d0] rounded-md text-[11px] transition-all duration-200 bg-white focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(20,97,132,0.1)] max-[480px]:py-[5px] max-[480px]:px-[7px] max-[480px]:text-[10px] max-[480px]:rounded-[5px]"
            />
          </div>

          <div className="mb-[7px] max-[480px]:mb-1.5">
            <label htmlFor="password" className="block text-[10px] text-[#666] mb-0.5 font-medium max-[480px]:text-[9px] max-[480px]:mb-px">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full py-1.5 px-2 border border-[#d0d0d0] rounded-md text-[11px] transition-all duration-200 bg-white focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(20,97,132,0.1)] max-[480px]:py-[5px] max-[480px]:px-[7px] max-[480px]:text-[10px] max-[480px]:rounded-[5px]"
            />
            <Link href="/forgot-password" className="block text-center text-[11px] text-primary no-underline mt-[5px] font-medium hover:underline">Forgot Password?</Link>
          </div>

          <button type="submit" className="w-full py-[7px] bg-accent text-white border-none rounded-md text-[11px] font-semibold mt-1.5 cursor-pointer transition-colors duration-200 hover:bg-accent-hover active:translate-y-px max-[480px]:py-1.5 max-[480px]:text-[10px] max-[480px]:rounded-[5px]" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
