import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';
import { fmt } from '../../utils/formatters';
import Card from '../ui/Card';

/**
 * MetricCard — headline KPI with an optional period-over-period delta.
 *
 * The numeric unit of `delta` is declared via `deltaUnit` so callers pass data
 * as-is regardless of how the source computed it:
 *
 * - `'pct'` (default): `delta` is a ratio/fraction (0.072 ≡ 7.2%). Display
 *   multiplies by 100 (`Math.abs(delta * 100)`), aligned with `fmt.percent`.
 * - `'pp'`: `delta` is already in percentage points (2.16 ≡ +2.16 pp), e.g.
 *   `KPICalculator.marginDelta`. Display uses the value as-is.
 * - `'ratio'`: `delta` is a plain ratio; rendered verbatim.
 *
 * The arrow and color reflect the real sign of `delta`; only the numeric text
 * is absolutized so a negative delta still reads like a magnitude.
 *
 * @param {object} props
 * @param {string} props.label
 * @param {number|null} props.value
 * @param {string} [props.unit]
 * @param {'currency'|'percent'|'compact'|'number'|'days'|'custom'|'string'} [props.format='currency']
 * @param {number|null} [props.delta] Raw period-over-period change; unit per `deltaUnit`.
 * @param {'pct'|'pp'|'ratio'} [props.deltaUnit='pct'] Unit of `delta`.
 * @param {string} [props.deltaSuffix] Suffix appended to the delta text;
 *   defaults to `'pp'` when `deltaUnit === 'pp'`, otherwise `'%'`.
 * @param {string} [props.hint]
 * @param {object} [props.icon]
 * @param {'neutral'|'primary'|'success'|'danger'|'warning'|'accent'} [props.tone='neutral']
 * @param {boolean} [props.loading=false]
 */
export default function MetricCard({
  label,
  value,
  unit,
  format = 'currency',
  delta,
  deltaUnit = 'pct',
  deltaSuffix = deltaUnit === 'pp' ? 'pp' : '%',
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

  const formattedDelta = delta == null ? null : formatDelta(delta, deltaUnit);

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
        <span className={clsx('font-mono font-bold text-text text-2xl tabular-nums', loading && 'animate-pulse')}>
          {formatted}
        </span>
        {formattedDelta != null && !loading && (
          <span className={clsx('inline-flex items-center gap-0.5 text-xs font-medium', deltaTone)}>
            <DeltaIcon size={12} />
            {formattedDelta}
            {deltaSuffix}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-text-dim">{hint}</p>}
    </Card>
  );
}

/** Renders the delta number according to its declared unit (see MetricCard JSDoc). */
function formatDelta(delta, deltaUnit) {
  switch (deltaUnit) {
    case 'pp':
      return Math.abs(delta).toFixed(1);
    case 'ratio':
      return String(delta);
    case 'pct':
    default:
      return Math.abs(delta * 100).toFixed(1);
  }
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
    case 'months':
      return fmt.number(value, 1) + ' mo';
    case 'custom':
      return unit ? `${value}${unit}` : String(value);
    default:
      return String(value);
  }
}