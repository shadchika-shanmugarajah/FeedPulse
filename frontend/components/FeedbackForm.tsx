'use client';

import { useState } from 'react';
import { postFeedback } from '@/lib/api';

const categories = ['Bug', 'Feature Request', 'Improvement', 'Other'];

export default function FeedbackForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Bug');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus({ type: 'idle', message: '' });

    const result = await postFeedback({ title, description, category, submitterName: name, submitterEmail: email });
    setSubmitting(false);

    if (result.success) {
      setStatus({ type: 'success', message: 'Feedback submitted successfully.' });
      setTitle('');
      setDescription('');
      setName('');
      setEmail('');
      setCategory('Bug');
      return;
    }

    setStatus({ type: 'error', message: result.message || 'Unable to submit feedback.' });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h2 className="text-3xl font-semibold text-white">Submit feedback to your product team</h2>
        <p className="text-slate-400">Share concise feedback with optional contact details, then let AI classify and summarize your idea.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-[32px] border border-slate-800 bg-slate-950/95 p-8 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.8)]">
        <div className="grid gap-5 lg:grid-cols-2">
          <label className="block text-sm text-slate-300">
            Title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Clear and concise title"
              className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-4 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
              required
            />
          </label>
          <label className="block text-sm text-slate-300">
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-4 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20">
              {categories.map((option) => (
                <option key={option} value={option} className="bg-slate-950 text-slate-100">
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm text-slate-300">
          Description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the issue or suggestion in detail"
            rows={8}
            className="mt-3 w-full rounded-[28px] border border-slate-700 bg-slate-900 px-4 py-4 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
            minLength={20}
            required
          />
          <p className="mt-3 text-sm text-slate-500">{description.length}/2000 characters</p>
        </label>

        <div className="grid gap-5 lg:grid-cols-2">
          <label className="block text-sm text-slate-300">
            Name (optional)
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-4 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Email (optional)
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-3 w-full rounded-3xl border border-slate-700 bg-slate-900 px-4 py-4 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
            />
          </label>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button type="submit" disabled={submitting} className="inline-flex items-center justify-center rounded-3xl bg-cyan-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Send feedback'}
          </button>
          {status.type !== 'idle' ? (
            <p className={status.type === 'success' ? 'text-emerald-300' : 'text-rose-400'}>{status.message}</p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
