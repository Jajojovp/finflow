import React from 'react';
import { Calculator, Waves, TrendingUp, AlertTriangle, Bot, Bell } from 'lucide-react';
import FadeIn from '../animations/FadeIn';

const FEATURES = [
  {
    icon: Calculator,
    title: 'KPI Engine',
    description: 'Compute margins, runway, current ratio and 20+ indicators with validated formulas.',
  },
  {
    icon: Waves,
    title: 'Cash Flow Analysis',
    description: 'Run 13-week projections, sensitivity scenarios and liquidity stress tests.',
  },
  {
    icon: TrendingUp,
    title: 'Forecasting',
    description: 'Generate seasonal and trend-aware forecasts with confidence intervals.',
  },
  {
    icon: AlertTriangle,
    title: 'Anomaly Detection',
    description: 'Spot outliers in revenue, expenses and ratios with statistical thresholds.',
  },
  {
    icon: Bot,
    title: 'Autonomous Agent',
    description: 'An AI agent proposes corrective actions with human-in-the-loop approval.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Covenant breaches, anomalies and forecast risks — delivered on your terms.',
  },
];

/**
 * Features — Dark Luxe grid of FinFlow capabilities.
 *
 * Six glass-surface cards with gold icon tiles that invert to a solid gold
 * fill on hover, plus a soft gold glow. Header carries a mono eyebrow, the
 * real section title and subtitle.
 *
 * @returns {import('react').ReactElement}
 */
export default function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="bg-bg py-24 lg:py-28">
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-primary font-mono text-xs uppercase tracking-[0.2em] mb-3">
            Capabilities
          </p>
          <h2 id="features-title" className="font-display font-bold text-text text-3xl sm:text-4xl">
            Everything a modern finance team needs
          </h2>
          <p className="mt-4 text-text-muted">
            One platform from raw transactions to executive-grade decisions — without spreadsheets sprawl.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <FadeIn key={f.title} delay={i * 100} duration={800} className="h-full">
                <div className="h-full rounded-2xl border border-border bg-bg-surface p-6 transition-all duration-300 group hover:border-primary/40 hover:shadow-glow-primary/20">
                  <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-colors duration-300 group-hover:bg-primary/20 group-hover:text-primary-light">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <h3 className="font-display font-semibold text-text text-base mt-4">
                    {f.title}
                  </h3>
                  <p className="text-sm text-text-muted mt-1.5">{f.description}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
