import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import OnboardingShell from '../ui/OnboardingShell';
import PrimaryButton from '../ui/PrimaryButton';
import { OB } from '../ui/onboardingTheme';

const EDUCATION = [
  {
    emoji: '🌱',
    title: 'Habits compound',
    body: 'Small daily actions beat big bursts of motivation. Consistency is the real superpower.',
  },
  {
    emoji: '🧠',
    title: 'Your brain loves loops',
    body: 'Cue → action → reward. Design the loop once, and showing up gets easier every week.',
  },
  {
    emoji: '✨',
    title: 'Reflection builds awareness',
    body: 'Tracking mood and wins helps you see patterns — and change what actually matters.',
  },
  {
    emoji: '🤝',
    title: 'Accountability accelerates',
    body: 'Challenges and community turn private goals into shared progress you can feel.',
  },
  {
    emoji: '📊',
    title: 'Tracking beats willpower',
    body: 'When you see the streak, you protect it. Systems outlast mood every time.',
  },
];

const PRODUCT = [
  {
    emoji: '🚀',
    title: 'Welcome to Nutragise',
    body: 'Your all-in-one system for habits, calm, learning, and real-life challenges.',
  },
  {
    emoji: '🔥',
    title: 'Daily habits & streaks',
    body: 'Build a schedule that fits your life — and watch consistency become identity.',
  },
  {
    emoji: '🧘',
    title: 'Meditation',
    body: 'Guided sessions to settle your mind so focus and discipline come easier.',
  },
  {
    emoji: '📚',
    title: 'Microlearning',
    body: 'Bite-sized lessons every day — grow without needing an hour you don’t have.',
  },
  {
    emoji: '💭',
    title: 'Reflect',
    body: 'Prompts and mood tracking that turn chaos into clarity.',
  },
  {
    emoji: '🏆',
    title: 'Challenges & Insights',
    body: 'Compete, create, and unlock deeper Insights when you go Pro.',
  },
];

interface CarouselProps {
  slides: typeof EDUCATION;
  onDone: () => void;
  onBack: () => void;
  accent?: string;
  brandHeader?: boolean;
}

function PageIndicator({
  count,
  index,
  accent,
}: {
  count: number;
  index: number;
  accent: string;
}) {
  return (
    <View style={styles.indicators}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            i === index ? styles.indicatorLine : styles.indicatorDot,
            i === index && { backgroundColor: accent },
          ]}
        />
      ))}
    </View>
  );
}

function SegmentedCarousel({ slides, onDone, onBack, accent = OB.primary, brandHeader }: CarouselProps) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const isLast = index === slides.length - 1;

  const next = () => {
    if (isLast) onDone();
    else setIndex((i) => i + 1);
  };

  return (
    <OnboardingShell
      onBack={index === 0 ? onBack : () => setIndex((i) => i - 1)}
      showProgress={false}
      footer={<PrimaryButton label={isLast ? 'Continue' : 'Next'} onPress={next} />}
    >
      <View style={styles.body}>
        {brandHeader ? (
          <>
            <Text style={styles.brand}>NUTRAGISE</Text>
            <PageIndicator count={slides.length} index={index} accent={accent} />
          </>
        ) : (
          <PageIndicator count={slides.length} index={index} accent={accent} />
        )}

        <Animated.View key={index} entering={FadeIn.duration(280)} style={styles.center}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
          <Animated.Text entering={FadeInDown.delay(40)} style={styles.title}>
            {slide.title}
          </Animated.Text>
          <Text style={styles.bodyText}>{slide.body}</Text>
        </Animated.View>
      </View>
    </OnboardingShell>
  );
}

export function EducationCarouselStep(props: { onDone: () => void; onBack: () => void }) {
  return <SegmentedCarousel slides={EDUCATION} accent={OB.accentCoral} {...props} />;
}

export function ProductCarouselStep(props: { onDone: () => void; onBack: () => void }) {
  return <SegmentedCarousel slides={PRODUCT} brandHeader {...props} />;
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  brand: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 3,
    color: OB.text,
    marginBottom: 16,
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginBottom: 28,
  },
  indicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: OB.surfaceStrong,
  },
  indicatorLine: {
    width: 22,
    height: 5,
    borderRadius: 3,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 36,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: OB.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 25,
    color: OB.textMuted,
    textAlign: 'center',
    maxWidth: 320,
  },
});
