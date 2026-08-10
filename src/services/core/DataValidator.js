/**
 * DataValidator — runtime validation for financial records.
 * Returns a normalized record plus an array of validation issues,
 * so callers can decide whether to reject or just warn.
 */

const ISSUES = {
  MISSING_FIELD: 'missing_field',
  INVALID_TYPE: 'invalid_type',
  OUT_OF_RANGE: 'out_of_range',
  NEGATIVE_VALUE: 'negative_value',
};

function addIssue(issues, field, type, message) {
  issues.push({ field, type, message });
}

export const DataValidator = {
  /**
   * Validate a single monthly financial record.
   * @param {object} rec - { month, revenue, expenses, cash, budget? }
   * @returns {{ record: object, issues: array }}
   */
  validateRecord(rec) {
    const issues = [];
    if (!rec || typeof rec !== 'object') {
      return { record: null, issues: [{ field: '*', type: ISSUES.INVALID_TYPE, message: 'Record is not an object' }] };
    }

    if (!rec.month || typeof rec.month !== 'string') {
      addIssue(issues, 'month', ISSUES.MISSING_FIELD, 'month is required (YYYY-MM string)');
    }

    for (const key of ['revenue', 'expenses', 'cash']) {
      const v = rec[key];
      if (v == null) {
        addIssue(issues, key, ISSUES.MISSING_FIELD, `${key} is required`);
      } else if (typeof v !== 'number' || Number.isNaN(v)) {
        addIssue(issues, key, ISSUES.INVALID_TYPE, `${key} must be a number`);
      } else if (v < 0) {
        addIssue(issues, key, ISSUES.NEGATIVE_VALUE, `${key} should not be negative`);
      }
    }

    if (rec.budget != null && (typeof rec.budget !== 'number' || Number.isNaN(rec.budget))) {
      addIssue(issues, 'budget', ISSUES.INVALID_TYPE, 'budget must be a number when provided');
    }

    return { record: rec, issues };
  },

  /**
   * Validate a series of monthly records. Returns only valid records plus
   * a flag indicating whether any were dropped.
   */
  validateSeries(records) {
    const valid = [];
    const allIssues = [];
    for (const rec of Array.isArray(records) ? records : []) {
      const { record, issues } = this.validateRecord(rec);
      if (issues.length === 0 && record) {
        valid.push(record);
      } else {
        allIssues.push(...issues.map((i) => ({ ...i, month: rec?.month })));
      }
    }
    return { valid, dropped: (records?.length || 0) - valid.length, issues: allIssues };
  },

  /** Is the series chronologically consecutive by month? */
  isContinuous(records) {
    if (!Array.isArray(records) || records.length < 2) return true;
    for (let i = 1; i < records.length; i++) {
      const prev = new Date(records[i - 1].month + '-01');
      const curr = new Date(records[i].month + '-01');
      const diff = (curr.getFullYear() - prev.getFullYear()) * 12 + (curr.getMonth() - prev.getMonth());
      if (diff !== 1) return false;
    }
    return true;
  },
};

export default DataValidator;