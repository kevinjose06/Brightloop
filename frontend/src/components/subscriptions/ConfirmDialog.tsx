import React, { useEffect, useRef } from 'react';
import { Loader2, AlertTriangle, AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  useEffect(() => {
    if (isOpen) {
      confirmBtnRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md bg-white rounded-card border border-slate-200/90 shadow-xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              isDestructive ? 'bg-red-50 text-red-600' : 'bg-primary/10 text-primary'
            }`}
          >
            {isDestructive ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1">
            <h3 id="confirm-dialog-title" className="text-base font-bold text-slate-900 font-sans">
              {title}
            </h3>
            <p id="confirm-dialog-desc" className="mt-1 text-xs text-slate-600 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>

          <button
            ref={confirmBtnRef}
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg shadow-sm focus:outline-none focus-visible:ring-2 disabled:opacity-50 transition-colors cursor-pointer ${
              isDestructive
                ? 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600'
                : 'bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary'
            }`}
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
