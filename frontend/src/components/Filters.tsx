import { Search, SlidersHorizontal } from 'lucide-react';
import { STATUSES, type ApplicationStatus } from '../types';

interface FiltersProps {
  search: string;
  status: ApplicationStatus | 'ALL';
  sortOrder: 'newest' | 'oldest';
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ApplicationStatus | 'ALL') => void;
  onSortChange: (value: 'newest' | 'oldest') => void;
}

export default function Filters({ search, status, sortOrder, onSearchChange, onStatusChange, onSortChange }: FiltersProps) {
  return (
    <section aria-label="Filter applications" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <label className="relative block min-w-0 flex-1 sm:max-w-md">
        <Search size={17} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <span className="sr-only">Search company or role</span>
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search company or role"
          className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-violet-500 dark:focus:ring-violet-950"
        />
      </label>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <label className="relative flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <SlidersHorizontal size={16} aria-hidden="true" className="shrink-0 text-slate-400" />
          <span className="sr-only">Filter by status</span>
          <select value={status} onChange={(event) => onStatusChange(event.target.value as ApplicationStatus | 'ALL')} className="min-w-0 flex-1 appearance-none bg-transparent pr-1 font-medium text-slate-700 outline-none dark:text-slate-200">
            <option value="ALL">All statuses</option>
            {STATUSES.map((value) => <option key={value} value={value}>{value[0] + value.slice(1).toLowerCase()}</option>)}
          </select>
        </label>
        <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <span className="shrink-0 text-slate-400">Date</span>
          <span className="sr-only">Sort by date</span>
          <select value={sortOrder} onChange={(event) => onSortChange(event.target.value as 'newest' | 'oldest')} className="min-w-0 flex-1 appearance-none bg-transparent font-medium text-slate-700 outline-none dark:text-slate-200">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
      </div>
    </section>
  );
}