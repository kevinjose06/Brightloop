import React from 'react';
import { LogOut, Bell, Search, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';

interface HeaderProps {
  title?: string;
  onSearch?: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onSearch }) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4 flex-1">
        {title && <h1 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h1>}

        {onSearch && (
          <div className="relative max-w-xs w-full ml-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search anything (records, IDs, names)..."
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Swagger Docs Quicklink */}
        <a
          href="http://localhost:5000/api/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-2.5 py-1.5 rounded-md transition-colors"
        >
          <span>API Docs</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        {/* User profile dropdown / logout */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-md transition-colors"
            title="Sign out of current account"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

