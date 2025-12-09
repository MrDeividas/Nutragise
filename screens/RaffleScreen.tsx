/**
 * Raffle/Giveaway Screen
 * Displays current raffle and allows Pro members to enter
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { raffleService, Raffle } from '../lib/raffleService';
import { storeService } from '../lib/storeService';
import CustomBackground from '../components/CustomBackground';

export default function RaffleScreen() {
  const navigation = useNavigation() as any;
  const { theme } = useTheme();
  const { user } = useAuthStore();

  const [currentRaffle, setCurrentRaffle] = useState<Raffle | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [hasEntered, setHasEntered] = useState(false);
  const [entryCount, setEntryCount] = useState(0);
  const [hasTicket, setHasTicket] = useState(false);
  const [ticketCount, setTicketCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [entering, setEntering] = useState(false);
  const [isPro, setIsPro] = useState(false);

  const loadRaffleData = useCallback(async () => {
    if (!user) return;

    try {
      const [raffle, tokens, profileData] = await Promise.all([
        raffleService.getCurrentRaffle(),
        storeService.getUserTokens(user.id),
        getUserProfile(),
      ]);

      setCurrentRaffle(raffle);
      setTokenBalance(tokens);
      setIsPro(profileData.is_pro);

      if (raffle) {
        // Check if user has entered
        const entered = await raffleService.hasUserEntered(user.id, raffle.id);
        setHasEntered(entered);

        // Get total entry count
        const count = await raffleService.getEntryCount(raffle.id);
        setEntryCount(count);

        // Check if user has tickets - fetch directly from inventory for accuracy
        if (raffle.ticket_item_id) {
          const inventory = await storeService.getUserInventory(user.id);
          const ticketItem = inventory.find(item => item.item_id === raffle.ticket_item_id);
          const quantity = ticketItem?.quantity || 0;
          setHasTicket(quantity > 0);
          setTicketCount(quantity);
          console.log('🎫 Ticket count fetched:', { ticketItemId: raffle.ticket_item_id, quantity, ticketItem });
        } else {
          setHasTicket(false);
          setTicketCount(0);
        }
      }
    } catch (error) {
      console.error('Error loading raffle data:', error);
      Alert.alert('Error', 'Failed to load raffle information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const getUserProfile = async () => {
    if (!user) return { is_pro: false };

    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data || { is_pro: false };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return { is_pro: false };
    }
  };

  useEffect(() => {
    loadRaffleData();
  }, [loadRaffleData]);

  // Refresh data when screen comes into focus to ensure accurate ticket count
  useFocusEffect(
    useCallback(() => {
      loadRaffleData();
    }, [loadRaffleData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadRaffleData();
  };

  const handleEnterRaffle = async () => {
    if (!user || !currentRaffle) return;

    // Check Pro status
    if (!isPro) {
      Alert.alert(
        'Pro Members Only',
        'This raffle is exclusive to Pro members. Upgrade to Pro to enter!',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if already entered
    if (hasEntered) {
      Alert.alert('Already Entered', 'You have already entered this raffle. Good luck!');
      return;
    }

    // Check if has ticket - fetch fresh count to ensure accuracy
    if (currentRaffle.ticket_item_id) {
      const inventory = await storeService.getUserInventory(user.id);
      const ticketItem = inventory.find(item => item.item_id === currentRaffle.ticket_item_id);
      const freshTicketCount = ticketItem?.quantity || 0;
      
      if (freshTicketCount <= 0) {
        Alert.alert(
          'No Tickets',
          'You need a raffle ticket to enter. Visit the store to claim one!',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Visit Store', onPress: () => navigation.navigate('Store') },
          ]
        );
        // Update the displayed count to reflect reality
        setTicketCount(0);
        setHasTicket(false);
        return;
      }
    } else if (!hasTicket || ticketCount <= 0) {
      Alert.alert(
        'No Tickets',
        'You need a raffle ticket to enter. Visit the store to claim one!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Visit Store', onPress: () => navigation.navigate('Store') },
        ]
      );
      return;
    }

    // Confirm entry
    Alert.alert(
      'Enter Raffle',
      `Use 1 raffle ticket to enter the ${currentRaffle.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enter',
          onPress: async () => {
            try {
              setEntering(true);
              const result = await raffleService.enterRaffle(user.id, currentRaffle.id);

              if (result.success) {
                Alert.alert('Success!', result.message);
                loadRaffleData(); // Refresh
              } else {
                Alert.alert('Failed', result.message);
              }
            } catch (error: any) {
              console.error('Error entering raffle:', error);
              Alert.alert('Error', error.message || 'Failed to enter raffle');
            } finally {
              setEntering(false);
            }
          },
        },
      ]
    );
  };

  const getTimeRemaining = () => {
    if (!currentRaffle) return '';

    const now = new Date();
    const drawDate = new Date(currentRaffle.draw_date);
    const diff = drawDate.getTime() - now.getTime();

    if (diff <= 0) return 'Draw happening soon!';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  };

  if (loading) {
    return (
      <CustomBackground>
        <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        </SafeAreaView>
      </CustomBackground>
    );
  }

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          {/* Ticket Count - Left */}
          <View style={[styles.tokenBadge, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="ticket" size={16} color={theme.primary} />
            <Text style={[styles.tokenText, { color: theme.textPrimary }]}>
              {ticketCount}
            </Text>
          </View>

          {/* Title - Center */}
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Raffles</Text>

          {/* Navigation Icons - Right */}
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: theme.cardBackground }]}
              onPress={() => navigation.navigate('Store')}
            >
              <Ionicons name="cart" size={22} color={theme.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: theme.cardBackground }]}
              onPress={() => navigation.navigate('Inventory')}
            >
              <Ionicons name="cube" size={22} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
        >
          {currentRaffle ? (
            <View style={[styles.raffleCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
              {/* Header */}
              <View style={styles.raffleHeader}>
                <View style={[styles.raffleIcon, { backgroundColor: theme.primary + '20' }]}>
                  <Ionicons name="trophy" size={28} color={theme.primary} />
                </View>
                <View style={styles.raffleHeaderText}>
                  <Text style={[styles.raffleTitle, { color: theme.textPrimary }]}>
                    {currentRaffle.title}
                  </Text>
                  <Text style={[styles.rafflePrize, { color: theme.primary }]}>
                    £{currentRaffle.prize_amount} Prize
                  </Text>
                </View>
                {hasEntered && (
                  <View style={styles.enteredBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    <Text style={styles.enteredText}>Entered</Text>
                  </View>
                )}
              </View>

              {/* Description */}
              {currentRaffle.description && (
                <Text style={[styles.raffleDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                  {currentRaffle.description}
                </Text>
              )}

              {/* Stats Row */}
              <View style={styles.raffleStats}>
                <View style={styles.raffleStat}>
                  <Ionicons name="people" size={16} color={theme.textSecondary} />
                  <Text style={[styles.raffleStatText, { color: theme.textSecondary }]}>
                    {entryCount} {entryCount === 1 ? 'participant' : 'participants'}
                  </Text>
                </View>
                <View style={styles.raffleStat}>
                  <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                  <Text style={[styles.raffleStatText, { color: theme.textSecondary }]}>
                    {getTimeRemaining()}
                  </Text>
                </View>
              </View>

              {/* Enter Button */}
              <TouchableOpacity
                style={[
                  styles.raffleButton,
                  {
                    backgroundColor: hasEntered || !isPro ? '#E5E7EB' : theme.primary,
                    opacity: entering ? 0.6 : 1,
                  },
                ]}
                onPress={handleEnterRaffle}
                disabled={hasEntered || entering || !isPro}
              >
                {entering ? (
                  <ActivityIndicator size="small" color={hasEntered || !isPro ? theme.textSecondary : '#FFFFFF'} />
                ) : (
                  <Text style={[styles.raffleButtonText, { color: hasEntered || !isPro ? theme.textSecondary : '#FFFFFF' }]}>
                    {hasEntered ? 'Already Entered' : !isPro ? 'Pro Members Only' : 'Enter Giveaway'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No active raffles at the moment
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                Check back soon for the next giveaway!
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </CustomBackground>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 0,
  },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
    zIndex: 1,
  },
  tokenText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 8,
    zIndex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  raffleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  raffleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  raffleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  raffleHeaderText: {
    flex: 1,
  },
  raffleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  rafflePrize: {
    fontSize: 16,
    fontWeight: '600',
  },
  enteredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  enteredText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  raffleDescription: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 12,
  },
  raffleStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  raffleStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  raffleStatText: {
    fontSize: 14,
    fontWeight: '500',
  },
  raffleButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  raffleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

