import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  AppState,
  Platform,
  Animated,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
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
  const { markHabitCompleted } = useActionStore();
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);
  
  // Timer state
  const [duration, setDuration] = useState<string>('25'); // Default 25 minutes
  const [timeRemaining, setTimeRemaining] = useState<number>(0); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Timer refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const startMsRef = useRef<number>(0);
  const endMsRef = useRef<number>(0);
  const appStateRef = useRef(AppState.currentState);
  
  // Animation refs
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const RING_RADIUS = 170;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  const canExitRef = useRef<boolean>(false);
  
  // Convert duration string to seconds
  const durationInSeconds = parseInt(duration) * 60;
  
  // Calculate progress percentage (0-100)
  const progress = durationInSeconds > 0 ? ((durationInSeconds - timeRemaining) / durationInSeconds) * 100 : 0;
  
  // Format time display (MM:SS)
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Start timer
  const startTimer = () => {
    if (durationInSeconds <= 0) {
      Alert.alert('Invalid Duration', 'Please enter a valid duration in minutes.');
      return;
    }
    
    setIsRunning(true);
    setTimeRemaining(durationInSeconds);
    startTimeRef.current = Date.now();
    startMsRef.current = startTimeRef.current;
    endMsRef.current = startMsRef.current + durationInSeconds * 1000;
    pausedTimeRef.current = 0;
    
    // Start progress animation (remaining fraction from 1 -> 0)
    progressAnimation.setValue(1);
    
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const remainingMs = Math.max(0, endMsRef.current - now);
      const remainingSec = Math.floor(remainingMs / 1000);
      setTimeRemaining(remainingSec);
      
      const remainingFraction = durationInSeconds > 0 ? remainingMs / (durationInSeconds * 1000) : 0;
      Animated.timing(progressAnimation, {
        toValue: remainingFraction,
        duration: 200,
        useNativeDriver: false,
      }).start();
      
      if (remainingSec === 0) {
        completeFocus();
      }
    }, 250);
  };
  
  // Complete focus session
  const completeFocus = async () => {
    setIsRunning(false);
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
        // Mark focus as completed in the habit ring
        markHabitCompleted('focus');
        
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
    const handleAppStateChange = (nextAppState: string) => {
      // No recalculation needed since we track absolute end time (endMsRef)
      appStateRef.current = nextAppState;
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isRunning]);
  
  // Prevent back navigation using official hook to avoid native-stack mismatch
  usePreventRemove(isRunning && !isCompleted && !canExitRef.current);
  
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
                Focus Session
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                Deep work time
              </Text>
            </View>
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
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Set Focus Duration
              </Text>
              
              <View style={styles.durationInput}>
                <TextInput
                  style={[styles.durationTextInput, { 
                    color: theme.textPrimary, 
                    borderColor: theme.borderSecondary,
                    backgroundColor: theme.cardBackground 
                  }]}
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="25"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={[styles.durationLabel, { color: theme.textSecondary }]}>
                  minutes
                </Text>
              </View>
              
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: '#10B981' }]}
                onPress={startTimer}
              >
                <Ionicons name="play" size={24} color="#FFFFFF" />
                <Text style={styles.startButtonText}>Start Focus</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {(isRunning || isCompleted) && (
            <View style={styles.timerSection}>
              {/* Circular Progress Timer */}
              <View style={styles.timerContainer}>
                <Svg width={360} height={360} style={styles.timerSvg}>
                  {/* Background circle */}
                  <Circle
                    cx={180}
                    cy={180}
                    r={RING_RADIUS}
                    stroke={theme.borderSecondary}
                    strokeWidth={16}
                    fill="none"
                    opacity={0.35}
                  />
                  {/* Progress circle */}
                  <AnimatedCircle
                    cx={180}
                    cy={180}
                    r={RING_RADIUS}
                    stroke={isCompleted ? '#10B981' : '#3B82F6'}
                    strokeWidth={16}
                    fill="none"
                    strokeDasharray={RING_CIRCUMFERENCE}
                    strokeDashoffset={progressAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [RING_CIRCUMFERENCE, 0],
                    })}
                    strokeLinecap="round"
                    transform="rotate(-90 180 180)"
                  />
                </Svg>
                
                {/* Timer Text */}
                <View style={styles.timerTextContainer}>
                  <Text style={[styles.timerText, { color: theme.textPrimary }]}>
                    {formatTime(timeRemaining)}
                  </Text>
                  <Text style={[styles.timerLabel, { color: theme.textSecondary }]}>
                    {isCompleted ? 'Complete!' : 'Remaining'}
                  </Text>
                </View>
              </View>
              
              {/* Notes Section */}
              <View style={styles.notesSection}>
                <Text style={[styles.notesLabel, { color: theme.textPrimary }]}>
                  What are you focusing on?
                </Text>
                <TextInput
                  style={[styles.notesInput, { 
                    color: theme.textPrimary, 
                    borderColor: theme.borderSecondary,
                    backgroundColor: theme.cardBackground 
                  }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Enter your focus task or goal..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={3}
                  editable={!isCompleted}
                  blurOnSubmit
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                />
              </View>
              
              {isRunning && (
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: '#EF4444' }]}
                  onPress={cancelFocus}
                >
                  <Ionicons name="close" size={20} color="#FFFFFF" />
                  <Text style={styles.cancelButtonText}>Cancel Focus</Text>
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
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  setupSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 32,
    textAlign: 'center',
  },
  durationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  durationTextInput: {
    fontSize: 48,
    fontWeight: '700',
    textAlign: 'center',
    width: 120,
    height: 80,
    borderWidth: 2,
    borderRadius: 16,
    marginRight: 16,
  },
  durationLabel: {
    fontSize: 18,
    fontWeight: '500',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  timerSection: {
    alignItems: 'center',
    marginTop: 160,
    paddingHorizontal: 20,
  },
  timerContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 120,
    paddingVertical: 40,
  },
  timerSvg: {
    position: 'absolute',
  },
  timerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 64,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 3,
  },
  timerLabel: {
    fontSize: 18,
    marginTop: 16,
    opacity: 0.8,
    fontWeight: '600',
  },
  notesSection: {
    width: '100%',
    marginBottom: 60,
    marginTop: 72,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 120,
    lineHeight: 22,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default FocusScreen;
