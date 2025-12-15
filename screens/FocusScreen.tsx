import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePreventRemove } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { useActionStore } from '../state/actionStore';
import CustomBackground from '../components/CustomBackground';
import Svg, { Circle } from 'react-native-svg';

function FocusScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);
  
  // Timer state
  const [duration, setDuration] = useState<string>('30'); // Default 30 minutes
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Timer refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const startMsRef = useRef<number>(0);
  const endMsRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const totalPausedTimeRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const appStateRef = useRef(AppState.currentState);
  
  // Animation refs
  const progressAnimation = useRef(new Animated.Value(0)).current; // Start at 0 (empty ring, will fill up)
  const RING_RADIUS = 150;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  const canExitRef = useRef<boolean>(false);
  
  // Convert duration string to seconds
  const durationInSeconds = parseInt(duration) * 60;
  
  // Format time display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Start timer
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
    
    // Start progress animation at 0 (empty ring, will fill up as time passes)
    progressAnimation.setValue(0);
    
    const updateTimer = () => {
      if (isPausedRef.current) return; // Don't update if paused
      
      const now = Date.now();
      const remainingMs = Math.max(0, endMsRef.current - now);
      const remainingSec = Math.floor(remainingMs / 1000);
      setTimeRemaining(remainingSec);
      
      // Calculate elapsed fraction (0 = no time elapsed, 1 = all time elapsed)
      const elapsedMs = (durationInSeconds * 1000) - remainingMs;
      const elapsedFraction = durationInSeconds > 0 
        ? Math.max(0, Math.min(1, elapsedMs / (durationInSeconds * 1000))) 
        : 0;
      
      // Smoothly animate to the new value (ring fills up as elapsedFraction increases)
      Animated.timing(progressAnimation, {
        toValue: elapsedFraction,
        duration: 100, // Short duration for smooth updates
        useNativeDriver: false,
      }).start();
      
      if (remainingSec === 0) {
        completeFocus();
      }
    };
    
    intervalRef.current = setInterval(updateTimer, 50); // Update every 50ms for very smooth animation
  };
  
  // Pause timer
  const pauseTimer = () => {
    if (!isRunning || isPaused || isCompleted) return;
    
    setIsPaused(true);
    isPausedRef.current = true;
    pausedAtRef.current = Date.now();
    
    // Don't clear interval, just let it check the ref
  };
  
  // Resume timer
  const resumeTimer = () => {
    if (!isRunning || !isPaused || isCompleted) return;
    
    const pausedDuration = Date.now() - pausedAtRef.current;
    totalPausedTimeRef.current += pausedDuration;
    
    // Adjust end time by the paused duration
    endMsRef.current += pausedDuration;
    
    setIsPaused(false);
    isPausedRef.current = false;
  };
  
  // Complete focus session
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
      
      // Save focus session data
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
        Alert.alert(
          'Focus Complete! 🎉',
          `Great job! You focused for ${duration} minutes.`,
          [
            {
              text: 'Continue',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to save focus session. Please try again.');
      }
    } catch (error) {
      console.error('Error completing focus:', error);
      Alert.alert('Error', 'Failed to save focus session. Please try again.');
    }
  };
  
  // Cancel focus session
  const cancelFocus = () => {
    Alert.alert(
      'Cancel Focus Session?',
      'Are you sure you want to cancel this focus session? This will mark it as incomplete.',
      [
        {
          text: 'Keep Focusing',
          style: 'cancel',
          onPress: () => {
            // Resume: do nothing; keep interval and endMsRef as-is
          },
        },
        {
          text: 'Cancel Session',
          style: 'destructive',
          onPress: () => {
            setIsRunning(false);
            setIsPaused(false);
            isPausedRef.current = false;
            setTimeRemaining(0);
            
            // Stop animation
            progressAnimation.stopAnimation();
            
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            // Allow screen to exit without being blocked by preventRemove
            canExitRef.current = true;
            // Defer navigation to next tick so state updates propagate
            setTimeout(() => {
              try {
                navigation.goBack();
              } catch (e) {
                // no-op fallback
              }
            }, 0);
          },
        },
      ]
    );
  };
  
  // Handle app state changes for background timer
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        // App is going to background - pause timer if running
        if (isRunning && !isPaused && !isCompleted) {
          pauseTimer();
        }
      } else if (appStateRef.current.match(/inactive|background/) && nextAppState.match(/active/)) {
        // App is coming to foreground - show resume option if paused
        if (isRunning && isPaused && !isCompleted) {
          Alert.alert(
            'Focus Session Paused',
            'Your focus session was paused. Would you like to continue?',
            [
              {
                text: 'Resume',
                onPress: resumeTimer,
              },
              {
                text: 'Cancel Session',
                style: 'destructive',
                onPress: cancelFocus,
              },
            ]
          );
        }
      }
      appStateRef.current = nextAppState;
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isRunning, isPaused, isCompleted]);
  
  // Prevent back navigation using official hook to avoid native-stack mismatch
  usePreventRemove(
    isRunning && !isCompleted && !canExitRef.current,
    ({ data }) => {
      // Handle the navigation action if needed
      if (isRunning && !isCompleted) {
        cancelFocus();
      }
    }
  );
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                if (isRunning && !isCompleted) {
                  cancelFocus();
                } else {
                  navigation.goBack();
                }
              }}
            >
              <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
                Focus Duration
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </View>
        
        {/* Content */}
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
          {!isRunning && !isCompleted && (
            <View style={styles.setupSection}>
              {/* Info Card */}
              <View style={[styles.infoCard, { 
                backgroundColor: theme.cardBackground,
                borderColor: theme.borderSecondary,
              }]}>
                <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                  Set your focus duration and eliminate distractions for deep, productive work
                </Text>
              </View>
              
              {/* Preset Durations */}
              <View style={styles.presetsContainer}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  Quick Select
                </Text>
                <View style={styles.presetButtonsGrid}>
                  <TouchableOpacity
                    style={[
                      styles.presetButton,
                      { 
                        backgroundColor: duration === '20' ? '#10B981' : theme.cardBackground,
                        borderColor: duration === '20' ? '#10B981' : theme.borderSecondary,
                      }
                    ]}
                    onPress={() => setDuration('20')}
                  >
                    <Ionicons 
                      name="time-outline" 
                      size={20} 
                      color={duration === '20' ? '#FFFFFF' : theme.textSecondary} 
                    />
                    <Text style={[
                      styles.presetButtonText,
                      { color: duration === '20' ? '#FFFFFF' : theme.textPrimary }
                    ]}>
                      20 min
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.presetButton,
                      { 
                        backgroundColor: duration === '30' ? '#10B981' : theme.cardBackground,
                        borderColor: duration === '30' ? '#10B981' : theme.borderSecondary,
                      }
                    ]}
                    onPress={() => setDuration('30')}
                  >
                    <Ionicons 
                      name="time-outline" 
                      size={20} 
                      color={duration === '30' ? '#FFFFFF' : theme.textSecondary} 
                    />
                    <Text style={[
                      styles.presetButtonText,
                      { color: duration === '30' ? '#FFFFFF' : theme.textPrimary }
                    ]}>
                      30 min
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.presetButton,
                      { 
                        backgroundColor: duration === '40' ? '#10B981' : theme.cardBackground,
                        borderColor: duration === '40' ? '#10B981' : theme.borderSecondary,
                      }
                    ]}
                    onPress={() => setDuration('40')}
                  >
                    <Ionicons 
                      name="time-outline" 
                      size={20} 
                      color={duration === '40' ? '#FFFFFF' : theme.textSecondary} 
                    />
                    <Text style={[
                      styles.presetButtonText,
                      { color: duration === '40' ? '#FFFFFF' : theme.textPrimary }
                    ]}>
                      40 min
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Custom Duration */}
              <View style={styles.customContainer}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                  Custom Duration
                </Text>
                <View style={[styles.customInputCard, { 
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.borderSecondary,
                }]}>
                  <TextInput
                    style={[styles.durationTextInput, { 
                      color: theme.textPrimary,
                    }]}
                    value={duration}
                    onChangeText={(text) => {
                      const numericValue = text.replace(/[^0-9]/g, '');
                      if (numericValue === '' || parseInt(numericValue) >= 10) {
                        setDuration(numericValue);
                      }
                    }}
                    placeholder="30"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                  <Text style={[styles.durationLabel, { color: theme.textSecondary }]}>
                    minutes
                  </Text>
                </View>
                <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                  Minimum 10 minutes
                </Text>
              </View>
              
              {/* Start Button */}
              <TouchableOpacity
                style={styles.startButton}
                onPress={startTimer}
              >
                <View style={styles.startButtonContent}>
                  <Ionicons name="play-circle" size={28} color="#FFFFFF" />
                  <Text style={styles.startButtonText}>Begin Focus Session</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
          
          {(isRunning || isCompleted) && (
            <View style={styles.timerSection}>
              {/* Timer Ring */}
              <View style={styles.timerContainer}>
                <View style={styles.timerRingWrapper}>
                  <Svg width={320} height={320} style={styles.timerSvg}>
                    {/* Background circle */}
                    <Circle
                      cx={160}
                      cy={160}
                      r={150}
                      stroke={theme.borderSecondary}
                      strokeWidth={12}
                      fill="none"
                      opacity={0.2}
                    />
                    {/* Progress circle - fills up clockwise from top as time passes */}
                    <AnimatedCircle
                      cx={160}
                      cy={160}
                      r={RING_RADIUS}
                      stroke={isCompleted ? '#10B981' : '#10B981'}
                      strokeWidth={12}
                      fill="none"
                      strokeDasharray={RING_CIRCUMFERENCE}
                      strokeDashoffset={progressAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [RING_CIRCUMFERENCE, 0], // When elapsedFraction is 0 (no time), offset is full (no circle). When 1 (all time), offset is 0 (full circle)
                      })}
                      strokeLinecap="round"
                      transform="rotate(-90 160 160)" // Start from top (12 o'clock), clockwise
                    />
                  </Svg>
                  
                  {/* Timer Display */}
                  <View style={styles.timerDisplay}>
                    <View style={styles.timerTextContainer}>
                      <Text style={[styles.timerText, { color: theme.textPrimary }]}>
                        {formatTime(timeRemaining)}
                      </Text>
                      <Text style={[styles.timerLabel, { color: theme.textSecondary }]}>
                        {isCompleted ? '🎉 Complete!' : isPaused ? '⏸ Paused' : 'remaining'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Notes Card */}
              <View style={[styles.notesCard, { 
                backgroundColor: theme.cardBackground,
                borderColor: theme.borderSecondary,
              }]}>
                <View style={styles.notesHeader}>
                  <Ionicons name="create-outline" size={20} color={theme.textSecondary} />
                  <Text style={[styles.notesLabel, { color: theme.textPrimary }]}>
                    Focus Task
                  </Text>
                </View>
                <TextInput
                  style={[styles.notesInput, { 
                    color: theme.textPrimary,
                  }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="What are you working on?"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={2}
                  editable={!isCompleted && !isPaused}
                  autoCapitalize="sentences"
                  autoCorrect={true}
                  blurOnSubmit
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>
              
              {/* Pause/Resume Button */}
              {isRunning && !isCompleted && (
                <TouchableOpacity
                  style={[styles.pauseButton, { 
                    backgroundColor: isPaused ? '#10B981' : '#F59E0B',
                  }]}
                  onPress={isPaused ? resumeTimer : pauseTimer}
                >
                  <Ionicons 
                    name={isPaused ? "play-circle" : "pause-circle"} 
                    size={24} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.pauseButtonText}>
                    {isPaused ? 'Resume' : 'Pause'}
                  </Text>
                </TouchableOpacity>
              )}
              
              {/* Cancel Button */}
              {isRunning && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={cancelFocus}
                >
                  <Ionicons name="stop-circle-outline" size={24} color="#FFFFFF" />
                  <Text style={styles.cancelButtonText}>End Session</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // Setup Section Styles
  setupSection: {
    flex: 1,
    paddingTop: 20,
  },
  infoCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 32,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  presetsContainer: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  presetButtonsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  presetButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
    gap: 6,
  },
  presetButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  customContainer: {
    marginBottom: 32,
  },
  customInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  durationTextInput: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    width: 80,
    letterSpacing: 1,
  },
  durationLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  helperText: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.7,
  },
  startButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Timer Section Styles
  timerSection: {
    flex: 1,
    paddingTop: 20,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
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
  timerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 56,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 2,
  },
  timerLabel: {
    fontSize: 16,
    marginTop: 8,
    opacity: 0.7,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  notesCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  notesLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  notesInput: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  pauseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default FocusScreen;
