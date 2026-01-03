/**
 * Wallet Service
 * Manages user wallet operations including:
 * - Creating/fetching wallets
 * - Deposits and withdrawals
 * - Transaction history
 * - Balance management
 */

import { supabase } from './supabase';
import { UserWallet, WalletTransaction, WalletBalance } from '../types/wallet';

class WalletService {
  /**
   * Get or create a wallet for a user
   */
  async getWallet(userId: string): Promise<UserWallet> {
    try {
      // First, try to get existing wallet
      const { data: existingWallet, error: fetchError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (existingWallet) {
        return existingWallet;
      }

      // If not found, create new wallet
      if (fetchError?.code === 'PGRST116') {
        const { data: newWallet, error: createError } = await supabase
          .from('user_wallets')
          .insert({
            user_id: userId,
            balance: 0.00,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating wallet:', createError);
          throw createError;
        }

        if (!newWallet) {
          throw new Error('Failed to create wallet');
        }

        console.log('✅ Created new wallet for user:', userId);
        return newWallet;
      }

      // Other errors
      if (fetchError) {
        console.error('Error fetching wallet:', fetchError);
        throw fetchError;
      }

      throw new Error('Unexpected error getting wallet');
    } catch (error) {
      console.error('Error in getWallet:', error);
      throw error;
    }
  }

  /**
   * Get user's current balance
   */
  async getBalance(userId: string): Promise<number> {
    try {
      const wallet = await this.getWallet(userId);
      return Number(wallet.balance) || 0;
    } catch (error) {
      console.error('Error getting balance:', error);
      return 0;
    }
  }

  /**
   * Deposit funds to wallet (after successful Stripe payment)
   */
  async depositToWallet(
    userId: string,
    amount: number,
    paymentIntentId: string
  ): Promise<{ wallet: UserWallet; transaction: WalletTransaction }> {
    try {
      const wallet = await this.getWallet(userId);
      const newBalance = Number(wallet.balance) + amount;

      // Update wallet balance
      const { data: updatedWallet, error: updateError } = await supabase
        .from('user_wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating wallet balance:', updateError);
        throw updateError;
      }

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'deposit',
          amount: amount,
          stripe_payment_intent_id: paymentIntentId,
          status: 'completed',
          metadata: {
            deposit_date: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        throw transactionError;
      }

      console.log('✅ Deposit successful:', { userId, amount, newBalance });

      return {
        wallet: updatedWallet!,
        transaction: transaction!,
      };
    } catch (error) {
      console.error('Error in depositToWallet:', error);
      throw error;
    }
  }

  /**
   * Withdraw/deduct funds from wallet (for challenge investments)
   */
  async withdrawFromWallet(
    userId: string,
    amount: number,
    reason: 'challenge_payment' | 'fee',
    challengeId?: string
  ): Promise<{ wallet: UserWallet; transaction: WalletTransaction }> {
    try {
      const wallet = await this.getWallet(userId);
      const currentBalance = Number(wallet.balance);

      // Check sufficient balance
      if (currentBalance < amount) {
        throw new Error('Insufficient balance');
      }

      const newBalance = currentBalance - amount;

      // Update wallet balance
      const { data: updatedWallet, error: updateError } = await supabase
        .from('user_wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating wallet balance:', updateError);
        throw updateError;
      }

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          type: reason,
          amount: -amount, // Negative for withdrawal
          challenge_id: challengeId,
          status: 'completed',
          metadata: {
            withdrawal_date: new Date().toISOString(),
            reason,
          },
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        throw transactionError;
      }

      console.log('✅ Withdrawal successful:', { userId, amount, newBalance });

      return {
        wallet: updatedWallet!,
        transaction: transaction!,
      };
    } catch (error) {
      console.error('Error in withdrawFromWallet:', error);
      throw error;
    }
  }

  /**
   * Add payout to wallet (when user wins challenge)
   */
  async addPayout(
    userId: string,
    amount: number,
    challengeId: string
  ): Promise<{ wallet: UserWallet; transaction: WalletTransaction }> {
    try {
      const wallet = await this.getWallet(userId);
      const newBalance = Number(wallet.balance) + amount;

      // Update wallet balance
      const { data: updatedWallet, error: updateError } = await supabase
        .from('user_wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating wallet balance:', updateError);
        throw updateError;
      }

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'payout',
          amount: amount,
          challenge_id: challengeId,
          status: 'completed',
          metadata: {
            payout_date: new Date().toISOString(),
            source: 'challenge_win',
          },
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        throw transactionError;
      }

      console.log('✅ Payout successful:', { userId, amount, newBalance, challengeId });

      return {
        wallet: updatedWallet!,
        transaction: transaction!,
      };
    } catch (error) {
      console.error('Error in addPayout:', error);
      throw error;
    }
  }

  /**
   * Refund challenge payment to wallet (when user leaves challenge before it starts)
   */
  async refundChallengePayment(
    userId: string,
    amount: number,
    challengeId: string
  ): Promise<{ wallet: UserWallet; transaction: WalletTransaction }> {
    try {
      const wallet = await this.getWallet(userId);
      const newBalance = Number(wallet.balance) + amount;

      // Update wallet balance
      const { data: updatedWallet, error: updateError } = await supabase
        .from('user_wallets')
        .update({ balance: newBalance })
        .eq('id', wallet.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating wallet balance:', updateError);
        throw updateError;
      }

      // Create transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'refund',
          amount: amount,
          challenge_id: challengeId,
          status: 'completed',
          metadata: {
            refund_date: new Date().toISOString(),
            source: 'challenge_leave',
            reason: 'User left challenge before start',
          },
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        throw transactionError;
      }

      console.log('✅ Challenge payment refunded:', { userId, amount, newBalance, challengeId });

      return {
        wallet: updatedWallet!,
        transaction: transaction!,
      };
    } catch (error) {
      console.error('Error in refundChallengePayment:', error);
      throw error;
    }
  }

  /**
   * Withdraw funds to original card (Stripe Refund)
   * Calls Edge Function to process refund and update wallet
   */
  async withdrawToCard(
    userId: string,
    amount: number
  ): Promise<{ success: boolean; newBalance: number; refundId: string; message: string }> {
    try {
      console.log('💸 Initiating withdrawal to card:', { userId, amount });
      
      // Call Edge Function (we import config dynamically to avoid circular deps if any)
      const { SUPABASE_URL, SUPABASE_ANON_KEY } = await import('@env');
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/withdraw-to-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY || ''}`,
        },
        body: JSON.stringify({
          userId,
          amount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process withdrawal');
      }

      console.log('✅ Withdrawal processed successfully:', data);
      return {
        success: true,
        newBalance: data.newBalance,
        refundId: data.refundId,
        message: data.message,
      };
    } catch (error) {
      console.error('Error in withdrawToCard:', error);
      throw error;
    }
  }

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 50
  ): Promise<WalletTransaction[]> {
    try {
      const wallet = await this.getWallet(userId);

      const { data: transactions, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching transaction history:', error);
        throw error;
      }

      return transactions || [];
    } catch (error) {
      console.error('Error in getTransactionHistory:', error);
      return [];
    }
  }

  /**
   * Get wallet balance with wallet ID
   */
  async getWalletBalance(userId: string): Promise<WalletBalance> {
    try {
      const wallet = await this.getWallet(userId);
      return {
        balance: Number(wallet.balance) || 0,
        walletId: wallet.id,
      };
    } catch (error) {
      console.error('Error in getWalletBalance:', error);
      return {
        balance: 0,
        walletId: '',
      };
    }
  }

  /**
   * Check if user has sufficient balance for challenge investment
   */
  async hasSufficientBalance(userId: string, requiredAmount: number): Promise<boolean> {
    try {
      const balance = await this.getBalance(userId);
      return balance >= requiredAmount;
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  }

  /**
   * Get or create platform wallet (for collecting fees)
   */
  async getPlatformWallet(): Promise<UserWallet> {
    const PLATFORM_USER_ID = '00000000-0000-0000-0000-000000000000';
    return await this.getWallet(PLATFORM_USER_ID);
  }

  /**
   * Add platform fee to platform wallet
   * @param stripePayoutId - Optional Stripe payout ID if fee was sent to bank
   */
  async addPlatformFee(
    amount: number,
    challengeId: string,
    stripePayoutId?: string
  ): Promise<{ wallet: UserWallet; transaction: WalletTransaction }> {
    try {
      const platformWallet = await this.getPlatformWallet();
      const newBalance = Number(platformWallet.balance) + amount;

      // Update platform wallet
      const { data: updatedWallet, error: updateError } = await supabase
        .from('user_wallets')
        .update({ balance: newBalance })
        .eq('id', platformWallet.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating platform wallet balance:', updateError);
        throw updateError;
      }

      // Create transaction with Stripe payout tracking
      const { data: transaction, error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: platformWallet.id,
          type: 'fee',
          amount: amount,
          challenge_id: challengeId,
          status: 'completed',
          metadata: {
            fee_type: 'platform_fee',
            collected_date: new Date().toISOString(),
            stripe_payout_id: stripePayoutId || null,
            payout_status: stripePayoutId ? 'sent_to_bank' : 'in_database_wallet',
          },
        })
        .select()
        .single();

      if (transactionError) {
        console.error('Error creating platform fee transaction:', transactionError);
        throw transactionError;
      }

      const status = stripePayoutId ? 'sent to bank' : 'stored in database wallet';
      console.log(`✅ Platform fee collected (${status}):`, { 
        amount, 
        challengeId, 
        newBalance,
        stripePayoutId: stripePayoutId || 'none'
      });

      return {
        wallet: updatedWallet!,
        transaction: transaction!,
      };
    } catch (error) {
      console.error('Error in addPlatformFee:', error);
      throw error;
    }
  }
}

export const walletService = new WalletService();

