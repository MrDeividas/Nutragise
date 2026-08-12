/**
 * Wallet Screen
 * Balance, deposits, withdrawals, and transaction history
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
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
const DEPOSIT_PRESETS = [15, 25, 50, 100] as const;

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
  const [depositExpanded, setDepositExpanded] = useState(false);
  const [depositAmount, setDepositAmount] = useState(15);
  const [customDepositMode, setCustomDepositMode] = useState(false);
  const [customDepositText, setCustomDepositText] = useState('');
  const [depositing, setDepositing] = useState(false);

  const defaultDepositAmount = isPro ? 25 : 15;

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

  const resolvedDepositAmount = useMemo(() => {
    if (customDepositMode) {
      const parsed = parseFloat(customDepositText.replace(/,/g, ''));
      return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
    }
    return depositAmount;
  }, [customDepositMode, customDepositText, depositAmount]);

  const depositCharge = useMemo(() => {
    if (resolvedDepositAmount < 0.5) return null;
    return getDepositChargeTotal(resolvedDepositAmount);
  }, [resolvedDepositAmount]);

  const toggleDepositPanel = () => {
    setDepositExpanded((open) => {
      if (!open) {
        setCustomDepositMode(false);
        setCustomDepositText('');
        setDepositAmount(defaultDepositAmount);
      }
      return !open;
    });
  };

  const selectPresetDeposit = (amount: number) => {
    setCustomDepositMode(false);
    setCustomDepositText('');
    setDepositAmount(amount);
  };

  const selectCustomDeposit = () => {
    setCustomDepositMode(true);
    if (!customDepositText) {
      setCustomDepositText(String(defaultDepositAmount));
    }
  };

  const processDeposit = async (amount: number) => {
    if (!user) return;

    if (amount < 0.5) {
      Alert.alert('Minimum deposit', 'Please enter at least £0.50.');
      return;
    }

    try {
      setDepositing(true);
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
          email: user.email || undefined,
        },
        returnURL: 'nutrapp://stripe-redirect',
        // Shows Apple Pay in the Payment Sheet when the device + Stripe certs support it
        applePay: {
          merchantCountryCode: 'GB',
        },
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
      setDepositExpanded(false);
      await loadWalletData();

      const fee = stripeFee ?? platformFee ?? 0;
      const feeInfo =
        fee > 0
          ? `\n\nPaid: £${(totalAmount || amount).toFixed(2)} (includes £${fee.toFixed(2)} card fee)`
          : '';

      Alert.alert('Success!', `£${creditAmount.toFixed(2)} added to your wallet!${feeInfo}`);
    } catch (error: any) {
      console.error('Error processing deposit:', error);
      Alert.alert('Error', `Failed to add funds: ${error.message || 'Unknown error'}`);
    } finally {
      setDepositing(false);
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
      `Wallet: £${balance.toFixed(2)}\nFee: £${withdrawFee.toFixed(2)}${isPro ? ' (Member)' : ' (Free)'}\nYou receive: £${payout.toFixed(2)}\n\n${profile.paypal_email}`,
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
                    style={[styles.primaryButton, depositExpanded && styles.primaryButtonActive]}
                    onPress={toggleDepositPanel}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={depositExpanded ? 'chevron-up' : 'add'}
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.primaryButtonText}>
                      {depositExpanded ? 'Hide' : 'Add funds'}
                    </Text>
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

                {depositExpanded ? (
                  <View style={styles.depositPanel}>
                    <Text style={styles.depositLabel}>Amount to add</Text>
                    <View style={styles.depositChipRow}>
                      {DEPOSIT_PRESETS.map((amount) => {
                        const selected = !customDepositMode && depositAmount === amount;
                        return (
                          <TouchableOpacity
                            key={amount}
                            style={[styles.depositChip, selected && styles.depositChipSelected]}
                            onPress={() => selectPresetDeposit(amount)}
                            activeOpacity={0.85}
                          >
                            <Text
                              style={[
                                styles.depositChipText,
                                selected && styles.depositChipTextSelected,
                              ]}
                            >
                              £{amount}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                      <TouchableOpacity
                        style={[
                          styles.depositChip,
                          customDepositMode && styles.depositChipSelected,
                        ]}
                        onPress={selectCustomDeposit}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.depositChipText,
                            customDepositMode && styles.depositChipTextSelected,
                          ]}
                        >
                          Custom
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {customDepositMode ? (
                      <View style={styles.customAmountRow}>
                        <Text style={styles.customAmountPrefix}>£</Text>
                        <TextInput
                          style={styles.customAmountInput}
                          value={customDepositText}
                          onChangeText={(text) =>
                            setCustomDepositText(text.replace(/[^0-9.]/g, ''))
                          }
                          keyboardType="decimal-pad"
                          placeholder={String(defaultDepositAmount)}
                          placeholderTextColor="#9CA3AF"
                          autoFocus
                        />
                      </View>
                    ) : null}

                    {depositCharge ? (
                      <Text style={styles.depositFeeHint}>
                        You’ll pay £{depositCharge.total.toFixed(2)}
                        {depositCharge.fee > 0
                          ? ` (includes £${depositCharge.fee.toFixed(2)} card fee)`
                          : ''}
                        . No platform deposit fee.
                      </Text>
                    ) : (
                      <Text style={styles.depositFeeHint}>Enter at least £0.50 to continue.</Text>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.depositConfirmButton,
                        (depositing || !depositCharge) && styles.depositConfirmDisabled,
                      ]}
                      onPress={() => processDeposit(resolvedDepositAmount)}
                      disabled={depositing || !depositCharge}
                      activeOpacity={0.85}
                    >
                      {depositing ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.depositConfirmText}>
                          Deposit £{resolvedDepositAmount > 0 ? resolvedDepositAmount.toFixed(2) : '0.00'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : null}
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
  primaryButtonActive: {
    opacity: 0.92,
  },
  depositPanel: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  depositLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
  },
  depositChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  depositChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  depositChipSelected: {
    backgroundColor: DARK,
    borderColor: DARK,
  },
  depositChipText: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
  },
  depositChipTextSelected: {
    color: '#FFFFFF',
  },
  customAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  customAmountPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginRight: 4,
  },
  customAmountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    padding: 0,
  },
  depositFeeHint: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 17,
  },
  depositConfirmButton: {
    marginTop: 14,
    backgroundColor: DARK,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  depositConfirmDisabled: {
    opacity: 0.5,
  },
  depositConfirmText: {
    color: '#FFFFFF',
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
