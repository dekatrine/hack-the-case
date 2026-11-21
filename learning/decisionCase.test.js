import { describe, expect, it } from 'vitest';
import { DECISION_CASE, assessReason, evaluateInitiatives } from './decisionCase.js';

describe('decision case engine',()=>{
  it('preserves baseline when no initiatives chosen',()=>{
    const outcome=evaluateInitiatives(DECISION_CASE,[]);
    expect(outcome.orders).toBe(2500);
    expect(outcome.revenue).toBe(3000000);
    expect(outcome.baselineGrossProfit).toBe(750000);
    expect(outcome.incrementalContribution).toBe(0);
  });
  it('accounts for checkout and CRM costs and returns budget remainder',()=>{
    const result=evaluateInitiatives(DECISION_CASE,['checkout','crm']);
    expect(result.spent).toBe(140000);
    expect(result.remaining).toBe(40000);
    expect(result.conversionPct).toBeCloseTo(6.3);
    expect(result.revenue).toBeCloseTo(3780000);
    expect(result.incrementalContribution).toBeCloseTo(55000);
  });
  it('models discounts reducing gross margin even if orders grow',()=>{
    const result=evaluateInitiatives(DECISION_CASE,['discount']);
    expect(result.grossMarginPct).toBe(19);
    expect(result.orders).toBe(3100);
    expect(result.incrementalContribution).toBeCloseTo(-123200);
  });
  it('rejects an over-budget portfolio and deduplicates initiatives',()=>{
    expect(()=>evaluateInitiatives(DECISION_CASE,['checkout','acquisition'])).toThrow(/бюджет/);
    expect(evaluateInitiatives(DECISION_CASE,['checkout','checkout']).spent).toBe(100000);
  });
  it('recommends contribution rather than vanity metric',()=>{
    expect(assessReason('contribution').correct).toBe(true);
    expect(assessReason('orders').correct).toBe(false);
  });
});
