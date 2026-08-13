import React, { useMemo } from 'react';
import {
  BarChart as RBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { fmt } from '../../utils/formatters';
import { CHART_COLORS, SERIES_PALETTE } from '../../utils/chartTokens';

function ChartTooltip({ active, payload, label, valueFormatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-surface border border-border rounded-lg shadow-elevated px-3 py-2 text-xs">
      {label != null && <p className="text-text-muted mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2 text-text">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-text-muted">{entry.name}:</span>
          <span className="font-medium">{valueFormatter(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

export default function BarChart({
  data = [],
  series = [],
  xKey = 'label',
  valueFormatter = fmt.compact,
  height = 280,
  layout = 'horizontal',
  stacked = false,
  showLegend = false,
  showGrid = true,
}) {
  const bars = useMemo(() => {
    return (series.length ? series : [{ key: 'value', name: 'Value' }]).map((s, i) => (
      <Bar
        key={s.key}
        dataKey={s.key}
        name={s.name || s.key}
        stackId={stacked ? 'a' : undefined}
        fill={s.color || SERIES_PALETTE[i % SERIES_PALETTE.length]}
        radius={stacked ? 0 : [4, 4, 0, 0]}
        maxBarSize={48}
      />
    ));
  }, [series, stacked]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RBarChart data={data} layout={layout} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} vertical={layout !== 'horizontal'} horizontal={layout === 'horizontal'} />}
        {layout === 'horizontal' ? (
          <>
            <XAxis dataKey={xKey} stroke={CHART_COLORS.axis} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis stroke={CHART_COLORS.axis} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={valueFormatter} width={64} />
          </>
        ) : (
          <>
            <XAxis type="number" stroke={CHART_COLORS.axis} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={valueFormatter} />
            <YAxis dataKey={xKey} type="category" stroke={CHART_COLORS.axis} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={120} />
          </>
        )}
        <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} cursor={{ fill: 'rgba(55,65,81,0.3)' }} />
        {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {bars}
      </RBarChart>
    </ResponsiveContainer>
  );
}
