// Unit tests for Order Intent Rules Engine
import { describe, it, expect } from 'vitest';
import {
  determineOrderType,
  shouldShowPrompt,
  applyConversion,
  getTryConstraints,
  OrderState,
} from '@/lib/orderIntentRules';

describe('Order Intent Auto-Conversion Rules', () => {
  it('TASK + third party recipient suggests COORDINATE', () => {
    const state: OrderState = {
      intent: 'TASK',
      hasPurchase: false,
      recipientType: 'THIRD_PARTY',
      stagesCount: 2,
      hasHandover: false,
    };
    const p = shouldShowPrompt(state);
    expect(p.show).toBe(true);
    expect(p.suggestedIntent).toBe('COORDINATE');
    expect(p.reason).toBe('third_party');
  });

  it('TASK + hasPurchase suggests BUY', () => {
    const state: OrderState = {
      intent: 'TASK',
      hasPurchase: true,
      recipientType: 'SELF',
      stagesCount: 2,
      hasHandover: false,
    };
    const p = shouldShowPrompt(state);
    expect(p.show).toBe(true);
    expect(p.suggestedIntent).toBe('BUY');
    expect(p.reason).toBe('has_purchase');
  });

  it('BUY + third party auto converts to COORDINATE', () => {
    const state: OrderState = {
      intent: 'BUY',
      hasPurchase: true,
      recipientType: 'THIRD_PARTY',
      stagesCount: 2,
      hasHandover: false,
    };
    const p = shouldShowPrompt(state);
    expect(p.show).toBe(true);
    expect(p.suggestedIntent).toBe('COORDINATE');
    expect(p.autoConvert).toBe(true);
  });

  it('COORDINATE always yields CHAIN', () => {
    const orderType = determineOrderType('COORDINATE', false, 'THIRD_PARTY', 2);
    expect(orderType).toBe('CHAIN');
  });

  it('COORDINATE with any recipient type yields CHAIN', () => {
    const orderType = determineOrderType('COORDINATE', true, 'SELF', 1);
    expect(orderType).toBe('CHAIN');
  });

  it('BUY for self yields PURCHASE_DELIVER', () => {
    const orderType = determineOrderType('BUY', true, 'SELF', 2);
    expect(orderType).toBe('PURCHASE_DELIVER');
  });

  it('BUY for third party yields CHAIN', () => {
    const orderType = determineOrderType('BUY', true, 'THIRD_PARTY', 2);
    expect(orderType).toBe('CHAIN');
  });

  it('TASK without purchase for self yields DIRECT', () => {
    const orderType = determineOrderType('TASK', false, 'SELF', 2);
    expect(orderType).toBe('DIRECT');
  });

  it('TASK with purchase yields PURCHASE_DELIVER', () => {
    const orderType = determineOrderType('TASK', true, 'SELF', 2);
    expect(orderType).toBe('PURCHASE_DELIVER');
  });

  it('TRY applies constraints', () => {
    const state: OrderState = {
      intent: 'TRY',
      hasPurchase: true,
      recipientType: 'SELF',
      stagesCount: 3,
      hasHandover: false,
      recurring: true,
    };
    const converted = applyConversion(state, 'TRY');
    expect(converted.stagesCount).toBe(2); // Max 2 stages
    expect(converted.recurring).toBe(false);
    expect(converted.experimentFlag).toBe(true);
  });

  it('getTryConstraints returns correct values', () => {
    const constraints = getTryConstraints();
    expect(constraints.stagesMax).toBe(2);
    expect(constraints.recurring).toBe(false);
    expect(constraints.requirePriceCap).toBe(true);
    expect(constraints.experimentFlag).toBe(true);
  });

  it('Complex chain suggests COORDINATE', () => {
    const state: OrderState = {
      intent: 'TASK',
      hasPurchase: false,
      recipientType: 'SELF',
      stagesCount: 3,
      hasHandover: false,
    };
    const p = shouldShowPrompt(state);
    expect(p.show).toBe(true);
    expect(p.suggestedIntent).toBe('COORDINATE');
    expect(p.reason).toBe('complex_chain');
  });

  it('Handover triggers COORDINATE suggestion', () => {
    const state: OrderState = {
      intent: 'BUY',
      hasPurchase: true,
      recipientType: 'SELF',
      stagesCount: 2,
      hasHandover: true,
    };
    const p = shouldShowPrompt(state);
    expect(p.show).toBe(true);
    expect(p.suggestedIntent).toBe('COORDINATE');
    expect(p.reason).toBe('complex_chain');
  });

  it('Simple TASK for self does not show prompt', () => {
    const state: OrderState = {
      intent: 'TASK',
      hasPurchase: false,
      recipientType: 'SELF',
      stagesCount: 2,
      hasHandover: false,
    };
    const p = shouldShowPrompt(state);
    expect(p.show).toBe(false);
  });

  it('Simple BUY for self does not show prompt', () => {
    const state: OrderState = {
      intent: 'BUY',
      hasPurchase: true,
      recipientType: 'SELF',
      stagesCount: 2,
      hasHandover: false,
    };
    const p = shouldShowPrompt(state);
    expect(p.show).toBe(false);
  });
});
