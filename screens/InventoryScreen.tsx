/**
 * Inventory Screen
 * Displays user's claimed items
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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { storeService, InventoryItem } from '../lib/storeService';
import CustomBackground from '../components/CustomBackground';

export default function InventoryScreen() {
  const navigation = useNavigation() as any;
  const { theme } = useTheme();
  const { user } = useAuthStore();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInventory = useCallback(async () => {
    if (!user) return;

    try {
      const userInventory = await storeService.getUserInventory(user.id);
      // Filter out items with 0 quantity
      setInventory(userInventory.filter(item => item.quantity > 0));
    } catch (error) {
      console.error('Error loading inventory:', error);
      Alert.alert('Error', 'Failed to load inventory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadInventory();
  };

  const handleUseItem = (item: InventoryItem) => {
    // Navigate based on item type
    if (item.item?.type === 'raffle_ticket') {
      navigation.navigate('Raffle');
    } else {
      Alert.alert('Item', `You have ${item.quantity} of this item`);
    }
  };

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const itemDetails = item.item;
    
    return (
      <TouchableOpacity
        style={[styles.inventoryCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}
        onPress={() => handleUseItem(item)}
      >
        {/* Item Icon */}
        <View style={[styles.itemIcon, { backgroundColor: theme.primary + '20' }]}>
          <Ionicons 
            name={itemDetails?.type === 'raffle_ticket' ? 'ticket' : 'gift'} 
            size={32} 
            color={theme.primary} 
          />
        </View>

        {/* Item Details */}
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: theme.textPrimary }]}>
            {itemDetails?.name || 'Unknown Item'}
          </Text>
          
          {itemDetails?.description && (
            <Text style={[styles.itemDescription, { color: theme.textSecondary }]} numberOfLines={2}>
              {itemDetails.description}
            </Text>
          )}

          <View style={styles.quantityRow}>
            <View style={[styles.quantityBadge, { backgroundColor: theme.primary + '30' }]}>
              <Text style={[styles.quantityText, { color: theme.primary }]}>
                Qty: {item.quantity}
              </Text>
            </View>

            <Text style={[styles.acquiredDate, { color: theme.textSecondary }]}>
              {new Date(item.acquired_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Use Button */}
        <TouchableOpacity
          style={[styles.useButton, { backgroundColor: theme.primary }]}
          onPress={() => handleUseItem(item)}
        >
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Inventory</Text>
          
          <View style={{ width: 40, zIndex: 1 }} />
        </View>

        {/* Inventory List */}
        <FlatList
          data={inventory}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Your inventory is empty
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                Claim items from the Store to get started
              </Text>
              <TouchableOpacity
                style={[styles.storeButton, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate('Store')}
              >
                <Ionicons name="cart" size={20} color="#FFFFFF" />
                <Text style={styles.storeButtonText}>Visit Store</Text>
              </TouchableOpacity>
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
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  inventoryCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  itemIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 13,
    marginBottom: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '600',
  },
  acquiredDate: {
    fontSize: 12,
  },
  useButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 24,
  },
  storeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  storeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

