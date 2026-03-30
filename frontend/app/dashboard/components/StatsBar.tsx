'use client';

interface StatsBarProps {
  stats: {
    total: number;
    openCount: number;
    avgPriority: number;
    topTag: string | null;
  };
  loading?: boolean;
}

function SkeletonCard({ width = 'w-16' }: { width?: string }) {
  return <div className={`h-10 rounded-full bg-slate-800/70 ${width} animate-pulse`} />;
}

export default function StatsBar({ stats, loading }: StatsBarProps) {
  const cardClass = 'rounded-[28px] bg-gradient-to-br from-slate-950/90 to-slate-900/80 p-6 shadow-[0_15px_40px_-20px_rgba(15,23,42,0.9)]';
  return (
    <div className="grid gap-4 rounded-[32px] border border-slate-800 bg-slate-900/90 p-6 sm:grid-cols-2 lg:grid-cols-4">
      <div className={cardClass}>
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Total Feedback</p>
        {loading ? <SkeletonCard width="w-24" /> : <p className="mt-4 text-4xl font-semibold text-white">{stats.total}</p>}
      </div>
      <div className={cardClass}>
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Open Items</p>
        {loading ? <SkeletonCard width="w-24" /> : <p className="mt-4 text-4xl font-semibold text-white">{stats.openCount}</p>}
      </div>
      <div className={cardClass}>
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Avg Priority</p>
        {loading ? <SkeletonCard width="w-24" /> : <p className="mt-4 text-4xl font-semibold text-white">{stats.avgPriority}</p>}
      </div>
      <div className={cardClass}>
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Top tag</p>
        {loading ? (
          <SkeletonCard width="w-24" />
        ) : (
          <p className="mt-4 text-2xl font-semibold text-white">{stats.topTag ?? '—'}</p>
        )}
      </div>
    </div>
  );
}
