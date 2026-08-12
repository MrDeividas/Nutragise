import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { OB } from './onboardingTheme';
import OnboardingBackground from './OnboardingBackground';

interface Props {
  children: React.ReactNode;
  onBack?: () => void;
  onSkip?: () => void;
  skipLabel?: string;
  progress?: number; // 0-1
  showProgress?: boolean;
  footer?: React.ReactNode;
  contentStyle?: ViewStyle;
  hideHeader?: boolean;
}

export default function OnboardingShell({
  children,
  onBack,
  onSkip,
  skipLabel = 'Skip',
  progress,
  showProgress = true,
  footer,
  contentStyle,
  hideHeader,
}: Props) {
  const fill = useSharedValue(progress ?? 0);

  useEffect(() => {
    if (typeof progress === 'number') {
      fill.value = withTiming(progress, { duration: 420 });
    }
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(1, fill.value)) * 100}%`,
  }));

  return (
    <View style={styles.root}>
      <OnboardingBackground />

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {!hideHeader && (
          <View style={styles.header}>
            {onBack ? (
              <TouchableOpacity style={styles.circleBtn} onPress={onBack} hitSlop={12}>
                <Ionicons name="chevron-back" size={22} color={OB.text} />
              </TouchableOpacity>
            ) : (
              <View style={styles.circlePlaceholder} />
            )}

            {showProgress && typeof progress === 'number' ? (
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, barStyle]} />
              </View>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            {onSkip ? (
              <TouchableOpacity onPress={onSkip} hitSlop={12}>
                <Text style={styles.skip}>{skipLabel}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.circlePlaceholder} />
            )}
          </View>
        )}

        <Animated.View entering={FadeIn.duration(280)} style={[styles.content, contentStyle]}>
          {children}
        </Animated.View>

        {footer ? (
          <Animated.View entering={FadeInDown.delay(80).duration(320)} style={styles.footer}>
            {footer}
          </Animated.View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: OB.bg,
  },
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    gap: 12,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: OB.surfaceStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circlePlaceholder: {
    width: 40,
    height: 40,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: OB.surfaceStrong,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: OB.primary,
  },
  skip: {
    color: OB.textMuted,
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 8,
  },
});
