import React from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, BarChart2, TrendingUp, Settings } from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: Activity },
  { to: '/analysis', label: 'Analysis', icon: BarChart2 },
  { to: '/forecast', label: 'Forecast', icon: TrendingUp },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed = false, onNavigate }) {
  return (
    <aside
      className={clsx(
        'h-full bg-bg-surface border-r border-border flex flex-col transition-all duration-200',
        collapsed ? 'w-16' : 'w-56',
      )}
      aria-label="Primary navigation"
    >
      <div className="h-16 flex items-center gap-2 px-4 border-b border-border shrink-0">
        <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
          F
        </span>
        {!collapsed && <span className="font-display font-bold text-text tracking-tight">FinFlow</span>}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary-light border border-primary/30'
                    : 'text-text-muted hover:text-text hover:bg-bg-hover border border-transparent',
                )
              }
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border text-xs text-text-dim">
        {!collapsed && <span>FinFlow v2.0</span>}
      </div>
    </aside>
  );
}