import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const GREEN = '#10B981';
const GREEN_DEEP = '#059669';
const TRACK = 'rgba(31, 41, 55, 0.12)';

const HOLD_MS = 520;
const HOLD_ARM_MS = 90;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  id: string;
  title: string;
  percent: number;
  /** Smaller ring for list cards */
  compact?: boolean;
  /** Hide title under the ring (card already shows it) */
  showTitle?: boolean;
  onPress: () => void;
  onLongPress: () => void;
};

function truncateTitle(title: string): string {
  const cleaned = (title || '').trim();
  if (cleaned.length <= 16) return cleaned;
  return `${cleaned.slice(0, 15)}…`;
}

function geometry(compact?: boolean) {
  const size = compact ? 96 : 118;
  const r = compact ? 37 : 46;
  const stroke = compact ? 7 : 8;
  return {
    size,
    cx: size / 2,
    cy: size / 2,
    r,
    stroke,
    circumference: 2 * Math.PI * r,
    tipOuter: compact ? 6 : 7,
    tipInner: compact ? 3 : 3.5,
    percentSize: compact ? 18 : 22,
  };
}

export default function FeaturedGoalCircle({
  id,
  title,
  percent,
  compact,
  showTitle = true,
  onPress,
  onLongPress,
}: Props) {
  const geo = useMemo(() => geometry(compact), [compact]);
  const basePct = Math.max(0, Math.min(100, Math.round(percent)));
  const label = useMemo(() => truncateTitle(title), [title]);
  const gradId = `goal-ring-${compact ? 'c-' : ''}${id.replace(/[^a-zA-Z0-9]/g, '')}`;

  const progress = useSharedValue(basePct);
  const isHoldingSV = useSharedValue(0);
  const circumferenceSV = useSharedValue(geo.circumference);

  const pressedRef = useRef(false);
  const holdingRef = useRef(false);
  const completedHoldRef = useRef(false);
  /** Blocks the synthetic tap that RN fires after a completed hold (even if finger stays down). */
  const suppressPressRef = useRef(false);
  const armTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState(false);

  useEffect(() => {
    circumferenceSV.value = geo.circumference;
  }, [geo.circumference, circumferenceSV]);

  useEffect(() => {
    if (!holdingRef.current && !pressedRef.current) {
      progress.value = basePct;
    }
  }, [basePct, progress]);

  const clearArmTimer = () => {
    if (armTimerRef.current) {
      clearTimeout(armTimerRef.current);
      armTimerRef.current = null;
    }
  };

  const clearFullHoldTimer = () => {
    if (fullHoldTimerRef.current) {
      clearTimeout(fullHoldTimerRef.current);
      fullHoldTimerRef.current = null;
    }
  };

  const finishHold = () => {
    if (!completedHoldRef.current) return;
    clearFullHoldTimer();
    holdingRef.current = false;
    isHoldingSV.value = 0;
    setHolding(false);
    // Stay on Update Goal even if the finger is still down / released later.
    suppressPressRef.current = true;
    onLongPress();
    progress.value = withTiming(basePct, { duration: 240 });
  };

  const markCompleteAndOpen = () => {
    if (completedHoldRef.current) return;
    if (!holdingRef.current && !pressedRef.current) return;
    completedHoldRef.current = true;
    finishHold();
  };

  const resetToBase = () => {
    cancelAnimation(progress);
    progress.value = withTiming(basePct, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
    });
  };

  const cancelHold = () => {
    clearArmTimer();
    clearFullHoldTimer();
    const wasHolding = holdingRef.current;
    const alreadyCompleted = completedHoldRef.current;
    holdingRef.current = false;
    pressedRef.current = false;
    isHoldingSV.value = 0;
    setHolding(false);
    if (alreadyCompleted) {
      // Ensure release after a finished hold never counts as a tap.
      suppressPressRef.current = true;
    } else if (wasHolding) {
      resetToBase();
    }
  };

  const beginFill = () => {
    if (!pressedRef.current || completedHoldRef.current || suppressPressRef.current) return;
    holdingRef.current = true;
    isHoldingSV.value = 1;
    setHolding(true);
    cancelAnimation(progress);
    clearFullHoldTimer();

    if (basePct >= 100) {
      progress.value = 100;
      fullHoldTimerRef.current = setTimeout(() => {
        if (holdingRef.current || pressedRef.current) {
          markCompleteAndOpen();
        }
      }, HOLD_MS);
      return;
    }

    progress.value = withTiming(
      100,
      {
        duration: HOLD_MS,
        easing: Easing.out(Easing.cubic),
      },
      (finished) => {
        if (finished && isHoldingSV.value === 1) {
          runOnJS(markCompleteAndOpen)();
        }
      }
    );
  };

  const handlePressIn = () => {
    pressedRef.current = true;
    completedHoldRef.current = false;
    suppressPressRef.current = false;
    clearArmTimer();
    clearFullHoldTimer();
    armTimerRef.current = setTimeout(beginFill, HOLD_ARM_MS);
  };

  const handlePress = () => {
    if (suppressPressRef.current || completedHoldRef.current || holdingRef.current) {
      suppressPressRef.current = false;
      completedHoldRef.current = false;
      return;
    }
    onPress();
  };

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumferenceSV.value * (1 - progress.value / 100),
  }));

  const tipAngle = (basePct / 100) * Math.PI * 2 - Math.PI / 2;
  const tipX = geo.cx + geo.r * Math.cos(tipAngle);
  const tipY = geo.cy + geo.r * Math.sin(tipAngle);
  const dash = `${geo.circumference} ${geo.circumference}`;

  return (
    <Pressable
      style={[styles.wrap, { width: geo.size + (showTitle ? 4 : 0) }]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={cancelHold}
    >
      <View
        style={[
          styles.ring,
          { width: geo.size, height: geo.size },
          holding && styles.ringHolding,
        ]}
      >
        <Svg width={geo.size} height={geo.size}>
          <Defs>
            <LinearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={GREEN} stopOpacity="1" />
              <Stop offset="100%" stopColor={GREEN_DEEP} stopOpacity="1" />
            </LinearGradient>
          </Defs>

          <Circle
            cx={geo.cx}
            cy={geo.cy}
            r={geo.r}
            stroke={TRACK}
            strokeWidth={geo.stroke}
            fill="none"
          />

          <G rotation={-90} origin={`${geo.cx}, ${geo.cy}`}>
            <AnimatedCircle
              cx={geo.cx}
              cy={geo.cy}
              r={geo.r}
              stroke={GREEN}
              strokeWidth={geo.stroke + (compact ? 4 : 6)}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={dash}
              animatedProps={animatedProps}
              opacity={holding ? 0.22 : 0.14}
            />
            <AnimatedCircle
              cx={geo.cx}
              cy={geo.cy}
              r={geo.r}
              stroke={`url(#${gradId})`}
              strokeWidth={holding ? geo.stroke + 1 : geo.stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={dash}
              animatedProps={animatedProps}
            />
          </G>

          {basePct > 0 && !holding ? (
            <>
              <Circle
                cx={tipX}
                cy={tipY}
                r={geo.tipOuter}
                fill="rgba(16, 185, 129, 0.28)"
              />
              <Circle
                cx={tipX}
                cy={tipY}
                r={geo.tipInner}
                fill="rgba(255, 255, 255, 0.85)"
              />
            </>
          ) : null}
        </Svg>

        <View style={styles.center} pointerEvents="none">
          <Text style={[styles.percent, { fontSize: geo.percentSize }]}>
            {basePct}%
          </Text>
        </View>
      </View>

      {showTitle ? (
        <Text style={[styles.title, { maxWidth: geo.size }]} numberOfLines={2}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringHolding: {
    transform: [{ scale: 1.04 }],
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    fontWeight: '300',
    color: '#1f2937',
    letterSpacing: -0.5,
  },
  title: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 2,
  },
});
