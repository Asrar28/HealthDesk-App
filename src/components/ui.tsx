import { useEffect, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
}

type ToastListener = (toasts: ToastItem[]) => void;
let toastsState: ToastItem[] = [];
const listeners = new Set<ToastListener>();

function notify() {
  listeners.forEach((l) => l([...toastsState]));
}

export function showToast(props: { title: string; description?: string; type?: 'success' | 'error' | 'info' }) {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast: ToastItem = { id, ...props };
  toastsState = [...toastsState, newToast];
  notify();
  setTimeout(() => {
    toastsState = toastsState.filter((t) => t.id !== id);
    notify();
  }, 4000);
}

export function useToast() {
  return {
    toast: showToast,
  };
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener: ToastListener = (current) => setToasts(current);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 rounded-2xl p-4 shadow-xl border transition-all animate-slide-up ${
            t.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : t.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-teal-50 border-teal-200 text-teal-900'
          }`}
        >
          {t.type === 'error' ? (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          ) : t.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="h-5 w-5 text-teal-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold leading-tight">{t.title}</h4>
            {t.description && <p className="mt-1 text-xs opacity-90 leading-relaxed">{t.description}</p>}
          </div>
          <button
            onClick={() => {
              toastsState = toastsState.filter((x) => x.id !== t.id);
              notify();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

interface AlertProps {
  children: ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error' | 'neutral';
  className?: string;
}

const styles: Record<string, string> = {
  info: 'bg-teal-50 text-teal-800 border-teal-200',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  error: 'bg-rose-50 text-rose-800 border-rose-200',
  neutral: 'bg-gray-50 text-gray-800 border-gray-200',
};

export function Alert({ children, variant = 'info', className = '' }: AlertProps) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles[variant]} ${className}`}>
      {children}
    </div>
  );
}

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={`animate-spin text-current ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
      <Spinner className="h-8 w-8 text-teal-600" />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-gray-100" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/3 rounded bg-gray-100" />
          <div className="h-3 w-1/2 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon && <div className="text-gray-300">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      {description && <p className="max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-500">
        <AlertCircle className="h-6 w-6" />
      </div>
      <p className="text-sm text-rose-700 font-medium">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-outline">
          Try again
        </button>
      )}
    </div>
  );
}

interface BadgeProps {
  children: ReactNode;
  variant?: 'teal' | 'navy' | 'amber' | 'coral' | 'mint' | 'neutral' | 'blue' | 'emerald' | 'rose';
  className?: string;
}

const badgeStyles: Record<string, string> = {
  teal: 'bg-teal-50 text-teal-700 border border-teal-200/60',
  navy: 'bg-slate-100 text-slate-800 border border-slate-200',
  amber: 'bg-amber-50 text-amber-700 border border-amber-200',
  coral: 'bg-rose-50 text-rose-700 border border-rose-200',
  mint: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  neutral: 'bg-gray-100 text-gray-700 border border-gray-200',
  blue: 'bg-sky-50 text-sky-700 border border-sky-200',
  emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  rose: 'bg-rose-50 text-rose-700 border border-rose-200',
};

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeStyles[variant] || badgeStyles.neutral} ${className}`}>
      {children}
    </span>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null;
  const sizeClass = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-2xl' : 'max-w-lg';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className={`relative z-10 w-full ${sizeClass} overflow-hidden rounded-2xl bg-white shadow-2xl transition-all`}>
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600">{message}</p>
      <div className="mt-6 flex justify-end gap-3">
        <button onClick={onClose} className="btn-outline">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={danger ? 'btn-danger' : 'btn-primary'}
        >
          {loading && <Spinner className="h-4 w-4" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
