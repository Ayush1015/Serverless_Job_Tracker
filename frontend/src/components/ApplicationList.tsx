import type { JobApplication } from '../types';
import ApplicationCard from './ApplicationCard';
import ApplicationTable from './ApplicationTable';
import EmptyState from './EmptyState';
import type { ToastKind } from './Toast';

interface ApplicationListProps {
  items: JobApplication[];
  loading: boolean;
  searching: boolean;
  onAdd: () => void;
  onChanged: () => Promise<void>;
  onToast: (text: string, kind: ToastKind) => void;
}

export default function ApplicationList({ items, loading, searching, onAdd, onChanged, onToast }: ApplicationListProps) {
  if (loading) {
    return (
      <div className="grid gap-3" aria-label="Loading applications" role="status">
        <span className="sr-only">Loading applications</span>
        {[0, 1, 2].map((key) => (
          <div key={key} className="animate-pulse rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex gap-3"><span className="size-10 rounded-lg bg-slate-200 dark:bg-slate-800" /><div className="flex-1 space-y-2"><span className="block h-4 w-36 rounded bg-slate-200 dark:bg-slate-800" /><span className="block h-3 w-52 max-w-full rounded bg-slate-100 dark:bg-slate-800/70" /><span className="block h-3 w-64 max-w-full rounded bg-slate-100 dark:bg-slate-800/70" /></div></div>
          </div>
        ))}
      </div>
    );
  }
  if (items.length === 0) return <EmptyState searching={searching} onAdd={onAdd} />;
  return (
    <>
      <div className="hidden md:block"><ApplicationTable items={items} onChanged={onChanged} onToast={onToast} /></div>
      <div className="grid gap-3 md:hidden">{items.map((item) => <ApplicationCard key={item.id} item={item} onChanged={onChanged} onToast={onToast} />)}</div>
    </>
  );
}
