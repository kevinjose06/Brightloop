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
  UserCheck,
  PlayCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface SidebarProps {
  onOpenBillingModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenBillingModal }) => {
  const { user, isAdmin, isCustomer } = useAuth();

  const adminNav = [
    { label: 'Overview', to: '/', icon: LayoutDashboard },
    { label: 'Subscriptions', to: '/subscriptions', icon: Repeat },
    { label: 'Invoices', to: '/invoices', icon: Receipt },
    { label: 'Payments', to: '/payments', icon: CreditCard },
    { label: 'Products', to: '/products', icon: Package },
    { label: 'Plans', to: '/plans', icon: Layers },
    { label: 'Taxes & Discounts', to: '/taxes-discounts', icon: Percent },
    { label: 'Quotation Templates', to: '/templates', icon: FileSpreadsheet },
    { label: 'Customers', to: '/customers', icon: Users },
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
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800 no-print print:hidden">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800 bg-slate-950/40">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          B
        </div>
        <div>
          <span className="font-bold text-white tracking-tight text-base">BRIGHTLOOP</span>
          <span className="block text-[10px] text-indigo-400 font-medium uppercase tracking-wider">
            {isCustomer ? 'Customer Portal' : 'Billing Platform'}
          </span>
        </div>
      </div>

      {/* Primary Action Button (Staff/Admin) */}
      {!isCustomer && onOpenBillingModal && (
        <div className="p-4">
          <button
            onClick={onOpenBillingModal}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.98]"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Run Billing Now</span>
          </button>
        </div>
      )}

      {/* Nav List */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/' || item.to === '/portal'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 font-semibold border-l-2 border-indigo-500 rounded-l-none'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Current User Pill */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-semibold text-indigo-300 border border-slate-700">
            {user?.email.slice(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-white truncate">{user?.name || user?.email}</p>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              {user?.role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

