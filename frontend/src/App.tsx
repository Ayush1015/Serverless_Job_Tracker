import { useEffect, useState } from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { authConfigured } from './amplify';
import type { ApplicationStatus, JobApplication } from './types';
import { listApplications } from './api';
import AuthPanel from './components/AuthPanel';
import EmptyState from './components/EmptyState';
import ApplicationForm from './components/ApplicationForm';
import Filters from './components/Filters';
import Dashboard from './components/Dashboard';
import Toast, { type ToastMessage } from './components/Toast';
import ApplicationList from './components/ApplicationList';
import PageTopbar from './components/PageTopbar';
import Sidebar, { type AppPage } from './components/Sidebar';

export default function App() {
  const [username, setUsername] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [items, setItems] = useState<JobApplication[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('job-tracker-theme') === 'dark');
  const [activePage, setActivePage] = useState<AppPage>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  function notify(text: string, kind: ToastMessage['kind']) {
    setToast({ id: Date.now(), text, kind });
  }

  async function refresh(showLoading = false) {
    if (showLoading) setLoading(true);
    try {
      const data = await listApplications();
      setItems(data.items);
      setError(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load applications.';
      setError(message);
      notify(message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('job-tracker-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    let active = true;
    if (!authConfigured) {
      setCheckingAuth(false);
      return () => { active = false; };
    }
    void getCurrentUser()
      .then((user) => { if (active) setUsername(user.signInDetails?.loginId ?? user.username); })
      .catch(() => { if (active) setUsername(null); })
      .finally(() => { if (active) setCheckingAuth(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (username) void refresh(true);
  }, [username]);

  async function handleSignOut() {
    try {
      await signOut();
      setUsername(null);
      setItems([]);
      setError(null);
      setLoading(true);
      notify('You have signed out.', 'success');
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'Could not sign out.', 'error');
    }
  }

  async function handleCreated() {
    setShowForm(false);
    await refresh();
  }

  const filteredItems = items.filter((item) => {
    const searchMatch = `${item.company} ${item.role}`.toLowerCase().includes(search.trim().toLowerCase());
    return searchMatch && (statusFilter === 'ALL' || item.status === statusFilter);
  }).sort((a, b) => {
    const difference = Date.parse(b.createdAt) - Date.parse(a.createdAt);
    return sortOrder === 'newest' ? difference : -difference;
  });

  const isFiltered = search.trim().length > 0 || statusFilter !== 'ALL';

  if (!authConfigured) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <section className="max-w-md rounded-lg border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-xl font-semibold">Cognito configuration required</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Set the User Pool ID and app client ID in the frontend environment, then restart Vite.</p>
        </section>
      </main>
    );
  }
  if (checkingAuth) {
    return <main className="grid min-h-screen place-items-center text-sm text-slate-500 dark:text-slate-400" role="status">Checking your session…</main>;
  }
  if (!username) return <AuthPanel onAuthenticated={setUsername} darkMode={darkMode} onToggleDarkMode={() => setDarkMode((value) => !value)} />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 lg:pl-64">
      <Sidebar
        username={username}
        activePage={activePage}
        mobileOpen={mobileSidebarOpen}
        onNavigate={setActivePage}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        onSignOut={() => void handleSignOut()}
      />
      <PageTopbar
        title={activePage === 'dashboard' ? 'Dashboard' : 'Applications'}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((value) => !value)}
        onNewApplication={() => setShowForm(true)}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
      />
      <main id="main" className="mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <section className="mb-7 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-violet-700 dark:text-violet-300">Your private workspace</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white sm:text-3xl">{activePage === 'dashboard' ? 'Your job search, in one place' : 'All applications'}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">{activePage === 'dashboard' ? 'Keep applications, conversations, and next steps organized as your search moves forward.' : 'Search, sort, and update every opportunity in your pipeline.'}</p>
          </div>
          {activePage === 'dashboard' && <p className="text-sm text-slate-500 dark:text-slate-400">{items.length} {items.length === 1 ? 'opportunity' : 'opportunities'} tracked</p>}
        </section>

        {error && <p role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">{error}</p>}
        {activePage === 'dashboard' ? (
          <Dashboard items={items} loading={loading} onAdd={() => setShowForm(true)} onViewAll={() => setActivePage('applications')} />
        ) : (
        <section className="mt-8" aria-labelledby="applications-heading">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 id="applications-heading" className="text-lg font-semibold text-slate-900 dark:text-white">Applications</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Review and update your active opportunities.</p>
            </div>
            <span className="shrink-0 text-sm tabular-nums text-slate-500 dark:text-slate-400">{filteredItems.length} shown</span>
          </div>
          <Filters search={search} status={statusFilter} sortOrder={sortOrder} onSearchChange={setSearch} onStatusChange={setStatusFilter} onSortChange={setSortOrder} />
          <div className="mt-4">
            <ApplicationList
              items={filteredItems}
              loading={loading}
              searching={isFiltered}
              onAdd={() => setShowForm(true)}
              onChanged={() => refresh()}
              onToast={notify}
            />
          </div>
        </section>
        )}
      </main>

      {showForm && <ApplicationForm onCreated={handleCreated} onClose={() => setShowForm(false)} onToast={notify} />}
      {toast && <div className="fixed bottom-4 right-4 z-50 px-4 sm:bottom-6 sm:right-6"><Toast message={toast} onDismiss={() => setToast(null)} /></div>}
    </div>
  );
}
