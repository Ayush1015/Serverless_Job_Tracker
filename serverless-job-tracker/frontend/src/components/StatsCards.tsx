import { BriefcaseBusiness, MessageCircleMore, Percent, Trophy } from 'lucide-react';
import type { JobApplication } from '../types';

interface StatsCardsProps {
  items: JobApplication[];
  loading: boolean;
}

export default function StatsCards({ items, loading }: StatsCardsProps) {
  const interviews = items.filter((item) => item.status === 'INTERVIEW').length;
  const offers = items.filter((item) => item.status === 'OFFER').length;
  const responses = items.filter((item) => ['INTERVIEW', 'OFFER', 'REJECTED'].includes(item.status)).length;
  const responseRate = items.length ? Math.round((responses / items.length) * 100) : 0;
  const metrics = [
    { label: 'Total applications', value: items.length, hint: 'Across every status', icon: BriefcaseBusiness },
    { label: 'Interviews', value: interviews, hint: 'Conversations in progress', icon: MessageCircleMore },
    { label: 'Offers', value: offers, hint: 'Offers received', icon: Trophy },
    { label: 'Response rate', value: `${responseRate}%`, hint: 'Interview, offer, or rejection', icon: Percent },
  ];

  return (
    <section aria-label="Application statistics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value, hint, icon: Icon }) => (
        <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
            <span className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300"><Icon size={17} aria-hidden="true" /></span>
          </div>
          {loading
            ? <span className="mt-4 block h-8 w-16 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            : <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-slate-950 dark:text-white">{value}</p>}
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        </article>
      ))}
    </section>
  );
}