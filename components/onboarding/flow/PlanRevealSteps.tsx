import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import OnboardingShell from '../ui/OnboardingShell';
import PrimaryButton from '../ui/PrimaryButton';
import MemberProgressCard from '../ui/MemberProgressCard';
import { OB } from '../ui/onboardingTheme';

const { width } = Dimensions.get('window');

interface GreetingProps {
  name?: string;
  onNext: () => void;
  onBack: () => void;
}

export function GreetingStep({ name, onNext, onBack }: GreetingProps) {
  const display = name?.trim() || 'friend';
  return (
    <OnboardingShell
      onBack={onBack}
      showProgress={false}
      footer={<PrimaryButton label="Show my plan" onPress={onNext} />}
    >
      <View style={styles.center}>
        <Animated.Text entering={FadeInDown.duration(400)} style={styles.hey}>
          Hey {display} 👋
        </Animated.Text>
        <Text style={styles.sub}>
          Based on your answers, we've built a habit plan that fits where you are — and where you want to go.
        </Text>
      </View>
    </OnboardingShell>
  );
}

interface PlanProps {
  habitCount: number;
  goalCount: number;
  onNext: () => void;
  onBack: () => void;
}

export function PlanRevealStep({ habitCount, goalCount, onNext, onBack }: PlanProps) {
  return (
    <OnboardingShell
      onBack={onBack}
      showProgress={false}
      footer={<PrimaryButton label="See my 7-day journey" onPress={onNext} />}
    >
      <ScrollView contentContainerStyle={styles.planContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.planTitle}>Based on your answers, we've built a plan just for you.</Text>
        <MemberProgressCard
          streakLabel="HABITS READY"
          streakValue={`${Math.max(habitCount, 3)} set`}
          secondaryLabel="GOALS"
          secondaryValue={`${Math.max(goalCount, 1)}`}
        />
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{Math.max(habitCount, 3)}</Text>
            <Text style={styles.statLabel}>Habits</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{Math.max(goalCount, 1)}</Text>
            <Text style={styles.statLabel}>Goals</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>7</Text>
            <Text style={styles.statLabel}>Day start</Text>
          </View>
        </View>
      </ScrollView>
    </OnboardingShell>
  );
}

const JOURNEY = [
  { day: 'Day 0', title: 'Set your space', desc: 'Confirm habits & schedules', emoji: '🗓️', side: 'left' as const },
  { day: 'Day 1', title: 'First check-ins', desc: 'Complete your core habits', emoji: '✅', side: 'right' as const },
  { day: 'Day 2', title: 'Protect the streak', desc: 'Show up even when busy', emoji: '🔥', side: 'left' as const },
  { day: 'Day 3', title: 'Reflect & adjust', desc: 'Use Reflect to notice patterns', emoji: '✨', side: 'right' as const },
  { day: 'Day 5', title: 'Add momentum', desc: 'Try meditation or microlearn', emoji: '🧘', side: 'left' as const },
  { day: 'Day 7', title: 'First week review', desc: 'Celebrate — then keep going', emoji: '🏆', side: 'right' as const },
];

export function JourneyStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <OnboardingShell
      onBack={onBack}
      showProgress={false}
      footer={
        <View style={{ gap: 8 }}>
          <Text style={styles.trust}>✓ No commitment required to start free</Text>
          <PrimaryButton label="START MY JOURNEY TODAY" onPress={onNext} />
        </View>
      }
    >
      <ScrollView contentContainerStyle={styles.journeyContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.planTitle}>Your first 7 days</Text>
        <Text style={styles.journeySub}>A simple path from setup to your first streak.</Text>

        {JOURNEY.map((item, i) => (
          <Animated.View
            key={item.day}
            entering={FadeInDown.delay(i * 60)}
            style={[
              styles.journeyCard,
              item.side === 'right' ? styles.alignRight : styles.alignLeft,
            ]}
          >
            <LinearGradient
              colors={['rgba(16,185,129,0.15)', 'rgba(245,158,11,0.12)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.journeyInner}
            >
              <Text style={styles.jEmoji}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.jTitle}>
                  {item.day} — {item.title}
                </Text>
                <Text style={styles.jDesc}>{item.desc}</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        ))}
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  hey: {
    fontSize: 36,
    fontWeight: '800',
    color: OB.text,
    marginBottom: 14,
  },
  sub: {
    fontSize: 17,
    lineHeight: 26,
    color: OB.textMuted,
  },
  planContent: {
    paddingHorizontal: 22,
    paddingBottom: 16,
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: OB.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 32,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  stat: {
    flex: 1,
    backgroundColor: OB.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: OB.border,
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
    color: OB.primaryDark,
  },
  statLabel: {
    fontSize: 12,
    color: OB.textMuted,
    fontWeight: '600',
    marginTop: 4,
  },
  journeyContent: {
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  journeySub: {
    color: OB.textMuted,
    marginBottom: 18,
    fontSize: 15,
  },
  journeyCard: {
    width: width * 0.78,
    marginBottom: 12,
  },
  alignLeft: {
    alignSelf: 'flex-start',
  },
  alignRight: {
    alignSelf: 'flex-end',
  },
  journeyInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(16,185,129,0.35)',
  },
  jEmoji: { fontSize: 28 },
  jTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: OB.text,
    marginBottom: 2,
  },
  jDesc: {
    fontSize: 12,
    color: OB.textMuted,
  },
  trust: {
    textAlign: 'center',
    color: OB.primaryDark,
    fontWeight: '600',
    fontSize: 13,
  },
});
