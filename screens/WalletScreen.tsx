/**
 * Wallet Screen
 * Displays user's wallet balance, transaction history, and deposit functionality
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
import { useAuthStore } from '../state/authStore';
import { useTheme } from '../state/themeStore';
import { WalletTransaction } from '../types/wallet';

export default function WalletScreen() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuthStore();

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(10);

  // Load wallet data
  const loadWalletData = useCallback(async () => {
    if (!user) return;

    try {
      const [userBalance, userTransactions] = await Promise.all([
        walletService.getBalance(user.id),
        walletService.getTransactionHistory(user.id, 50),
      ]);

      setBalance(userBalance);
      setTransactions(userTransactions);
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

  // Handle add funds (integrate with Stripe)
  const handleAddFunds = async () => {
    if (!user) return;

    try {
      // Show alert with preset amounts
      Alert.alert(
        'Add Funds',
        'Select amount to add to your wallet',
        [
          {
            text: '£10',
            onPress: () => processDeposit(10),
          },
          {
            text: '£20',
            onPress: () => processDeposit(20),
          },
          {
            text: '£50',
            onPress: () => processDeposit(50),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error adding funds:', error);
      Alert.alert('Error', 'Failed to add funds');
    }
  };

  const processDeposit = async (amount: number) => {
    if (!user) {
      console.error('❌ No user found');
      return;
    }

    try {
      console.log('💰 Starting deposit process:', { amount, userId: user.id });
      
      // 1. Create Payment Intent
      // Note: ensure backend function 'create-payment-intent' is deployed and reachable
      const { clientSecret, paymentIntentId } = await stripeService.createPaymentIntent(
        amount,
        user.id,
        {
          userId: user.id,
          purpose: 'wallet_deposit',
        }
      );

      if (!clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      // 2. Initialize Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'NutrApp',
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: {
          name: user.email?.split('@')[0] || 'User',
        },
        returnURL: 'nutrapp://stripe-redirect',
      });

      if (initError) {
        throw new Error(initError.message);
      }

      // 3. Present Payment Sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        if (presentError.code === 'Canceled') {
          console.log('Payment canceled by user');
          return;
        }
        throw new Error(presentError.message);
      }

      console.log('✅ Payment successful, updating wallet...');
      
      // 4. Update Wallet
      // In a production environment, this should be handled by webhooks.
      // For testing/dev responsiveness, we manually update here if the webhook is delayed or not local.
      // We pass the real paymentIntentId so the transaction record is accurate.
      const result = await walletService.depositToWallet(user.id, amount, paymentIntentId);
      
      console.log('✅ Deposit result:', result);
      console.log('✅ New balance should be:', result.wallet.balance);
      
      // Update local state immediately
      setBalance(Number(result.wallet.balance));
      
      // Reload wallet data to show new balance and transaction
      await loadWalletData();
      
      console.log('✅ Wallet data reloaded');
      
      Alert.alert('Success!', `£${amount} added to your wallet!`);
    } catch (error: any) {
      console.error('❌ Error processing deposit:', error);
      console.error('❌ Error details:', error.message);
      Alert.alert('Error', `Failed to add funds: ${error.message || 'Unknown error'}`);
    }
  };

  const handleResetBalance = async () => {
    if (!user) return;
    
    try {
      // Manually reset wallet balance for testing purposes
      // Using null for challengeId as it expects a UUID or undefined
      await walletService.withdrawFromWallet(user.id, balance, 'fee', undefined);
      setBalance(0);
      await loadWalletData();
      Alert.alert('Success', 'Wallet balance reset to £0');
    } catch (error) {
      console.error('Error resetting balance:', error);
      Alert.alert('Error', 'Failed to reset balance');
    }
  };

  const handleWithdraw = async () => {
    if (!user) return;
    
    // In a real app, you might let the user choose an amount.
    // For simplicity, we'll withdraw the full balance or a fixed amount for now.
    // Let's ask the user for confirmation.
    
    if (balance <= 0) {
      Alert.alert('Insufficient Funds', 'You have no funds to withdraw.');
      return;
    }

    Alert.alert(
      'Withdraw to Card',
      `Withdraw your full balance of £${balance.toFixed(2)} to your original payment card?`,
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
              
              Alert.alert('Success', result.message);
            } catch (error: any) {
              console.error('Withdrawal error:', error);
              Alert.alert('Withdrawal Failed', error.message || 'Could not process withdrawal');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Format transaction type for display
  const formatTransactionType = (type: string): string => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'challenge_payment':
        return 'Challenge Investment';
      case 'payout':
        return 'Challenge Payout';
      case 'refund':
        return 'Refund';
      case 'fee':
        return 'Platform Fee';
      default:
        return type;
    }
  };

  // Get icon for transaction type
  const getTransactionIcon = (type: string): any => {
    switch (type) {
      case 'deposit':
        return 'add-circle';
      case 'challenge_payment':
        return 'trophy';
      case 'payout':
        return 'cash';
      case 'refund':
        return 'refresh-circle';
      case 'fee':
        return 'remove-circle';
      default:
        return 'ellipse';
    }
  };

  // Get color for transaction type
  const getTransactionColor = (type: string, amount: number): string => {
    if (amount > 0) {
      return '#10B981'; // Green for positive
    } else {
      return '#EF4444'; // Red for negative
    }
  };

  const renderTransaction = ({ item }: { item: WalletTransaction }) => {
    const isPositive = item.amount > 0;
    const color = getTransactionColor(item.type, item.amount);

    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionLeft}>
          <View style={[styles.transactionIcon, { backgroundColor: color + '20' }]}>
            <Ionicons name={getTransactionIcon(item.type)} size={20} color={color} />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={[styles.transactionType, { color: theme.textPrimary }]}>
              {formatTransactionType(item.type)}
            </Text>
            <Text style={[styles.transactionDate, { color: theme.textSecondary }]}>
              {new Date(item.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>
        <Text
          style={[
            styles.transactionAmount,
            {
              color: color,
            },
          ]}
        >
          {isPositive ? '+' : '-'}£{Math.abs(item.amount).toFixed(2)}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Wallet</Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        ListHeaderComponent={
          <>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <Text style={[styles.balanceLabel, { color: theme.textSecondary }]}>
                Available Balance
              </Text>
              <Text style={[styles.balanceAmount, { color: theme.textPrimary }]}>
                £{balance.toFixed(2)}
              </Text>

              <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={styles.addFundsButton}
                onPress={handleAddFunds}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.addFundsButtonText}>Add Funds</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.addFundsButton, { backgroundColor: theme.cardBackground, borderWidth: 1, borderColor: theme.borderColor }]}
                  onPress={handleWithdraw}
                >
                  <Ionicons name="arrow-down-circle" size={20} color={theme.textPrimary} />
                  <Text style={[styles.addFundsButtonText, { color: theme.textPrimary }]}>Withdraw</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.addFundsButton, { marginTop: 12, backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.textSecondary }]}
                onPress={handleResetBalance}
              >
                <Ionicons name="refresh" size={20} color={theme.textSecondary} />
                <Text style={[styles.addFundsButtonText, { color: theme.textSecondary }]}>Reset (Test)</Text>
              </TouchableOpacity>
            </View>

            {/* Transaction History Header */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Transaction History
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              No transactions yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
              Add funds to start investing in challenges
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  listContent: {
    padding: 16,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  addFundsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addFundsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

