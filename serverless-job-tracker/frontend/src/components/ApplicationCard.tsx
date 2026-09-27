import { useState } from 'react';
import { BriefcaseBusiness, CalendarDays, ExternalLink, FileText, Paperclip, Trash2 } from 'lucide-react';
import type { JobApplication, ApplicationStatus } from '../types';
import { STATUSES } from '../types';
import { updateApplication, deleteApplication, uploadResume } from '../api';
import type { ToastKind } from './Toast';

interface ApplicationCardProps {
  item: JobApplication;
  onChanged: () => Promise<void>;
  onToast: (text: string, kind: ToastKind) => void;
}

const statusTone: Record<ApplicationStatus, string> = {
  WISHLIST: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  APPLIED: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:ring-sky-900',
  INTERVIEW: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:ring-amber-900',
  OFFER: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:ring-emerald-900',
  REJECTED: 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:ring-rose-900',
};

export default function ApplicationCard({ item, onChanged, onToast }: ApplicationCardProps) {
  const [busy, setBusy] = useState(false);

  async function run(successText: string, fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      await onChanged();
      onToast(successText, 'success');
    } catch (cause) {
      onToast(cause instanceof Error ? cause.message : 'Action failed.', 'error');
    } finally {
      setBusy(false);
    }
  }

  const createdDate = new Date(item.createdAt);
  const formattedDate = Number.isNaN(createdDate.getTime())
    ? null
    : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(createdDate);

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><BriefcaseBusiness size={18} aria-hidden="true" /></span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold text-slate-950 dark:text-white">{item.company}</h3>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusTone[item.status]}`}>{item.status[0] + item.status.slice(1).toLowerCase()}</span>
            </div>
            <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-300">{item.role}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
              {formattedDate && <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} aria-hidden="true" />Added {formattedDate}</span>}
              <span className="inline-flex items-center gap-1.5"><FileText size={14} aria-hidden="true" />{item.resumeKey ? `Resume attached: ${item.resumeKey.split('/').pop()}` : 'No resume attached'}</span>
              {item.jobUrl && <a href={item.jobUrl} target="_blank" rel="noreferrer" aria-label={`Open ${item.company} job posting in a new tab`} className="inline-flex items-center gap-1.5 font-medium text-violet-700 transition hover:text-violet-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-violet-300 dark:hover:text-violet-200"><ExternalLink size={14} aria-hidden="true" />Job posting</a>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <label className="sr-only" htmlFor={`status-${item.id}`}>Edit status for {item.company}</label>
          <select
            id={`status-${item.id}`}
            value={item.status}
            disabled={busy}
            onChange={(event) => void run('Status updated.', () => updateApplication(item.id, { status: event.target.value as ApplicationStatus }))}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-600 dark:focus:border-indigo-500 dark:focus:ring-indigo-950"
          >
            {STATUSES.map((status) => <option key={status} value={status}>{status[0] + status.slice(1).toLowerCase()}</option>)}
          </select>
          <label className="relative inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800">
            <Paperclip size={15} aria-hidden="true" />
            <span>{item.resumeKey ? 'Replace resume' : 'Attach resume'}</span>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            disabled={busy}
            className="sr-only"
            aria-label={`${item.resumeKey ? 'Replace' : 'Attach'} resume for ${item.company}`}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void run('Resume attached.', async () => updateApplication(item.id, { resumeKey: await uploadResume(file) }));
              event.target.value = '';
            }}
          />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Delete the application for ${item.company}? This cannot be undone.`)) {
                void run('Application deleted.', () => deleteApplication(item.id));
              }
            }}
            aria-label={`Delete ${item.company} application`}
            title="Delete application"
            className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-rose-900 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}
