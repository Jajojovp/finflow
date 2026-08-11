/**
 * AgentOrchestrator — proposes corrective actions for an autonomous agent.
 *
 * Design: pure functions over a "context" object so the orchestrator is
 * testable and side-effect free. The UI layer (useAgentManager) is
 * responsible for permissions, human-in-the-loop approval and dispatch.
 *
 * Capabilities are enumerable and gated: the orchestrator never executes
 * anything — it returns suggested actions with rationale + confidence.
 */

import EventBus from '../core/EventBus';
import KPICalculator from '../financial/KPICalculator';
import AnomalyService from '../financial/AnomalyService';
import CovenantService from '../financial/CovenantService';
import ForecastingService from '../financial/ForecastingService';

export const CAPABILITIES = {
  REALLOCATE_BUDGET: 'reallocate_budget',
  ADJUST_FORECAST: 'adjust_forecast_assumptions',
  TRIGGER_CASH_SWEEP: 'trigger_cash_sweep',
  ESCALATE_COVENANT: 'escalate_covenant_breach',
  INVESTIGATE_REVENUE_DECLINE: 'investigate_revenue_decline',
};

export const AgentOrchestrator = {
  /**
   * Build a suggested action plan from a financial context.
   * @param {{ series: Array, covenants?: Array, capabilities?: string[] }} ctx
   * @returns {{ actions: Array, summary: object }}
   */
  propose(ctx) {
    const { series, covenants = [], capabilities = [] } = ctx || {};
    if (!Array.isArray(series) || series.length === 0) {
      return { actions: [], summary: { reason: 'no_data' } };
    }

    // FAIL-CLOSED (spec §8 D2): sin capabilities explícitas, no se propone nada.
    if (!Array.isArray(capabilities) || capabilities.length === 0) {
      return { actions: [], summary: { reason: 'no_capabilities' } };
    }

    const kpis = KPICalculator.fromMonthly(series);
    const anomalies = AnomalyService.detect(series);
    const covenantStatus = CovenantService.evaluate(series[series.length - 1], covenants, kpis);
    const forecast = ForecastingService.forecast(series, { horizon: 3 });

    const actions = [];

    if (kpis.runwayMonths != null && kpis.runwayMonths < 6) {
      actions.push(this._action(
        CAPABILITIES.TRIGGER_CASH_SWEEP,
        `Cash runway is ${kpis.runwayMonths} months — below the 6-month safety threshold.`,
        { runway: kpis.runwayMonths, cash: kpis.cashPosition },
        0.85,
      ));
    }

    if (kpis.netMargin < 0) {
      actions.push(this._action(
        CAPABILITIES.ADJUST_FORECAST,
        `Net margin turned negative (${(kpis.netMargin * 100).toFixed(1)}%) — review forecast assumptions.`,
        { netMargin: kpis.netMargin },
        0.8,
      ));
    }

    const revenueAnomalies = anomalies.filter((a) => a.metric === 'revenue' && a.score < 0);
    const revenueGrowth = kpis?.revenueGrowth;
    if (revenueAnomalies.length > 0 || (revenueGrowth != null && revenueGrowth < -0.1)) {
      const growthValue = revenueGrowth ?? (revenueAnomalies[0]?.score ?? null);
      actions.push(this._action(
        CAPABILITIES.INVESTIGATE_REVENUE_DECLINE,
        `Revenue decline detected (growth ${growthValue != null ? (growthValue * 100).toFixed(1) : 'n/a'}%) — investigate root cause.`,
        { revenueGrowth: growthValue, anomalies: revenueAnomalies },
        Math.min(0.9, Math.abs(growthValue || 0) * 10),
      ));
      // Evidencia + hipótesis neutrales (spec §8 D3): nunca seleccionar causalidad no soportada.
      const lastAction = actions[actions.length - 1];
      lastAction.evidence = [
        { source: 'KPICalculator', ref: 'revenueGrowth', value: growthValue, asOf: series[series.length - 1]?.month || null },
      ];
      lastAction.hypotheses = ['pipeline', 'churn', 'pricing', 'vendor', 'product_mix', 'macro'].slice(0, 3);
    }

    if (covenantStatus.breaches.length > 0) {
      actions.push(this._action(
        CAPABILITIES.ESCALATE_COVENANT,
        `${covenantStatus.breaches.length} covenant breach(es) — notify lender and remediation lead.`,
        { breaches: covenantStatus.breaches },
        0.9,
      ));
    }

    if (forecast.expectedGrowth < 0) {
      actions.push(this._action(
        CAPABILITIES.REALLOCATE_BUDGET,
        `Forecast projects ${(forecast.expectedGrowth * 100).toFixed(1)}% revenue decline — reallocate budget.`,
        { expectedGrowth: forecast.expectedGrowth },
        0.6,
      ));
    }

    const filtered = actions.filter((a) => capabilities.includes(a.capability));
    EventBus.emit('agent.proposed', { count: filtered.length });

    return {
      actions: filtered,
      summary: {
        kpis,
        anomalies: anomalies.length,
        covenantsBreached: covenantStatus.breaches.length,
        forecastGrowth: forecast.expectedGrowth,
        total: filtered.length,
      },
    };
  },

  _action(capability, rationale, data, confidence) {
    return {
      id: `${capability}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      capability,
      rationale,
      data,
      confidence,
      evidence: [],
      status: 'proposed',
      createdAt: new Date().toISOString(),
    };
  },
};

export default AgentOrchestrator;