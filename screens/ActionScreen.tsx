import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Animated, Easing } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { useGoalsStore } from '../state/goalsStore';
import { useActionStore } from '../state/actionStore';
import { getCategoryIcon, calculateCompletionPercentage } from '../lib/goalHelpers';
import MediaUploadModal from './MediaUploadModal';
import { progressService } from '../lib/progressService';
import Svg, { Circle, Defs, LinearGradient, Stop, Path, G, Rect, Text as SvgText, TextPath } from 'react-native-svg';
import CheckInList from '../components/CheckInList';
import DateNavigator from '../components/DateNavigator';

import HabitInfoModal from '../components/HabitInfoModal';
import StreakModal from '../components/StreakModal';

import { dailyHabitsService } from '../lib/dailyHabitsService';

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Daily Habits Circle Configuration Constants
const DAILY_HABITS_CONFIG = {
  SEGMENT_ARC: 40,        // Each segment covers 40°
  GAP_ARC: 5,             // Each gap is 5°
  RADIUS: 150,            // Circle radius (increased by 50% from 100)
  THICKNESS: 8,           // Segment thickness
  ICON_RADIUS: 110,       // Icon positioning radius (closer to center)
  HITBOX_EXTENSION: 25,   // How far beyond circle the hitbox extends
  START_ANGLE: -90,       // Start at top (-90°)
  ICON_SIZE: 20,          // Icon size
  LABEL_FONT_SIZE: 14,    // Text label font size
  LABEL_GAP: 16,          // Distance from circle edge to label start
  SVG_SIZE: 400           // SVG container size (reduced from 540 for compact layout)
};

// Helper function to calculate segment angles
const calculateSegmentAngles = (index: number) => {
  const startAngle = DAILY_HABITS_CONFIG.START_ANGLE + (index * (DAILY_HABITS_CONFIG.SEGMENT_ARC + DAILY_HABITS_CONFIG.GAP_ARC));
  const endAngle = startAngle + DAILY_HABITS_CONFIG.SEGMENT_ARC;
  const midAngle = (startAngle + endAngle) / 2;
  return { startAngle, endAngle, midAngle };
};

// Helper function to convert degrees to radians
const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;

// Helper function to calculate coordinates on a circle
const calculateCircleCoordinates = (center: number, radius: number, angleRad: number) => ({
  x: center + radius * Math.cos(angleRad),
  y: center + radius * Math.sin(angleRad)
});

// Helper function for segment animations
const animateSegment = (segmentAnim: Animated.Value, toValue: number) => {
  Animated.timing(segmentAnim, {
    toValue,
    duration: 280,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: false,
  }).start();
};

// Days constants
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
  const todayDayOfWeek = today.getDay();
  
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
  const todayDayOfWeek = today.getDay();
  
  // Due today = required today AND not checked in today
  return goal.frequency[todayDayOfWeek] && !checkedInGoals.has(goal.id);
};

// Calendar component
const MonthCalendar = ({ theme }: { theme: any }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    const today = new Date();
    
    // Add days from previous month
    const prevMonth = new Date(year, month - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const dayDate = new Date(year, month - 1, prevMonthDays - i);
      days.push({ 
        day: prevMonthDays - i, 
        date: dayDate, 
        isToday: false, 
        isOtherMonth: true 
      });
    }
    
    // Add all days of the current month
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      const isToday = dayDate.toDateString() === today.toDateString();
      days.push({ day: i, date: dayDate, isToday, isOtherMonth: false });
    }
    
    // Add days from next month to fill the grid
    const remainingCells = 42 - days.length; // 6 rows * 7 days = 42
    for (let i = 1; i <= remainingCells; i++) {
      const dayDate = new Date(year, month + 1, i);
      days.push({ 
        day: i, 
        date: dayDate, 
        isToday: false, 
        isOtherMonth: true 
      });
    }
    
    return days;
  };
  
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };
  
  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };
  
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };
  
  const days = getDaysInMonth(currentDate);
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  return (
    <View style={styles.calendarContainer}>
      {/* Calendar Header */}
      <View style={styles.monthCalendarHeader}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.calendarNavButton}>
          <Ionicons name="chevron-back-outline" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.calendarTitleContainer}>
          <Text style={[styles.calendarTitle, { color: theme.textPrimary }]}>
            {formatMonthYear(currentDate)}
          </Text>
        </View>
        
        <TouchableOpacity onPress={goToNextMonth} style={styles.calendarNavButton}>
          <Ionicons name="chevron-forward-outline" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>
      
      {/* Day Names */}
      <View style={styles.dayNamesContainer}>
        {dayNames.map((day, index) => (
          <Text key={index} style={[styles.dayName, { color: theme.textSecondary }]}>
            {day}
          </Text>
        ))}
      </View>
      
      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {days.map((day, index) => (
          <View key={index} style={styles.calendarDay}>
            <TouchableOpacity 
              style={[
                styles.calendarDayButton,
                day.isToday && styles.monthTodayButton
              ]}
            >
              <Text style={[
                styles.calendarDayText,
                day.isOtherMonth ? { color: 'rgba(128, 128, 128, 0.4)' } : { color: theme.textPrimary },
                day.isToday && styles.todayText
              ]}>
                {day.day}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      
      {/* Today Button */}
      <TouchableOpacity 
        style={styles.goToTodayButton}
        onPress={goToCurrentMonth}
      >
        <Text style={styles.goToTodayText}>Today</Text>
      </TouchableOpacity>
    </View>
  );
};

function ActionScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { goals: userGoals, fetchGoals, loading } = useGoalsStore();
  
  // Calendar state variables
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkedInGoals, setCheckedInGoals] = useState<Set<string>>(new Set());
  const [checkedInGoalsByDay, setCheckedInGoalsByDay] = useState<{[key: string]: Set<string>}>({});
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [goalProgress, setGoalProgress] = useState<{[goalId: string]: number}>({});
  const [overdueGoals, setOverdueGoals] = useState<Set<string>>(new Set());
  const [overdueGoalDates, setOverdueGoalDates] = useState<{[goalId: string]: Date}>({});
  const [overdueGoalCounts, setOverdueGoalCounts] = useState<{[goalId: string]: number}>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showGymModal, setShowGymModal] = useState(false);
  const [showGymActiveModal, setShowGymActiveModal] = useState(false);
  const [showGymRestModal, setShowGymRestModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [showRunActiveModal, setShowRunActiveModal] = useState(false);
  const [showRunRestModal, setShowRunRestModal] = useState(false);
  const [showUntickConfirmation, setShowUntickConfirmation] = useState(false);
  const [segmentToUntick, setSegmentToUntick] = useState<number | null>(null);
  const [showHabitInfoModal, setShowHabitInfoModal] = useState(false);
  const [selectedHabitType, setSelectedHabitType] = useState<string>('');
  const [selectedDateHabitsData, setSelectedDateHabitsData] = useState<any>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);

  
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
  const [reflectQuestionnaire, setReflectQuestionnaire] = useState({
    mood: 3,
    energy: 3,
    whatWentWell: '',
    friction: '',
    oneTweak: '',
    nothingToChange: false,
    currentStep: 1
  });



  // Segmented circle labels and toggle state (visuals only for now)
  const segmentLabels = useMemo(
    () => [
      'Meditation', 'Micro-learn', 'Sleep', 'Water', 'Run', 'Reflect', 'Cold-shower', 'Gym'
    ],
    []
  );

  const { segmentChecked, toggleSegment: toggleSegmentStore } = useActionStore();
  const segmentAnim = useRef(segmentLabels.map(() => new Animated.Value(0))).current; // 0 -> inactive, 1 -> active

  // Load today's daily habits data when component mounts
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    useActionStore.getState().loadDailyHabits(today);
  }, []);

  // Sync animated values with store state on mount and when store changes
  useEffect(() => {
    segmentChecked.forEach((isChecked, index) => {
      if (isChecked) {
        segmentAnim[index].setValue(1);
      } else {
        segmentAnim[index].setValue(0);
      }
    });
  }, [segmentChecked, segmentAnim]);

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
      } else if (showRunModal || showRunActiveModal || showRunRestModal) {
        liftAmount = -150; // Run modals need most lift (most content)
      } else if (showGymModal || showGymActiveModal || showGymRestModal) {
        liftAmount = -100; // Gym modals need moderate lift
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

  const toggleSegment = useCallback((index: number) => {
    // Special handling for specific segments when checking them
    if (!segmentChecked[index]) {
      switch (index) {
        case 0: // Meditation
          navigation.navigate('Meditation', {}, {
            animation: 'slide_from_bottom',
            presentation: 'modal'
          });
          return;

        case 1: // Micro-learn
          navigation.navigate('Microlearning', {}, {
            animation: 'slide_from_bottom',
            presentation: 'modal'
          });
          return;
        case 2: // Sleep
          // Load existing data if available
          const { dailyHabits } = useActionStore.getState();
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
        case 3: // Water
          // Load existing data if available
          const { dailyHabits: waterHabits } = useActionStore.getState();
          if (waterHabits && waterHabits.water_intake) {
            setWaterQuestionnaire({
              waterIntake: waterHabits.water_intake || 16,
              waterGoal: waterHabits.water_goal || '',
              waterNotes: waterHabits.water_notes || ''
            });
          } else {
            setWaterQuestionnaire({ waterIntake: 16, waterGoal: '', waterNotes: '' });
          }
          modalPosition.setValue(0);
          setShowWaterModal(true);
          return;
        case 4: // Run
          // Load existing data if available
          const { dailyHabits: runHabits } = useActionStore.getState();
          if (runHabits && runHabits.run_day_type) {
            setRunQuestionnaire({
              dayType: runHabits.run_day_type || '',
              activityType: runHabits.run_activity_type || '',
              runType: runHabits.run_type || '',
              distance: runHabits.run_distance ? Math.round(runHabits.run_distance * 2) : 5, // Convert back to slider value
              durationHours: 0,
              durationMinutes: 30,
              durationSeconds: 0,
              runNotes: runHabits.run_notes || ''
            });
          } else {
            setRunQuestionnaire({ dayType: '', activityType: '', runType: '', distance: 5, durationHours: 0, durationMinutes: 30, durationSeconds: 0, runNotes: '' });
          }
          modalPosition.setValue(0);
          setShowRunModal(true);
          return;

        case 5: // Reflect
          // Load existing data if available
          const { dailyHabits: reflectHabits } = useActionStore.getState();
          if (reflectHabits && reflectHabits.reflect_mood) {
            setReflectQuestionnaire({
              mood: reflectHabits.reflect_mood || 3,
              energy: reflectHabits.reflect_energy || 3,
              whatWentWell: reflectHabits.reflect_what_went_well || '',
              friction: reflectHabits.reflect_friction || '',
              oneTweak: reflectHabits.reflect_one_tweak || '',
              nothingToChange: reflectHabits.reflect_nothing_to_change || false,
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

        case 6: // Cold Shower
          // Load existing data if available
          const { dailyHabits: coldShowerHabits } = useActionStore.getState();
          if (coldShowerHabits && coldShowerHabits.cold_shower_completed) {
            // If already completed, just show the modal briefly then close
            setShowColdShowerModal(true);
            setTimeout(() => {
              setShowColdShowerModal(false);
            }, 1000);
            return;
          }
          setShowColdShowerModal(true);
          return;

        case 7: // Gym
          // Load existing data if available
          const { dailyHabits: gymHabits } = useActionStore.getState();
          if (gymHabits && gymHabits.gym_day_type) {
            setGymQuestionnaire({
              dayType: gymHabits.gym_day_type || '',
              selectedTrainingTypes: gymHabits.gym_training_types || [],
              customTrainingType: gymHabits.gym_custom_type || ''
            });
          } else {
            setGymQuestionnaire({ dayType: '', selectedTrainingTypes: [], customTrainingType: '' });
          }
          modalPosition.setValue(0);
          setShowGymModal(true);
          return;
      }
    } else {
      // If trying to untick a completed habit, show confirmation dialog
      setSegmentToUntick(index);
      setShowUntickConfirmation(true);
      return;
    }
    
    toggleSegmentStore(index);
    // Animate value
    animateSegment(segmentAnim[index], !segmentChecked[index] ? 1 : 0);
  }, [segmentAnim, segmentChecked, toggleSegmentStore]);

  // SVG sizing for circle + labels (extra padding to prevent text clipping)
  const svgSize = DAILY_HABITS_CONFIG.SVG_SIZE;
  const center = svgSize / 2;

  // Memoized segment data calculation to avoid recalculation on every render
  const segmentData = useMemo(() => {
    return [...Array(8)].map((_, i) => {
      const { startAngle, endAngle, midAngle } = calculateSegmentAngles(i);
      const startRad = degreesToRadians(startAngle);
      const endRad = degreesToRadians(endAngle);
      const midRad = degreesToRadians(midAngle);
      
      return {
        startAngle,
        endAngle,
        midAngle,
        startRad,
        endRad,
        midRad,
        index: i
      };
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    
    const initializeData = async () => {
      if (user) {
        try {
          await Promise.all([
            fetchGoals(user.id),
            checkTodaysCheckIns(),
            checkForOverdueGoals()
          ]);
        } catch (error: any) {
          if (error?.name !== 'AbortError') {
            console.error('Error initializing ActionScreen data:', error);
          }
        }
      }
    };
    
    initializeData();
    
    return () => {
      controller.abort();
    };
  }, [user, userGoals.length]);

  // Refresh data when screen comes into focus (e.g., after returning from GoalDetail)
  useFocusEffect(
    React.useCallback(() => {
      if (user && userGoals.length > 0) {
        // Only refresh progress-related data, not goals themselves to avoid loading flicker
        fetchGoalProgress();
        checkTodaysCheckIns();
        checkForOverdueGoals();
      }
      
      // Record login day (daily habits circle always shows today's data)
      if (user) {
        const recordLogin = async () => {
          try {
            const today = new Date().toISOString().split('T')[0];
            await dailyHabitsService.recordLoginDay(user.id, today);
          } catch (error) {
            console.warn('Failed to record login day:', error);
          }
        };
        recordLogin();
      }
    }, [user, userGoals.length])
  );

  const fetchGoalProgress = useCallback(async () => {
    if (!user || userGoals.length === 0) return;

    // Batch process goal progress instead of individual queries
    const progressPromises = userGoals
      .filter(goal => !goal.completed)
      .map(async (goal) => {
        const checkInCount = await progressService.getCheckInCount(goal.id, user.id);
        return { goalId: goal.id, count: checkInCount };
      });
    
    try {
      const progressResults = await Promise.all(progressPromises);
      const progressData: {[goalId: string]: number} = {};
      
      progressResults.forEach(({ goalId, count }) => {
        progressData[goalId] = count;
      });
      
      setGoalProgress(progressData);
    } catch (error) {
      console.error('Error fetching goal progress:', error);
    }
  }, [user, userGoals]);

  const checkForOverdueGoals = useCallback(async () => {
    if (!user || userGoals.length === 0) return;

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
      const goalCreatedDate = goal.created_at ? new Date(goal.created_at) : goalStartDate;
      const startCheckDate = goalCreatedDate || goalStartDate;
      
      if (!startCheckDate) continue;
      
      const goalCheckIns = checkInMap.get(goal.id) || new Set();
      const goalEndDate = goal.end_date ? new Date(goal.end_date) : null;
      
      let overdueCount = 0;
      let oldestOverdueDate = null;
      
      // Calculate number of days to check back
      const daysDifference = Math.floor((today.getTime() - startCheckDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Check each historical date (from oldest to newest)
      for (let i = daysDifference; i >= 1; i--) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dayOfWeek = checkDate.getDay();
        
        // Only check dates within goal's active period
        if (goalStartDate && checkDate < goalStartDate) continue;
        if (goalEndDate && checkDate > goalEndDate) continue;
        
                 // If this day required a check-in
         if (goal.frequency && goal.frequency[dayOfWeek]) {
          const dateString = checkDate.toISOString().split('T')[0];
          const hasCheckedIn = goalCheckIns.has(dateString);
          
          if (!hasCheckedIn) {
            overdueCount++;
            if (!oldestOverdueDate) {
              oldestOverdueDate = new Date(checkDate); // First missed = oldest
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
          resolve();
        } catch (error) {
          console.error('Error checking overdue goals:', error);
          resolve();
        }
      }, 0);
      
      // Cleanup function to clear timeout if component unmounts
      return () => clearTimeout(timeoutId);
    });
  }, [user, userGoals]);

  const checkTodaysCheckIns = useCallback(async () => {
    if (!user || userGoals.length === 0) return;

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
    }

    setCheckedInGoals(checkedInSet);
    setCheckedInGoalsByDay(checkedInByDay);
  }, [user, userGoals, selectedWeek]);

  // Re-check when goals are updated or selected week changes
  useEffect(() => {
    if (user && userGoals.length > 0) {
      checkTodaysCheckIns();
    }
  }, [user, userGoals, selectedWeek, checkTodaysCheckIns]);

  // Fetch goal progress when goals are loaded
  useEffect(() => {
    if (user && userGoals.length > 0) {
      fetchGoalProgress();
    }
  }, [user, userGoals, fetchGoalProgress]);

  // Refresh check-ins when screen comes into focus (useful after deleting check-ins)
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      
      const refreshData = async () => {
        if (user && userGoals.length > 0 && isActive) {
          try {
            await checkTodaysCheckIns();
          } catch (error) {
            if (isActive) {
              console.error('Error refreshing check-ins on focus:', error);
            }
          }
        }
      };
      
      refreshData();
      
      return () => {
        isActive = false;
      };
    }, [user, userGoals, checkTodaysCheckIns])
  );

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

  const formatDate = useCallback((date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  // Navigation functions for the calendar
  const goToPreviousWeek = useCallback(() => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(selectedWeek.getDate() - 7);
    setSelectedWeek(newWeek);
  }, [selectedWeek]);

  const goToNextWeek = useCallback(() => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(selectedWeek.getDate() + 7);
    setSelectedWeek(newWeek);
  }, [selectedWeek]);

  const goToCurrentWeek = useCallback(() => {
    setSelectedWeek(new Date());
  }, []);

  const handleCheckInPress = useCallback((goal: any, dayOfWeek: number) => {
    setSelectedGoal(goal);
    setExpandedDay(dayOfWeek); // Store the day being checked in for
    setShowMediaUpload(true);
  }, []);

  const handleMediaSelected = useCallback(async (uri: string) => {
    if (!selectedGoal || !user) return;
    
    setIsCheckingIn(true);
    try {
      // Get the date for the expanded day (the day being checked in for)
      let checkInDate;
      if (selectedGoal?.overdueDate) {
        // Use the specific overdue date
        checkInDate = selectedGoal.overdueDate;
      } else {
        // Use the selected week day or today
        checkInDate = expandedDay !== null ? getDateForDayOfWeekInWeek(expandedDay, selectedWeek) : new Date();
      }
      

      
      const success = await progressService.createCheckIn({
        goalId: selectedGoal.id,
        userId: user.id,
        photoUri: uri,
        checkInDate: checkInDate,
      });

      if (success) {
        Alert.alert(
          'Check-in Successful!',
          `Great job! You've checked in for "${selectedGoal.title}".`,
          [{ text: 'OK' }]
        );
        // For overdue check-ins, skip local state updates and refresh from database
        if (selectedGoal?.overdueDate) {
          // Refresh check-in data from database to get accurate state
          checkTodaysCheckIns();
          checkForOverdueGoals();
        } else {
          // For regular check-ins, update local state normally
          setCheckedInGoals(prev => {
            const newSet = new Set([...prev, selectedGoal.id]);
            return newSet;
          });
          
          setCheckedInGoalsByDay(prev => {
            const targetDay = expandedDay !== null ? expandedDay : new Date().getDay();
            const updated = { ...prev };
            // Clone the set for the target day to trigger re-render
            const prevSet = updated[targetDay.toString()] || new Set();
            updated[targetDay.toString()] = new Set(prevSet);
            updated[targetDay.toString()].add(selectedGoal.id);
            return updated;
          });
        }
        
        // Also refresh goals
        fetchGoals(user.id);
        fetchGoalProgress();
      } else {
        Alert.alert(
          'Check-in Failed',
          'There was an error saving your check-in. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error during check-in:', error);
      Alert.alert(
        'Check-in Failed',
        'There was an error saving your check-in. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCheckingIn(false);
      setSelectedGoal(null);
    }
  }, [selectedGoal, user, expandedDay, selectedWeek]);

  const handleSkipMedia = useCallback(async () => {
    if (!selectedGoal || !user) return;
    
    setIsCheckingIn(true);
    try {
      // Get the date for the expanded day (the day being checked in for)
      let checkInDate;
      if (selectedGoal?.overdueDate) {
        // Use the specific overdue date
        checkInDate = selectedGoal.overdueDate;
      } else {
        // Use the selected week day or today
        checkInDate = expandedDay !== null ? getDateForDayOfWeekInWeek(expandedDay, selectedWeek) : new Date();
      }
      
      const success = await progressService.createCheckIn({
        goalId: selectedGoal.id,
        userId: user.id,
        checkInDate: checkInDate,
      });

      if (success) {
        Alert.alert(
          'Check-in Successful!',
          `Great job! You've checked in for "${selectedGoal.title}".`,
          [{ text: 'OK' }]
        );
        // For overdue check-ins, skip local state updates and refresh from database
        if (selectedGoal?.overdueDate) {
          // Refresh check-in data from database to get accurate state
          checkTodaysCheckIns();
          checkForOverdueGoals();
        } else {
          // For regular check-ins, update local state normally
          setCheckedInGoals(prev => {
            const newSet = new Set([...prev, selectedGoal.id]);
            return newSet;
          });
        
          setCheckedInGoalsByDay(prev => {
            const targetDay = expandedDay !== null ? expandedDay : new Date().getDay();
            const updated = { ...prev };
            // Clone the set for the target day to trigger re-render
            const prevSet = updated[targetDay.toString()] || new Set();
            updated[targetDay.toString()] = new Set(prevSet);
            updated[targetDay.toString()].add(selectedGoal.id);
            return updated;
          });
        }
        
        // Also refresh goals
        fetchGoals(user.id);
        fetchGoalProgress();
      } else {
        Alert.alert(
          'Check-in Failed',
          'There was an error saving your check-in. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error during check-in:', error);
      Alert.alert(
        'Check-in Failed',
        'There was an error saving your check-in. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCheckingIn(false);
      setSelectedGoal(null);
    }
  }, [selectedGoal, user, expandedDay, selectedWeek]);

  const getTodayDateString = (): string => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

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
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top', 'left', 'right']}>
      <ScrollView style={[styles.scrollView, { backgroundColor: 'transparent' }]} showsVerticalScrollIndicator={false}>

        {/* Header with Settings */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            Day {user?.created_at ? Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => setShowStreakModal(true)} style={{ marginRight: 12 }}>
              <View style={{ position: 'relative' }}>
                <Ionicons name="flame-outline" size={24} color="#ffffff" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={{ marginRight: 12 }}>
              <View style={{ position: 'relative' }}>
                <Ionicons name="notifications-outline" size={24} color="#ffffff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
              <Ionicons name="add" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Greeting Section */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>
            {(() => {
              const hour = new Date().getHours();
              if (hour < 12) return 'Good morning';
              if (hour < 18) return 'Good afternoon';
              return 'Good evening';
            })()}, {user?.username || 'there'}
          </Text>
          <Text style={styles.todaysTodoText}>Today's Overview</Text>
          
          {/* Orange Progress Bars - Between text and circle */}
          <View style={styles.orangeProgressContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <View style={[styles.leftBarContainer, { flex: 0.84, marginHorizontal: 4, alignSelf: 'center' }]}>
                <View style={[styles.leftBarBackground, { backgroundColor: 'transparent' }]}>
                  {[...Array(5)].map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.leftBarSegment,
                        { 
                          backgroundColor: i < 3 ? '#E91E63' : 'transparent', 
                          height: 2.59,
                          shadowColor: '#E91E63',
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.6,
                          shadowRadius: 3,
                          elevation: 3,
                        },
                        i === 4 && { marginRight: 0 },
                        (i === 1 || i === 2 || i === 3) && { borderRadius: 0 },
                        i === 0 && { borderTopRightRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: 5, borderBottomLeftRadius: 5 },
                        i === 4 && { borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderTopRightRadius: 5, borderBottomRightRadius: 5 },
                        (i === 3 || i === 4) && { 
                          backgroundColor: 'transparent', 
                          borderWidth: 0.5, 
                          borderColor: '#E91E63',
                          shadowColor: 'transparent',
                          shadowOpacity: 0,
                          elevation: 0,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
              <TouchableOpacity style={styles.infoIconContainer}>
                <Ionicons name="information-circle-outline" size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Circular Progress Indicator */}
          <View style={styles.circularProgressContainer}>
            <Svg width={svgSize} height={svgSize}>
              <Defs>
                <LinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#EA580C" />
                  <Stop offset="100%" stopColor="#9C27B0" />
                </LinearGradient>
                
                {/* Label paths for each segment */}
                {segmentData.map((segment) => {
                  const { startAngle, endAngle, midAngle, startRad, endRad, index: i } = segment;
                  
                  // Calculate arc path coordinates for labels - add spacing outward from arc
                  let labelRadius = DAILY_HABITS_CONFIG.RADIUS + 8; // Move labels 8px outward from the arc (default)
                  
                  // For Reflect, Run, Water, and Sleep segments, move labels further outward
                  if (i === 2 || i === 3 || i === 4 || i === 5) { // Sleep, Water, Run, Reflect
                    labelRadius = DAILY_HABITS_CONFIG.RADIUS + 16; // Move labels 16px outward from the arc (more spacing)
                  }
                  
                  let x1 = center + labelRadius * Math.cos(startRad);
                  let y1 = center + labelRadius * Math.sin(startRad);
                  let x2 = center + labelRadius * Math.cos(endRad);
                  let y2 = center + labelRadius * Math.sin(endRad);
                  
                  // Determine if we need large arc flag (for arcs > 180°)
                  const largeArcFlag = DAILY_HABITS_CONFIG.SEGMENT_ARC > 180 ? 1 : 0;
                  
                  // Create label path - always start from outer edge and follow outer arc
                  // For bottom half, reverse sweep to keep text upright
                  const isBottomHalf = midAngle >= 90 && midAngle <= 270;
                  let sweepFlag = isBottomHalf ? 0 : 1;
                  
                  // Fix text direction for specific segments that wrap incorrectly
                  // Gym, Cold Shower, Reflect, and Run segments need reversed direction
                  if (i === 5 || i === 6 || i === 7 || i === 4) { // Gym, Cold Shower, Reflect, Run
                    sweepFlag = sweepFlag === 1 ? 0 : 1; // Flip the sweep flag
                  }
                  
                  // Fix text orientation for Reflect, Run, Water, and Sleep segments ONLY
                  // Make text wrap around the top of the arc instead of bottom to keep it right-side up
                  if (i === 2 || i === 3 || i === 4 || i === 5) { // Sleep, Water, Run, Reflect
                    // For these segments, we want text to follow the top arc (reverse the path direction)
                    const tempX1 = x1;
                    const tempY1 = y1;
                    x1 = x2;
                    y1 = y2;
                    x2 = tempX1;
                    y2 = tempY1;
                    // Also flip the sweep flag to maintain proper text flow
                    sweepFlag = sweepFlag === 1 ? 0 : 1;
                  }
                  
                  // Always start from the outer edge (x1, y1) and follow the outer arc
                  // Use labelRadius for consistent spacing across all segments
                  const labelPathData = `M ${x1} ${y1} A ${labelRadius} ${labelRadius} 0 ${largeArcFlag} ${sweepFlag} ${x2} ${y2}`;
                  
                  return (
                    <Path
                      key={`label-path-${i}`}
                      id={`seg-${i}`}
                      d={labelPathData}
                      fill="none"
                      stroke="none"
                    />
                  );
                })}
              </Defs>
              

              {/* Progress segments - 8 segments with precise 40° segments and 5° gaps */}
              {segmentData.map((segment) => {
                const { startAngle, endAngle, midAngle, startRad, endRad, midRad, index: i } = segment;
                
                // Calculate arc path coordinates
                const radius = DAILY_HABITS_CONFIG.RADIUS;
                const { x: x1, y: y1 } = calculateCircleCoordinates(center, radius, startRad);
                const { x: x2, y: y2 } = calculateCircleCoordinates(center, radius, endRad);
                
                // Determine if we need large arc flag (for arcs > 180°)
                const largeArcFlag = DAILY_HABITS_CONFIG.SEGMENT_ARC > 180 ? 1 : 0;
                
                // Create the arc path
                const thickness = DAILY_HABITS_CONFIG.THICKNESS;
                const innerRadius = radius - thickness;
                const { x: ixStart, y: iyStart } = calculateCircleCoordinates(center, innerRadius, startRad);
                const { x: ixEnd, y: iyEnd } = calculateCircleCoordinates(center, innerRadius, endRad);

                // Closed annular segment (outer arc → radial in → inner arc back → close)
                const pathDataClosed = [
                  `M ${x1} ${y1}`,
                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  `L ${ixEnd} ${iyEnd}`,
                  `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ixStart} ${iyStart}`,
                  'Z'
                ].join(' ');

                // Large hitbox path that covers the full segment area (center to outer labels)
                const hitboxRadius = radius + DAILY_HABITS_CONFIG.HITBOX_EXTENSION;
                const { x: hitboxX1, y: hitboxY1 } = calculateCircleCoordinates(center, hitboxRadius, startRad);
                const { x: hitboxX2, y: hitboxY2 } = calculateCircleCoordinates(center, hitboxRadius, endRad);

                // Create a pie slice hitbox from center to outer edge
                const hitboxPathData = [
                  `M ${center} ${center}`, // Start from center
                  `L ${hitboxX1} ${hitboxY1}`, // Line to outer edge
                  `A ${hitboxRadius} ${hitboxRadius} 0 ${largeArcFlag} 1 ${hitboxX2} ${hitboxY2}`, // Arc to next edge
                  'Z' // Close back to center
                ].join(' ');
                
                // Visual state from UI checkbox
                const anim = segmentAnim[i];
                
                // Colors
                const activeColor = "#10B981"; // Torquoise/green
                const inactiveColor = "#10B981"; // Solid green outline for inactive segments
                
                // Interpolations
                const fillColor = anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['rgba(0,0,0,0)', activeColor],
                });
                const fillOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
                const strokeColor = inactiveColor;
                const strokeWidth = 1; // Fixed stroke width of 1

                // Label + checkbox polar position outside ring
                const baseLabelGap = DAILY_HABITS_CONFIG.LABEL_GAP;
                const labelRadius = radius + baseLabelGap;
                const { x: labelX, y: labelY } = calculateCircleCoordinates(center, labelRadius, midRad);
                const anchor = Math.cos(midRad) > 0.25 ? 'start' : (Math.cos(midRad) < -0.25 ? 'end' : 'middle');
                const labelText = segmentLabels[i];
                const labelFontSize = 11;
                const approxCharWidth = labelFontSize * 0.56;
                const estimatedTextWidth = labelText.length * approxCharWidth;
                const circleCx = anchor === 'start' ? labelX + estimatedTextWidth / 2 : anchor === 'end' ? labelX - estimatedTextWidth / 2 : labelX;

                const checkboxSize = 16;
                const checkboxHalf = checkboxSize / 2;

                return (
                  <G key={i}>
                    {/* Large invisible hitbox that covers the full segment area */}
                    <Path
                      d={hitboxPathData}
                      fill="transparent"
                      onPress={() => toggleSegment(i)}
                    />
                    
                    {/* Visual segment path */}
                    <AnimatedPath
                      d={pathDataClosed}
                      stroke={strokeColor as any}
                      strokeWidth={strokeWidth as any}
                      fill={fillColor as any}
                      fillOpacity={fillOpacity as any}
                    />


                    
                    {/* Text label on arc path */}
                    <SvgText
                      fontSize={14}
                      fontWeight="600"
                      fill={segmentChecked[i] ? '#10B981' : '#ffffff'}
                    >
                      <TextPath 
                        href={`#seg-${i}`} 
                        startOffset={`${(DAILY_HABITS_CONFIG.SEGMENT_ARC - (segmentLabels[i].length * 0.6)) / 2}%`}
                        textAnchor="middle"
                      >
                        {segmentLabels[i]}
                      </TextPath>
                    </SvgText>
                  </G>
                );
              })}
            </Svg>
            
            {/* Icon Overlay - positioned absolutely over the SVG */}
            <View style={[StyleSheet.absoluteFillObject, { 
              width: svgSize, 
              height: svgSize, 
              left: '49.5%',
              marginLeft: -svgSize / 2,
              top: 0
            }]} pointerEvents="box-none">
              {segmentData.map((segment) => {
                const { midAngle, midRad, index: i } = segment;
                
                // Position icons at segment midpoints (closer to center)
                const iconRadius = DAILY_HABITS_CONFIG.ICON_RADIUS;
                const { x: iconX, y: iconY } = calculateCircleCoordinates(0, iconRadius, midRad);
                
                // Icon size and offset for centering
                const iconSize = DAILY_HABITS_CONFIG.ICON_SIZE;
                const iconOffset = iconSize / 2;
                
                // Define icons for each segment using Ionicons
                const getSegmentIcon = (index: number) => {
                  const iconColor = segmentChecked[i] ? '#10B981' : '#ffffff';
                  
                  switch (index) {
                    case 0: // Meditation
                      return <Ionicons name="leaf" size={iconSize} color={iconColor} />;
                    case 1: // Micro-learn
                      return <Ionicons name="book" size={iconSize} color={iconColor} />;
                    case 2: // Sleep
                      return <Ionicons name="moon" size={iconSize} color={iconColor} />;
                    case 3: // Water
                      return <Ionicons name="water" size={iconSize} color={iconColor} />;
                    case 4: // Run
                      return <Ionicons name="walk" size={iconSize} color={iconColor} />;
                    case 5: // Reflect
                      return <Ionicons name="bulb" size={iconSize} color={iconColor} />;
                    case 6: // Cold-shower
                      return <Ionicons name="snow" size={iconSize} color={iconColor} />;
                    case 7: // Gym
                      return <Ionicons name="barbell" size={iconSize} color={iconColor} />;
                    default:
                      return null;
                  }
                };
                
                return (
                  <View
                    key={`overlay-icon-${i}`}
                    style={{
                      position: 'absolute',
                      left: (svgSize / 2) + iconX - iconOffset,
                      top: (svgSize / 2) + iconY - iconOffset,
                      width: iconSize,
                      height: iconSize,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    pointerEvents="none"
                  >
                    {getSegmentIcon(i)}
                  </View>
                );
              })}
            </View>
            
            <View style={styles.circularProgressText}>
              <Text style={[styles.circularProgressTitle, { color: segmentChecked.filter(Boolean).length === 8 ? '#10B981' : theme.textPrimary }]}>Daily Habits</Text>
              <Text style={[styles.circularProgressValue, { color: segmentChecked.filter(Boolean).length === 8 ? '#10B981' : theme.textPrimary }]}>{segmentChecked.filter(Boolean).length}/8</Text>
              <Text style={[styles.circularProgressValue, { color: segmentChecked.filter(Boolean).length === 8 ? '#10B981' : theme.textSecondary }]}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Combined Check-ins Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Check-ins</Text>
          <View key={`checkins-${refreshTrigger}`} style={[styles.todaysCheckinsContainer, { borderColor: theme.borderSecondary }]}>
            <CheckInList
              userGoals={userGoals}
              overdueGoals={overdueGoals}
              checkedInGoals={checkedInGoals}
              overdueGoalDates={overdueGoalDates}
              overdueGoalCounts={overdueGoalCounts}
              goalProgress={goalProgress}
              theme={theme}
              user={user}
              onCheckInPress={(goal, dayOfWeek) => {
                setSelectedGoal(goal);
                setExpandedDay(dayOfWeek);
                setShowMediaUpload(true);
              }}
              onGoalPress={(goal, onCheckInDeleted) => {
                navigation.navigate('GoalDetail', { 
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
            selectedDate={useActionStore.getState().selectedDate}
            onDateChange={(date) => {
              useActionStore.getState().setSelectedDate(date);
              // Don't update global dailyHabits - only update local DateNavigator data
            }}
            onViewHistory={() => {
              // TODO: Implement history view modal
              console.log('View history for:', useActionStore.getState().selectedDate);
            }}
            onHabitPress={(habitType, habitsData) => {
              setSelectedHabitType(habitType);
              setSelectedDateHabitsData(habitsData);
              setShowHabitInfoModal(true);
            }}

            dailyHabitsData={useActionStore.getState().dailyHabits}
          />
        </View>

        {/* View Progress Charts Button */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.progressChartsButton, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}
            onPress={() => {
              // Set flag in action store to open graphs
              useActionStore.getState().setShouldOpenGraphs(true);
              // Navigate to Insights tab
              navigation.navigate('Insights');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.progressChartsContent}>
              <Ionicons name="analytics" size={24} color={theme.primary} />
              <View style={styles.progressChartsText}>
                <Text style={[styles.progressChartsTitle, { color: theme.textPrimary }]}>View Progress Charts</Text>
                <Text style={[styles.progressChartsSubtitle, { color: theme.textSecondary }]}>Track your wellness journey</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Month Calendar */}
        <View style={styles.section}>
          <MonthCalendar theme={theme} />
        </View>

        


      </ScrollView>

      {/* Gym Questionnaire Modal */}
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

            {/* Day Type Selection */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>What type of day is this?</Text>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => {
                    setShowGymModal(false);
                    setShowGymActiveModal(true);
                  }}
                >
                  <Text style={styles.optionButtonText}>
                    Active Day
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => {
                    setShowGymModal(false);
                    setShowGymRestModal(true);
                  }}
                >
                  <Text style={styles.optionButtonText}>
                    Rest Day
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Gym Active Day Modal */}
      <Modal
        visible={showGymActiveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGymActiveModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <Animated.View style={[
              styles.modalContent,
              { transform: [{ translateY: modalPosition }] }
            ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gym Active Day</Text>
              <TouchableOpacity onPress={() => setShowGymActiveModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

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

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (gymQuestionnaire.selectedTrainingTypes.length === 0 || (gymQuestionnaire.selectedTrainingTypes.includes('Other') && !gymQuestionnaire.customTrainingType.trim())) && styles.submitButtonDisabled
              ]}
              disabled={gymQuestionnaire.selectedTrainingTypes.length === 0 || (gymQuestionnaire.selectedTrainingTypes.includes('Other') && !gymQuestionnaire.customTrainingType.trim())}
              onPress={async () => {
                try {
                  const date = getTodayDateString();
                  const habitData = {
                    date,
                    gym_day_type: 'active' as const,
                    gym_training_types: gymQuestionnaire.selectedTrainingTypes,
                    gym_custom_type: gymQuestionnaire.customTrainingType,
                  };
                  
                  const success = await useActionStore.getState().saveDailyHabits(habitData);
                  if (success) {
                    toggleSegmentStore(7); // Check the gym segment
                    setShowGymActiveModal(false);
                    setGymQuestionnaire({ dayType: '', selectedTrainingTypes: [], customTrainingType: '' });
                  } else {
                    console.error('Failed to save gym data');
                  }
                } catch (error) {
                  console.error('Error saving gym data:', error);
                }
              }}
            >
              <Text style={styles.submitButtonText}>Complete Session</Text>
            </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Gym Rest Day Modal */}
      <Modal
        visible={showGymRestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGymRestModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <Animated.View style={[
              styles.modalContent,
              { transform: [{ translateY: modalPosition }] }
            ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gym Rest Day</Text>
              <TouchableOpacity onPress={() => setShowGymRestModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Rest Day Message */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>Rest days are important for recovery!</Text>
              <Text style={[styles.questionText, { fontSize: 16, fontWeight: '400', color: '#666' }]}>
                Taking time to rest allows your muscles to recover and grow stronger.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={async () => {
                try {
                  const date = getTodayDateString();
                  const habitData = {
                    date,
                    gym_day_type: 'rest' as const,
                  };
                  
                  const success = await useActionStore.getState().saveDailyHabits(habitData);
                  if (success) {
                    toggleSegmentStore(7); // Check the gym segment
                    setShowGymRestModal(false);
                    setGymQuestionnaire({ dayType: '', selectedTrainingTypes: [], customTrainingType: '' });
                  } else {
                    console.error('Failed to save gym rest day');
                  }
                } catch (error) {
                  console.error('Error saving gym rest day:', error);
                }
              }}
            >
              <Text style={styles.submitButtonText}>Complete Rest Day</Text>
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
                  
                  const sleepHours = sleepDuration / 60; // Convert minutes to hours
                  
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
                    toggleSegmentStore(2); // Check the sleep segment
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
                  
                  console.log('Saving water intake data:', habitData);
                  const success = await useActionStore.getState().saveDailyHabits(habitData);
                  if (success) {
                    toggleSegmentStore(3); // Check the water segment
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

      {/* Run Questionnaire Modal */}
      <Modal
        visible={showRunModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRunModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Run Session</Text>
              <TouchableOpacity onPress={() => setShowRunModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Day Type Selection */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>What type of day is this?</Text>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => {
                    setRunQuestionnaire(prev => ({ ...prev, dayType: 'active' }));
                  }}
                >
                  <Text style={styles.optionButtonText}>
                    Active Day
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => {
                    setRunQuestionnaire(prev => ({ ...prev, dayType: 'rest' }));
                    setShowRunModal(false);
                    setShowRunRestModal(true);
                  }}
                >
                  <Text style={styles.optionButtonText}>
                    Rest Day
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Activity Type Selection - Only shows when Active Day is selected */}
            {runQuestionnaire.dayType === 'active' && (
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
                      setShowRunModal(false);
                      setShowRunActiveModal(true);
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
                      setShowRunModal(false);
                      setShowRunActiveModal(true);
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
            )}

            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Run Active Day Modal */}
      <Modal
        visible={showRunActiveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRunActiveModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <Animated.View style={[
              styles.runModalContent,
              { transform: [{ translateY: modalPosition }] }
            ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {runQuestionnaire.activityType === 'walk' ? 'Walk Active Day' : 'Run Active Day'}
              </Text>
              <TouchableOpacity onPress={() => setShowRunActiveModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Run Type Selection */}
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
              <ScrollView 
                style={styles.runNotesScrollContainer}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                <TextInput
                  style={styles.customInput}
                  placeholder="e.g., Felt strong, good pace..."
                  value={runQuestionnaire.runNotes}
                  onChangeText={(text) => setRunQuestionnaire(prev => ({ ...prev, runNotes: text }))}
                  placeholderTextColor="#999"
                  multiline
                  textAlignVertical="top"
                />
              </ScrollView>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
                              style={[
                  styles.submitButton,
                  !runQuestionnaire.runType && styles.submitButtonDisabled
                ]}
              disabled={!runQuestionnaire.runType}
              onPress={async () => {
                try {
                  const date = getTodayDateString();
                  const habitData = {
                    date,
                    run_activity_type: runQuestionnaire.activityType as 'run' | 'walk',
                    run_day_type: runQuestionnaire.dayType as 'active' | 'rest',
                    run_type: runQuestionnaire.runType,
                    run_distance: runQuestionnaire.distance * 0.5, // Convert to actual km
                    run_duration: `${runQuestionnaire.durationHours}:${runQuestionnaire.durationMinutes.toString().padStart(2, '0')}:${runQuestionnaire.durationSeconds.toString().padStart(2, '0')}`,
                    run_notes: runQuestionnaire.runNotes,
                  };
                  
                  console.log('Attempting to save run data:', habitData);
                  const success = await useActionStore.getState().saveDailyHabits(habitData);
                  if (success) {
                    toggleSegmentStore(4); // Check the run segment
                    setShowRunActiveModal(false);
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
              <Text style={styles.submitButtonText}>Complete Run Log</Text>
            </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Run Rest Day Modal */}
      <Modal
        visible={showRunRestModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRunRestModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <Animated.View style={[
              styles.modalContent,
              { transform: [{ translateY: modalPosition }] }
            ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Run Rest Day</Text>
              <TouchableOpacity onPress={() => setShowRunRestModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Rest Day Message */}
            <View style={styles.questionSection}>
              <Text style={styles.questionText}>Rest days are important for recovery!</Text>
              <Text style={[styles.questionText, { fontSize: 16, fontWeight: '400', color: '#666' }]}>
                Taking time to rest allows your muscles to recover and prevents injury.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={async () => {
                try {
                  const date = getTodayDateString();
                  const habitData = {
                    date,
                    run_day_type: 'rest' as const,
                  };
                  
                  const success = await useActionStore.getState().saveDailyHabits(habitData);
                  if (success) {
                    toggleSegmentStore(4); // Check the run segment
                    setShowRunRestModal(false);
                    setRunQuestionnaire({ dayType: '', activityType: '', runType: '', distance: 5, durationHours: 0, durationMinutes: 30, durationSeconds: 0, runNotes: '' });
                  } else {
                    console.error('Failed to save run rest day');
                  }
                } catch (error) {
                  console.error('Error saving run rest day:', error);
                }
              }}
            >
              <Text style={styles.submitButtonText}>Complete Rest Day</Text>
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
                            toggleSegmentStore(5); // Check the reflect segment
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
                        toggleSegmentStore(6); // Check the cold shower segment
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
                  This will mark it as incomplete for today.
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
                    if (segmentToUntick !== null) {
                      // First update UI
                      toggleSegmentStore(segmentToUntick);
                      animateSegment(segmentAnim[segmentToUntick], 0);

                      // Then clear persisted data for this habit if applicable
                      const habitType = segmentIndexToHabit[segmentToUntick];
                      if (habitType && habitType !== 'meditation' && habitType !== 'micro_learn') {
                        try {
                          const date = getTodayDateString();
                          await useActionStore.getState().clearHabitForDate(date, habitType);
                        } catch (e) {
                          console.warn('Failed to clear habit data:', e);
                        }
                      }
                    }
                    setShowUntickConfirmation(false);
                    setSegmentToUntick(null);
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



      {/* Media Upload Modal */}
      <MediaUploadModal
        visible={showMediaUpload}
        onClose={() => setShowMediaUpload(false)}
        onMediaSelected={handleMediaSelected}
        onSkip={handleSkipMedia}
        goalTitle={selectedGoal?.title || 'Goal'}
      />
    </SafeAreaView>
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
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
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
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
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
  // Calendar navigation styles
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 8,
  },
  calendarTitleContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  todayButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Calendar day styles
  pastDayContainer: {
    opacity: 0.6,
  },
  futureDayContainer: {
    opacity: 0.8,
  },
  dayDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  todayDate: {
    color: '#129490',
    fontWeight: '600',
  },
  goalCount: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '600',
  },
  keepTrackHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 8,
    
  },
  // New styles for the month calendar
  calendarContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  monthCalendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  dayNamesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  calendarDay: {
    width: '14.28%', // 7 days in a row
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  calendarDayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  todayText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  emptyDay: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  goToTodayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#129490',
    alignSelf: 'center',
    marginTop: 16,
  },
  goToTodayText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  monthTodayButton: {
    backgroundColor: '#129490',
  },
  monthNamesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 60,
    
  },
  currentMonthName: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  adjacentMonthName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
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
    backgroundColor: 'transparent',
    marginTop: 16,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  todaysTodoText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
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
  progressChartsButton: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressChartsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressChartsText: {
    flex: 1,
    marginLeft: 12,
  },
  progressChartsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  progressChartsSubtitle: {
    fontSize: 14,
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
  }
}); 