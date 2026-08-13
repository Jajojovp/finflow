import React, { useRef, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, BarChart2, TrendingUp, Settings, X } from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: Activity },
  { to: '/analysis', label: 'Analysis', icon: BarChart2 },
  { to: '/forecast', label: 'Forecast', icon: TrendingUp },
  { to: '/settings', label: 'Settings', icon: Settings },
];

/**
 * Sidebar — primary navigation with responsive overlay mode for mobile.
 *
 * @param {{ collapsed?: boolean, onNavigate?: () => void, open?: boolean, onClose?: () => void }} props
 */
export default function Sidebar({ collapsed = false, onNavigate, open = false, onClose }) {
  const sidebarRef = useRef(null);
  const firstLinkRef = useRef(null);

  const isOverlay = open !== undefined;

  // Focus trap + Escape key for overlay mode
  useEffect(() => {
    if (!isOverlay || !open) return;

    const sidebar = sidebarRef.current;
    if (!sidebar) return;

    // Focus first nav link on open
    const timer = setTimeout(() => {
      firstLinkRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = sidebar.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOverlay, open, onClose]);

  const handleNavClick = useCallback(() => {
    onNavigate?.();
    onClose?.();
  }, [onNavigate, onClose]);

  const sidebarContent = (
    <aside
      ref={sidebarRef}
      className={clsx(
        'h-full bg-bg-surface border-r border-border flex flex-col transition-[width] duration-200',
        isOverlay ? 'w-56' : collapsed ? 'w-16' : 'w-56',
      )}
      aria-label="Primary navigation"
      {...(isOverlay ? { role: 'dialog', 'aria-modal': 'true' } : {})}
    >
      <div className="h-16 flex items-center gap-2 px-4 border-b border-border shrink-0">
        <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-black font-bold text-sm shrink-0">
          F
        </span>
        {(!collapsed || isOverlay) && (
          <span className="font-display font-bold text-text tracking-tight flex-1">FinFlow</span>
        )}
        {isOverlay && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="p-1 rounded-md text-text-muted hover:bg-bg-hover hover:text-text transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              ref={idx === 0 ? firstLinkRef : undefined}
              to={item.to}
              onClick={handleNavClick}
              tabIndex={isOverlay ? 0 : undefined}
              className={({ isActive }) =>
                clsx(
                  'min-h-11 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary-light border border-primary/30'
                    : 'text-text-muted hover:text-text hover:bg-bg-hover border border-transparent',
                )
              }
            >
              <Icon size={18} className="shrink-0" />
              {(!collapsed || isOverlay) && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border text-xs text-text-dim">
        {(!collapsed || isOverlay) && <span>FinFlow v2.0</span>}
      </div>
    </aside>
  );

  // Overlay mode: render with backdrop
  if (isOverlay) {
    return (
      <div className="fixed inset-0 z-40 flex">
        <button
          type="button"
          className="absolute inset-0 bg-black/60 w-full h-full"
          onClick={onClose}
          aria-label="Close sidebar"
          tabIndex={-1}
        />
        <div className="relative z-50">
          {sidebarContent}
        </div>
      </div>
    );
  }

  // Static mode (desktop)
  return sidebarContent;
}
