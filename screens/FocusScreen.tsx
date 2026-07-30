import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  AppState,
  AppStateStatus,
  Platform,
  Animated,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreventRemove } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../state/authStore';
import { useActionStore } from '../state/actionStore';
import CustomBackground from '../components/CustomBackground';
import Svg, { Circle } from 'react-native-svg';

const DARK = '#1f2937';
const PAGE_BG = '#F8F9FB';
const PRESETS = ['20', '30', '40'] as const;

function FocusScreen({ navigation }: any) {
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  const [duration, setDuration] = useState<string>('30');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [notes, setNotes] = useState('');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const startMsRef = useRef<number>(0);
  const endMsRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const totalPausedTimeRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const appStateRef = useRef(AppState.currentState);

  const progressAnimation = useRef(new Animated.Value(0)).current;
  const RING_RADIUS = 150;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  const canExitRef = useRef<boolean>(false);

  const durationInSeconds = parseInt(duration) * 60;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    const durationNum = parseInt(duration);
    if (isNaN(durationNum) || durationNum < 10) {
      Alert.alert('Invalid Duration', 'Please enter a duration of at least 10 minutes.');
      return;
    }
    if (durationInSeconds <= 0) {
      Alert.alert('Invalid Duration', 'Please enter a valid duration in minutes.');
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    isPausedRef.current = false;
    setTimeRemaining(durationInSeconds);
    startTimeRef.current = Date.now();
    startMsRef.current = startTimeRef.current;
    endMsRef.current = startMsRef.current + durationInSeconds * 1000;
    pausedTimeRef.current = 0;
    totalPausedTimeRef.current = 0;

    progressAnimation.setValue(0);

    const updateTimer = () => {
      if (isPausedRef.current) return;

      const now = Date.now();
      const remainingMs = Math.max(0, endMsRef.current - now);
      const remainingSec = Math.floor(remainingMs / 1000);
      setTimeRemaining(remainingSec);

      const elapsedMs = durationInSeconds * 1000 - remainingMs;
      const elapsedFraction =
        durationInSeconds > 0 ? Math.max(0, Math.min(1, elapsedMs / (durationInSeconds * 1000))) : 0;

      Animated.timing(progressAnimation, {
        toValue: elapsedFraction,
        duration: 100,
        useNativeDriver: false,
      }).start();

      if (remainingSec === 0) {
        completeFocus();
      }
    };

    intervalRef.current = setInterval(updateTimer, 50);
  };

  const pauseTimer = useCallback(() => {
    if (!isRunning || isPaused || isCompleted) return;
    setIsPaused(true);
    isPausedRef.current = true;
    pausedAtRef.current = Date.now();
  }, [isRunning, isPaused, isCompleted]);

  const resumeTimer = useCallback(() => {
    if (!isRunning || !isPaused || isCompleted) return;
    const pausedDuration = Date.now() - pausedAtRef.current;
    totalPausedTimeRef.current += pausedDuration;
    endMsRef.current += pausedDuration;
    setIsPaused(false);
    isPausedRef.current = false;
  }, [isRunning, isPaused, isCompleted]);

  const completeFocus = async () => {
    setIsRunning(false);
    setIsPaused(false);
    isPausedRef.current = false;
    setIsCompleted(true);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      const { user: authUser } = useAuthStore.getState();
      const userId = authUser?.id;

      if (!userId) {
        Alert.alert('Error', 'You must be logged in. Please try restarting the app.');
        return;
      }

      const startTime = new Date(startTimeRef.current).toISOString();
      const endTime = new Date().toISOString();

      const habitData = {
        date: new Date().toISOString().split('T')[0],
        focus_duration: parseInt(duration),
        focus_start_time: startTime,
        focus_end_time: endTime,
        focus_notes: notes.trim(),
        focus_completed: true,
      };

      const success = await useActionStore.getState().saveDailyHabits(habitData);

      if (success) {
        Alert.alert('Focus Complete', `Great job! You focused for ${duration} minutes.`, [
          { text: 'Continue', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', 'Failed to save focus session. Please try again.');
      }
    } catch (error) {
      console.error('Error completing focus:', error);
      Alert.alert('Error', 'Failed to save focus session. Please try again.');
    }
  };

  const cancelFocus = useCallback(() => {
    Alert.alert(
      'Cancel Focus Session?',
      'Are you sure you want to cancel this focus session? This will mark it as incomplete.',
      [
        { text: 'Keep Focusing', style: 'cancel' },
        {
          text: 'Cancel Session',
          style: 'destructive',
          onPress: () => {
            setIsRunning(false);
            setIsPaused(false);
            isPausedRef.current = false;
            setTimeRemaining(0);
            progressAnimation.stopAnimation();

            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            canExitRef.current = true;
            setTimeout(() => {
              try {
                navigation.goBack();
              } catch {
                // no-op
              }
            }, 0);
          },
        },
      ]
    );
  }, [navigation, progressAnimation]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        if (isRunning && !isPaused && !isCompleted) {
          pauseTimer();
        }
      } else if (appStateRef.current.match(/inactive|background/) && nextAppState.match(/active/)) {
        if (isRunning && isPaused && !isCompleted) {
          Alert.alert('Focus Session Paused', 'Your focus session was paused. Would you like to continue?', [
            { text: 'Resume', onPress: resumeTimer },
            { text: 'Cancel Session', style: 'destructive', onPress: cancelFocus },
          ]);
        }
      }
      appStateRef.current = nextAppState;
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isRunning, isPaused, isCompleted, pauseTimer, resumeTimer, cancelFocus]);

  usePreventRemove(isRunning && !isCompleted && !canExitRef.current, () => {
    if (isRunning && !isCompleted) {
      cancelFocus();
    }
  });

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <CustomBackground>
      <View style={[styles.root, { backgroundColor: PAGE_BG }]}>
        <SafeAreaView edges={['top']} style={styles.headerSafe}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (isRunning && !isCompleted) {
                  cancelFocus();
                } else {
                  navigation.goBack();
                }
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={22} color={DARK} />
            </TouchableOpacity>
            <View style={styles.headerTextCol}>
              <Text style={styles.headerTitle}>Focus Duration</Text>
              <Text style={styles.headerSubtitle}>
                {isRunning || isCompleted ? 'Stay with the session' : 'Set a block and start'}
              </Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>

        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              {!isRunning && !isCompleted && (
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={styles.setupScroll}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.card}>
                    <Text style={styles.cardHint}>
                      Set your focus duration and eliminate distractions for deep, productive work.
                    </Text>
                  </View>

                  <View style={styles.card}>
                    <Text style={styles.cardLabel}>Quick select</Text>
                    <View style={styles.presetRow}>
                      {PRESETS.map((mins) => {
                        const selected = duration === mins;
                        return (
                          <TouchableOpacity
                            key={mins}
                            style={[styles.presetBtn, selected && styles.presetBtnSelected]}
                            onPress={() => setDuration(mins)}
                            activeOpacity={0.88}
                          >
                            <Text style={[styles.presetMins, selected && styles.presetTextSelected]}>
                              {mins}
                            </Text>
                            <Text style={[styles.presetUnit, selected && styles.presetTextSelected]}>
                              min
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.card}>
                    <Text style={styles.cardLabel}>Custom duration</Text>
                    <View style={styles.customRow}>
                      <TextInput
                        style={styles.durationInput}
                        value={duration}
                        onChangeText={(text) => {
                          const numericValue = text.replace(/[^0-9]/g, '');
                          if (numericValue === '' || parseInt(numericValue) >= 10) {
                            setDuration(numericValue);
                          }
                        }}
                        placeholder="30"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        maxLength={3}
                      />
                      <Text style={styles.durationUnit}>minutes</Text>
                    </View>
                    <Text style={styles.helperText}>Minimum 10 minutes</Text>
                  </View>

                  <TouchableOpacity style={styles.primaryBtn} onPress={startTimer} activeOpacity={0.88}>
                    <Ionicons name="play" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>Begin Focus Session</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}

              {(isRunning || isCompleted) && (
                <View style={styles.timerSection}>
                  <View style={styles.timerContainer}>
                    <View style={styles.timerRingWrapper}>
                      <Svg width={320} height={320} style={styles.timerSvg}>
                        <Circle
                          cx={160}
                          cy={160}
                          r={150}
                          stroke="#E5E7EB"
                          strokeWidth={12}
                          fill="none"
                        />
                        <AnimatedCircle
                          cx={160}
                          cy={160}
                          r={RING_RADIUS}
                          stroke={isCompleted ? '#16A34A' : DARK}
                          strokeWidth={12}
                          fill="none"
                          strokeDasharray={RING_CIRCUMFERENCE}
                          strokeDashoffset={progressAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [RING_CIRCUMFERENCE, 0],
                          })}
                          strokeLinecap="round"
                          transform="rotate(-90 160 160)"
                        />
                      </Svg>

                      <View style={styles.timerDisplay}>
                        <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                        <Text style={styles.timerLabel}>
                          {isCompleted ? 'Complete' : isPaused ? 'Paused' : 'remaining'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.card}>
                    <Text style={styles.cardLabel}>Focus task</Text>
                    <TextInput
                      style={styles.notesInput}
                      value={notes}
                      onChangeText={(text) => {
                        if (text.length > 0) {
                          setNotes(text[0].toUpperCase() + text.slice(1));
                        } else {
                          setNotes(text);
                        }
                      }}
                      placeholder="What are you working on?"
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={2}
                      editable={!isCompleted && !isPaused}
                      autoCapitalize="sentences"
                      autoCorrect
                      blurOnSubmit
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                  </View>

                  {isRunning && !isCompleted && (
                    <TouchableOpacity
                      style={[styles.secondaryBtn, isPaused && styles.primaryBtn]}
                      onPress={isPaused ? resumeTimer : pauseTimer}
                      activeOpacity={0.88}
                    >
                      <Ionicons
                        name={isPaused ? 'play' : 'pause'}
                        size={18}
                        color={isPaused ? '#FFFFFF' : DARK}
                      />
                      <Text style={[styles.secondaryBtnText, isPaused && styles.primaryBtnText]}>
                        {isPaused ? 'Resume' : 'Pause'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {isRunning && (
                    <TouchableOpacity style={styles.endBtn} onPress={cancelFocus} activeOpacity={0.88}>
                      <Text style={styles.endBtnText}>End Session</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerSafe: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: DARK,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
  },
  setupScroll: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    marginBottom: 12,
  },
  cardHint: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    minHeight: 72,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  presetBtnSelected: {
    backgroundColor: DARK,
    borderColor: DARK,
  },
  presetMins: {
    fontSize: 22,
    fontWeight: '800',
    color: DARK,
  },
  presetUnit: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  presetTextSelected: {
    color: '#FFFFFF',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  durationInput: {
    fontSize: 36,
    fontWeight: '800',
    color: DARK,
    textAlign: 'center',
    minWidth: 72,
    padding: 0,
  },
  durationUnit: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  helperText: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DARK,
    paddingVertical: 16,
    borderRadius: 16,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  secondaryBtnText: {
    color: DARK,
    fontSize: 16,
    fontWeight: '700',
  },
  endBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  endBtnText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
  },
  timerSection: {
    flex: 1,
    padding: 16,
    paddingBottom: 28,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  timerRingWrapper: {
    position: 'relative',
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerSvg: {
    position: 'absolute',
  },
  timerDisplay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  timerText: {
    fontSize: 52,
    fontWeight: '800',
    color: DARK,
    letterSpacing: 1,
  },
  timerLabel: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  notesInput: {
    minHeight: 64,
    borderRadius: 12,
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: DARK,
    textAlignVertical: 'top',
  },
});

export default FocusScreen;
