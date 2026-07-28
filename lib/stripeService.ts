/**
 * Stripe Service
 * Handles all Stripe payment operations including:
 * - Creating payment intents for wallet deposits
 * - Confirming payments
 * - Processing refunds
 * - Handling payouts (if using Stripe Connect)
 */

import { config } from './config';
import { env } from './env';
import { supabase } from './supabase';

// NOTE: For React Native, Stripe operations need to be handled through:
// 1. Client-side: @stripe/stripe-react-native for payment UI
// 2. Server-side: Your backend API that uses Stripe Node SDK
// This service will make API calls to your backend

interface PaymentIntentMetadata {
  userId: string;
  purpose: 'wallet_deposit' | 'challenge_investment';
  challengeId?: string;
}

interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  originalAmount?: number; // Amount before fee
  stripeFee?: number; // Fee amount
  totalAmount?: number; // Total amount including fee
}

class StripeService {
  private publishableKey: string;
  
  constructor() {
    this.publishableKey = config.stripe.publishableKey;
    
    if (!this.publishableKey) {
      console.warn('⚠️ Stripe publishable key not configured');
    }
  }

  /**
   * Get Supabase URL and anon key (from env or supabase client)
   */
  private getSupabaseConfig(): { url: string; anonKey: string } {
    let supabaseUrl = env.supabaseUrl;
    if (!supabaseUrl) {
      const restUrl = supabase.rest.url;
      if (restUrl) {
        supabaseUrl = restUrl.replace('/rest/v1', '');
      }
    }
    
    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured. Please set SUPABASE_URL in your .env file.');
    }

    let anonKey = env.supabaseAnonKey;
    if (!anonKey) {
      anonKey = (supabase as any).supabaseKey || '';
    }
    
    if (!anonKey) {
      throw new Error('Supabase anon key not configured. Please set SUPABASE_ANON_KEY in your .env file.');
    }

    return { url: supabaseUrl, anonKey };
  }

  /**
   * Create a payment intent for wallet deposit
   * Calls Supabase Edge Function to create Stripe payment intent
   * Users pay the Stripe transaction fee (1.4% + £0.20)
   */
  async createPaymentIntent(
    amount: number, // Amount in pounds (£)
    userId: string,
    metadata: PaymentIntentMetadata
  ): Promise<CreatePaymentIntentResponse> {
    try {
      console.log('Creating payment intent:', { amount, userId });

      // Get user's JWT token for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('User not authenticated. Please log in again.');
      }

      const { url: supabaseUrl } = this.getSupabaseConfig();

      // Call Supabase Edge Function with user's JWT token
      const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`, // Use user's JWT token, not anon key
        },
        body: JSON.stringify({
          amount,
          // userId removed - edge function will get it from JWT token
          currency: 'gbp',
          includeStripeFee: true, // User pays Stripe fee
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const data = await response.json();
      return {
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
        originalAmount: data.originalAmount,
        stripeFee: data.stripeFee,
        totalAmount: data.totalAmount,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error instanceof Error ? error : new Error('Failed to create payment intent');
    }
  }

  /**
   * Confirm a payment
   * This is typically handled by @stripe/stripe-react-native
   */
  async confirmPayment(paymentIntentId: string): Promise<boolean> {
    try {
      console.log('Confirming payment:', paymentIntentId);

      // This would be handled by Stripe React Native SDK
      // The SDK handles the payment confirmation with the client secret
      // and communicates directly with Stripe

      // Your backend webhook will receive the payment_intent.succeeded event
      // That's where you should update the wallet balance

      return true;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw new Error('Failed to confirm payment');
    }
  }

  /**
   * Create a payment intent for challenge entry fee (with escrow)
   * Funds are held by Stripe until challenge completes
   */
  async createChallengePaymentIntent(
    amount: number, // Amount in pounds (£)
    userId: string,
    challengeId: string
  ): Promise<CreatePaymentIntentResponse> {
    try {
      console.log('Creating challenge payment intent:', { amount, userId, challengeId });

      // Get user's JWT token for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('User not authenticated. Please log in again.');
      }

      const { url: supabaseUrl } = this.getSupabaseConfig();

      // Call Supabase Edge Function with user's JWT token
      const response = await fetch(`${supabaseUrl}/functions/v1/create-challenge-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`, // Use user's JWT token, not anon key
        },
        body: JSON.stringify({
          amount,
          // userId removed - edge function will get it from JWT token
          challengeId,
          currency: 'gbp',
          paidFromWallet: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create challenge payment intent');
      }

      const data = await response.json();
      return {
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
        originalAmount: data.originalAmount,
        stripeFee: data.stripeFee,
        totalAmount: data.totalAmount,
      };
    } catch (error) {
      console.error('Error creating challenge payment intent:', error);
      throw error instanceof Error ? error : new Error('Failed to create challenge payment intent');
    }
  }

  /**
   * Transfer funds from wallet to Stripe escrow (Platform account)
   * Calls Edge Function to deduct from wallet and create/confirm Payment Intent
   */
  async transferWalletToEscrow(
    userId: string,
    challengeId: string,
    amount: number
  ): Promise<{ paymentIntentId: string; newBalance: number }> {
    try {
      console.log('Transferring wallet to escrow:', { userId, challengeId, amount });

      const { url: supabaseUrl, anonKey } = this.getSupabaseConfig();

      // Call Supabase Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/transfer-wallet-to-escrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          userId,
          challengeId,
          amount,
          currency: 'gbp',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transfer funds to escrow');
      }

      const data = await response.json();
      return {
        paymentIntentId: data.paymentIntentId,
        newBalance: data.newBalance,
      };
    } catch (error) {
      console.error('Error transferring wallet to escrow:', error);
      throw new Error(error.message || 'Failed to transfer funds to escrow');
    }
  }

  /**
   * Create a payment intent for challenge entry fee using wallet balance
   * Creates a $0 Payment Intent for tracking (actual funds are in wallet)
   * No Stripe fee for wallet payments (fees only apply to card payments)
   */
  async createChallengePaymentIntentWithWallet(
    amount: number, // Amount in pounds (£) - for tracking only
    userId: string,
    challengeId: string
  ): Promise<CreatePaymentIntentResponse> {
    try {
      console.log('Creating challenge payment intent (wallet):', { amount, userId, challengeId });

      // Get user's JWT token for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('User not authenticated. Please log in again.');
      }

      const { url: supabaseUrl } = this.getSupabaseConfig();

      // Call Supabase Edge Function with paidFromWallet flag
      // No Stripe fee for wallet payments
      const response = await fetch(`${supabaseUrl}/functions/v1/create-challenge-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`, // Use user's JWT token, not anon key
        },
        body: JSON.stringify({
          amount,
          // userId removed - edge function will get it from JWT token
          challengeId,
          currency: 'gbp',
          paidFromWallet: true,
          includeStripeFee: false, // No fee for wallet payments
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create challenge payment intent');
      }

      const data = await response.json();
      return {
        clientSecret: data.clientSecret,
        paymentIntentId: data.paymentIntentId,
        originalAmount: data.originalAmount,
        stripeFee: data.stripeFee || 0,
        totalAmount: data.totalAmount || amount,
      };
    } catch (error) {
      console.error('Error creating challenge payment intent (wallet):', error);
      throw new Error('Failed to create challenge payment intent');
    }
  }

  /**
   * Refund a challenge payment (when user leaves before challenge starts)
   */
  async refundChallengePayment(
    paymentIntentId: string,
    amount?: number // Optional: partial refund amount in pounds
  ): Promise<{ refundId: string; amount: number; status: string }> {
    try {
      console.log('Refunding challenge payment:', { paymentIntentId, amount });

      const { url: supabaseUrl, anonKey } = this.getSupabaseConfig();

      // Call Supabase Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/refund-challenge-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          paymentIntentId,
          amount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refund challenge payment');
      }

      const data = await response.json();
      return {
        refundId: data.refundId,
        amount: data.amount,
        status: data.status,
      };
    } catch (error) {
      console.error('Error refunding challenge payment:', error);
      throw new Error('Failed to refund challenge payment');
    }
  }

  /**
   * Transfer challenge winnings to winners
   * Currently adds to wallet, can be upgraded to Stripe Connect transfers
   */
  async transferChallengeWinnings(
    userId: string,
    amount: number,
    challengeId: string,
    paymentIntentIds?: string[]
  ): Promise<{ success: boolean; amount: number; newBalance: number }> {
    try {
      console.log('Transferring challenge winnings:', { userId, amount, challengeId });

      const { url: supabaseUrl, anonKey } = this.getSupabaseConfig();

      // Call Supabase Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/transfer-challenge-winnings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          userId,
          amount,
          challengeId,
          paymentIntentIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to transfer challenge winnings');
      }

      const data = await response.json();
      return {
        success: data.success,
        amount: data.amount,
        newBalance: data.newBalance,
      };
    } catch (error) {
      console.error('Error transferring challenge winnings:', error);
      throw new Error('Failed to transfer challenge winnings');
    }
  }

  /**
   * Create platform fee payout to bank account
   * Transfers platform fee from Stripe balance to connected bank account
   */
  async createPlatformFeePayout(
    amount: number,
    challengeId: string
  ): Promise<{ payoutId: string; amount: number; status: string; arrivalDate: number }> {
    try {
      console.log('Creating platform fee payout:', { amount, challengeId });

      const { url: supabaseUrl, anonKey } = this.getSupabaseConfig();

      // Call Supabase Edge Function
      const response = await fetch(`${supabaseUrl}/functions/v1/create-platform-payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          amount,
          challengeId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create platform payout');
      }

      const data = await response.json();
      return {
        payoutId: data.payoutId,
        amount: data.amount,
        status: data.status,
        arrivalDate: data.arrivalDate,
      };
    } catch (error) {
      console.error('Error creating platform payout:', error);
      throw new Error('Failed to create platform fee payout');
    }
  }

  /**
   * Create a transfer/payout to a user (requires Stripe Connect)
   * NOTE: This should be called from your backend
   * @deprecated Use transferChallengeWinnings instead
   */
  async createTransfer(
    amount: number, // Amount in pounds
    destinationAccount: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const amountInPence = Math.round(amount * 100);

      console.log('Creating transfer:', { amount, amountInPence, destinationAccount });

      // TODO: Replace with your actual backend API endpoint
      // Example: POST /api/stripe/create-transfer
      /*
      const response = await fetch('YOUR_BACKEND_URL/api/stripe/create-transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInPence,
          currency: 'gbp',
          destination: destinationAccount,
          metadata,
        }),
      });

      const data = await response.json();
      return data.transferId;
      */

      // MOCK IMPLEMENTATION
      console.warn('⚠️ Using mock Stripe transfer - implement backend API');
      return `mock_tr_${Date.now()}`;
    } catch (error) {
      console.error('Error creating transfer:', error);
      throw new Error('Failed to create transfer');
    }
  }

  /**
   * Refund a payment
   * NOTE: This should be called from your backend
   */
  async refundPayment(
    paymentIntentId: string,
    amount?: number // Optional: partial refund amount in pounds
  ): Promise<string> {
    try {
      const amountInPence = amount ? Math.round(amount * 100) : undefined;

      console.log('Refunding payment:', { paymentIntentId, amount, amountInPence });

      // TODO: Replace with your actual backend API endpoint
      // Example: POST /api/stripe/refund
      /*
      const response = await fetch('YOUR_BACKEND_URL/api/stripe/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIntentId,
          amount: amountInPence,
        }),
      });

      const data = await response.json();
      return data.refundId;
      */

      // MOCK IMPLEMENTATION
      console.warn('⚠️ Using mock Stripe refund - implement backend API');
      return `mock_re_${Date.now()}`;
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw new Error('Failed to refund payment');
    }
  }

  /**
   * Get publishable key for client-side Stripe initialization
   */
  getPublishableKey(): string {
    return this.publishableKey;
  }

  /**
   * Check if Stripe is configured
   */
  isConfigured(): boolean {
    return !!this.publishableKey;
  }

  // NOTE: Pro subscriptions moved to RevenueCat (Apple IAP / Google Play Billing).
  // See lib/iapService.ts. Stripe is intentionally only used here for wallet
  // deposits and challenge entry payments.
}

export const stripeService = new StripeService();

