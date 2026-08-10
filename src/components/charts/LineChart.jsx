import React from 'react';
import {
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { fmt } from '../../utils/formatters';

const PALETTE = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

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

export default function LineChart({
  data = [],
  series = [],
  xKey = 'label',
  valueFormatter = fmt.compact,
  height = 280,
  showLegend = false,
  showGrid = true,
  showDots = false,
  curve = 'monotone',
}) {
  const lines = (series.length ? series : [{ key: 'value', name: 'Value' }]).map((s, i) => (
    <Line
      key={s.key}
      type={curve}
      dataKey={s.key}
      name={s.name || s.key}
      stroke={s.color || PALETTE[i % PALETTE.length]}
      strokeWidth={2}
      dot={showDots ? { r: 3 } : false}
      activeDot={{ r: 5 }}
      strokeDasharray={s.dashed ? '4 4' : undefined}
    />
  ));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RLineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />}
        <XAxis dataKey={xKey} stroke="#6B7280" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <YAxis stroke="#6B7280" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={valueFormatter} width={64} />
        <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} cursor={{ stroke: '#374151', strokeWidth: 1 }} />
        {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}
        {lines}
      </RLineChart>
    </ResponsiveContainer>
  );
}