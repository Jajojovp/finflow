import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from '../common/Logo';
import TextRollButton from './TextRollButton';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
];

/**
 * LandingNav — floating liquid-glass navigation bar for the FinFlow landing.
 *
 * A fixed VEX-style navbar: the Logo on the left, anchor links centered on
 * desktop, and a Dashboard link + primary "Open app" CTA on the right. On
 * smaller viewports the links collapse behind a Menu/X toggle that opens a
 * liquid-glass dropdown panel.
 *
 * @returns {import('react').ReactElement}
 */
export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <header className="fixed top-0 inset-x-0 z-40">
      <div className="mx-4 md:mx-12 lg:mx-16 pt-4 md:pt-6">
        <nav
          className="liquid-glass rounded-2xl px-4 py-2 flex items-center justify-between"
          aria-label="Main navigation"
        >
          <Link to="/" aria-label="FinFlow home" className="inline-flex min-h-11 min-w-11 shrink-0 items-center">
            <Logo size="sm" />
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
               className="inline-flex min-h-11 items-center text-text-muted hover:text-text transition-colors text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
               className="hidden md:inline-flex min-h-11 items-center text-text-muted hover:text-text transition-colors text-sm font-medium"
            >
              Dashboard
            </Link>
            <div className="hidden lg:block">
              <TextRollButton variant="primary" href="/dashboard">
                Open app
              </TextRollButton>
            </div>
            <button
              type="button"
               className="lg:hidden h-11 w-11 rounded-lg text-text-muted hover:text-text hover:bg-bg-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              onClick={() => setOpen((v) => !v)}
              ref={menuButtonRef}
              aria-expanded={open}
              aria-controls="landing-mobile-menu"
              aria-label="Toggle menu"
            >
              {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </nav>

        {open && (
          <div
            id="landing-mobile-menu"
            className="lg:hidden liquid-glass-strong rounded-xl mt-2 p-4 flex flex-col gap-3"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="inline-flex min-h-11 items-center text-text-muted hover:text-text transition-colors text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/dashboard"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-11 items-center text-text-muted hover:text-text transition-colors text-sm font-medium"
            >
              Dashboard
            </Link>
            <TextRollButton
              variant="primary"
              href="/dashboard"
              className="justify-center"
            >
              Open app
            </TextRollButton>
          </div>
        )}
      </div>
    </header>
  );
}
