import { CircleCheck, CircleX, X } from 'lucide-react';

export type ToastKind = 'success' | 'error';
export interface ToastMessage {
  id: number;
  kind: ToastKind;
  text: string;
}

export default function Toast({ message, onDismiss }: { message: ToastMessage; onDismiss: () => void }) {
  const Icon = message.kind === 'success' ? CircleCheck : CircleX;
  const tone = message.kind === 'success'
    ? 'border-emerald-200 bg-white text-emerald-800 dark:border-emerald-900 dark:bg-slate-900 dark:text-emerald-300'
    : 'border-rose-200 bg-white text-rose-800 dark:border-rose-900 dark:bg-slate-900 dark:text-rose-300';

  return (
    <div role={message.kind === 'error' ? 'alert' : 'status'} className={`flex max-w-sm items-start gap-3 rounded-2xl border p-3 shadow-lg ${tone}`}>
      <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
      <p className="min-w-0 flex-1 text-sm font-medium">{message.text}</p>
      <button type="button" onClick={onDismiss} aria-label="Dismiss notification" className="grid size-6 shrink-0 place-items-center rounded text-current/70 hover:bg-black/5 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:hover:bg-white/10">
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}