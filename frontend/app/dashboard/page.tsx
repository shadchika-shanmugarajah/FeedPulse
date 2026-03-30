'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchFeedback, updateFeedbackStatus } from '@/lib/api';
import FeedbackTable from '@/app/dashboard/components/FeedbackTable';
import StatsBar from '@/app/dashboard/components/StatsBar';

const categories = ['All', 'Bug', 'Feature Request', 'Improvement', 'Other'];
const statuses = ['All', 'New', 'In Review', 'Resolved'];
const sorts = [
  'createdAt desc',
  'createdAt asc',
  'ai_priority desc',
  'ai_priority asc',
  'ai_sentiment asc',
  'ai_sentiment desc',
];

export default function DashboardPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('createdAt desc');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1, limit: 10 });
  const [stats, setStats] = useState({
    total: 0,
    openCount: 0,
    avgPriority: 0,
    topTag: null as string | null,
  });
  const router = useRouter();

  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('feedpulse_token') : null), []);

  useEffect(() => {
    if (!token) {
      router.replace('/dashboard/login');
    }
  }, [router, token]);

  useEffect(() => {
    if (token) {
      loadFeedback();
    }
  }, [token, category, status, search, sort, page]);

  const loadFeedback = async () => {
    setLoading(true);
    setError(null);
    try {
      const filterParams: Record<string, string | number> = { page, limit: 10, sort };
      if (category !== 'All') filterParams.category = category;
      if (status !== 'All') filterParams.status = status;
      if (search) filterParams.search = search;
      const response = await fetchFeedback(token || '', filterParams);
      if (!response.success) {
        throw new Error(response.message || 'Failed to load feedback');
      }
      const nextItems = response.data.items || [];
      const nextMeta = response.data.meta || { total: 0, page: 1, pages: 1, limit: 10 };
      setItems(nextItems);
      setMeta(nextMeta);
      const s = response.data.stats;
      if (s) {
        setStats({
          total: s.total ?? 0,
          openCount: s.openCount ?? 0,
          avgPriority: s.avgPriority ?? 0,
          topTag: s.topTag ?? null,
        });
      } else {
        setStats((prev) => ({
          ...prev,
          total: nextMeta.total,
        }));
      }
    } catch (err) {
      setError((err as Error).message || 'Unable to fetch feedback');
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, nextStatus: string) => {
    if (!token) return;
    const response = await updateFeedbackStatus(token, id, nextStatus);
    if (response.success) {
      loadFeedback();
    } else {
      setError(response.message || 'Unable to update status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('feedpulse_token');
    router.push('/dashboard/login');
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[32px] border border-slate-800 bg-slate-900/80 p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.8)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">FeedPulse Admin</p>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Customer feedback, prioritized with AI.</h1>
              <p className="mt-3 max-w-2xl text-slate-400">Monitor feedback trends, surface sentiment, and keep your product roadmap sharply focused.</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Logout
            </button>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <aside className="space-y-6 rounded-[32px] border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/20">
            <div>
              <h2 className="text-lg font-semibold text-white">Filters</h2>
              <p className="mt-2 text-sm text-slate-400">Fine-tune your view to the most important items.</p>
            </div>
            <div className="grid gap-4">
              <label className="block text-sm text-slate-300">
                Category
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  disabled={loading}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {categories.map((option) => (
                    <option key={option} value={option} className="bg-slate-950 text-slate-100">
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                Status
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  disabled={loading}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {statuses.map((option) => (
                    <option key={option} value={option} className="bg-slate-950 text-slate-100">
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                Search
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Title or summary"
                  disabled={loading}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Sort
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  disabled={loading}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sorts.map((option) => (
                    <option key={option} value={option} className="bg-slate-950 text-slate-100">
                      {option
                        .replace('ai_priority', 'Priority')
                        .replace('ai_sentiment', 'Sentiment')
                        .replace('createdAt', 'Date')}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </aside>

          <div className="space-y-6">
            <StatsBar stats={stats} loading={loading} />
            <FeedbackTable
              items={items}
              totalCount={meta.total}
              loading={loading}
              error={error}
              onStatusChange={handleStatusChange}
            />
            <div className="flex flex-col gap-4 rounded-[32px] border border-slate-800 bg-slate-900/90 p-5 text-slate-300 sm:flex-row sm:items-center sm:justify-between">
              <span>Page {meta.page} of {meta.pages}</span>
              <div className="flex flex-wrap gap-3">
                <button disabled={page <= 1 || loading} className="rounded-2xl border border-slate-700 px-4 py-2 transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-800" onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  Previous
                </button>
                <button disabled={page >= meta.pages || loading} className="rounded-2xl border border-slate-700 px-4 py-2 transition disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-800" onClick={() => setPage((current) => Math.min(meta.pages, current + 1))}>
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
