import React from 'react';
import { Upload, Cpu, Bot, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    icon: Upload,
    title: 'Connect your data',
    description: 'Import transactions, ledger exports or sync from your accounting stack.',
  },
  {
    icon: Cpu,
    title: 'Engine computes',
    description: 'KPIs, cash flow, forecasts and anomalies are calculated on demand.',
  },
  {
    icon: Bot,
    title: 'Agent recommends',
    description: 'The autonomous agent proposes actions; you approve what ships.',
  },
  {
    icon: CheckCircle2,
    title: 'Decide with confidence',
    description: 'Every recommendation is backed by traceable numbers and benchmarks.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-bg-surface py-20 sm:py-24 border-y border-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display font-bold text-text text-3xl sm:text-4xl">From data to decision in 4 steps</h2>
          <p className="mt-4 text-text-muted">A transparent pipeline — no black boxes, no spreadsheet archaeology.</p>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="relative bg-bg rounded-lg border border-border p-5">
                <span className="absolute -top-3 -left-3 w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="inline-flex w-10 h-10 rounded-lg bg-accent/10 text-accent-light items-center justify-center mb-3">
                  <Icon size={20} />
                </span>
                <h3 className="font-display font-semibold text-text text-base mb-1">{s.title}</h3>
                <p className="text-sm text-text-muted">{s.description}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}