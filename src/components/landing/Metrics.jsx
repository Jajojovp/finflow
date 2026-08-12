import React from 'react';
import FadeIn from '../animations/FadeIn';

const METRICS = [
  { value: '20+', label: 'Financial KPIs computed' },
  { value: '< 2 min', label: 'From upload to insight' },
  { value: '95%', label: 'Forecast accuracy (demo data)' },
  { value: '24/7', label: 'Agent monitoring' },
];

/**
 * Metrics — Dark Luxe stat band.
 *
 * The real FinFlow numbers render in large mono gold-gradient type on a
 * bordered surface band, with muted labels and a 150ms stagger.
 *
 * @returns {import('react').ReactElement}
 */
export default function Metrics() {
  return (
    <section aria-label="FinFlow metrics" className="bg-bg-surface border-y border-border py-16 lg:py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10 lg:gap-8">
          {METRICS.map((m, i) => (
            <FadeIn key={m.label} delay={i * 150} duration={800} className="text-center">
              <div className="font-mono text-4xl lg:text-5xl font-semibold text-gradient">
                {m.value}
              </div>
              <div className="mt-3 text-sm text-text-muted">{m.label}</div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
