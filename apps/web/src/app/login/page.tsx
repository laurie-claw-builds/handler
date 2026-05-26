'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        setError('Invalid credentials.');
        setLoading(false);
        return;
      }

      const data = await res.json() as { access_token: string };

      // Store token in httpOnly cookie via server action
      await fetch('/api/auth/set-cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: data.access_token }),
      });

      router.push('/');
    } catch {
      setError('Connection error. Is the API running?');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-mono text-2xl font-bold text-accent tracking-widest">
            HANDLER
          </h1>
          <p className="text-text-dim text-sm mt-1 font-mono">AUTHENTICATE</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-panel border border-border rounded-lg p-8 space-y-4"
        >
          <div>
            <label className="block font-mono text-xs text-text-dim mb-1 tracking-widest uppercase">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-card border border-border rounded px-3 py-2 text-text font-mono text-sm focus:outline-none focus:border-accent transition-colors"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-text-dim mb-1 tracking-widest uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-card border border-border rounded px-3 py-2 text-text font-mono text-sm focus:outline-none focus:border-accent transition-colors"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="font-mono text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-dim text-white font-mono text-sm font-semibold py-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed tracking-widest uppercase mt-2"
          >
            {loading ? 'AUTHENTICATING...' : 'ENTER'}
          </button>
        </form>
      </div>
    </div>
  );
}
