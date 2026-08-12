import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import OnboardingShell from '../ui/OnboardingShell';
import PrimaryButton from '../ui/PrimaryButton';
import { OB } from '../ui/onboardingTheme';

const QUOTES = [
  { name: 'Maya', text: 'Three weeks in and my mornings finally feel mine again.' },
  { name: 'Jordan', text: 'The streaks + challenges combo is unfair — in the best way.' },
  { name: 'Sam', text: 'I stopped relying on motivation. The system does the heavy lifting.' },
];

export function TestimonialsStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <OnboardingShell
      onBack={onBack}
      showProgress={false}
      footer={<PrimaryButton label="See the path" onPress={onNext} />}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Habit benefits people feel</Text>
        <Text style={styles.sub}>Real momentum from building small, daily wins.</Text>
        {QUOTES.map((q, i) => (
          <Animated.View key={q.name} entering={FadeInDown.delay(i * 80)} style={styles.card}>
            <Text style={styles.quote}>“{q.text}”</Text>
            <Text style={styles.name}>— {q.name}</Text>
          </Animated.View>
        ))}
      </ScrollView>
    </OnboardingShell>
  );
}

export function PathChartStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  // Quit points sitting on the without-app curve
  const quitMarks = [
    { x: 78, y: 88 },
    { x: 145, y: 118 },
    { x: 210, y: 95 },
    { x: 268, y: 132 },
  ];

  return (
    <OnboardingShell
      onBack={onBack}
      showProgress={false}
      footer={<PrimaryButton label="Choose my goals" onPress={onNext} />}
    >
      <View style={styles.pathBody}>
        <Text style={styles.title}>Your path to consistency</Text>
        <Text style={styles.sub}>
          Without a system, progress resets. With Nutragise, consistency compounds.
        </Text>

        <View style={styles.chartCard}>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Without app</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendLine, { backgroundColor: OB.primary }]} />
              <Text style={styles.legendText}>With app</Text>
            </View>
          </View>

          <Svg width="100%" height={210} viewBox="0 0 320 200">
            <Defs>
              <SvgGrad id="withAppGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#34D399" />
                <Stop offset="1" stopColor={OB.primaryDark} />
              </SvgGrad>
            </Defs>

            {/* Without app — soft wavy curve that drifts / fades */}
            <Path
              d="M20 130 C 50 70, 70 70, 95 105 S 130 145, 160 110 S 200 60, 230 100 S 270 150, 300 145"
              stroke="#EF4444"
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.9}
            />

            {/* Quit marks (X) sitting on the without-app curve */}
            {quitMarks.map((m, i) => (
              <React.Fragment key={`quit-${i}`}>
                <Circle cx={m.x} cy={m.y} r={10} fill="#FEE2E2" />
                <Path
                  d={`M${m.x - 5} ${m.y - 5} L${m.x + 5} ${m.y + 5}`}
                  stroke="#B91C1C"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
                <Path
                  d={`M${m.x + 5} ${m.y - 5} L${m.x - 5} ${m.y + 5}`}
                  stroke="#B91C1C"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              </React.Fragment>
            ))}

            {/* With app — steady climb */}
            <Path
              d="M20 155 C 70 150, 100 130, 140 105 S 220 70, 300 28"
              stroke="url(#withAppGrad)"
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
            />
            <Circle cx="20" cy="155" r="5" fill={OB.primary} />
            <Circle cx="300" cy="28" r="7" fill={OB.primaryDark} />
          </Svg>

          <View style={styles.chartLabels}>
            <Text style={styles.chartLabel}>Day 1</Text>
            <Text style={[styles.chartLabel, { color: OB.primary }]}>Day 30+</Text>
          </View>

          <Text style={styles.quitHint}>✕ = times you quit your goal</Text>
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 22,
    paddingBottom: 16,
  },
  pathBody: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 8,
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
    marginBottom: 22,
    lineHeight: 22,
  },
  card: {
    backgroundColor: OB.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: OB.border,
    ...OB.cardShadow,
    shadowOpacity: 0.04,
  },
  quote: {
    fontSize: 15,
    lineHeight: 22,
    color: OB.text,
    fontWeight: '500',
    marginBottom: 10,
  },
  name: {
    color: OB.primaryDark,
    fontWeight: '700',
    fontSize: 13,
  },
  chartCard: {
    backgroundColor: OB.white,
    borderRadius: 24,
    padding: 18,
    ...OB.cardShadow,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendLine: {
    width: 22,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '700',
    color: OB.text,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  chartLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: OB.textMuted,
  },
  quitHint: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#991B1B',
  },
});
