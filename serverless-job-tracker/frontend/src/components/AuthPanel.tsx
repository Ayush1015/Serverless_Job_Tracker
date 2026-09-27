import { useState, type FormEvent } from 'react';
import { BriefcaseBusiness, Moon, Sun } from 'lucide-react';
import { confirmSignUp, signIn, signUp } from 'aws-amplify/auth';

type AuthMode = 'signIn' | 'signUp' | 'confirm';

function friendlyAuthError(cause: unknown, mode: AuthMode): string {
  if (!(cause instanceof Error)) return 'Something went wrong. Please try again.';
  switch (cause.name) {
    case 'NotAuthorizedException':
    case 'UserNotFoundException':
      return 'That email and password combination did not match. Check them and try again.';
    case 'UsernameExistsException':
      return 'An account already exists for this email. Sign in instead.';
    case 'CodeMismatchException':
      return 'That verification code is not correct. Check the email and try again.';
    case 'ExpiredCodeException':
      return 'That verification code has expired. Request a new one and try again.';
    case 'UserNotConfirmedException':
      return 'Your email still needs verification. Check your inbox for the confirmation code.';
    default:
      return mode === 'confirm'
        ? 'We could not verify that code. Check it and try again.'
        : mode === 'signUp'
          ? 'We could not create your account. Check the details and try again.'
          : 'We could not sign you in. Check your details and try again.';
  }
}

interface AuthPanelProps {
  onAuthenticated: (username: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export default function AuthPanel({ onAuthenticated, darkMode, onToggleDarkMode }: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const username = email.trim();
      if (mode === 'signUp') {
        const result = await signUp({
          username,
          password,
          options: { userAttributes: { email: username } },
        });
        if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
          setMode('confirm');
          setMessage(`Enter the verification code sent to ${username}.`);
        } else {
          setMode('signIn');
          setMessage('Account created. Sign in to continue.');
        }
        return;
      }

      if (mode === 'confirm') {
        await confirmSignUp({ username, confirmationCode: code.trim() });
        setMode('signIn');
        setCode('');
        setMessage('Email verified. Sign in to continue.');
        return;
      }

      const result = await signIn({ username, password });
      if (!result.isSignedIn) {
        throw new Error(`Additional sign-in step required: ${result.nextStep.signInStep}`);
      }
      onAuthenticated(username);
    } catch (cause) {
      setError(friendlyAuthError(cause, mode));
    } finally {
      setBusy(false);
    }
  }

  const title = mode === 'signUp' ? 'Create your account' : mode === 'confirm' ? 'Verify your email' : 'Welcome back';

  return (
    <main className="relative grid min-h-screen place-items-center bg-slate-50 px-4 py-16 dark:bg-slate-950 sm:px-6">
      <button type="button" onClick={onToggleDarkMode} aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:right-6 sm:top-6">
        {darkMode ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
      </button>
      <section className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-slate-800 dark:bg-slate-900 md:min-h-[600px] md:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-700 via-violet-800 to-slate-950 p-9 text-white md:flex lg:p-12">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-20 size-80 rounded-full border border-white/10" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-28 size-96 rounded-full border border-white/10" />
          <div>
            <span className="relative grid size-11 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-lg shadow-violet-950/20"><BriefcaseBusiness size={21} aria-hidden="true" /></span>
            <p className="relative mt-10 text-xs font-semibold uppercase text-violet-200">Job Tracker</p>
            <h1 className="relative mt-3 max-w-sm text-4xl font-semibold leading-tight tracking-tight">Make your next move count.</h1>
            <p className="relative mt-4 max-w-xs text-sm leading-6 text-violet-100/80">A calmer way to organize every opportunity and conversation in your search.</p>
          </div>
          <p className="relative text-xs text-violet-100/70">Private to your account</p>
        </aside>

        <div className="p-6 sm:p-10 lg:p-14">
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-violet-600 text-white"><BriefcaseBusiness size={18} aria-hidden="true" /></span>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Job Tracker</p>
          </div>
          <p className="text-sm font-medium text-violet-700 dark:text-violet-300">Private workspace</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Your applications stay organized and private to your account.</p>

          {mode !== 'confirm' && (
            <div className="mt-7 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="tablist" aria-label="Authentication">
              <button type="button" role="tab" aria-selected={mode === 'signIn'} onClick={() => { setMode('signIn'); setError(null); setMessage(null); }} className={`rounded-lg px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${mode === 'signIn' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}>Sign in</button>
              <button type="button" role="tab" aria-selected={mode === 'signUp'} onClick={() => { setMode('signUp'); setError(null); setMessage(null); }} className={`rounded-lg px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${mode === 'signUp' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}>Create account</button>
            </div>
          )}

          <form className="mt-6 grid gap-4" onSubmit={(event) => void submit(event)}>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
              Email
              <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-violet-500 dark:focus:ring-violet-950" />
            </label>
            {mode === 'confirm' ? (
              <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                Verification code
                <input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} required className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-violet-500 dark:focus:ring-violet-950" />
              </label>
            ) : (
              <label className="grid gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                Password
                <input type="password" autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-violet-500 dark:focus:ring-violet-950" />
              </label>
            )}
            {message && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300" role="status">{message}</p>}
            {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300" role="alert">{error}</p>}
            <button className="mt-1 h-11 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'confirm' ? 'Verify email' : mode === 'signUp' ? 'Create account' : 'Sign in'}
            </button>
            {mode === 'confirm' && <button className="rounded-xl px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-violet-300 dark:hover:bg-violet-950" type="button" onClick={() => { setMode('signUp'); setError(null); setMessage(null); }}>Back to sign up</button>}
          </form>
        </div>
      </section>
    </main>
  );
}