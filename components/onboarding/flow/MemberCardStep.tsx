import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import OnboardingShell from '../ui/OnboardingShell';
import PrimaryButton from '../ui/PrimaryButton';
import MemberProgressCard from '../ui/MemberProgressCard';
import { OB } from '../ui/onboardingTheme';

interface Props {
  onNext: () => void;
  onBack?: () => void;
}

export default function MemberCardStep({ onNext, onBack }: Props) {
  return (
    <OnboardingShell
      onBack={onBack}
      showProgress={false}
      footer={<PrimaryButton label="Next" onPress={onNext} />}
    >
      <View style={styles.body}>
        <Animated.Text entering={FadeInDown.duration(350)} style={styles.title}>
          Let's Go!
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(60).duration(350)} style={styles.sub}>
          Welcome to Nutragise. Here's your habit journey card.
        </Animated.Text>

        <Animated.View entering={ZoomIn.delay(150).duration(420)} style={styles.cardWrap}>
          <MemberProgressCard streakValue="0 days" badge="MEMBER" />
        </Animated.View>

        <Text style={styles.hint}>Now, let's build the app around you.</Text>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: OB.text,
    marginBottom: 8,
  },
  sub: {
    fontSize: 16,
    lineHeight: 24,
    color: OB.textMuted,
    marginBottom: 36,
  },
  cardWrap: {
    marginBottom: 28,
  },
  hint: {
    textAlign: 'center',
    color: OB.textSoft,
    fontSize: 14,
    fontWeight: '500',
  },
});
