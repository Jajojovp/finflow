import React from 'react';
import { Calculator, Waves, TrendingUp, AlertTriangle, Bot, Bell } from 'lucide-react';
import Card from '../ui/Card';

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

export default function Features() {
  return (
    <section id="features" className="bg-bg py-20 sm:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display font-bold text-text text-3xl sm:text-4xl">
            Everything a modern finance team needs
          </h2>
          <p className="mt-4 text-text-muted">
            One platform from raw transactions to executive-grade decisions — without spreadsheets sprawl.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} hover className="group">
                <span className="inline-flex w-10 h-10 rounded-lg bg-primary/10 text-primary-light items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Icon size={20} />
                </span>
                <h3 className="font-display font-semibold text-text text-base mb-1">{f.title}</h3>
                <p className="text-sm text-text-muted">{f.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}