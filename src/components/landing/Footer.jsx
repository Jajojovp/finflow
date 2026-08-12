import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../common/Logo';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Analysis', to: '/analysis' },
      { label: 'Forecast', to: '/forecast' },
      { label: 'Settings', to: '/settings' },
    ],
  },
  {
    title: 'Company',
    comingSoon: 'Coming soon: About, Blog, Careers',
  },
  {
    title: 'Legal',
    comingSoon: 'Coming soon: Privacy, Terms, Security',
  },
];

/**
 * Footer — Dark Luxe footer.
 *
 * Logo + real tagline on the left, three real link columns, and a bottom
 * bar with the dynamic year in mono dim type.
 *
 * @returns {import('react').ReactElement}
 */
export default function Footer() {
  return (
    <footer className="bg-bg-surface border-t border-border py-12 lg:py-14">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" aria-label="FinFlow home" className="inline-flex min-h-11 min-w-11 items-center">
              <Logo size="md" />
            </Link>
            <p className="text-sm text-text-muted max-w-xs mt-3">
              AI-powered financial decision engine for modern businesses.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="font-mono font-semibold text-primary text-xs uppercase tracking-widest mb-3">
                {col.title}
              </h4>
              {col.comingSoon ? (
                <p className="font-mono text-xs leading-relaxed text-text-dim">{col.comingSoon}</p>
              ) : (
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.to}
                        aria-label={`Go to ${link.label}`}
                        className="font-mono text-xs text-text-muted hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-xs text-text-dim">
            © {new Date().getFullYear()} FinFlow. All rights reserved.
          </p>
          <p className="font-mono text-xs text-text-dim">
            Built for finance teams who move fast.
          </p>
        </div>
      </div>
    </footer>
  );
}
