import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

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
  badge,
}) => {
  return (
    <div className="bg-white rounded-xl p-5 border border-[#E2E8F0] shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-500">
          {title}
        </span>
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-[#3730A3] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3">
        <div className="text-2xl font-semibold text-[#131B2E] tracking-tight">{value}</div>

        {(trend || badge || subtitle) && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {trend && (
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-semibold ${
                  trendUp
                    ? 'bg-teal-50 text-teal-700 border border-teal-200/60'
                    : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                }`}
              >
                {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trend}
              </span>
            )}
            {badge && (
              <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-50 text-[#3730A3] border border-indigo-200/60">
                {badge}
              </span>
            )}
            {subtitle && (
              <span className="text-[11px] text-slate-500 font-normal">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
