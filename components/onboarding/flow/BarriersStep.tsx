import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import OnboardingShell from '../ui/OnboardingShell';
import PrimaryButton from '../ui/PrimaryButton';
import { OB } from '../ui/onboardingTheme';

const SECTIONS = [
  {
    title: 'Daily',
    items: [
      { id: 'inconsistent', label: 'Inconsistent **schedule** — I start strong then fade' },
      { id: 'energy', label: '**Low energy** in the mornings or evenings' },
      { id: 'distraction', label: 'Constant **distraction** from phone & noise' },
    ],
  },
  {
    title: 'Mindset',
    items: [
      { id: 'accountability', label: 'No real **accountability** or community' },
      { id: 'unclear', label: '**Unclear goals** — I want progress but feel lost' },
      { id: 'burnout', label: '**Burnout** from trying to change everything at once' },
    ],
  },
];

function renderLabel(raw: string) {
  const parts = raw.split(/\*\*(.*?)\*\*/g);
  return parts.map((p, i) =>
    i % 2 === 1 ? (
      <Text key={i} style={styles.bold}>
        {p}
      </Text>
    ) : (
      <Text key={i}>{p}</Text>
    )
  );
}

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function BarriersStep({ value, onChange, onNext, onBack }: Props) {
  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  };

  return (
    <OnboardingShell
      onBack={onBack}
      showProgress={false}
      footer={
        <PrimaryButton
          label="Build my system"
          onPress={onNext}
          disabled={value.length === 0}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>What's in the way?</Text>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Knowing your barriers is the first step to designing habits that stick.
          </Text>
        </View>
        <Text style={styles.prompt}>Select anything that sounds familiar:</Text>

        {SECTIONS.map((section, si) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, i) => {
              const selected = value.includes(item.id);
              return (
                <Animated.View key={item.id} entering={FadeInDown.delay(si * 80 + i * 40)}>
                  <TouchableOpacity
                    style={[styles.row, selected && styles.rowSelected]}
                    onPress={() => toggle(item.id)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.check, selected && styles.checkOn]}>
                      {selected ? <Text style={styles.checkMark}>✓</Text> : null}
                    </View>
                    <Text style={styles.rowText}>{renderLabel(item.label)}</Text>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: OB.text,
    textAlign: 'center',
    marginBottom: 14,
  },
  banner: {
    backgroundColor: OB.accentCoral,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  bannerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    textAlign: 'center',
  },
  prompt: {
    color: OB.text,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 14,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: OB.text,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OB.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1.5,
    borderColor: OB.border,
  },
  rowSelected: {
    borderColor: OB.primary,
    backgroundColor: OB.primarySoft,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: OB.textSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: {
    backgroundColor: OB.primary,
    borderColor: OB.primary,
  },
  checkMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  rowText: {
    flex: 1,
    color: OB.text,
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '800',
  },
});
