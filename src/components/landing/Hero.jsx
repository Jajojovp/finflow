import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import Button from '../ui/Button';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-bg pt-24 pb-20 sm:pt-32 sm:pb-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(139,92,246,0.1),transparent_50%)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary-light text-xs font-medium mb-6 animate-fade-in">
          <Sparkles size={14} />
          AI-powered financial intelligence
        </div>

        <h1 className="font-display font-extrabold text-text tracking-tight text-4xl sm:text-5xl lg:text-6xl max-w-4xl mx-auto leading-[1.1]">
          Turn raw data into
          <span className="text-gradient"> confident financial decisions</span>
        </h1>

        <p className="mt-6 text-lg text-text-muted max-w-2xl mx-auto">
          FinFlow unifies KPI calculation, cash-flow analysis, forecasting, anomaly detection
          and an autonomous agent — so your team moves from numbers to action in minutes.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/dashboard">
            <Button size="lg" className="w-full sm:w-auto">
              Open Dashboard
              <ArrowRight size={18} />
            </Button>
          </Link>
          <Link to="/analysis">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Explore Analysis
            </Button>
          </Link>
        </div>

        <p className="mt-4 text-xs text-text-dim">No credit card required · Free during beta</p>
      </div>
    </section>
  );
}