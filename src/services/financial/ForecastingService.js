/**
 * ForecastingService — baseline estadístico (NUNCA AI).
 *
 * Modelo: linear-trend + monthly seasonality (centrada) como baseline
 * determinístico. El método declarado coincide con el comportamiento real:
 *
 *   value_i = (slope * i + intercept) * seasonalFactor[MM(i)]
 *
 * donde i = n, n+1, ..., n+horizon-1 recorre la misma recta del ajuste de
 * mínimos cuadrados (x = 0..n-1) y seasonalFactor se estima del histórico:
 *
 *   factor(mes, i) = actual_i / (slope * i + intercept)
 *   seasonalFactor[MM] = media de factor por mes calendario (MM, month.slice(5))
 *                        normalizada para que la media de los factores ≈ 1.
 *   Meses con < 2 observaciones (o inexistentes) → factor = 1.0 (neutral).
 *
 * Limitación documentada: con series cortas — p.ej. MONTHLY_FINANCIALS
 * (12 meses, un punto por mes de 2025) — cada mes tiene UNA sola observación,
 * por lo que la estacionalidad queda degenerada: todos los factores = 1.0 y
 * value vuelve a ser tendencia pura. No se inventa estacionalidad donde no
 * hay datos; para estimarla con mínimo rigor se necesitan ≥ 2 ciclos/mes.
 *
 * Intervalo de predicción (§7.5 del spec finflow-v3-architecture):
 *   n       = data.length
 *   meanX   = (n - 1) / 2
 *   Sxx     = n * (n^2 - 1) / 12
 *   dof     = n - 2
 *   tCrit   = t_{0.975, dof}   (MathUtils.studentTQuantile — NO z = 1.96)
 *   band_i  = sigma * tCrit * sqrt(1 + 1/n + (i - meanX)^2 / Sxx)
 *             donde i = n, n+1, ..., n+horizon-1 es el índice del punto
 *             forecast sobre la misma recta del ajuste lineal.
 *   lower_i = value_i - band_i ; upper_i = value_i + band_i
 *             (banda alrededor del valor estacionalizado; garantiza
 *              lower <= value <= upper para todos los points).
 *
 * Comparado con la V2 (z=1.96 y Sxx erróneo), V3 usa t de Student y el Sxx
 * correcto Sxx = n(n^2-1)/12. El ratio real de bandas V3/V2 con
 * MONTHLY_FINANCIALS oscila entre ≈1.2× (primer punto del horizonte, donde
 * t_{0.975} > 1.96 domina) y ≈0.8× (último punto, donde el Sxx correcto
 * reduce la distancia a meanX). El 3× del test original era inalcanzable.
 */

import MathUtils from '../core/MathUtils';

const MIN_POINTS = 5;

const EMPTY_FORECAST = {
  points: [],
  method: 'insufficient-data',
  reason: 'Need at least 5 monthly observations for reliable forecasting',
  expectedGrowth: 0,
  sigma: 0,
  slope: 0,
};

const EMPTY_BACKTEST = {
  mae: 0,
  rmse: 0,
  mape: 0,
  wape: 0,
  bias: 0,
  coverage: 0,
};

export const ForecastingService = {
  /**
   * Proyecta el `metric` de una serie mensual con banda de predicción t-Student.
   * value = trend * seasonalFactor (estacionalidad mensual centrada, media ≈ 1);
   * con < 2 observaciones por mes la estacionalidad es débil (factor = 1.0).
   *
   * @param {Array<{ month: string, [metric]: number }>} series
   * @param {{ horizon?: number, confidence?: number, metric?: string }} options
   *        `confidence` (0.95) se conserva por compatibilidad de API; el
   *        intervalo se calcula con t_{0.975, dof} (studentTQuantile).
   * @returns {{
   *   points: Array<{ month: string, value: number, lower: number, upper: number }>,
   *   method: string,
   *   expectedGrowth: number,
   *   sigma: number,
   *   slope: number,
   * }}
   */
  forecast(series, options = {}) {
    const horizon = Math.max(1, options.horizon || 6);
    const metric = options.metric || 'revenue';

    const data = (series || []).filter((d) => d && Number.isFinite(d[metric]));
    const n = data.length;
    if (n < MIN_POINTS) {
      return { ...EMPTY_FORECAST };
    }

    // Ajuste lineal: x = 0..n-1 sobre el valor del metric.
    const values = data.map((d) => d[metric]);
    const { slope, intercept } = MathUtils.linearTrend(values);

    // sigma = desviación muestral de los residuos (n-1); 0 si n < 2.
    const residuals = values.map((v, i) => v - (intercept + slope * i));
    const sigma = MathUtils.stddev(residuals, true) || 0;

    // Estacionalidad mensual centrada (media ≈ 1): factor = actual / trend.
    // Meses con < 2 observaciones quedan en factor = 1.0 (neutral): no se
    // inventa estacionalidad donde no hay datos suficientes.
    const seasonal = {};
    data.forEach((d, i) => {
      const mm = d.month.slice(5);
      const trend = intercept + slope * i;
      if (!seasonal[mm]) seasonal[mm] = { sum: 0, count: 0 };
      if (trend) {
        seasonal[mm].sum += d[metric] / trend;
        seasonal[mm].count += 1;
      }
    });

    const observed = Object.values(seasonal).filter((s) => s.count >= 2);
    const meanSeason = observed.length
      ? MathUtils.mean(observed.map((s) => s.sum / s.count))
      : 1;
    Object.keys(seasonal).forEach((mm) => {
      const s = seasonal[mm];
      seasonal[mm] = s.count >= 2 && meanSeason ? (s.sum / s.count) / meanSeason : 1;
    });

    // Intervalo §7.5: Sxx, distancia a meanX, t de Student (nunca z=1.96).
    const meanX = (n - 1) / 2;
    const Sxx = (n * (n * n - 1)) / 12;
    const dof = n - 2;
    const tCrit = MathUtils.studentTQuantile(dof);

    const last = data[data.length - 1];
    const lastYear = Number(last.month.slice(0, 4));
    const lastMonth = Number(last.month.slice(5, 7));

    const points = [];
    for (let h = 1; h <= horizon; h++) {
      const i = n - 1 + h; // i = n, n+1, ..., n+horizon-1
      const trend = intercept + slope * i;
      const band = sigma * tCrit * Math.sqrt(1 + 1 / n + ((i - meanX) ** 2) / Sxx);

      const offset = lastMonth - 1 + h;
      const mm = ((offset % 12) + 12) % 12 + 1;
      const yy = lastYear + Math.floor(offset / 12);
      const month = `${yy}-${String(mm).padStart(2, '0')}`;

      const season = seasonal[String(mm).padStart(2, '0')] || 1;
      const value = trend * season; // tendencia × estacionalidad mensual centrada

      points.push({
        month,
        value: MathUtils.round(value),
        lower: MathUtils.round(value - band),
        upper: MathUtils.round(value + band),
      });
    }

    // expectedGrowth: pctChange sobre el ULTIMO valor del metric (no revenue fijo).
    const growth = MathUtils.pctChange(last[metric], points[0]?.value);
    const expectedGrowth = growth == null ? 0 : growth;

    return {
      points,
      method: 'linear-trend + monthly seasonality',
      expectedGrowth: MathUtils.round(expectedGrowth, 4),
      sigma: MathUtils.round(sigma),
      slope: MathUtils.round(slope),
    };
  },

  /**
   * Backtest del pronóstico (§7.6): trunca la serie dejando fuera los últimos
   * `horizon` meses, pronostica ese tramo y compara con los valores reales.
   *
   * @param {Array<{ month: string, [metric]: number }>} series
   * @param {{ horizon?: number, metric?: string }} options
   * @returns {{
   *   mae: number, rmse: number, mape: number, wape: number,
   *   bias: number, coverage: number,
   * }}
   */
  backtest(series, options = {}) {
    const horizon = Math.max(1, options.horizon || 3);
    const metric = options.metric || 'revenue';

    const data = (series || []).filter((d) => d && Number.isFinite(d[metric]));
    if (data.length < MIN_POINTS + horizon) {
      return { ...EMPTY_BACKTEST };
    }

    const truncated = data.slice(0, -horizon);
    const fc = this.forecast(truncated, { horizon, metric });
    const points = fc.points || [];

    // Sin banda (insufficient-data) => coverage 0 y métricas vacías.
    if (points.length === 0) {
      return { ...EMPTY_BACKTEST };
    }

    const actuals = data.slice(-horizon).map((d) => d[metric]).slice(0, points.length);

    const errors = [];
    const absErrors = [];
    const squaredErrors = [];
    const mapeTerms = [];
    const absActuals = [];
    let covered = 0;

    for (let i = 0; i < points.length; i++) {
      const pred = points[i].value;
      const actual = actuals[i];
      const err = pred - actual;
      errors.push(err);
      absErrors.push(Math.abs(err));
      squaredErrors.push(err * err);
      absActuals.push(Math.abs(actual));
      // actual == 0 contribuye 0 al MAPE (evita división por cero).
      mapeTerms.push(actual === 0 ? 0 : Math.abs(err) / Math.abs(actual));
      // Coverage: actual dentro de [pred - band, pred + band] via lower/upper.
      if (actual >= points[i].lower && actual <= points[i].upper) covered += 1;
    }

    const denomWape = MathUtils.sum(absActuals);
    const coverage = covered / points.length * 100;

    return {
      mae: MathUtils.round(MathUtils.mean(absErrors), 4),
      rmse: MathUtils.round(Math.sqrt(MathUtils.mean(squaredErrors)), 4),
      mape: MathUtils.round(MathUtils.mean(mapeTerms) * 100, 4),
      wape: MathUtils.round(denomWape ? MathUtils.sum(absErrors) / denomWape * 100 : 0, 4),
      bias: MathUtils.round(MathUtils.mean(errors), 4),
      coverage: MathUtils.round(coverage, 1),
    };
  },
};

export default ForecastingService;
