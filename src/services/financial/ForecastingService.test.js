import { describe, it, expect } from 'vitest';
import ForecastingService from './ForecastingService';
import MathUtils from '../core/MathUtils';
import { MONTHLY_FINANCIALS } from '../../data/datasets';

describe('ForecastingService', () => {
  it('forecast genera `horizon` puntos con banda de predicción válida', () => {
    const fc = ForecastingService.forecast(MONTHLY_FINANCIALS, { horizon: 6, metric: 'revenue' });

    expect(fc.points).toHaveLength(6);
    for (const p of fc.points) {
      expect(Number.isFinite(p.value)).toBe(true);
      expect(Number.isFinite(p.lower)).toBe(true);
      expect(Number.isFinite(p.upper)).toBe(true);
      expect(p.lower).toBeLessThanOrEqual(p.value);
      expect(p.value).toBeLessThanOrEqual(p.upper);
    }
  });

  it('F0: la banda V3 se valida contra la V2 REAL (no un 3x artificial)', () => {
    const fc = ForecastingService.forecast(MONTHLY_FINANCIALS, { horizon: 6, metric: 'revenue' });

    const sigma = fc.sigma;
    const n = MONTHLY_FINANCIALS.length; // 12
    const horizon = 6;
    // Último punto del horizonte sobre la recta: i = n + horizon - 1 = 17.
    const i = n - 1 + horizon;

    // Banda V2 REAL (commit 6de0bef): half-band = sigma * 1.96 *
    //   sqrt(1 + 1/n + ((i - (n - 1)) ** 2) / n)
    const bandaV2 = sigma * 1.96 * Math.sqrt(1 + 1 / n + ((i - (n - 1)) ** 2) / n);
    const bandaV3 = (fc.points[horizon - 1].upper - fc.points[horizon - 1].lower) / 2;

    expect(sigma).toBeGreaterThan(0);
    // El 3x del test original era matemáticamente inalcanzable: con la V2 real
    // el ratio oscila ≈1.2x (primer punto) → ≈0.8x (último punto, aquí).
    const ratio = bandaV3 / bandaV2;
    expect(ratio).toBeLessThan(3);
    expect(ratio).toBeGreaterThan(0.5);
  });

  it('F0: t_{0.975,10}=2.228 > 1.96 hace la banda V3 más ancha cerca de la tendencia', () => {
    const fc = ForecastingService.forecast(MONTHLY_FINANCIALS, { horizon: 6, metric: 'revenue' });

    const sigma = fc.sigma;
    const n = MONTHLY_FINANCIALS.length;
    const i = n; // primer punto del horizonte, i = n = 12

    const bandaV2 = sigma * 1.96 * Math.sqrt(1 + 1 / n + ((i - (n - 1)) ** 2) / n);
    const bandaV3 = (fc.points[0].upper - fc.points[0].lower) / 2;

    expect(bandaV3).toBeGreaterThan(bandaV2);
  });

  it('F0: studentTQuantile(10) > 1.96 (la mejora fundamental de V3 sobre z)', () => {
    expect(MathUtils.studentTQuantile(10)).toBeGreaterThan(1.96);
  });

  it('F0: la banda crece con la distancia a meanX (último punto > primer punto)', () => {
    const fc = ForecastingService.forecast(MONTHLY_FINANCIALS, { horizon: 6, metric: 'revenue' });

    const bandaPrimer = fc.points[0].upper - fc.points[0].lower;
    const bandaUltimo = fc.points[fc.points.length - 1].upper - fc.points[fc.points.length - 1].lower;

    expect(bandaUltimo).toBeGreaterThan(bandaPrimer);
  });

  it('F0: lower <= value <= upper en todos los points', () => {
    const fc = ForecastingService.forecast(MONTHLY_FINANCIALS, { horizon: 6, metric: 'revenue' });

    for (const p of fc.points) {
      expect(p.lower).toBeLessThanOrEqual(p.value);
      expect(p.value).toBeLessThanOrEqual(p.upper);
    }
  });

  it('method identifica el modelo linear-trend + monthly seasonality', () => {
    const fc = ForecastingService.forecast(MONTHLY_FINANCIALS, { horizon: 6, metric: 'revenue' });
    expect(fc.method).toBe('linear-trend + monthly seasonality');
  });

  it('expectedGrowth es negativo para una serie decreciente', () => {
    const decreasing = [
      { month: '2025-01', revenue: 100 },
      { month: '2025-02', revenue: 90 },
      { month: '2025-03', revenue: 80 },
      { month: '2025-04', revenue: 70 },
      { month: '2025-05', revenue: 60 },
      { month: '2025-06', revenue: 50 },
    ];
    const fc = ForecastingService.forecast(decreasing, { horizon: 3, metric: 'revenue' });
    expect(fc.expectedGrowth).toBeLessThan(0);
    expect(fc.points[0].value).toBeLessThan(50);
  });

  it('devuelve insufficient-data cuando hay menos de 5 puntos', () => {
    const short = MONTHLY_FINANCIALS.slice(0, 4);
    const fc = ForecastingService.forecast(short, { horizon: 6, metric: 'revenue' });
    expect(fc.points).toEqual([]);
    expect(fc.method).toBe('insufficient-data');
  });

  it('devuelve insufficient-data para una serie vacía', () => {
    const fc = ForecastingService.forecast([], { horizon: 6, metric: 'revenue' });
    expect(fc.points).toEqual([]);
    expect(fc.method).toBe('insufficient-data');
  });

  it('forecast con metric=expenses no lanza y expectedGrowth es un número', () => {
    expect(() => {
      ForecastingService.forecast(MONTHLY_FINANCIALS, { horizon: 4, metric: 'expenses' });
    }).not.toThrow();

    const fc = ForecastingService.forecast(MONTHLY_FINANCIALS, { horizon: 4, metric: 'expenses' });
    expect(fc.points).toHaveLength(4);
    expect(Number.isFinite(fc.expectedGrowth)).toBe(true);
  });

  it('sigma y slope son finitos; slope positivo en la serie creciente', () => {
    const fc = ForecastingService.forecast(MONTHLY_FINANCIALS, { horizon: 6, metric: 'revenue' });
    expect(Number.isFinite(fc.sigma)).toBe(true);
    expect(Number.isFinite(fc.slope)).toBe(true);
    expect(fc.slope).toBeGreaterThan(0);
  });

  it('backtest devuelve métricas finitas con coverage en [0, 100]', () => {
    const bt = ForecastingService.backtest(MONTHLY_FINANCIALS, { horizon: 3, metric: 'revenue' });
    for (const key of ['mae', 'rmse', 'mape', 'wape', 'bias', 'coverage']) {
      expect(Number.isFinite(bt[key])).toBe(true);
    }
    expect(bt.coverage).toBeGreaterThanOrEqual(0);
    expect(bt.coverage).toBeLessThanOrEqual(100);
  });

  it('backtest con datos insuficientes devuelve métricas en cero', () => {
    const short = MONTHLY_FINANCIALS.slice(0, 5);
    const bt = ForecastingService.backtest(short, { horizon: 3, metric: 'revenue' });
    expect(bt.mae).toBe(0);
    expect(bt.rmse).toBe(0);
    expect(bt.mape).toBe(0);
    expect(bt.wape).toBe(0);
    expect(bt.bias).toBe(0);
    expect(bt.coverage).toBe(0);
  });
});
