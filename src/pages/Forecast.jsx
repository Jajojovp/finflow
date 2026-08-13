import React, { useMemo, useState, useRef, useCallback } from 'react';
import { TrendingUp, Calendar, Sigma } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import PageContainer from '../components/layout/PageContainer';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { Table } from '../components/ui/Table';
import Tabs from '../components/ui/Tabs';
import LineChart from '../components/charts/LineChart';
import MetricCard from '../components/charts/MetricCard';
import { useIsMobile } from '../hooks/useMediaQuery';
import { fmt } from '../utils/formatters';
import { MONTHLY_FINANCIALS, COVENANTS } from '../data/datasets';
import { ForecastingService } from '../services/financial/ForecastingService';
import { CovenantService } from '../services/financial/CovenantService';

export default function Forecast() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [horizon, setHorizon] = useState(6);
  const [tab, setTab] = useState(0);
  const menuTriggerRef = useRef(null);

  const forecast = useMemo(() => ForecastingService.forecast(MONTHLY_FINANCIALS, { horizon }), [horizon]);
  const covenantStatus = useMemo(
    () => CovenantService.evaluate(MONTHLY_FINANCIALS[MONTHLY_FINANCIALS.length - 1], COVENANTS),
    [],
  );

  const combined = useMemo(() => {
    const actuals = MONTHLY_FINANCIALS.map((d) => ({ label: d.month.slice(5), actual: d.revenue, forecast: null, upper: null, lower: null }));
    const future = forecast.points.map((p) => ({ label: p.month.slice(5), actual: null, forecast: p.value, upper: p.upper, lower: p.lower }));
    return [...actuals, ...future];
  }, [forecast]);

  const band = `${fmt.compact(forecast.points[0]?.lower)} – ${fmt.compact(forecast.points[0]?.upper)}`;

  const handleSidebarClose = useCallback(() => {
    setSidebarOpen(false);
    menuTriggerRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-bg flex">
      {!isMobile && <Sidebar />}
      {isMobile && (
        <Sidebar open={sidebarOpen} onClose={handleSidebarClose} />
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        <Navbar onMenuClick={() => setSidebarOpen(true)} menuTriggerRef={menuTriggerRef} />
        <PageContainer
          title="Forecasting"
          description="Project revenue with confidence intervals and monitor covenants."
          actions={
            <div className="flex items-center gap-2">
              {[3, 6, 12].map((h) => (
                <Button key={h} size="sm" variant={horizon === h ? 'primary' : 'secondary'} onClick={() => setHorizon(h)}>
                  {h}m
                </Button>
              ))}
            </div>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <MetricCard label="Forecast (next period)" value={forecast.points[0]?.value} icon={TrendingUp} tone="primary" delta={forecast.expectedGrowth} />
            <MetricCard label="Confidence band" value={band} format="custom" icon={Sigma} tone="accent" />
            <MetricCard label="Covenants breached" value={covenantStatus.breaches.length} format="number" icon={Calendar} tone={covenantStatus.breaches.length > 0 ? 'danger' : 'success'} />
          </div>

          <Card className="mb-6">
            <CardHeader
              title="Revenue forecast"
              subtitle={`Next ${horizon} months · ${forecast.method}`}
              action={<Tabs tabs={['Chart', 'Table']} onChange={setTab} />}
            />
            {tab === 0 ? (
              <LineChart
                data={combined}
                series={[
                  { key: 'actual', name: 'Actual', color: '#3B82F6' },
                  { key: 'forecast', name: 'Forecast', color: '#8B5CF6', dashed: true },
                  { key: 'upper', name: 'Upper', color: '#4B5563' },
                  { key: 'lower', name: 'Lower', color: '#4B5563' },
                ]}
                showLegend
                height={320}
              />
            ) : (
              <Table
                columns={[
                  { key: 'month', header: 'Period' },
                  { key: 'value', header: 'Forecast', render: (v) => fmt.compact(v) },
                  { key: 'lower', header: 'Lower', render: (v) => fmt.compact(v) },
                  { key: 'upper', header: 'Upper', render: (v) => fmt.compact(v) },
                ]}
                data={forecast.points}
                rowKey={(r) => r.month}
              />
            )}
          </Card>

          <Card>
            <CardHeader title="Covenant monitoring" subtitle="Latest period against limits" />
            {covenantStatus.total === 0 ? (
              <p className="text-sm text-text-muted">No covenants configured.</p>
            ) : (
              <Table
                columns={[
                  { key: 'name', header: 'Covenant' },
                  { key: 'actual', header: 'Actual', render: (v, r) => (r.format === 'percent' ? fmt.percent(v) : fmt.compact(v)) },
                  { key: 'threshold', header: 'Limit', render: (v, r) => `${r.operator} ${(r.format === 'percent' ? fmt.percent(v) : fmt.compact(v))}` },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (v) => <Badge tone={v === 'passed' ? 'success' : v === 'warning' ? 'warning' : 'danger'} dot>{v}</Badge>,
                  },
                ]}
                data={covenantStatus.results}
                rowKey={(r) => r.id}
              />
            )}
          </Card>
        </PageContainer>
      </div>
    </div>
  );
}
