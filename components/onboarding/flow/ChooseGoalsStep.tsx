import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import OnboardingShell from '../ui/OnboardingShell';
import PrimaryButton from '../ui/PrimaryButton';
import { OB } from '../ui/onboardingTheme';

const PRESET_GOALS = [
  { id: 'discipline', title: 'Build daily discipline', icon: 'flash' as const, color: '#F59E0B' },
  { id: 'health', title: 'Feel stronger & healthier', icon: 'fitness' as const, color: '#EF4444' },
  { id: 'calm', title: 'More calm & less stress', icon: 'leaf' as const, color: '#10B981' },
  { id: 'focus', title: 'Sharper focus', icon: 'bulb' as const, color: '#8B5CF6' },
  { id: 'learn', title: 'Learn something every day', icon: 'book' as const, color: '#3B82F6' },
  { id: 'confidence', title: 'Grow self-confidence', icon: 'happy' as const, color: '#EC4899' },
  { id: 'community', title: 'Stay accountable with others', icon: 'people' as const, color: '#14B8A6' },
];

interface Props {
  value: any[];
  onChange: (goals: any[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ChooseGoalsStep({ value, onChange, onNext, onBack }: Props) {
  const selectedIds = new Set(value.map((g) => g.id || g.title));

  const toggle = (g: (typeof PRESET_GOALS)[0]) => {
    if (selectedIds.has(g.id)) {
      onChange(value.filter((x) => (x.id || x.title) !== g.id));
    } else {
      onChange([
        ...value,
        {
          id: g.id,
          title: g.title,
          description: '',
          category: 'personal',
          endDate: null,
          milestones: [],
        },
      ]);
    }
  };

  return (
    <OnboardingShell
      onBack={onBack}
      showProgress={false}
      footer={
        <PrimaryButton
          label="Track these goals"
          onPress={onNext}
          disabled={value.length === 0}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Choose Your Goals</Text>
        <Text style={styles.sub}>Select what you want to track on your habit journey.</Text>

        {PRESET_GOALS.map((g, i) => {
          const on = selectedIds.has(g.id);
          return (
            <Animated.View key={g.id} entering={FadeInDown.delay(i * 40)}>
              <TouchableOpacity
                style={[styles.tile, on && styles.tileOn]}
                onPress={() => toggle(g)}
                activeOpacity={0.85}
              >
                <View style={[styles.iconCircle, { backgroundColor: g.color }]}>
                  <Ionicons name={g.icon} size={18} color="#fff" />
                </View>
                <Text style={styles.tileLabel}>{g.title}</Text>
                <View style={[styles.radio, on && styles.radioOn]}>
                  {on ? <View style={styles.radioDot} /> : null}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: OB.text,
    marginBottom: 8,
  },
  sub: {
    fontSize: 15,
    color: OB.textMuted,
    marginBottom: 20,
    lineHeight: 22,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1.5,
    borderColor: OB.border,
    backgroundColor: OB.white,
  },
  tileOn: {
    borderColor: OB.primary,
    backgroundColor: '#ECFDF5',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: OB.text,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: OB.textSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: OB.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: OB.primary,
  },
});
