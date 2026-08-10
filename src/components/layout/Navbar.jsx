import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, Search } from 'lucide-react';
import clsx from 'clsx';
import { useIsMobile } from '../../hooks/useMediaQuery';

const TITLES = {
  '/dashboard': 'Dashboard',
  '/analysis': 'Financial Analysis',
  '/forecast': 'Forecasting',
  '/settings': 'Settings',
};

export default function Navbar({ onMenuClick }) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const title = TITLES[location.pathname] || 'FinFlow';

  return (
    <header className="h-16 bg-bg-surface border-b border-border flex items-center justify-between px-4 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {isMobile && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="p-2 rounded-md text-text-muted hover:bg-bg-hover"
          >
            <Menu size={20} />
          </button>
        )}
        <h1 className={clsx('font-display font-semibold text-text', isMobile ? 'text-base' : 'text-lg')}>
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" aria-label="Search" className="p-2 rounded-md text-text-muted hover:bg-bg-hover transition-colors">
          <Search size={18} />
        </button>
        <button type="button" aria-label="Notifications" className="p-2 rounded-md text-text-muted hover:bg-bg-hover transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-danger" />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary-light text-sm font-semibold flex items-center justify-center ml-1">
          AC
        </div>
      </div>
    </header>
  );
}