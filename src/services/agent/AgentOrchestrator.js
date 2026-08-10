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
  FLAG_VENDOR: 'flag_vendor_review',
  ADJUST_FORECAST: 'adjust_forecast_assumptions',
  TRIGGER_CASH_SWEEP: 'trigger_cash_sweep',
  ESCALATE_COVENANT: 'escalate_covenant_breach',
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

    const kpis = KPICalculator.fromMonthly(series);
    const anomalies = AnomalyService.detect(series);
    const covenantStatus = CovenantService.evaluate(series[series.length - 1], covenants);
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
    if (revenueAnomalies.length > 0) {
      actions.push(this._action(
        CAPABILITIES.FLAG_VENDOR,
        `${revenueAnomalies.length} revenue anomaly(ies) detected — investigate pipeline or vendor.`,
        { anomalies: revenueAnomalies },
        0.7,
      ));
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

    const allowed = capabilities.length === 0 ? actions.map((a) => a.capability) : capabilities;
    const filtered = actions.filter((a) => allowed.includes(a.capability));
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
      status: 'proposed',
      createdAt: new Date().toISOString(),
    };
  },
};

export default AgentOrchestrator;