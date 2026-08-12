import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
  runOnJS,
  useAnimatedReaction,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import OnboardingShell from '../ui/OnboardingShell';
import { OB } from '../ui/onboardingTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SIZE = 200;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

const SUBS = [
  'Reading your answers…',
  'Mapping habit patterns…',
  'Scoring your starting point…',
  'Building your personal plan…',
];

interface Props {
  onDone: () => void;
  onBack: () => void;
}

export default function CalculatingStep({ onDone, onBack }: Props) {
  const progress = useSharedValue(0);
  const [pct, setPct] = React.useState(0);
  const [subIdx, setSubIdx] = React.useState(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 2800, easing: Easing.out(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(onDone)();
    });
    const id = setInterval(() => {
      setSubIdx((i) => (i + 1) % SUBS.length);
    }, 700);
    return () => clearInterval(id);
  }, []);

  useAnimatedReaction(
    () => Math.round(progress.value * 100),
    (v, prev) => {
      if (v !== prev) runOnJS(setPct)(v);
    }
  );

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRC * (1 - progress.value),
  }));

  return (
    <OnboardingShell onBack={onBack} showProgress={false}>
      <View style={styles.body}>
        <View style={styles.ringWrap}>
          <Svg width={SIZE} height={SIZE}>
            <Circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={OB.surfaceStrong}
              strokeWidth={STROKE}
              fill="none"
            />
            <AnimatedCircle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              stroke={OB.primary}
              strokeWidth={STROKE}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${CIRC} ${CIRC}`}
              animatedProps={animatedProps}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          </Svg>
          <Text style={styles.pct}>{pct}%</Text>
        </View>
        <Text style={styles.title}>Calculating</Text>
        <Text style={styles.sub}>{SUBS[subIdx]}</Text>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  ringWrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  pct: {
    position: 'absolute',
    fontSize: 42,
    fontWeight: '800',
    color: OB.text,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: OB.text,
    marginBottom: 8,
  },
  sub: {
    fontSize: 15,
    color: OB.textMuted,
  },
});
