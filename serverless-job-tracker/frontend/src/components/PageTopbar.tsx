import { Menu, Moon, Plus, Sun } from 'lucide-react';

interface PageTopbarProps {
  title: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNewApplication: () => void;
  onOpenSidebar: () => void;
}

export default function PageTopbar({ title, darkMode, onToggleDarkMode, onNewApplication, onOpenSidebar }: PageTopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={onOpenSidebar} aria-label="Open navigation menu" className="grid size-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900 lg:hidden"><Menu size={18} aria-hidden="true" /></button>
        <h1 className="truncate text-base font-semibold text-slate-900 dark:text-white sm:text-lg">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={onToggleDarkMode} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800">
          {darkMode ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
        </button>
        <button type="button" onClick={onNewApplication} aria-label="Add application" className="inline-flex h-9 items-center gap-2 rounded-xl bg-violet-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950 sm:px-4">
          <Plus size={17} aria-hidden="true" /><span className="hidden sm:inline">Add application</span><span className="sm:hidden">Add</span>
        </button>
      </div>
    </header>
  );
}