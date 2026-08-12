import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Keyboard,
  Pressable,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import OnboardingShell from '../ui/OnboardingShell';
import PrimaryButton from '../ui/PrimaryButton';
import { OB } from '../ui/onboardingTheme';
import { referralService } from '../../../lib/referralService';
import { useAuthStore } from '../../../state/authStore';

const AGE_GROUPS = ['18-24', '25-34', '35-44', '45+'] as const;

interface FinallyProps {
  name: string;
  ageGroup: string;
  onChangeName: (v: string) => void;
  onChangeAgeGroup: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function DobFinallyStep({
  name,
  ageGroup,
  onChangeName,
  onChangeAgeGroup,
  onNext,
  onBack,
}: FinallyProps) {
  const canContinue = name.trim().length >= 1 && !!ageGroup;

  const selectAge = (g: string) => {
    Keyboard.dismiss();
    onChangeAgeGroup(g);
  };

  return (
    <OnboardingShell
      onBack={onBack}
      showProgress={false}
      footer={
        <PrimaryButton label="See my results" onPress={onNext} disabled={!canContinue} />
      }
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.body}>
          <Text style={styles.eyebrow}>Finally</Text>
          <Text style={styles.title}>What should we call you?</Text>
          <Text style={styles.sub}>
            Your name shows up in greetings. You'll pick a username later.
          </Text>

          <TextInput
            style={styles.nameInput}
            placeholder="Your first name"
            placeholderTextColor={OB.textSoft}
            autoCapitalize="words"
            autoCorrect={false}
            value={name}
            onChangeText={onChangeName}
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={Keyboard.dismiss}
          />

          <Text style={styles.ageLabel}>Your age group</Text>
          <View style={styles.ageRow}>
            {AGE_GROUPS.map((g, i) => {
              const on = ageGroup === g;
              return (
                <Animated.View key={g} entering={FadeInDown.delay(i * 40)} style={styles.ageWrap}>
                  <Pressable
                    style={[styles.agePill, on && styles.agePillOn]}
                    onPress={() => selectAge(g)}
                  >
                    <Text style={[styles.ageText, on && styles.ageTextOn]}>{g}</Text>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </OnboardingShell>
  );
}

interface ReferralProps {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  /** When true, do not write referral attribution (settings preview flow). */
  preview?: boolean;
}

export function ReferralFlowStep({
  value,
  onChange,
  onNext,
  onBack,
  onSkip,
  preview,
}: ReferralProps) {
  const [checking, setChecking] = useState(false);
  const user = useAuthStore((s) => s.user);

  const continueWithCode = async () => {
    const code = value.trim();
    if (!code || preview || !user) {
      onNext();
      return;
    }

    setChecking(true);
    const result = await referralService.applyReferralCode(code);
    setChecking(false);

    if (!result.ok) {
      Alert.alert('Referral code', referralService.friendlyError(result.error));
      return;
    }

    onChange(result.code || code.toUpperCase());
    onNext();
  };

  return (
    <OnboardingShell
      onBack={onBack}
      onSkip={onSkip}
      skipLabel="Skip"
      showProgress={false}
      footer={
        <PrimaryButton
          label="Continue"
          onPress={continueWithCode}
          showArrow
          loading={checking}
        />
      }
    >
      <View style={styles.body}>
        <Text style={styles.title}>Got a referral code?</Text>
        <Text style={styles.sub}>If a friend invited you, enter their code below.</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter code"
          placeholderTextColor={OB.textSoft}
          autoCapitalize="characters"
          autoCorrect={false}
          value={value}
          onChangeText={onChange}
        />
      </View>
    </OnboardingShell>
  );
}

export function RatingPromptStep({
  onNext,
  onBack,
  onRate,
}: {
  onNext: () => void;
  onBack: () => void;
  onRate: () => void;
}) {
  return (
    <OnboardingShell
      onBack={onBack}
      showProgress={false}
      footer={
        <View style={{ gap: 8 }}>
          <PrimaryButton label="Give us a rating" onPress={onRate} />
          <PrimaryButton label="Maybe later" onPress={onNext} variant="ghost" showArrow={false} />
        </View>
      }
    >
      <View style={styles.centerBody}>
        <Text style={styles.bigEmoji}>⭐</Text>
        <Text style={styles.titleCenter}>Enjoying the journey so far?</Text>
        <Text style={styles.subCenter}>
          A quick rating helps more people discover Nutragise — and keeps us building for you.
        </Text>
      </View>
    </OnboardingShell>
  );
}

export function NotificationsFlowStep({
  onEnable,
  onSkip,
  onBack,
}: {
  onEnable: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  return (
    <OnboardingShell
      onBack={onBack}
      showProgress={false}
      footer={
        <View style={{ gap: 4 }}>
          <PrimaryButton label="Enable notifications" onPress={onEnable} />
          <PrimaryButton label="Not now" onPress={onSkip} variant="ghost" showArrow={false} />
        </View>
      }
    >
      <View style={styles.centerBody}>
        <View style={styles.bell}>
          <Text style={{ fontSize: 48 }}>🔔</Text>
        </View>
        <Text style={styles.titleCenter}>Stay on track with reminders</Text>
        <Text style={styles.subCenter}>
          Get gentle reminders and motivation so you never lose sight of your goals.
        </Text>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  centerBody: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  eyebrow: {
    color: OB.primary,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: OB.text,
    marginBottom: 10,
  },
  titleCenter: {
    fontSize: 28,
    fontWeight: '800',
    color: OB.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  sub: {
    fontSize: 15,
    color: OB.textMuted,
    lineHeight: 22,
    marginBottom: 28,
  },
  subCenter: {
    fontSize: 15,
    color: OB.textMuted,
    lineHeight: 23,
    textAlign: 'center',
  },
  nameInput: {
    backgroundColor: OB.white,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 20,
    fontWeight: '700',
    color: OB.text,
    borderWidth: 1.5,
    borderColor: OB.border,
    marginBottom: 28,
  },
  ageLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: OB.text,
    marginBottom: 12,
  },
  ageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ageWrap: {
    width: '47%',
    flexGrow: 1,
  },
  agePill: {
    backgroundColor: OB.white,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: OB.border,
  },
  agePillOn: {
    borderColor: OB.primary,
    backgroundColor: OB.primarySoft,
  },
  ageText: {
    fontSize: 16,
    fontWeight: '700',
    color: OB.text,
  },
  ageTextOn: {
    color: OB.primaryDark,
  },
  input: {
    backgroundColor: OB.white,
    borderRadius: 16,
    padding: 18,
    fontSize: 18,
    fontWeight: '600',
    color: OB.text,
    borderWidth: 1.5,
    borderColor: OB.border,
    letterSpacing: 2,
    textAlign: 'center',
  },
  bigEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  bell: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: OB.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
});
