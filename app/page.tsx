'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthLayout from './components/AuthLayout';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="w-[85vw] sm:w-full sm:max-w-[290px] bg-white rounded-[18px] shadow-[0_10px_40px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.1)] px-4 sm:px-[25px] py-6 min-h-[300px] max-h-[95vh] overflow-y-auto z-10 relative">
        <h2 className="text-[17px] sm:text-[19px] font-bold text-primary mb-1 text-left">Log In</h2>
        <p className="text-left text-[11px] sm:text-[12px] text-[#666] mb-2.5">
          No Account yet? <Link href="/signup" className="text-accent no-underline font-bold hover:underline">Click here</Link>
        </p>

        <form onSubmit={handleLogin}>
          {error && <div className="bg-red-100 text-red-600 py-2 px-3 rounded-lg text-[10px] sm:text-xs mb-3 text-center">{error}</div>}
          <div className="mb-[10px]">
            <label htmlFor="email" className="block text-[10px] sm:text-[11px] text-[#666] mb-0.5 font-medium">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full py-2 sm:py-1.5 px-2 border border-[#d0d0d0] rounded-md text-[11px] transition-all duration-200 bg-white focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(20,97,132,0.1)]"
            />
          </div>

          <div className="mb-[10px]">
            <label htmlFor="password" className="block text-[10px] sm:text-[11px] text-[#666] mb-0.5 font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full py-2 sm:py-1.5 px-2 pr-8 border border-[#d0d0d0] rounded-md text-[11px] transition-all duration-200 bg-white focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(20,97,132,0.1)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#666] hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <Link href="/forgot-password" className="block text-center text-[11px] text-primary no-underline mt-[15px] font-bold hover:underline">Forgot Password?</Link>
          </div>

          <button type="submit" className="w-full py-2 sm:py-[7px] bg-accent text-white border-none rounded-md text-[12px] font-semibold mt-1.5 cursor-pointer transition-colors duration-200 hover:bg-accent-hover active:translate-y-px" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
