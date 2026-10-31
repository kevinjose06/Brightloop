import React, { useState, useEffect, useRef } from 'react';
import { LogOut, Search, Bell, AlertTriangle, Clock, PauseCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { api, formatCurrency, formatDate } from '../../lib/api.js';
import { Link } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  onSearch?: (term: string) => void;
}

interface NotificationItem {
  id: string;
  type: 'overdue' | 'paused' | 'expiring';
  label: string;
  sub: string;
  link: string;
}

export const Header: React.FC<HeaderProps> = ({ title, onSearch }) => {
  const { user, logout, isCustomer } = useAuth();
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const bellRef = useRef<HTMLDivElement>(null);

  // Fetch notifications for staff/admin only
  useEffect(() => {
    if (isCustomer) return;
    const fetchAlerts = async () => {
      try {
        const [invsRes, subsRes] = await Promise.all([
          api.get('/invoices?status=CONFIRMED'),
          api.get('/subscriptions?status=ACTIVE'),
        ]);
        const invoices: any[] = invsRes.data.items || [];
        const subscriptions: any[] = subsRes.data.items || [];

        const today = new Date();
        const in7 = new Date();
        in7.setDate(today.getDate() + 7);

        const items: NotificationItem[] = [];

        // Overdue invoices
        invoices.forEach((inv) => {
          const due = new Date(inv.dueDate);
          const balance = Math.max(0, inv.total - inv.amountPaid);
          if (balance > 0 && due < today) {
            items.push({
              id: `overdue-${inv.id}`,
              type: 'overdue',
              label: `${inv.number} overdue`,
              sub: `${inv.customer?.name} • ${formatCurrency(balance)} outstanding`,
              link: `/invoices/${inv.id}`,
            });
          }
        });

        // Paused subscriptions
        subscriptions.forEach((sub) => {
          if (sub.isPaused) {
            items.push({
              id: `paused-${sub.id}`,
              type: 'paused',
              label: `${sub.number} paused`,
              sub: `${sub.customer?.name} • billing suspended`,
              link: `/subscriptions/${sub.id}`,
            });
          }
        });

        // Expiring within 7 days
        subscriptions.forEach((sub) => {
          const exp = new Date(sub.expiryDate);
          if (!sub.isPaused && exp >= today && exp <= in7) {
            items.push({
              id: `expiring-${sub.id}`,
              type: 'expiring',
              label: `${sub.number} expiring soon`,
              sub: `${sub.customer?.name} • expires ${formatDate(sub.expiryDate)}`,
              link: `/subscriptions/${sub.id}`,
            });
          }
        });

        setNotifications(items);
      } catch (_) {
        // silently ignore — notifications are non-critical
      }
    };
    fetchAlerts();
  }, [isCustomer]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const iconFor = (type: NotificationItem['type']) => {
    if (type === 'overdue') return <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />;
    if (type === 'paused') return <PauseCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />;
    return <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />;
  };

  return (
    <header className="h-[60px] bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.03)] z-40">
      <div className="flex items-center gap-4 flex-1">
        {title && <h1 className="text-base font-semibold text-[#131B2E] tracking-tight">{title}</h1>}

        {onSearch && (
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subscriptions, invoices, customers..."
              onChange={(e) => onSearch(e.target.value)}
              className="w-full h-[38px] pl-9 pr-14 bg-[#FAF8FF] border border-[#E2E8F0] rounded-lg text-xs text-[#131B2E] placeholder:text-slate-400 focus:outline-none focus:border-[#3730A3] focus:ring-1 focus:ring-[#3730A3] transition-all"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50">
              ⌘K
            </kbd>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell — staff/admin only */}
        {!isCustomer && (
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setBellOpen((v) => !v)}
              className="relative p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Alerts"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-10 w-80 bg-white rounded-xl border border-[#E2E8F0] shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Alerts</span>
                  <span className="text-[10px] font-semibold text-white bg-rose-500 px-1.5 py-0.5 rounded-full">
                    {notifications.length}
                  </span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-slate-400">No alerts right now.</p>
                  ) : (
                    notifications.map((n) => (
                      <Link
                        key={n.id}
                        to={n.link}
                        onClick={() => setBellOpen(false)}
                        className="flex items-start gap-2.5 px-4 py-3 hover:bg-slate-50 transition-colors"
                      >
                        {iconFor(n.type)}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{n.label}</p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{n.sub}</p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                <div className="px-4 py-2.5 border-t border-slate-100 text-[11px] text-slate-400 text-center">
                  Showing overdue, paused &amp; expiring within 7 days
                </div>
              </div>
            )}
          </div>
        )}

        {/* Username */}
        {user && (
          <span className="text-xs font-semibold text-[#131B2E] truncate max-w-[200px]">
            {user.name || user.email}
          </span>
        )}

        {/* Logout */}
        <div className="flex items-center pl-4 border-l border-slate-200">
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            title="Sign out of current account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
