import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  tooltip?: string;
  badge?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp,
  tooltip,
  badge,
}) => {
  return (
    <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-soft hover:shadow-card transition-shadow relative group">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {badge && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {badge}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 flex items-center text-xs text-slate-500 gap-1.5">
          {trend && (
            <span className={`font-medium ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}

      {tooltip && (
        <div className="mt-2 text-[11px] text-slate-400 italic border-t border-slate-100 pt-1.5">
          💡 {tooltip}
        </div>
      )}
    </div>
  );
};

