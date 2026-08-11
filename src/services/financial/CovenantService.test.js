import { describe, it, expect } from 'vitest';
import CovenantService from './CovenantService';
import KPICalculator from './KPICalculator';
import { MONTHLY_FINANCIALS, COVENANTS } from '../../data/datasets';

const last = MONTHLY_FINANCIALS[MONTHLY_FINANCIALS.length - 1];
const kpis = KPICalculator.fromMonthly(MONTHLY_FINANCIALS);

function byId(result) {
  return Object.fromEntries(result.results.map((r) => [r.id, r]));
}

describe('CovenantService', () => {
  it('evaluate devuelve 4 resultados; actuales numéricos, nunca undefined', () => {
    const result = CovenantService.evaluate(last, COVENANTS, kpis);
    expect(result.results).toHaveLength(4);
    const rows = byId(result);
    expect(rows.c1.actual).toBe(3541000);
    for (const id of ['c2', 'c3', 'c4']) {
      expect(rows[id].actual).not.toBeUndefined();
      expect(rows[id].actual).not.toBeNull();
    }
  });

  it('c1 Minimum Cash (>= 1.5M) pasa con caja real de 3.541.000', () => {
    const result = CovenantService.evaluate(last, COVENANTS, kpis);
    const c1 = byId(result).c1;
    expect(c1.name).toBe('Minimum Cash');
    expect(c1.status).toBe('passed');
    expect(c1.reason).toBe('ok');
  });

  it('c4 Revenue Growth (>= 0.1) con 0.0724 queda warning, no breach', () => {
    expect(kpis.revenueGrowth).toBeCloseTo(0.0724, 3);
    const result = CovenantService.evaluate(last, COVENANTS, kpis);
    const c4 = byId(result).c4;
    expect(c4.status).toBe('warning');
    expect(c4.status).not.toBe('breach');
  });

  it('sin kpis, c2/c3/c4 quedan unknown y c1 se sigue evaluando', () => {
    const result = CovenantService.evaluate(last, COVENANTS);
    const rows = byId(result);
    expect(rows.c1.status).toBe('passed');
    for (const id of ['c2', 'c3', 'c4']) {
      expect(rows[id].status).toBe('unknown');
      expect(rows[id].reason).toBe('dato no disponible');
    }
  });

  it('covenant critical que no cumple produce breach', () => {
    const floor = {
      id: 'x1', name: 'Cash Floor', metric: 'cash',
      operator: '>=', threshold: 5000000, severity: 'critical',
    };
    const result = CovenantService.evaluate(last, [floor], kpis);
    expect(result.results[0].status).toBe('breach');
    expect(result.breaches).toHaveLength(1);
    expect(result.breaches[0].id).toBe('x1');
  });

  it('operador no soportado queda unknown con razón explícita', () => {
    const weird = {
      id: 'x2', name: 'Weird Op', metric: 'cash',
      operator: '!=', threshold: 100, severity: 'critical',
    };
    const result = CovenantService.evaluate(last, [weird], kpis);
    expect(result.results[0].status).toBe('unknown');
    expect(result.results[0].reason).toBe('operador no soportado');
  });

  it('shape de retorno: total/passed/breaches/warnings/results consistentes', () => {
    const result = CovenantService.evaluate(last, COVENANTS, kpis);
    expect(result.total).toBe(4);
    expect(result.results).toHaveLength(4);
    expect(Array.isArray(result.breaches)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(result.passed).toBe(result.results.filter((r) => r.status === 'passed').length);
    expect(result.breaches).toEqual(result.results.filter((r) => r.status === 'breach'));
    expect(result.warnings).toEqual(result.results.filter((r) => r.status === 'warning'));
  });

  it('threshold numérico con actual null queda unknown, nunca breach falso', () => {
    const noData = {
      id: 'x3', name: 'Free Cash Flow', metric: 'freeCashFlow',
      operator: '>=', threshold: 100000, severity: 'critical',
    };
    const result = CovenantService.evaluate(last, [noData], kpis);
    expect(result.results[0].actual).toBeNull();
    expect(result.results[0].status).toBe('unknown');
    expect(result.breaches).toHaveLength(0);
  });
});
