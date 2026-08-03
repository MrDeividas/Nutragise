/**
 * Rewards Hub — game-style Raffles / Store / Inventory in one screen
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { raffleService, Raffle, getEndOfMonthDeadline, getCountdownParts, CountdownParts, RAFFLE_ENTRY_TOKEN_COST } from '../lib/raffleService';
import { storeService, StoreItem, InventoryItem, ACCOUNTABILITY_BOOST_TYPE, ActiveBoostStatus } from '../lib/storeService';
import CustomBackground from '../components/CustomBackground';
const DARK = '#1f2937';
const GOLD = '#D4A017';
const SCREEN_W = Dimensions.get('window').width;
const STORE_GAP = 12;
const STORE_PAD = 16;
const STORE_CELL = (SCREEN_W - STORE_PAD * 2 - STORE_GAP) / 2;

type HubTab = 'raffles' | 'store' | 'inventory';

const TABS: { key: HubTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'raffles', label: 'Raffles', icon: 'trophy' },
  { key: 'store', label: 'Store', icon: 'cart' },
  { key: 'inventory', label: 'Bag', icon: 'cube' },
];

export default function RaffleScreen() {
  const navigation = useNavigation() as any;
  const route = useRoute<any>();
  const { theme } = useTheme();
  const { user } = useAuthStore();

  const initialTab: HubTab =
    route.params?.tab === 'store' || route.params?.tab === 'inventory' || route.params?.tab === 'raffles'
      ? route.params.tab
      : 'raffles';

  const [tab, setTab] = useState<HubTab>(initialTab);
  const [tabTrackWidth, setTabTrackWidth] = useState(0);
  const tabIndicatorX = useRef(new Animated.Value(0)).current;
  const tabHasPositioned = useRef(false);

  // Shared
  const [tokenBalance, setTokenBalance] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [userLevel, setUserLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Raffle
  const [currentRaffle, setCurrentRaffle] = useState<Raffle | null>(null);
  const [hasEntered, setHasEntered] = useState(false);
  const [entryCount, setEntryCount] = useState(0);
  const [entering, setEntering] = useState(false);
  const [countdown, setCountdown] = useState<CountdownParts>(() =>
    getCountdownParts(getEndOfMonthDeadline())
  );

  // Store / Inventory
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimedBoost, setClaimedBoost] = useState(false);
  const [activeBoost, setActiveBoost] = useState<ActiveBoostStatus>({
    active: false,
    expiresAt: null,
    remainingMs: 0,
  });
  const [activatingBoost, setActivatingBoost] = useState(false);

  useEffect(() => {
    if (route.params?.tab && route.params.tab !== tab) {
      setTab(route.params.tab);
    }
  }, [route.params?.tab]);

  const tabIndex = Math.max(0, TABS.findIndex((t) => t.key === tab));
  const tabWidth = tabTrackWidth > 0 ? tabTrackWidth / TABS.length : 0;

  useEffect(() => {
    if (tabWidth <= 0) return;
    const toValue = tabIndex * tabWidth;
    if (!tabHasPositioned.current) {
      tabHasPositioned.current = true;
      tabIndicatorX.setValue(toValue);
      return;
    }
    Animated.spring(tabIndicatorX, {
      toValue,
      useNativeDriver: true,
      stiffness: 230,
      damping: 24,
      mass: 0.9,
    }).start();
  }, [tabIndex, tabWidth, tabIndicatorX]);

  const getUserProfile = async () => {
    if (!user) return { level: 1, is_pro: false };
    try {
      const { supabase } = await import('../lib/supabase');
      const { data } = await supabase
        .from('profiles')
        .select('level, is_pro')
        .eq('id', user.id)
        .single();
      return data || { level: 1, is_pro: false };
    } catch {
      return { level: 1, is_pro: false };
    }
  };

  const loadAll = useCallback(async () => {
    if (!user) return;
    try {
      await raffleService.syncActiveRaffleDrawToMonthEnd();

      const [raffle, tokens, profileData, items, inv, boostStatus] = await Promise.all([
        raffleService.getCurrentRaffle(),
        storeService.getUserTokens(user.id),
        getUserProfile(),
        storeService.getStoreItems(),
        storeService.getUserInventory(user.id),
        storeService.getActiveBoostStatus(user.id),
      ]);

      setCurrentRaffle(raffle);
      setTokenBalance(tokens);
      setIsPro(!!profileData.is_pro);
      setUserLevel(profileData.level || 1);
      setStoreItems(items);
      setInventory(inv.filter((i) => i.quantity > 0));
      setClaimedBoost(inv.some((i) => i.item?.type === ACCOUNTABILITY_BOOST_TYPE));
      setActiveBoost(boostStatus);

      const raffleTicketItem = items.find((i) => i.type === 'raffle_ticket');
      let qty = 0;
      if (raffle?.ticket_item_id) {
        qty = inv.find((i) => i.item_id === raffle.ticket_item_id)?.quantity || 0;
      } else if (raffleTicketItem) {
        qty = inv.find((i) => i.item_id === raffleTicketItem.id)?.quantity || 0;
      }
      setTicketCount(qty);

      if (raffle) {
        const [entered, count] = await Promise.all([
          raffleService.hasUserEntered(user.id, raffle.id),
          raffleService.getEntryCount(raffle.id),
        ]);
        setHasEntered(entered);
        setEntryCount(count);
      } else {
        setHasEntered(false);
        setEntryCount(0);
      }
    } catch (error) {
      console.error('Error loading rewards hub:', error);
      Alert.alert('Error', 'Failed to load rewards');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Live countdown to end-of-month draw
  useEffect(() => {
    const tick = () => setCountdown(getCountdownParts(getEndOfMonthDeadline()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const handleEnterRaffle = async () => {
    if (!user || !currentRaffle) return;
    if (!isPro) {
      navigation.navigate('UpgradeToPro');
      return;
    }
    if (hasEntered) {
      Alert.alert('Already Entered', 'You have already entered this raffle. Good luck!');
      return;
    }

    if (tokenBalance < RAFFLE_ENTRY_TOKEN_COST) {
      Alert.alert(
        'Not enough diamonds',
        `Entering costs ${RAFFLE_ENTRY_TOKEN_COST} diamonds. You have ${tokenBalance}.`
      );
      return;
    }

    Alert.alert(
      'Enter Raffle',
      `Spend ${RAFFLE_ENTRY_TOKEN_COST} diamonds to enter ${currentRaffle.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enter',
          onPress: async () => {
            try {
              setEntering(true);
              const result = await raffleService.enterRaffle(user.id, currentRaffle.id);
              if (result.success) {
                if (result.newTokenBalance != null) {
                  setTokenBalance(result.newTokenBalance);
                }
                Alert.alert('Success!', result.message);
                loadAll();
              } else {
                Alert.alert('Failed', result.message);
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to enter raffle');
            } finally {
              setEntering(false);
            }
          },
        },
      ]
    );
  };

  const handleClaimItem = async (item: StoreItem) => {
    if (!user) return;
    if (item.is_pro_only && !isPro) {
      navigation.navigate('UpgradeToPro');
      return;
    }
    if (userLevel < item.level_required) {
      Alert.alert('Level Required', `Reach level ${item.level_required} to claim this.`);
      return;
    }
    if (item.type === ACCOUNTABILITY_BOOST_TYPE && claimedBoost) {
      Alert.alert('Already Claimed', 'You already claimed your Accountability Boost.');
      return;
    }
    if (tokenBalance < item.price_tokens) {
      Alert.alert(
        'Not enough tokens',
        `Need ${item.price_tokens} tokens. You have ${tokenBalance}.`
      );
      return;
    }

    const priceLabel =
      item.price_tokens <= 0
        ? 'for free'
        : `for ${item.price_tokens} token${item.price_tokens > 1 ? 's' : ''}`;

    Alert.alert('Claim Item', `Claim ${item.name} ${priceLabel}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Claim',
        onPress: async () => {
          try {
            setClaiming(item.id);
            const result = await storeService.claimItem(user.id, item.id);
            if (result.success) {
              Alert.alert(
                'Claimed!',
                item.type === ACCOUNTABILITY_BOOST_TYPE
                  ? 'Boost added to Inventory. Activate it when you want double points for 2 days.'
                  : result.message
              );
              if (typeof result.newTokenBalance === 'number') {
                setTokenBalance(result.newTokenBalance);
              }
              loadAll();
            } else {
              Alert.alert('Failed', result.message);
            }
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to claim item');
          } finally {
            setClaiming(null);
          }
        },
      },
    ]);
  };

  const handleUseInventoryItem = (item: InventoryItem) => {
    if (!user) return;

    if (item.item?.type === 'raffle_ticket') {
      setTab('raffles');
      return;
    }

    if (item.item?.type === ACCOUNTABILITY_BOOST_TYPE) {
      Alert.alert(
        'Activate Accountability Boost?',
        'Double all habit and action points for 2 days. This uses 1 boost from your inventory.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Activate',
            onPress: async () => {
              try {
                setActivatingBoost(true);
                const result = await storeService.activateAccountabilityBoost(user.id);
                if (result.success) {
                  Alert.alert('Boost Active!', result.message);
                  loadAll();
                } else {
                  Alert.alert('Failed', result.message);
                }
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to activate boost');
              } finally {
                setActivatingBoost(false);
              }
            },
          },
        ]
      );
      return;
    }

    Alert.alert('Item', `You have ${item.quantity}× ${item.item?.name || 'item'}`);
  };

  const storeIconName = (type: string): keyof typeof Ionicons.glyphMap => {
    if (type === 'raffle_ticket') return 'ticket';
    if (type === ACCOUNTABILITY_BOOST_TYPE) return 'flash';
    return 'gift';
  };

  const renderHud = () => (
    <View style={styles.hudBlock}>
      <View style={styles.hud}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerLeftButton} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={DARK} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Rewards</Text>

        <View style={styles.headerRightSpacer} />
      </View>

      <View style={styles.resourceRow}>
        <View style={styles.resourcePill}>
          <Ionicons name="diamond" size={14} color={GOLD} />
          <Text style={styles.resourceText}>{tokenBalance}</Text>
        </View>
        <View style={styles.resourcePill}>
          <Ionicons name="ticket" size={14} color={DARK} />
          <Text style={styles.resourceText}>{ticketCount}</Text>
        </View>
        {isPro && (
          <View style={[styles.resourcePill, styles.proPill]}>
            <Text style={styles.proPillText}>PRO</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderTabs = () => (
    <View
      style={styles.tabBar}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width - 8; // padding
        if (w > 0 && Math.abs(w - tabTrackWidth) > 0.5) {
          setTabTrackWidth(w);
        }
      }}
    >
      {tabWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.tabIndicator,
            {
              width: tabWidth,
              transform: [{ translateX: tabIndicatorX }],
            },
          ]}
        />
      )}
      {TABS.map((t) => {
        const active = tab === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            style={styles.tab}
            onPress={() => setTab(t.key)}
            activeOpacity={0.85}
          >
            <Ionicons name={t.icon} size={18} color={active ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderRaffles = () => {
    if (!currentRaffle) {
      return (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconRing}>
            <Ionicons name="calendar-outline" size={40} color={DARK} />
          </View>
          <Text style={styles.emptyTitle}>No active raffle</Text>
          <Text style={styles.emptySub}>Check back soon for the next giveaway</Text>
        </View>
      );
    }

    return (
      <ScrollView
        contentContainerStyle={styles.tabContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DARK} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stage}>
          <View style={styles.stageGlow} />
          <Text style={styles.stageEyebrow}>FEATURED PRIZE</Text>
          <View style={styles.trophyRing}>
            <Ionicons name="trophy" size={48} color={GOLD} />
          </View>
          <Text style={styles.stageTitle}>{currentRaffle.title}</Text>
          <Text style={styles.stagePrize}>£{currentRaffle.prize_amount}</Text>
          {currentRaffle.description ? (
            <Text style={styles.stageDesc} numberOfLines={3}>
              {currentRaffle.description}
            </Text>
          ) : null}

          <View style={styles.countdownBlock}>
            <Text style={styles.countdownLabel}>
              {countdown.isComplete ? 'DRAWING NOW' : 'DRAW AT MONTH END'}
            </Text>
            <View style={styles.countdownRow}>
              {(
                [
                  { value: countdown.days, label: 'Days' },
                  { value: countdown.hours, label: 'Hrs' },
                  { value: countdown.minutes, label: 'Min' },
                  { value: countdown.seconds, label: 'Sec' },
                ] as const
              ).map((unit, i) => (
                <React.Fragment key={unit.label}>
                  {i > 0 ? <Text style={styles.countdownSep}>:</Text> : null}
                  <View style={styles.countdownUnit}>
                    <Text style={styles.countdownValue}>
                      {String(unit.value).padStart(2, '0')}
                    </Text>
                    <Text style={styles.countdownUnitLabel}>{unit.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>

          <View style={styles.statRow}>
            <View style={styles.statChip}>
              <Ionicons name="people" size={14} color={DARK} />
              <Text style={styles.statChipText}>{entryCount} in</Text>
            </View>
            {hasEntered && (
              <View style={[styles.statChip, styles.enteredChip]}>
                <Ionicons name="checkmark-circle" size={14} color={DARK} />
                <Text style={[styles.statChipText, { color: DARK }]}>Entered</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.ctaButton,
              (hasEntered || !isPro || tokenBalance < RAFFLE_ENTRY_TOKEN_COST) && styles.ctaDisabled,
              entering && { opacity: 0.65 },
            ]}
            onPress={handleEnterRaffle}
            disabled={hasEntered || entering || !isPro || tokenBalance < RAFFLE_ENTRY_TOKEN_COST}
            activeOpacity={0.9}
          >
            {entering ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="flash" size={18} color="#FFF" />
                <Text style={styles.ctaText}>
                  {hasEntered
                    ? 'Already Entered'
                    : !isPro
                      ? 'Pro Members Only'
                      : tokenBalance < RAFFLE_ENTRY_TOKEN_COST
                        ? `Need ${RAFFLE_ENTRY_TOKEN_COST} Diamonds`
                        : 'Enter Giveaway'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {!hasEntered && isPro && (
            <Text style={styles.ctaHint}>
              Costs {RAFFLE_ENTRY_TOKEN_COST} diamonds · You have {tokenBalance}
            </Text>
          )}
          {!isPro && (
            <TouchableOpacity onPress={() => navigation.navigate('UpgradeToPro')}>
              <Text style={styles.upgradeLink}>Upgrade to Pro to enter →</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.quickLink} onPress={() => setTab('store')} activeOpacity={0.85}>
          <Ionicons name="cart" size={18} color={DARK} />
          <Text style={styles.quickLinkText}>Need tickets? Visit the Store</Text>
          <Ionicons name="chevron-forward" size={18} color={DARK} />
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderStoreItem = ({ item }: { item: StoreItem }) => {
    const alreadyClaimedBoost = item.type === ACCOUNTABILITY_BOOST_TYPE && claimedBoost;
    const canClaim =
      !alreadyClaimedBoost &&
      (!item.is_pro_only || isPro) &&
      userLevel >= item.level_required &&
      tokenBalance >= item.price_tokens;
    const claimingThis = claiming === item.id;
    const isBoost = item.type === ACCOUNTABILITY_BOOST_TYPE;

    return (
      <TouchableOpacity
        style={[styles.storeTile, !canClaim && styles.storeTileLocked]}
        onPress={() => canClaim && !claimingThis && handleClaimItem(item)}
        disabled={!canClaim || claimingThis}
        activeOpacity={0.88}
      >
        <View style={styles.storeTileTop}>
          <View style={[styles.storeIconWrap, isBoost && styles.boostIconWrap]}>
            <Ionicons
              name={storeIconName(item.type)}
              size={28}
              color={isBoost ? '#129490' : DARK}
            />
          </View>
          {item.is_pro_only && (
            <View style={styles.miniBadge}>
              <Text style={styles.miniBadgeText}>PRO</Text>
            </View>
          )}
        </View>
        <Text style={styles.storeName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.description ? (
          <Text style={styles.storeDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
        {item.level_required > 1 && (
          <Text style={styles.storeReq}>Lvl {item.level_required}</Text>
        )}
        <View style={styles.storeFooter}>
          <View style={styles.priceChip}>
            {item.price_tokens <= 0 ? (
              <Text style={styles.priceChipText}>Free</Text>
            ) : (
              <>
                <Ionicons name="diamond" size={12} color={GOLD} />
                <Text style={styles.priceChipText}>{item.price_tokens}</Text>
              </>
            )}
          </View>
          <View style={[styles.claimChip, canClaim ? styles.claimChipOn : styles.claimChipOff]}>
            {claimingThis ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={[styles.claimChipText, !canClaim && { color: '#9CA3AF' }]}>
                {alreadyClaimedBoost ? 'Claimed' : canClaim ? 'Claim' : 'Locked'}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStore = () => (
    <FlatList
      data={storeItems}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={{ gap: STORE_GAP }}
      contentContainerStyle={styles.gridContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DARK} />}
      ListHeaderComponent={
        <View>
          <View style={styles.levelNoteLight}>
            <Ionicons name="information-circle-outline" size={16} color={DARK} />
            <Text style={styles.levelNoteText}>
              Accountability Boost unlocks free at Level 2. Raffle tickets unlock at Level 3.
            </Text>
          </View>
          {activeBoost.active ? (
            <View style={styles.boostBanner}>
              <Ionicons name="flash" size={16} color="#129490" />
              <Text style={styles.boostBannerText}>
                2× points active · ends{' '}
                {activeBoost.expiresAt
                  ? new Date(activeBoost.expiresAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : 'soon'}
              </Text>
            </View>
          ) : null}
          {!isPro ? (
            <TouchableOpacity
              style={styles.proBanner}
              onPress={() => navigation.navigate('UpgradeToPro')}
              activeOpacity={0.85}
            >
              <Ionicons name="star" size={16} color={GOLD} />
              <Text style={styles.proBannerText}>Some loot is Pro-only — tap to upgrade</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      }
      renderItem={renderStoreItem}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Store is empty</Text>
        </View>
      }
    />
  );

  const renderInventoryItem = ({ item }: { item: InventoryItem }) => {
    const isBoost = item.item?.type === ACCOUNTABILITY_BOOST_TYPE;
    return (
      <TouchableOpacity
        style={styles.invTile}
        onPress={() => !activatingBoost && handleUseInventoryItem(item)}
        activeOpacity={0.88}
        disabled={activatingBoost}
      >
        <View style={styles.qtyBadge}>
          <Text style={styles.qtyBadgeText}>×{item.quantity}</Text>
        </View>
        <View style={[styles.invIconWrap, isBoost && styles.boostIconWrap]}>
          <Ionicons
            name={storeIconName(item.item?.type || '')}
            size={30}
            color={isBoost ? '#129490' : DARK}
          />
        </View>
        <Text style={styles.invName} numberOfLines={2}>
          {item.item?.name || 'Item'}
        </Text>
        <Text style={styles.invUse}>
          {item.item?.type === 'raffle_ticket'
            ? 'Use in Raffles'
            : isBoost
              ? 'Tap to activate'
              : 'Tap for info'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderInventory = () => (
    <FlatList
      data={inventory}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={{ gap: STORE_GAP }}
      contentContainerStyle={styles.gridContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DARK} />}
      ListHeaderComponent={
        activeBoost.active ? (
          <View style={styles.boostBanner}>
            <Ionicons name="flash" size={16} color="#129490" />
            <Text style={styles.boostBannerText}>
              2× points active · ends{' '}
              {activeBoost.expiresAt
                ? new Date(activeBoost.expiresAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })
                : 'soon'}
            </Text>
          </View>
        ) : null
      }
      renderItem={renderInventoryItem}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconRing}>
            <Ionicons name="cube-outline" size={40} color={DARK} />
          </View>
          <Text style={styles.emptyTitle}>Inventory empty</Text>
          <Text style={styles.emptySub}>Claim items from the Store</Text>
          <TouchableOpacity style={styles.ctaButton} onPress={() => setTab('store')}>
            <Ionicons name="cart" size={18} color="#FFF" />
            <Text style={styles.ctaText}>Open Store</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );

  if (loading) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={DARK} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {renderHud()}
        {renderTabs()}

        <View style={styles.panel}>
          {tab === 'raffles' && renderRaffles()}
          {tab === 'store' && renderStore()}
          {tab === 'inventory' && renderInventory()}
        </View>
      </SafeAreaView>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  safe: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hudBlock: {
    paddingBottom: 8,
  },
  hud: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 16,
    position: 'relative',
  },
  headerLeftButton: {
    width: 36,
    height: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 10,
  },
  headerRightSpacer: {
    width: 36,
    height: 24,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: DARK,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 0,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  hudTitle: {
    flex: 1,
    color: DARK,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  resourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  resourceText: { color: DARK, fontWeight: '700', fontSize: 13 },
  proPill: { backgroundColor: DARK, borderColor: DARK },
  proPillText: { color: '#FFFFFF', fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },

  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    gap: 0,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 12,
    backgroundColor: DARK,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    zIndex: 1,
  },
  tabActive: {
    backgroundColor: DARK,
  },
  tabLabel: {
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '700',
  },
  tabLabelActive: { color: '#FFFFFF' },

  panel: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    overflow: 'hidden',
  },
  tabContent: { padding: 16, paddingBottom: 40 },
  gridContent: { padding: STORE_PAD, paddingBottom: 40, gap: STORE_GAP },

  stage: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  stageGlow: {
    position: 'absolute',
    top: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(212,160,23,0.1)',
  },
  stageEyebrow: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 14,
  },
  trophyRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'rgba(212,160,23,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  stageTitle: {
    color: DARK,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  stagePrize: {
    color: DARK,
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 8,
  },
  stageDesc: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  countdownBlock: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  countdownLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  countdownUnit: {
    alignItems: 'center',
    minWidth: 52,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  countdownValue: {
    color: DARK,
    fontSize: 22,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  countdownUnitLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  countdownSep: {
    color: DARK,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
  },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 18 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  enteredChip: {
    backgroundColor: 'rgba(31,41,55,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(31,41,55,0.2)',
  },
  statChipText: { color: DARK, fontSize: 12, fontWeight: '600' },

  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DARK,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    alignSelf: 'stretch',
  },
  ctaDisabled: { backgroundColor: '#D1D5DB' },
  ctaText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  ctaHint: { color: '#6B7280', fontSize: 12, marginTop: 10 },
  upgradeLink: { color: DARK, fontSize: 13, fontWeight: '700', marginTop: 12 },
  levelNoteLight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 10,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  levelNoteText: {
    flex: 1,
    color: DARK,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },

  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickLinkText: { flex: 1, color: DARK, fontWeight: '700', fontSize: 14 },

  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  proBannerText: { color: DARK, fontSize: 13, fontWeight: '600', flex: 1 },

  storeTile: {
    width: STORE_CELL,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 168,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  storeTileLocked: { opacity: 0.72 },
  storeTileTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  storeIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniBadge: {
    backgroundColor: DARK,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    height: 20,
  },
  miniBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  storeName: { color: DARK, fontSize: 14, fontWeight: '800', minHeight: 36 },
  storeDesc: { color: '#6B7280', fontSize: 11, lineHeight: 15, marginTop: 2, marginBottom: 4 },
  storeReq: { color: '#6B7280', fontSize: 11, marginTop: 2, marginBottom: 8 },
  boostIconWrap: {
    backgroundColor: 'rgba(18, 148, 144, 0.12)',
  },
  boostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(18, 148, 144, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(18, 148, 144, 0.25)',
  },
  boostBannerText: {
    flex: 1,
    color: '#129490',
    fontSize: 13,
    fontWeight: '700',
  },
  storeFooter: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(212,160,23,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceChipText: { color: DARK, fontWeight: '800', fontSize: 13 },
  claimChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 58,
    alignItems: 'center',
  },
  claimChipOn: { backgroundColor: DARK },
  claimChipOff: { backgroundColor: '#E5E7EB' },
  claimChipText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  invTile: {
    width: STORE_CELL,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    minHeight: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  qtyBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: DARK,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    zIndex: 1,
  },
  qtyBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  invIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  invName: { color: DARK, fontSize: 14, fontWeight: '800', textAlign: 'center', minHeight: 36 },
  invUse: { color: '#6B7280', fontSize: 11, marginTop: 4, fontWeight: '600' },

  emptyWrap: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(31,41,55,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { color: DARK, fontSize: 17, fontWeight: '800', marginBottom: 6 },
  emptySub: { color: '#6B7280', fontSize: 13, textAlign: 'center', marginBottom: 18 },
});
