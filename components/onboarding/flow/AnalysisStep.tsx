import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import OnboardingShell from '../ui/OnboardingShell';
import PrimaryButton from '../ui/PrimaryButton';
import { OB } from '../ui/onboardingTheme';

interface Props {
  initial: { physical: number; mental: number; social: number; emotional: number };
  potential: { physical: number; mental: number; social: number; emotional: number };
  onNext: () => void;
  onBack: () => void;
  onReady: () => void;
}

function avg(r: { physical: number; mental: number; social: number; emotional: number }) {
  return Math.round((r.physical + r.mental + r.social + r.emotional) / 4);
}

export default function AnalysisStep({ initial, potential, onNext, onBack, onReady }: Props) {
  useEffect(() => {
    onReady();
  }, []);

  const yours = avg(initial);
  const pot = avg(potential);
  const lift = pot - yours;

  return (
    <OnboardingShell
      onBack={onBack}
      showProgress={false}
      footer={<PrimaryButton label="See what holds you back" onPress={onNext} />}
    >
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Animated.Text entering={FadeInDown.duration(300)} style={styles.title}>
            Analysis Complete
          </Animated.Text>
          <Animated.View entering={ZoomIn.delay(100)} style={styles.check}>
            <Text style={styles.checkMark}>✓</Text>
          </Animated.View>
        </View>
        <Text style={styles.sub}>We've mapped where you are — and where you could be.</Text>

        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={styles.card}>
          <Text style={styles.cardIntro}>
            Your responses show clear room to grow across the pillars that matter.
          </Text>
          <View style={styles.bars}>
            <View style={styles.barCol}>
              <LinearGradient
                colors={['#F97316', '#F59E0B']}
                style={[styles.bar, { height: 40 + yours * 1.2 }]}
              >
                <Text style={styles.barPct}>{yours}%</Text>
              </LinearGradient>
              <Text style={styles.barLabel}>Starting</Text>
            </View>
            <View style={styles.barCol}>
              <LinearGradient
                colors={[OB.primary, '#34D399']}
                style={[styles.bar, { height: 40 + pot * 1.2 }]}
              >
                <Text style={styles.barPct}>{pot}%</Text>
              </LinearGradient>
              <Text style={styles.barLabel}>Potential</Text>
            </View>
          </View>
        </Animated.View>

        <Text style={styles.summary}>
          <Text style={styles.summaryAccent}>{lift}% </Text>
          upside across physical, mental, social & emotional
        </Text>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: OB.text,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: OB.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  sub: {
    color: OB.textMuted,
    fontSize: 15,
    marginBottom: 24,
  },
  card: {
    backgroundColor: OB.white,
    borderRadius: 24,
    padding: 22,
    ...OB.cardShadow,
    marginBottom: 20,
  },
  cardIntro: {
    color: OB.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 24,
    textAlign: 'center',
  },
  bars: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 36,
    minHeight: 180,
  },
  barCol: {
    alignItems: 'center',
  },
  bar: {
    width: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 14,
  },
  barPct: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  barLabel: {
    marginTop: 10,
    color: OB.textMuted,
    fontWeight: '600',
    fontSize: 13,
  },
  summary: {
    textAlign: 'center',
    color: OB.text,
    fontSize: 16,
    fontWeight: '600',
  },
  summaryAccent: {
    color: OB.accentCoral,
    fontWeight: '800',
  },
});
