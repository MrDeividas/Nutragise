import React, { useState, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { useGoalsStore } from '../state/goalsStore';
import { getCategoryIcon, calculateCompletionPercentage } from '../lib/goalHelpers';
import MediaUploadModal from './MediaUploadModal';
import { progressService } from '../lib/progressService';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

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

export default function ActionScreen({ navigation }: any) {
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

  useEffect(() => {
    if (user) {
      fetchGoals(user.id);
      checkTodaysCheckIns();
      checkForOverdueGoals();
    }
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
    }, [user, userGoals.length])
  );

  const fetchGoalProgress = async () => {
    if (!user || userGoals.length === 0) return;

    const progressData: {[goalId: string]: number} = {};
    
    for (const goal of userGoals) {
      if (!goal.completed) {
        const checkInCount = await progressService.getCheckInCount(goal.id, user.id);
        progressData[goal.id] = checkInCount;
      }
    }
    
    setGoalProgress(progressData);
  };

  const checkForOverdueGoals = async () => {
    if (!user || userGoals.length === 0) return;

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
  };

  const checkTodaysCheckIns = async () => {
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
      // Get all check-ins for the week for all goals
      const weekCheckIns = await progressService.getCheckInsForDateRange(user.id, weekStart, weekEnd);
      
      for (const goal of userGoals) {
        if (!goal.completed) {
          // Check today for the main set
          const today = new Date();
          const hasCheckedInToday = await progressService.hasCheckedInToday(goal.id, user.id, today);
          if (hasCheckedInToday) {
            checkedInSet.add(goal.id);
          }

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
  };

  // Re-check when goals are updated or selected week changes
  useEffect(() => {
    if (user && userGoals.length > 0) {
      checkTodaysCheckIns();
    }
  }, [userGoals, selectedWeek]);

  // Fetch goal progress when goals are loaded
  useEffect(() => {
    if (user && userGoals.length > 0) {
      fetchGoalProgress();
    }
  }, [userGoals]);

  // Refresh check-ins when screen comes into focus (useful after deleting check-ins)
  useFocusEffect(
    React.useCallback(() => {
      if (user && userGoals.length > 0) {
        checkTodaysCheckIns();
      }
    }, [user, userGoals])
  );

  // Helper function to get the date for a specific day of the week within the selected week
  const getDateForDayOfWeekInWeek = (dayOfWeek: number, weekDate: Date): Date => {
    const weekStart = new Date(weekDate);
    // Set to Sunday of the selected week
    weekStart.setDate(weekDate.getDate() - weekDate.getDay());
    const targetDate = new Date(weekStart);
    targetDate.setDate(weekStart.getDate() + dayOfWeek);
    return targetDate;
  };

  // Helper function to get the start of the week (Sunday) for a given date
  const getWeekStart = (date: Date): Date => {
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    return weekStart;
  };

  // Helper function to format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Navigation functions for the calendar
  const goToPreviousWeek = () => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(selectedWeek.getDate() - 7);
    setSelectedWeek(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(selectedWeek.getDate() + 7);
    setSelectedWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setSelectedWeek(new Date());
  };

  const handleCheckInPress = (goal: any, dayOfWeek: number) => {
    setSelectedGoal(goal);
    setExpandedDay(dayOfWeek); // Store the day being checked in for
    setShowMediaUpload(true);
  };

  const handleMediaSelected = async (uri: string) => {
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
  };

  const handleSkipMedia = async () => {
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
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: 'transparent' }]} edges={['top', 'left', 'right']}>
      <ScrollView style={[styles.scrollView, { backgroundColor: 'transparent' }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          {/* Daily Tasks Progress Bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <View style={[styles.leftBarContainer, { flex: 0.84, marginHorizontal: 4, alignSelf: 'center' }]}>
              <View style={[styles.leftBarBackground, { backgroundColor: 'transparent' }]}>
                {[...Array(5)].map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.leftBarSegment,
                      { 
                        backgroundColor: i < 3 ? '#EA580C' : 'transparent', 
                        height: 2.59,
                        shadowColor: '#EA580C',
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
                        borderColor: '#EA580C',
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
        </View>

        {/* Combined Check-ins Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Check-ins</Text>
          <View style={[styles.todaysCheckinsContainer, { borderColor: theme.borderSecondary }]}>
            {(() => {
              // Only show check-ins when all data is fully loaded
              if (Object.keys(checkedInGoalsByDay).length === 0 || userGoals.length === 0) {
                return null;
              }
              
              // Only show goals that need check-ins (not completed)
              const allCheckInGoals = userGoals.filter(goal => {
                                 const status = getGoalCheckInStatus(goal, checkedInGoals, checkedInGoalsByDay, overdueGoals);
                 return status === 'overdue' || status === 'due_today';
              });

              if (allCheckInGoals.length > 0) {
                return allCheckInGoals.map(goal => {
                  
                  return (
                    <TouchableOpacity 
                      key={`checkin-${goal.id}`} 
                      style={styles.checkinItem}
                      onPress={() => {
                        const status = getGoalCheckInStatus(goal, checkedInGoals, checkedInGoalsByDay, overdueGoals);
                        if (status === 'overdue') {
                          // For overdue goals, use the pre-calculated oldest missed date
                          const oldestMissedDate = overdueGoalDates[goal.id];
                          
                          if (oldestMissedDate) {
                            // Set the check-in for the oldest missed date
                            setSelectedGoal({...goal, overdueDate: oldestMissedDate});
                            setExpandedDay(oldestMissedDate.getDay());
                          } else {
                            // Fallback to today if no specific overdue date found
                            handleCheckInPress(goal, new Date().getDay());
                          }
                        } else {
                          // For due today goals, use today
                          handleCheckInPress(goal, new Date().getDay());
                        }
                        setShowMediaUpload(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.checkinItemLeft}>
                        <TouchableOpacity 
                          style={styles.circularProgressContainer}
                          onPress={() => {
                            navigation.navigate('GoalDetail', { 
                              goal,
                              onCheckInDeleted: () => {
                                // Refresh progress data when check-in is deleted
                                fetchGoalProgress();
                                checkTodaysCheckIns();
                                checkForOverdueGoals();
                              }
                            });
                          }}
                          activeOpacity={0.7}
                        >
                          <Svg width={40} height={40}>
                            <Defs>
                              <LinearGradient id={`gradient-${goal.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <Stop offset="0%" stopColor="#FF6B35" />
                                <Stop offset="50%" stopColor="#9C27B0" />
                                <Stop offset="100%" stopColor="#E91E63" />
                              </LinearGradient>
                            </Defs>
                            {/* Background circle */}
                            <Circle
                              cx={20}
                              cy={20}
                              r={16}
                              stroke="rgba(128, 128, 128, 0.3)"
                              strokeWidth={3}
                              fill="transparent"
                            />
                            {/* Progress circle */}
                            <Circle
                              cx={20}
                              cy={20}
                              r={16}
                              stroke={`url(#gradient-${goal.id})`}
                              strokeWidth={3}
                              fill="transparent"
                              strokeDasharray={`${2 * Math.PI * 16}`}
                              strokeDashoffset={`${2 * Math.PI * 16 * (1 - (() => {
                                const checkInCount = goalProgress[goal.id] || 0;
                                const mockProgressEntries = Array(checkInCount).fill({}).map((_, index) => ({
                                  id: `mock-${index}`,
                                  goal_id: goal.id,
                                  user_id: user?.id || '',
                                  completed_date: new Date().toISOString(),
                                  created_at: new Date().toISOString(),
                                }));
                                return Math.round(calculateCompletionPercentage(goal, mockProgressEntries));
                              })() / 100)}`}
                              strokeLinecap="round"
                              transform="rotate(-90 20 20)"
                            />
                          </Svg>
                          <View style={styles.circularProgressText}>
                            <Text style={[styles.circularProgressValue, { color: theme.textPrimary }]}>
                              {(() => {
                                const checkInCount = goalProgress[goal.id] || 0;
                                const mockProgressEntries = Array(checkInCount).fill({}).map((_, index) => ({
                                  id: `mock-${index}`,
                                  goal_id: goal.id,
                                  user_id: user?.id || '',
                                  completed_date: new Date().toISOString(),
                                  created_at: new Date().toISOString(),
                                }));
                                return Math.round(calculateCompletionPercentage(goal, mockProgressEntries));
                              })()}
                            </Text>
                          </View>
                        </TouchableOpacity>
                        <View style={styles.checkinItemContent}>
                          <Text style={[styles.checkinItemTitle, { color: theme.textPrimary }]}>{goal.title}</Text>
                          <Text style={[styles.checkinItemCategory, { color: theme.textSecondary }]}>
                            {(() => {
                              const status = getGoalCheckInStatus(goal, checkedInGoals, checkedInGoalsByDay, overdueGoals);
                                                                                            if (status === 'overdue') {
                                 // Use the pre-calculated data
                                 const oldestMissedDate = overdueGoalDates[goal.id];
                                 const overdueCount = overdueGoalCounts[goal.id];
                                 
                                 if (oldestMissedDate && overdueCount) {
                                   const todayDate = new Date();
                                   const diffTime = todayDate.getTime() - oldestMissedDate.getTime();
                                   const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                  
                                   return `${overdueCount} overdue, oldest ${diffDays}d`;
                                }
                                
                                return 'Check-in overdue';
                              } else if (status === 'due_today') {
                                return 'Check-in due today';
                              }
                              return '';
                            })()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.checkinItemRight}>
                        {(() => {
                          const status = getGoalCheckInStatus(goal, checkedInGoals, checkedInGoalsByDay, overdueGoals);
                          if (status === 'overdue') {
                            return (
                              <View style={styles.overdueIndicator}>
                                <Ionicons name="alert" size={20} color="#EF4444" />
                              </View>
                            );
                          } else if (status === 'due_today') {
                            return (
                              <View style={styles.todayIndicator}>
                                <Ionicons name="time-outline" size={20} color="#3B82F6" />
                              </View>
                            );
                          }
                          return null;
                        })()}
                      </View>
                    </TouchableOpacity>
                  );
                });
              }
              
              return (
                <View style={styles.noCheckinsContainer}>
                  <Ionicons name="calendar-outline" size={24} color={theme.textSecondary} />
                  <Text style={[styles.noCheckinsText, { color: theme.textSecondary }]}>No check-ins scheduled for today</Text>
                  <Text style={[styles.noCheckinsSubtext, { color: theme.textTertiary }]}>Create goals and set frequency to see them here</Text>
                </View>
              );
            })()}
          </View>
        </View>

        {/* Quick Actions Section */}
        <View style={styles.section}>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.transparentTestBox}>
              <View style={styles.transparentIconContainer}>
                <Ionicons name="add-circle-outline" size={32} color="#ffffff" />
              </View>
              <Text style={styles.transparentTitle}>Create Goal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.transparentTestBox}>
              <View style={styles.transparentIconContainer}>
                <Ionicons name="checkmark-circle-outline" size={32} color="#ffffff" />
              </View>
              <Text style={styles.transparentTitle}>Check In</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.transparentTestBox}
              onPress={() => navigation.navigate('Meditation')}
            >
              <View style={styles.transparentIconContainer}>
                <Ionicons name="leaf-outline" size={32} color="#ffffff" />
              </View>
              <Text style={styles.transparentTitle}>Meditation</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.transparentTestBox}
              onPress={() => navigation.navigate('Microlearning')}
            >
              <View style={styles.transparentIconContainer}>
                <Ionicons name="book-outline" size={32} color="#ffffff" />
              </View>
              <Text style={styles.transparentTitle}>Micro-{'\n'}learning</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Month Calendar */}
        <View style={styles.section}>
          <MonthCalendar theme={theme} />
        </View>

        

        {/* Recent Activity Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent Activity</Text>
          <View style={styles.activityList}>
            <View style={[styles.activityItem, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}>
              <View style={[styles.activityIcon, { backgroundColor: theme.backgroundTertiary }]}>
                <Ionicons name="checkmark-outline" size={20} color="#ffffff" />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: theme.textPrimary }]}>Completed workout goal</Text>
                <Text style={[styles.activityTime, { color: theme.textTertiary }]}>2 hours ago</Text>
              </View>
            </View>

            <View style={[styles.activityItem, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}>
              <View style={[styles.activityIcon, { backgroundColor: theme.backgroundTertiary }]}>
                <Ionicons name="camera-outline" size={20} color="#ffffff" />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: theme.textPrimary }]}>Added photo to meditation goal</Text>
                <Text style={[styles.activityTime, { color: theme.textTertiary }]}>5 hours ago</Text>
              </View>
            </View>

            <View style={[styles.activityItem, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}>
              <View style={[styles.activityIcon, { backgroundColor: theme.backgroundTertiary }]}>
                <Ionicons name="add-outline" size={20} color="#ffffff" />
              </View>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: theme.textPrimary }]}>Created new reading goal</Text>
                <Text style={[styles.activityTime, { color: theme.textTertiary }]}>1 day ago</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Tips Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Action Tips</Text>
          <View style={styles.tipsContainer}>
            <View style={[styles.tipCard, { backgroundColor: 'rgba(128, 128, 128, 0.15)', borderColor: theme.borderSecondary }]}>
              <Ionicons name="bulb-outline" size={24} color="#ffffff" />
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>Break big goals into smaller, manageable tasks</Text>
            </View>
            <View style={[styles.tipCard, { backgroundColor: 'rgba(128, 128, 128, 0.15)', borderColor: theme.borderSecondary }]}>
              <Ionicons name="time-outline" size={24} color="#ffffff" />
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>Set specific time blocks for your goals</Text>
            </View>
            <View style={[styles.tipCard, { backgroundColor: 'rgba(128, 128, 128, 0.15)', borderColor: theme.borderSecondary }]}>
              <Ionicons name="trophy-outline" size={24} color="#ffffff" />
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>Celebrate small wins to stay motivated</Text>
            </View>
          </View>
        </View>
      </ScrollView>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
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
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
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
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
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
    gap: 12,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
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
    gap: 8,
    position: 'relative', // add this
  },
  todayContainer: {
    backgroundColor: 'rgba(18, 148, 144, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
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
    gap: 12,
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
    gap: 8,
  },
  // New styles for the month calendar
  calendarContainer: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
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
    gap: 80,
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
    marginRight: 12,
  },
  circularProgressText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularProgressValue: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
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

}); 