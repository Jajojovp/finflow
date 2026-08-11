import { describe, it, expect } from 'vitest';
import MathUtils from './MathUtils';

describe('MathUtils.pctChange', () => {
  it('returns null when prev is 0 (degenerate)', () => {
    expect(MathUtils.pctChange(0, 10)).toBeNull();
  });

  it('computes relative increase 10 -> 12 as 0.2', () => {
    expect(MathUtils.pctChange(10, 12)).toBe(0.2);
  });

  it('returns null when prev is NaN', () => {
    expect(MathUtils.pctChange(NaN, 10)).toBeNull();
  });

  it('computes relative decrease 10 -> 8 as -0.2', () => {
    expect(MathUtils.pctChange(10, 8)).toBe(-0.2);
  });
});

describe('MathUtils.safeDivide', () => {
  it('returns fallback (null) when denominator is 0', () => {
    expect(MathUtils.safeDivide(5, 0)).toBeNull();
  });

  it('divides normally when denominator is non-zero', () => {
    expect(MathUtils.safeDivide(5, 2)).toBe(2.5);
  });

  it('returns the provided fallback when denominator is 0', () => {
    expect(MathUtils.safeDivide(5, 0, 99)).toBe(99);
  });
});

describe('MathUtils.studentTQuantile', () => {
  it('returns 2.179 for dof=12 (±0.005)', () => {
    expect(MathUtils.studentTQuantile(12)).toBeCloseTo(2.179, 3);
  });

  it('returns 2.021 for dof=40 (±0.005)', () => {
    expect(MathUtils.studentTQuantile(40)).toBeCloseTo(2.021, 3);
  });

  it('returns 1.96 for dof > 40', () => {
    expect(MathUtils.studentTQuantile(100)).toBe(1.96);
  });
});

describe('MathUtils.sum / mean', () => {
  it('sums [1,2,3] to 6', () => {
    expect(MathUtils.sum([1, 2, 3])).toBe(6);
  });

  it('averages [1,2,3] to 2', () => {
    expect(MathUtils.mean([1, 2, 3])).toBe(2);
  });
});
