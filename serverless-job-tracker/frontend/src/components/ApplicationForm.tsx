import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Building2, Link2, X } from 'lucide-react';
import { createApplication } from '../api';
import type { ToastKind } from './Toast';

interface ApplicationFormProps {
  onCreated: () => Promise<void>;
  onClose: () => void;
  onToast: (text: string, kind: ToastKind) => void;
}

export default function ApplicationForm({ onCreated, onClose, onToast }: ApplicationFormProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createApplication({ company, role, ...(jobUrl ? { jobUrl } : {}) });
      await onCreated();
      onToast('Application added.', 'success');
    } catch (e) {
      onToast(e instanceof Error ? e.message : 'Could not add the application.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-slate-950/40 p-0 backdrop-blur-[2px] sm:place-items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="add-application-title" className="w-full rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:max-w-lg sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="grid size-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-300"><Building2 size={18} aria-hidden="true" /></span>
            <h2 id="add-application-title" className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">New application</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add the opportunity details to your tracker.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close form" className="grid size-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-slate-800 dark:hover:text-white"><X size={18} aria-hidden="true" /></button>
        </div>

        <form onSubmit={(event) => void submit(event)} className="mt-6 grid gap-4">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
            Company <span className="sr-only">required</span>
            <input autoFocus value={company} onChange={(event) => setCompany(event.target.value)} placeholder="e.g. Acme Inc." required className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-950" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
            Role <span className="sr-only">required</span>
            <input value={role} onChange={(event) => setRole(event.target.value)} placeholder="e.g. Product Designer" required className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-950" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
            Job posting URL <span className="font-normal text-slate-400">Optional</span>
            <span className="relative">
              <Link2 size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="url" value={jobUrl} onChange={(event) => setJobUrl(event.target.value)} placeholder="https://company.com/careers/role" className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-500 dark:focus:ring-indigo-950" />
            </span>
          </label>
          <div className="mt-2 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={busy} className="h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">{busy ? 'Saving…' : 'Add application'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
