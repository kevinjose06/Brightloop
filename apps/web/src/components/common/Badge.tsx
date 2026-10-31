import React from 'react';

interface BadgeProps {
  status: string;
  isPaused?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, isPaused = false, className = '' }) => {
  const displayStatus = isPaused ? 'PAUSED' : status;
  const norm = displayStatus.toUpperCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (norm === 'PAID' || norm === 'ACTIVE') {
    // Green
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-600/10';
  } else if (norm === 'PAUSED' || norm === 'DRAFT' || norm === 'PENDING') {
    // Amber
    styles = 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-600/10';
  } else if (norm === 'CONFIRMED' || norm === 'QUOTATION') {
    // Blue
    styles = 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-600/10';
  } else if (norm === 'OVERDUE' || norm === 'CANCELLED') {
    // Red
    styles = 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-600/10';
  } else if (norm === 'CLOSED') {
    // Gray
    styles = 'bg-zinc-100 text-zinc-600 border-zinc-200';
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70"></span>
      {displayStatus}
    </span>
  );
};
