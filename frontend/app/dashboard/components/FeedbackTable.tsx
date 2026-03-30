'use client';

interface FeedbackTableProps {
  items: Array<{
    _id: string;
    title: string;
    description?: string;
    category: string;
    ai_sentiment?: string;
    ai_priority?: number;
    ai_summary?: string;
    status: string;
    createdAt?: string;
  }>;
  totalCount: number;
  loading: boolean;
  error: string | null;
  onStatusChange: (id: string, nextStatus: string) => void;
}

const sentimentStyles: Record<string, string> = {
  Positive: 'bg-emerald-500/15 text-emerald-300',
  Neutral: 'bg-slate-700/80 text-slate-200',
  Negative: 'bg-rose-500/15 text-rose-300',
};

const statusOrder = ['New', 'In Review', 'Resolved'];

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return '—';
  }
}

const skeletonRows = Array.from({ length: 5 }).map((_, index) => (
  <div
    key={index}
    className="grid min-w-full grid-cols-[1.5fr_0.85fr_0.75fr_0.55fr_0.85fr_0.85fr] gap-0 px-4 py-5 text-sm text-slate-200"
  >
    <div className="space-y-3">
      <div className="h-4 w-3/4 rounded-full bg-slate-800/70 animate-pulse" />
      <div className="h-3 w-5/6 rounded-full bg-slate-800/70 animate-pulse" />
    </div>
    <div className="flex items-center">
      <div className="h-4 w-20 rounded-full bg-slate-800/70 animate-pulse" />
    </div>
    <div className="flex items-center">
      <div className="h-4 w-16 rounded-full bg-slate-800/70 animate-pulse" />
    </div>
    <div className="flex items-center">
      <div className="h-4 w-10 rounded-full bg-slate-800/70 animate-pulse" />
    </div>
    <div className="flex items-center">
      <div className="h-4 w-24 rounded-full bg-slate-800/70 animate-pulse" />
    </div>
    <div className="flex flex-col gap-3">
      <div className="h-4 w-24 rounded-full bg-slate-800/70 animate-pulse" />
      <div className="h-4 w-16 rounded-full bg-slate-800/70 animate-pulse" />
    </div>
  </div>
));

export default function FeedbackTable({ items, totalCount, loading, error, onStatusChange }: FeedbackTableProps) {
  return (
    <div className="rounded-[32px] border border-slate-800 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Feedback list</h2>
          <p className="mt-1 text-sm text-slate-400">AI-enriched items with sentiment and priority at a glance.</p>
        </div>
        <span className="inline-flex rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300">
          {items.length} on this page · {totalCount} total
        </span>
      </div>

      {error ? <p className="mt-6 text-rose-400">{error}</p> : null}
      {!error && loading && !items.length ? (
        <p className="mt-6 text-slate-300">Loading feedback...</p>
      ) : null}
      {!loading && !items.length ? (
        <p className="mt-6 text-slate-400">No feedback found for this filter. Try changing the filters or clearing search.</p>
      ) : null}

      <div className="mt-6 overflow-x-auto rounded-[28px] border border-slate-800 bg-slate-950">
        <div className="min-w-[900px]">
          <div className="grid min-w-full grid-cols-[1.5fr_0.85fr_0.75fr_0.55fr_0.85fr_0.85fr] gap-0 border-b border-slate-800 bg-slate-900/95 px-4 py-4 text-left text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
            <span>Title</span>
            <span>Category</span>
            <span>Sentiment</span>
            <span>Priority</span>
            <span>Date</span>
            <span>Status</span>
          </div>
          <div className="divide-y divide-slate-800 bg-slate-950">
            {loading && !items.length ? (
              skeletonRows
            ) : (
              items.map((item) => (
                <div
                  key={item._id}
                  className="grid min-w-full grid-cols-[1.5fr_0.85fr_0.75fr_0.55fr_0.85fr_0.85fr] gap-0 px-4 py-5 text-sm text-slate-200"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="text-slate-400">{item.ai_summary || item.description}</p>
                  </div>
                  <div className="text-slate-300">{item.category}</div>
                  <div>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${sentimentStyles[item.ai_sentiment || ''] || sentimentStyles.Neutral}`}
                    >
                      {item.ai_sentiment}
                    </span>
                  </div>
                  <div className="font-semibold text-white">{item.ai_priority}</div>
                  <div className="text-slate-400">{formatDate(item.createdAt)}</div>
                  <div className="flex flex-col gap-2">
                    <span className="inline-flex items-center justify-center rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                      {item.status}
                    </span>
                    {statusOrder.includes(item.status) ? (
                      <button
                        type="button"
                        className="rounded-2xl bg-cyan-500 px-3 py-1 text-xs font-semibold text-slate-950 transition hover:bg-cyan-400"
                        onClick={() => {
                          const nextIndex = statusOrder.indexOf(item.status) + 1;
                          const nextStatus = statusOrder[Math.min(nextIndex, statusOrder.length - 1)];
                          onStatusChange(item._id, nextStatus);
                        }}
                      >
                        Advance
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
