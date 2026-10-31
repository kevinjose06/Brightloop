import React, { useState } from 'react';
import { Subscription } from '../../types/index.js';
import { useSubscriptionActions } from '../../hooks/useSubscriptionActions.js';
import { ConfirmDialog } from './ConfirmDialog.js';
import { PauseCircle, PlayCircle, RotateCw, XCircle, Loader2 } from 'lucide-react';

interface SubscriptionActionsProps {
  subscription: Subscription;
}

export const SubscriptionActions: React.FC<SubscriptionActionsProps> = ({ subscription }) => {
  const { plan } = subscription;
  const isActive = subscription.status === 'ACTIVE';
  const isPaused = Boolean(subscription.isPaused);

  const {
    pause,
    resume,
    renew,
    close,
    pauseMutation,
    resumeMutation,
    renewMutation,
    closeMutation,
    isAnyPending,
    feedback,
    clearFeedback,
  } = useSubscriptionActions(subscription.id);

  // Dialog states
  const [dialogState, setDialogState] = useState<'pause' | 'renew' | 'close' | null>(null);

  const canPause = isActive && !isPaused && Boolean(plan?.allowPause);
  const canResume = isPaused;
  const canRenew = isActive && Boolean(plan?.allowRenew);
  const canClose = isActive && Boolean(plan?.allowEarlyClose);

  if (!canPause && !canResume && !canRenew && !canClose) {
    return null;
  }

  const handleConfirmAction = () => {
    if (dialogState === 'pause') {
      pause(undefined, {
        onSettled: () => setDialogState(null),
      });
    } else if (dialogState === 'renew') {
      renew(undefined, {
        onSettled: () => setDialogState(null),
      });
    } else if (dialogState === 'close') {
      close(undefined, {
        onSettled: () => setDialogState(null),
      });
    }
  };

  return (
    <div className="space-y-2">
      {/* Action Buttons Container */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Pause Button */}
        {canPause && (
          <button
            type="button"
            disabled={isAnyPending}
            onClick={() => {
              clearFeedback();
              setDialogState('pause');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {pauseMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <PauseCircle className="w-3.5 h-3.5 text-slate-500" />
            )}
            Pause
          </button>
        )}

        {/* Resume Button */}
        {canResume && (
          <button
            type="button"
            disabled={isAnyPending}
            onClick={() => {
              clearFeedback();
              resume();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {resumeMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <PlayCircle className="w-3.5 h-3.5 text-white" />
            )}
            Resume
          </button>
        )}

        {/* Renew Button */}
        {canRenew && (
          <button
            type="button"
            disabled={isAnyPending}
            onClick={() => {
              clearFeedback();
              setDialogState('renew');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {renewMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCw className="w-3.5 h-3.5 text-white" />
            )}
            Renew
          </button>
        )}

        {/* Close Early Button */}
        {canClose && (
          <button
            type="button"
            disabled={isAnyPending}
            onClick={() => {
              clearFeedback();
              setDialogState('close');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 disabled:opacity-50 transition-colors"
          >
            {closeMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-red-500" />
            )}
            Close Early
          </button>
        )}
      </div>

      {/* Inline Feedback Message */}
      {feedback && (
        <div
          className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md border animate-in fade-in duration-150 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={clearFeedback}
            className="ml-2 font-semibold hover:opacity-75 focus:outline-none"
            aria-label="Dismiss feedback"
          >
            &times;
          </button>
        </div>
      )}

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={dialogState === 'pause'}
        title="Pause Subscription"
        description="Pause this subscription? Billing stops until you resume."
        confirmLabel="Pause Subscription"
        isLoading={pauseMutation.isPending}
        onConfirm={handleConfirmAction}
        onClose={() => setDialogState(null)}
      />

      <ConfirmDialog
        isOpen={dialogState === 'renew'}
        title="Renew Subscription"
        description="Renew for another period? A new billing cycle starts."
        confirmLabel="Renew Subscription"
        isLoading={renewMutation.isPending}
        onConfirm={handleConfirmAction}
        onClose={() => setDialogState(null)}
      />

      <ConfirmDialog
        isOpen={dialogState === 'close'}
        title="Close Subscription Early"
        description="Close this subscription now? This cannot be undone."
        confirmLabel="Close Subscription"
        isDestructive={true}
        isLoading={closeMutation.isPending}
        onConfirm={handleConfirmAction}
        onClose={() => setDialogState(null)}
      />
    </div>
  );
};
