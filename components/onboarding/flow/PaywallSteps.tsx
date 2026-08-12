import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import OnboardingShell from '../ui/OnboardingShell';
import PrimaryButton from '../ui/PrimaryButton';
import { OB } from '../ui/onboardingTheme';
import { iapService } from '../../../lib/iapService';

const PRO_BENEFITS: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string }[] = [
  { icon: 'infinite-outline', label: 'Unlimited meditation & microlearning' },
  { icon: 'analytics-outline', label: 'Full Insights & AI coaching' },
  { icon: 'flag-outline', label: 'Pro challenges & accountability' },
  { icon: 'gift-outline', label: 'Monthly raffle entry' },
  { icon: 'wallet-outline', label: 'Free deposits, £1 withdrawals' },
  { icon: 'flame-outline', label: 'Habit system that sticks' },
];

interface PaywallProps {
  onPurchased: () => void;
  onContinueFree: () => void;
  onBack: () => void;
}

export function PaywallStep({ onPurchased, onContinueFree, onBack }: PaywallProps) {
  const [pkg, setPkg] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    iapService.getProPackage().then(setPkg).catch(() => {});
  }, []);

  const priceLabel = pkg?.product?.priceString || '£15';
  const period = pkg?.packageType === 'ANNUAL' ? '/year' : '/month';
  const trial = useMemo(() => iapService.getTrialInfo(pkg), [pkg]);
  const billingDateLabel = iapService.formatBillingDate(trial.billingStartsOn);

  const purchase = async () => {
    setLoading(true);
    // Ensures RC is linked before the purchase sheet (needed for trial + entitlement sync)
    const { useAuthStore } = await import('../../../state/authStore');
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      await iapService.logIn(userId);
    }
    const result = await iapService.purchasePro();
    setLoading(false);
    if (result.status === 'success') {
      onPurchased();
    } else if (result.status === 'error') {
      Alert.alert('Purchase failed', result.message);
    }
  };

  const restore = async () => {
    setRestoring(true);
    const { useAuthStore } = await import('../../../state/authStore');
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      await iapService.logIn(userId);
    }
    const result = await iapService.restorePurchases();
    setRestoring(false);
    if (result.status === 'success' && iapService.hasProEntitlement(result.customerInfo)) {
      onPurchased();
    } else if (result.status === 'error') {
      Alert.alert('Restore failed', result.message);
    } else {
      Alert.alert('No Pro subscription found', 'We couldn’t find an active Pro purchase for this account.');
    }
  };

  return (
    <View style={styles.root}>
      <OnboardingShell
        onBack={onBack}
        showProgress={false}
        hideHeader={false}
        footer={
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Choose Your Plan</Text>

            <View style={styles.planCard}>
              <View style={styles.planTop}>
                <View style={styles.radioOn}>
                  <View style={styles.radioDot} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>Nutragise Pro</Text>
                  <Text style={styles.planPrice}>
                    {priceLabel}
                    <Text style={styles.planPeriod}>{period}</Text>
                  </Text>
                </View>
                <View style={styles.bestBadge}>
                  <Text style={styles.bestBadgeText}>BEST</Text>
                </View>
              </View>

              <View style={styles.trialInside}>
                <Ionicons name="sparkles" size={14} color={OB.primaryDark} />
                <Text style={styles.trialInsideText}>
                  Start with a free trial — cancel anytime
                </Text>
              </View>

              <Text style={styles.billingNote}>
                Billing starts after 1 week ({billingDateLabel}). You’ll confirm now — you won’t be
                charged until the trial ends.
              </Text>
            </View>

            <View style={styles.trustRow}>
              <Text style={styles.trust}>Cancel anytime</Text>
              <Text style={styles.trustDot}>·</Text>
              <TouchableOpacity onPress={restore} disabled={restoring} hitSlop={8}>
                {restoring ? (
                  <ActivityIndicator size="small" color={OB.textMuted} />
                ) : (
                  <Text style={styles.restoreInline}>Restore purchases</Text>
                )}
              </TouchableOpacity>
            </View>

            <PrimaryButton
              label="Start free trial"
              onPress={purchase}
              loading={loading}
              style={{ marginTop: 10 }}
            />
            <PrimaryButton
              label="Continue free"
              onPress={onContinueFree}
              variant="ghost"
              showArrow={false}
            />
          </View>
        }
      >
        <ScrollView contentContainerStyle={styles.pitch} showsVerticalScrollIndicator={false}>
          <Text style={styles.pitchTitle}>It's not about willpower.</Text>
          <Text style={styles.pitchSub}>It's about a system that actually works.</Text>

          <Text style={styles.sectionLabel}>Pro includes</Text>

          {PRO_BENEFITS.map((f, i) => (
            <Animated.View
              key={f.label}
              entering={FadeInDown.delay(40 + i * 30).duration(260)}
              style={styles.featureRow}
            >
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={18} color={OB.primaryDark} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
            </Animated.View>
          ))}
        </ScrollView>
      </OnboardingShell>
    </View>
  );
}

interface MissedProps {
  onUnlock: () => void;
  onContinueFree: () => void;
  onBack: () => void;
}

export function MissedBenefitsStep({ onUnlock, onContinueFree, onBack }: MissedProps) {
  return (
    <OnboardingShell
      onBack={onBack}
      showProgress={false}
      footer={
        <View style={{ gap: 4 }}>
          <PrimaryButton label="Unlock Pro" onPress={onUnlock} />
          <PrimaryButton
            label="Continue with Free"
            onPress={onContinueFree}
            variant="ghost"
            showArrow={false}
          />
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.missedContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.missedTitle}>Here’s what you’ll miss on Free</Text>
        <Text style={styles.missedSub}>Pro removes the caps and unlocks the full toolkit.</Text>
        {PRO_BENEFITS.map((f, i) => (
          <Animated.View
            key={f.label}
            entering={FadeInDown.delay(40 + i * 30).duration(260)}
            style={styles.featureRow}
          >
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon} size={18} color={OB.primaryDark} />
            </View>
            <Text style={styles.featureLabel}>{f.label}</Text>
          </Animated.View>
        ))}
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pitch: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  pitchTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: OB.text,
    marginBottom: 4,
  },
  pitchSub: {
    fontSize: 17,
    fontWeight: '700',
    color: OB.primaryDark,
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: OB.textMuted,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  sheet: {
    backgroundColor: OB.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    marginHorizontal: -20,
    marginBottom: -18,
    ...OB.cardShadow,
    shadowOpacity: 0.12,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: OB.text,
    marginBottom: 12,
  },
  planCard: {
    borderWidth: 2,
    borderColor: OB.primary,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#ECFDF5',
    gap: 10,
  },
  planTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioOn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: OB.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: OB.primary,
  },
  bestBadge: {
    backgroundColor: OB.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 15,
    fontWeight: '700',
    color: OB.text,
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: OB.text,
    marginTop: 2,
  },
  planPeriod: {
    fontSize: 14,
    fontWeight: '600',
    color: OB.textMuted,
  },
  trialInside: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  trialInsideText: {
    flex: 1,
    color: OB.primaryDark,
    fontWeight: '700',
    fontSize: 13,
  },
  billingNote: {
    fontSize: 12,
    lineHeight: 17,
    color: OB.textMuted,
    fontWeight: '600',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  trust: {
    color: OB.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  trustDot: {
    color: OB.textSoft,
    fontSize: 12,
    fontWeight: '700',
  },
  restoreInline: {
    color: OB.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  missedContent: {
    paddingHorizontal: 22,
    paddingBottom: 16,
  },
  missedTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: OB.text,
    marginBottom: 8,
  },
  missedSub: {
    fontSize: 15,
    color: OB.textMuted,
    lineHeight: 22,
    marginBottom: 18,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: OB.white,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: OB.border,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: OB.text,
  },
});
