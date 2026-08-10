import React from 'react';

const METRICS = [
  { value: '20+', label: 'Financial KPIs computed' },
  { value: '< 2 min', label: 'From upload to insight' },
  { value: '95%', label: 'Forecast accuracy (demo data)' },
  { value: '24/7', label: 'Agent monitoring' },
];

export default function Metrics() {
  return (
    <section className="bg-bg py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {METRICS.map((m) => (
            <div key={m.label} className="text-center p-6 rounded-xl border border-border bg-bg-surface">
              <div className="font-display font-extrabold text-gradient text-3xl sm:text-4xl">{m.value}</div>
              <div className="mt-2 text-sm text-text-muted">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}