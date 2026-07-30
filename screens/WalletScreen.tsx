/**
 * Wallet Screen
 * Balance, deposits, withdrawals, and transaction history
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { walletService } from '../lib/walletService';
import { stripeService } from '../lib/stripeService';
import { challengesService } from '../lib/challengesService';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../state/authStore';
import { WalletTransaction } from '../types/wallet';
import { getChallengeDisplayTitle } from '../lib/challengeTitleUtils';
import {
  getDepositChargeTotal,
  getWithdrawalFee,
  getWithdrawalPayout,
} from '../lib/walletFees';
import CustomBackground from '../components/CustomBackground';

const DARK = '#1f2937';

export default function WalletScreen() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const navigation = useNavigation();
  const { user } = useAuthStore();

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [challengeNames, setChallengeNames] = useState<Record<string, string>>({});
  const [isPro, setIsPro] = useState(false);

  const loadWalletData = useCallback(async () => {
    if (!user) return;

    try {
      const [userBalance, userTransactions, profileRes] = await Promise.all([
        walletService.getBalance(user.id),
        walletService.getTransactionHistory(user.id, 50),
        supabase.from('profiles').select('is_pro').eq('id', user.id).single(),
      ]);

      setBalance(userBalance);
      setTransactions(userTransactions);
      setIsPro(profileRes.data?.is_pro === true);

      const challengeIds = userTransactions
        .filter((t) => t.challenge_id && t.type === 'challenge_payment')
        .map((t) => t.challenge_id!)
        .filter((id, index, self) => self.indexOf(id) === index);

      if (challengeIds.length > 0) {
        const namesMap: Record<string, string> = {};
        await Promise.all(
          challengeIds.map(async (challengeId) => {
            try {
              const challenge = await challengesService.getChallengeById(challengeId);
              if (challenge) {
                namesMap[challengeId] = getChallengeDisplayTitle(challenge.title);
              }
            } catch (error) {
              console.error(`Error fetching challenge ${challengeId}:`, error);
            }
          })
        );
        setChallengeNames(namesMap);
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadWalletData();
  };

  const handleAddFunds = async () => {
    if (!user) return;

    try {
      const fee10 = getDepositChargeTotal(10, isPro);
      const fee20 = getDepositChargeTotal(20, isPro);
      const fee50 = getDepositChargeTotal(50, isPro);
      const feeLine = isPro
        ? 'Pro: no deposit fee'
        : 'Free plan: £3 deposit fee per top-up';

      Alert.alert('Add Funds', `Select amount to add to your wallet\n(${feeLine})`, [
        {
          text: fee10.fee > 0 ? `£10 (pay £${fee10.total.toFixed(2)})` : '£10',
          onPress: () => processDeposit(10),
        },
        {
          text: fee20.fee > 0 ? `£20 (pay £${fee20.total.toFixed(2)})` : '£20',
          onPress: () => processDeposit(20),
        },
        {
          text: fee50.fee > 0 ? `£50 (pay £${fee50.total.toFixed(2)})` : '£50',
          onPress: () => processDeposit(50),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } catch (error) {
      console.error('Error adding funds:', error);
      Alert.alert('Error', 'Failed to add funds');
    }
  };

  const processDeposit = async (amount: number) => {
    if (!user) return;

    try {
      const { clientSecret, paymentIntentId, originalAmount, platformFee, stripeFee, totalAmount } =
        await stripeService.createPaymentIntent(amount, user.id, {
          userId: user.id,
          purpose: 'wallet_deposit',
        });

      if (!clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'Nutragise',
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: {
          name: user.email?.split('@')[0] || 'User',
        },
        returnURL: 'nutrapp://stripe-redirect',
      });

      if (initError) {
        throw new Error(initError.message);
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') return;
        throw new Error(presentError.message);
      }

      const creditAmount = originalAmount ?? amount;
      const result = await walletService.depositToWallet(user.id, creditAmount, paymentIntentId);

      setBalance(Number(result.wallet.balance));
      await loadWalletData();

      const fee = platformFee ?? stripeFee ?? 0;
      const feeInfo =
        fee > 0
          ? `\n\nPaid: £${(totalAmount || amount).toFixed(2)} (includes £${fee.toFixed(2)} deposit fee)`
          : '\n\nNo deposit fee (Pro)';

      Alert.alert('Success!', `£${creditAmount.toFixed(2)} added to your wallet!${feeInfo}`);
    } catch (error: any) {
      console.error('Error processing deposit:', error);
      Alert.alert('Error', `Failed to add funds: ${error.message || 'Unknown error'}`);
    }
  };

  const handleWithdraw = async () => {
    if (!user) return;

    if (balance <= 0) {
      Alert.alert('No Funds', 'You have no balance to withdraw.');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('paypal_email')
      .eq('id', user.id)
      .single();

    if (!profile?.paypal_email) {
      Alert.alert(
        'PayPal Email Required',
        'Add your PayPal email in Settings before withdrawing.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Settings',
            onPress: () =>
              (navigation as any).navigate('MainTabs', {
                screen: 'Profile',
                params: { screen: 'ProfileSettings' },
              }),
          },
        ]
      );
      return;
    }

    const withdrawFee = getWithdrawalFee(isPro);
    const { payout } = getWithdrawalPayout(balance, isPro);

    if (payout <= 0) {
      Alert.alert(
        'Balance too low',
        `You need more than £${withdrawFee.toFixed(2)} in your wallet to withdraw (withdrawal fee).`
      );
      return;
    }

    Alert.alert(
      'Withdraw to PayPal',
      `Wallet: £${balance.toFixed(2)}\nFee: £${withdrawFee.toFixed(2)}${isPro ? ' (Pro)' : ' (Free)'}\nYou receive: £${payout.toFixed(2)}\n\n${profile.paypal_email}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await walletService.withdrawToCard(user.id, balance);
              setBalance(result.newBalance);
              await loadWalletData();
              Alert.alert('Sent!', result.message);
            } catch (error: any) {
              console.error('Withdrawal error:', error);
              Alert.alert(
                'Withdrawal Failed',
                error.message || 'Could not process withdrawal. Please try again.'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatTransactionType = (transaction: WalletTransaction): string => {
    switch (transaction.type) {
      case 'deposit':
        return 'Deposit';
      case 'challenge_payment':
        if (transaction.challenge_id && challengeNames[transaction.challenge_id]) {
          return challengeNames[transaction.challenge_id];
        }
        return 'Challenge entry';
      case 'payout':
        return 'Challenge winnings';
      case 'refund':
        return 'Refund';
      case 'fee':
        return 'Platform fee';
      case 'withdrawal':
        return 'PayPal withdrawal';
      default:
        return transaction.type;
    }
  };

  const getTransactionIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'deposit':
        return 'arrow-down-outline';
      case 'challenge_payment':
        return 'flag-outline';
      case 'payout':
        return 'trophy-outline';
      case 'refund':
        return 'refresh-outline';
      case 'fee':
        return 'receipt-outline';
      case 'withdrawal':
        return 'arrow-up-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const renderTransaction = ({ item }: { item: WalletTransaction }) => {
    const isPositive = item.amount > 0;

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionIcon}>
          <Ionicons name={getTransactionIcon(item.type)} size={18} color={DARK} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionType} numberOfLines={1}>
            {formatTransactionType(item)}
          </Text>
          <Text style={styles.transactionDate}>
            {new Date(item.created_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
        </View>
        <Text style={[styles.transactionAmount, isPositive ? styles.amountIn : styles.amountOut]}>
          {isPositive ? '+' : '−'}£{Math.abs(item.amount).toFixed(2)}
        </Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <CustomBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={DARK} />
          </View>
        </SafeAreaView>
      </CustomBackground>
    );
  }

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={DARK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet</Text>
          <View style={styles.backButton} />
        </View>

        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <View style={styles.balanceCard}>
                <View style={styles.balanceTopRow}>
                  <Text style={styles.balanceLabel}>Available balance</Text>
                  <View style={styles.tierPill}>
                    <Text style={styles.tierPillText}>{isPro ? 'Pro' : 'Free'}</Text>
                  </View>
                </View>
                <Text style={styles.balanceAmount}>£{balance.toFixed(2)}</Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleAddFunds}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Add funds</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleWithdraw}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="arrow-up-outline" size={18} color={DARK} />
                    <Text style={styles.secondaryButtonText}>Withdraw</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Activity</Text>
                <Text style={styles.sectionCount}>
                  {transactions.length} {transactions.length === 1 ? 'item' : 'items'}
                </Text>
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconRing}>
                <Ionicons name="wallet-outline" size={32} color={DARK} />
              </View>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>
                Add funds to join paid challenges and track your activity here
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={DARK}
              colors={[DARK]}
            />
          }
        />
      </SafeAreaView>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: DARK,
    flex: 1,
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.2,
  },
  tierPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tierPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: DARK,
  },
  balanceAmount: {
    fontSize: 44,
    fontWeight: '700',
    color: DARK,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: DARK,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    color: DARK,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 8,
  },
  transactionType: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  amountIn: {
    color: DARK,
  },
  amountOut: {
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '700',
    color: DARK,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#6B7280',
  },
});
