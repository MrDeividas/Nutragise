import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { PurchasesPackage } from 'react-native-purchases';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../state/authStore';
import { iapService } from '../lib/iapService';
import { achievementsService } from '../lib/achievementsService';
import { supabase } from '../lib/supabase';
import CustomBackground from '../components/CustomBackground';

export type UpgradeToProParams = {
  UpgradeToPro: {
    subtitle?: string;
  };
};

const DARK = '#1f2937';
const MUTED = '#6B7280';

const proFeatures: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}[] = [
  {
    icon: 'infinite-outline',
    title: 'Unlimited learning & calm',
    description: 'Microlearns and meditations with no daily cap',
  },
  {
    icon: 'analytics-outline',
    title: 'Full Insights',
    description: 'Advanced tracking, AI insights, and recommendations',
  },
  {
    icon: 'gift-outline',
    title: 'Monthly raffle',
    description: 'Enter the end-of-month giveaway for prizes',
  },
  {
    icon: 'flag-outline',
    title: 'Pro challenges',
    description: 'Create custom challenges and join premium comps',
  },
  {
    icon: 'wallet-outline',
    title: 'Lower wallet fees',
    description: 'Free deposits and £1 withdrawals',
  },
];

const DEFAULT_PRICE_LABEL = '£15';
const DEFAULT_PERIOD_LABEL = '/month';

export default function UpgradeToProScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<UpgradeToProParams, 'UpgradeToPro'>>();
  const subtitle = route.params?.subtitle;

  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [proPackage, setProPackage] = useState<PurchasesPackage | null>(null);

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroTranslate = useRef(new Animated.Value(16)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;
  const listTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (user?.id) {
      achievementsService.setFlag(user.id, 'pro_modal_opened').catch(() => {});
    }

    let cancelled = false;
    (async () => {
      const pkg = await iapService.getProPackage();
      if (!cancelled) setProPackage(pkg);
    })();

    Animated.stagger(80, [
      Animated.parallel([
        Animated.timing(heroOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(heroTranslate, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]),
      Animated.parallel([
        Animated.timing(listOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(listTranslate, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
      ]),
    ]).start();

    return () => {
      cancelled = true;
    };
  }, [user?.id, heroOpacity, heroTranslate, listOpacity, listTranslate]);

  const priceLabel = proPackage?.product?.priceString || DEFAULT_PRICE_LABEL;
  const periodLabel = proPackage ? '' : DEFAULT_PERIOD_LABEL;

  const refreshProfileAfterPurchase = async () => {
    try {
      const { apiCache } = await import('../lib/apiCache');
      apiCache.clear();
    } catch {
      // Cache module is optional
    }

    if (user?.id) {
      try {
        await supabase.from('profiles').select('is_pro').eq('id', user.id).single();
      } catch {
        // Best-effort refresh; webhook is the source of truth.
      }
    }
  };

  const handleUpgrade = async () => {
    if (!user) {
      Alert.alert('Error', 'Please log in to upgrade to Pro');
      return;
    }

    try {
      setLoading(true);
      await iapService.logIn(user.id);
      const result = await iapService.purchasePro();

      if (result.status === 'cancelled') return;

      if (result.status === 'error') {
        Alert.alert('Subscription Error', result.message);
        return;
      }

      const grantedPro = iapService.hasProEntitlement(result.customerInfo);
      await refreshProfileAfterPurchase();
      navigation.goBack();

      setTimeout(() => {
        if (grantedPro) {
          Alert.alert('Welcome to Pro!', 'Your Pro subscription is now active.');
        } else {
          Alert.alert(
            'Payment Received',
            "Your purchase is being processed. Pro features will unlock shortly. If they don't appear in a few minutes, try Restore Purchases."
          );
        }
      }, 100);
    } catch (error: any) {
      console.error('Error starting Pro purchase:', error);
      Alert.alert('Subscription Error', error?.message || 'Failed to start subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (restoring) return;

    try {
      setRestoring(true);
      if (user?.id) await iapService.logIn(user.id);
      const result = await iapService.restorePurchases();

      if (result.status === 'error') {
        Alert.alert('Restore Failed', result.message);
        return;
      }

      if (result.status === 'success' && iapService.hasProEntitlement(result.customerInfo)) {
        await refreshProfileAfterPurchase();
        navigation.goBack();
        setTimeout(() => {
          Alert.alert('Pro Restored', 'Your Pro subscription has been restored.');
        }, 100);
      } else {
        Alert.alert('No Purchases Found', 'We could not find an active Pro subscription on this account.');
      }
    } catch (error: any) {
      console.error('Error restoring purchases:', error);
      Alert.alert('Restore Failed', error?.message || 'Could not restore purchases.');
    } finally {
      setRestoring(false);
    }
  };

  const storeLabel =
    Platform.OS === 'ios' ? 'Apple ID' : Platform.OS === 'android' ? 'Google Play account' : 'store account';

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={loading || restoring}
          >
            <Ionicons name="chevron-back" size={24} color={DARK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upgrade</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View
            style={{
              opacity: heroOpacity,
              transform: [{ translateY: heroTranslate }],
            }}
          >
            <LinearGradient
              colors={['#E8F6F5', '#F3F7F8', '#FCFAF9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <Text style={styles.brand}>Nutragise Pro</Text>
              <Text style={styles.headline}>Go further, every day</Text>
              <Text style={styles.support}>
                {subtitle ||
                  'Unlock unlimited habits support, deeper insights, and Pro-only rewards.'}
              </Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View
            style={[
              styles.features,
              {
                opacity: listOpacity,
                transform: [{ translateY: listTranslate }],
              },
            ]}
          >
            {proFeatures.map((feature) => (
              <View key={feature.title} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon} size={18} color={DARK} />
                </View>
                <View style={styles.featureCopy}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.priceLabel}>Membership</Text>
              <Text style={styles.priceText}>
                {priceLabel}
                {periodLabel ? <Text style={styles.pricePeriod}>{periodLabel}</Text> : null}
              </Text>
            </View>
            <Text style={styles.cancelHint}>Cancel anytime in your {storeLabel}</Text>
          </View>

          <TouchableOpacity
            style={[styles.upgradeButton, (loading || restoring) && styles.buttonDisabled]}
            onPress={handleUpgrade}
            activeOpacity={0.85}
            disabled={loading || restoring}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            )}
          </TouchableOpacity>

          <View style={styles.secondaryRow}>
            <TouchableOpacity
              onPress={handleRestore}
              activeOpacity={0.7}
              disabled={loading || restoring}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {restoring ? (
                <ActivityIndicator color={MUTED} size="small" />
              ) : (
                <Text style={styles.secondaryText}>Restore purchases</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              disabled={loading || restoring}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.secondaryText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: DARK,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  hero: {
    marginHorizontal: 16,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 26,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  brand: {
    fontSize: 30,
    fontWeight: '800',
    color: DARK,
    letterSpacing: -0.7,
    marginBottom: 8,
  },
  headline: {
    fontSize: 18,
    fontWeight: '600',
    color: DARK,
    marginBottom: 8,
  },
  support: {
    fontSize: 14,
    lineHeight: 21,
    color: MUTED,
    fontWeight: '500',
    maxWidth: 320,
  },
  features: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureCopy: {
    flex: 1,
    paddingTop: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: MUTED,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FCFAF9',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  priceText: {
    fontSize: 26,
    fontWeight: '800',
    color: DARK,
    letterSpacing: -0.4,
  },
  pricePeriod: {
    fontSize: 15,
    fontWeight: '600',
    color: MUTED,
  },
  cancelHint: {
    flex: 1,
    textAlign: 'right',
    fontSize: 11,
    lineHeight: 15,
    color: '#9CA3AF',
    fontWeight: '500',
    paddingBottom: 4,
  },
  upgradeButton: {
    backgroundColor: DARK,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    minHeight: 28,
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: MUTED,
  },
});
