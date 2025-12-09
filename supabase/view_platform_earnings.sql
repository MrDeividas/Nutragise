-- View Platform Earnings Summary
-- This shows how much money in Stripe belongs to the platform (fees collected)

-- 1. Current Platform Wallet Balance (Your Fees)
SELECT 
  'Platform Wallet Balance' as description,
  balance as total_platform_fees,
  created_at as wallet_created_at
FROM user_wallets
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- 2. Platform Fees by Challenge
SELECT 
  c.title as challenge_title,
  cp.platform_fee_amount,
  cp.total_amount as challenge_total,
  cp.platform_fee_percentage,
  cp.status as pot_status,
  cp.distributed_at
FROM challenge_pots cp
JOIN challenges c ON c.id = cp.challenge_id
WHERE cp.platform_fee_amount > 0
ORDER BY cp.distributed_at DESC NULLS LAST, cp.created_at DESC;

-- 3. Total Platform Fees Collected (All Time)
SELECT 
  COALESCE(SUM(amount), 0) as total_fees_collected,
  COUNT(*) as fee_transactions_count
FROM wallet_transactions
WHERE type = 'fee'
  AND status = 'completed';

-- 4. Platform Fees by Month
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as fee_count,
  SUM(amount) as monthly_fees
FROM wallet_transactions
WHERE type = 'fee'
  AND status = 'completed'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- 5. Breakdown: What's in Stripe vs What's Yours
SELECT 
  'Total User Wallets' as category,
  COALESCE(SUM(balance), 0) as amount
FROM user_wallets
WHERE user_id != '00000000-0000-0000-0000-000000000000'

UNION ALL

SELECT 
  'Platform Wallet (Your Fees)' as category,
  COALESCE(balance, 0) as amount
FROM user_wallets
WHERE user_id = '00000000-0000-0000-0000-000000000000'

UNION ALL

SELECT 
  'Challenge Pots (Escrow)' as category,
  COALESCE(SUM(total_amount), 0) as amount
FROM challenge_pots
WHERE status IN ('collecting', 'active', 'distributing');

