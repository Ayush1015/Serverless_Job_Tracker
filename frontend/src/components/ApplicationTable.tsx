import { useState } from 'react';
import { ExternalLink, Paperclip, Trash2 } from 'lucide-react';
import { deleteApplication, updateApplication, uploadResume } from '../api';
import { STATUSES, type ApplicationStatus, type JobApplication } from '../types';
import type { ToastKind } from './Toast';

interface ApplicationTableProps {
  items: JobApplication[];
  onChanged: () => Promise<void>;
  onToast: (text: string, kind: ToastKind) => void;
}

const statusTone: Record<ApplicationStatus, string> = {
  WISHLIST: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  APPLIED: 'bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300',
  INTERVIEW: 'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300',
  OFFER: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300',
  REJECTED: 'bg-rose-50 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300',
};

function ApplicationTableRow({ item, onChanged, onToast }: { item: JobApplication; onChanged: () => Promise<void>; onToast: ApplicationTableProps['onToast'] }) {
  const [busy, setBusy] = useState(false);

  async function run(success: string, action: () => Promise<unknown>) {
    setBusy(true);
    try {
      await action();
      await onChanged();
      onToast(success, 'success');
    } catch (cause) {
      onToast(cause instanceof Error ? cause.message : 'Action failed.', 'error');
    } finally {
      setBusy(false);
    }
  }

  const date = new Date(item.createdAt);
  const dateLabel = Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);

  return (
    <tr className="group border-t border-slate-100 transition hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40">
      <td className="px-5 py-4">
        <div className="max-w-52 truncate text-sm font-semibold text-slate-900 dark:text-white" title={item.company}>{item.company}</div>
      </td>
      <td className="px-4 py-4"><div className="max-w-56 truncate text-sm text-slate-600 dark:text-slate-300" title={item.role}>{item.role}</div></td>
      <td className="px-4 py-4">
        <label className="sr-only" htmlFor={`table-status-${item.id}`}>Change status for {item.company}</label>
        <select id={`table-status-${item.id}`} value={item.status} disabled={busy} onChange={(event) => void run('Status updated.', () => updateApplication(item.id, { status: event.target.value as ApplicationStatus }))} className={`h-8 max-w-32 rounded-full border-0 px-3 text-xs font-semibold outline-none ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-violet-500 dark:ring-slate-700 ${statusTone[item.status]}`}>
          {STATUSES.map((status) => <option key={status} value={status}>{status[0] + status.slice(1).toLowerCase()}</option>)}
        </select>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500 dark:text-slate-400">{dateLabel}</td>
      <td className="px-4 py-4">
        {item.jobUrl ? <a href={item.jobUrl} target="_blank" rel="noreferrer" aria-label={`Open ${item.company} job link in a new tab`} className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-violet-50 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:bg-violet-950 dark:hover:text-violet-300"><ExternalLink size={16} aria-hidden="true" /></a> : <span className="text-slate-300 dark:text-slate-700">—</span>}
      </td>
      <td className="px-4 py-4">
        <label className="inline-flex max-w-40 cursor-pointer items-center gap-1.5 text-xs font-medium text-slate-600 transition hover:text-violet-700 focus-within:rounded focus-within:outline-none focus-within:ring-2 focus-within:ring-violet-500 dark:text-slate-300 dark:hover:text-violet-300" title={item.resumeKey ?? 'Attach resume'}>
          <Paperclip size={14} aria-hidden="true" />
          <span className="max-w-28 truncate">{item.resumeKey ? item.resumeKey.split('/').pop() : 'Attach resume'}</span>
          <input type="file" accept=".pdf,.doc,.docx" disabled={busy} className="sr-only" aria-label={`${item.resumeKey ? 'Replace' : 'Attach'} resume for ${item.company}`} onChange={(event) => { const file = event.target.files?.[0]; if (file) void run('Resume attached.', async () => updateApplication(item.id, { resumeKey: await uploadResume(file) })); event.target.value = ''; }} />
        </label>
      </td>
      <td className="px-4 py-4 pr-5 text-right">
        <button type="button" disabled={busy} onClick={() => { if (window.confirm(`Delete the application for ${item.company}? This cannot be undone.`)) void run('Application deleted.', () => deleteApplication(item.id)); }} aria-label={`Delete ${item.company} application`} title="Delete application" className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"><Trash2 size={15} aria-hidden="true" /></button>
      </td>
    </tr>
  );
}

export default function ApplicationTable({ items, onChanged, onToast }: ApplicationTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="w-full min-w-[920px] border-collapse text-left">
        <thead className="bg-slate-50 dark:bg-slate-950/70">
          <tr className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            <th scope="col" className="px-5 py-3.5">Company</th>
            <th scope="col" className="px-4 py-3.5">Role</th>
            <th scope="col" className="px-4 py-3.5">Status</th>
            <th scope="col" className="px-4 py-3.5">Date</th>
            <th scope="col" className="px-4 py-3.5">Job link</th>
            <th scope="col" className="px-4 py-3.5">Resume</th>
            <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>{items.map((item) => <ApplicationTableRow key={item.id} item={item} onChanged={onChanged} onToast={onToast} />)}</tbody>
      </table>
    </div>
  );
}