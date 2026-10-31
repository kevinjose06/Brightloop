import React from 'react';
import { LogOut, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface HeaderProps {
  title?: string;
  onSearch?: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onSearch }) => {
  const { user, logout } = useAuth();

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
        {/* User profile & Role Badge */}
        {user && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-semibold text-[#3730A3]">
              {user.name ? user.name.slice(0, 2).toUpperCase() : user.email.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-medium text-[#131B2E] leading-tight truncate max-w-[140px]">
                {user.name || user.email}
              </span>
              <span className="text-left mt-0.5">
                <span className="bg-[#EAEDFF] text-[#3730A3] border border-[#C3C0FF] text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block leading-none">
                  {user.role}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Logout button */}
        <div className="flex items-center pl-3 border-l border-slate-200">
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors"
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
