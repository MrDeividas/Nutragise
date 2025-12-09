/**
 * Stripe Fee Calculator
 * Calculates Stripe processing fees that will be passed to the customer
 * 
 * UK Stripe Fees (Standard):
 * - UK cards: 1.4% + £0.20
 * - International cards: 2.9% + £0.30
 * - European cards: 1.4% + £0.20 (if using SEPA)
 * 
 * Note: Fees are calculated to ensure the net amount after fees equals the desired amount
 */

interface FeeCalculation {
  originalAmount: number; // Amount user wants to pay (in pounds)
  stripeFee: number; // Stripe fee amount (in pounds)
  totalAmount: number; // Total amount user pays (original + fee)
  netAmount: number; // Amount received after Stripe fee (should equal originalAmount)
}

class StripeFeeCalculator {
  // UK Stripe fee rates
  private readonly UK_CARD_PERCENTAGE = 0.014; // 1.4%
  private readonly UK_CARD_FIXED = 0.20; // £0.20
  
  private readonly INTERNATIONAL_CARD_PERCENTAGE = 0.029; // 2.9%
  private readonly INTERNATIONAL_CARD_FIXED = 0.30; // £0.30

  /**
   * Calculate the total amount user needs to pay to cover Stripe fees
   * This ensures the net amount (after fees) equals the desired amount
   * 
   * Formula: totalAmount = (originalAmount + fixedFee) / (1 - percentageFee)
   * 
   * @param originalAmount - The amount you want to receive (in pounds)
   * @param isUKCard - Whether it's a UK card (default: true)
   * @returns Fee calculation breakdown
   */
  calculateFee(originalAmount: number, isUKCard: boolean = true): FeeCalculation {
    if (originalAmount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const percentage = isUKCard ? this.UK_CARD_PERCENTAGE : this.INTERNATIONAL_CARD_PERCENTAGE;
    const fixedFee = isUKCard ? this.UK_CARD_FIXED : this.INTERNATIONAL_CARD_FIXED;

    // Calculate total amount needed to cover fees
    // totalAmount = (originalAmount + fixedFee) / (1 - percentage)
    const totalAmount = (originalAmount + fixedFee) / (1 - percentage);

    // Calculate actual Stripe fee
    const stripeFee = totalAmount - originalAmount;

    // Verify net amount (should equal originalAmount)
    const netAmount = totalAmount - stripeFee;

    return {
      originalAmount: Math.round(originalAmount * 100) / 100, // Round to 2 decimals
      stripeFee: Math.round(stripeFee * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
    };
  }

  /**
   * Calculate fee for a given total amount (reverse calculation)
   * Useful when you know the total amount and want to know the fee
   */
  calculateFeeFromTotal(totalAmount: number, isUKCard: boolean = true): {
    stripeFee: number;
    netAmount: number;
  } {
    const percentage = isUKCard ? this.UK_CARD_PERCENTAGE : this.INTERNATIONAL_CARD_PERCENTAGE;
    const fixedFee = isUKCard ? this.UK_CARD_FIXED : this.INTERNATIONAL_CARD_FIXED;

    // Stripe fee = (totalAmount * percentage) + fixedFee
    const stripeFee = (totalAmount * percentage) + fixedFee;
    const netAmount = totalAmount - stripeFee;

    return {
      stripeFee: Math.round(stripeFee * 100) / 100,
      netAmount: Math.round(netAmount * 100) / 100,
    };
  }

  /**
   * Format fee for display
   */
  formatFee(fee: FeeCalculation): string {
    return `£${fee.originalAmount.toFixed(2)} + £${fee.stripeFee.toFixed(2)} fee = £${fee.totalAmount.toFixed(2)}`;
  }

  /**
   * Get fee breakdown for UI display
   */
  getFeeBreakdown(originalAmount: number, isUKCard: boolean = true): {
    baseAmount: string;
    feeAmount: string;
    totalAmount: string;
    feePercentage: string;
  } {
    const calculation = this.calculateFee(originalAmount, isUKCard);
    const percentage = isUKCard ? this.UK_CARD_PERCENTAGE : this.INTERNATIONAL_CARD_PERCENTAGE;

    return {
      baseAmount: `£${calculation.originalAmount.toFixed(2)}`,
      feeAmount: `£${calculation.stripeFee.toFixed(2)}`,
      totalAmount: `£${calculation.totalAmount.toFixed(2)}`,
      feePercentage: `${(percentage * 100).toFixed(2)}% + £${isUKCard ? this.UK_CARD_FIXED : this.INTERNATIONAL_CARD_FIXED}`,
    };
  }
}

export const stripeFeeCalculator = new StripeFeeCalculator();

