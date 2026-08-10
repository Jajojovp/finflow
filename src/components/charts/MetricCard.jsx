import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';
import { fmt } from '../../utils/formatters';
import Card from '../ui/Card';

export default function MetricCard({
  label,
  value,
  unit,
  format = 'currency',
  delta,
  deltaSuffix = '%',
  hint,
  icon: Icon,
  tone = 'neutral',
  loading = false,
}) {
  const formatted = loading ? '—' : formatValue(value, format, unit);
  const deltaDirection = delta == null ? 'flat' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const DeltaIcon = deltaDirection === 'up' ? TrendingUp : deltaDirection === 'down' ? TrendingDown : Minus;
  const deltaTone =
    deltaDirection === 'flat' ? 'text-text-dim' : deltaDirection === 'up' ? 'text-success-light' : 'text-danger-light';

  const iconTone = {
    neutral: 'text-text-muted bg-bg-hover',
    primary: 'text-primary-light bg-primary/10',
    success: 'text-success-light bg-success/10',
    danger: 'text-danger-light bg-danger/10',
    warning: 'text-warning-light bg-warning/10',
    accent: 'text-accent-light bg-accent/10',
  }[tone] || 'text-text-muted bg-bg-hover';

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-muted">{label}</span>
        {Icon && (
          <span className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', iconTone)}>
            <Icon size={16} />
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={clsx('font-display font-bold text-text text-2xl tabular-nums', loading && 'animate-pulse')}>
          {formatted}
        </span>
        {delta != null && !loading && (
          <span className={clsx('inline-flex items-center gap-0.5 text-xs font-medium', deltaTone)}>
            <DeltaIcon size={12} />
            {Math.abs(delta).toFixed(1)}
            {deltaSuffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-text-dim">{hint}</p>}
    </Card>
  );
}

function formatValue(value, format, unit) {
  if (value == null || (typeof value === 'number' && !isFinite(value))) return '—';
  switch (format) {
    case 'currency':
      return fmt.currency(value);
    case 'percent':
      return fmt.percent(value);
    case 'compact':
      return fmt.compact(value);
    case 'number':
      return fmt.number(value);
    case 'days':
      return fmt.days(value);
    case 'custom':
      return unit ? `${value}${unit}` : String(value);
    default:
      return String(value);
  }
}