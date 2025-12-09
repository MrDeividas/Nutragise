/**
 * Store Screen
 * Displays claimable items for Pro members using tokens
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
import { storeService, StoreItem } from '../lib/storeService';
import CustomBackground from '../components/CustomBackground';

export default function StoreScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuthStore();

  const [items, setItems] = useState<StoreItem[]>([]);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [ticketCount, setTicketCount] = useState<number>(0);
  const [userLevel, setUserLevel] = useState<number>(1);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);

  const loadStoreData = useCallback(async () => {
    if (!user) return;

    try {
      const [storeItems, tokens, profileData, inventory] = await Promise.all([
        storeService.getStoreItems(),
        storeService.getUserTokens(user.id),
        getUserProfile(),
        storeService.getUserInventory(user.id),
      ]);

      setItems(storeItems);
      setTokenBalance(tokens);
      setUserLevel(profileData.level);
      setIsPro(profileData.is_pro);
      
      // Find raffle ticket count
      const raffleTicketItem = storeItems.find(item => item.type === 'raffle_ticket');
      if (raffleTicketItem) {
        const ticketItem = inventory.find(item => item.item_id === raffleTicketItem.id);
        setTicketCount(ticketItem?.quantity || 0);
      }
    } catch (error) {
      console.error('Error loading store data:', error);
      Alert.alert('Error', 'Failed to load store items');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const getUserProfile = async () => {
    if (!user) return { level: 1, is_pro: false };

    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('profiles')
        .select('level, is_pro')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data || { level: 1, is_pro: false };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return { level: 1, is_pro: false };
    }
  };

  useEffect(() => {
    loadStoreData();
  }, [loadStoreData]);

  // Refresh data when screen comes into focus to ensure accurate ticket count
  useFocusEffect(
    useCallback(() => {
      loadStoreData();
    }, [loadStoreData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadStoreData();
  };

  const handleClaimItem = async (item: StoreItem) => {
    if (!user) return;

    // Check Pro requirement
    if (item.is_pro_only && !isPro) {
      Alert.alert(
        'Pro Members Only',
        'This item is exclusive to Pro members. Upgrade to Pro to claim it!',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check level requirement
    if (userLevel < item.level_required) {
      Alert.alert(
        'Level Required',
        `You need to be level ${item.level_required} to claim this item. Keep completing challenges to level up!`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Check token balance
    if (tokenBalance < item.price_tokens) {
      Alert.alert(
        'Insufficient Tokens',
        `You need ${item.price_tokens} tokens to claim this item. You currently have ${tokenBalance} tokens.\n\nEarn more tokens by leveling up!`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Confirm purchase
    Alert.alert(
      'Claim Item',
      `Claim ${item.name} for ${item.price_tokens} token${item.price_tokens > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Claim',
          onPress: async () => {
            try {
              setClaiming(item.id);
              const result = await storeService.claimItem(user.id, item.id);

              if (result.success) {
                Alert.alert('Success!', result.message);
                setTokenBalance(result.newTokenBalance || 0);
                // Refresh to update UI
                loadStoreData();
              } else {
                Alert.alert('Failed', result.message);
              }
            } catch (error: any) {
              console.error('Error claiming item:', error);
              Alert.alert('Error', error.message || 'Failed to claim item');
            } finally {
              setClaiming(null);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: StoreItem }) => {
    const canClaim = 
      (!item.is_pro_only || isPro) && 
      userLevel >= item.level_required && 
      tokenBalance >= item.price_tokens;

    const isClaimingThis = claiming === item.id;

    return (
      <TouchableOpacity
        style={[styles.itemCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}
        onPress={() => canClaim && !isClaimingThis && handleClaimItem(item)}
        disabled={!canClaim || isClaimingThis}
        activeOpacity={0.85}
      >
        {/* Header Row */}
        <View style={styles.itemHeader}>
          <View style={[styles.itemIcon, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons 
              name={item.type === 'raffle_ticket' ? 'ticket' : 'gift'} 
              size={24} 
              color={theme.primary} 
            />
          </View>
          <View style={styles.itemHeaderText}>
            <Text style={[styles.itemName, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.requirements}>
              {item.is_pro_only && (
                <View style={[styles.badge, { backgroundColor: theme.primary + '30' }]}>
                  <Ionicons name="star" size={10} color={theme.primary} />
                  <Text style={[styles.badgeText, { color: theme.primary }]}>Pro</Text>
                </View>
              )}
              {item.level_required > 1 && (
                <View style={[styles.badge, { backgroundColor: '#E5E7EB' }]}>
                  <Text style={[styles.badgeText, { color: theme.textSecondary }]}>
                    Lvl {item.level_required}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Description */}
        {item.description && (
          <Text style={[styles.itemDescription, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.priceRow}>
            <Ionicons name="ticket" size={18} color={theme.primary} />
            <Text style={[styles.price, { color: theme.textPrimary }]}>
              {item.price_tokens} {item.price_tokens === 1 ? 'Token' : 'Tokens'}
            </Text>
          </View>

          <View
            style={[
              styles.claimButton,
              {
                backgroundColor: canClaim ? theme.primary : '#E5E7EB',
                opacity: isClaimingThis ? 0.6 : 1,
              },
            ]}
          >
            {isClaimingThis ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[styles.claimButtonText, { color: canClaim ? '#FFFFFF' : theme.textSecondary }]}>
                {canClaim ? 'Claim' : 'Locked'}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
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
          
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Store</Text>

          <View style={{ width: 40 }} />
        </View>

        {/* Pro Status Banner */}
        {!isPro && (
          <View style={[styles.banner, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
            <Ionicons name="information-circle" size={20} color={theme.primary} />
            <Text style={[styles.bannerText, { color: theme.primary }]}>
              Some items are exclusive to Pro members
            </Text>
          </View>
        )}

        {/* Item Grid */}
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cart-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No items available yet
              </Text>
            </View>
          }
        />
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
  backButton: {
    padding: 8,
    zIndex: 1,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    zIndex: 1,
  },
  tokenText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  bannerText: {
    fontSize: 14,
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  itemCard: {
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
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemHeaderText: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 12,
  },
  requirements: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
  },
  claimButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});

