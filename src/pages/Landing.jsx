import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import clsx from 'clsx';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import Metrics from '../components/landing/Metrics';
import CTA from '../components/landing/CTA';
import Footer from '../components/landing/Footer';
import Button from '../components/ui/Button';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Dashboard', to: '/dashboard' },
];

function LandingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-bg/80 backdrop-blur-md border-b border-border/60">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm">
            F
          </span>
          <span className="font-display font-bold text-text">FinFlow</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) =>
            link.to ? (
              <Link key={link.label} to={link.to} className="text-sm text-text-muted hover:text-text transition-colors">
                {link.label}
              </Link>
            ) : (
              <a key={link.label} href={link.href} className="text-sm text-text-muted hover:text-text transition-colors">
                {link.label}
              </a>
            ),
          )}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link to="/dashboard">
            <Button size="sm">Open app</Button>
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden p-2 rounded-md text-text-muted hover:bg-bg-hover"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-bg-surface px-6 py-4 space-y-3">
          {NAV_LINKS.map((link) =>
            link.to ? (
              <Link key={link.label} to={link.to} onClick={() => setOpen(false)} className="block text-sm text-text-muted">
                {link.label}
              </Link>
            ) : (
              <a key={link.label} href={link.href} onClick={() => setOpen(false)} className="block text-sm text-text-muted">
                {link.label}
              </a>
            ),
          )}
          <Link to="/dashboard" onClick={() => setOpen(false)}>
            <Button size="sm" className="w-full">Open app</Button>
          </Link>
        </div>
      )}
    </header>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg">
      <LandingNav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Metrics />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}