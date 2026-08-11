import { describe, it, expect } from 'vitest';
import AgentOrchestrator, { CAPABILITIES } from './AgentOrchestrator';
import { MONTHLY_FINANCIALS } from '../../data/datasets';

describe('AgentOrchestrator', () => {
  it('fail-closed: no actions when capabilities is an empty array', () => {
    const result = AgentOrchestrator.propose({ series: MONTHLY_FINANCIALS, capabilities: [] });
    expect(result.actions).toHaveLength(0);
    expect(result.summary.reason).toBe('no_capabilities');
  });

  it('fail-closed: no actions when capabilities are omitted', () => {
    const result = AgentOrchestrator.propose({ series: MONTHLY_FINANCIALS });
    expect(result.actions).toHaveLength(0);
    expect(result.summary.reason).toBe('no_capabilities');
  });

  it('proposes investigate_revenue_decline with evidence and hypotheses on a declining series', () => {
    const declining = [
      { month: '2026-01', revenue: 100000, expenses: 50000, cash: 300000 },
      { month: '2026-02', revenue: 90000, expenses: 50000, cash: 300000 },
      { month: '2026-03', revenue: 81000, expenses: 50000, cash: 300000 },
      { month: '2026-04', revenue: 70000, expenses: 50000, cash: 300000 },
    ];
    const result = AgentOrchestrator.propose({
      series: declining,
      capabilities: [CAPABILITIES.INVESTIGATE_REVENUE_DECLINE],
    });
    const investigate = result.actions.find(
      (action) => action.capability === CAPABILITIES.INVESTIGATE_REVENUE_DECLINE,
    );
    expect(investigate).toBeDefined();
    expect(investigate.evidence.length).toBeGreaterThanOrEqual(1);
    expect(investigate.hypotheses.length).toBeGreaterThanOrEqual(2);
  });

  it('does not trigger a cash sweep when Acme runway is above 6 months', () => {
    const result = AgentOrchestrator.propose({
      series: MONTHLY_FINANCIALS,
      capabilities: [CAPABILITIES.TRIGGER_CASH_SWEEP],
    });
    expect(result.summary.kpis.runwayMonths).toBe(14.1);
    expect(result.summary.kpis.runwayMonths).toBeGreaterThan(6);
    expect(result.actions).toHaveLength(0);
    expect(result.actions.some((action) => action.capability === CAPABILITIES.TRIGGER_CASH_SWEEP)).toBe(false);
  });

  it('returns proposed actions with an evidence array', () => {
    const multi = [
      { month: '2026-01', revenue: 100000, expenses: 150000, cash: 100000 },
      { month: '2026-02', revenue: 90000, expenses: 150000, cash: 100000 },
      { month: '2026-03', revenue: 81000, expenses: 150000, cash: 100000 },
      { month: '2026-04', revenue: 70000, expenses: 150000, cash: 100000 },
    ];
    const result = AgentOrchestrator.propose({
      series: multi,
      capabilities: Object.values(CAPABILITIES),
    });
    expect(result.actions.length).toBeGreaterThan(0);
    result.actions.forEach((action) => {
      expect(Array.isArray(action.evidence)).toBe(true);
      expect(action.status).toBe('proposed');
    });
  });

  it('does not reallocate budget when Acme forecast growth is positive', () => {
    const result = AgentOrchestrator.propose({
      series: MONTHLY_FINANCIALS,
      capabilities: [CAPABILITIES.REALLOCATE_BUDGET],
    });
    expect(result.summary.forecastGrowth).toBeGreaterThan(0);
    expect(result.summary.forecastGrowth).toBeCloseTo(0.0216, 4);
    expect(result.actions).toHaveLength(0);
    expect(result.actions.some((action) => action.capability === CAPABILITIES.REALLOCATE_BUDGET)).toBe(false);
  });

  it('_action produces a unique id and a valid ISO createdAt', () => {
    const first = AgentOrchestrator._action('test_cap', 'rationale', { v: 1 }, 0.5);
    const second = AgentOrchestrator._action('test_cap', 'rationale', { v: 1 }, 0.5);

    expect(first.id).toMatch(/^test_cap-\d{13}-\d+$/);
    expect(second.id).not.toBe(first.id);

    expect(Number.isNaN(Date.parse(first.createdAt))).toBe(false);
    expect(new Date(first.createdAt).toISOString()).toBe(first.createdAt);
  });

  it('CAPABILITIES does not include FLAG_VENDOR', () => {
    expect(Object.prototype.hasOwnProperty.call(CAPABILITIES, 'FLAG_VENDOR')).toBe(false);
    expect(Object.values(CAPABILITIES)).not.toContain('flag_vendor');
  });
});
