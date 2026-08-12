/**
 * Wallet fees by subscription tier.
 * Deposit: user only covers Stripe processing fees (no platform deposit fee).
 * Withdraw: Free £3 · Members (Pro) £1
 */

import { stripeFeeCalculator } from './stripeFeeCalculator';

export const FREE_WITHDRAWAL_FEE = 3;
export const PRO_WITHDRAWAL_FEE = 1;

/** @deprecated No platform deposit fee — deposits only pass through Stripe fees. */
export const FREE_DEPOSIT_FEE = 0;
/** @deprecated No platform deposit fee — deposits only pass through Stripe fees. */
export const PRO_DEPOSIT_FEE = 0;

export function getDepositFee(_isPro?: boolean): number {
  return 0;
}

export function getWithdrawalFee(isPro: boolean): number {
  return isPro ? PRO_WITHDRAWAL_FEE : FREE_WITHDRAWAL_FEE;
}

/** Credit amount + estimated Stripe UK card fee the user pays on deposit. */
export function getDepositChargeTotal(amount: number, _isPro?: boolean): {
  amount: number;
  fee: number;
  total: number;
} {
  const calc = stripeFeeCalculator.calculateFee(amount, true);
  return {
    amount: calc.originalAmount,
    fee: calc.stripeFee,
    total: calc.totalAmount,
  };
}

export function getWithdrawalPayout(amount: number, isPro: boolean): {
  amount: number;
  fee: number;
  payout: number;
} {
  const fee = getWithdrawalFee(isPro);
  return {
    amount,
    fee,
    payout: Math.round((amount - fee) * 100) / 100,
  };
}

export function formatFeeNote(fee: number, kind: 'deposit' | 'withdraw', isPro?: boolean): string {
  if (kind === 'deposit') {
    if (fee <= 0) return 'No card processing fee';
    return `£${fee.toFixed(2)} card processing fee`;
  }
  if (fee <= 0) return 'No withdrawal fee';
  return isPro
    ? `£${fee.toFixed(2)} withdrawal fee (Member)`
    : `£${fee.toFixed(2)} withdrawal fee (Free)`;
}
