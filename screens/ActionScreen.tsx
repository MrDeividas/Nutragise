import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Animated, Easing, LayoutAnimation, Platform, UIManager } from 'react-native';
import Reanimated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  runOnJS,
  Easing as ReanimatedEasing,
  SharedValue
} from 'react-native-reanimated';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Keyboard, TouchableWithoutFeedback, RefreshControl, Image, useWindowDimensions, PanResponder, Pressable } from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
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
import { CreateCustomHabitInput, HabitCategory, HabitScheduleType, CustomHabit } from '../types/database';




// Days constants
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const LEVEL_THRESHOLDS = [0, 1400, 3200, 5500, 8600, 12500, 17500, 24000];
const HABITS_REQUIRING_DETAILS = new Set(['gym', 'run', 'sleep', 'water', 'reflect', 'cold_shower']);
const toRgb = (hex: string) => {
  const sanitized = hex.replace('#', '');
  const expanded = sanitized.length === 3 ? sanitized.split('').map((char) => char + char).join('') : sanitized;
  const parsed = parseInt(expanded, 16);
  return {
    r: (parsed >> 16) & 255,
    g: (parsed >> 8) & 255,
    b: parsed & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number) => {
  return (
    '#' +
    [r, g, b]
      .map((val) => {
        const clamped = Math.max(0, Math.min(255, Math.round(val)));
        const hex = clamped.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
};

const mixColor = (hex: string, amount: number) => {
  const { r, g, b } = toRgb(hex);
  if (amount >= 0) {
    return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount);
  }
  const ratio = 1 + amount;
  return rgbToHex(r * ratio, g * ratio, b * ratio);
};

const hsvToRgb = (h: number, s: number, v: number) => {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

const rgbToHsv = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  if (diff !== 0) {
    if (max === r) {
      h = ((g - b) / diff) % 6;
    } else if (max === g) {
      h = (b - r) / diff + 2;
    } else {
      h = (r - g) / diff + 4;
    }
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : diff / max;
  const v = max;

  return { h, s, v };
};

const getLevelFillPercent = (progress: { currentLevel: number; pointsInCurrentLevel: number }) => {
  const currentLevelIndex = Math.max(0, Math.min(progress.currentLevel - 1, LEVEL_THRESHOLDS.length - 1));
  const currentLevelStart = LEVEL_THRESHOLDS[currentLevelIndex];
  const nextThreshold =
    LEVEL_THRESHOLDS[progress.currentLevel] !== undefined
      ? LEVEL_THRESHOLDS[progress.currentLevel]
      : currentLevelStart + 10000;
  const levelXPRequired = Math.max(nextThreshold - currentLevelStart, 1);
  return Math.min(progress.pointsInCurrentLevel / levelXPRequired, 1);
};

const SCHEDULE_OPTION_MAP: Record<string, HabitScheduleType> = {
  'specific-days-week': 'specific_days_week',
  'specific-days-month': 'specific_days_month',
  'days-per-week': 'days_per_week',
  'days-per-fortnight': 'days_per_fortnight',
  'days-per-month': 'days_per_month',
  'every-x-days': 'every_x_days',
};

const REVERSE_SCHEDULE_MAP: Record<HabitScheduleType, string> = {
  'specific_days_week': 'specific-days-week',
  'specific_days_month': 'specific-days-month',
  'days_per_week': 'days-per-week',
  'days_per_fortnight': 'days-per-fortnight',
  'days_per_month': 'days-per-month',
  'every_x_days': 'every-x-days',
};

const HABIT_ACCENTS: Record<HabitCategory, string> = {
  custom: '#10B981',
  wellbeing: '#0EA5E9',
  nutrition: '#F59E0B',
  time: '#F97316',
  avoid: '#EF4444',
};

const formatHabitScheduleDescription = (habit: CustomHabit): string => {
  switch (habit.schedule_type) {
    case 'specific_days_week':
      if (habit.days_of_week?.length) {
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return habit.days_of_week
          .sort((a, b) => a - b)
          .map((idx) => labels[idx] ?? '')
          .filter(Boolean)
          .join(', ');
      }
      return 'Specific days of the week';
    case 'specific_days_month':
      if (habit.days_of_month?.length) {
        return `Days ${habit.days_of_month.sort((a, b) => a - b).join(', ')}`;
      }
      return 'Specific days of the month';
    case 'days_per_week':
      return `${habit.quantity_per_week ?? 1} per week`;
    case 'days_per_fortnight':
      return `${habit.quantity_per_fortnight ?? 1} per fortnight`;
    case 'days_per_month':
      if (habit.days_of_month?.length) {
        return `Days ${habit.days_of_month.sort((a, b) => a - b).join(', ')}`;
      }
      return 'Days per month';
    case 'every_x_days':
      return `Every ${habit.every_x_days ?? 2} days`;
    default:
      return 'Every day';
  }
};

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

const AnimatedHabitCard = React.memo(({
  card,
  index,
  totalCards,
  spotlightCardWidth,
  cardState,
  isDark,
  cardBackgroundColor,
  progressTrackColor,
  progressFillColor,
  subtitleColor,
  showPendingIndicator,
  progressWidth,
  handleHabitPress,
  handleHabitLongPress,
  cardAnimations,
  styles
}: any) => {
  const anim = cardAnimations[card.key];
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: anim.scale.value },
        { translateX: anim.translateX.value },
      ],
    };
  }, [anim]);
  
  return (
    <Reanimated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={0.85}
        delayLongPress={250}
        onPress={() => handleHabitPress(card.habitId)}
        onLongPress={() => handleHabitLongPress(card.habitId)}
        style={[
          styles.highlightCard,
          {
            width: spotlightCardWidth,
            marginRight: index === totalCards - 1 ? 0 : 12,
            backgroundColor: cardBackgroundColor,
            shadowColor: cardState?.completed ? '#065f46' : isDark ? '#000000' : '#94a3b8',
          },
        ]}
      >
        <View style={styles.highlightCardHeader}>
          <View>
            <View style={styles.highlightCardTitleRow}>
              <Text style={[styles.highlightCardTitle, { color: '#ffffff' }]}>{card.title}</Text>
              {showPendingIndicator && (
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color="#F87171"
                  style={styles.pendingIndicatorIcon}
                />
              )}
            </View>
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
    </Reanimated.View>
  );
});

const WhiteHabitCard = React.memo(({ 
  card, 
  index, 
  totalCards,
  spotlightCardWidth, 
  whiteCardShadowColor, 
  customHabitsLoading, 
  theme,
  customHabitsDate,
  todayDate,
  toggleHabitCompletion,
  playCompletionSound,
  loadHabitForEditing,
  setShowCustomHabitModal,
  styles
}: any) => {
  const isCreateCard = card.key === 'create_new_habit';
  const [progressAnimated] = useState(new Animated.Value(card.progress ?? 0));
  
  useEffect(() => {
    Animated.timing(progressAnimated, {
      toValue: card.progress ?? 0,
      duration: 450,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [card.progress, progressAnimated]);

  const animatedWidth = progressAnimated.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const handleCardPress = useCallback(() => {
    if (isCreateCard) {
      setShowCustomHabitModal(true);
    }
  }, [isCreateCard, setShowCustomHabitModal]);

  const handleCardLongPress = useCallback(() => {
    if (isCreateCard || !card.habit) return;
    playCompletionSound();
    toggleHabitCompletion(card.habit.id, customHabitsDate || todayDate);
  }, [isCreateCard, card.habit, playCompletionSound, toggleHabitCompletion, customHabitsDate, todayDate]);

  const isCompleted = !isCreateCard && (card.progress >= 1);
  const cardBackgroundColor = isCompleted ? '#10B981' : '#FFFFFF';
  const titleColor = isCompleted ? '#FFFFFF' : theme.textPrimary;
  const subtitleColor = isCompleted ? 'rgba(255, 255, 255, 0.8)' : theme.textSecondary;
  const iconColor = isCompleted ? 'rgba(255, 255, 255, 0.8)' : theme.textSecondary;
  const progressTrackColor = isCompleted ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)';
  const progressFillColor = card.accent;
  
  return (
            <TouchableOpacity 
      activeOpacity={0.85}
      onPress={isCreateCard ? handleCardPress : undefined}
      onLongPress={handleCardLongPress}
      delayLongPress={250}
      disabled={!isCreateCard && customHabitsLoading}
              style={[
        styles.whiteHabitCard,
        {
          width: spotlightCardWidth,
          marginRight: index === totalCards - 1 ? 0 : 12,
          marginVertical: 8,
          shadowColor: whiteCardShadowColor,
          backgroundColor: cardBackgroundColor,
          borderColor: isCompleted ? 'transparent' : '#E5E7EB',
        },
        !isCreateCard && customHabitsLoading && styles.whiteHabitCardDisabled,
      ]}
    >
      <View style={[styles.whiteHabitCardHeader, { backgroundColor: isCreateCard ? 'transparent' : card.accent, borderRadius: 20 }]}>
        <View>
          <Text style={[styles.whiteHabitCardTitle, { color: isCreateCard ? theme.textPrimary : '#FFFFFF' }]}>{card.title}</Text>
          <Text style={[styles.whiteHabitCardSubtitle, { color: isCreateCard ? theme.textSecondary : 'rgba(255, 255, 255, 0.8)' }]}>{card.subtitle}</Text>
          </View>
        {!isCreateCard && card.habit && (
      <TouchableOpacity 
            onPress={(e) => {
              e.stopPropagation();
              if (card.habit) {
                loadHabitForEditing(card.habit);
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={16} color="#FFFFFF" />
      </TouchableOpacity>
        )}
        {isCreateCard && (
          <Ionicons name="ellipsis-vertical" size={16} color={theme.textSecondary} />
        )}
    </View>

      <View style={[styles.whiteHabitCardProgress, { backgroundColor: progressTrackColor }]}>
        <Animated.View
          style={[
            styles.whiteHabitCardProgressFill,
            {
              width: animatedWidth,
              backgroundColor: progressFillColor,
            },
          ]}
        />
      </View>

      <View style={styles.whiteHabitCardMetricRow}>
        <Text style={[styles.whiteHabitCardMetricLabel, { color: subtitleColor }]}>{card.metricLabel}</Text>
        <Text style={[styles.whiteHabitCardMetricValue, { color: titleColor }]}>{card.metricValue}</Text>
      </View>
    </TouchableOpacity>
  );
});

function ActionScreen() {
  const navigation = useNavigation() as any;
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();
  const { goals: userGoals, fetchGoals, loading } = useGoalsStore();
  const {
    selectedDate,
    setSelectedDate,
    dailyHabits,
    loadDailyHabits,
    syncSegmentsWithData,
    customHabits,
    customHabitsLoading,
    habitCompletions,
    loadCustomHabits,
    createCustomHabit,
    updateCustomHabit,
    deleteCustomHabit,
    toggleHabitCompletion,
    customHabitsDate,
  } = useActionStore();
  const { segmentChecked, coreHabitsCompleted, loadCoreHabitsStatus } = useActionStore();
  
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [reorderTab, setReorderTab] = useState<'core' | 'custom'>('core');
  const [reorderableCustomHabits, setReorderableCustomHabits] = useState<CustomHabit[]>([]);
  const [customHabitOrder, setCustomHabitOrder] = useState<string[]>([]);
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
  const [showCustomHabitModal, setShowCustomHabitModal] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [customHabitTitle, setCustomHabitTitle] = useState('');
  const [selectedCustomHabitType, setSelectedCustomHabitType] = useState('custom');
  const [breakHabitTitle, setBreakHabitTitle] = useState('');
  const [timedTaskTitle, setTimedTaskTitle] = useState('');
  const [goalTime, setGoalTime] = useState('');
  const customHabitSlide = useRef(new Animated.Value(0)).current;
  const customHabitScrollViewRef = useRef<ScrollView>(null);
  const [selectedPreset, setSelectedPreset] = useState<{ key: string; label: string } | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDuration, setTaskDuration] = useState<'day' | 'week' | 'month'>('day');
  const [taskFrequency, setTaskFrequency] = useState(1);
  const [selectedColor, setSelectedColor] = useState('#10B981');
  const [colorPickerHue, setColorPickerHue] = useState(150);
  const [colorPickerSaturation, setColorPickerSaturation] = useState(0.8);
  const [colorPickerValue, setColorPickerValue] = useState(0.8);
  const colorPickerUpdatingRef = useRef(false);
  const colorPickerBoxSizeRef = useRef<{ width: number; height: number } | null>(null);
  const colorPickerHueTrackSizeRef = useRef<number>(0);
  const colorPickerFrameRef = useRef<number | null>(null);
  const pendingColorSVRef = useRef<{ s: number; v: number } | null>(null);
  const pendingHueRef = useRef<number | null>(null);
  const [isColorPickerInteracting, setIsColorPickerInteracting] = useState(false);
  const [taskDays, setTaskDays] = useState('Every Day');
  const [selectedTaskDaysOption, setSelectedTaskDaysOption] = useState<string>('specific-days-week');
  const [selectedMonthDays, setSelectedMonthDays] = useState<Set<number>>(new Set([1]));
  const [selectedWeekDays, setSelectedWeekDays] = useState<Set<number>>(new Set());
  const [selectedDaysPerWeek, setSelectedDaysPerWeek] = useState<number>(1);
  const [selectedDaysPerFortnight, setSelectedDaysPerFortnight] = useState<number>(1);
  const [selectedDaysPerMonth, setSelectedDaysPerMonth] = useState<Set<number>>(new Set([1]));
  const [selectedEveryXDays, setSelectedEveryXDays] = useState<number>(2);
  const [isSavingHabit, setIsSavingHabit] = useState(false);
  const todayDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const colorPickerBaseColor = useMemo(() => {
    const { r, g, b } = hsvToRgb(colorPickerHue, 1, 1);
    return rgbToHex(r, g, b);
  }, [colorPickerHue]);
  const colorPickerBoxWidth = colorPickerBoxSizeRef.current?.width ?? 220;
  const colorPickerBoxHeight = colorPickerBoxSizeRef.current?.height ?? 220;
  const colorPickerHueTrackHeight = colorPickerHueTrackSizeRef.current || 220;

  useEffect(() => {
    return () => {
      if (colorPickerFrameRef.current !== null) {
        cancelAnimationFrame(colorPickerFrameRef.current);
        colorPickerFrameRef.current = null;
      }
    };
  }, []);
  const customHabitCategories = useMemo(
    () => [
      { key: 'custom', label: 'Create', icon: 'checkmark' },
      { key: 'wellbeing', label: 'Wellbeing', icon: 'heart' },
      { key: 'nutrition', label: 'Nutrition', icon: 'restaurant' },
      { key: 'time', label: 'Schedule', icon: 'time' },
      { key: 'avoid', label: 'Avoid', icon: 'ban' },
    ],
    []
  );
  const positivePresets = useMemo(
    () => [
      { key: 'eat_healthy_meal', label: 'Eat a Healthy Meal' },
      { key: 'be_happy', label: 'Be Happy' },
      { key: 'write_in_journal', label: 'Write In Journal' },
      { key: 'do_homework', label: 'Do Your Homework' },
      { key: 'walk_dog', label: 'Walk the Dog' },
      { key: 'drink_smoothie', label: 'Drink a Smoothie' },
      { key: 'take_vitamins', label: 'Take Vitamins' },
      { key: 'take_photo', label: 'Take a Photo' },
    ],
    []
  );
  const avoidPresets = useMemo(
    () => [
      { key: 'dont_smoke', label: "Don't Smoke" },
      { key: 'dont_swear', label: "Don't Swear" },
      { key: 'dont_slouch', label: "Don't Slouch" },
      { key: 'dont_bite_nails', label: "Don't Bite Nails" },
      { key: 'dont_pick_nose', label: "Don't Pick Nose" },
      { key: 'decrease_alcohol', label: 'Decrease Alcohol Consumption' },
      { key: 'dont_drink_coffee', label: "Don't Drink Coffee" },
      { key: 'dont_eat_bad_food', label: "Don't Eat Bad Food" },
      { key: 'dont_procrastinate', label: "Don't Procrastinate" },
    ],
    []
  );
  const timedPresets = useMemo(
    () => [
      { key: 'read_10_minutes', label: 'Read for 10 Minutes' },
      { key: 'learn_language', label: 'Learn a Language' },
      { key: 'practice_instrument', label: 'Practice Instrument' },
      { key: 'tidy_up', label: 'Tidy Up' },
      { key: 'pomodoro', label: 'Pomodoro' },
      { key: 'decrease_screen_time', label: 'Decrease Screen Time' },
      { key: 'increase_screen_time', label: 'Increase Screen Time' },
      { key: 'mindful_minutes', label: 'Mindful Minutes' },
    ],
    []
  );
  const customHabitPresets = useMemo(() => {
    if (selectedCustomHabitType === 'avoid') {
      return avoidPresets;
    } else if (selectedCustomHabitType === 'time') {
      return timedPresets;
    }
    return positivePresets;
  }, [selectedCustomHabitType, avoidPresets, timedPresets, positivePresets]);

  const isTimedTask = useMemo(() => {
    if (timedTaskTitle.trim() !== '') return true;
    if (selectedPreset) {
      return timedPresets.some(p => p.key === selectedPreset.key);
    }
    return false;
  }, [timedTaskTitle, selectedPreset, timedPresets]);
  const isHealthOrFoodComingSoon = selectedCustomHabitType === 'wellbeing' || selectedCustomHabitType === 'nutrition';
  const isSaveDisabled = useMemo(
    () => isHealthOrFoodComingSoon || isSavingHabit || taskTitle.trim().length === 0,
    [isHealthOrFoodComingSoon, isSavingHabit, taskTitle]
  );
  const [showUntickConfirmation, setShowUntickConfirmation] = useState(false);
  const [segmentToUntick, setSegmentToUntick] = useState<number | null>(null);
  const [showHabitInfoModal, setShowHabitInfoModal] = useState(false);
  const [selectedHabitType, setSelectedHabitType] = useState<string>('');
  const [selectedDateHabitsData, setSelectedDateHabitsData] = useState<any>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showReorderHabitsModal, setShowReorderHabitsModal] = useState(false);
  const [reorderableHabits, setReorderableHabits] = useState<any[]>([]);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [newlyCreatedGoalId, setNewlyCreatedGoalId] = useState<string | null>(null);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [myActiveChallenges, setMyActiveChallenges] = useState<Challenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const headerGreetingOpacity = useRef(new Animated.Value(0)).current;
  const headerStatsOpacity = useRef(new Animated.Value(0)).current;
  const [onboardingIncomplete, setOnboardingIncomplete] = useState(false);
  const [onboardingLastStep, setOnboardingLastStep] = useState<number | null>(null);
  
  // Level progress state
  const [levelProgress, setLevelProgress] = useState({ 
    currentLevel: 1, 
    nextLevel: 2, 
    pointsInCurrentLevel: 0,
    pointsNeededForNext: 1400
  });
  const [isLevelExpanded, setIsLevelExpanded] = useState(false);
  const toggleLevelExpansion = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsLevelExpanded(!isLevelExpanded);
  };
  const [totalPoints, setTotalPoints] = useState(0);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const progressFillAnim = useRef(new Animated.Value(getLevelFillPercent(levelProgress))).current;
  const progressPointsAnim = useRef(new Animated.Value(levelProgress.pointsInCurrentLevel)).current;
  const [animatedPoints, setAnimatedPoints] = useState(levelProgress.pointsInCurrentLevel);
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const [pendingDataHabits, setPendingDataHabits] = useState<Set<string>>(new Set());

  
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
    motivation: 3,
    stress: 3,
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

  const whiteHabitCards = useMemo(() => {
    const createCard = {
      key: 'create_new_habit',
      title: 'Create New Habit',
      subtitle: 'Custom',
      metricLabel: 'Add',
      metricValue: '+',
      progress: 0,
      accent: '#10B981',
      habit: undefined as CustomHabit | undefined,
    };

    // Sort custom habits based on saved order
    const sortedCustomHabits = [...customHabits].sort((a, b) => {
      const indexA = customHabitOrder.indexOf(a.id);
      const indexB = customHabitOrder.indexOf(b.id);
      // If both are in order list, sort by index
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      // If only A is in list, it comes first
      if (indexA !== -1) return -1;
      // If only B is in list, it comes first
      if (indexB !== -1) return 1;
      // Otherwise maintain original order (created_at usually)
      return 0;
    });

    const habitCards = sortedCustomHabits.map((habit) => {
      const completion = habitCompletions[habit.id];
      const frequency = (habit.metadata as any)?.frequency ?? 1;
      const duration = (habit.metadata as any)?.taskDuration ?? 'day';
      const durationAbbr = duration === 'day' ? 't/d' : duration === 'week' ? 't/w' : 't/m';
      const frequencyText = `${frequency} ${durationAbbr}`;
      
      // Calculate progress based on completion count vs frequency
      const completionCount = completion?.value ?? (completion ? 1 : 0);
      const calculatedProgress = frequency > 0 ? Math.min(completionCount / frequency, 1) : 0;
      // Show minimum 5% if not completed, so user can see the color
      const progress = calculatedProgress > 0 ? calculatedProgress : 0.05;
      
      // Get color from metadata or accent_color, fallback to category default
      const habitColor = (habit.metadata as any)?.color ?? habit.accent_color ?? HABIT_ACCENTS[habit.category] ?? '#10B981';
      
      return {
        key: habit.id,
        title: habit.title,
        subtitle: formatHabitScheduleDescription(habit),
        metricLabel: 'Frequency',
        metricValue: frequencyText,
        progress: progress,
        accent: habitColor,
        habit,
      };
    });

    return [...habitCards, createCard];
  }, [customHabits, habitCompletions, customHabitOrder]);

  const whiteCardShadowColor = useMemo(
    () => (isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(15, 23, 42, 0.18)'),
    [isDark]
  );

  const fillWidthInterpolation =
    progressBarWidth > 0
      ? progressFillAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, progressBarWidth],
        })
      : null;

  const markHabitNeedsDetails = useCallback((habitId: string) => {
    if (!HABITS_REQUIRING_DETAILS.has(habitId)) return;
    setPendingDataHabits(prev => {
      if (prev.has(habitId)) return prev;
      const next = new Set(prev);
      next.add(habitId);
      return next;
    });
  }, []);
  const customHabitColors = useMemo(() => {
    const progressGreen = '#10B981';
    return {
      background: progressGreen,
      card: mixColor(progressGreen, -0.08),
      button: mixColor(progressGreen, -0.16),
      buttonActive: mixColor(progressGreen, -0.04),
      iconBackground: mixColor(progressGreen, -0.22),
      text: '#FFFFFF',
      hint: '#C3F6E4',
      placeholder: '#B2ECD7',
      border: mixColor(progressGreen, -0.12),
    };
  }, []);
  const customHabitRecommendations = useMemo(() => positivePresets.slice(0, 3), [positivePresets]);

  useEffect(() => {
    if (!showCustomHabitModal) {
      setEditingHabitId(null);
      setCustomHabitTitle('');
      setBreakHabitTitle('');
      setTimedTaskTitle('');
      setGoalTime('');
      setSelectedCustomHabitType('custom');
      setSelectedPreset(null);
      setTaskTitle('');
      customHabitSlide.setValue(0);
      setTaskDuration('day');
      setTaskFrequency(1);
      setTaskDays('Every Day');
      setSelectedTaskDaysOption('specific-days-week');
      setSelectedWeekDays(new Set());
      setSelectedMonthDays(new Set([1]));
      setSelectedDaysPerWeek(1);
      setSelectedDaysPerFortnight(1);
      setSelectedDaysPerMonth(new Set([1]));
      setSelectedEveryXDays(2);
      setSelectedColor('#10B981');
    }
  }, [showCustomHabitModal, customHabitSlide]);

  useEffect(() => {
    // Reset scroll to top when category changes
    if (customHabitScrollViewRef.current) {
      customHabitScrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
  }, [selectedCustomHabitType]);

  useEffect(() => {
    if (colorPickerUpdatingRef.current) {
      colorPickerUpdatingRef.current = false;
      return;
    }
    try {
      const { r, g, b } = toRgb(selectedColor);
      const { h, s, v } = rgbToHsv(r, g, b);
      setColorPickerHue(h);
      setColorPickerSaturation(s);
      setColorPickerValue(v);
    } catch (error) {
      // ignore invalid color strings
    }
  }, [selectedColor]);

  useEffect(() => {
    const { r, g, b } = hsvToRgb(colorPickerHue, colorPickerSaturation, colorPickerValue);
    const hex = rgbToHex(r, g, b);
    if (hex.toLowerCase() !== selectedColor.toLowerCase()) {
      colorPickerUpdatingRef.current = true;
      setSelectedColor(hex);
    }
  }, [colorPickerHue, colorPickerSaturation, colorPickerValue, selectedColor]);

  const scheduleColorPickerFlush = useCallback(() => {
    if (colorPickerFrameRef.current !== null) return;
    colorPickerFrameRef.current = requestAnimationFrame(() => {
      colorPickerFrameRef.current = null;
      if (pendingColorSVRef.current) {
        const { s, v } = pendingColorSVRef.current;
        pendingColorSVRef.current = null;
        setColorPickerSaturation(s);
        setColorPickerValue(v);
      }
      if (pendingHueRef.current !== null) {
        const hue = pendingHueRef.current;
        pendingHueRef.current = null;
        setColorPickerHue(hue);
      }
    });
  }, []);

  const updateColorFromBox = useCallback((x: number, y: number) => {
    const size = colorPickerBoxSizeRef.current ?? { width: 1, height: 1 };
    const clampedX = Math.max(0, Math.min(size.width, x));
    const clampedY = Math.max(0, Math.min(size.height, y));
    pendingColorSVRef.current = {
      s: clampedX / size.width,
      v: 1 - clampedY / size.height,
    };
    scheduleColorPickerFlush();
  }, [scheduleColorPickerFlush]);

  const colorBoxPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          setIsColorPickerInteracting(true);
          updateColorFromBox(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        },
        onPanResponderMove: (evt) => {
          updateColorFromBox(evt.nativeEvent.locationX, evt.nativeEvent.locationY);
        },
        onPanResponderRelease: () => setIsColorPickerInteracting(false),
        onPanResponderTerminate: () => setIsColorPickerInteracting(false),
      }),
    [updateColorFromBox]
  );

  const updateHueFromTouch = useCallback((y: number) => {
    const height = colorPickerHueTrackSizeRef.current || 1;
    const clampedY = Math.max(0, Math.min(height, y));
    pendingHueRef.current = (1 - clampedY / height) * 360;
    scheduleColorPickerFlush();
  }, [scheduleColorPickerFlush]);

  const handleRandomColor = useCallback(() => {
    const randomHue = Math.random() * 360;
    const randomSaturation = 0.4 + Math.random() * 0.6;
    const randomValue = 0.5 + Math.random() * 0.5;
    setColorPickerHue(randomHue);
    setColorPickerSaturation(randomSaturation);
    setColorPickerValue(randomValue);
  }, []);

  const huePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          setIsColorPickerInteracting(true);
          updateHueFromTouch(evt.nativeEvent.locationY);
        },
        onPanResponderMove: (evt) => {
          updateHueFromTouch(evt.nativeEvent.locationY);
        },
        onPanResponderRelease: () => setIsColorPickerInteracting(false),
        onPanResponderTerminate: () => setIsColorPickerInteracting(false),
      }),
    [updateHueFromTouch]
  );

  const clearHabitNeedsDetails = useCallback((habitId: string) => {
    setPendingDataHabits(prev => {
      if (!prev.has(habitId)) return prev;
      const next = new Set(prev);
      next.delete(habitId);
      return next;
    });
  }, []);

  const headerGreetingMessage = useMemo(() => {
    const hour = new Date().getHours();
    const prefix = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const dayCount = user?.created_at ? Math.floor((new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1;
    const namePart = user?.username ? ` ${user.username}` : '';
    return `${prefix}${namePart}, it's day ${dayCount}`;
  }, [user?.created_at, user?.username]);

  const habitSpotlightCardsBase = useMemo(() => ([
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
  const [habitSpotlightCards, setHabitSpotlightCards] = useState(habitSpotlightCardsBase);
  const habitSpotlightCardsRef = useRef(habitSpotlightCardsBase);
  const completionSoundRef = useRef<Audio.Sound | null>(null);
  
  // Initialize animation values for all cards - must be at top level, unconditionally
  const sleepScale = useSharedValue(1);
  const sleepTranslateX = useSharedValue(0);
  const workoutScale = useSharedValue(1);
  const workoutTranslateX = useSharedValue(0);
  const exerciseScale = useSharedValue(1);
  const exerciseTranslateX = useSharedValue(0);
  const meditationScale = useSharedValue(1);
  const meditationTranslateX = useSharedValue(0);
  const updateGoalScale = useSharedValue(1);
  const updateGoalTranslateX = useSharedValue(0);
  const microlearnScale = useSharedValue(1);
  const microlearnTranslateX = useSharedValue(0);
  const focusScale = useSharedValue(1);
  const focusTranslateX = useSharedValue(0);
  const reflectScale = useSharedValue(1);
  const reflectTranslateX = useSharedValue(0);
  const waterScale = useSharedValue(1);
  const waterTranslateX = useSharedValue(0);
  const coldShowerScale = useSharedValue(1);
  const coldShowerTranslateX = useSharedValue(0);
  const screenTimeScale = useSharedValue(1);
  const screenTimeTranslateX = useSharedValue(0);
  
  // Map card keys to their animation values
  const cardAnimations = useMemo(() => ({
    sleep: { scale: sleepScale, translateX: sleepTranslateX },
    workout: { scale: workoutScale, translateX: workoutTranslateX },
    exercise: { scale: exerciseScale, translateX: exerciseTranslateX },
    meditation: { scale: meditationScale, translateX: meditationTranslateX },
    update_goal: { scale: updateGoalScale, translateX: updateGoalTranslateX },
    microlearn: { scale: microlearnScale, translateX: microlearnTranslateX },
    focus: { scale: focusScale, translateX: focusTranslateX },
    reflect: { scale: reflectScale, translateX: reflectTranslateX },
    water: { scale: waterScale, translateX: waterTranslateX },
    cold_shower: { scale: coldShowerScale, translateX: coldShowerTranslateX },
    screen_time: { scale: screenTimeScale, translateX: screenTimeTranslateX },
  } as Record<string, { scale: SharedValue<number>, translateX: SharedValue<number> }>), [sleepScale, sleepTranslateX, workoutScale, workoutTranslateX, exerciseScale, exerciseTranslateX, 
      meditationScale, meditationTranslateX, updateGoalScale, updateGoalTranslateX, 
      microlearnScale, microlearnTranslateX, focusScale, focusTranslateX, 
      reflectScale, reflectTranslateX, waterScale, waterTranslateX, 
      coldShowerScale, coldShowerTranslateX, screenTimeScale, screenTimeTranslateX]);
  
  // Keep ref in sync with state
  useEffect(() => {
    habitSpotlightCardsRef.current = habitSpotlightCards;
  }, [habitSpotlightCards]);

  // Persist card order to AsyncStorage
  const saveCardOrder = useCallback(async (cards: typeof habitSpotlightCardsBase) => {
    try {
      if (user) {
        const order = cards.map(card => card.habitId);
        await AsyncStorage.setItem(`habit_card_order_${user.id}`, JSON.stringify(order));
      }
    } catch (error) {
      console.warn('Failed to save card order:', error);
    }
  }, [user]);

  // Load card order from AsyncStorage
  const loadCardOrder = useCallback(async (): Promise<string[] | null> => {
    try {
      if (user) {
        const stored = await AsyncStorage.getItem(`habit_card_order_${user.id}`);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (error) {
      console.warn('Failed to load card order:', error);
    }
    return null;
  }, [user]);

  // Persist custom habit order
  const saveCustomHabitOrder = useCallback(async (habits: CustomHabit[]) => {
    try {
      if (user) {
        const order = habits.map(h => h.id);
        await AsyncStorage.setItem(`custom_habit_order_${user.id}`, JSON.stringify(order));
      }
    } catch (error) {
      console.warn('Failed to save custom habit order:', error);
    }
  }, [user]);

  // Load custom habit order
  const loadCustomHabitOrder = useCallback(async (): Promise<string[] | null> => {
    try {
      if (user) {
        const stored = await AsyncStorage.getItem(`custom_habit_order_${user.id}`);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (error) {
      console.warn('Failed to load custom habit order:', error);
    }
    return null;
  }, [user]);

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
        // Show 5% if not completed (so user can see the color), otherwise use actual progress or 100% if completed
        const displayProgress = shouldBeCompleted ? 1 : 0.05;

        if (!existing) {
          const animatedValue = new Animated.Value(displayProgress);
          nextState[card.key] = {
            baseProgress: displayProgress,
            progressAnimated: animatedValue,
            completed: shouldBeCompleted,
          };
          changed = true;
          return;
        }

        if (existing.baseProgress !== displayProgress && !shouldBeCompleted) {
          nextState[card.key] = {
            ...existing,
            baseProgress: displayProgress,
          };
          if (!existing.completed) {
            existing.progressAnimated.setValue(displayProgress);
          }
          changed = true;
        }

        if (existing.completed !== shouldBeCompleted) {
          existing.progressAnimated.setValue(displayProgress);
          nextState[card.key] = {
            ...existing,
            baseProgress: displayProgress,
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

      // Show 5% if not completed (so user can see the color), otherwise 100% if completed
      const displayProgress = completed ? 1 : 0.05;
      const targetValue = displayProgress;
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

      if (current.completed === completed && current.baseProgress === displayProgress) {
        return prev;
      }

      return {
        ...prev,
        [key]: {
          ...current,
          baseProgress: displayProgress,
          completed,
        },
      };
    });
  }, [habitIdToCardMap]);

  // Animate card to end of carousel
  // Helper function to sort habits: non-completed first, completed last
  const sortHabitsByCompletion = useCallback((cards: any[], completedSet: Set<string>) => {
    const sorted = [...cards];
    sorted.sort((a, b) => {
      const aCompleted = completedSet.has(a.habitId);
      const bCompleted = completedSet.has(b.habitId);
      // Non-completed first (return -1), completed last (return 1)
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      // If both have same status, maintain relative order
      return 0;
    });
    return sorted;
  }, []);

  const animateCardToEnd = useCallback((habitId: string) => {
    const currentCards = habitSpotlightCardsRef.current;
    const card = currentCards.find(c => c.habitId === habitId);
    if (!card || !cardAnimations[card.key]) return;
    
    const currentIndex = currentCards.findIndex(c => c.habitId === habitId);
    if (currentIndex === -1 || currentIndex === currentCards.length - 1) return;
    
    // Calculate distance to slide (to end of carousel)
    const cardsToSlide = currentCards.length - 1 - currentIndex;
    const slideDistance = cardsToSlide * (spotlightCardWidth + 12);
    
    const anim = cardAnimations[card.key];
    
    // Animation sequence: shrink → slide → grow
    anim.scale.value = withSequence(
      withTiming(0.85, { 
        duration: 200, 
        easing: ReanimatedEasing.out(ReanimatedEasing.quad) 
      }),
      withTiming(0.85, { duration: 300 }), // Hold while sliding
      withTiming(1, { 
        duration: 200, 
        easing: ReanimatedEasing.out(ReanimatedEasing.quad) 
      })
    );
    
    anim.translateX.value = withSequence(
      withTiming(0, { duration: 200 }), // Wait for shrink
      withTiming(slideDistance, { 
        duration: 400,
        easing: ReanimatedEasing.inOut(ReanimatedEasing.ease)
      }),
      withTiming(0, { 
        duration: 0 // Reset for next animation
      })
    );
    
    // Reorder cards after slide animation completes - sort by completion status
    setTimeout(() => {
      setHabitSpotlightCards(prevCards => {
        const nextCompleted = new Set(completedHabits);
        nextCompleted.add(habitId);
        const sorted = sortHabitsByCompletion(prevCards, nextCompleted);
        habitSpotlightCardsRef.current = sorted;
        // Do not save order here to preserve user's preferred order across days
        return sorted;
      });
      // Reset animation values
      anim.scale.value = 1;
      anim.translateX.value = 0;
    }, 700); // Total animation duration
  }, [spotlightCardWidth, cardAnimations, completedHabits, sortHabitsByCompletion, saveCardOrder]);

  const markHabitCompleted = useCallback((habitId: string) => {
    setCompletedHabits(prev => {
      if (prev.has(habitId)) return prev;
      const next = new Set(prev);
      next.add(habitId);
      return next;
    });
    playCompletionSound();
    updateCardCompletionVisual(habitId, true, { animate: true });
    clearHabitNeedsDetails(habitId);
    // Animate card to end after bar fills (450ms)
    setTimeout(() => {
      animateCardToEnd(habitId);
    }, 500);
  }, [updateCardCompletionVisual, playCompletionSound, clearHabitNeedsDetails, animateCardToEnd]);

  const markHabitUncompleted = useCallback((habitId: string) => {
    setCompletedHabits(prev => {
      if (!prev.has(habitId)) return prev;
      const next = new Set(prev);
      next.delete(habitId);
      // Reorder habits: move uncompleted to front
      setHabitSpotlightCards(prevCards => {
        const nextCompleted = next;
        const sorted = sortHabitsByCompletion(prevCards, nextCompleted);
        habitSpotlightCardsRef.current = sorted;
        // Do not save order here
        return sorted;
      });
      return next;
    });
    updateCardCompletionVisual(habitId, false, { animate: true });
    clearHabitNeedsDetails(habitId);
  }, [updateCardCompletionVisual, clearHabitNeedsDetails, sortHabitsByCompletion, saveCardOrder]);

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
            run_notes: 'Quick complete',
          });
          break;
        case 'sleep':
          success = await useActionStore.getState().saveDailyHabits({
            date,
            sleep_hours: 1,
            sleep_quality: 50,
          });
          break;
        case 'water':
          success = await useActionStore.getState().saveDailyHabits({
            date,
            water_intake: 1,
            water_notes: 'Quick check-in',
          });
          break;
        case 'focus':
          success = await useActionStore.getState().saveDailyHabits({
            date,
            focus_completed: true,
            focus_notes: 'Quick complete',
          });
          break;
        case 'reflect':
          success = await useActionStore.getState().saveDailyHabits({
            date,
            reflect_mood: 3,
            reflect_energy: 3,
            reflect_what_went_well: 'Quick reflection',
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
        markHabitNeedsDetails(habitId);
        await fetchUserPoints();
        return true;
      }
    } catch (error) {
      console.error('Error saving quick completion for', habitId, error);
    }

    return false;
  }, [user, markHabitNeedsDetails, fetchUserPoints]);

  const handleHabitLongPress = useCallback(async (habitId: string) => {
    // Focus habit cannot be quick completed
    if (habitId === 'focus') return;
    if (completedHabits.has(habitId)) return;
    markHabitCompleted(habitId);
    const success = await persistQuickCompletion(habitId);
    if (!success) {
      markHabitUncompleted(habitId);
    }
  }, [completedHabits, markHabitCompleted, markHabitUncompleted, persistQuickCompletion]);

  // Automatically sort habits on initial load
  useEffect(() => {
    // Sort habits initially based on completion status
    setHabitSpotlightCards(prevCards => {
      const sorted = sortHabitsByCompletion(prevCards, completedHabits);
      habitSpotlightCardsRef.current = sorted;
      return sorted;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Sync reorderable habits when modal opens
  useEffect(() => {
    if (showReorderHabitsModal) {
      setReorderableHabits([...habitSpotlightCards]);
      // Initialize reorderable custom habits based on current sorted order
      const sortedCustomHabits = [...customHabits].sort((a, b) => {
        const indexA = customHabitOrder.indexOf(a.id);
        const indexB = customHabitOrder.indexOf(b.id);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return 0;
      });
      setReorderableCustomHabits(sortedCustomHabits);
    }
  }, [showReorderHabitsModal, habitSpotlightCards, customHabits, customHabitOrder]);

  // Reorder functions
  const moveHabitUp = useCallback((index: number) => {
    if (index === 0) return;
    setReorderableHabits(prev => {
      const newHabits = [...prev];
      [newHabits[index - 1], newHabits[index]] = [newHabits[index], newHabits[index - 1]];
      return newHabits;
    });
  }, []);

  const moveHabitDown = useCallback((index: number) => {
    setReorderableHabits(prev => {
      if (index === prev.length - 1) return prev;
      const newHabits = [...prev];
      [newHabits[index], newHabits[index + 1]] = [newHabits[index + 1], newHabits[index]];
      return newHabits;
    });
  }, []);

  const moveCustomHabitUp = useCallback((index: number) => {
    setReorderableCustomHabits(prev => {
      if (index === 0) return prev;
      const newHabits = [...prev];
      [newHabits[index], newHabits[index - 1]] = [newHabits[index - 1], newHabits[index]];
      return newHabits;
    });
  }, []);

  const moveCustomHabitDown = useCallback((index: number) => {
    setReorderableCustomHabits(prev => {
      if (index === prev.length - 1) return prev;
      const newHabits = [...prev];
      [newHabits[index], newHabits[index + 1]] = [newHabits[index + 1], newHabits[index]];
      return newHabits;
    });
  }, []);

  const handleSaveHabitOrder = useCallback(() => {
    if (reorderTab === 'core') {
      setHabitSpotlightCards(reorderableHabits);
      habitSpotlightCardsRef.current = reorderableHabits;
      saveCardOrder(reorderableHabits);
    } else {
      setCustomHabitOrder(reorderableCustomHabits.map(h => h.id));
      saveCustomHabitOrder(reorderableCustomHabits);
    }
    setShowReorderHabitsModal(false);
  }, [reorderableHabits, reorderableCustomHabits, reorderTab, saveCardOrder, saveCustomHabitOrder]);

  // Load today's daily habits data when component mounts
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    useActionStore.getState().loadDailyHabits(today);
  }, []);

  useEffect(() => {
    useActionStore.getState().loadCustomHabits(todayDate);
  }, [todayDate]);

  useEffect(() => {
    headerGreetingOpacity.setValue(0);
    headerStatsOpacity.setValue(0);
    const animation = Animated.sequence([
      Animated.delay(150),
      Animated.timing(headerGreetingOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.delay(4000),
      Animated.parallel([
        Animated.timing(headerGreetingOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(headerStatsOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]);

    animation.start();

    return () => {
      animation.stop();
    };
  }, [headerGreetingOpacity, headerStatsOpacity]);

  useEffect(() => {
    const listenerId = progressPointsAnim.addListener(({ value }) => {
      setAnimatedPoints(Math.max(0, Math.round(value)));
    });
    return () => {
      progressPointsAnim.removeListener(listenerId);
    };
  }, [progressPointsAnim]);

  useEffect(() => {
    const percent = getLevelFillPercent(levelProgress);
    Animated.timing(progressFillAnim, {
      toValue: percent,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
    Animated.timing(progressPointsAnim, {
      toValue: levelProgress.pointsInCurrentLevel,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [levelProgress, progressFillAnim, progressPointsAnim]);

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

  // Load selected habits on mount and sync completed status
  useEffect(() => {
    if (user) {
      loadSelectedHabits();
    }
    // Sync completed habits whenever data changes
    syncCompletedHabits();
  }, [user, syncCompletedHabits, dailyHabits]);

  // Load persisted card order on mount and sort by completion status
  useEffect(() => {
    if (!user) return;
    
    let isMounted = true;
    
    (async () => {
      try {
        const [storedOrder, storedCustomOrder] = await Promise.all([
          loadCardOrder(),
          loadCustomHabitOrder()
        ]);

        if (storedCustomOrder) {
          setCustomHabitOrder(storedCustomOrder);
        }

        let initialCards = habitSpotlightCardsBase;
        
        // If we have a stored order, restore it
        if (storedOrder && storedOrder.length === habitSpotlightCardsBase.length) {
          const orderMap = new Map(storedOrder.map((id, index) => [id, index]));
          initialCards = [...habitSpotlightCardsBase].sort((a, b) => {
            const aIndex = orderMap.get(a.habitId) ?? Infinity;
            const bIndex = orderMap.get(b.habitId) ?? Infinity;
            return aIndex - bIndex;
          });
        }
        
        // Sort by completion status (non-completed first)
        const sorted = sortHabitsByCompletion(initialCards, completedHabits);
        
        if (isMounted) {
          setHabitSpotlightCards(sorted);
          habitSpotlightCardsRef.current = sorted;
        }
      } catch (error) {
        console.warn('Failed to load card order:', error);
        // Fallback: just sort by completion
        if (isMounted) {
          const sorted = sortHabitsByCompletion(habitSpotlightCardsBase, completedHabits);
          setHabitSpotlightCards(sorted);
          habitSpotlightCardsRef.current = sorted;
        }
      }
    })();
    
    return () => {
      isMounted = false;
    };
  }, [user, loadCardOrder, sortHabitsByCompletion]);

  // Re-sync completed habits whenever today's stored data loads/changes
  useEffect(() => {
    syncCompletedHabits();
  }, [dailyHabits, syncCompletedHabits]);

  // Sort cards by completion status whenever completedHabits changes
  useEffect(() => {
    if (completedHabits.size === 0 && habitSpotlightCards.length === habitSpotlightCardsBase.length) {
      // Only sort if we have completion data or if cards haven't been sorted yet
      return;
    }
    
    setHabitSpotlightCards(prevCards => {
      const sorted = sortHabitsByCompletion(prevCards, completedHabits);
      habitSpotlightCardsRef.current = sorted;
      // Save the sorted order
      saveCardOrder(sorted);
      return sorted;
    });
  }, [completedHabits, sortHabitsByCompletion, saveCardOrder]);

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

  const slideToConfirm = useCallback(() => {
    Animated.timing(customHabitSlide, {
      toValue: -screenWidth,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [customHabitSlide, screenWidth]);

  const slideToSelection = useCallback(() => {
    Animated.timing(customHabitSlide, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [customHabitSlide]);

  const slideToColorPicker = useCallback(() => {
    Animated.timing(customHabitSlide, {
      toValue: -screenWidth * 2,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [customHabitSlide, screenWidth]);

  const slideToTaskDays = useCallback(() => {
    Animated.timing(customHabitSlide, {
      toValue: -screenWidth * 3,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [customHabitSlide, screenWidth]);

  const handleColorPickerBack = useCallback(() => {
    Animated.timing(customHabitSlide, {
      toValue: -screenWidth,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [customHabitSlide, screenWidth]);

  const handlePresetSelect = useCallback((preset: { key: string; label: string }) => {
    setSelectedPreset(preset);
    setTaskTitle(preset.label);
    slideToConfirm();
  }, [slideToConfirm]);

  const handleConfirmTaskBack = useCallback(() => {
    slideToSelection();
  }, [slideToSelection]);

  const handleTaskDaysBack = useCallback(() => {
    // Format and save the selected task days option
    let formattedTaskDays = 'Every Day';
    
    switch (selectedTaskDaysOption) {
      case 'specific-days-week':
        if (selectedWeekDays.size > 0) {
          const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
          const selectedDays = Array.from(selectedWeekDays)
            .sort((a, b) => a - b)
            .map(index => dayNames[index])
            .join(', ');
          formattedTaskDays = selectedDays;
        } else {
          formattedTaskDays = 'Specific days of the week';
        }
        break;
      case 'specific-days-month':
        if (selectedMonthDays.size > 0) {
          const selectedDays = Array.from(selectedMonthDays)
            .sort((a, b) => a - b)
            .join(', ');
          formattedTaskDays = `Days ${selectedDays}`;
        } else {
          formattedTaskDays = 'Specific days of the month';
        }
        break;
      case 'days-per-week':
        formattedTaskDays = `${selectedDaysPerWeek} ${selectedDaysPerWeek === 1 ? 'day' : 'days'} per week`;
        break;
      case 'days-per-fortnight':
        formattedTaskDays = `${selectedDaysPerFortnight} ${selectedDaysPerFortnight === 1 ? 'day' : 'days'} per fortnight`;
        break;
      case 'days-per-month':
        if (selectedDaysPerMonth.size > 0) {
          const selectedDays = Array.from(selectedDaysPerMonth)
            .sort((a, b) => a - b)
            .join(', ');
          formattedTaskDays = `Days ${selectedDays}`;
        } else {
          formattedTaskDays = 'Number of days per month';
        }
        break;
      case 'every-x-days':
        formattedTaskDays = `Every ${selectedEveryXDays} ${selectedEveryXDays === 1 ? 'day' : 'days'}`;
        break;
      default:
        formattedTaskDays = 'Every Day';
    }
    
    setTaskDays(formattedTaskDays);
    
    Animated.timing(customHabitSlide, {
      toValue: -screenWidth,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [customHabitSlide, screenWidth, selectedTaskDaysOption, selectedWeekDays, selectedMonthDays, selectedDaysPerWeek, selectedDaysPerFortnight, selectedDaysPerMonth, selectedEveryXDays]);

  const parseGoalTimeToMinutes = useCallback((): number | null => {
    if (!goalTime) return null;
    const numeric = parseInt(goalTime.replace(/[^\d]/g, ''), 10);
    return Number.isFinite(numeric) ? numeric : null;
  }, [goalTime]);

  const buildHabitPayload = useCallback((): CreateCustomHabitInput | null => {
    const trimmedTitle = (taskTitle || selectedPreset?.label || '').trim();
    if (!trimmedTitle) {
      return null;
    }

    const scheduleType = SCHEDULE_OPTION_MAP[selectedTaskDaysOption] ?? 'specific_days_week';
    const habitMode: 'positive' | 'negative' | 'timed' =
      selectedCustomHabitType === 'avoid'
        ? 'negative'
        : selectedCustomHabitType === 'time'
        ? 'timed'
        : 'positive';

    const payload: CreateCustomHabitInput = {
      title: trimmedTitle,
      preset_key: selectedPreset?.key ?? null,
      category: selectedCustomHabitType as HabitCategory,
      habit_mode: habitMode,
      schedule_type: scheduleType,
      accent_color: selectedColor,
      metadata: {
        selectedTaskDaysOption,
        presetLabel: selectedPreset?.label ?? null,
        created_from: 'action_screen_modal',
        frequency: taskFrequency,
        taskDuration: taskDuration,
        color: selectedColor,
      },
    };

    if (scheduleType === 'specific_days_week') {
      const days = Array.from(selectedWeekDays).sort((a, b) => a - b);
      if (days.length) {
        payload.days_of_week = days;
      }
    }

    if (scheduleType === 'specific_days_month') {
      const days = Array.from(selectedMonthDays).sort((a, b) => a - b);
      if (days.length) {
        payload.days_of_month = days;
      }
    }

    if (scheduleType === 'days_per_week') {
      payload.quantity_per_week = selectedDaysPerWeek;
    }

    if (scheduleType === 'days_per_fortnight') {
      payload.quantity_per_fortnight = selectedDaysPerFortnight;
    }

    if (scheduleType === 'days_per_month') {
      const days = Array.from(selectedDaysPerMonth).sort((a, b) => a - b);
      if (days.length) {
        payload.days_of_month = days;
      }
    }

    if (scheduleType === 'every_x_days') {
      payload.every_x_days = selectedEveryXDays;
    }

    const goalMinutes = parseGoalTimeToMinutes();
    if (goalMinutes && habitMode === 'timed') {
      payload.goal_duration_minutes = goalMinutes;
    }

    return payload;
  }, [
    taskTitle,
    selectedPreset,
    selectedTaskDaysOption,
    selectedCustomHabitType,
    selectedWeekDays,
    selectedMonthDays,
    selectedDaysPerWeek,
    selectedDaysPerFortnight,
    selectedDaysPerMonth,
    selectedEveryXDays,
    taskFrequency,
    taskDuration,
    selectedColor,
    parseGoalTimeToMinutes,
  ]);

  const handleCustomTaskConfirm = useCallback((title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const preset = { key: `custom_${Date.now()}`, label: trimmed };
    setSelectedPreset(preset);
    setTaskTitle(trimmed);
    slideToConfirm();
  }, [slideToConfirm]);

  const loadHabitForEditing = useCallback((habit: CustomHabit) => {
    setEditingHabitId(habit.id);
    setTaskTitle(habit.title);
    setSelectedCustomHabitType(habit.category);
    
    if (habit.preset_key) {
      const preset = customHabitPresets.find(p => p.key === habit.preset_key) || 
                     positivePresets.find(p => p.key === habit.preset_key) ||
                     avoidPresets.find(p => p.key === habit.preset_key) ||
                     timedPresets.find(p => p.key === habit.preset_key);
      if (preset) {
        setSelectedPreset(preset);
      }
    }
    
    // Load schedule type and map it back to selectedTaskDaysOption
    const taskDaysOption = REVERSE_SCHEDULE_MAP[habit.schedule_type] || 'specific-days-week';
    setSelectedTaskDaysOption(taskDaysOption);
    
    // Load schedule-specific data
    if (habit.days_of_week) setSelectedWeekDays(new Set(habit.days_of_week));
    if (habit.days_of_month) setSelectedMonthDays(new Set(habit.days_of_month));
    if (habit.quantity_per_week) setSelectedDaysPerWeek(habit.quantity_per_week);
    if (habit.quantity_per_fortnight) setSelectedDaysPerFortnight(habit.quantity_per_fortnight);
    if (habit.every_x_days) setSelectedEveryXDays(habit.every_x_days);
    
    const metadata = habit.metadata as any;
    if (metadata) {
      if (metadata.frequency) setTaskFrequency(metadata.frequency);
      if (metadata.taskDuration) setTaskDuration(metadata.taskDuration);
      if (metadata.color) setSelectedColor(metadata.color);
      else if (habit.accent_color) setSelectedColor(habit.accent_color);
      if (habit.goal_duration_minutes) {
        const hours = Math.floor(habit.goal_duration_minutes / 60);
        const minutes = habit.goal_duration_minutes % 60;
        setGoalTime(`${hours}:${minutes.toString().padStart(2, '0')}`);
      }
    } else if (habit.accent_color) {
      setSelectedColor(habit.accent_color);
    }
    
    setShowCustomHabitModal(true);
    // Slide to confirm step after a brief delay to allow state to settle
    setTimeout(() => {
      slideToConfirm();
    }, 100);
  }, [customHabitPresets, positivePresets, avoidPresets, timedPresets, slideToConfirm]);

  const handleSaveHabit = useCallback(async () => {
    if (selectedCustomHabitType === 'wellbeing' || selectedCustomHabitType === 'nutrition') {
      Alert.alert('Coming Soon', 'Health and food tasks will be available soon.');
      return;
    }

    const payload = buildHabitPayload();
    if (!payload) {
      Alert.alert('Missing title', 'Please enter a task title before saving.');
      return;
    }

    setIsSavingHabit(true);
    try {
      let success = false;
      if (editingHabitId) {
        const updated = await updateCustomHabit(editingHabitId, payload);
        success = !!updated;
      } else {
        const created = await createCustomHabit(payload);
        success = !!created;
      }
      
      if (success) {
        await loadCustomHabits(customHabitsDate || todayDate);
        setShowCustomHabitModal(false);
      } else {
        Alert.alert('Error', `Failed to ${editingHabitId ? 'update' : 'save'} habit. Please try again.`);
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message ?? `Failed to ${editingHabitId ? 'update' : 'save'} habit.`);
    } finally {
      setIsSavingHabit(false);
    }
  }, [
    buildHabitPayload,
    createCustomHabit,
    updateCustomHabit,
    editingHabitId,
    loadCustomHabits,
    customHabitsDate,
    todayDate,
    selectedCustomHabitType,
  ]);

  const handleDeleteHabit = useCallback(async () => {
    if (!editingHabitId) return;

    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteCustomHabit(editingHabitId);
              if (success) {
                await loadCustomHabits(customHabitsDate || todayDate);
                setShowCustomHabitModal(false);
              } else {
                Alert.alert('Error', 'Failed to delete habit. Please try again.');
              }
            } catch (error: any) {
              Alert.alert('Error', error?.message ?? 'Failed to delete habit.');
            }
          },
        },
      ]
    );
  }, [editingHabitId, deleteCustomHabit, loadCustomHabits, customHabitsDate, todayDate]);

  const openHabitForm = useCallback((habitId: string) => {
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
            motivation: dailyHabits.reflect_motivation || 3,
            stress: dailyHabits.reflect_stress || 3,
            whatWentWell: dailyHabits.reflect_what_went_well || '',
            friction: dailyHabits.reflect_friction || '',
            oneTweak: dailyHabits.reflect_one_tweak || '',
            nothingToChange: dailyHabits.reflect_nothing_to_change || false,
            currentStep: 1
          });
        } else {
          setReflectQuestionnaire({
            mood: 3,
            motivation: 3,
            stress: 3,
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
  }, [navigation, modalPosition]);

  // Handle habit press from the new ring
  const handleHabitPress = useCallback((habitId: string) => {
    // Check if habit is already completed
    if (completedHabits.has(habitId)) {
      if (pendingDataHabits.has(habitId)) {
        openHabitForm(habitId);
        return;
      }
      // Show untick confirmation
      setHabitToUntick(habitId);
      setShowUntickConfirmation(true);
      return;
    }

    openHabitForm(habitId);
  }, [completedHabits, pendingDataHabits, openHabitForm]);

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
      
      // Show challenges that are active or upcoming
      const relevant = challenges
        .map(challenge => {
        const startDate = new Date(challenge.start_date);
        const endDate = new Date(challenge.end_date);
          const isActive = now >= startDate && now <= endDate;
          const isUpcoming = now < startDate;
          return { challenge, startDate, endDate, isActive, isUpcoming };
        })
        .filter(entry => entry.isActive || entry.isUpcoming)
        .sort((a, b) => {
          if (a.isActive !== b.isActive) {
            return a.isActive ? -1 : 1; // active first
          }
          return a.startDate.getTime() - b.startDate.getTime();
        })
        .map(entry => entry.challenge);

      setMyActiveChallenges(relevant);
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

  // Refresh challenges whenever Action screen regains focus
  useFocusEffect(
    useCallback(() => {
      loadMyActiveChallenges();
    }, [loadMyActiveChallenges])
  );

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
            <Animated.View
              style={[
                styles.headerGreetingBanner,
                {
                  opacity: headerGreetingOpacity,
                  transform: [
                    {
                      translateY: headerGreetingOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-10, 0],
                      }),
                    },
                  ],
                },
              ]}
              pointerEvents="none"
            >
              <Text style={[styles.headerGreetingText, { color: theme.textPrimary }]}>
                {headerGreetingMessage}
              </Text>
            </Animated.View>

            <Animated.View style={[styles.headerStatsRow, { opacity: headerStatsOpacity }]}>
              <View style={styles.headerStat}>
                <Ionicons name="cash-outline" size={18} color={theme.textPrimary} />
                <Text style={[styles.headerStatText, { color: theme.textPrimary }]}>40</Text>
              </View>
              <View style={styles.headerStat}>
                <Ionicons name="diamond-outline" size={18} color={theme.textPrimary} />
                <Text style={[styles.headerStatText, { color: theme.textPrimary }]}>100</Text>
              </View>
            </Animated.View>
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
        <View style={{ marginHorizontal: 24, marginBottom: 16, marginTop: 0 }}>
          <TouchableOpacity 
            onPress={toggleLevelExpansion}
            activeOpacity={0.7}
          >
            <Animated.View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: isLevelExpanded ? 30 : 10 }}>
              {isLevelExpanded && (
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textPrimary, marginRight: 6 }}>{levelProgress.currentLevel}</Text>
              )}
              <View 
                style={{
                  flex: 1,
                  marginHorizontal: 4,
                  height: 8,
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  borderRadius: 4,
                  overflow: 'visible',
                  position: 'relative',
                }}
                onLayout={(event) => {
                  const width = event.nativeEvent.layout.width;
                  if (width !== progressBarWidth) {
                    setProgressBarWidth(width);
                  }
                }}
              >
                <Animated.View
                  style={[
                    styles.levelProgressFill,
                    {
                      width: fillWidthInterpolation ?? 0,
                    },
                  ]}
                />
                {fillWidthInterpolation && isLevelExpanded && (
                  <>
                    <Animated.View
                      style={[
                        styles.levelProgressDash,
                        {
                          transform: [
                            {
                              translateX: Animated.subtract(fillWidthInterpolation, 0.5),
                            },
                          ],
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.levelProgressFloatingPoints,
                        {
                          transform: [
                            {
                              translateX: Animated.subtract(fillWidthInterpolation, 20),
                            },
                          ],
                        },
                      ]}
                    >
                      <Text style={[styles.levelProgressFloatingText, { color: theme.textPrimary }]}>
                        {animatedPoints}
          </Text>
                    </Animated.View>
                  </>
                )}
        </View>
              {isLevelExpanded && (
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textPrimary, marginLeft: 6 }}>{levelProgress.nextLevel}</Text>
              )}
            </Animated.View>
          </TouchableOpacity>

          {isLevelExpanded && (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 20 }} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.textSecondary }}>EXP</Text>
              </View>
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
                <Ionicons name="information-circle-outline" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          )}
        </View>

        {/* Greeting Section */}
        <View style={[styles.greetingSection, { flexDirection: 'row', alignItems: 'center' }]}>
          <Text style={[styles.greetingText, { color: theme.textPrimary }]}>
            Habits
          </Text>
          <TouchableOpacity onPress={() => setShowReorderHabitsModal(true)} accessibilityRole="button" style={{ marginLeft: 8 }}>
            <Ionicons name="swap-vertical" size={20} color={theme.textPrimary} />
          </TouchableOpacity>
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
              const baseProgress = cardState?.baseProgress ?? (isCompletedCard ? 1 : 0.05);
              // Show 5% if not completed (so user can see the color), otherwise use baseProgress
              const displayProgress = isCompletedCard ? baseProgress : 0.05;
              const progressAnimatedValue = cardState?.progressAnimated ?? new Animated.Value(displayProgress);
              const progressWidth = progressAnimatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              });
              const cardBackgroundColor = isCompletedCard ? '#059669' : (isDark ? '#1f1f1f' : '#111827');
              const progressTrackColor = isCompletedCard ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.15)';
              // Keep original accent color even when completed
              const progressFillColor = card.accent;
              const subtitleColor = isCompletedCard ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.65)';

              const showPendingIndicator = pendingDataHabits.has(card.habitId);
                  
                  return (
                <AnimatedHabitCard
                  key={card.key}
                  card={card}
                  index={index}
                  totalCards={habitSpotlightCards.length}
                  spotlightCardWidth={spotlightCardWidth}
                  cardState={cardState}
                  isDark={isDark}
                  cardBackgroundColor={cardBackgroundColor}
                  progressTrackColor={progressTrackColor}
                  progressFillColor={progressFillColor}
                  subtitleColor={subtitleColor}
                  showPendingIndicator={showPendingIndicator}
                  progressWidth={progressWidth}
                  handleHabitPress={handleHabitPress}
                  handleHabitLongPress={handleHabitLongPress}
                  cardAnimations={cardAnimations}
                  styles={styles}
                />
              );
            })}
          </ScrollView>
        </View>

        {/* White Habit Cards */}
        <View style={styles.highlightCarouselContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ overflow: 'visible' }}
            snapToInterval={spotlightCardWidth + 12}
            snapToAlignment="start"
            decelerationRate="fast"
            contentContainerStyle={styles.highlightCarouselContent}
          >
            {whiteHabitCards.map((card, index) => (
              <WhiteHabitCard
                key={card.key}
                card={card}
                index={index}
                totalCards={whiteHabitCards.length}
                spotlightCardWidth={spotlightCardWidth}
                whiteCardShadowColor={whiteCardShadowColor}
                customHabitsLoading={customHabitsLoading}
                theme={theme}
                customHabitsDate={customHabitsDate}
                todayDate={todayDate}
                toggleHabitCompletion={toggleHabitCompletion}
                playCompletionSound={playCompletionSound}
                loadHabitForEditing={loadHabitForEditing}
                setShowCustomHabitModal={setShowCustomHabitModal}
                styles={styles}
              />
            ))}
          </ScrollView>
        </View>

        {/* Challenges Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Challenges
            </Text>
          </View>
          {myActiveChallenges.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ overflow: 'visible' }}
              contentContainerStyle={[styles.challengesContainer, { paddingHorizontal: 4 }]}
              snapToInterval={spotlightCardWidth + 8}
              snapToAlignment="start"
              decelerationRate="fast"
            >
              {myActiveChallenges.map((challenge, index) => {
                const startDate = new Date(challenge.start_date);
                const endDate = new Date(challenge.end_date);
                const now = new Date();
                const isActiveChallenge = now >= startDate && now <= endDate;
                const dateRangeText = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

                return (
                <TouchableOpacity
                  key={challenge.id}
                  style={[
                    styles.challengeCard,
                    {
                      width: spotlightCardWidth,
                      marginRight: index === myActiveChallenges.length - 1 ? 0 : 8,
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E5E7EB',
                    },
                  ]}
                  onPress={() => (navigation as any).navigate('ChallengeDetail', { challengeId: challenge.id })}
                >
                  <View style={[styles.challengeCardBlueSection, isActiveChallenge && { backgroundColor: '#F97316' }]} />
                  <View style={styles.challengeCardContent}>
                    <View style={[styles.challengeCardTopSection, { zIndex: 1 }]}>
                    <View style={styles.challengeHeader}>
                        <Text style={[styles.challengeTitle, { color: theme.textPrimary }]} numberOfLines={2}>
                        {challenge.title}
                      </Text>
                      </View>
                      <View style={{ position: 'absolute', bottom: 8, right: 16, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="people" size={14} color={theme.textSecondary} />
                        <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '500' }}>
                          <Text style={{ fontWeight: '700' }}>{challenge.participant_count || 0}</Text>
                      </Text>
                    </View>
                    </View>
                    <View style={[styles.challengeCardBottomSection, { zIndex: 1 }]}>
                      <View>
                        <Text style={[styles.challengeTime, { color: 'rgba(255,255,255,0.9)' }]}>
                          {dateRangeText}
                        </Text>
                        <View style={{ marginTop: 4, gap: 4 }}>
                          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '500' }}><Text style={{ fontWeight: '700' }}>£0</Text> investment</Text>
                          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '500' }}><Text style={{ fontWeight: '700' }}>£0</Text> shared pot</Text>
                        </View>
                  </View>
                      
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <View
                            style={[
                              styles.challengeStatusBadge,
                              { backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 0 },
                            ]}
                          >
                            <Text style={[styles.challengeStatusText, { color: '#FFFFFF' }]}>
                              {isActiveChallenge ? 'Active' : 'Upcoming'}
                            </Text>
                          </View>
                        
                        <Text style={[styles.challengeCategory, { color: 'rgba(255,255,255,0.9)', textAlign: 'right' }]} numberOfLines={1}>
                      {challenge.category}
                    </Text>
                  </View>
            </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            </ScrollView>
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
          <View key={`checkins-${refreshTrigger}`} style={styles.todaysCheckinsContainer}>
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
        <View style={[styles.section, { marginTop: 8 }]}>
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

      {/* Custom Habit Modal */}
      <Modal
        visible={showCustomHabitModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCustomHabitModal(false)}
      >
        <View style={styles.customHabitOverlay}>
          <View style={[styles.customHabitContainer, { backgroundColor: customHabitColors.background, width: screenWidth }]}>
            <Animated.View
              style={[
                styles.customHabitPager,
                {
                  width: screenWidth * 4,
                  transform: [{ translateX: customHabitSlide }],
                },
              ]}
            >
              {/* Selection Step */}
              <View style={[styles.customHabitPage, { width: screenWidth }]}>
                <View style={styles.customHabitHeader}>
          <TouchableOpacity 
                    style={[styles.customHabitCloseButton, { backgroundColor: customHabitColors.iconBackground }]}
                    onPress={() => setShowCustomHabitModal(false)}
                  >
                    <Ionicons name="close" size={24} color={customHabitColors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.customHabitTitle, { color: customHabitColors.text }]}>
                    {editingHabitId ? 'Edit Task' : 'Add Task'}
                  </Text>
                  <TouchableOpacity
                    style={[styles.customHabitSearchButton, { backgroundColor: customHabitColors.iconBackground }]}
                  >
                    <Ionicons name="search" size={20} color={customHabitColors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.customHabitCategoryRow}>
                  {customHabitCategories.map(category => {
                    const isSelected = selectedCustomHabitType === category.key;
                    return (
                      <TouchableOpacity
                        key={category.key}
                        style={[
                          styles.customHabitCategoryButton,
                          { backgroundColor: customHabitColors.button },
                          isSelected && { backgroundColor: customHabitColors.buttonActive },
                        ]}
                        onPress={() => setSelectedCustomHabitType(category.key)}
            activeOpacity={0.7}
          >
                        <Ionicons
                          name={category.icon as any}
                          size={20}
                          color={isSelected ? '#FFFFFF' : customHabitColors.text}
                        />
                      </TouchableOpacity>
                    );
                  })}
              </View>
                <ScrollView
                  ref={customHabitScrollViewRef}
                  style={styles.customHabitScroll}
                  contentContainerStyle={styles.customHabitScrollContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  <Text style={[styles.customHabitHint, { color: customHabitColors.hint }]}>
                    {selectedCustomHabitType === 'custom'
                      ? 'Tasks start each day as incomplete. Mark a task as done to increase your streak.'
                      : selectedCustomHabitType === 'avoid'
                      ? 'Negative tasks start each day as complete. Your streak breaks only when you mark it as missed.'
                      : selectedCustomHabitType === 'time'
                      ? 'Timed tasks automatically start a timer for you to complete that task, you can pause and resume throughout the day if necessary.'
                      : selectedCustomHabitType === 'wellbeing'
                      ? 'Health tasks are linked to the health app and are automatically updated when synced.'
                      : selectedCustomHabitType === 'nutrition'
                      ? 'Health tasks are linked to the health app and are automatically updated when synced.'
                      : 'Tap a task to edit or pick from suggestions below.'}
                  </Text>

                  {(selectedCustomHabitType === 'wellbeing' || selectedCustomHabitType === 'nutrition') && (
                    <>
                      <Text style={[styles.customHabitPresetLabel, { color: customHabitColors.text }]}>
                        CHOOSE A PRESET:
                      </Text>
                      <TouchableOpacity
                        style={[styles.customHabitComingSoonButton, { backgroundColor: customHabitColors.card }]}
                        activeOpacity={0.7}
                        disabled={true}
                      >
                        <Text style={[styles.customHabitComingSoonButtonText, { color: customHabitColors.text }]}>
                          Coming soon
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}

                  {selectedCustomHabitType === 'custom' && (
                    <View style={[styles.customHabitInputWrapper, { backgroundColor: customHabitColors.card }]}>
                      <Text style={[styles.customHabitInputLabel, { color: customHabitColors.text }]}>
                        Create your own:
                      </Text>
                      <View style={styles.customHabitInputField}>
                        <TextInput
                          style={[styles.customHabitInput, styles.customHabitInputHasArrow, { color: customHabitColors.text }]}
                          placeholder="Enter task title..."
                          placeholderTextColor={customHabitColors.placeholder}
                          maxLength={28}
                          value={customHabitTitle}
                          onChangeText={setCustomHabitTitle}
                        />
                        <TouchableOpacity
                          style={[
                            styles.customHabitInputActionButton,
                            { backgroundColor: customHabitColors.buttonActive },
                            !customHabitTitle.trim() && styles.customHabitInputActionButtonDisabled,
                          ]}
                          activeOpacity={0.7}
                          disabled={!customHabitTitle.trim()}
                          onPress={() => handleCustomTaskConfirm(customHabitTitle)}
                        >
                          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
            </View>
                      <Text style={[styles.customHabitCharCount, { color: customHabitColors.placeholder }]}>
                        {customHabitTitle.length} / 28
                      </Text>
                    </View>
                  )}

                  {selectedCustomHabitType === 'avoid' && (
                    <View style={[styles.customHabitInputWrapper, { backgroundColor: customHabitColors.card }]}>
                      <Text style={[styles.customHabitInputLabel, { color: customHabitColors.text }]}>
                        Break a bad habit:
                      </Text>
                      <View style={styles.customHabitInputField}>
                        <TextInput
                          style={[styles.customHabitInput, styles.customHabitInputHasArrow, { color: customHabitColors.text }]}
                          placeholder="Enter habit to avoid..."
                          placeholderTextColor={customHabitColors.placeholder}
                          maxLength={28}
                          value={breakHabitTitle}
                          onChangeText={setBreakHabitTitle}
                        />
                        <TouchableOpacity
                          style={[
                            styles.customHabitInputActionButton,
                            { backgroundColor: customHabitColors.buttonActive },
                            !breakHabitTitle.trim() && styles.customHabitInputActionButtonDisabled,
                          ]}
                          activeOpacity={0.7}
                          disabled={!breakHabitTitle.trim()}
                          onPress={() => handleCustomTaskConfirm(breakHabitTitle)}
                        >
                          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
                      <Text style={[styles.customHabitCharCount, { color: customHabitColors.placeholder }]}>
                        {breakHabitTitle.length} / 28
                      </Text>
                    </View>
                  )}

                  {selectedCustomHabitType === 'time' && (
                    <View style={[styles.customHabitInputWrapper, { backgroundColor: customHabitColors.card }]}>
                      <Text style={[styles.customHabitInputLabel, { color: customHabitColors.text }]}>
                        Create your own:
                      </Text>
                      <View style={styles.customHabitInputField}>
                        <TextInput
                          style={[styles.customHabitInput, styles.customHabitInputHasArrow, { color: customHabitColors.text }]}
                          placeholder="Enter task title..."
                          placeholderTextColor={customHabitColors.placeholder}
                          maxLength={28}
                          value={timedTaskTitle}
                          onChangeText={setTimedTaskTitle}
                        />
                        <TouchableOpacity
                          style={[
                            styles.customHabitInputActionButton,
                            { backgroundColor: customHabitColors.buttonActive },
                            !timedTaskTitle.trim() && styles.customHabitInputActionButtonDisabled,
                          ]}
                          activeOpacity={0.7}
                          disabled={!timedTaskTitle.trim()}
                          onPress={() => handleCustomTaskConfirm(timedTaskTitle)}
                        >
                          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.customHabitCharCount, { color: customHabitColors.placeholder }]}>
                        {timedTaskTitle.length} / 28
                      </Text>
                    </View>
                  )}

                  {selectedCustomHabitType === 'custom' && (
                    <>
                      <Text style={[styles.customHabitRecommendationsLabel, { color: customHabitColors.text }]}>
                        BASED ON YOUR TASKS:
                      </Text>
                      <View style={styles.customHabitRecommendationsList}>
                        {customHabitRecommendations.map(rec => (
                          <View
                            key={`rec-${rec.key}`}
                            style={[styles.customHabitRecommendationCard, { backgroundColor: customHabitColors.card }]}
                          >
                            <View style={styles.customHabitRecommendationIcon}>
                              <Ionicons name="sparkles" size={16} color={customHabitColors.text} />
        </View>
                            <View style={styles.customHabitRecommendationContent}>
                              <Text style={[styles.customHabitRecommendationTitle, { color: customHabitColors.text }]}>
                                {rec.label}
                              </Text>
                              <Text
                                style={[styles.customHabitRecommendationSubtitle, { color: customHabitColors.placeholder }]}
                              >
                                Suggested for you
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </>
                  )}

                  {selectedCustomHabitType !== 'wellbeing' && selectedCustomHabitType !== 'nutrition' && (
                    <>
                      <Text style={[styles.customHabitPresetLabel, { color: customHabitColors.text }]}>
                        OR CHOOSE A PRESET:
                      </Text>

                      <ScrollView
                        contentContainerStyle={styles.customHabitPresetList}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled
                      >
                      {customHabitPresets.map(preset => (
                        <TouchableOpacity
                          key={preset.key}
                          style={[styles.customHabitPresetItem, { backgroundColor: customHabitColors.card }]}
                          activeOpacity={0.7}
                          onPress={() => handlePresetSelect(preset)}
                        >
                          <View style={[styles.customHabitPresetIcon, { backgroundColor: customHabitColors.iconBackground }]}>
                            <Ionicons name="ban" size={18} color={customHabitColors.text} />
                          </View>
                          <Text style={[styles.customHabitPresetText, { color: customHabitColors.text }]}>{preset.label}</Text>
                          <Ionicons name="chevron-forward" size={18} color={customHabitColors.text} />
              </TouchableOpacity>
                      ))}
                      </ScrollView>
                    </>
                  )}
                </ScrollView>
        </View>

              {/* Confirm Step */}
              <View style={[styles.customHabitPage, { width: screenWidth }]}>
                <View style={styles.confirmTaskHeader}>
                  {!editingHabitId && (
                    <TouchableOpacity
                      style={[styles.confirmTaskBackButton, { backgroundColor: customHabitColors.iconBackground }]}
                      onPress={handleConfirmTaskBack}
                    >
                      <Ionicons name="arrow-back" size={24} color={customHabitColors.text} />
                    </TouchableOpacity>
                  )}
                  {editingHabitId && <View style={{ width: 40 }} />}
                  <View style={styles.confirmTaskHeaderTitleGroup}>
                    <Text style={[styles.confirmTaskTitle, { color: customHabitColors.text }]}>Confirm Task</Text>
                  </View>
                  {editingHabitId ? (
                    <TouchableOpacity
                      style={[styles.confirmTaskBackButton, { backgroundColor: customHabitColors.iconBackground }]}
                      onPress={() => setShowCustomHabitModal(false)}
                    >
                      <Ionicons name="close" size={24} color={customHabitColors.text} />
                    </TouchableOpacity>
                  ) : (
                    <View style={{ width: 40 }} />
                  )}
        </View>

                <ScrollView contentContainerStyle={styles.confirmTaskContent} showsVerticalScrollIndicator={false}>
              {/* Title Input */}
              <View style={styles.confirmTaskSection}>
                <Text style={[styles.confirmTaskSectionLabel, { color: customHabitColors.text }]}>TITLE:</Text>
                <View style={styles.confirmTaskTitleWrapper}>
                  <TextInput
                    style={[styles.confirmTaskTitleInput, { 
                      backgroundColor: customHabitColors.card,
                      color: customHabitColors.text,
                      borderColor: customHabitColors.border
                    }]}
                    value={taskTitle}
                    onChangeText={setTaskTitle}
                    maxLength={28}
                    placeholder="Enter task title..."
                    placeholderTextColor={customHabitColors.placeholder}
                  />
                  <Text style={[styles.confirmTaskCharCount, { color: customHabitColors.placeholder }]}>
                    {taskTitle.length} / 28
                  </Text>
                </View>
              </View>

              {/* Task Duration */}
              <TouchableOpacity
                style={[styles.confirmTaskRow, { backgroundColor: customHabitColors.card, marginTop: 24 }]}
                activeOpacity={0.7}
            onPress={() => {
                  setTaskDuration(prev => {
                    if (prev === 'day') return 'week';
                    if (prev === 'week') return 'month';
                    return 'day';
                  });
                }}
              >
                <Text style={[styles.confirmTaskRowText, { color: customHabitColors.text }]}>
                  {taskDuration === 'day' ? 'Day-Long Task' : taskDuration === 'week' ? 'Week-Long Task' : 'Month-Long Task'}
                </Text>
                <View style={styles.confirmTaskRowRight}>
                  <Text style={[styles.confirmTaskRowSubtext, { color: customHabitColors.placeholder }]}>
                    Tap to toggle
                  </Text>
                  <View style={[styles.confirmTaskRowIcon, { backgroundColor: customHabitColors.iconBackground }]}>
                    <Ionicons
                      name="swap-vertical"
                      size={18}
                      color={customHabitColors.text}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Frequency */}
              <View style={[styles.confirmTaskRow, { backgroundColor: customHabitColors.card }]}>
                <Text style={[styles.confirmTaskRowText, { color: customHabitColors.text }]}>Frequency</Text>
                <View style={styles.confirmTaskRowRight}>
                  <Text style={[styles.confirmTaskRowSubtext, { color: customHabitColors.placeholder }]}>
                    {taskFrequency} time/day
                  </Text>
                  <View style={styles.confirmTaskFrequencyControls}>
                    <TouchableOpacity
                      style={[styles.confirmTaskFrequencyButton, { backgroundColor: customHabitColors.iconBackground }]}
                      onPress={() => setTaskFrequency(Math.max(1, taskFrequency - 1))}
                    >
                      <Ionicons name="remove" size={18} color={customHabitColors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.confirmTaskFrequencyButton, { backgroundColor: customHabitColors.iconBackground }]}
                      onPress={() => setTaskFrequency(taskFrequency + 1)}
                    >
                      <Ionicons name="add" size={18} color={customHabitColors.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Task Days */}
              <TouchableOpacity
                style={[styles.confirmTaskRow, { backgroundColor: customHabitColors.card }]}
            activeOpacity={0.7}
                onPress={slideToTaskDays}
              >
                <Text style={[styles.confirmTaskRowText, { color: customHabitColors.text }]}>Task Days</Text>
                <View style={styles.confirmTaskRowRight}>
                  <Text style={[styles.confirmTaskRowSubtext, { color: customHabitColors.placeholder }]}>{taskDays}</Text>
                  <View style={[styles.confirmTaskRowIcon, { backgroundColor: customHabitColors.iconBackground }]}>
                    <Ionicons name="calendar" size={18} color={customHabitColors.text} />
              </View>
            </View>
          </TouchableOpacity>

              {/* Goal (only for timed tasks) */}
              {isTimedTask && (
                <View style={[styles.confirmTaskSection, { marginTop: 24 }]}>
                  <Text style={[styles.confirmTaskSectionLabel, { color: customHabitColors.text }]}>GOAL:</Text>
                  <View style={styles.confirmTaskTitleWrapper}>
                    <TextInput
                      style={[styles.confirmTaskTitleInput, { 
                        backgroundColor: customHabitColors.card,
                        color: customHabitColors.text,
                        borderColor: customHabitColors.border
                      }]}
                      value={goalTime}
                      onChangeText={setGoalTime}
                      placeholder="Enter time (e.g., 10 min, 30 min)"
                      placeholderTextColor={customHabitColors.placeholder}
                      keyboardType="numeric"
                    />
        </View>
                </View>
              )}

              {/* Color */}
              <TouchableOpacity
                style={[styles.confirmTaskRow, { backgroundColor: customHabitColors.card, marginTop: 24 }]}
                activeOpacity={0.7}
                onPress={slideToColorPicker}
              >
                <Text style={[styles.confirmTaskRowText, { color: customHabitColors.text }]}>Color</Text>
                <View style={styles.confirmTaskRowRight}>
                  <View
                    style={[
                      styles.colorPreview,
                      { backgroundColor: selectedColor, borderColor: customHabitColors.border }
                    ]}
                  />
                  <View style={[styles.confirmTaskRowIcon, { backgroundColor: customHabitColors.iconBackground }]}>
                    <Ionicons name="chevron-forward" size={18} color={customHabitColors.text} />
        </View>
                </View>
              </TouchableOpacity>

              {/* Notifications */}
              <TouchableOpacity
                style={[styles.confirmTaskRow, { backgroundColor: customHabitColors.card }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.confirmTaskRowText, { color: customHabitColors.text }]}>Notifications</Text>
                <View style={styles.confirmTaskRowRight}>
                  <Text style={[styles.confirmTaskRowSubtext, { color: customHabitColors.placeholder }]}>Automatic</Text>
                  <View style={[styles.confirmTaskRowIcon, { backgroundColor: customHabitColors.iconBackground }]}>
                    <Ionicons name="notifications-outline" size={18} color={customHabitColors.text} />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Action Button */}
              <TouchableOpacity
                style={[styles.confirmTaskRow, { backgroundColor: customHabitColors.card }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.confirmTaskRowText, { color: customHabitColors.text }]}>Action Button</Text>
                <View style={styles.confirmTaskRowRight}>
                  <Text style={[styles.confirmTaskRowSubtext, { color: customHabitColors.placeholder }]}>Automatic</Text>
                  <View style={[styles.confirmTaskRowIcon, { backgroundColor: customHabitColors.iconBackground }]}>
                    <Ionicons name="hand-left-outline" size={18} color={customHabitColors.text} />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Save Task Button */}
              <TouchableOpacity
                style={[
                  styles.confirmTaskRow,
                  { backgroundColor: customHabitColors.card, marginTop: 24, marginBottom: editingHabitId ? 12 : 0 },
                  isSaveDisabled && styles.confirmTaskRowDisabled,
                ]}
                activeOpacity={0.8}
                onPress={handleSaveHabit}
                disabled={isSaveDisabled}
              >
                <Text style={[styles.confirmTaskRowText, { color: customHabitColors.text }]}>
                  {isHealthOrFoodComingSoon ? 'Coming Soon' : isSavingHabit ? (editingHabitId ? 'Updating...' : 'Saving...') : (editingHabitId ? 'Update Task' : 'Save Task')}
                </Text>
                <View style={styles.confirmTaskRowRight}>
                  <View style={[styles.confirmTaskRowIcon, { backgroundColor: customHabitColors.iconBackground }]}>
                    <Ionicons name="checkmark" size={18} color={customHabitColors.text} />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Delete Task Button - Only shown in edit mode */}
              {editingHabitId && (
                <TouchableOpacity
                  style={[
                    styles.confirmTaskRow,
                    { backgroundColor: '#FEE2E2', marginTop: 0, marginBottom: 0 },
                  ]}
                  activeOpacity={0.8}
                  onPress={handleDeleteHabit}
                >
                  <Text style={[styles.confirmTaskRowText, { color: '#DC2626' }]}>Delete Task</Text>
                  <View style={styles.confirmTaskRowRight}>
                    <View style={[styles.confirmTaskRowIcon, { backgroundColor: '#FCA5A5' }]}>
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    </View>
                  </View>
                </TouchableOpacity>
              )}
      </ScrollView>
              </View>

              {/* Color Picker Step */}
              <View style={[styles.customHabitPage, { width: screenWidth }]}>
                <View style={styles.confirmTaskHeader}>
                  <TouchableOpacity
                    style={[styles.confirmTaskBackButton, { backgroundColor: customHabitColors.iconBackground }]}
                    onPress={handleColorPickerBack}
                  >
                    <Ionicons name="arrow-back" size={24} color={customHabitColors.text} />
                  </TouchableOpacity>
                  <View style={styles.confirmTaskHeaderTitleGroup}>
                    <Text style={[styles.confirmTaskTitle, { color: customHabitColors.text }]}>Choose Color</Text>
                  </View>
                  <View style={{ width: 40 }} />
                </View>

                <ScrollView
                  style={styles.colorPickerContent}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={!isColorPickerInteracting}
                >
                  <View style={styles.colorPickerMainContainer}>
                    <View style={styles.colorPickerBoxContainer}>
                      <View
                        style={[
                          styles.colorPickerBox,
                          { backgroundColor: colorPickerBaseColor },
                        ]}
                        onLayout={(event) => {
                          colorPickerBoxSizeRef.current = event.nativeEvent.layout;
                        }}
                      >
                        <ExpoLinearGradient
                          colors={['rgba(255,255,255,1)', 'rgba(255,255,255,0)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.colorPickerBoxWhiteOverlay}
                        />
                        <ExpoLinearGradient
                          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.colorPickerBoxBlackOverlay}
                        />
                        <View
                          style={[
                            styles.colorPickerIndicator,
                            {
                              left: Math.max(
                                -12,
                                Math.min(
                                  colorPickerBoxWidth - 12,
                                  colorPickerSaturation * colorPickerBoxWidth - 12
                                )
                              ),
                              top: Math.max(
                                -12,
                                Math.min(
                                  colorPickerBoxHeight - 12,
                                  (1 - colorPickerValue) * colorPickerBoxHeight - 12
                                )
                              ),
                            },
                          ]}
                        />
                        <View style={StyleSheet.absoluteFill} {...colorBoxPanResponder.panHandlers} />
                      </View>
                    </View>

                    <View style={styles.colorPickerHueContainer}>
                      <Text style={[styles.colorPickerSectionTitle, { color: customHabitColors.text }]}>Hue</Text>
                      <View
                        style={styles.colorPickerHueTrack}
                        onLayout={(event) => {
                          colorPickerHueTrackSizeRef.current = event.nativeEvent.layout.height;
                        }}
                      >
                        <ExpoLinearGradient
                          colors={['#FF0000', '#FF00FF', '#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF0000']}
                          locations={[0, 0.17, 0.33, 0.5, 0.67, 0.83, 1]}
                          style={StyleSheet.absoluteFill}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                        />
                        <View
                          style={[
                            styles.colorPickerHueHandle,
                            {
                              top: Math.max(
                                -8,
                                Math.min(
                                  colorPickerHueTrackHeight - 8,
                                  (1 - colorPickerHue / 360) * colorPickerHueTrackHeight - 8
                                )
                              ),
                            },
                          ]}
                        />
                        <View style={StyleSheet.absoluteFill} {...huePanResponder.panHandlers} />
                      </View>
                    </View>
                  </View>

                  {/* HEX Input */}
                  <View style={[styles.colorPickerHexRow, { marginTop: 24 }]}>
                    <View
                      style={[
                        styles.colorPreview,
                        { backgroundColor: selectedColor, borderColor: customHabitColors.border },
                      ]}
                    />
                    <Text style={[styles.colorPickerHexLabel, { color: customHabitColors.text }]}>HEX</Text>
                    <TextInput
                      style={[styles.colorPickerHexInput, { color: customHabitColors.text }]}
                      value={selectedColor.toUpperCase()}
                      onChangeText={(text) => {
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(text)) {
                          setSelectedColor(text);
                        }
                      }}
                      placeholder="#000000"
                      placeholderTextColor={customHabitColors.placeholder}
                      maxLength={7}
                      autoCapitalize="characters"
                    />
                  </View>
                  
                  {/* Random Color Button */}
                  <TouchableOpacity
                    style={[styles.confirmTaskRow, { backgroundColor: customHabitColors.card }]}
                    activeOpacity={0.8}
                    onPress={handleRandomColor}
                  >
                    <Text style={[styles.confirmTaskRowText, { color: customHabitColors.text }]}>Random color</Text>
                    <View style={styles.confirmTaskRowRight}>
                      <View style={[styles.confirmTaskRowIcon, { backgroundColor: customHabitColors.iconBackground }]}>
                        <Ionicons name="shuffle" size={18} color={customHabitColors.text} />
                      </View>
                    </View>
                  </TouchableOpacity>

                  <Text style={[styles.colorPickerSectionTitle, { color: customHabitColors.text, marginTop: 24 }]}>
                    Preset Colors
                  </Text>
                  <View style={styles.colorPickerGrid}>
                    {[
                      '#10B981', '#3B82F6', '#8B5CF6', '#EC4899',
                      '#F59E0B', '#EF4444', '#06B6D4', '#84CC16',
                      '#6366F1', '#F97316', '#14B8A6', '#A855F7',
                    ].map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorPickerSwatch,
                          {
                            backgroundColor: color,
                            borderWidth: selectedColor === color ? 3 : 1,
                            borderColor: selectedColor === color ? '#FFFFFF' : customHabitColors.border,
                          },
                        ]}
                        onPress={() => setSelectedColor(color)}
                      >
                        {selectedColor === color && (
                          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Task Days Step */}
              <View style={[styles.customHabitPage, { width: screenWidth }]}>
                <View style={styles.confirmTaskHeader}>
                  <TouchableOpacity
                    style={[styles.confirmTaskBackButton, { backgroundColor: customHabitColors.iconBackground }]}
                    onPress={handleTaskDaysBack}
                  >
                    <Ionicons name="arrow-back" size={24} color={customHabitColors.text} />
                  </TouchableOpacity>
                  <View style={styles.confirmTaskHeaderTitleGroup}>
                    <Text style={[styles.confirmTaskTitle, { color: customHabitColors.text }]}>Task Days</Text>
                  </View>
                  <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.confirmTaskContent} showsVerticalScrollIndicator={false}>
                  {/* Specific days of the week */}
                  <TouchableOpacity
                    style={[styles.confirmTaskRow, { backgroundColor: customHabitColors.card }]}
                    activeOpacity={0.7}
                    onPress={() => setSelectedTaskDaysOption('specific-days-week')}
                  >
                    <Text style={[styles.confirmTaskRowText, { color: customHabitColors.text }]}>Specific days of the week</Text>
                    <View style={styles.confirmTaskRowRight}>
                      <View style={[styles.confirmTaskRowIcon, { backgroundColor: customHabitColors.iconBackground }]}>
                        <Ionicons
                          name={selectedTaskDaysOption === 'specific-days-week' ? 'checkmark' : 'help-circle-outline'}
                          size={18}
                          color={customHabitColors.text}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {selectedTaskDaysOption === 'specific-days-week' && (
                    <>
                      <View style={styles.taskDaysWeekSelectorContainer}>
                        <View style={styles.taskDaysWeekSelector}>
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => {
                            const isSelected = selectedWeekDays.has(index);
                            return (
                              <TouchableOpacity
                                key={index}
                                style={[
                                  styles.taskDaysWeekButton,
                                  {
                                    backgroundColor: isSelected ? '#FFFFFF' : customHabitColors.card,
                                  },
                                ]}
                                activeOpacity={0.7}
                                onPress={() => {
                                  setSelectedWeekDays(prev => {
                                    const next = new Set(prev);
                                    if (next.has(index)) {
                                      next.delete(index);
                                    } else {
                                      next.add(index);
                                    }
                                    return next;
                                  });
                                }}
                              >
                                <Text
                                  style={[
                                    styles.taskDaysWeekButtonText,
                                    { color: isSelected ? customHabitColors.background : customHabitColors.text },
                                  ]}
                                >
                                  {day}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                      {/* 2-Day Rule */}
                      <View style={styles.taskDaysWeekSelectorContainer}>
                        <TouchableOpacity
                          style={[styles.taskDays2DayRuleButton, { backgroundColor: customHabitColors.card }]}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.taskDaysWeekButtonText, { color: customHabitColors.text }]}>2-Day Rule</Text>
                          <View style={[styles.taskDays2DayRuleIcon, { backgroundColor: customHabitColors.iconBackground }]}>
                            <Ionicons
                              name="help-circle-outline"
                              size={14}
                              color={customHabitColors.text}
                            />
                          </View>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {/* Specific days of the month */}
                  <TouchableOpacity
                    style={[styles.confirmTaskRow, { backgroundColor: customHabitColors.card }]}
                    activeOpacity={0.7}
                    onPress={() => setSelectedTaskDaysOption('specific-days-month')}
                  >
                    <Text style={[styles.confirmTaskRowText, { color: customHabitColors.text }]}>Specific days of the month</Text>
                    <View style={styles.confirmTaskRowRight}>
                      <View style={[styles.confirmTaskRowIcon, { backgroundColor: customHabitColors.iconBackground }]}>
                        <Ionicons
                          name={selectedTaskDaysOption === 'specific-days-month' ? 'checkmark' : 'chevron-forward'}
                          size={18}
                          color={customHabitColors.text}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {selectedTaskDaysOption === 'specific-days-month' && (
                    <>
                      {/* Calendar Grid */}
                      <View style={styles.taskDaysMonthGridContainer}>
                        <View style={styles.taskDaysMonthGrid}>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                            const isSelected = selectedMonthDays.has(day);
                            return (
                              <TouchableOpacity
                                key={day}
                                style={[
                                  styles.taskDaysMonthButton,
                                  {
                                    backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
                                    borderColor: customHabitColors.card,
                                    borderWidth: 1,
                                  },
                                ]}
                                activeOpacity={0.7}
                                onPress={() => {
                                  setSelectedMonthDays(prev => {
                                    const next = new Set(prev);
                                    if (next.has(day)) {
                                      next.delete(day);
                                    } else {
                                      next.add(day);
                                    }
                                    return next;
                                  });
                                }}
                              >
                                <Text
                                  style={[
                                    styles.taskDaysMonthButtonText,
                                    {
                                      color: isSelected ? customHabitColors.background : customHabitColors.text,
                                    },
                                  ]}
                                >
                                  {day}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                    </>
                  )}

                  {/* Number of days per week */}
                  <TouchableOpacity
                    style={[styles.confirmTaskRow, { backgroundColor: customHabitColors.card }]}
                    activeOpacity={0.7}
                    onPress={() => setSelectedTaskDaysOption('days-per-week')}
                  >
                    <Text style={[styles.confirmTaskRowText, { color: customHabitColors.text }]}>Number of days per week</Text>
                    <View style={styles.confirmTaskRowRight}>
                      <View style={[styles.confirmTaskRowIcon, { backgroundColor: customHabitColors.iconBackground }]}>
                        <Ionicons
                          name={selectedTaskDaysOption === 'days-per-week' ? 'checkmark' : 'chevron-forward'}
                          size={18}
                          color={customHabitColors.text}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {selectedTaskDaysOption === 'days-per-week' && (
                    <View style={styles.taskDaysWeekSelectorContainer}>
                      <View style={styles.taskDaysWeekSelector}>
                        {Array.from({ length: 7 }, (_, i) => i + 1).map(num => {
                          const isSelected = selectedDaysPerWeek === num;
                          return (
                            <TouchableOpacity
                              key={num}
                              style={[
                                styles.taskDaysWeekButton,
                                {
                                  backgroundColor: isSelected ? '#FFFFFF' : customHabitColors.card,
                                },
                              ]}
                              activeOpacity={0.7}
                              onPress={() => setSelectedDaysPerWeek(num)}
                            >
                              <Text
                                style={[
                                  styles.taskDaysWeekButtonText,
                                  {
                                    color: isSelected ? customHabitColors.background : customHabitColors.text,
                                  },
                                ]}
                              >
                                {num}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Number of days per fortnight */}
                  <TouchableOpacity
                    style={[styles.confirmTaskRow, { backgroundColor: customHabitColors.card }]}
                    activeOpacity={0.7}
                    onPress={() => setSelectedTaskDaysOption('days-per-fortnight')}
                  >
                    <Text style={[styles.confirmTaskRowText, { color: customHabitColors.text }]}>Number of days per fortnight</Text>
                    <View style={styles.confirmTaskRowRight}>
                      <View style={[styles.confirmTaskRowIcon, { backgroundColor: customHabitColors.iconBackground }]}>
                        <Ionicons
                          name={selectedTaskDaysOption === 'days-per-fortnight' ? 'checkmark' : 'chevron-forward'}
                          size={18}
                          color={customHabitColors.text}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {selectedTaskDaysOption === 'days-per-fortnight' && (
                    <View style={styles.taskDaysWeekSelectorContainer}>
                      <View style={styles.taskDaysWeekSelector}>
                        {Array.from({ length: 14 }, (_, i) => i + 1).map(num => {
                          const isSelected = selectedDaysPerFortnight === num;
                          return (
                            <TouchableOpacity
                              key={num}
                              style={[
                                styles.taskDaysWeekButton,
                                {
                                  backgroundColor: isSelected ? '#FFFFFF' : customHabitColors.card,
                                },
                              ]}
                              activeOpacity={0.7}
                              onPress={() => setSelectedDaysPerFortnight(num)}
                            >
                              <Text
                                style={[
                                  styles.taskDaysWeekButtonText,
                                  {
                                    color: isSelected ? customHabitColors.background : customHabitColors.text,
                                  },
                                ]}
                              >
                                {num}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Number of days per month */}
                  <TouchableOpacity
                    style={[styles.confirmTaskRow, { backgroundColor: customHabitColors.card }]}
                    activeOpacity={0.7}
                    onPress={() => setSelectedTaskDaysOption('days-per-month')}
                  >
                    <Text style={[styles.confirmTaskRowText, { color: customHabitColors.text }]}>Number of days per month</Text>
                    <View style={styles.confirmTaskRowRight}>
                      <View style={[styles.confirmTaskRowIcon, { backgroundColor: customHabitColors.iconBackground }]}>
                        <Ionicons
                          name={selectedTaskDaysOption === 'days-per-month' ? 'checkmark' : 'chevron-forward'}
                          size={18}
                          color={customHabitColors.text}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {selectedTaskDaysOption === 'days-per-month' && (
                    <View style={styles.taskDaysMonthGridContainer}>
                      <View style={styles.taskDaysMonthGrid}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                          const isSelected = selectedDaysPerMonth.has(day);
                          return (
                            <TouchableOpacity
                              key={day}
                              style={[
                                styles.taskDaysMonthButton,
                                {
                                  backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
                                  borderColor: customHabitColors.card,
                                  borderWidth: 1,
                                },
                              ]}
                              activeOpacity={0.7}
                              onPress={() => {
                                setSelectedDaysPerMonth(prev => {
                                  const next = new Set(prev);
                                  if (next.has(day)) {
                                    next.delete(day);
                                  } else {
                                    next.add(day);
                                  }
                                  return next;
                                });
                              }}
                            >
                              <Text
                                style={[
                                  styles.taskDaysMonthButtonText,
                                  {
                                    color: isSelected ? customHabitColors.background : customHabitColors.text,
                                  },
                                ]}
                              >
                                {day}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Every X Days */}
                  <TouchableOpacity
                    style={[styles.confirmTaskRow, { backgroundColor: customHabitColors.card }]}
                    activeOpacity={0.7}
                    onPress={() => setSelectedTaskDaysOption('every-x-days')}
                  >
                    <Text style={[styles.confirmTaskRowText, { color: customHabitColors.text }]}>
                      Every {selectedEveryXDays} {selectedEveryXDays === 1 ? 'Day' : 'Days'}
                    </Text>
                    <View style={styles.confirmTaskRowRight}>
                      <View style={[styles.confirmTaskRowIcon, { backgroundColor: customHabitColors.iconBackground }]}>
                        <Ionicons
                          name={selectedTaskDaysOption === 'every-x-days' ? 'checkmark' : 'chevron-forward'}
                          size={18}
                          color={customHabitColors.text}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {selectedTaskDaysOption === 'every-x-days' && (
                    <View style={styles.taskDaysMonthGridContainer}>
                      <View style={styles.taskDaysMonthGrid}>
                        {Array.from({ length: 59 }, (_, i) => i + 2).map(num => {
                          const isSelected = selectedEveryXDays === num;
                          return (
                            <TouchableOpacity
                              key={num}
                              style={[
                                styles.taskDaysMonthButton,
                                {
                                  backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
                                  borderColor: customHabitColors.card,
                                  borderWidth: 1,
                                },
                              ]}
                              activeOpacity={0.7}
                              onPress={() => setSelectedEveryXDays(num)}
                            >
                              <Text
                                style={[
                                  styles.taskDaysMonthButtonText,
                                  {
                                    color: isSelected ? customHabitColors.background : customHabitColors.text,
                                  },
                                ]}
                              >
                                {num}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </ScrollView>
              </View>
            </Animated.View>
          </View>
        </View>
      </Modal>


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
                        <Text style={styles.emojiLarge}>{['','😠','😞','😐','😌','🙂'][Math.round(reflectQuestionnaire.mood)]}</Text>
                        <Text style={styles.sliderText}>
                          {Math.round(reflectQuestionnaire.mood) === 1 ? 'Angry' : 
                           Math.round(reflectQuestionnaire.mood) === 2 ? 'Sad' : 
                           Math.round(reflectQuestionnaire.mood) === 3 ? 'Neutral' : 
                           Math.round(reflectQuestionnaire.mood) === 4 ? 'Calm' : 'Happy'}
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

              {/* Step 2: Motivation */}
              {reflectQuestionnaire.currentStep === 2 && (
                <>
                  <View style={styles.questionSection}>
                    <Text style={styles.questionText}>How motivated do you feel today?</Text>
                    <View style={styles.sliderContainer}>
                      <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={5}
                        value={reflectQuestionnaire.motivation}
                        onValueChange={(value) => setReflectQuestionnaire(prev => ({ ...prev, motivation: value }))}
                        minimumTrackTintColor="#10B981"
                        maximumTrackTintColor="#E5E7EB"
                      />
                      <View style={styles.sliderLabels}>
                        <Text style={styles.emojiLarge}>{['','😫','😒','😐','😤','🔥'][Math.round(reflectQuestionnaire.motivation)]}</Text>
                        <Text style={styles.sliderText}>
                          {Math.round(reflectQuestionnaire.motivation) === 1 ? 'Very unmotivated' : 
                           Math.round(reflectQuestionnaire.motivation) === 2 ? 'Unmotivated' : 
                           Math.round(reflectQuestionnaire.motivation) === 3 ? 'Neutral' : 
                           Math.round(reflectQuestionnaire.motivation) === 4 ? 'Motivated' : 'Highly motivated'}
                        </Text>
                      </View>
                      <Text style={styles.sliderValue}>{Math.round(reflectQuestionnaire.motivation)}/5</Text>
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

              {/* Step 3: Stress */}
              {reflectQuestionnaire.currentStep === 3 && (
                <>
                  <View style={styles.questionSection}>
                    <Text style={styles.questionText}>How stressed do you feel today?</Text>
                    <View style={styles.sliderContainer}>
                      <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={5}
                        value={reflectQuestionnaire.stress}
                        onValueChange={(value) => setReflectQuestionnaire(prev => ({ ...prev, stress: value }))}
                        minimumTrackTintColor="#10B981"
                        maximumTrackTintColor="#E5E7EB"
                      />
                      <View style={styles.sliderLabels}>
                        <Text style={styles.emojiLarge}>{['','😌','🙂','😐','😰','🤯'][Math.round(reflectQuestionnaire.stress)]}</Text>
                        <Text style={styles.sliderText}>
                          {Math.round(reflectQuestionnaire.stress) === 1 ? 'Very low' : 
                           Math.round(reflectQuestionnaire.stress) === 2 ? 'Low' : 
                           Math.round(reflectQuestionnaire.stress) === 3 ? 'Moderate' : 
                           Math.round(reflectQuestionnaire.stress) === 4 ? 'High' : 'Very high'}
                        </Text>
                      </View>
                      <Text style={styles.sliderValue}>{Math.round(reflectQuestionnaire.stress)}/5</Text>
                    </View>
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

              {/* Step 4: What Went Well */}
              {reflectQuestionnaire.currentStep === 4 && (
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

              {/* Step 5: Friction */}
              {reflectQuestionnaire.currentStep === 5 && (
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

              {/* Step 6: One Tweak */}
              {reflectQuestionnaire.currentStep === 6 && (
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
                      onPress={() => setReflectQuestionnaire(prev => ({ ...prev, currentStep: 5 }))}
                    >
                      <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.nextButton}
                      onPress={() => setReflectQuestionnaire(prev => ({ ...prev, currentStep: 7 }))}
                    >
                      <Text style={styles.nextButtonText}>Next</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* Step 7: Review & Submit */}
              {reflectQuestionnaire.currentStep === 7 && (
                <>
                  <View style={styles.questionSection}>
                    <Text style={styles.questionText}>Review Your Reflection</Text>
                    
                    <View style={styles.reviewSection}>
                      <Text style={styles.reviewLabel}>Mood: {['','Angry','Sad','Neutral','Calm','Happy'][Math.round(reflectQuestionnaire.mood)]} ({Math.round(reflectQuestionnaire.mood)}/5)</Text>
                      <Text style={styles.reviewLabel}>Motivation: {['','Very unmotivated','Unmotivated','Neutral','Motivated','Highly motivated'][Math.round(reflectQuestionnaire.motivation)]} ({Math.round(reflectQuestionnaire.motivation)}/5)</Text>
                      <Text style={styles.reviewLabel}>Stress: {['','Very low','Low','Moderate','High','Very high'][Math.round(reflectQuestionnaire.stress)]} ({Math.round(reflectQuestionnaire.stress)}/5)</Text>
                      <Text style={styles.reviewLabel}>What went well: {reflectQuestionnaire.whatWentWell || 'Not specified'}</Text>
                      <Text style={styles.reviewLabel}>Friction: {reflectQuestionnaire.friction || 'Not specified'}</Text>
                      <Text style={styles.reviewLabel}>One tweak: {reflectQuestionnaire.nothingToChange ? 'Nothing to change' : (reflectQuestionnaire.oneTweak || 'Not specified')}</Text>
                    </View>
                  </View>

                  <View style={styles.navigationButtons}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => setReflectQuestionnaire(prev => ({ ...prev, currentStep: 6 }))}
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
                            reflect_motivation: Math.round(reflectQuestionnaire.motivation),
                            reflect_stress: Math.round(reflectQuestionnaire.stress),
                            reflect_what_went_well: reflectQuestionnaire.whatWentWell,
                            reflect_friction: reflectQuestionnaire.friction,
                            reflect_one_tweak: reflectQuestionnaire.oneTweak,
                            reflect_nothing_to_change: reflectQuestionnaire.nothingToChange,
                          };
                          
                          const success = await useActionStore.getState().saveDailyHabits(habitData);
                          if (success) {
                            markHabitCompleted('reflect'); // Sound plays here when animation starts
                            setShowReflectModal(false);
                            setReflectQuestionnaire({ 
                              mood: 3, 
                              motivation: 3, 
                              stress: 3, 
                              whatWentWell: '', 
                              friction: '', 
                              oneTweak: '', 
                              nothingToChange: false, 
                              currentStep: 1 
                            });
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

                      await fetchUserPoints();
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

      {/* Reorder Habits Modal */}
      <Modal
        visible={showReorderHabitsModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowReorderHabitsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowReorderHabitsModal(false)} />
          <View style={styles.reorderModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reorder Habits</Text>
              <TouchableOpacity onPress={() => setShowReorderHabitsModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.reorderTabsContainer}>
              <TouchableOpacity 
                style={[styles.reorderTabButton, reorderTab === 'core' && styles.reorderTabButtonActive]}
                onPress={() => setReorderTab('core')}
              >
                <Text style={[styles.reorderTabButtonText, { color: reorderTab === 'core' ? theme.textPrimary : theme.textSecondary }]}>Core</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.reorderTabButton, reorderTab === 'custom' && styles.reorderTabButtonActive]}
                onPress={() => setReorderTab('custom')}
              >
                <Text style={[styles.reorderTabButtonText, { color: reorderTab === 'custom' ? theme.textPrimary : theme.textSecondary }]}>Custom</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.reorderModalContent}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={true}
            >
              {reorderTab === 'core' ? (
                reorderableHabits.map((habit, index) => (
                  <View
                    key={habit.key}
                    style={[
                      styles.reorderHabitItem,
                      { 
                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.03)', 
                        borderColor: theme.border 
                      },
                    ]}
                  >
                    <View style={styles.reorderHabitItemContent}>
                      <View style={[styles.reorderHabitIcon, { backgroundColor: habit.accent }]}>
                        <Text style={styles.reorderHabitIconText}>
                          {habit.title.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.reorderHabitTitle, { color: theme.textPrimary }]}>
                        {habit.title}
                      </Text>
                    </View>
                    <View style={styles.reorderHabitControls}>
                      <TouchableOpacity
                        onPress={() => moveHabitUp(index)}
                        disabled={index === 0}
                        style={[
                          styles.reorderButton,
                          { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)' },
                          index === 0 && styles.reorderButtonDisabled,
                        ]}
                      >
                        <Ionicons
                          name="chevron-up"
                          size={18}
                          color={index === 0 ? theme.textSecondary : theme.textPrimary}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => moveHabitDown(index)}
                        disabled={index === reorderableHabits.length - 1}
                        style={[
                          styles.reorderButton,
                          { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)' },
                          index === reorderableHabits.length - 1 && styles.reorderButtonDisabled,
                        ]}
                      >
                        <Ionicons
                          name="chevron-down"
                          size={18}
                          color={index === reorderableHabits.length - 1 ? theme.textSecondary : theme.textPrimary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                reorderableCustomHabits.map((habit, index) => {
                  const habitColor = (habit.metadata as any)?.color ?? habit.accent_color ?? HABIT_ACCENTS[habit.category] ?? '#10B981';
                  return (
                    <View
                      key={habit.id}
                      style={[
                        styles.reorderHabitItem,
                        { 
                          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.03)', 
                          borderColor: theme.border 
                        },
                      ]}
                    >
                      <View style={styles.reorderHabitItemContent}>
                        <View style={[styles.reorderHabitIcon, { backgroundColor: habitColor }]}>
                          <Text style={styles.reorderHabitIconText}>
                            {habit.title.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={[styles.reorderHabitTitle, { color: theme.textPrimary }]}>
                          {habit.title}
                        </Text>
                      </View>
                      <View style={styles.reorderHabitControls}>
                        <TouchableOpacity
                          onPress={() => moveCustomHabitUp(index)}
                          disabled={index === 0}
                          style={[
                            styles.reorderButton,
                            { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)' },
                            index === 0 && styles.reorderButtonDisabled,
                          ]}
                        >
                          <Ionicons
                            name="chevron-up"
                            size={18}
                            color={index === 0 ? theme.textSecondary : theme.textPrimary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => moveCustomHabitDown(index)}
                          disabled={index === reorderableCustomHabits.length - 1}
                          style={[
                            styles.reorderButton,
                            { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)' },
                            index === reorderableCustomHabits.length - 1 && styles.reorderButtonDisabled,
                          ]}
                        >
                          <Ionicons
                            name="chevron-down"
                            size={18}
                            color={index === reorderableCustomHabits.length - 1 ? theme.textSecondary : theme.textPrimary}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            <TouchableOpacity
              onPress={handleSaveHabitOrder}
              style={[styles.reorderSaveButton, { backgroundColor: theme.primary }]}
            >
              <Text style={[styles.reorderSaveButtonText, { color: '#FFFFFF' }]}>
                Save Order
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
    marginTop: 12,
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  highlightCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  highlightCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingIndicatorIcon: {
    marginTop: 2,
  },
  highlightCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  highlightCardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  customHabitOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  customHabitContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '98%',
    minHeight: '90%',
    overflow: 'hidden',
    width: '100%',
    alignSelf: 'stretch',
  },
  customHabitPager: {
    flexDirection: 'row',
    flex: 1,
  },
  customHabitPage: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
    flex: 1,
  },
  customHabitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  customHabitCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customHabitSearchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customHabitTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  customHabitCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  customHabitCategoryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customHabitCategoryButtonActive: {},
  customHabitHint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  customHabitInputWrapper: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  customHabitInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  customHabitInput: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  customHabitInputHasArrow: {
    paddingRight: 48,
  },
  customHabitInputField: {
    position: 'relative',
  },
  customHabitInputActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: -6,
    bottom: 4,
  },
  customHabitInputActionButtonDisabled: {
    opacity: 0.4,
  },
  customHabitComingSoonButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  customHabitComingSoonButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  customHabitScroll: {
    marginTop: 12,
  },
  customHabitScrollContent: {
    paddingBottom: 80,
  },
  customHabitCharCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: 4,
  },
  customHabitPresetLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
  },
  customHabitRecommendationsLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
  },
  customHabitRecommendationsList: {
    rowGap: 12,
    marginBottom: 20,
  },
  customHabitRecommendationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  customHabitRecommendationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customHabitRecommendationContent: {
    flex: 1,
  },
  customHabitRecommendationTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  customHabitRecommendationSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  customHabitPresetList: {
    paddingBottom: 80,
  },
  customHabitPresetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginBottom: 10,
  },
  customHabitPresetIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  customHabitPresetText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmTaskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  confirmTaskBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTaskTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  confirmTaskHeaderTitleGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTaskSubtitle: {
    fontSize: 12,
  },
  confirmTaskContent: {
    padding: 16,
    paddingBottom: 20,
  },
  confirmTaskSection: {
    marginBottom: 24,
  },
  confirmTaskSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  confirmTaskTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  confirmTaskTitleInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  confirmTaskCharCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  confirmTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginBottom: 10,
  },
  confirmTaskRowDisabled: {
    opacity: 0.5,
  },
  confirmTaskRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  confirmTaskRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTaskRowIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  confirmTaskRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  confirmTaskRowContent: {
    flex: 1,
  },
  confirmTaskRowText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmTaskRowSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  confirmTaskFrequencyControls: {
    flexDirection: 'row',
    gap: 8,
  },
  confirmTaskFrequencyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmTaskSaveButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  confirmTaskSaveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  taskDaysWeekSelectorContainer: {
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  taskDaysWeekSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
  },
  taskDaysWeekButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskDaysWeekButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  taskDays2DayRuleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  taskDays2DayRuleIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskDaysMonthGridContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  taskDaysMonthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  taskDaysMonthButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskDaysMonthButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
  whiteHabitCard: {
    borderRadius: 20,
    padding: 16,
    minHeight: 120,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  whiteHabitCardDisabled: {
    opacity: 0.5,
  },
  whiteHabitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginHorizontal: -16,
    marginTop: -16,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  whiteHabitCardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  whiteHabitCardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  whiteHabitCardProgress: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 18,
  },
  whiteHabitCardProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  whiteHabitCardMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  whiteHabitCardMetricLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  whiteHabitCardMetricValue: {
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
  headerGreetingBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  headerGreetingText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  levelProgressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  levelProgressDash: {
    position: 'absolute',
    top: 14,
    width: 1,
    height: 8,
    backgroundColor: '#ffffff',
  },
  levelProgressFloatingPoints: {
    position: 'absolute',
    top: 26,
    width: 40,
    alignItems: 'center',
  },
  levelProgressFloatingText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
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
    paddingVertical: 8,
  },
  challengeCard: {
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 180,
    flexDirection: 'column',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  challengeCardBlueSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
    backgroundColor: '#3B82F6',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  challengeCardContent: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  challengeCardTopSection: {
    height: '35%',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  challengeCardBottomSection: {
    height: '65%',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  challengeCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
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
  challengeStatusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    marginBottom: 4,
  },
  challengeStatusText: {
    fontSize: 12,
    fontWeight: '600',
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
    marginTop: 4,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 0,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
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
  reorderModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    minHeight: 500,
    flexDirection: 'column',
  },
  reorderModalContent: {
    flexGrow: 1,
  },
  reorderTabsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'rgba(118, 118, 128, 0.12)',
    borderRadius: 8,
    padding: 2,
  },
  reorderTabButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  reorderTabButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  reorderTabButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#000000',
  },
  reorderHabitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  reorderHabitItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reorderHabitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reorderHabitIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  reorderHabitTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  reorderHabitControls: {
    flexDirection: 'row',
    gap: 8,
  },
  reorderButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
  reorderSaveButton: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  reorderSaveButtonText: {
    fontSize: 16,
    fontWeight: '700',
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
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 8,
  },
  colorPickerContent: {
    padding: 16,
    paddingBottom: 20,
  },
  colorPickerMainContainer: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  colorPickerBoxContainer: {
    flex: 1,
    maxWidth: 260,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  colorPickerBox: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  colorPickerBoxWhiteOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  colorPickerBoxBlackOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  colorPickerIndicator: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  colorPickerHueContainer: {
    width: 40,
    alignItems: 'center',
  },
  colorPickerHueTrack: {
    flex: 1,
    width: 28,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 8,
  },
  colorPickerHueHandle: {
    position: 'absolute',
    left: -6,
    width: 40,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  colorPickerSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  colorPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  colorPickerSwatch: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPickerPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },
  colorPickerPreviewLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
  },
  colorPickerHexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  colorPickerHexLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  colorPickerHexInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 0,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  colorPickerRandomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 999,
  },
  colorPickerRandomText: {
    fontSize: 14,
    fontWeight: '600',
  },
}); 