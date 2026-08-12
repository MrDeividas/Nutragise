import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import OnboardingShell from '../ui/OnboardingShell';
import PrimaryButton from '../ui/PrimaryButton';
import { OB } from '../ui/onboardingTheme';

const ALL_7_DAYS = [true, true, true, true, true, true, true];

const COMPULSORY = ['sleep', 'reflect', 'run', 'update_goal'] as const;
const HOT = new Set(['gym', 'meditation', 'focus']);

const HABITS = [
  { id: 'sleep', name: 'Sleep', emoji: '😴', color: '#6366F1' },
  { id: 'reflect', name: 'Reflect', emoji: '✨', color: '#A855F7' },
  { id: 'run', name: 'Exercise', emoji: '🏃', color: '#EF4444' },
  { id: 'update_goal', name: 'Update Goal', emoji: '📝', color: '#EC4899' },
  { id: 'gym', name: 'Gym', emoji: '💪', color: '#F97316', hot: true },
  { id: 'meditation', name: 'Meditation', emoji: '🧘', color: '#14B8A6', hot: true },
  { id: 'focus', name: 'Focus', emoji: '🎯', color: '#10B981', hot: true },
  { id: 'water', name: 'Water', emoji: '💧', color: '#3B82F6' },
  { id: 'microlearn', name: 'Microlearn', emoji: '📚', color: '#F59E0B' },
  { id: 'screen_time', name: 'Screen Time', emoji: '📱', color: '#64748B' },
  { id: 'cold_shower', name: 'Cold Shower', emoji: '🚿', color: '#0EA5E9' },
];

interface Props {
  selectedHabits: string[];
  onChange: (data: {
    selectedHabits: string[];
    habitFrequencies: Record<string, boolean[]>;
    isPremium: boolean;
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

function buildFrequencies(ids: string[]) {
  const frequencies: Record<string, boolean[]> = {};
  ids.forEach((habitId) => {
    frequencies[habitId] = ALL_7_DAYS;
  });
  return frequencies;
}

export default function HabitPickStep({ selectedHabits, onChange, onNext, onBack }: Props) {
  // Auto-select compulsory habits on mount
  useEffect(() => {
    const missing = COMPULSORY.filter((id) => !selectedHabits.includes(id));
    if (missing.length === 0) return;
    const next = [...new Set([...COMPULSORY, ...selectedHabits])];
    onChange({
      selectedHabits: next,
      habitFrequencies: buildFrequencies(next),
      isPremium: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id: string) => {
    if (COMPULSORY.includes(id as (typeof COMPULSORY)[number]) && selectedHabits.includes(id)) {
      return; // can't deselect compulsory
    }

    let next: string[];
    if (selectedHabits.includes(id)) {
      next = selectedHabits.filter((h) => h !== id);
    } else {
      next = [...selectedHabits, id];
    }

    // Always keep compulsory selected
    next = [...new Set([...COMPULSORY, ...next])];

    onChange({
      selectedHabits: next,
      habitFrequencies: buildFrequencies(next),
      isPremium: false,
    });
  };

  const count = selectedHabits.length;
  const canContinue = COMPULSORY.every((id) => selectedHabits.includes(id));

  return (
    <OnboardingShell
      onBack={onBack}
      showProgress={false}
      footer={
        <PrimaryButton
          label={`Track ${count} habit${count === 1 ? '' : 's'}`}
          onPress={onNext}
          disabled={!canContinue}
        />
      }
    >
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Pick your habits</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{count} selected</Text>
          </View>
        </View>
        <Text style={styles.sub}>
          Some habits are compulsory on this app. Add anything else you want to track.
        </Text>

        <View style={styles.grid}>
          {HABITS.map((h, i) => {
            const on = selectedHabits.includes(h.id);
            const locked = COMPULSORY.includes(h.id as (typeof COMPULSORY)[number]);
            const isHot = HOT.has(h.id);
            return (
              <Animated.View
                key={h.id}
                entering={FadeInDown.delay(i * 25)}
                style={styles.cell}
              >
                <TouchableOpacity
                  style={[styles.tile, on && styles.tileOn]}
                  onPress={() => toggle(h.id)}
                  activeOpacity={locked ? 1 : 0.85}
                >
                  {isHot && (
                    <View style={styles.hotBadge}>
                      <Text style={styles.hotText}>HOT</Text>
                    </View>
                  )}
                  <View style={[styles.check, on && styles.checkOn, locked && on && styles.checkLocked]}>
                    {on ? <Text style={styles.checkMark}>✓</Text> : null}
                  </View>
                  <View style={[styles.iconCircle, { backgroundColor: h.color }]}>
                    <Text style={styles.emoji}>{h.emoji}</Text>
                  </View>
                  <Text style={[styles.tileLabel, on && styles.tileLabelOn]} numberOfLines={1}>
                    {h.name}
                  </Text>
                  {locked && <Text style={styles.coreLabel}>Core</Text>}
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          <Animated.View
            entering={FadeInDown.delay(HABITS.length * 25)}
            style={styles.cell}
          >
            <View style={[styles.tile, styles.comingSoonTile]}>
              <View style={[styles.iconCircle, { backgroundColor: OB.surfaceStrong }]}>
                <Text style={styles.emoji}>➕</Text>
              </View>
              <Text style={styles.comingSoonLabel} numberOfLines={2}>
                Custom habits
              </Text>
              <Text style={styles.comingSoonHint}>Add later</Text>
            </View>
          </Animated.View>
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: OB.text,
  },
  sub: {
    fontSize: 14,
    color: OB.textMuted,
    marginBottom: 12,
    lineHeight: 20,
  },
  badge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    color: OB.primaryDark,
    fontWeight: '700',
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  cell: {
    width: '48.5%',
  },
  tile: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: OB.border,
    backgroundColor: OB.white,
    minHeight: 96,
    justifyContent: 'center',
  },
  tileOn: {
    borderColor: OB.primary,
    backgroundColor: '#ECFDF5',
  },
  hotBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hotText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  check: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: OB.textSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: OB.primary,
    borderColor: OB.primary,
  },
  checkLocked: {
    backgroundColor: OB.primaryDark,
  },
  checkMark: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emoji: {
    fontSize: 17,
  },
  tileLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: OB.text,
    textAlign: 'center',
  },
  tileLabelOn: {
    color: OB.primaryDark,
  },
  coreLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
    color: OB.textMuted,
    letterSpacing: 0.3,
  },
  comingSoonTile: {
    backgroundColor: OB.white,
    borderStyle: 'dashed',
    borderColor: OB.border,
    borderWidth: 1.5,
  },
  comingSoonLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: OB.textMuted,
    textAlign: 'center',
  },
  comingSoonHint: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
    color: OB.textSoft,
    letterSpacing: 0.3,
  },
});
