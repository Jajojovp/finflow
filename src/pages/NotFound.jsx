import React from 'react';
import { Link } from 'react-router-dom';

/**
 * NotFound — 404 page rendered for unmatched routes.
 *
 * @returns {import('react').ReactElement}
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <p className="text-6xl font-display font-bold text-primary mb-4">404</p>
        <h1 className="text-xl font-display font-semibold text-text mb-2">Page not found</h1>
        <p className="text-sm text-text-muted mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center min-h-11 px-5 rounded-lg bg-primary text-black text-sm font-medium hover:bg-primary-dark transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Go to dashboard
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center min-h-11 px-5 rounded-lg border border-border text-text text-sm font-medium hover:bg-bg-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
