/**
 * Platform wallet fees by subscription tier.
 * Free: £3 deposit + £3 withdraw per transaction
 * Pro: £0 deposit + £1 withdraw
 */

export const FREE_DEPOSIT_FEE = 3;
export const FREE_WITHDRAWAL_FEE = 3;
export const PRO_DEPOSIT_FEE = 0;
export const PRO_WITHDRAWAL_FEE = 1;

export function getDepositFee(isPro: boolean): number {
  return isPro ? PRO_DEPOSIT_FEE : FREE_DEPOSIT_FEE;
}

export function getWithdrawalFee(isPro: boolean): number {
  return isPro ? PRO_WITHDRAWAL_FEE : FREE_WITHDRAWAL_FEE;
}

export function getDepositChargeTotal(amount: number, isPro: boolean): {
  amount: number;
  fee: number;
  total: number;
} {
  const fee = getDepositFee(isPro);
  return {
    amount,
    fee,
    total: Math.round((amount + fee) * 100) / 100,
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

export function formatFeeNote(fee: number, kind: 'deposit' | 'withdraw'): string {
  if (fee <= 0) {
    return kind === 'deposit' ? 'No deposit fee (Pro)' : '£1 withdrawal fee (Pro)';
  }
  return `£${fee.toFixed(2)} ${kind === 'deposit' ? 'deposit' : 'withdrawal'} fee`;
}
