import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { OB } from './onboardingTheme';

export type PillOption = {
  value: string;
  label: string;
  emoji?: string;
};

interface Props {
  questionNumber?: number;
  question: string;
  options: PillOption[];
  value?: string;
  onSelect: (value: string) => void;
}

export default function PillOptionList({
  question,
  options,
  value,
  onSelect,
}: Props) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.Text entering={FadeInDown.duration(320)} style={styles.question}>
        {question}
      </Animated.Text>

      <View style={styles.list}>
        {options.map((opt, i) => {
          const selected = value === opt.value;
          return (
            <Animated.View key={opt.value} entering={FadeInDown.delay(100 + i * 50).duration(300)}>
              <TouchableOpacity
                style={[styles.pill, selected && styles.pillSelected]}
                onPress={() => onSelect(opt.value)}
                activeOpacity={0.85}
              >
                <Text style={[styles.pillLabel, selected && styles.pillLabelSelected]} numberOfLines={3}>
                  {opt.emoji ? `${opt.emoji}  ` : ''}
                  {opt.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 24,
  },
  question: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 30,
    color: OB.text,
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  list: {
    gap: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OB.white,
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: OB.border,
    ...OB.cardShadow,
    shadowOpacity: 0.04,
  },
  pillSelected: {
    borderColor: OB.primary,
    backgroundColor: OB.primarySoft,
  },
  pillLabel: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    color: OB.text,
    fontWeight: '500',
  },
  pillLabelSelected: {
    fontWeight: '700',
    color: OB.primaryDark,
  },
});
