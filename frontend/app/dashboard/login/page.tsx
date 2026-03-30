'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const response = await loginAdmin({ email, password });

    setLoading(false);
    if (response.success && response.data?.token) {
      localStorage.setItem('feedpulse_token', response.data.token);
      router.push('/dashboard');
      return;
    }

    setMessage(response.message || 'Login failed.');
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-10">
        <div className="rounded-[32px] border border-slate-800 bg-slate-900/80 p-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.85)]">
          <div className="mb-8 flex flex-col gap-4 text-center">
            <span className="mx-auto inline-flex rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
              Admin access
            </span>
            <div>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">Secure dashboard login</h1>
              <p className="mt-3 text-slate-400">Sign in to review AI-enriched customer feedback, update statuses, and monitor product priorities.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6">
            <label className="block text-sm text-slate-300">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-950 px-5 py-4 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                required
              />
            </label>

            <label className="block text-sm text-slate-300">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-950 px-5 py-4 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                required
              />
            </label>

            <button
              type="submit"
              className="inline-flex w-full justify-center rounded-3xl bg-cyan-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {message ? <p className="text-center text-sm text-rose-400">{message}</p> : null}
          </form>
        </div>
      </div>
    </main>
  );
}
