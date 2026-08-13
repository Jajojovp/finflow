import React, { useRef, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { Activity, BarChart2, TrendingUp, Settings, X } from 'lucide-react';
import clsx from 'clsx';
import { useIsMobile } from '../../hooks/useMediaQuery';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: Activity },
  { to: '/analysis', label: 'Analysis', icon: BarChart2 },
  { to: '/forecast', label: 'Forecast', icon: TrendingUp },
  { to: '/settings', label: 'Settings', icon: Settings },
];

/**
 * Sidebar — primary navigation.
 *
 * On desktop (>768px) renders as a static sidebar.
 * On mobile (≤768px) renders as an overlay drawer controlled by `open`/`onClose`.
 *
 * @param {{ collapsed?: boolean, onNavigate?: () => void, open?: boolean, onClose?: () => void }} props
 */
export default function Sidebar({ collapsed = false, onNavigate, open = false, onClose }) {
  const isMobile = useIsMobile();
  const sidebarRef = useRef(null);
  const firstLinkRef = useRef(null);

  // Overlay mode: only on mobile when open=true
  const isOverlay = isMobile && open;

  // Focus trap + Escape key for overlay mode
  useEffect(() => {
    if (!isOverlay) return;

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
  }, [isOverlay, onClose]);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (!isOverlay) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOverlay]);

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
            className="min-h-11 min-w-11 flex items-center justify-center rounded-md text-text-muted hover:bg-bg-hover hover:text-text transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
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
        {(!collapsed || isOverlay) && <span>FinFlow v3.0</span>}
      </div>
    </aside>
  );

  // Mobile overlay mode: render with backdrop
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

  // Mobile closed: render nothing
  if (isMobile && !open) {
    return null;
  }

  // Desktop static mode
  return sidebarContent;
}
