import { describe, it, expect } from 'vitest';
import BenchmarkService from './BenchmarkService';
import KPICalculator from './KPICalculator';
import { MONTHLY_FINANCIALS, INDUSTRY_BENCHMARKS } from '../../data/datasets';

const kpis = KPICalculator.fromMonthly(MONTHLY_FINANCIALS);

describe('BenchmarkService', () => {
  it('compare devuelve 9 filas (una por dimensión)', () => {
    const rows = BenchmarkService.compare(MONTHLY_FINANCIALS, kpis, INDUSTRY_BENCHMARKS);
    expect(rows).toHaveLength(9);
    const metrics = rows.map((r) => r.metric);
    expect(metrics).toContain('operatingMargin');
    expect(metrics).toContain('customerAcquisitionCost');
    expect(metrics).toContain('lifetimeValue');
  });

  it('operatingMargin usa EBIT/Revenue real y no confunde con netMargin', () => {
    const rows = BenchmarkService.compare(MONTHLY_FINANCIALS, kpis, INDUSTRY_BENCHMARKS);
    const row = rows.find((r) => r.metric === 'operatingMargin');
    expect(row.company).toBe(kpis.operatingMargin);
    expect(row.company).toBeCloseTo(0.4215, 3);
    expect(row.company).not.toBe(kpis.netMargin);
    expect(row.benchmark).toBe(INDUSTRY_BENCHMARKS.operatingMargin);
  });

  it('customerAcquisitionCost y lifetimeValue quedan unknown (sin dato en FASE 0)', () => {
    const rows = BenchmarkService.compare(MONTHLY_FINANCIALS, kpis, INDUSTRY_BENCHMARKS);
    for (const metric of ['customerAcquisitionCost', 'lifetimeValue']) {
      const row = rows.find((r) => r.metric === metric);
      expect(row.company).toBeNull();
      expect(row.gap).toBeNull();
      expect(row.status).toBe('unknown');
    }
  });

  it('score: total es 9 y pct está en [0, 1]', () => {
    const score = BenchmarkService.score(MONTHLY_FINANCIALS, kpis, INDUSTRY_BENCHMARKS);
    expect(score.total).toBe(9);
    expect(score.pct).toBeGreaterThanOrEqual(0);
    expect(score.pct).toBeLessThanOrEqual(1);
  });

  it('no lanza cuando kpis no tiene un campo; la fila queda unknown', () => {
    const kpisSinCampo = { ...kpis, operatingMargin: undefined };
    let rows;
    expect(() => {
      rows = BenchmarkService.compare(MONTHLY_FINANCIALS, kpisSinCampo, INDUSTRY_BENCHMARKS);
    }).not.toThrow();
    const row = rows.find((r) => r.metric === 'operatingMargin');
    expect(row.company == null).toBe(true);
    expect(row.gap).toBeNull();
    expect(row.status).toBe('unknown');
  });

  it('compat V2: compare(series, benchmarks) sin kpis funciona vía shim', () => {
    const rows = BenchmarkService.compare(MONTHLY_FINANCIALS, INDUSTRY_BENCHMARKS);
    expect(rows).toHaveLength(9);
    const om = rows.find((r) => r.metric === 'operatingMargin');
    expect(om.company).toBeCloseTo(kpis.operatingMargin, 6);
  });
});
