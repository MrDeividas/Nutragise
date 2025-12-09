// Wallet and Investment Pot Types

export interface UserWallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: 'deposit' | 'challenge_payment' | 'refund' | 'payout' | 'fee';
  amount: number;
  stripe_payment_intent_id?: string;
  challenge_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  metadata: Record<string, any>;
  created_at: string;
}

export interface ChallengePot {
  id: string;
  challenge_id: string;
  total_amount: number;
  platform_fee_percentage: number;
  platform_fee_amount: number;
  winners_pot: number;
  status: 'collecting' | 'active' | 'distributing' | 'completed';
  created_at: string;
  distributed_at?: string;
}

export interface ChallengeParticipantWithInvestment {
  id: string;
  challenge_id: string;
  user_id: string;
  joined_at: string;
  status: 'active' | 'completed' | 'failed' | 'left';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  completion_percentage: number;
  investment_amount: number;
  forfeited_amount: number;
  days_missed: number;
  is_winner: boolean;
  payout_amount: number;
  payout_status: 'pending' | 'paid' | 'failed';
}

export interface DailyProofTracking {
  id: string;
  challenge_id: string;
  user_id: string;
  date: string; // DATE format: YYYY-MM-DD
  has_proof: boolean;
  submission_id?: string;
  forfeited: boolean;
  forfeited_amount: number;
  created_at: string;
}

export interface PotStatus {
  potId: string;
  challengeId: string;
  totalAmount: number;
  platformFee: number;
  winnersPot: number;
  participantCount: number;
  status: 'collecting' | 'active' | 'distributing' | 'completed';
  distributedAt?: string;
}

export interface WalletBalance {
  balance: number;
  walletId: string;
}

