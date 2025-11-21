import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Animated, Easing } from 'react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, RefreshControl, Image, useWindowDimensions } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { useGoalsStore } from '../state/goalsStore';
import { useActionStore } from '../state/actionStore';
import CustomBackground from '../components/CustomBackground';
import { getCategoryIcon, calculateCompletionPercentage } from '../lib/goalHelpers';
import { progressService } from '../lib/progressService';
import { apiCache } from '../lib/apiCache';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import CheckInList from '../components/CheckInList';
import DateNavigator from '../components/DateNavigator';
import { DEFAULT_HABITS, AVAILABLE_HABITS } from '../components/DailyHabitsSummary';
import EditHabitsModal from '../components/EditHabitsModal';

import HabitInfoModal from '../components/HabitInfoModal';
import StreakModal from '../components/StreakModal';
import CreatePostModal from '../components/CreatePostModal';
import NewGoalModal from '../components/NewGoalModal';
import LevelInfoModal from '../components/LevelInfoModal';

import { dailyHabitsService } from '../lib/dailyHabitsService';
import { notificationService } from '../lib/notificationService';
import { challengesService } from '../lib/challengesService';
import { pointsService } from '../lib/pointsService';
import { Challenge } from '../types/challenges';
import { supabase } from '../lib/supabase';




// Days constants
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type HabitCardVisualState = {
  baseProgress: number;
  progressAnimated: Animated.Value;
  completed: boolean;
};

// Helper function to save pillar progress snapshot at start of day
async function savePillarProgressSnapshot(userId: string, today: string): Promise<void> {
  try {
    const startOfDayKey = `pillar_progress_start_of_day_${userId}`;
    const startOfDayDateKey = `pillar_progress_start_of_day_date_${userId}`;
    const storedDate = await AsyncStorage.getItem(startOfDayDateKey);
    
    console.log(`📸 Snapshot check: stored="${storedDate}", today="${today}"`);
    
    // Only save if we haven't saved today already (new calendar day)
    if (storedDate !== today) {
      const { pillarProgressService } = await import('../lib/pillarProgressService');
      const progress = await pillarProgressService.getPillarProgress(userId);
      
      await AsyncStorage.setItem(startOfDayKey, JSON.stringify(progress));
      await AsyncStorage.setItem(startOfDayDateKey, today);
      console.log('📸 NEW DAY: Saved pillar progress snapshot:', progress);
    } else {
      console.log('📸 SAME DAY: Snapshot already exists, keeping original baseline');
    }
  } catch (error) {
    console.error('Error saving pillar progress snapshot:', error);
  }
}

// Helper function to check if a date is before today
const isDateBeforeToday = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
};

// Helper function to check if a date is today
const isDateToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

// Helper function to get goal check-in status
const getGoalCheckInStatus = (
  goal: any, 
  checkedInGoals: Set<string>, 
  checkedInGoalsByDay: {[key: string]: Set<string>},
  overdueGoals: Set<string>
): 'overdue' | 'due_today' | 'completed' | 'not_due' => {
  if (!goal.frequency || goal.completed) return 'not_due';
  
  const hasFrequency = goal.frequency.some((day: boolean) => day);
  if (!hasFrequency) return 'not_due';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDayOfWeek = today.getDay();
  
  // Check if today is within the goal's active date range
  if (goal.start_date) {
    const startDate = new Date(goal.start_date);
    startDate.setHours(0, 0, 0, 0);
    if (today < startDate) return 'not_due';
  }
  
  if (goal.end_date) {
    const endDate = new Date(goal.end_date);
    endDate.setHours(0, 0, 0, 0);
    if (today > endDate) return 'not_due'; // Goal has ended
  }
  
  // Check if goal is due today
  const isDueToday = goal.frequency[todayDayOfWeek];
  const isCheckedInToday = checkedInGoals.has(goal.id);
  
  // If checked in today, it's completed
  if (isDueToday && isCheckedInToday) {
    return 'completed';
  }
  
  // If due today but not checked in, it's due today
  if (isDueToday && !isCheckedInToday) {
    return 'due_today';
  }
  
  // Check if goal is in overdue list
  if (overdueGoals.has(goal.id)) {
    return 'overdue';
  }
  
  return 'not_due';
};

// New direct boolean check functions for separate sections
const isGoalOverdue = (goal: any, overdueGoals: Set<string>): boolean => {
  if (!goal.frequency || goal.completed) return false;
  return overdueGoals.has(goal.id);
};

const isGoalDueToday = (goal: any, checkedInGoals: Set<string>): boolean => {
  if (!goal.frequency || goal.completed) return false;
  
  const hasFrequency = goal.frequency.some((day: boolean) => day);
  if (!hasFrequency) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDayOfWeek = today.getDay();
  
  // Check if today is within the goal's active date range
  if (goal.start_date) {
    const startDate = new Date(goal.start_date);
    startDate.setHours(0, 0, 0, 0);
    if (today < startDate) return false;
  }
  
  if (goal.end_date) {
    const endDate = new Date(goal.end_date);
    endDate.setHours(0, 0, 0, 0);
    if (today > endDate) return false; // Goal has ended
  }
  
  // Due today = required today AND not checked in today
  return goal.frequency[todayDayOfWeek] && !checkedInGoals.has(goal.id);
};

function ActionScreen() {
  const navigation = useNavigation() as any;
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();
  const { goals: userGoals, fetchGoals, loading } = useGoalsStore();
  const { selectedDate, setSelectedDate, dailyHabits, loadDailyHabits, syncSegmentsWithData } = useActionStore();
  const { segmentChecked, coreHabitsCompleted, loadCoreHabitsStatus } = useActionStore();
  
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [targetCheckInDate, setTargetCheckInDate] = useState<Date | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkedInGoals, setCheckedInGoals] = useState<Set<string>>(new Set());
  const [checkedInGoalsByDay, setCheckedInGoalsByDay] = useState<{[key: string]: Set<string>}>({});
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [goalProgress, setGoalProgress] = useState<{[goalId: string]: number}>({});
  const [overdueGoals, setOverdueGoals] = useState<Set<string>>(new Set());
  const [overdueGoalDates, setOverdueGoalDates] = useState<{[goalId: string]: Date}>({});
  const [overdueGoalCounts, setOverdueGoalCounts] = useState<{[goalId: string]: number}>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showGymModal, setShowGymModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [showUntickConfirmation, setShowUntickConfirmation] = useState(false);
  const [segmentToUntick, setSegmentToUntick] = useState<number | null>(null);
  const [showHabitInfoModal, setShowHabitInfoModal] = useState(false);
  const [selectedHabitType, setSelectedHabitType] = useState<string>('');
  const [selectedDateHabitsData, setSelectedDateHabitsData] = useState<any>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [newlyCreatedGoalId, setNewlyCreatedGoalId] = useState<string | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [myActiveChallenges, setMyActiveChallenges] = useState<Challenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [onboardingIncomplete, setOnboardingIncomplete] = useState(false);
  const [onboardingLastStep, setOnboardingLastStep] = useState<number | null>(null);
  
  // Level progress state
  const [levelProgress, setLevelProgress] = useState({ 
    currentLevel: 1, 
    nextLevel: 2, 
    pointsInCurrentLevel: 0,
    pointsNeededForNext: 1400
  });
  const [totalPoints, setTotalPoints] = useState(0);
  const [showLevelModal, setShowLevelModal] = useState(false);

  
  // Keyboard state for modal positioning
  const modalPosition = useRef(new Animated.Value(0)).current;
  
  const [gymQuestionnaire, setGymQuestionnaire] = useState({
    dayType: '', // 'active' or 'rest'
    selectedTrainingTypes: [] as string[], // multiple selected training types
    customTrainingType: '' // for "Other" option
  });
  
  const [sleepQuestionnaire, setSleepQuestionnaire] = useState({
    sleepQuality: 50, // Changed to number for slider
    bedtimeHours: 22, // Default bedtime 22:00
    bedtimeMinutes: 0,
    wakeupHours: 6, // Default wake time 06:00
    wakeupMinutes: 0,
    sleepNotes: ''
  });  
  const [waterQuestionnaire, setWaterQuestionnaire] = useState({
    waterIntake: 5, // Changed to number for slider, default 2.25 liters (5 * 0.45)
    waterGoal: '',
    waterNotes: ''
  });
  
    const [runQuestionnaire, setRunQuestionnaire] = useState({
    dayType: '',
    activityType: '', // 'run' or 'walk'
    runType: '',
    distance: 5, // Changed to number for slider, default 5km
    durationHours: 0,
    durationMinutes: 30,
    durationSeconds: 0,
    runNotes: ''
  });

  const [showReflectModal, setShowReflectModal] = useState(false);
  const [showColdShowerModal, setShowColdShowerModal] = useState(false);
  const [showEditHabitsModal, setShowEditHabitsModal] = useState(false);
  const [selectedHabits, setSelectedHabits] = useState<string[]>(DEFAULT_HABITS);
  const [habitSchedules, setHabitSchedules] = useState<Record<string, boolean[]>>({});
  const [todayOverrides, setTodayOverrides] = useState<Set<string>>(new Set());
  const [completedHabits, setCompletedHabits] = useState<Set<string>>(new Set());
  const [habitToUntick, setHabitToUntick] = useState<string | null>(null);
  const [reflectQuestionnaire, setReflectQuestionnaire] = useState({
    mood: 3,
    energy: 3,
    whatWentWell: '',
    friction: '',
    oneTweak: '',
    nothingToChange: false,
    currentStep: 1
  });

  const { width: screenWidth } = useWindowDimensions();
  const spotlightCardWidth = useMemo(() => {
    const horizontalPadding = 24 * 2;
    const gap = 12;
    return Math.max(160, (screenWidth - horizontalPadding - gap) / 2);
  }, [screenWidth]);

  const habitSpotlightCards = useMemo(() => ([
    {
      habitId: 'gym',
      key: 'workout',
      title: 'Workout',
      subtitle: '24 Dec',
      metricLabel: 'Goals',
      metricValue: '4 / 6',
      progress: 0.65,
      accent: '#C084FC',
    },
    {
      habitId: 'run',
      key: 'exercise',
      title: 'Exercise',
      subtitle: 'Times Left',
      metricLabel: 'Timer',
      metricValue: '17:04:16',
      progress: 0.4,
      accent: '#38BDF8',
    },
    {
      habitId: 'sleep',
      key: 'sleep',
      title: 'Sleep',
      subtitle: 'Last Night',
      metricLabel: 'Hours',
      metricValue: '7h 45m',
      progress: 0.78,
      accent: '#34D399',
    },
    {
      habitId: 'focus',
      key: 'focus',
      title: 'Focus',
      subtitle: 'Daily Progress',
      metricLabel: 'Today',
      metricValue: '33%',
      progress: 0.33,
      accent: '#F472B6',
    },
    {
      habitId: 'water',
      key: 'water',
      title: 'Water',
      subtitle: 'Hydration',
      metricLabel: 'Glasses',
      metricValue: '6 / 8',
      progress: 0.75,
      accent: '#60A5FA',
    },
    {
      habitId: 'reflect',
      key: 'reflect',
      title: 'Reflect',
      subtitle: 'Entry Today',
      metricLabel: 'Prompts',
      metricValue: '2 / 3',
      progress: 0.5,
      accent: '#F59E0B',
    },
    {
      habitId: 'update_goal',
      key: 'update_goal',
      title: 'Update Goal',
      subtitle: 'Weekly',
      metricLabel: 'Status',
      metricValue: 'On Track',
      progress: 0.85,
      accent: '#A78BFA',
    },
    {
      habitId: 'meditation',
      key: 'meditation',
      title: 'Meditation',
      subtitle: 'Today',
      metricLabel: 'Minutes',
      metricValue: '12',
      progress: 0.48,
      accent: '#2DD4BF',
    },
    {
      habitId: 'microlearn',
      key: 'microlearn',
      title: 'Microlearn',
      subtitle: 'Lessons',
      metricLabel: 'Completed',
      metricValue: '3 / 5',
      progress: 0.6,
      accent: '#FB7185',
    },
    {
      habitId: 'cold_shower',
      key: 'cold_shower',
      title: 'Cold Shower',
      subtitle: 'Streak',
      metricLabel: 'Days',
      metricValue: '5-day',
      progress: 0.9,
      accent: '#7DD3FC',
    },
    {
      habitId: 'screen_time',
      key: 'screen_time',
      title: 'Screen Time',
      subtitle: 'Limit',
      metricLabel: 'Today',
      metricValue: '1h 20m',
      progress: 0.4,
      accent: '#FCD34D',
    },
  ]), []);

  const [habitCardState, setHabitCardState] = useState<Record<string, HabitCardVisualState>>({});
  const completionSoundRef = useRef<Audio.Sound | null>(null);

  const habitIdToCardMap = useMemo(() => {
    const map: Record<string, (typeof habitSpotlightCards)[number]> = {};
    habitSpotlightCards.forEach(card => {
      map[card.habitId] = card;
    });
    return map;
  }, [habitSpotlightCards]);

  useEffect(() => {
    setHabitCardState((prev) => {
      let changed = false;
      const nextState: Record<string, HabitCardVisualState> = { ...prev };

      habitSpotlightCards.forEach((card) => {
        const shouldBeCompleted = completedHabits.has(card.habitId);
        const existing = nextState[card.key];

        if (!existing) {
          const animatedValue = new Animated.Value(shouldBeCompleted ? 1 : card.progress);
          nextState[card.key] = {
            baseProgress: card.progress,
            progressAnimated: animatedValue,
            completed: shouldBeCompleted,
          };
          changed = true;
          return;
        }

        if (existing.baseProgress !== card.progress) {
          nextState[card.key] = {
            ...existing,
            baseProgress: card.progress,
          };
          if (!existing.completed) {
            existing.progressAnimated.setValue(card.progress);
          }
          changed = true;
        }

        if (existing.completed !== shouldBeCompleted) {
          existing.progressAnimated.setValue(shouldBeCompleted ? 1 : card.progress);
          nextState[card.key] = {
            ...existing,
            completed: shouldBeCompleted,
          };
          changed = true;
        }
      });

      return changed ? nextState : prev;
    });
  }, [habitSpotlightCards, completedHabits]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require('../assets/sounds/habitComplete.mp3'),
          { 
            volume: 0.8,
            shouldPlay: false, // Don't auto-play, just prepare it
            isLooping: false
          }
        );

        if (isMounted) {
          // Pre-set position to 0 for immediate playback
          await sound.setPositionAsync(0);
          completionSoundRef.current = sound;
        } else {
          await sound.unloadAsync();
        }
      } catch (error) {
        console.warn('Failed to load completion sound', error);
      }
    })();

    return () => {
      isMounted = false;
      if (completionSoundRef.current) {
        completionSoundRef.current.unloadAsync().catch(() => {});
        completionSoundRef.current = null;
      }
    };
  }, []);

  const playCompletionSound = useCallback(async () => {
    try {
      const sound = completionSoundRef.current;
      if (!sound) return;
      // Use playFromPositionAsync for immediate playback without delay
      await sound.playFromPositionAsync(0);
    } catch (error) {
      console.warn('Failed to play completion sound', error);
    }
  }, []);

  const updateCardCompletionVisual = useCallback((habitId: string, completed: boolean, options?: { animate?: boolean }) => {
    const cardConfig = habitIdToCardMap[habitId];
    if (!cardConfig) return;

    const { key, progress } = cardConfig;
    const animate = options?.animate ?? true;

    setHabitCardState((prev) => {
      const current = prev[key];
      if (!current) return prev;

      const targetValue = completed ? 1 : progress;
      if (animate) {
        Animated.timing(current.progressAnimated, {
          toValue: targetValue,
          duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }).start();
      } else {
        current.progressAnimated.setValue(targetValue);
      }

      if (current.completed === completed && current.baseProgress === progress) {
        return prev;
      }

      return {
        ...prev,
        [key]: {
          ...current,
          baseProgress: progress,
          completed,
        },
      };
    });
  }, [habitIdToCardMap]);

  const handleHabitLongPress = useCallback(async (habitId: string) => {
    if (completedHabits.has(habitId)) return;
    markHabitCompleted(habitId); // Sound plays here when animation starts
    const success = await persistQuickCompletion(habitId);
    if (!success) {
      markHabitUncompleted(habitId);
    }
  }, [completedHabits, markHabitCompleted, markHabitUncompleted, persistQuickCompletion]);

  // Load today's daily habits data when component mounts
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    useActionStore.getState().loadDailyHabits(today);
  }, []);

  // Load unread notification count
  const loadUnreadNotificationCount = async () => {
    if (!user) return;
    try {
      const count = await notificationService.getUnreadCount(user.id);
      setUnreadNotificationCount(count);
    } catch (error) {
      console.error('Error loading unread notification count:', error);
    }
  };

  // Load notification count when component mounts and when user changes
  useEffect(() => {
    if (user) {
      loadUnreadNotificationCount();
    }
  }, [user]);

  // Check onboarding status
  const checkOnboardingStatus = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed, onboarding_last_step')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        // Show reminder if onboarding is not completed AND user has made progress
        // Changed from > 1 to >= 2 to match exit button visibility (steps >= 3)
        // Also show if onboarding_completed is false but onboarding_last_step is null (edge case)
        const hasProgress = data.onboarding_last_step !== null && data.onboarding_last_step >= 2;
        const isIncomplete = !data.onboarding_completed && hasProgress;
        setOnboardingIncomplete(isIncomplete);
        setOnboardingLastStep(data.onboarding_last_step || null);
      } else if (error) {
        console.error('❌ Error checking onboarding status:', error);
        // If query fails, still try to show reminder if we have user
        // This handles edge cases where profile might not exist yet
        setOnboardingIncomplete(false);
        setOnboardingLastStep(null);
      }
    } catch (error) {
      console.error('❌ Error checking onboarding status:', error);
    }
  }, [user]);

  // Check onboarding status on mount and when user changes
  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  // Refresh onboarding status when screen comes into focus
  // This ensures the reminder appears when returning from exiting onboarding
  useFocusEffect(
    useCallback(() => {
      checkOnboardingStatus();
    }, [checkOnboardingStatus])
  );


  // Sync completed habits with existing data
  const syncCompletedHabits = useCallback(() => {
    const { dailyHabits } = useActionStore.getState();
    const completedSet = new Set<string>();
    
    if (dailyHabits) {
      // Only mark as completed if the habit was actually completed (not just data exists)
      // This matches the old circle's behavior - only completed when questionnaire was finished
      
      // Gym: Only completed if it was an active day (not rest day)
      if (dailyHabits.gym_day_type === 'active') completedSet.add('gym');
      
      // Run: Only completed if it was an active day (not rest day)  
      if (dailyHabits.run_day_type === 'active') completedSet.add('run');
      
      // Sleep: Only completed if quality is reasonable (not terrible sleep)
      if (dailyHabits.sleep_quality !== undefined && dailyHabits.sleep_quality >= 50) completedSet.add('sleep');
      
      // Water: Only completed if intake is reasonable (not zero)
      if (dailyHabits.water_intake !== undefined && dailyHabits.water_intake > 0) completedSet.add('water');
      
      // Reflect: Only completed if mood is reasonable (not terrible mood)
      if (dailyHabits.reflect_mood !== undefined && dailyHabits.reflect_mood >= 3) completedSet.add('reflect');
      
      // Cold Shower: Only completed if explicitly marked as completed
      if (dailyHabits.cold_shower_completed === true) completedSet.add('cold_shower');
      
      // Focus: Only completed if explicitly marked
      if (dailyHabits.focus_completed === true) completedSet.add('focus');
    }
    
    setCompletedHabits(completedSet);
  }, []);

  // Load selected habits on mount
  useEffect(() => {
    if (user) {
      loadSelectedHabits();
    }
    // Also sync completed habits on mount
    syncCompletedHabits();
  }, [user, syncCompletedHabits]);

  // Re-sync completed habits whenever today's stored data loads/changes
  useEffect(() => {
    syncCompletedHabits();
  }, [dailyHabits, syncCompletedHabits]);

  const loadSelectedHabits = async () => {
    try {
      if (user) {
        const [habits, schedules] = await Promise.all([
          dailyHabitsService.getSelectedHabits(user.id),
          dailyHabitsService.getHabitSchedules(user.id)
        ]);
        setSelectedHabits(habits);
        setHabitSchedules(schedules);
        
        // Sync completed habits with existing data
        syncCompletedHabits();
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  // Compute which habits are enabled today
  const getEnabledTodayHabits = () => {
    const today = new Date().getDay();
    const enabledFromSchedule = new Set<string>();
    
    selectedHabits.forEach(habitId => {
      const schedule = habitSchedules[habitId];
      if (schedule && schedule[today]) {
        enabledFromSchedule.add(habitId);
      }
    });
    
    // Add today overrides
    const enabledTodaySetEffective = new Set([...enabledFromSchedule, ...todayOverrides]);
    return enabledTodaySetEffective;
  };

  const handleUnlockToday = (habitId: string) => {
    setTodayOverrides(prev => new Set([...prev, habitId]));
  };

  // Mark habit as completed in the new ring
  const markHabitCompleted = useCallback((habitId: string) => {
    setCompletedHabits(prev => {
      if (prev.has(habitId)) return prev;
      const next = new Set(prev);
      next.add(habitId);
      return next;
    });
    // Play sound immediately when animation starts
    playCompletionSound();
    updateCardCompletionVisual(habitId, true, { animate: true });
  }, [updateCardCompletionVisual, playCompletionSound]);

  // Mark habit as uncompleted in the new ring
  const markHabitUncompleted = useCallback((habitId: string) => {
    setCompletedHabits(prev => {
      if (!prev.has(habitId)) return prev;
      const next = new Set(prev);
      next.delete(habitId);
      return next;
    });
    updateCardCompletionVisual(habitId, false, { animate: true });
  }, [updateCardCompletionVisual]);

  const persistQuickCompletion = useCallback(async (habitId: string) => {
    const date = getTodayDateString();
    let success = false;

    try {
      switch (habitId) {
        case 'gym':
          success = await useActionStore.getState().saveDailyHabits({
            date,
            gym_day_type: 'active',
            gym_training_types: ['Quick Session'],
          });
          break;
        case 'run':
          success = await useActionStore.getState().saveDailyHabits({
            date,
            run_day_type: 'active',
            run_activity_type: 'run',
            run_type: 'Easy',
            run_distance: 5,
            run_duration: '00:30:00',
            run_notes: 'Logged via quick complete',
          });
          break;
        case 'sleep':
          success = await useActionStore.getState().saveDailyHabits({
            date,
            sleep_quality: 80,
            sleep_hours: 7.5,
            sleep_bedtime_hours: 22,
            sleep_bedtime_minutes: 30,
            sleep_wakeup_hours: 6,
            sleep_wakeup_minutes: 0,
            sleep_notes: 'Quick check-in',
          });
          break;
        case 'water':
          success = await useActionStore.getState().saveDailyHabits({
            date,
            water_intake: 4,
            water_goal: 'Yes',
            water_notes: 'Quick check-in',
          });
          break;
        case 'focus':
          success = await useActionStore.getState().saveDailyHabits({
            date,
            focus_completed: true,
            focus_duration: 25,
            focus_notes: 'Quick complete',
          });
          break;
        case 'reflect':
          success = await useActionStore.getState().saveDailyHabits({
            date,
            reflect_mood: 4,
            reflect_energy: 4,
            reflect_what_went_well: 'Quick reflection entry',
            reflect_one_tweak: '',
            reflect_nothing_to_change: false,
          });
          break;
        case 'cold_shower':
          success = await useActionStore.getState().saveDailyHabits({
            date,
            cold_shower_completed: true,
          });
          break;
        case 'meditation':
        case 'microlearn':
          if (user) {
            success = await pointsService.trackDailyHabit(user.id, habitId as 'meditation' | 'microlearn');
          }
          break;
        case 'update_goal':
          if (user) {
            success = await pointsService.trackCoreHabit(user.id, 'update_goal');
          }
          break;
        default:
          console.warn('Quick completion not implemented for', habitId);
          success = false;
      }

      if (success) {
        await fetchUserPoints();
        return true;
      }
    } catch (error) {
      console.error('Error saving quick completion for', habitId, error);
    }

    return false;
  }, [user]);

  // Handle habit press from the new ring
  const handleHabitPress = useCallback((habitId: string) => {
    // Check if habit is already completed
    if (completedHabits.has(habitId)) {
      // Show untick confirmation
      setHabitToUntick(habitId);
      setShowUntickConfirmation(true);
      return;
    }

    const { dailyHabits } = useActionStore.getState();
    
    switch (habitId) {
      case 'meditation':
        (navigation as any).navigate('Meditation', {}, {
          animation: 'slide_from_bottom',
          presentation: 'modal'
        });
        return;

      case 'microlearn':
        (navigation as any).navigate('Microlearning', {}, {
          animation: 'slide_from_bottom',
          presentation: 'modal'
        });
        return;

      case 'focus':
        (navigation as any).navigate('Focus', {}, {
          animation: 'slide_from_bottom',
          presentation: 'modal'
        });
        return;

      case 'sleep':
        if (dailyHabits && dailyHabits.sleep_quality) {
          setSleepQuestionnaire({
            sleepQuality: dailyHabits.sleep_quality || 50,
            bedtimeHours: dailyHabits.sleep_bedtime_hours || 22,
            bedtimeMinutes: dailyHabits.sleep_bedtime_minutes || 0,
            wakeupHours: dailyHabits.sleep_wakeup_hours || 6,
            wakeupMinutes: dailyHabits.sleep_wakeup_minutes || 0,
            sleepNotes: dailyHabits.sleep_notes || ''
          });
        } else {
          setSleepQuestionnaire({
            sleepQuality: 50,
            bedtimeHours: 22,
            bedtimeMinutes: 0,
            wakeupHours: 6,
            wakeupMinutes: 0,
            sleepNotes: ''
          });
        }
        modalPosition.setValue(0);
        setShowSleepModal(true);
        return;

      case 'water':
        if (dailyHabits && dailyHabits.water_intake) {
          setWaterQuestionnaire({
            waterIntake: dailyHabits.water_intake || 16,
            waterGoal: dailyHabits.water_goal || '',
            waterNotes: dailyHabits.water_notes || ''
          });
        } else {
          setWaterQuestionnaire({ waterIntake: 16, waterGoal: '', waterNotes: '' });
        }
        modalPosition.setValue(0);
        setShowWaterModal(true);
        return;

      case 'run':
        if (dailyHabits && dailyHabits.run_day_type) {
          setRunQuestionnaire({
            dayType: dailyHabits.run_day_type || '',
            activityType: dailyHabits.run_activity_type || '',
            runType: dailyHabits.run_type || '',
            distance: dailyHabits.run_distance ? Math.round(dailyHabits.run_distance * 2) : 5,
            durationHours: 0,
            durationMinutes: 30,
            durationSeconds: 0,
            runNotes: dailyHabits.run_notes || ''
          });
        } else {
          setRunQuestionnaire({ 
            dayType: '', 
            activityType: '', 
            runType: '', 
            distance: 5, 
            durationHours: 0, 
            durationMinutes: 30, 
            durationSeconds: 0, 
            runNotes: '' 
          });
        }
        modalPosition.setValue(0);
        setShowRunModal(true);
        return;

      case 'reflect':
        if (dailyHabits && dailyHabits.reflect_mood) {
          setReflectQuestionnaire({
            mood: dailyHabits.reflect_mood || 3,
            energy: dailyHabits.reflect_energy || 3,
            whatWentWell: dailyHabits.reflect_what_went_well || '',
            friction: dailyHabits.reflect_friction || '',
            oneTweak: dailyHabits.reflect_one_tweak || '',
            nothingToChange: dailyHabits.reflect_nothing_to_change || false,
            currentStep: 1
          });
        } else {
          setReflectQuestionnaire({
            mood: 3,
            energy: 3,
            whatWentWell: '',
            friction: '',
            oneTweak: '',
            nothingToChange: false,
            currentStep: 1
          });
        }
        modalPosition.setValue(0);
        setShowReflectModal(true);
        return;

      case 'cold_shower':
        if (dailyHabits && dailyHabits.cold_shower_completed) {
          setShowColdShowerModal(true);
          setTimeout(() => {
            setShowColdShowerModal(false);
          }, 1000);
          return;
        }
        setShowColdShowerModal(true);
        return;

      case 'gym':
        if (dailyHabits && dailyHabits.gym_day_type) {
          setGymQuestionnaire({
            dayType: dailyHabits.gym_day_type || '',
            selectedTrainingTypes: dailyHabits.gym_training_types || [],
            customTrainingType: dailyHabits.gym_custom_type || ''
          });
        } else {
          setGymQuestionnaire({ dayType: '', selectedTrainingTypes: [], customTrainingType: '' });
        }
        modalPosition.setValue(0);
        setShowGymModal(true);
        return;

      case 'focus':
      case 'update_goal':
      case 'screen_time':
        // Not implemented yet
        console.log(`${habitId} modal not implemented yet`);
        return;

      default:
        console.log(`Unknown habit: ${habitId}`);
        return;
    }
  }, [navigation, modalPosition, completedHabits]);

  // Keyboard event listeners for modal positioning
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {

      // Smoothly animate modal up - different amounts for different modals
      let liftAmount = -150; // Default for run modal (most content)
      
      // Check which modal is currently open to adjust lift amount
      if (showSleepModal) {
        liftAmount = -120; // Sleep modal needs moderate lift
      } else if (showWaterModal) {
        liftAmount = -80; // Water modal needs less lift (shorter content)
      } else if (showRunModal) {
        liftAmount = -150; // Run modal needs most lift (most content)
      } else if (showGymModal) {
        liftAmount = -100; // Gym modal needs moderate lift
      } else if (showReflectModal) {
        liftAmount = -200; // Reflect modal needs most lift (most content)
      }
      
      Animated.timing(modalPosition, {
        toValue: liftAmount,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }).start();
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {

      // Smoothly animate modal back down
      Animated.timing(modalPosition, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.quad,
      }).start();
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [modalPosition]);

  const trainingTypes = [
    'Push', 'Pull', 'Quads & Calves', 'Chest', 'Shoulders', 'Arms', 'Back', 'Hamies & Glutes', 'Abs', 'Cardio', 'HIIT', 'Other'
  ];

  // Helper function to get sleep quality label based on percentage
  const getSleepQualityLabel = (percentage: number) => {
    if (percentage <= 25) return 'Poor';
    if (percentage <= 50) return 'Fair';
    if (percentage <= 75) return 'Good';
    return 'Excellent';
  };

  // Helper function to get sleep quality label color
  const getSleepQualityColor = (percentage: number) => {
    if (percentage <= 25) return '#EF4444'; // Red
    if (percentage <= 50) return '#F97316'; // Orange
    if (percentage <= 75) return '#84CC16'; // Light green
    return '#10B981'; // Green
  };



  // Helper function to format water intake
  const formatWaterIntake = (value: number) => {
    const liters = value * 0.5;
    const cups = Math.round(liters * 4.226); // Convert liters to cups (1 liter = 4.226 cups)
    
    if (value === 8) return '4L (17 cups)';
    if (value >= 9) return '4.5L+ (19+ cups)';
    return `${liters.toFixed(1)}L (${cups} cups)`;
  };

  // Helper function to get water intake color
  const getWaterIntakeColor = (value: number) => {
    const liters = value * 0.45; // Convert slider value (0-10) to liters (0-4.5L)
    if (liters < 1) return '#EF4444'; // Red - too little (< 1 liter)
    if (liters < 2) return '#F97316'; // Orange - could be better (1-2 liters)
    return '#10B981'; // Green - good range (2+ liters)
  };

  // Helper function to format run distance
  const formatRunDistance = (value: number) => {
    const distance = value * 0.5; // Each step = 0.5km
    
    if (distance === 4.5) return '4.5km';
    if (distance === 5) return '5km';
    if (distance === 9.5) return '9.5km';
    if (distance === 10) return '10km';
    if (distance >= 21 && distance <= 21.5) return 'Half Marathon';
    if (distance >= 42 && distance <= 42.5) return 'Marathon';
    return `${distance.toFixed(1)}km`;
  };

  // Helper function to get run distance color
  const getRunDistanceColor = (value: number) => {
    return '#10B981'; // Always green
  };

  const fetchGoalProgress = useCallback(async () => {
    if (!user || userGoals.length === 0) return;

    // Check cache first
    const cacheKey = apiCache.generateKey('goalProgress', user.id);
    const cached = apiCache.get<{[goalId: string]: number}>(cacheKey);
    
    if (cached !== null) {
      setGoalProgress(cached);
      return;
    }

    // Batch fetch all goal progress counts in one query
    const incompleteGoals = userGoals.filter(goal => !goal.completed);
    
    if (incompleteGoals.length === 0) {
      setGoalProgress({});
      return;
    }

    try {
      const progressData = await progressService.getCheckInCountsForGoalsInRange(
        user.id,
        incompleteGoals.map(goal => ({
          id: goal.id,
          start_date: goal.start_date,
          end_date: goal.end_date,
          frequency: goal.frequency
        }))
      );

      setGoalProgress(progressData);
      
      // Cache for 2 minutes
      apiCache.set(cacheKey, progressData, 2 * 60 * 1000);
    } catch (error) {
      console.error('Error fetching goal progress:', error);
    }
  }, [user, userGoals]);

  async function fetchUserPoints() {
    if (!user) return;

    try {
      const total = await pointsService.getTotalPoints(user.id);
      const progress = pointsService.getLevelProgress(total);
      
      setTotalPoints(total);
      setLevelProgress(progress);
    } catch (error) {
      console.error('Error fetching user points:', error);
      setTotalPoints(0);
    }
  }

  const checkForOverdueGoals = useCallback(async () => {
    if (!user || userGoals.length === 0) return;

    // Check cache first
    const cacheKey = apiCache.generateKey('overdueGoals', user.id);
    const cached = apiCache.get<{
      overdueSet: Set<string>;
      overdueDatesMap: {[goalId: string]: Date};
      overdueCountsMap: {[goalId: string]: number};
    }>(cacheKey);
    
    if (cached !== null) {
      setOverdueGoals(cached.overdueSet);
      setOverdueGoalDates(cached.overdueDatesMap);
      setOverdueGoalCounts(cached.overdueCountsMap);
      return;
    }

    // Move heavy processing to background using setTimeout
    return new Promise<void>((resolve) => {
      const timeoutId = setTimeout(async () => {
        try {
          const overdueSet = new Set<string>();
          const overdueDatesMap: {[goalId: string]: Date} = {};
          const overdueCountsMap: {[goalId: string]: number} = {};
          
          // Filter goals that need checking
          const validGoals = userGoals.filter(goal => {
            if (!goal.frequency || goal.completed) return false;
            const hasFrequency = goal.frequency.some((day: boolean) => day);
            return hasFrequency;
          });
          
          if (validGoals.length === 0) {
            setOverdueGoals(overdueSet);
            setOverdueGoalDates(overdueDatesMap);
            setOverdueGoalCounts(overdueCountsMap);
            resolve();
            return;
          }

    // Find the earliest start date across all goals
    const today = new Date();
    let earliestStartDate = today;
    
    for (const goal of validGoals) {
      const goalStartDate = goal.start_date ? new Date(goal.start_date) : null;
      const goalCreatedDate = goal.created_at ? new Date(goal.created_at) : goalStartDate;
      const startCheckDate = goalCreatedDate || goalStartDate;
      
      if (startCheckDate && startCheckDate < earliestStartDate) {
        earliestStartDate = startCheckDate;
      }
    }
    
    // Get all check-ins for all goals in one batch query
    const goalIds = validGoals.map(goal => goal.id);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const allCheckIns = await progressService.getCheckInsForGoalsInDateRange(
      user.id, 
      goalIds, 
      earliestStartDate, 
      yesterday
    );
    
    // Create a lookup map for quick check-in existence checks
    const checkInMap = new Map<string, Set<string>>();
    for (const checkIn of allCheckIns) {
      const key = checkIn.goal_id;
      if (!checkInMap.has(key)) {
        checkInMap.set(key, new Set());
      }
      checkInMap.get(key)!.add(checkIn.check_in_date);
    }
    
    // Now check each goal for overdue check-ins
    for (const goal of validGoals) {
      const goalStartDate = goal.start_date ? new Date(goal.start_date) : null;
      const goalEndDate = goal.end_date ? new Date(goal.end_date) : null;
      
      // Only check dates within the goal's active range
      if (!goalStartDate) continue;
      
      const goalCheckIns = checkInMap.get(goal.id) || new Set();
      
      let overdueCount = 0;
      let oldestOverdueDate = null;
      
      // Use goal's active period - iterate day by day within the exact range
      const endCheckDate = goalEndDate ? new Date(Math.min(goalEndDate.getTime(), today.getTime())) : new Date(today);
      
      // Iterate through each day in the goal's active range
      for (let currentDate = new Date(goalStartDate); currentDate <= endCheckDate; currentDate.setDate(currentDate.getDate() + 1)) {
        // Skip today (we only check overdue, not current day)
        if (currentDate.toDateString() === today.toDateString()) continue;
        
        const dayOfWeek = currentDate.getDay();
        const dateString = currentDate.toISOString().split('T')[0];
        
        // If this day required a check-in (matches frequency)
        if (goal.frequency && goal.frequency[dayOfWeek]) {
          const hasCheckedIn = goalCheckIns.has(dateString);
          
          if (!hasCheckedIn) {
            overdueCount++;
            if (!oldestOverdueDate) {
              oldestOverdueDate = new Date(currentDate); // First missed = oldest
            }
          }
        }
      }
      
      // If any check-ins are overdue, add to sets
      if (overdueCount > 0 && oldestOverdueDate) {
        overdueSet.add(goal.id);
        overdueDatesMap[goal.id] = oldestOverdueDate;
        overdueCountsMap[goal.id] = overdueCount;
      }
          }
          
          setOverdueGoals(overdueSet);
          setOverdueGoalDates(overdueDatesMap);
          setOverdueGoalCounts(overdueCountsMap);
          
          // Cache results for 5 minutes
          apiCache.set(cacheKey, {
            overdueSet,
            overdueDatesMap,
            overdueCountsMap
          }, 5 * 60 * 1000);
          
          resolve();
        } catch (error) {
          console.error('Error checking overdue goals:', error);
          resolve();
        }
      }, 100); // Increased delay to 100ms to ensure UI renders first
      
      // Cleanup function to clear timeout if component unmounts
      return () => clearTimeout(timeoutId);
    });
  }, [user, userGoals]);

  const checkTodaysCheckIns = useCallback(async () => {
    if (!user || userGoals.length === 0) return;

    // Check cache first
    const cacheKey = apiCache.generateKey('todaysCheckIns', user.id, selectedWeek.toISOString());
    const cached = apiCache.get<{
      checkedInSet: Set<string>;
      checkedInByDay: {[key: string]: Set<string>};
    }>(cacheKey);
    
    if (cached !== null) {
      setCheckedInGoals(cached.checkedInSet);
      setCheckedInGoalsByDay(cached.checkedInByDay);
      return;
    }

    const checkedInSet = new Set<string>();
    const checkedInByDay: {[key: string]: Set<string>} = {};
    
    // Initialize sets for each day of the week
    for (let day = 0; day < 7; day++) {
      checkedInByDay[day.toString()] = new Set<string>();
    }

    // Get all check-ins for the selected week in one batch
    const weekStart = getWeekStart(selectedWeek);
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    
    try {
      // Batch: Get all check-ins for the week for all goals AND today's check-ins
      const [weekCheckIns, todayCheckIns] = await Promise.all([
        progressService.getCheckInsForDateRange(user.id, weekStart, weekEnd),
        progressService.getCheckInsForDateRange(user.id, new Date(), new Date())
      ]);
      
      // Process today's check-ins first
      const todayStr = new Date().toISOString().split('T')[0];
      for (const checkIn of todayCheckIns) {
        if (checkIn.check_in_date.split('T')[0] === todayStr) {
          checkedInSet.add(checkIn.goal_id);
        }
      }
      
      // Process week check-ins for calendar display
      for (const goal of userGoals) {
        if (!goal.completed) {
          // Check each day of the week using the batch data
          for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
            const targetDate = getDateForDayOfWeekInWeek(dayOfWeek, selectedWeek);
            const targetDateStr = targetDate.toISOString().split('T')[0];
            
            // Check if there's a check-in for this goal on this date
            const hasCheckedInForDay = weekCheckIns.some((checkIn: {goal_id: string, check_in_date: string}) => 
              checkIn.goal_id === goal.id && 
              checkIn.check_in_date.split('T')[0] === targetDateStr
            );
            
            if (hasCheckedInForDay) {
              checkedInByDay[dayOfWeek.toString()].add(goal.id);
            }
          }
        }
      }
      
      setCheckedInGoals(checkedInSet);
      setCheckedInGoalsByDay(checkedInByDay);
      
      // Cache for 1 minute
      apiCache.set(cacheKey, {
        checkedInSet,
        checkedInByDay
      }, 60 * 1000);
    } catch (error) {
      console.error('Error fetching check-ins for week:', error);
      // Fallback to individual calls if batch fails
      for (const goal of userGoals) {
        if (!goal.completed) {
          const today = new Date();
          const hasCheckedInToday = await progressService.hasCheckedInToday(goal.id, user.id, today);
          if (hasCheckedInToday) {
            checkedInSet.add(goal.id);
          }

          for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
            const targetDate = getDateForDayOfWeekInWeek(dayOfWeek, selectedWeek);
            const hasCheckedInForDay = await progressService.hasCheckedInToday(goal.id, user.id, targetDate);
            if (hasCheckedInForDay) {
              checkedInByDay[dayOfWeek.toString()].add(goal.id);
            }
          }
        }
      }
      
      setCheckedInGoals(checkedInSet);
      setCheckedInGoalsByDay(checkedInByDay);
    }
  }, [user, userGoals, selectedWeek]);

  // Initialize data when component mounts and when user/goals change
  useEffect(() => {
    if (!user) return;
    
    const controller = new AbortController();
    
    const initializeData = async () => {
      try {
        await Promise.all([
          fetchGoals(user.id),
          checkTodaysCheckIns(),
          checkForOverdueGoals(),
          fetchUserPoints()
        ]);
        
        // Only refresh progress-related data if goals are loaded
        if (userGoals.length > 0) {
          fetchGoalProgress();
        }
        
        // Record login day (non-blocking)
        const today = new Date().toISOString().split('T')[0];
        dailyHabitsService.recordLoginDay(user.id, today).catch(() => {});
        
        // Decay disabled - no longer applying automatic progress reduction
        
        // Save pillar progress snapshot at start of day (for green indicator comparison)
        await savePillarProgressSnapshot(user.id, today);
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.error('Error initializing ActionScreen data:', error);
        }
      }
    };
    
    initializeData();
    
    return () => {
      controller.abort();
    };
  }, [user, userGoals.length]);

  // Refresh check-ins when selected week changes (only if goals exist)
  useEffect(() => {
    if (user && userGoals.length > 0) {
      checkTodaysCheckIns();
    }
  }, [selectedWeek]);

  // Refresh check-ins when screen comes into focus (useful after deleting check-ins)
  useFocusEffect(
    useCallback(() => {
      if (user && userGoals.length > 0) {
        checkTodaysCheckIns();
      }
      // Refresh level progress and core habits when screen comes into focus
      if (user) {
        fetchUserPoints();
        loadCoreHabitsStatus();
      }
    }, [user, userGoals.length, checkTodaysCheckIns, loadCoreHabitsStatus])
  );

  // Load my active challenges
  const loadMyActiveChallenges = useCallback(async () => {
    if (!user?.id) return;
    
    setLoadingChallenges(true);
    try {
      const challenges = await challengesService.getUserChallenges(user.id);
      const now = new Date();
      
      // Only show challenges that are currently ACTIVE (started but not ended)
      const active = challenges.filter(challenge => {
        const startDate = new Date(challenge.start_date);
        const endDate = new Date(challenge.end_date);
        
        // Only show if currently active (started and not ended yet)
        return now >= startDate && now <= endDate;
      });
      setMyActiveChallenges(active);
    } catch (error) {
      console.error('Error loading active challenges:', error);
      setMyActiveChallenges([]);
    } finally {
      setLoadingChallenges(false);
    }
  }, [user?.id]);

  // Load challenges when user changes
  useEffect(() => {
    loadMyActiveChallenges();
  }, [loadMyActiveChallenges]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadMyActiveChallenges();
    } finally {
      setRefreshing(false);
    }
  }, [loadMyActiveChallenges]);

  // Memoized helper functions for better performance
  const getDateForDayOfWeekInWeek = useCallback((dayOfWeek: number, weekDate: Date): Date => {
    const weekStart = new Date(weekDate);
    // Set to Sunday of the selected week
    weekStart.setDate(weekDate.getDate() - weekDate.getDay());
    const targetDate = new Date(weekStart);
    targetDate.setDate(weekStart.getDate() + dayOfWeek);
    return targetDate;
  }, []);

  const getWeekStart = useCallback((date: Date): Date => {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return weekStart;
  }, []);

  const handleCheckInPress = useCallback((goal: any, dayOfWeek: number) => {
    setSelectedGoal(goal);
    
    // Set target check-in date based on overdue date if available
    if (goal.overdueDate) {
      setTargetCheckInDate(goal.overdueDate);
    } else {
      setTargetCheckInDate(null); // Use today's date
    }
    
    setShowCreatePostModal(true);
  }, []);


  function getTodayDateString(): string {
    const now = new Date();
    const hour = now.getHours();
    
    // If before 4am, use previous day (matching points service logic)
    const d = hour < 4 ? new Date(now.getTime() - 24 * 60 * 60 * 1000) : now;
    
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  const segmentIndexToHabit: Record<number, string> = {
    0: 'meditation',
    1: 'micro_learn',
    2: 'sleep',
    3: 'water',
    4: 'run',
    5: 'reflect',
    6: 'cold_shower',
    7: 'gym',
  };

  const habitTypeToSegmentIndex: Record<string, number> = {
    'sleep': 2,
    'water': 3,
    'run': 4,
    'reflect': 5,
    'cold_shower': 6,
    'gym': 7
  };

  return (
    <CustomBackground>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
        <ScrollView 
          style={[styles.scrollView, { backgroundColor: theme.background }]} 
          showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        >

        {/* Header with Settings */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              // Switch to the existing Profile tab (same as tapping it in the bottom nav)
              const parentNav = (navigation as any).getParent?.();
              if (parentNav) {
                parentNav.navigate('Profile');
              } else {
                (navigation as any).navigate('Profile');
              }
            }}
            style={styles.profileButton}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.profileAvatar} />
            ) : (
              <View style={[styles.profileAvatarPlaceholder, { backgroundColor: theme.cardBackground }]}>
                <Ionicons name="person-outline" size={18} color={theme.textPrimary} />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.profileHeaderCard}>
            <View style={styles.headerStatsRow}>
              {/* Money icon + 40 (left) */}
              <View style={styles.headerStat}>
                <Ionicons name="cash-outline" size={18} color={theme.textPrimary} />
                <Text style={[styles.headerStatText, { color: theme.textPrimary }]}>40</Text>
              </View>
              {/* Diamonds icon + 100 (right) */}
              <View style={styles.headerStat}>
                <Ionicons name="diamond-outline" size={18} color={theme.textPrimary} />
                <Text style={[styles.headerStatText, { color: theme.textPrimary }]}>100</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {/* Title centered */}
          </Text>
          
          <TouchableOpacity 
            onPress={() => (navigation as any).navigate('Notifications')}
            style={{ zIndex: 1 }}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Level Progress Bar */}
        <View style={{ marginHorizontal: 24, marginBottom: 16, marginTop: 12 }}>
          <TouchableOpacity 
            onPress={() => {
              const levelTitles = ['Beginner', 'Committed', 'Focused', 'Disciplined', 'Achiever', 'Challenger', 'Relentless', 'Ascended'];
              const currentTitle = levelTitles[levelProgress.currentLevel - 1];
              const levelThresholds = [0, 1400, 3200, 5500, 8600, 12500, 17500, 24000];
              const currentLevelStart = levelThresholds[levelProgress.currentLevel - 1];
              const currentLevelTotal = levelProgress.currentLevel < 8 
                ? levelThresholds[levelProgress.currentLevel] - currentLevelStart 
                : 0;
              
              Alert.alert(
                'Level Progress',
                levelProgress.currentLevel < 8 
                  ? `You are level ${levelProgress.currentLevel} — ${currentTitle}\n${levelProgress.pointsInCurrentLevel} / ${currentLevelTotal} points\n${levelProgress.pointsNeededForNext} points to level ${levelProgress.nextLevel}`
                  : `You are level ${levelProgress.currentLevel} — ${currentTitle}\n${levelProgress.pointsInCurrentLevel} points\nMax level reached!`,
                [{ text: 'OK' }]
              );
            }}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textPrimary, marginRight: 6 }}>{levelProgress.currentLevel}</Text>
              <View style={{ flex: 1, marginHorizontal: 4, height: 8, backgroundColor: 'rgba(16, 185, 129, 0.2)', borderRadius: 4, overflow: 'visible', position: 'relative' }}>
                {(() => {
                  // Calculate the total XP needed for current level
                  const levelThresholds = [0, 1400, 3200, 5500, 8600, 12500, 17500, 24000];
                  const currentLevelStart = levelThresholds[levelProgress.currentLevel - 1];
                  const levelXPRequired = levelProgress.currentLevel < 8 
                    ? levelThresholds[levelProgress.currentLevel] - currentLevelStart 
                    : 10000; // Max level uses arbitrary large number for display
                  
                  // Calculate progress percentage based on points in current level
                  const progressPercentage = Math.min(100, (levelProgress.pointsInCurrentLevel / levelXPRequired) * 100);
                  
                  return (
                    <>
                      <View 
                        style={{
                          height: '100%',
                          width: `${progressPercentage}%`,
                          backgroundColor: '#10B981',
                          borderRadius: 4,
                        }}
                      />
                      {/* Dash indicator showing exact points position */}
                      <View 
                        style={{
                          position: 'absolute',
                          left: `${progressPercentage}%`,
                          top: 14,
                          width: 1,
                          height: 8,
                          backgroundColor: '#ffffff',
                          transform: [{ translateX: -0.5 }],
                        }}
                      />
                      {/* Points count below dash */}
                      <View
                        style={{
                          position: 'absolute',
                          left: `${progressPercentage}%`,
                          top: 26,
                          transform: [{ translateX: -20 }],
                          width: 40,
                          alignItems: 'center',
                        }}
                      >
                        <Text 
                          style={{
                            fontSize: 10,
                            fontWeight: '600',
                            color: theme.textPrimary,
                            textAlign: 'center',
                          }}
                        >
                          {levelProgress.pointsInCurrentLevel}
                        </Text>
                      </View>
                    </>
                  );
                })()}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textPrimary, marginLeft: 6 }}>{levelProgress.nextLevel}</Text>
            </View>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
            <View style={{ width: 20 }} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary, marginRight: 4 }}>EXP</Text>
            <TouchableOpacity 
              onPress={async () => {
                // Refresh data before opening modal to ensure live updates
                if (user) {
                  const today = new Date();
                  const hour = today.getHours();
                  const dateToUse = hour < 4 ? new Date(today.getTime() - 24 * 60 * 60 * 1000) : today;
                  const dateString = dateToUse.toISOString().split('T')[0];
                  
                  // Refresh daily habits and core habits status
                  await Promise.all([
                    loadDailyHabits(dateString),
                    loadCoreHabitsStatus(),
                    fetchUserPoints()
                  ]);
                }
                setShowLevelModal(true);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="information-circle-outline" size={14} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting Section */}
        <View style={[styles.greetingSection, { flexDirection: 'row', alignItems: 'center' }]}>
          <Text style={[styles.greetingText, { color: theme.textPrimary }]}>
            {(() => {
              const hour = new Date().getHours();
              if (hour < 12) return 'Good morning';
              if (hour < 18) return 'Good afternoon';
              return 'Good evening';
            })()}{user?.username ? ` ${user.username},` : ' there,'} Day {user?.created_at ? Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1}
          </Text>
          <TouchableOpacity onPress={() => setShowStreakModal(true)} accessibilityRole="button" style={{ marginLeft: 8 }}>
            <Ionicons name="flame-outline" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Habit Spotlight Cards */}
        <View style={styles.highlightCarouselContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={spotlightCardWidth + 12}
            snapToAlignment="start"
            decelerationRate="fast"
            contentContainerStyle={styles.highlightCarouselContent}
          >
            {habitSpotlightCards.map((card, index) => {
              const cardState = habitCardState[card.key];
              const isCompletedCard = cardState?.completed;
              const progressAnimatedValue = cardState?.progressAnimated ?? new Animated.Value(card.progress);
              const progressWidth = progressAnimatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              });
              const cardBackgroundColor = isCompletedCard ? '#10B981' : (isDark ? '#1f1f1f' : '#111827');
              const progressTrackColor = isCompletedCard ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.15)';
              const progressFillColor = isCompletedCard ? '#ffffff' : card.accent;
              const subtitleColor = isCompletedCard ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.65)';

              return (
                <TouchableOpacity
                  key={card.key}
                  activeOpacity={0.85}
                  delayLongPress={250}
                  onPress={() => handleHabitPress(card.habitId)}
                  onLongPress={() => handleHabitLongPress(card.habitId)}
                  style={[
                    styles.highlightCard,
                    {
                      width: spotlightCardWidth,
                      marginRight: index === habitSpotlightCards.length - 1 ? 0 : 12,
                      backgroundColor: cardBackgroundColor,
                      shadowColor: isCompletedCard ? '#065f46' : isDark ? '#000000' : '#94a3b8',
                    },
                  ]}
                >
                  <View style={styles.highlightCardHeader}>
                    <View>
                      <Text style={[styles.highlightCardTitle, { color: '#ffffff' }]}>{card.title}</Text>
                      <Text style={[styles.highlightCardSubtitle, { color: subtitleColor }]}>{card.subtitle}</Text>
                    </View>
                    <Ionicons name="ellipsis-vertical" size={16} color="rgba(255, 255, 255, 0.65)" />
                  </View>

                  <View style={[styles.highlightCardProgress, { backgroundColor: progressTrackColor }]}>
                    <Animated.View
                      style={[
                        styles.highlightCardProgressFill,
                        {
                          width: progressWidth,
                          backgroundColor: progressFillColor,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.highlightCardMetricRow}>
                    <Text style={[styles.highlightCardMetricLabel, { color: subtitleColor }]}>{card.metricLabel}</Text>
                    <Text style={[styles.highlightCardMetricValue, { color: '#ffffff' }]}>{card.metricValue}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Active Challenges Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Active Challenges
            </Text>
          </View>
          {myActiveChallenges.length > 0 ? (
            <View style={styles.challengesContainer}>
              {myActiveChallenges.map((challenge) => (
                <TouchableOpacity
                  key={challenge.id}
                  style={[styles.challengeCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                  onPress={() => (navigation as any).navigate('ChallengeDetail', { challengeId: challenge.id })}
                >
                  <View style={styles.challengeCardContent}>
                    <View style={styles.challengeHeader}>
                      <Text style={[styles.challengeTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                        {challenge.title}
                      </Text>
                      <Text style={[styles.challengeTime, { color: theme.textSecondary }]}>
                        Ends {new Date(challenge.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={[styles.challengeCategory, { color: theme.textSecondary }]} numberOfLines={1}>
                      {challenge.category}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.challengesContainer, { paddingVertical: 20, alignItems: 'center' }]}>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                No active challenges. Join a challenge on the Compete page!
              </Text>
            </View>
          )}
        </View>

        {/* Combined Check-ins Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Reminders</Text>
            <TouchableOpacity 
              onPress={() => {
                // TODO: Implement add reminder functionality
                Alert.alert('Add Reminder', 'Coming soon');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
          <View key={`checkins-${refreshTrigger}`} style={[styles.todaysCheckinsContainer, { borderColor: theme.borderSecondary }]}>
            {/* Onboarding Reminder */}
            {onboardingIncomplete && (
              <TouchableOpacity 
                style={[styles.checkinItem, { borderBottomWidth: userGoals.length > 0 ? 1 : 0, borderBottomColor: theme.borderSecondary }]}
                onPress={() => {
                  (navigation as any).navigate('Onboarding');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.checkinItemLeft}>
                  <View style={[styles.categoryIcon, { backgroundColor: theme.primary + '20' }]}>
                    <Ionicons name="clipboard" size={18} color={theme.primary} />
                  </View>
                  <View style={styles.checkinItemContent}>
                    <Text style={[styles.checkinItemTitle, { color: theme.textPrimary }]}>Complete Onboarding</Text>
                    <Text style={[styles.checkinItemCategory, { color: theme.textSecondary }]}>
                      {onboardingLastStep ? `Step ${onboardingLastStep} of 13` : 'Continue setup'}
                    </Text>
                  </View>
                </View>
                <View style={styles.checkinItemRight}>
                  <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </View>
              </TouchableOpacity>
            )}
            <CheckInList
              userGoals={userGoals}
              overdueGoals={overdueGoals}
              checkedInGoals={checkedInGoals}
              overdueGoalDates={overdueGoalDates}
              overdueGoalCounts={overdueGoalCounts}
              goalProgress={goalProgress}
              theme={theme}
              user={user}
              onCheckInPress={handleCheckInPress}
              onGoalPress={(goal, onCheckInDeleted) => {
                (navigation as any).navigate('GoalDetail', { 
                  goal,
                  onCheckInDeleted: async () => {
                    // Refresh progress data when check-in is deleted
                    await fetchGoalProgress();
                    await checkTodaysCheckIns();
                    await checkForOverdueGoals();
                    // Add small delay to ensure database changes propagate
                    setTimeout(async () => {
                      await checkTodaysCheckIns();
                      await checkForOverdueGoals();
                      // Force UI refresh
                      setRefreshTrigger(prev => prev + 1);
                    }, 100);
                  }
                });
              }}
              styles={styles}
            />
          </View>
        </View>

        {/* Date Navigator with Integrated Daily Habits Summary */}
        <View style={styles.section}>
          <DateNavigator
            selectedDate={selectedDate}
            onDateChange={(date) => {
              setSelectedDate(date);
              // Don't update global dailyHabits - only update local DateNavigator data
            }}
            onViewHistory={() => {
              // TODO: Implement history view modal
            }}
            onHabitPress={(habitType, habitsData) => {
              setSelectedHabitType(habitType);
              setSelectedDateHabitsData(habitsData);
              setShowHabitInfoModal(true);
            }}

            dailyHabitsData={dailyHabits}
          />
        </View>

        


      </ScrollView>

      {/* Gym Questionnaire Modal - Combined Single Page */}
      <Modal
        visible={showGymModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGymModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <Animated.View style={[
              styles.modalContent,
              { transform: [{ translateY: modalPosition }] }
            ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gym Session</Text>
              <TouchableOpacity onPress={() => setShowGymModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
              {/* Day Type Selection */}
              <View style={styles.questionSection}>
                <Text style={styles.questionText}>What type of day is this?</Text>
                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      gymQuestionnaire.dayType === 'active' && styles.optionButtonSelected
                    ]}
                    onPress={() => {
                      setGymQuestionnaire(prev => ({ ...prev, dayType: 'active' }));
                    }}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      gymQuestionnaire.dayType === 'active' && styles.optionButtonTextSelected
                    ]}>
                      Active Day
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      gymQuestionnaire.dayType === 'rest' && styles.optionButtonSelected
                    ]}
                    onPress={() => {
                      setGymQuestionnaire(prev => ({ ...prev, dayType: 'rest' }));
                    }}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      gymQuestionnaire.dayType === 'rest' && styles.optionButtonTextSelected
                    ]}>
                      Rest Day
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Active Day Content */}
              {gymQuestionnaire.dayType === 'active' && (
                <>
                  {/* Training Type Selection */}
                  <View style={styles.questionSection}>
                    <Text style={styles.questionText}>What did you train?</Text>
                    <View style={styles.trainingTypesContainer}>
                      {trainingTypes.map((type, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.trainingTypeButton,
                            gymQuestionnaire.selectedTrainingTypes.includes(type) && styles.trainingTypeButtonSelected
                          ]}
                          onPress={() => {
                            setGymQuestionnaire(prev => {
                              const isSelected = prev.selectedTrainingTypes.includes(type);
                              if (isSelected) {
                                return { ...prev, selectedTrainingTypes: prev.selectedTrainingTypes.filter(t => t !== type) };
                              } else {
                                return { ...prev, selectedTrainingTypes: [...prev.selectedTrainingTypes, type] };
                              }
                            });
                          }}
                        >
                          <Text style={[
                            styles.trainingTypeButtonText,
                            gymQuestionnaire.selectedTrainingTypes.includes(type) && styles.trainingTypeButtonTextSelected
                          ]}>
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Custom Training Type Input for "Other" */}
                  {gymQuestionnaire.selectedTrainingTypes.includes('Other') && (
                    <View style={styles.questionSection}>
                      <Text style={styles.questionText}>What type of training was it?</Text>
                      <TextInput
                        style={styles.customInput}
                        placeholder="Enter your training type..."
                        value={gymQuestionnaire.customTrainingType}
                        onChangeText={(text) => setGymQuestionnaire(prev => ({ ...prev, customTrainingType: text }))}
                        placeholderTextColor="#999"
                        multiline
                        returnKeyType="default"
                      />
                    </View>
                  )}
                </>
              )}

              {/* Rest Day Content */}
              {gymQuestionnaire.dayType === 'rest' && (
                <View style={styles.questionSection}>
                  <Text style={styles.questionText}>Rest days are important for recovery!</Text>
                  <Text style={[styles.questionText, { fontSize: 16, fontWeight: '400', color: '#666' }]}>
                    Taking time to rest allows your muscles to recover and grow stronger.
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!gymQuestionnaire.dayType || (gymQuestionnaire.dayType === 'active' && (gymQuestionnaire.selectedTrainingTypes.length === 0 || (gymQuestionnaire.selectedTrainingTypes.includes('Other') && !gymQuestionnaire.customTrainingType.trim())))) && styles.submitButtonDisabled
              ]}
              disabled={!gymQuestionnaire.dayType || (gymQuestionnaire.dayType === 'active' && (gymQuestionnaire.selectedTrainingTypes.length === 0 || (gymQuestionnaire.selectedTrainingTypes.includes('Other') && !gymQuestionnaire.customTrainingType.trim())))}
              onPress={async () => {
                try {
                  const date = getTodayDateString();
                  const habitData = {
                    date,
                    gym_day_type: gymQuestionnaire.dayType as 'active' | 'rest',
                    gym_training_types: gymQuestionnaire.dayType === 'active' ? gymQuestionnaire.selectedTrainingTypes : [],
                    gym_custom_type: gymQuestionnaire.dayType === 'active' ? gymQuestionnaire.customTrainingType : '',
                  };
                  
                  const success = await useActionStore.getState().saveDailyHabits(habitData);
                  if (success) {
                    markHabitCompleted('gym'); // Sound plays here when animation starts
                    setShowGymModal(false);
                    setGymQuestionnaire({ dayType: '', selectedTrainingTypes: [], customTrainingType: '' });
                  } else {
                    console.error('Failed to save gym data');
                  }
                } catch (error) {
                  console.error('Error saving gym data:', error);
                }
              }}
            >
              <Text style={styles.submitButtonText}>
                {gymQuestionnaire.dayType === 'rest' ? 'Complete Rest Day' : 'Complete Session'}
              </Text>
            </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>


      {/* Sleep Questionnaire Modal */}
      <Modal
        visible={showSleepModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSleepModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <Animated.View style={[
              styles.sleepModalContent,
              { transform: [{ translateY: modalPosition }] }
            ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sleep</Text>
              <TouchableOpacity onPress={() => setShowSleepModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>



            {/* Sleep Quality Slider */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>How was your sleep?</Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={100}
                  value={sleepQuestionnaire.sleepQuality}
                  onValueChange={(value) => setSleepQuestionnaire(prev => ({ ...prev, sleepQuality: Math.round(value) }))}
                  minimumTrackTintColor="#10B981"
                  maximumTrackTintColor="#E5E7EB"
                  thumbTintColor="#10B981"
                  step={1}
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderPercentage}>{sleepQuestionnaire.sleepQuality}%</Text>
                  <Text style={[styles.sliderQualityLabel, { color: getSleepQualityColor(sleepQuestionnaire.sleepQuality) }]}>
                    {getSleepQualityLabel(sleepQuestionnaire.sleepQuality)}
                  </Text>
                </View>
              </View>
            </View>
            {/* Bedtime and Wake Time */}
            <View style={styles.questionSection}>
              {/* Section Titles */}
              <View style={styles.timePickerRow}>
                <Text style={styles.timePickerGroupLabel}>Bed Time</Text>
                <Text style={styles.timePickerGroupLabelRight}>Wake Time</Text>
              </View>
              <View style={styles.timePickerRow}>
                {/* Bedtime */}
                <View style={styles.timePickerGroup}>
                  <View style={styles.timePickerContentRow}>
                    {/* Hours column */}
                    <View style={styles.timePickerColumn}>
                      <Text style={styles.timePickerLabel}>Hour</Text>
                      <ScrollView 
                        style={styles.timePickerScroll} 
                        contentContainerStyle={{ alignItems: 'flex-start' }}
                        showsVerticalScrollIndicator={false}
                        snapToInterval={65}
                        decelerationRate="fast"
                        contentOffset={{ x: 0, y: (sleepQuestionnaire.bedtimeHours + 24) * 65 }}
                        onMomentumScrollEnd={(event) => {
                          const y = event.nativeEvent.contentOffset.y;
                          const itemHeight = 65;
                          const selectedIndex = Math.round(y / itemHeight);
                          // Account for the duplicate items at the top
                          const actualIndex = selectedIndex % 24;
                          setSleepQuestionnaire(prev => ({ ...prev, bedtimeHours: actualIndex }));
                        }}
                      >
                        {/* Extra items for wrapping at top */}
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                          <TouchableOpacity
                            key={`bedtime-h-top-wrap-${hour}`}
                            style={styles.timePickerItem}
                            onPress={() => setSleepQuestionnaire(prev => ({ ...prev, bedtimeHours: hour }))}
                          >
                            <Text style={styles.timePickerItemText}>
                              {hour.toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                          <TouchableOpacity
                            key={`bedtime-h-${hour}`}
                            style={styles.timePickerItem}
                            onPress={() => setSleepQuestionnaire(prev => ({ ...prev, bedtimeHours: hour }))}
                          >
                            <Text style={styles.timePickerItemText}>
                              {hour.toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {/* Extra items for wrapping at bottom */}
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                          <TouchableOpacity
                            key={`bedtime-h-bottom-wrap-${hour}`}
                            style={styles.timePickerItem}
                            onPress={() => setSleepQuestionnaire(prev => ({ ...prev, bedtimeHours: hour }))}
                          >
                            <Text style={styles.timePickerItemText}>
                              {hour.toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Minutes column */}
                    <View style={styles.timePickerColumn}>
                      <Text style={styles.timePickerLabel}>Minute</Text>
                      <ScrollView 
                        style={styles.timePickerScroll} 
                        contentContainerStyle={{ alignItems: 'flex-start' }}
                        showsVerticalScrollIndicator={false}
                        snapToInterval={65}
                        decelerationRate="fast"
                        contentOffset={{ x: 0, y: (sleepQuestionnaire.bedtimeMinutes + 60) * 65 }}
                        onMomentumScrollEnd={(event) => {
                          const y = event.nativeEvent.contentOffset.y;
                          const itemHeight = 65;
                          const selectedIndex = Math.round(y / itemHeight);
                          // Account for the duplicate items at the top
                          const actualIndex = selectedIndex % 60;
                          setSleepQuestionnaire(prev => ({ ...prev, bedtimeMinutes: actualIndex }));
                        }}
                      >
                        {/* Extra items for wrapping at top */}
                        {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                          <TouchableOpacity
                            key={`bedtime-m-top-wrap-${minute}`}
                            style={styles.timePickerItem}
                            onPress={() => setSleepQuestionnaire(prev => ({ ...prev, bedtimeMinutes: minute }))}
                          >
                            <Text style={styles.timePickerItemText}>
                              {minute.toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                          <TouchableOpacity
                            key={`bedtime-m-${minute}`}
                            style={styles.timePickerItem}
                            onPress={() => setSleepQuestionnaire(prev => ({ ...prev, bedtimeMinutes: minute }))}
                          >
                            <Text style={styles.timePickerItemText}>
                              {minute.toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {/* Extra items for wrapping at bottom */}
                        {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                          <TouchableOpacity
                            key={`bedtime-m-bottom-wrap-${minute}`}
                            style={styles.timePickerItem}
                            onPress={() => setSleepQuestionnaire(prev => ({ ...prev, bedtimeMinutes: minute }))}
                          >
                            <Text style={styles.timePickerItemText}>
                              {minute.toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </View>

                {/* Wake Time */}
                <View style={styles.timePickerGroupRight}>
                  <View style={styles.timePickerContentRow}>
                    {/* Hours column */}
                    <View style={styles.timePickerColumn}>
                      <Text style={styles.timePickerLabel}>Hour</Text>
                      <ScrollView 
                        style={styles.timePickerScroll} 
                        contentContainerStyle={{ alignItems: 'flex-start' }}
                        showsVerticalScrollIndicator={false}
                        snapToInterval={65}
                        decelerationRate="fast"
                        contentOffset={{ x: 0, y: (sleepQuestionnaire.wakeupHours + 24) * 65 }}
                        onMomentumScrollEnd={(event) => {
                          const y = event.nativeEvent.contentOffset.y;
                          const itemHeight = 65;
                          const selectedIndex = Math.round(y / itemHeight);
                          // Account for the duplicate items at the top
                          const actualIndex = selectedIndex % 24;
                          setSleepQuestionnaire(prev => ({ ...prev, wakeupHours: actualIndex }));
                        }}
                      >
                        {/* Extra items for wrapping at top */}
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                          <TouchableOpacity
                            key={`wakeup-h-top-wrap-${hour}`}
                            style={styles.timePickerItem}
                            onPress={() => setSleepQuestionnaire(prev => ({ ...prev, wakeupHours: hour }))}
                          >
                            <Text style={styles.timePickerItemText}>
                              {hour.toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                          <TouchableOpacity
                            key={`wakeup-h-${hour}`}
                            style={styles.timePickerItem}
                            onPress={() => setSleepQuestionnaire(prev => ({ ...prev, wakeupHours: hour }))}
                          >
                            <Text style={styles.timePickerItemText}>
                              {hour.toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {/* Extra items for wrapping at bottom */}
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                          <TouchableOpacity
                            key={`wakeup-h-bottom-wrap-${hour}`}
                            style={styles.timePickerItem}
                            onPress={() => setSleepQuestionnaire(prev => ({ ...prev, wakeupHours: hour }))}
                          >
                            <Text style={styles.timePickerItemText}>
                              {hour.toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Minutes column */}
                    <View style={styles.timePickerColumn}>
                      <Text style={styles.timePickerLabel}>Minute</Text>
                      <ScrollView 
                        style={styles.timePickerScroll} 
                        contentContainerStyle={{ alignItems: 'flex-start' }}
                        showsVerticalScrollIndicator={false}
                        snapToInterval={65}
                        decelerationRate="fast"
                        contentOffset={{ x: 0, y: (sleepQuestionnaire.wakeupMinutes + 60) * 65 }}
                        onMomentumScrollEnd={(event) => {
                          const y = event.nativeEvent.contentOffset.y;
                          const itemHeight = 65;
                          const selectedIndex = Math.round(y / itemHeight);
                          // Account for the duplicate items at the top
                          const actualIndex = selectedIndex % 60;
                          setSleepQuestionnaire(prev => ({ ...prev, wakeupMinutes: actualIndex }));
                        }}
                      >
                        {/* Extra items for wrapping at top */}
                        {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                          <TouchableOpacity
                            key={`wakeup-m-top-wrap-${minute}`}
                            style={styles.timePickerItem}
                            onPress={() => setSleepQuestionnaire(prev => ({ ...prev, wakeupMinutes: minute }))}
                          >
                            <Text style={styles.timePickerItemText}>
                              {minute.toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                          <TouchableOpacity
                            key={`wakeup-m-${minute}`}
                            style={styles.timePickerItem}
                            onPress={() => setSleepQuestionnaire(prev => ({ ...prev, wakeupMinutes: minute }))}
                          >
                            <Text style={styles.timePickerItemText}>
                              {minute.toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {/* Extra items for wrapping at bottom */}
                        {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                          <TouchableOpacity
                            key={`wakeup-m-bottom-wrap-${minute}`}
                            style={styles.timePickerItem}
                            onPress={() => setSleepQuestionnaire(prev => ({ ...prev, wakeupMinutes: minute }))}
                          >
                            <Text style={styles.timePickerItemText}>
                              {minute.toString().padStart(2, '0')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Calculated Sleep Time */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>Calculated Sleep Time</Text>
              <View style={styles.calculatedSleepContainer}>
                <Text style={styles.calculatedSleepText}>
                  {(() => {
                    const bedtimeTotal = sleepQuestionnaire.bedtimeHours * 60 + sleepQuestionnaire.bedtimeMinutes;
                    const wakeTimeTotal = sleepQuestionnaire.wakeupHours * 60 + sleepQuestionnaire.wakeupMinutes;
                    let sleepDuration;
                    
                    if (wakeTimeTotal > bedtimeTotal) {
                      // Same day: wake time is after bedtime
                      sleepDuration = wakeTimeTotal - bedtimeTotal;
                    } else {
                      // Next day: wake time is before bedtime (crossed midnight)
                      sleepDuration = (24 * 60) - bedtimeTotal + wakeTimeTotal;
                    }
                    
                    const hours = Math.floor(sleepDuration / 60);
                    const minutes = sleepDuration % 60;
                    return `${hours}h ${minutes}m`;
                  })()}
                </Text>
              </View>
            </View>
            
            {/* Sleep Notes */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>Any sleep notes? (optional)</Text>
              <TextInput
                style={styles.customInput}
                placeholder="e.g., Woke up feeling refreshed..."
                value={sleepQuestionnaire.sleepNotes}
                onChangeText={(text) => setSleepQuestionnaire(prev => ({ ...prev, sleepNotes: text }))}
                placeholderTextColor="#999"
                multiline
              />
            </View>

            {/* Error Display */}
            {useActionStore.getState().dailyHabitsError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  {useActionStore.getState().dailyHabitsError}
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                useActionStore.getState().dailyHabitsLoading && styles.submitButtonDisabled
              ]}
              disabled={useActionStore.getState().dailyHabitsLoading}
              onPress={async () => {
                try {
                  const date = getTodayDateString();
                  // Calculate sleep duration
                  const bedtimeTotal = sleepQuestionnaire.bedtimeHours * 60 + sleepQuestionnaire.bedtimeMinutes;
                  const wakeTimeTotal = sleepQuestionnaire.wakeupHours * 60 + sleepQuestionnaire.wakeupMinutes;
                  let sleepDuration;
                  
                  if (wakeTimeTotal > bedtimeTotal) {
                    // Same day: wake time is after bedtime
                    sleepDuration = wakeTimeTotal - bedtimeTotal;
                  } else {
                    // Next day: wake time is before bedtime (crossed midnight)
                    sleepDuration = (24 * 60) - bedtimeTotal + wakeTimeTotal;
                  }
                  
                  const sleepHours = Math.round(sleepDuration / 60); // Convert minutes to hours and round to integer
                  
                  const habitData = {
                    date,
                    sleep_quality: sleepQuestionnaire.sleepQuality,
                    sleep_hours: sleepHours,
                    sleep_bedtime_hours: sleepQuestionnaire.bedtimeHours,
                    sleep_bedtime_minutes: sleepQuestionnaire.bedtimeMinutes,
                    sleep_wakeup_hours: sleepQuestionnaire.wakeupHours,
                    sleep_wakeup_minutes: sleepQuestionnaire.wakeupMinutes,
                    sleep_notes: sleepQuestionnaire.sleepNotes,
                  };
                  
                  const success = await useActionStore.getState().saveDailyHabits(habitData);
                  if (success) {
                    markHabitCompleted('sleep'); // Sound plays here when animation starts
                    setShowSleepModal(false);
                    setSleepQuestionnaire({ sleepQuality: 50, bedtimeHours: 22, bedtimeMinutes: 0, wakeupHours: 6, wakeupMinutes: 0, sleepNotes: '' });
                  } else {
                    console.error('Failed to save sleep data');
                  }
                } catch (error) {
                  console.error('Error saving sleep data:', error);
                }
              }}            >
              <Text style={styles.submitButtonText}>
                {useActionStore.getState().dailyHabitsLoading ? 'Saving...' : 'Complete Sleep Log'}
              </Text>
            </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Water Questionnaire Modal */}
      <Modal
        visible={showWaterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowWaterModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <Animated.View style={[
              styles.modalContent,
              { transform: [{ translateY: modalPosition }] }
            ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Water Intake</Text>
              <TouchableOpacity onPress={() => setShowWaterModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Water Intake Slider */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>How much water did you drink today?</Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={10}
                  value={waterQuestionnaire.waterIntake}
                  onValueChange={(value) => setWaterQuestionnaire(prev => ({ ...prev, waterIntake: Math.round(value) }))}
                  minimumTrackTintColor="#10B981"
                  maximumTrackTintColor="#E5E7EB"
                  thumbTintColor="#10B981"
                  step={1}
                />
                <View style={styles.sliderLabels}>
                  <Text style={[styles.sliderPercentage, { color: getWaterIntakeColor(waterQuestionnaire.waterIntake) }]}>
                    {formatWaterIntake(waterQuestionnaire.waterIntake)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Water Goal */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>Did you meet your water goal?</Text>
              <View style={styles.otherOptionsContainer}>
                {['Yes', 'Almost', 'No'].map((goal) => (
                  <TouchableOpacity
                    key={goal}
                    style={[
                      styles.otherOptionButton,
                      waterQuestionnaire.waterGoal === goal && styles.otherOptionButtonSelected
                    ]}
                    onPress={() => setWaterQuestionnaire(prev => ({ ...prev, waterGoal: goal }))}
                  >
                    <Text style={[
                      styles.otherOptionButtonText,
                      waterQuestionnaire.waterGoal === goal && styles.otherOptionButtonTextSelected
                    ]}>
                      {goal}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Water Notes */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>Any notes? (optional)</Text>
              <TextInput
                style={styles.customInput}
                placeholder="e.g., Felt more energized today..."
                value={waterQuestionnaire.waterNotes}
                onChangeText={(text) => setWaterQuestionnaire(prev => ({ ...prev, waterNotes: text }))}
                placeholderTextColor="#999"
                multiline
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                !waterQuestionnaire.waterGoal && styles.submitButtonDisabled
              ]}
              disabled={!waterQuestionnaire.waterGoal}
              onPress={async () => {
                try {
                  const date = getTodayDateString();
                  const habitData = {
                    date,
                    water_intake: Math.round(waterQuestionnaire.waterIntake * 0.45), // Convert slider value (0-10) to liters (0-4.5L) and round to integer
                    water_goal: waterQuestionnaire.waterGoal,
                    water_notes: waterQuestionnaire.waterNotes,
                  };
                  
                  const success = await useActionStore.getState().saveDailyHabits(habitData);
                  if (success) {
                    markHabitCompleted('water'); // Sound plays here when animation starts
                    setShowWaterModal(false);
                    setWaterQuestionnaire({ waterIntake: 5, waterGoal: '', waterNotes: '' });
                  } else {
                    console.error('Failed to save water data');
                  }
                } catch (error) {
                  console.error('Error saving water data:', error);
                }
              }}
            >
              <Text style={styles.submitButtonText}>Complete Water Log</Text>
            </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Run Questionnaire Modal - Combined Single Page */}
      <Modal
        visible={showRunModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRunModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <Animated.View style={[
              styles.runModalContent,
              { transform: [{ translateY: modalPosition }] }
            ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Run Session</Text>
              <TouchableOpacity onPress={() => setShowRunModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
              {/* Day Type Selection */}
              <View style={styles.questionSection}>
                <Text style={styles.questionText}>What type of day is this?</Text>
                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      runQuestionnaire.dayType === 'active' && styles.optionButtonSelected
                    ]}
                    onPress={() => {
                      setRunQuestionnaire(prev => ({ ...prev, dayType: 'active' }));
                    }}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      runQuestionnaire.dayType === 'active' && styles.optionButtonTextSelected
                    ]}>
                      Active Day
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.optionButton,
                      runQuestionnaire.dayType === 'rest' && styles.optionButtonSelected
                    ]}
                    onPress={() => {
                      setRunQuestionnaire(prev => ({ ...prev, dayType: 'rest' }));
                    }}
                  >
                    <Text style={[
                      styles.optionButtonText,
                      runQuestionnaire.dayType === 'rest' && styles.optionButtonTextSelected
                    ]}>
                      Rest Day
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Active Day Content */}
              {runQuestionnaire.dayType === 'active' && (
                <>
                  {/* Activity Type Selection */}
                  <View style={styles.questionSection}>
                    <Text style={styles.questionText}>What type of activity?</Text>
                    <View style={styles.optionsContainer}>
                      <TouchableOpacity
                        style={[
                          styles.optionButton,
                          runQuestionnaire.activityType === 'run' && styles.optionButtonSelected
                        ]}
                        onPress={() => {
                          setRunQuestionnaire(prev => ({ ...prev, activityType: 'run' }));
                        }}
                      >
                        <Text style={[
                          styles.optionButtonText,
                          runQuestionnaire.activityType === 'run' && styles.optionButtonTextSelected
                        ]}>
                          Run
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.optionButton,
                          runQuestionnaire.activityType === 'walk' && styles.optionButtonSelected
                        ]}
                        onPress={() => {
                          setRunQuestionnaire(prev => ({ ...prev, activityType: 'walk' }));
                        }}
                      >
                        <Text style={[
                          styles.optionButtonText,
                          runQuestionnaire.activityType === 'walk' && styles.optionButtonTextSelected
                        ]}>
                          Walk
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Run Type Selection - Only show if activity type is selected */}
                  {runQuestionnaire.activityType && (
                    <>
                      <View style={styles.questionSection}>
                        <View style={styles.otherOptionsContainer}>
                          {['Easy', 'Tempo', 'Long', 'Speed', 'Recovery', 'Race'].map((type) => (
                            <TouchableOpacity
                              key={type}
                              style={[
                                styles.otherOptionButton,
                                runQuestionnaire.runType === type && styles.otherOptionButtonSelected
                              ]}
                              onPress={() => setRunQuestionnaire(prev => ({ ...prev, runType: type }))}
                            >
                              <Text style={[
                                styles.otherOptionButtonText,
                                runQuestionnaire.runType === type && styles.otherOptionButtonTextSelected
                              ]}>
                                {type}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>

                      {/* Distance Slider */}
                      <View style={styles.questionSection}>
                        <Text style={styles.questionText}>Distance covered?</Text>
                        <View style={styles.sliderContainer}>
                          {/* Popular Distance Buttons */}
                          <View style={styles.popularDistanceButtons}>
                            <TouchableOpacity 
                              style={styles.popularDistanceButton}
                              onPress={() => setRunQuestionnaire(prev => ({ ...prev, distance: 10 }))}
                            >
                              <Text style={styles.popularDistanceButtonText}>5km</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                              style={styles.popularDistanceButton}
                              onPress={() => setRunQuestionnaire(prev => ({ ...prev, distance: 20 }))}
                            >
                              <Text style={styles.popularDistanceButtonText}>10km</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                              style={styles.popularDistanceButton}
                              onPress={() => setRunQuestionnaire(prev => ({ ...prev, distance: 42 }))}
                            >
                              <Text style={styles.popularDistanceButtonText}>Half Marathon</Text>
                            </TouchableOpacity>
                          </View>
                          
                          <Slider
                            style={styles.slider}
                            minimumValue={0}
                            maximumValue={85}
                            value={runQuestionnaire.distance}
                            onValueChange={(value) => setRunQuestionnaire(prev => ({ ...prev, distance: Math.round(value) }))}
                            minimumTrackTintColor="#10B981"
                            maximumTrackTintColor="#E5E7EB"
                            thumbTintColor="#10B981"
                            step={1}
                          />
                          <View style={styles.sliderLabels}>
                            <Text style={[styles.sliderPercentage, { color: getRunDistanceColor(runQuestionnaire.distance) }]}>
                              {formatRunDistance(runQuestionnaire.distance)}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Duration */}
                      <View style={styles.questionSection}>
                        <Text style={styles.questionText}>How long did it take?</Text>
                        <View style={styles.timePickerRow}>
                          {/* Hours column */}
                          <View style={styles.timePickerColumn}>
                            <Text style={styles.timePickerLabel}>Hours</Text>
                            <ScrollView 
                              style={styles.timePickerScroll} 
                              showsVerticalScrollIndicator={false}
                              snapToInterval={65}
                              decelerationRate="fast"
                              onMomentumScrollEnd={(event) => {
                                const y = event.nativeEvent.contentOffset.y;
                                const itemHeight = 65;
                                const selectedIndex = Math.round(y / itemHeight);
                                const clampedIndex = Math.max(0, Math.min(selectedIndex, 12));
                                setRunQuestionnaire(prev => ({ ...prev, durationHours: clampedIndex }));
                              }}
                            >
                              {Array.from({ length: 13 }, (_, i) => i).map((hour) => (
                                <TouchableOpacity
                                  key={`h-${hour}`}
                                  style={styles.timePickerItem}
                                  onPress={() => setRunQuestionnaire(prev => ({ ...prev, durationHours: hour }))}
                                >
                                  <Text style={styles.timePickerItemText}>
                                    {hour}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>

                          {/* Minutes column */}
                          <View style={styles.timePickerColumn}>
                            <Text style={styles.timePickerLabel}>Minutes</Text>
                            <ScrollView 
                              style={styles.timePickerScroll} 
                              showsVerticalScrollIndicator={false}
                              snapToInterval={65}
                              decelerationRate="fast"
                              onMomentumScrollEnd={(event) => {
                                const y = event.nativeEvent.contentOffset.y;
                                const itemHeight = 65;
                                const selectedIndex = Math.round(y / itemHeight);
                                const clampedIndex = Math.max(0, Math.min(selectedIndex, 59));
                                setRunQuestionnaire(prev => ({ ...prev, durationMinutes: clampedIndex }));
                              }}
                            >
                              {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                                <TouchableOpacity
                                  key={`m-${minute}`}
                                  style={styles.timePickerItem}
                                  onPress={() => setRunQuestionnaire(prev => ({ ...prev, durationMinutes: minute }))}
                                >
                                  <Text style={styles.timePickerItemText}>
                                    {minute.toString().padStart(2, '0')}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>

                          {/* Seconds column */}
                          <View style={styles.timePickerColumn}>
                            <Text style={styles.timePickerLabel}>Seconds</Text>
                            <ScrollView 
                              style={styles.timePickerScroll} 
                              showsVerticalScrollIndicator={false}
                              snapToInterval={65}
                              decelerationRate="fast"
                              onMomentumScrollEnd={(event) => {
                                const y = event.nativeEvent.contentOffset.y;
                                const itemHeight = 65;
                                const selectedIndex = Math.round(y / itemHeight);
                                const clampedIndex = Math.max(0, Math.min(selectedIndex, 59));
                                setRunQuestionnaire(prev => ({ ...prev, durationSeconds: clampedIndex }));
                              }}
                            >
                              {Array.from({ length: 60 }, (_, i) => i).map((second) => (
                                <TouchableOpacity
                                  key={`s-${second}`}
                                  style={styles.timePickerItem}
                                  onPress={() => setRunQuestionnaire(prev => ({ ...prev, durationSeconds: second }))}
                                >
                                  <Text style={styles.timePickerItemText}>
                                    {second.toString().padStart(2, '0')}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        </View>
                      </View>

                      {/* Run Notes */}
                      <View style={styles.questionSection}>
                        <Text style={styles.questionText}>How did it feel? (optional)</Text>
                        <TextInput
                          style={styles.customInput}
                          placeholder="e.g., Felt strong, good pace..."
                          value={runQuestionnaire.runNotes}
                          onChangeText={(text) => setRunQuestionnaire(prev => ({ ...prev, runNotes: text }))}
                          placeholderTextColor="#999"
                          multiline
                          textAlignVertical="top"
                        />
                      </View>
                    </>
                  )}
                </>
              )}

              {/* Rest Day Content */}
              {runQuestionnaire.dayType === 'rest' && (
                <View style={styles.questionSection}>
                  <Text style={styles.questionText}>Rest days are important for recovery!</Text>
                  <Text style={[styles.questionText, { fontSize: 16, fontWeight: '400', color: '#666' }]}>
                    Taking time to rest allows your muscles to recover and prevents injury.
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!runQuestionnaire.dayType || (runQuestionnaire.dayType === 'active' && (!runQuestionnaire.activityType || !runQuestionnaire.runType))) && styles.submitButtonDisabled
              ]}
              disabled={!runQuestionnaire.dayType || (runQuestionnaire.dayType === 'active' && (!runQuestionnaire.activityType || !runQuestionnaire.runType))}
              onPress={async () => {
                try {
                  const date = getTodayDateString();
                  const habitData = {
                    date,
                    run_activity_type: runQuestionnaire.dayType === 'active' ? (runQuestionnaire.activityType as 'run' | 'walk') : undefined,
                    run_day_type: runQuestionnaire.dayType as 'active' | 'rest',
                    run_type: runQuestionnaire.dayType === 'active' ? runQuestionnaire.runType : undefined,
                    run_distance: runQuestionnaire.dayType === 'active' ? runQuestionnaire.distance * 0.5 : undefined,
                    run_duration: runQuestionnaire.dayType === 'active' ? `${runQuestionnaire.durationHours}:${runQuestionnaire.durationMinutes.toString().padStart(2, '0')}:${runQuestionnaire.durationSeconds.toString().padStart(2, '0')}` : undefined,
                    run_notes: runQuestionnaire.dayType === 'active' ? runQuestionnaire.runNotes : undefined,
                  };
                  
                  const success = await useActionStore.getState().saveDailyHabits(habitData);
                  if (success) {
                    markHabitCompleted('run'); // Sound plays here when animation starts
                    setShowRunModal(false);
                    setRunQuestionnaire({ dayType: '', activityType: '', runType: '', distance: 5, durationHours: 0, durationMinutes: 30, durationSeconds: 0, runNotes: '' });
                  } else {
                    console.error('Failed to save run data');
                    const error = useActionStore.getState().dailyHabitsError;
                    console.error('Error details:', error);
                  }
                } catch (error) {
                  console.error('Error saving run data:', error);
                }
              }}
            >
              <Text style={styles.submitButtonText}>
                {runQuestionnaire.dayType === 'rest' ? 'Complete Rest Day' : 'Complete Run Log'}
              </Text>
            </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>


      {/* Reflect Questionnaire Modal */}
      <Modal
        visible={showReflectModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowReflectModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <Animated.View 
              style={[
                styles.modalContent,
                { transform: [{ translateY: modalPosition }] }
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Daily Reflection</Text>
                <TouchableOpacity onPress={() => setShowReflectModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>


              {/* Step 1: Mood */}
              {reflectQuestionnaire.currentStep === 1 && (
                <>
                  <View style={styles.questionSection}>
                    <Text style={styles.questionText}>How are you feeling today?</Text>
                    <View style={styles.sliderContainer}>
                      <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={5}
                        value={reflectQuestionnaire.mood}
                        onValueChange={(value) => setReflectQuestionnaire(prev => ({ ...prev, mood: value }))}
                        minimumTrackTintColor="#10B981"
                        maximumTrackTintColor="#E5E7EB"
                      />
                      <View style={styles.sliderLabels}>
                        <Text style={styles.emojiLarge}>{['','😞','😐','🙂','😁','🥳'][Math.round(reflectQuestionnaire.mood)]}</Text>
                        <Text style={styles.sliderText}>
                          {Math.round(reflectQuestionnaire.mood) === 1 ? 'Poor' : 
                           Math.round(reflectQuestionnaire.mood) === 2 ? 'Fair' : 
                           Math.round(reflectQuestionnaire.mood) === 3 ? 'Good' : 
                           Math.round(reflectQuestionnaire.mood) === 4 ? 'Great' : 'Excellent'}
                        </Text>
                      </View>
                      <Text style={styles.sliderValue}>{Math.round(reflectQuestionnaire.mood)}/5</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.nextButtonStandalone}
                    onPress={() => setReflectQuestionnaire(prev => ({ ...prev, currentStep: 2 }))}
                  >
                    <Text style={styles.nextButtonText}>Next</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Step 2: Energy */}
              {reflectQuestionnaire.currentStep === 2 && (
                <>
                  <View style={styles.questionSection}>
                    <Text style={styles.questionText}>How's your energy level?</Text>
                    <View style={styles.sliderContainer}>
                      <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={5}
                        value={reflectQuestionnaire.energy}
                        onValueChange={(value) => setReflectQuestionnaire(prev => ({ ...prev, energy: value }))}
                        minimumTrackTintColor="#10B981"
                        maximumTrackTintColor="#E5E7EB"
                      />
                      <View style={styles.sliderLabels}>
                        <Text style={styles.emojiLarge}>{['','😞','😐','🙂','😁','🥳'][Math.round(reflectQuestionnaire.energy)]}</Text>
                        <Text style={styles.sliderText}>
                          {Math.round(reflectQuestionnaire.energy) === 1 ? 'Poor' : 
                           Math.round(reflectQuestionnaire.energy) === 2 ? 'Fair' : 
                           Math.round(reflectQuestionnaire.energy) === 3 ? 'Good' : 
                           Math.round(reflectQuestionnaire.energy) === 4 ? 'Great' : 'Excellent'}
                        </Text>
                      </View>
                      <Text style={styles.sliderValue}>{Math.round(reflectQuestionnaire.energy)}/5</Text>
                    </View>
                  </View>

                  <View style={styles.navigationButtons}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => setReflectQuestionnaire(prev => ({ ...prev, currentStep: 1 }))}
                    >
                      <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.nextButton}
                      onPress={() => setReflectQuestionnaire(prev => ({ ...prev, currentStep: 3 }))}
                    >
                      <Text style={styles.nextButtonText}>Next</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Step 3: What Went Well */}
              {reflectQuestionnaire.currentStep === 3 && (
                <>
                  <View style={styles.questionSection}>
                    <Text style={styles.questionText}>What went well today?</Text>
                    <TextInput
                      style={styles.customInput}
                      value={reflectQuestionnaire.whatWentWell}
                      onChangeText={(text) => setReflectQuestionnaire(prev => ({ ...prev, whatWentWell: text }))}
                      placeholder="Share something positive from your day..."
                      placeholderTextColor="#999"
                      multiline
                      maxLength={140}
                      numberOfLines={3}
                    />
                    <Text style={styles.characterCount}>{reflectQuestionnaire.whatWentWell.length}/140</Text>
                  </View>

                  <View style={styles.navigationButtons}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => setReflectQuestionnaire(prev => ({ ...prev, currentStep: 2 }))}
                    >
                      <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.nextButton}
                      onPress={() => setReflectQuestionnaire(prev => ({ ...prev, currentStep: 4 }))}
                    >
                      <Text style={styles.nextButtonText}>Next</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Step 4: Friction */}
              {reflectQuestionnaire.currentStep === 4 && (
                <>
                  <View style={styles.questionSection}>
                    <Text style={styles.questionText}>What got in the way today?</Text>
                    <TextInput
                      style={styles.customInput}
                      value={reflectQuestionnaire.friction}
                      onChangeText={(text) => setReflectQuestionnaire(prev => ({ ...prev, friction: text }))}
                      placeholder="What obstacles or challenges did you face?"
                      placeholderTextColor="#999"
                      multiline
                      maxLength={140}
                      numberOfLines={3}
                    />
                    <Text style={styles.characterCount}>{reflectQuestionnaire.friction.length}/140</Text>
                  </View>

                  <View style={styles.navigationButtons}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => setReflectQuestionnaire(prev => ({ ...prev, currentStep: 3 }))}
                    >
                      <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.nextButton}
                      onPress={() => setReflectQuestionnaire(prev => ({ ...prev, currentStep: 5 }))}
                    >
                      <Text style={styles.nextButtonText}>Next</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Step 5: One Tweak */}
              {reflectQuestionnaire.currentStep === 5 && (
                <>
                  <View style={styles.questionSection}>
                    <Text style={styles.questionText}>What will you change tomorrow?</Text>
                    
                    {/* Text input for one tweak (disabled if nothing to change is checked) */}
                    <TextInput
                      style={[
                        styles.customInput,
                        reflectQuestionnaire.nothingToChange && styles.disabledInput
                      ]}
                      value={reflectQuestionnaire.oneTweak}
                      onChangeText={(text) => setReflectQuestionnaire(prev => ({ ...prev, oneTweak: text }))}
                      placeholder="What small change will you make tomorrow? This will help you become 1% better each day"
                      placeholderTextColor="#999"
                      multiline
                      maxLength={140}
                      numberOfLines={3}
                      editable={!reflectQuestionnaire.nothingToChange}
                    />
                    <Text style={styles.characterCount}>{reflectQuestionnaire.oneTweak.length}/140</Text>

                    {/* Nothing to change checkbox BELOW input, checkbox at end */}
                    <TouchableOpacity
                      style={[styles.nothingCheckbox, { alignSelf: 'flex-start' }]}
                      onPress={() => setReflectQuestionnaire(prev => ({ 
                        ...prev, 
                        nothingToChange: !prev.nothingToChange,
                        oneTweak: prev.nothingToChange ? prev.oneTweak : ''
                      }))}
                    >
                      <View style={styles.checkboxContainer}>
                        <Text style={styles.checkboxLabel}>Nothing to change</Text>
                        <Ionicons 
                          name={reflectQuestionnaire.nothingToChange ? "checkbox" : "square-outline"} 
                          size={20} 
                          color={reflectQuestionnaire.nothingToChange ? "#10B981" : "#666"} 
                        />
                      </View>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.navigationButtons}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => setReflectQuestionnaire(prev => ({ ...prev, currentStep: 4 }))}
                    >
                      <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.nextButton}
                      onPress={() => setReflectQuestionnaire(prev => ({ ...prev, currentStep: 6 }))}
                    >
                      <Text style={styles.nextButtonText}>Next</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Step 6: Review & Submit */}
              {reflectQuestionnaire.currentStep === 6 && (
                <>
                  <View style={styles.questionSection}>
                    <Text style={styles.questionText}>Review Your Reflection</Text>
                    
                    <View style={styles.reviewSection}>
                      <Text style={styles.reviewLabel}>Mood: {Math.round(reflectQuestionnaire.mood)}/5</Text>
                      <Text style={styles.reviewLabel}>Energy: {Math.round(reflectQuestionnaire.energy)}/5</Text>
                      <Text style={styles.reviewLabel}>What went well: {reflectQuestionnaire.whatWentWell || 'Not specified'}</Text>
                      <Text style={styles.reviewLabel}>Friction: {reflectQuestionnaire.friction || 'Not specified'}</Text>
                      <Text style={styles.reviewLabel}>One tweak: {reflectQuestionnaire.nothingToChange ? 'Nothing to change' : (reflectQuestionnaire.oneTweak || 'Not specified')}</Text>
                    </View>
                  </View>

                  <View style={styles.navigationButtons}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => setReflectQuestionnaire(prev => ({ ...prev, currentStep: 5 }))}
                    >
                      <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                                        <TouchableOpacity
                      style={[styles.submitButton, { flex: 1, paddingHorizontal: 24 }]}
                      onPress={async () => {
                        try {
                          const date = getTodayDateString();
                          const habitData = {
                            date,
                            reflect_mood: Math.round(reflectQuestionnaire.mood),
                            reflect_energy: Math.round(reflectQuestionnaire.energy),
                            reflect_what_went_well: reflectQuestionnaire.whatWentWell,
                            reflect_friction: reflectQuestionnaire.friction,
                            reflect_one_tweak: reflectQuestionnaire.oneTweak,
                            reflect_nothing_to_change: reflectQuestionnaire.nothingToChange,
                          };
                          
                          const success = await useActionStore.getState().saveDailyHabits(habitData);
                          if (success) {
                            markHabitCompleted('reflect'); // Sound plays here when animation starts
                            setShowReflectModal(false);
                            setReflectQuestionnaire({ mood: 3, energy: 3, whatWentWell: '', friction: '', oneTweak: '', nothingToChange: false, currentStep: 1 });
                          } else {
                            console.error('Failed to save reflect data');
                          }
                        } catch (error) {
                          console.error('Error saving reflect data:', error);
                        }
                      }}
                    >
                      <Text style={styles.submitButtonText}>Complete</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Cold Shower Modal */}
      <Modal
        visible={showColdShowerModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowColdShowerModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Cold Shower</Text>
                <TouchableOpacity onPress={() => setShowColdShowerModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.questionSection}>
                <Text style={styles.questionText}>Did you take a cold shower today?</Text>
              </View>

              <View style={styles.navigationButtons}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setShowColdShowerModal(false)}
                >
                  <Text style={styles.backButtonText}>No</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitButton, { flex: 1, paddingHorizontal: 24 }]}
                  onPress={async () => {
                    try {
                      const date = getTodayDateString();
                      const habitData = {
                        date,
                        cold_shower_completed: true,
                      };
                      
                      const success = await useActionStore.getState().saveDailyHabits(habitData);
                      if (success) {
                        markHabitCompleted('cold_shower'); // Sound plays here when animation starts
                        setShowColdShowerModal(false);
                      } else {
                        console.error('Failed to save cold shower data');
                      }
                    } catch (error) {
                      console.error('Error saving cold shower data:', error);
                    }
                  }}
                >
                  <Text style={styles.submitButtonText}>Yes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Untick Confirmation Modal */}
      <Modal
        visible={showUntickConfirmation}
        transparent={true}
        onRequestClose={() => setShowUntickConfirmation(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Remove Habit</Text>
                <TouchableOpacity onPress={() => setShowUntickConfirmation(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.questionSection}>
                <Text style={styles.questionText}>
                  Are you sure you want to remove this completed habit?
                </Text>
                <Text style={[styles.questionText, { fontSize: 14, color: '#666', marginTop: 8 }]}>
                  This will mark "{habitToUntick ? AVAILABLE_HABITS.find(h => h.id === habitToUntick)?.name || habitToUntick : 'this habit'}" as incomplete for today.
                </Text>
              </View>

              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[styles.optionButton, { backgroundColor: '#f5f5f5' }]}
                  onPress={() => setShowUntickConfirmation(false)}
                >
                  <Text style={[styles.optionButtonText, { color: '#666' }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionButton, { backgroundColor: '#ef4444' }]}
                  onPress={async () => {
                    if (habitToUntick !== null) {
                      // Mark habit as uncompleted in new ring
                      markHabitUncompleted(habitToUntick);

                      // Clear persisted data for this habit if applicable
                      if (habitToUntick !== 'meditation' && habitToUntick !== 'microlearn') {
                        try {
                          const date = getTodayDateString();
                          await useActionStore.getState().clearHabitForDate(date, habitToUntick);
                        } catch (e) {
                          console.warn('Failed to clear habit data:', e);
                        }
                      }
                    }
                    
                    setShowUntickConfirmation(false);
                    setHabitToUntick(null);
                  }}
                >
                  <Text style={[styles.optionButtonText, { color: '#ffffff' }]}>
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Habit Info Modal */}
      <HabitInfoModal
        visible={showHabitInfoModal}
        onClose={() => {
          setShowHabitInfoModal(false);
          setSelectedDateHabitsData(null); // Clean up the selected date data
        }}
        habitType={selectedHabitType}
        data={selectedDateHabitsData}
      />

      {/* Streak Modal */}
      <StreakModal
        visible={showStreakModal}
        onClose={() => setShowStreakModal(false)}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        visible={showCreatePostModal}
        onClose={() => {
          setShowCreatePostModal(false);
          setNewlyCreatedGoalId(null); // Clear the pre-selected goal
          setSelectedGoal(null); // Clear the selected goal for check-in
          setTargetCheckInDate(null); // Clear the target date
        }}
        onPostCreated={() => {
          setShowCreatePostModal(false);
          setNewlyCreatedGoalId(null); // Clear the pre-selected goal
          setSelectedGoal(null); // Clear the selected goal for check-in
          setTargetCheckInDate(null); // Clear the target date
          // Refresh goals and progress
          if (user) {
            fetchGoals(user.id);
            fetchGoalProgress();
            checkTodaysCheckIns(); // Add this to refresh check-in status
            checkForOverdueGoals(); // Add this to refresh overdue status
          }
        }}
        userGoals={userGoals.filter(goal => !goal.completed)}
        preSelectedGoal={newlyCreatedGoalId || selectedGoal?.id || undefined}
        targetCheckInDate={targetCheckInDate || undefined}
      />

      {/* Edit Habits Modal */}
      <EditHabitsModal
        visible={showEditHabitsModal}
        onClose={() => setShowEditHabitsModal(false)}
        onSave={async () => {
          try {
            if (user) {
              const [updatedHabits, updatedSchedules] = await Promise.all([
                dailyHabitsService.getSelectedHabits(user.id),
                dailyHabitsService.getHabitSchedules(user.id)
              ]);
              setSelectedHabits(updatedHabits);
              setHabitSchedules(updatedSchedules);
            }
          } catch (error) {
            console.error('Error refreshing habits:', error);
          }
        }}
      />

      {/* New Goal Modal */}
      <NewGoalModal
        visible={showNewGoalModal}
        onClose={() => setShowNewGoalModal(false)}
        onGoalCreated={(goalId) => {
          setNewlyCreatedGoalId(goalId);
          setShowNewGoalModal(false);
          // Open CreatePostModal with the new goal pre-selected
          setShowCreatePostModal(true);
        }}
      />

      {/* Level Info Modal */}
      <LevelInfoModal
        visible={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        currentLevel={levelProgress.currentLevel}
        totalPoints={totalPoints}
        dailyHabits={segmentChecked}
        coreHabits={coreHabitsCompleted}
      />


      {/* Action Modal - Create Goal or Update Daily Post */}
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowActionModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={[styles.actionModal, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
                <Text style={[styles.actionModalTitle, { color: theme.textPrimary }]}>
                  What would you like to do?
                </Text>
                
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    setShowActionModal(false);
                    setShowNewGoalModal(true);
                  }}
                >
                  <Text style={styles.actionButtonText}>Create Goal</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                  onPress={() => {
                    setShowActionModal(false);
                    setShowCreatePostModal(true);
                  }}
                >
                  <Text style={styles.actionButtonText}>Update Daily Post</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.cancelButton, { borderColor: theme.borderSecondary }]}
                  onPress={() => setShowActionModal(false)}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      </SafeAreaView>
    </CustomBackground>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default React.memo(ActionScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
    position: 'relative',
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeaderCard: {
    flex: 1,
    height: 48,
    marginHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  highlightCarouselContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  highlightCarouselContent: {
    paddingHorizontal: 24,
  },
  highlightCard: {
    borderRadius: 20,
    padding: 16,
    minHeight: 120,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  highlightCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  highlightCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  highlightCardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  highlightCardProgress: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    marginBottom: 18,
  },
  highlightCardProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  highlightCardMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  highlightCardMetricLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  highlightCardMetricValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerStatsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 12,
  },
  headerStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerStatText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 0,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  challengesContainer: {
    gap: 12,
  },
  challengeCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  challengeCardContent: {
    flex: 1,
    gap: 4,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  challengeTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  challengeCategory: {
    fontSize: 13,
    fontWeight: '500',
  },
  challengeRequirement: {
    fontSize: 13,
    fontWeight: '400',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    
  },
  actionCard: {
    borderRadius: 16,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  activityList: {
    
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
  },
  tipsContainer: {
    
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  tipText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  // New transparent test box styles
  transparentTestBox: {
    padding: 12,
    flex: 1,
    alignItems: 'center',
  },
  transparentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  transparentTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  transparentDescription: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Two item row styles
  twoItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    
  },
  halfWidthTransparentBox: {
    padding: 12,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  // Big task box styles (matching profile page)
  bigTasksRowBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bigTaskBox: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    position: 'relative',
  },
  boxLabel: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  boxContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxText: {
    fontSize: 18,
    fontWeight: '600',
    position: 'absolute',
    left: 16,
    top: 16,
  },
  arrowButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 8,
  },
  boxIconContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  // Keep Track Section Styles
  keepTrackSection: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  keepTrackTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  weeklyTrackerCard: {
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 20,
    marginHorizontal: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  weeklyTracker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayContainer: {
    alignItems: 'center',
    
    position: 'relative', // add this
  },
  todayContainer: {
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  todayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  todayBorderFade: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
  },
  // Single curved line following the 16px border radius
  singleCurvedLine: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: 'transparent',
    borderTopColor: '#1f2937',
    borderRightColor: '#1f2937',
    borderTopRightRadius: 16,
    opacity: 0.25,
  },
  // Gradient fade overlays for top end
  topFade1: {
    position: 'absolute',
    top: 0,
    right: 16,
    width: 4,
    height: 1,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.2,
  },
  topFade2: {
    position: 'absolute',
    top: 0,
    right: 20,
    width: 4,
    height: 1,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.4,
  },
  topFade3: {
    position: 'absolute',
    top: 0,
    right: 24,
    width: 4,
    height: 1,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.6,
  },
  topFade4: {
    position: 'absolute',
    top: 0,
    right: 28,
    width: 4,
    height: 1,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.8,
  },
  topFade5: {
    position: 'absolute',
    top: 0,
    right: 32,
    width: 4,
    height: 1,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 1.0,
  },
  // Gradient fade overlays for right end
  rightFade1: {
    position: 'absolute',
    top: 16,
    right: 0,
    width: 1,
    height: 4,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.2,
  },
  rightFade2: {
    position: 'absolute',
    top: 20,
    right: 0,
    width: 1,
    height: 4,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.4,
  },
  rightFade3: {
    position: 'absolute',
    top: 24,
    right: 0,
    width: 1,
    height: 4,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.6,
  },
  rightFade4: {
    position: 'absolute',
    top: 28,
    right: 0,
    width: 1,
    height: 4,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 0.8,
  },
  rightFade5: {
    position: 'absolute',
    top: 32,
    right: 0,
    width: 1,
    height: 4,
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    opacity: 1.0,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  innerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircleChecked: {
    // backgroundColor will be set dynamically
  },
  innerCircleUnchecked: {
    borderWidth: 1,
    // borderColor will be set dynamically
  },
  checkmark: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  goalCountChecked: {
    // color will be set dynamically
  },
  goalCountUnchecked: {
    // color will be set dynamically
  },
  plusSign: {
    fontSize: 16,
    fontWeight: '300',
    color: '#6b7280',
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: '#1f2937',
    alignSelf: 'center',
    opacity: 0.2,
  },
  fadeSeparator: {
    width: 1,
    height: 40,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  fadeSegment1: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.02,
  },
  fadeSegment2: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.08,
  },
  fadeSegment3: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.12,
  },
  fadeSegment4: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.15,
  },
  fadeSegment5: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.15,
  },
  fadeSegment6: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.12,
  },
  fadeSegment7: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.08,
  },
  fadeSegment8: {
    width: 1,
    height: 5,
    backgroundColor: '#1f2937',
    opacity: 0.02,
  },
  solidFadeSeparator: {
    width: 1,
    height: 40,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  solidFadeTop: {
    width: 1,
    height: 4,
    backgroundColor: '#1f2937',
    opacity: 0.1,
  },
  solidFadeMiddle: {
    width: 1,
    height: 32,
    backgroundColor: '#1f2937',
    opacity: 0.2,
  },
  solidFadeBottom: {
    width: 1,
    height: 4,
    backgroundColor: '#1f2937',
    opacity: 0.1,
  },
  expandedGoalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  expandedGoalIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  expandedGoalContent: {
    flex: 1,
  },
  expandedGoalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#129490',
    marginBottom: 2,
  },
  expandedGoalTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  checkInButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  checkInButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  disabledGoalItem: {
    opacity: 0.5,
  },
  disabledCheckInButton: {
    // backgroundColor will be applied dynamically
  },
  disabledCheckInButtonText: {
    color: '#9ca3af',
  },
  completedCheckInButton: {
    // backgroundColor will be applied dynamically
  },
  completedCheckInButtonText: {
    color: '#ffffff',
  },
  // New styles for the mini arrow
  arrowContainerAbove: {
    position: 'absolute',
    top: -16, // adjust as needed for spacing
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2,
  },
  arrowDownAbove: {
    fontSize: 10,
    color: '#129490',
  },
  // New styles for the progress bar
  leftBarContainer: {
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftBarBackground: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftBarSegment: {
    width: '18%', // percentage width for equal segments
    height: '100%',
    marginRight: '2%', // small, consistent gap
    borderRadius: 5,
    transform: [{ skewX: '-18deg' }],
  },
  // New styles for the greeting section
  greetingSection: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 16,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  // New styles for the info icon container
  infoIconContainer: {
    padding: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  // Today's Check-ins styles
  todaysCheckinsContainer: {
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  checkinItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  checkinItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkinItemContent: {
    flex: 1,
  },
  checkinItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  checkinItemCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  checkinItemRight: {
    alignItems: 'center',
  },
  checkinStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkinButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkinButtonText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  noCheckinsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noCheckinsText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  noCheckinsSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  // Circular Progress styles (same as ProfileScreen)
  circularProgressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8, // Reduced from 20 to 8 to decrease padding between daily tasks and core habits circle
    marginBottom: 10,
  },
  orangeProgressContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  circularProgressValue: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  circularProgressLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 2,
  },
  circularProgressPercent: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -2,
  },
  // Overdue and today's check-in indicators
  overdueIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Gym Questionnaire Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalContentKeyboard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '70%',
    marginBottom: 300, // Push modal higher when keyboard is visible
  },
  sleepModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
    minHeight: 600,
  },
  sleepModalContentKeyboard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    minHeight: 600,
    marginBottom: 300, // Push modal higher when keyboard is visible
  },
  runModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
    minHeight: 600,
    paddingBottom: 32,
  },
  runModalContentKeyboard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    minHeight: 600,
    marginBottom: 300, // Push modal higher when keyboard is visible
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  questionSection: {
    marginBottom: 15,
    paddingVertical: 5,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    
  },
  optionButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  optionButtonTextSelected: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    
    marginTop: 24,
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  trainingTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    
    justifyContent: 'space-between',
  },
  trainingTypeButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    minHeight: 40,
  },
  trainingTypeButtonSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  trainingTypeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  trainingTypeButtonTextSelected: {
    color: '#ffffff',
  },
  starSection: {
    marginBottom: 24,
  },
  starButton: {
    flexDirection: 'row',
    alignItems: 'center',
    
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignSelf: 'flex-start',
  },
  starButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 0,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  customInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
    color: '#333',
  },

  // Separate styles for other questionnaire modals (Sleep, Water, Run)
  otherOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    
    justifyContent: 'space-between',
  },
  otherOptionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    width: '30%',
    marginBottom: 8,
  },
  otherOptionButtonSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  otherOptionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  otherOptionButtonTextSelected: {
    color: '#ffffff',
  },

  // Sleep Quality Slider Styles
  sliderContainer: {
    paddingVertical: 10,
  },
  slider: {
    width: 280,
    height: 40,
    alignSelf: 'center',
  },
  sliderLabels: {
    alignItems: 'center',
    marginTop: 8,
  },
  sliderPercentage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  emojiLarge: {
    fontSize: 28,
    lineHeight: 34,
  },
  sliderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  sliderQualityLabel: {
    fontSize: 16,
    fontWeight: '500',
  },

  // Popular Distance Buttons Styles
  popularDistanceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  popularDistanceButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  popularDistanceButtonText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },

  // Time Picker Styles
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    width: '100%',
  },
  timePickerContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: 'auto',
    paddingLeft: 0,
  },
  timePickerColumn: {
    alignItems: 'flex-start',
    minWidth: 80,
    justifyContent: 'flex-start',
    marginLeft: 0,
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textAlign: 'left',
  },
  timePickerContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  timePickerGroup: {
    flex: 1,
    marginHorizontal: 0,
    paddingHorizontal: 0,
    alignItems: 'flex-start',
  },
  timePickerGroupRight: {
    flex: 1,
    marginHorizontal: 0,
    paddingHorizontal: 0,
    alignItems: 'flex-start',
  },
  timePickerGroupLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'left',
  },
  timePickerGroupLabelRight: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  timePickerSeparator: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  runNotesScrollContainer: {
    maxHeight: 60,
    marginBottom: 16,
  },
  progressIndicator: {
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    alignSelf: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  progressInlineText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
  },
  nextButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  nextButtonStandalone: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 0,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  nothingCheckbox: {
    marginBottom: 15,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 0,
    
  },
  backButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    flex: 1,
  },
  backButtonText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
  },
  reviewSection: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginTop: 15,
  },
  reviewLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  timePickerScroll: {
    height: 65,
  },
  timePickerItem: {
    height: 65,
    width: 65,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    borderRadius: 32,
    paddingTop: 15,
  },
  timePickerItemText: {
    fontSize: 20,
    color: '#666',
    fontWeight: '600',
  },
  timePickerItemSelected: {
    backgroundColor: '#10B981',
  },
  timePickerItemTextSelected: {
    color: '#ffffff',
  },
  calculatedSleepContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  calculatedSleepText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
  },
  // Action Modal Styles
  actionModal: {
    width: '100%',
    maxWidth: 300,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
  },
}); 