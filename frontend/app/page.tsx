import FeedbackForm from '../components/FeedbackForm';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="grid gap-8 rounded-[32px] border border-slate-800 bg-slate-900/80 p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.85)] lg:grid-cols-[1.2fr_1fr] lg:p-12">
          <div className="flex flex-col justify-center gap-6">
            <span className="inline-flex rounded-full bg-cyan-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">
              AI Product Feedback
            </span>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Collect feedback, prioritize product signal, and move faster.</h1>
              <p className="mt-4 max-w-xl text-lg leading-8 text-slate-300">
                FeedPulse transforms customer feedback into actionable AI insights. Submit product ideas, bugs, and improvements with a fast modern form.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-950/70 p-5 text-slate-200">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">AI category</p>
                <p className="mt-3 text-xl font-semibold text-white">Auto-classified feedback</p>
              </div>
              <div className="rounded-3xl bg-slate-950/70 p-5 text-slate-200">
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Priority score</p>
                <p className="mt-3 text-xl font-semibold text-white">Instant product signal</p>
              </div>
            </div>
          </div>
          <div className="rounded-[28px] bg-slate-950/90 p-8 shadow-xl shadow-cyan-500/10 ring-1 ring-slate-800">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Start collecting feedback</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Public submission form</h2>
              </div>
            </div>
            <FeedbackForm />
          </div>
        </section>
      </div>
    </main>
  );
}
