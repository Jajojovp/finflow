import React from 'react';
import { Upload, Cpu, Bot, CheckCircle2 } from 'lucide-react';
import FadeIn from '../animations/FadeIn';

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

/**
 * HowItWorks — Dark Luxe timeline of the four-step pipeline.
 *
 * Each step card pairs a gold mono step number in a ring circle with the
 * real step icon, followed by the real step title and description. Cards
 * fade in with a 200ms stagger.
 *
 * @returns {import('react').ReactElement}
 */
export default function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-it-works-title" className="bg-bg-surface border-t border-border py-24 lg:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-primary font-mono text-xs uppercase tracking-[0.2em] mb-3">
            Process
          </p>
          <h2 id="how-it-works-title" className="font-display font-bold text-text text-3xl sm:text-4xl">
            From data to decision in 4 steps
          </h2>
          <p className="mt-4 text-text-muted">
            A transparent pipeline — no black boxes, no spreadsheet archaeology.
          </p>
        </FadeIn>

        <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="relative h-full lg:px-3 lg:first:pl-0 lg:last:pr-0">
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute z-0 left-5 top-10 bottom-[-1.5rem] w-px bg-primary/30 md:hidden"
                  />
                )}
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute z-0 left-1/2 top-10 hidden h-px w-[calc(100%+1.5rem)] bg-primary/30 lg:block"
                  />
                )}
                <FadeIn delay={i * 200} duration={800} className="h-full">
                  <div className="relative z-10 h-full rounded-2xl border border-border bg-bg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-10 h-10 rounded-full border border-primary/50 bg-primary text-black flex items-center justify-center font-mono text-sm font-semibold shadow-glow-primary/30">
                        {i + 1}
                      </span>
                      <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Icon size={18} aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="font-display font-semibold text-text">
                      {s.title}
                    </h3>
                    <p className="text-sm text-text-muted mt-1.5">{s.description}</p>
                  </div>
                </FadeIn>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
