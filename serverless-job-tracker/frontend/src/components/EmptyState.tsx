import { BriefcaseBusiness, SearchX } from 'lucide-react';

export default function EmptyState({ searching, onAdd }: { searching: boolean; onAdd: () => void }) {
  const Icon = searching ? SearchX : BriefcaseBusiness;
  return (
    <section className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/60">
      <span className="grid size-12 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-300">
        <Icon size={22} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
        {searching ? 'No matching applications' : 'Your pipeline starts here'}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        {searching ? 'Try another company, role, or status filter.' : 'Keep every opportunity organized in one clear view.'}
      </p>
      {!searching && (
        <button type="button" onClick={onAdd} className="mt-5 inline-flex h-9 items-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900">
          Add your first application
        </button>
      )}
    </section>
  );
}