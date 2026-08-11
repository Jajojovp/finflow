/**
 * BenchmarkService — compares company metrics against an industry benchmark set.
 *
 * FASE 0 (spec §8): evalúa nueve dimensiones contra INDUSTRY_BENCHMARKS y
 * devuelve una fila por dimensión en orden fijo:
 *   grossMargin, netMargin, currentRatio, debtToEquity, cashRunway,
 *   revenueGrowth, operatingMargin, customerAcquisitionCost, lifetimeValue.
 *
 * Mapeo company ← KPIs calculados:
 *   grossMargin            ← kpis.grossMargin
 *   netMargin              ← kpis.netMargin
 *   currentRatio           ← kpis.currentRatio
 *   debtToEquity           ← kpis.debtToEquity
 *   cashRunway             ← kpis.runwayMonths
 *   revenueGrowth          ← kpis.revenueGrowth
 *   operatingMargin        ← kpis.operatingMargin  (EBIT/Revenue real, NO netMargin)
 *   customerAcquisitionCost ← null (no hay fuente en FASE 0 → 'unknown')
 *   lifetimeValue          ← null (no hay fuente en FASE 0 → 'unknown')
 *
 * Cada fila: { metric, company, benchmark, gap, status }.
 *  - company   : número o null (dato ausente REAL, spec §2 D2 fail-closed).
 *  - benchmark : valor objetivo de industria o null si no está definido.
 *  - gap       : company − benchmark; null si falta cualquiera de los dos.
 *  - status    : 'ahead' (gap > 0.005) | 'behind' (gap < −0.005) |
 *                'even' (|gap| ≤ 0.005) | 'unknown' (dato ausente).
 *
 * IMPORTANTE: los `null` aquí son dato ausente real, nunca un proxy ni un 0
 * inventado. customerAcquisitionCost y lifetimeValue no tienen dato en FASE 0,
 * por lo que su fila queda con company = null y status = 'unknown'.
 */

import MathUtils from '../core/MathUtils';
import KPICalculator from './KPICalculator';

const METRIC_DEFS = [
  { metric: 'grossMargin', companyFrom: (k) => k.grossMargin, benchmarkKey: 'grossMargin' },
  { metric: 'netMargin', companyFrom: (k) => k.netMargin, benchmarkKey: 'netMargin' },
  { metric: 'currentRatio', companyFrom: (k) => k.currentRatio, benchmarkKey: 'currentRatio' },
  { metric: 'debtToEquity', companyFrom: (k) => k.debtToEquity, benchmarkKey: 'debtToEquity' },
  { metric: 'cashRunway', companyFrom: (k) => k.runwayMonths, benchmarkKey: 'cashRunway' },
  { metric: 'revenueGrowth', companyFrom: (k) => k.revenueGrowth, benchmarkKey: 'revenueGrowth' },
  { metric: 'operatingMargin', companyFrom: (k) => k.operatingMargin, benchmarkKey: 'operatingMargin' },
  { metric: 'customerAcquisitionCost', companyFrom: () => null, benchmarkKey: 'customerAcquisitionCost' },
  { metric: 'lifetimeValue', companyFrom: () => null, benchmarkKey: 'lifetimeValue' },
];

/** True cuando el 2º argumento tiene forma de snapshot KPI (no de benchmarks). */
function looksLikeKpis(value) {
  return value != null && (
    Object.prototype.hasOwnProperty.call(value, 'periodStart')
    || Object.prototype.hasOwnProperty.call(value, 'cashPosition')
  );
}

export const BenchmarkService = {
  /**
   * Compara la empresa contra un set de benchmarks de industria.
   * @param {Array<object>} series serie mensual (usa KPICalculator solo en
   *   el modo compat de 2 args: compare(series, benchmarks)).
   * @param {object} kpis snapshot de KPICalculator.fromMonthly
   * @param {object} benchmarks objeto metric → objetivo (puede ser null)
   * @returns {Array<{metric:string, company:number|null, benchmark:number|null,
   *   gap:number|null, status:string}>}
   */
  compare(series, kpis, benchmarks) {
    // V2 compatibility: compare(series, benchmarks)
    if (benchmarks == null && !looksLikeKpis(kpis)) {
      benchmarks = kpis;
      kpis = KPICalculator.fromMonthly(series);
    }
    const k = kpis || {};
    const bench = benchmarks || {};

    return METRIC_DEFS.map((def) => {
      const company = def.companyFrom(k);
      const benchmark = bench[def.benchmarkKey];
      const gap = company != null && benchmark != null ? company - benchmark : null;
      let status;
      if (company == null || benchmark == null) {
        status = 'unknown';
      } else if (gap > 0.005) {
        status = 'ahead';
      } else if (gap < -0.005) {
        status = 'behind';
      } else {
        status = 'even';
      }
      return { metric: def.metric, company, benchmark, gap, status };
    });
  },

  /**
   * Resumen agregado sobre las 9 dimensiones.
   * La omisión de dato penaliza: company null cuenta como 'missed' (nunca
   * 'unknown' dentro del score). pct = met / total.
   * @returns {{ total:number, met:number, missed:number, unknown:number, pct:number }}
   */
  score(series, kpis, benchmarks) {
    const rows = this.compare(series, kpis, benchmarks);
    const total = rows.length;
    const met = rows.filter((r) => r.status === 'ahead' || r.status === 'even').length;
    const missed = rows.filter((r) => r.company == null || r.status === 'behind').length;
    const unknown = rows.filter((r) => r.status === 'unknown' && r.company != null).length;
    return {
      total,
      met,
      missed,
      unknown,
      pct: total > 0 ? MathUtils.round(met / total, 3) : 0,
    };
  },
};

export default BenchmarkService;
