import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import OnboardingShell from '../ui/OnboardingShell';
import PrimaryButton from '../ui/PrimaryButton';
import { OB } from '../ui/onboardingTheme';
import { AUTH_BRAND } from '../ui/authBrand';

interface Props {
  onStart: () => void;
  /** When set, shows “Already have an account?” under Sign up (auth landing). */
  onHaveAccount?: () => void;
  ctaLabel?: string;
}

export default function WelcomeStep({
  onStart,
  onHaveAccount,
  ctaLabel = 'Sign up',
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <OnboardingShell hideHeader showProgress={false}>
      <View style={styles.body}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.brandBlock}>
          <Text style={styles.brand}>NUTRAGISE</Text>
          <Text style={styles.tagline}>reach your peak</Text>
        </Animated.View>

        <View style={styles.mid}>
          <Animated.Text entering={FadeInDown.delay(120).duration(400)} style={styles.welcome}>
            Welcome!
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(180).duration(400)} style={styles.onePercent}>
            Nutragise helps you become 1% better each day.
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(240).duration(400)} style={styles.sub}>
            Let's build a habit system that actually sticks — starting with a short quiz about you.
          </Animated.Text>
          <Animated.View entering={FadeInUp.delay(340).duration(400)} style={styles.stars}>
            <Text style={styles.starRow}>★★★★★</Text>
            <Text style={styles.starCaption}>Loved by people building better days</Text>
          </Animated.View>
        </View>

        <Animated.View
          entering={FadeInUp.delay(400).duration(400)}
          style={[styles.ctaBlock, { paddingBottom: Math.max(12, insets.bottom) }]}
        >
          <PrimaryButton label={ctaLabel} onPress={onStart} variant="white" />
          {onHaveAccount ? (
            <TouchableOpacity
              onPress={onHaveAccount}
              activeOpacity={0.85}
              style={styles.haveAccountBtn}
            >
              <Text style={styles.haveAccount}>Already have an account?</Text>
            </TouchableOpacity>
          ) : null}
          <Text style={styles.legal}>By continuing, you agree to our Terms & Privacy Policy</Text>
        </Animated.View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: AUTH_BRAND.bodyPaddingTop,
  },
  brandBlock: {
    alignSelf: 'center',
    alignItems: 'stretch',
    marginTop: AUTH_BRAND.brandMarginTop,
  },
  brand: {
    ...AUTH_BRAND.brand,
    color: OB.text,
  },
  tagline: {
    ...AUTH_BRAND.tagline,
    color: OB.textMuted,
  },
  mid: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 8,
  },
  welcome: {
    fontSize: 42,
    fontWeight: '800',
    color: OB.text,
    marginBottom: 10,
  },
  onePercent: {
    fontSize: 17,
    fontWeight: '800',
    color: OB.text,
    lineHeight: 24,
    maxWidth: 320,
    marginBottom: 10,
  },
  sub: {
    fontSize: 16,
    lineHeight: 24,
    color: OB.textMuted,
    maxWidth: 320,
    marginBottom: 28,
  },
  stars: {
    gap: 6,
  },
  starRow: {
    color: OB.accentWarm,
    fontSize: 22,
    letterSpacing: 4,
  },
  starCaption: {
    color: OB.textSoft,
    fontSize: 13,
    fontWeight: '500',
  },
  ctaBlock: {
    gap: 12,
    alignItems: 'stretch',
    paddingTop: 8,
  },
  haveAccountBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(31, 41, 55, 0.12)',
  },
  haveAccount: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: OB.text,
  },
  legal: {
    textAlign: 'center',
    color: OB.textSoft,
    fontSize: 11,
    marginTop: 2,
  },
});
