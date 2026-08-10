import React, { useMemo, useState } from 'react';
import { AlertTriangle, Activity, Gauge } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import PageContainer from '../components/layout/PageContainer';
import Card, { CardHeader } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Tabs from '../components/ui/Tabs';
import MetricCard from '../components/charts/MetricCard';
import { Table } from '../components/ui/Table';
import EmptyState from '../components/ui/EmptyState';
import { useIsMobile } from '../hooks/useMediaQuery';
import { fmt } from '../utils/formatters';
import { MONTHLY_FINANCIALS, INDUSTRY_BENCHMARKS } from '../data/datasets';
import { AnomalyService } from '../services/financial/AnomalyService';
import { BenchmarkService } from '../services/financial/BenchmarkService';
import { VarianceService } from '../services/financial/VarianceService';

export default function Analysis() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState(0);

  const anomalies = useMemo(() => AnomalyService.detect(MONTHLY_FINANCIALS), []);
  const benchmarks = useMemo(() => BenchmarkService.compare(MONTHLY_FINANCIALS, INDUSTRY_BENCHMARKS), []);
  const variances = useMemo(() => VarianceService.monthly(MONTHLY_FINANCIALS), []);

  const anomalyCount = anomalies.filter((a) => a.severity !== 'info').length;

  return (
    <div className="min-h-screen bg-bg flex">
      {!isMobile && <Sidebar />}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="relative"><Sidebar onNavigate={() => setSidebarOpen(false)} /></div>
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <PageContainer
          title="Financial analysis"
          description="Anomalies, benchmark gaps and budget variances side by side."
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <MetricCard label="Anomalies flagged" value={anomalyCount} format="number" icon={AlertTriangle} tone={anomalyCount > 0 ? 'danger' : 'success'} />
            <MetricCard label="Benchmark gaps" value={benchmarks.filter((b) => b.gap !== 0).length} format="number" icon={Gauge} tone="warning" />
            <MetricCard label="Variance lines" value={variances.length} format="number" icon={Activity} tone="primary" />
          </div>

          <Card>
            <CardHeader
              title="Deep dive"
              action={
                <Tabs
                  tabs={['Anomalies', 'Benchmarks', 'Variances']}
                  defaultIndex={tab}
                  onChange={setTab}
                />
              }
            />

            {tab === 0 && (
              anomalies.length ? (
                <Table
                  columns={[
                    { key: 'month', header: 'Period' },
                    { key: 'metric', header: 'Metric' },
                    { key: 'value', header: 'Value', render: (v) => fmt.compact(v) },
                    { key: 'expected', header: 'Expected', render: (v) => fmt.compact(v) },
                    {
                      key: 'severity',
                      header: 'Severity',
                      render: (v) => <Badge tone={v === 'critical' ? 'danger' : v === 'warning' ? 'warning' : 'neutral'}>{v}</Badge>,
                    },
                  ]}
                  data={anomalies}
                  rowKey={(r) => `${r.month}-${r.metric}`}
                />
              ) : (
                <EmptyState title="No anomalies detected" description="All metrics are within expected ranges." />
              )
            )}

            {tab === 1 && (
              <Table
                columns={[
                  { key: 'metric', header: 'Metric' },
                  { key: 'company', header: 'Company', render: (v, r) => (r.format === 'percent' ? fmt.percent(v) : fmt.compact(v)) },
                  { key: 'benchmark', header: 'Benchmark', render: (v, r) => (r.format === 'percent' ? fmt.percent(v) : fmt.compact(v)) },
                  {
                    key: 'gap',
                    header: 'Gap',
                    render: (v, r) => (
                      <Badge tone={v > 0 ? 'success' : v < 0 ? 'danger' : 'neutral'}>
                        {r.format === 'percent' ? fmt.percent(Math.abs(v)) : `${v > 0 ? '+' : ''}${fmt.compact(v)}`}
                      </Badge>
                    ),
                  },
                ]}
                data={benchmarks}
                rowKey={(r) => r.metric}
              />
            )}

            {tab === 2 && (
              variances.length ? (
                <Table
                  columns={[
                    { key: 'month', header: 'Period' },
                    { key: 'budget', header: 'Budget', render: (v) => fmt.compact(v) },
                    { key: 'actual', header: 'Actual', render: (v) => fmt.compact(v) },
                    {
                      key: 'variance',
                      header: 'Variance',
                      render: (v) => (
                        <Badge tone={v >= 0 ? 'success' : 'danger'}>
                          {v >= 0 ? '+' : ''}{fmt.compact(v)}
                        </Badge>
                      ),
                    },
                    {
                      key: 'pct',
                      header: '%',
                      render: (v) => (
                        <Badge tone={v >= 0 ? 'success' : 'danger'}>{fmt.percent(v)}</Badge>
                      ),
                    },
                  ]}
                  data={variances}
                  rowKey={(r) => r.month}
                />
              ) : (
                <EmptyState title="No budget variances" description="All periods match their budget." />
              )
            )}
          </Card>
        </PageContainer>
      </div>
    </div>
  );
}