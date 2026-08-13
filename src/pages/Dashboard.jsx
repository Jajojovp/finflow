import React, { useMemo, useState, useRef, useCallback } from 'react';
import { DollarSign, TrendingUp, Wallet, Percent } from 'lucide-react';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import PageContainer from '../components/layout/PageContainer';
import MetricCard from '../components/charts/MetricCard';
import LineChart from '../components/charts/LineChart';
import BarChart from '../components/charts/BarChart';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useIsMobile } from '../hooks/useMediaQuery';
import { fmt } from '../utils/formatters';
import { MONTHLY_FINANCIALS } from '../data/datasets';
import { KPICalculator } from '../services/financial/KPICalculator';
import { CashFlowService } from '../services/financial/CashFlowService';

export default function Dashboard() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuTriggerRef = useRef(null);

  const kpis = useMemo(() => KPICalculator.fromMonthly(MONTHLY_FINANCIALS), []);
  const cashSeries = useMemo(
    () => CashFlowService.monthlyNetFlow(MONTHLY_FINANCIALS),
    [],
  );

  const revenueSeries = MONTHLY_FINANCIALS.map((d) => ({
    label: d.month.slice(5),
    revenue: d.revenue,
    expenses: d.expenses,
  }));

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
          title="Financial overview"
          description="Latest KPIs, cash flow trend and monthly performance."
          actions={<Button variant="secondary" size="sm">Export</Button>}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricCard label="Total revenue" value={kpis.totalRevenue} icon={DollarSign} tone="primary" delta={kpis.revenueGrowth} />
            <MetricCard label="Net margin" value={kpis.netMargin} format="percent" icon={Percent} tone="success" delta={kpis.marginDelta} deltaUnit="pp" />
            <MetricCard label="Cash position" value={kpis.cashPosition} icon={Wallet} tone="accent" />
            <MetricCard label="Cash runway" value={kpis.runwayMonths} format="months" icon={TrendingUp} tone="neutral" hint="months at current burn" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader title="Revenue vs expenses" subtitle="Last 12 months" />
              <BarChart data={revenueSeries} series={[{ key: 'revenue', name: 'Revenue' }, { key: 'expenses', name: 'Expenses' }]} showLegend />
            </Card>
            <Card>
              <CardHeader title="Cash position" subtitle="End of month" />
              <LineChart
                data={MONTHLY_FINANCIALS.map((d) => ({ label: d.month.slice(5), cash: d.cash }))}
                series={[{ key: 'cash', name: 'Cash', color: '#10B981' }]}
                valueFormatter={fmt.compact}
              />
            </Card>
          </div>

          <Card>
            <CardHeader title="Net cash flow" subtitle="Monthly" />
            <BarChart
              data={cashSeries}
              series={[{ key: 'net', name: 'Net flow', color: '#8B5CF6' }]}
            />
          </Card>
        </PageContainer>
      </div>
    </div>
  );
}
