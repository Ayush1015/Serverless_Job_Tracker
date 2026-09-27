import { ArrowRight, ExternalLink } from 'lucide-react';
import type { ApplicationStatus, JobApplication } from '../types';
import EmptyState from './EmptyState';
import StatsCards from './StatsCards';

interface DashboardProps {
  items: JobApplication[];
  loading: boolean;
  onAdd: () => void;
  onViewAll: () => void;
}

const breakdown: { status: ApplicationStatus; label: string; color: string; dot: string }[] = [
  { status: 'WISHLIST', label: 'Wishlist', color: 'bg-slate-400', dot: 'bg-slate-400' },
  { status: 'APPLIED', label: 'Applied', color: 'bg-violet-600', dot: 'bg-violet-600' },
  { status: 'INTERVIEW', label: 'Interview', color: 'bg-amber-500', dot: 'bg-amber-500' },
  { status: 'OFFER', label: 'Offer', color: 'bg-emerald-500', dot: 'bg-emerald-500' },
  { status: 'REJECTED', label: 'Rejected', color: 'bg-rose-500', dot: 'bg-rose-500' },
];

function StatusBreakdown({ items, loading }: { items: JobApplication[]; loading: boolean }) {
  const counts = breakdown.map((entry) => ({ ...entry, count: items.filter((item) => item.status === entry.status).length }));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6" aria-labelledby="breakdown-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="breakdown-heading" className="text-base font-semibold text-slate-900 dark:text-white">Application pipeline</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A snapshot of where things stand.</p>
        </div>
        <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400">{loading ? '…' : items.length} total</span>
      </div>

      <div role="img" aria-label={counts.map(({ label, count }) => `${label}: ${count}`).join(', ')} className="mt-6 flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        {!loading && items.length > 0 && counts.map(({ status, count, color }) => count > 0 && (
          <span key={status} className={`${color} transition-[width] duration-500`} style={{ width: `${(count / items.length) * 100}%` }} />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 xl:grid-cols-5">
        {counts.map(({ status, label, count, dot }) => (
          <div key={status} className="flex min-w-0 items-center gap-2 text-sm">
            <span className={`size-2 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
            <span className="truncate text-slate-600 dark:text-slate-300">{label}</span>
            {loading ? <span className="ml-auto h-4 w-5 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /> : <span className="ml-auto tabular-nums font-medium text-slate-900 dark:text-white">{count}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentApplications({ items, loading, onAdd, onViewAll }: DashboardProps) {
  const recent = [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 5);
  const tone: Record<ApplicationStatus, string> = {
    WISHLIST: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    APPLIED: 'bg-violet-50 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300',
    INTERVIEW: 'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300',
    OFFER: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300',
    REJECTED: 'bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300',
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-labelledby="recent-heading">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
        <div>
          <h2 id="recent-heading" className="text-base font-semibold text-slate-900 dark:text-white">Recent applications</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your latest additions to the pipeline.</p>
        </div>
        {items.length > 0 && <button type="button" onClick={onViewAll} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-violet-700 transition hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-violet-300 dark:hover:bg-violet-950">View all <ArrowRight size={15} aria-hidden="true" /></button>}
      </div>
      {loading ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800" role="status" aria-label="Loading recent applications">
          {[0, 1, 2].map((key) => <div key={key} className="flex items-center gap-3 px-5 py-4 sm:px-6"><span className="size-9 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" /><span className="h-4 w-40 animate-pulse rounded bg-slate-200 dark:bg-slate-800" /><span className="ml-auto h-6 w-20 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" /></div>)}
        </div>
      ) : recent.length === 0 ? (
        <div className="p-4 sm:p-6"><EmptyState searching={false} onAdd={onAdd} /></div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {recent.map((item) => {
            const date = new Date(item.createdAt);
            const dateLabel = Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
            return (
              <li key={item.id} className="flex min-w-0 items-center gap-3 px-5 py-4 transition hover:bg-slate-50/70 dark:hover:bg-slate-800/40 sm:px-6">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-sm font-semibold text-violet-700 dark:bg-violet-950/70 dark:text-violet-300">{item.company.trim().slice(0, 1).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{item.company}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.role}</p>
                </div>
                <span className={`hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex ${tone[item.status]}`}>{item.status[0] + item.status.slice(1).toLowerCase()}</span>
                {item.jobUrl && <a href={item.jobUrl} target="_blank" rel="noreferrer" aria-label={`Open ${item.company} job link`} className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:bg-slate-800 dark:hover:text-violet-300"><ExternalLink size={15} aria-hidden="true" /></a>}
                <time className="w-16 shrink-0 text-right text-xs text-slate-500 dark:text-slate-400">{dateLabel}</time>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function Dashboard({ items, loading, onAdd, onViewAll }: DashboardProps) {
  return (
    <div className="space-y-6">
      <StatsCards items={items} loading={loading} />
      <div className="grid items-start gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <StatusBreakdown items={items} loading={loading} />
        <RecentApplications items={items} loading={loading} onAdd={onAdd} onViewAll={onViewAll} />
      </div>
    </div>
  );
}