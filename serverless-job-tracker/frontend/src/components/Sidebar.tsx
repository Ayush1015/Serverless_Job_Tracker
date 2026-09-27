import { useEffect } from 'react';
import { BriefcaseBusiness, LayoutDashboard, ListChecks, LogOut, X } from 'lucide-react';

export type AppPage = 'dashboard' | 'applications';

interface SidebarProps {
  username: string;
  activePage: AppPage;
  mobileOpen: boolean;
  onNavigate: (page: AppPage) => void;
  onCloseMobile: () => void;
  onSignOut: () => void;
}

export default function Sidebar({ username, activePage, mobileOpen, onNavigate, onCloseMobile, onSignOut }: SidebarProps) {
  useEffect(() => {
    if (!mobileOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseMobile();
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen, onCloseMobile]);

  const navigation = [
    { page: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { page: 'applications' as const, label: 'Applications', icon: ListChecks },
  ];
  const initials = username.trim().slice(0, 1).toUpperCase() || 'U';

  return (
    <>
      {mobileOpen && <button type="button" aria-label="Close navigation menu" onClick={onCloseMobile} className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] lg:hidden" />}
      <aside aria-label="Main navigation" className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white transition-transform duration-200 dark:border-slate-800 dark:bg-slate-950 lg:w-64 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5 dark:border-slate-800">
          <a href="#main" onClick={onCloseMobile} className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
            <span className="grid size-9 place-items-center rounded-xl bg-violet-600 text-white"><BriefcaseBusiness size={18} aria-hidden="true" /></span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Job Tracker</span>
          </a>
          <button type="button" onClick={onCloseMobile} aria-label="Close navigation menu" className="grid size-9 place-items-center rounded-xl text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:hover:bg-slate-800 lg:hidden"><X size={18} aria-hidden="true" /></button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Workspace">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase text-slate-400">Workspace</p>
          {navigation.map(({ page, label, icon: Icon }) => {
            const selected = activePage === page;
            return (
              <button
                key={page}
                type="button"
                aria-current={selected ? 'page' : undefined}
                onClick={() => { onNavigate(page); onCloseMobile(); }}
                className={`flex h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${selected ? 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'}`}
              >
                <Icon size={17} aria-hidden="true" />{label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-950 dark:text-violet-200" aria-hidden="true">{initials}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200" title={username}>{username}</span>
            <button type="button" onClick={onSignOut} aria-label="Sign out" title="Sign out" className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"><LogOut size={17} aria-hidden="true" /></button>
          </div>
        </div>
      </aside>
    </>
  );
}