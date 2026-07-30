import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { PurchasesPackage } from 'react-native-purchases';
import { useAuthStore } from '../state/authStore';
import { iapService } from '../lib/iapService';
import { achievementsService } from '../lib/achievementsService';
import { supabase } from '../lib/supabase';

interface Props {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  /** Optional context line shown under the header (e.g. daily limit copy). */
  subtitle?: string;
}

const proFeatures = [
  {
    icon: 'book',
    title: 'Unlimited Microlearns',
    description: 'Start as many books as you want — free is 1/day, Level 3 = 2, Level 5 = 3',
    color: '#2563EB',
  },
  {
    icon: 'leaf',
    title: 'Unlimited Meditations',
    description: 'Meditate anytime — free is 1/day, Level 3 = 2, Level 5 = 3',
    color: '#10B981',
  },
  {
    icon: 'analytics',
    title: 'Insights & Analytics',
    description: 'Advanced tracking, AI insights, and personalized recommendations',
    color: '#8B5CF6',
  },
  {
    icon: 'gift',
    title: 'Raffle Access',
    description: 'Enter the end-of-month giveaway and win prizes (tickets from Level 3)',
    color: '#EC4899',
  },
  {
    icon: 'trophy',
    title: 'Pro Challenges',
    description: 'Create custom challenges and join premium competitions',
    color: '#F59E0B',
  },
];

const DEFAULT_PRICE_LABEL = '£15';
const DEFAULT_PERIOD_LABEL = '/month';

export default function UpgradeToProModal({ visible, onClose, onUpgrade, subtitle }: Props) {
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [proPackage, setProPackage] = useState<PurchasesPackage | null>(null);

  useEffect(() => {
    if (!visible) return;
    if (user?.id) {
      achievementsService.setFlag(user.id, 'pro_modal_opened').catch(() => {});
    }

    let cancelled = false;
    (async () => {
      const pkg = await iapService.getProPackage();
      if (!cancelled) setProPackage(pkg);
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, user?.id]);

  const priceLabel = proPackage?.product?.priceString || DEFAULT_PRICE_LABEL;
  const periodLabel = proPackage ? '' : DEFAULT_PERIOD_LABEL;

  const refreshProfileAfterPurchase = async () => {
    try {
      const { apiCache } = await import('../lib/apiCache');
      apiCache.clear();
    } catch {
      // Cache module is optional — ignore if it cannot be loaded.
    }

    if (user?.id) {
      try {
        await supabase.from('profiles').select('is_pro').eq('id', user.id).single();
      } catch {
        // Best-effort refresh; webhook is the source of truth.
      }
    }

    if (onUpgrade) {
      await onUpgrade();
    }
  };

  const handleUpgrade = async () => {
    if (onUpgrade && !user) {
      onUpgrade();
      return;
    }

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
      onClose();

      setTimeout(() => {
        if (grantedPro) {
          Alert.alert(
            'Welcome to Pro!',
            'Your Pro subscription is now active.',
            [
              {
                text: 'OK',
                onPress: () => {
                  if (navigation) {
                    (navigation as any).dispatch((navigation as any).getState());
                  }
                },
              },
            ]
          );
        } else {
          Alert.alert(
            'Payment Received',
            "Your purchase is being processed. Pro features will unlock shortly. If they don't appear in a few minutes, try Restore Purchases.",
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
        onClose();
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

  const storeLabel = Platform.OS === 'ios' ? 'Apple ID' : Platform.OS === 'android' ? 'Google Play account' : 'store account';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.titleContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="star" size={20} color="#F59E0B" />
                  </View>
                  <Text style={styles.title}>Upgrade to Pro</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={22} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {subtitle ? (
                  <Text style={styles.subtitle}>{subtitle}</Text>
                ) : null}
                <View style={styles.featuresContainer}>
                  {proFeatures.map((feature, index) => (
                    <View
                      key={index}
                      style={[
                        styles.featureItem,
                        index === proFeatures.length - 1 && { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 },
                      ]}
                    >
                      <View style={[styles.featureIconContainer, { backgroundColor: `${feature.color}20` }]}>
                        <Ionicons name={feature.icon as any} size={28} color={feature.color} />
                      </View>
                      <View style={styles.featureTextContainer}>
                        <Text style={styles.featureTitle}>{feature.title}</Text>
                        <Text style={styles.featureDescription}>{feature.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.pricingContainer}>
                  <View style={styles.pricingBadge}>
                    <Text style={styles.pricingBadgeText}>PRO MEMBERSHIP</Text>
                  </View>
                  <Text style={styles.priceText}>
                    {priceLabel}
                    {periodLabel ? <Text style={styles.pricePeriod}>{periodLabel}</Text> : null}
                  </Text>
                  <Text style={styles.priceSubtext}>
                    Cancel anytime in your {storeLabel}
                  </Text>
                </View>
              </ScrollView>

              {/* Footer */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.upgradeButton, loading && styles.upgradeButtonDisabled]}
                  onPress={handleUpgrade}
                  activeOpacity={0.8}
                  disabled={loading || restoring}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons name="star" size={20} color="white" style={{ marginRight: 8 }} />
                      <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.restoreButton}
                  onPress={handleRestore}
                  activeOpacity={0.8}
                  disabled={loading || restoring}
                >
                  {restoring ? (
                    <ActivityIndicator color="#666" size="small" />
                  ) : (
                    <Text style={styles.restoreText}>Restore Purchases</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.maybeLaterButton}
                  onPress={onClose}
                  activeOpacity={0.8}
                  disabled={loading || restoring}
                >
                  <Text style={styles.maybeLaterText}>Maybe Later</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
    borderRadius: 20,
    backgroundColor: 'white',
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'rgba(245,158,11,0.15)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    maxHeight: 500,
    backgroundColor: 'white',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  featuresContainer: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  pricingContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  pricingBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  pricingBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  priceText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  pricePeriod: {
    fontSize: 14,
    fontWeight: '500',
    color: '#777',
  },
  priceSubtext: {
    fontSize: 12,
    color: '#888',
    fontWeight: '400',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#F59E0B',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  upgradeButtonDisabled: {
    opacity: 0.6,
  },
  restoreButton: {
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 4,
  },
  restoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  maybeLaterButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  maybeLaterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
});
