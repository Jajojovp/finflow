import { describe, it, expect } from 'vitest';
import CashFlowService from './CashFlowService';

function simulateStress(fixture, divisor) {
  const last = fixture[fixture.length - 1];
  let cash = last.cash || 0;
  const points = [{ week: 0, cash }];
  for (let w = 1; w <= 13; w++) {
    const curve = 1 - Math.exp(-w / 4);
    cash += last.revenue * divisor * curve - last.expenses * divisor;
    points.push({ week: w, cash: Math.round(cash * 100) / 100 });
  }
  return points;
}

describe('CashFlowService', () => {
  it('monthlyNetFlow computes net = revenue - expenses per month', () => {
    const series = [
      { month: '2026-01', revenue: 10000, expenses: 6000 },
      { month: '2026-02', revenue: 12000, expenses: 9000 },
    ];
    const result = CashFlowService.monthlyNetFlow(series);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ label: '01', month: '2026-01', net: 4000 });
    expect(result[1]).toEqual({ label: '02', month: '2026-02', net: 3000 });
  });

  it('stressTest uses the 12/52 weekly divisor (27692.3, not the naive /4 → 30000)', () => {
    const fixture = [{ month: '2026-01', revenue: 520000, expenses: 400000, cash: 0 }];
    const result = CashFlowService.stressTest(fixture, { collectionDelayWeeks: 4 });
    const sim52 = simulateStress(fixture, 12 / 52);
    const sim4 = simulateStress(fixture, 1 / 4);

    expect((520000 - 400000) * 12 / 52).toBeCloseTo(27692.3, 1);
    expect((520000 - 400000) * 12 / 52).not.toBeCloseTo(30000, 0);

    result.trajectory.forEach((point, i) => {
      expect(point.cash).toBeCloseTo(sim52[i].cash, 1);
    });
    expect(result.trajectory[13].cash).not.toBeCloseTo(sim4[13].cash, 0);
    expect(result.endingCash).toBeCloseTo(sim52[13].cash, 1);
  });

  it('stressTest returns a finite 13-week trajectory with burn and consistent cash', () => {
    const fixture = [{ month: '2026-01', revenue: 100000, expenses: 150000, cash: 50000 }];
    const result = CashFlowService.stressTest(fixture);

    expect(result.weeks).toBe(13);
    expect(result.trajectory).toHaveLength(14);
    expect(result.trajectory.every((point) => Number.isFinite(point.cash))).toBe(true);
    expect(result.minCash).toBeLessThanOrEqual(result.startingCash);
    expect(result.startingCash).toBe(50000);
    expect(result.startingCash).toBe(fixture[0].cash);
    expect(result.trajectory[0].cash).toBe(50000);
  });

  it('stressTest with collectionDelayWeeks=4 collects early (smooth curve, not step function)', () => {
    const fixture = [{ month: '2026-01', revenue: 520000, expenses: 400000, cash: 0 }];
    const result = CashFlowService.stressTest(fixture, { collectionDelayWeeks: 4 });

    expect(result.trajectory[0].cash).toBe(result.startingCash);

    const curve1 = 1 - Math.exp(-1 / 4);
    const collected1 = (520000 * 12 / 52) * curve1;
    const burned1 = 400000 * 12 / 52;
    expect(curve1).toBeCloseTo(0.2212, 3);
    expect(collected1).toBeGreaterThan(0);
    expect(result.trajectory[1].cash - result.trajectory[0].cash).toBeCloseTo(collected1 - burned1, 1);
  });

  it('averageNetFlow computes the mean over the trailing window', () => {
    const series = [
      { month: '2026-01', revenue: 100, expenses: 50 },
      { month: '2026-02', revenue: 200, expenses: 100 },
      { month: '2026-03', revenue: 300, expenses: 150 },
      { month: '2026-04', revenue: 400, expenses: 200 },
      { month: '2026-05', revenue: 500, expenses: 250 },
    ];
    expect(CashFlowService.averageNetFlow(series, 3)).toBeCloseTo(200, 5);
  });

  it('cumulative starts from series[0].cash and accumulates net flow', () => {
    const series = [
      { month: '2026-01', revenue: 10000, expenses: 6000, cash: 100000 },
      { month: '2026-02', revenue: 12000, expenses: 9000, cash: 100000 },
    ];
    const result = CashFlowService.cumulative(series);
    expect(result[0].cash).toBe(series[0].cash);
    expect(result[0].cash).toBe(100000);
    expect(result[1].cash).toBe(100000 + 12000 - 9000);
  });
});
