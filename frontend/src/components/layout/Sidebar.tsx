import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Repeat,
  Receipt,
  CreditCard,
  Package,
  Layers,
  Percent,
  FileSpreadsheet,
  Users,
  ShieldCheck,
  PlayCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  onOpenBillingModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenBillingModal }) => {
  const { user, isAdmin, isCustomer } = useAuth();

  const adminNav = [
    { label: 'Dashboard', to: '/', icon: LayoutDashboard },
    { label: 'Customers', to: '/customers', icon: Users },
    { label: 'Products', to: '/products', icon: Package },
    { label: 'Plans', to: '/plans', icon: Layers },
    { label: 'Quotations', to: '/templates', icon: FileSpreadsheet },
    { label: 'Subscriptions', to: '/subscriptions', icon: Repeat },
    { label: 'Invoices', to: '/invoices', icon: Receipt },
    { label: 'Payments', to: '/payments', icon: CreditCard },
    { label: 'Discounts', to: '/taxes-discounts', icon: Percent },
  ];

  if (isAdmin) {
    adminNav.push({ label: 'Staff Management', to: '/staff', icon: ShieldCheck });
  }

  const customerNav = [
    { label: 'My Subscriptions', to: '/portal', icon: Repeat },
    { label: 'My Invoices', to: '/portal/invoices', icon: Receipt },
  ];

  const navItems = isCustomer ? customerNav : adminNav;

  return (
    <aside className="w-60 bg-[#0F172A] text-[#CBD5E1] flex flex-col shrink-0 min-h-screen border-r border-[#1E293B] select-none">
      {/* Brand Header */}
      <div className="h-[60px] px-4 flex items-center justify-between border-b border-[#1E293B] bg-[#0A0F1D]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#3730A3] flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            B
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-white tracking-tight text-sm truncate">
              Brightloop
            </span>
            <span className="bg-[#3730A3] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
              {isCustomer ? 'Portal' : 'Subscriptions'}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action Button (Staff/Admin) */}
      {!isCustomer && onOpenBillingModal && (
        <div className="p-3">
          <button
            onClick={onOpenBillingModal}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#3730A3] hover:bg-[#312E81] text-white text-xs font-medium shadow-sm transition-all active:scale-[0.98]"
          >
            <PlayCircle className="w-4 h-4 text-indigo-200" />
            <span>Run Billing Now</span>
          </button>
        </div>
      )}

      {/* Nav List */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/' || item.to === '/portal'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#3730A3] text-white font-medium shadow-sm'
                    : 'text-[#CBD5E1] hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Production Status Bar */}
      <div className="h-12 px-4 border-t border-[#1E293B] flex items-center justify-between text-slate-400 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
          <span className="text-[11px] font-medium truncate text-slate-300">
            Production • India (IN)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950/80 border border-indigo-800/50 px-1.5 py-0.5 rounded">
            {user?.role}
          </span>
        </div>
      </div>
    </aside>
  );
};
