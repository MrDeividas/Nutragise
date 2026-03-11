import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../state/themeStore';

interface Habit {
  id: string;
  name: string;
  icon: string;
  isPremium: boolean;
  isCore: boolean;
}

const ALL_HABITS: Habit[] = [
  { id: 'sleep', name: 'Sleep', icon: '😴', isPremium: false, isCore: false },
  { id: 'water', name: 'Water', icon: '💧', isPremium: false, isCore: true },
  { id: 'update_goal', name: 'Update Goal', icon: '📝', isPremium: false, isCore: false },
  { id: 'reflect', name: 'Reflect', icon: '✨', isPremium: false, isCore: false },
  { id: 'meditation', name: 'Meditation', icon: '🧘', isPremium: false, isCore: true },
  { id: 'microlearn', name: 'Microlearning', icon: '📚', isPremium: false, isCore: true },
  { id: 'gym', name: 'Gym', icon: '💪', isPremium: false, isCore: true },
  { id: 'run', name: 'Exercise', icon: '🏃', isPremium: false, isCore: true },
  { id: 'focus', name: 'Focus', icon: '🎯', isPremium: false, isCore: false },
  { id: 'screen_time', name: 'Screen Time Limit', icon: '📱', isPremium: false, isCore: true },
  { id: 'cold_shower', name: 'Cold Shower', icon: '🚿', isPremium: false, isCore: false },
];

interface HabitSelectionStepProps {
  selectedHabits: string[];
  habitFrequencies: Record<string, boolean[]>;
  isPremium: boolean;
  onChange: (data: { selectedHabits: string[]; habitFrequencies: Record<string, boolean[]>; isPremium: boolean }) => void;
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Habits that should auto-set to all 7 days and be non-editable
const FIXED_FREQUENCY_HABITS: string[] = []; // Empty - all habits can have their schedules edited
// Habits that are compulsory and cannot be deselected
const COMPULSORY_HABITS = ['sleep', 'reflect', 'run'];
// Habits that are auto-selected on mount
const AUTO_SELECTED_HABITS = ['sleep', 'reflect', 'run'];
const ALL_7_DAYS = [true, true, true, true, true, true, true];

export default function HabitSelectionStep({
  selectedHabits,
  habitFrequencies,
  isPremium,
  onChange
}: HabitSelectionStepProps) {
  const { theme } = useTheme();
  // Start with all habits collapsed (schedule hidden by default)
  const [collapsedHabits, setCollapsedHabits] = useState<Set<string>>(new Set(ALL_HABITS.map(h => h.id)));
  // Track habits that have chosen "No Schedule" - these won't show buttons
  const [noScheduleHabits, setNoScheduleHabits] = useState<Set<string>>(new Set());

  // Auto-select compulsory habits (sleep, reflect, and exercise) on mount if they're not already selected
  useEffect(() => {
    const autoSelectedPresent = AUTO_SELECTED_HABITS.every(id => selectedHabits.includes(id));
    
    if (!autoSelectedPresent) {
      const newSelected = [...new Set([...selectedHabits, ...AUTO_SELECTED_HABITS])];
      const newFrequencies = { ...habitFrequencies };
      
      // Auto-set auto-selected habits to no days selected (user will select)
      AUTO_SELECTED_HABITS.forEach(habitId => {
        if (!newFrequencies[habitId]) {
          // Start with no days selected - user will select their schedule
          newFrequencies[habitId] = [false, false, false, false, false, false, false];
        }
      });
      
      // Keep schedules collapsed so buttons show first (don't auto-expand)
      // The schedules will stay collapsed, showing the "Set Schedule" and "No Schedule" buttons
      
      onChange({ selectedHabits: newSelected, habitFrequencies: newFrequencies, isPremium });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const toggleHabit = (habitId: string) => {
    // Prevent deselecting compulsory habits
    if (COMPULSORY_HABITS.includes(habitId) && selectedHabits.includes(habitId)) {
      return; // Cannot deselect compulsory habits
    }
    
    if (selectedHabits.includes(habitId)) {
      // If already selected, deselect it (unless it's compulsory)
      deselectHabit(habitId);
    } else {
      // Select - add to selected
      const newSelected = [...selectedHabits, habitId];
      const newFrequencies = { ...habitFrequencies };
      
      // Auto-switch to premium if selecting premium habit
      const habit = ALL_HABITS.find(h => h.id === habitId);
      const newIsPremium = isPremium || (habit?.isPremium ?? false);
      
      // For fixed frequency habits, auto-set to all 7 days
      if (FIXED_FREQUENCY_HABITS.includes(habitId)) {
        newFrequencies[habitId] = ALL_7_DAYS;
      } else {
        // For all other habits, start with no days selected
        newFrequencies[habitId] = [false, false, false, false, false, false, false];
      }
      
      // Keep schedule collapsed so buttons show first (don't auto-expand)
      // The schedule will stay collapsed, showing the "Set Schedule" and "No Schedule" buttons
      
      onChange({ selectedHabits: newSelected, habitFrequencies: newFrequencies, isPremium: newIsPremium });
    }
  };

  const deselectHabit = (habitId: string) => {
    // Prevent deselecting compulsory habits
    if (COMPULSORY_HABITS.includes(habitId)) {
      return;
    }
    
    // Deselect - remove from selected and remove frequency
    const newSelected = selectedHabits.filter(id => id !== habitId);
    const newFrequencies = { ...habitFrequencies };
    delete newFrequencies[habitId];
    
    // Auto-switch premium if needed
    const newIsPremium = newSelected.some(id => {
      const habit = ALL_HABITS.find(h => h.id === id);
      return habit?.isPremium;
    });
    
    onChange({ selectedHabits: newSelected, habitFrequencies: newFrequencies, isPremium: newIsPremium });
  };

  const toggleDay = (habitId: string, dayIndex: number) => {
    // Prevent editing fixed frequency habits
    if (FIXED_FREQUENCY_HABITS.includes(habitId)) {
      return;
    }
    
    // Get current frequency or create default
    const currentFreq = habitFrequencies[habitId] || [false, false, false, false, false, false, false];
    const newFreq = [...currentFreq];
    newFreq[dayIndex] = !newFreq[dayIndex];
    
    // Update immediately - no need for save button
    const newFrequencies = { ...habitFrequencies, [habitId]: newFreq };
    onChange({ selectedHabits, habitFrequencies: newFrequencies, isPremium });
    
    // Expand the schedule when editing (uncollapse)
    const newCollapsed = new Set(collapsedHabits);
    newCollapsed.delete(habitId);
    setCollapsedHabits(newCollapsed);
  };

  const handleHabitClick = (habitId: string) => {
    // If not selected, toggle to select it
    if (!selectedHabits.includes(habitId)) {
      toggleHabit(habitId);
    } else if (noScheduleHabits.has(habitId) && !FIXED_FREQUENCY_HABITS.includes(habitId)) {
      // If already selected and in noScheduleHabits, show buttons again to allow editing
      const newNoSchedule = new Set(noScheduleHabits);
      newNoSchedule.delete(habitId);
      setNoScheduleHabits(newNoSchedule);
    }
    // If already selected and not in noScheduleHabits, do nothing (buttons will handle schedule)
  };

  const handleTickClick = (habitId: string) => {
    // Prevent deselecting compulsory habits
    if (COMPULSORY_HABITS.includes(habitId) && selectedHabits.includes(habitId)) {
      return; // Cannot deselect compulsory habits
    }
    
    // Toggle selection
    if (selectedHabits.includes(habitId)) {
      deselectHabit(habitId);
      // Remove from noScheduleHabits if it was there
      const newNoSchedule = new Set(noScheduleHabits);
      newNoSchedule.delete(habitId);
      setNoScheduleHabits(newNoSchedule);
    } else {
      toggleHabit(habitId);
    }
  };

  const handleSetSchedule = (habitId: string) => {
    // Remove from "no schedule" set so buttons can show again if needed
    const newNoSchedule = new Set(noScheduleHabits);
    newNoSchedule.delete(habitId);
    setNoScheduleHabits(newNoSchedule);
    // Open the schedule
    const newCollapsed = new Set(collapsedHabits);
    newCollapsed.delete(habitId);
    setCollapsedHabits(newCollapsed);
  };

  const handleNoSchedule = (habitId: string) => {
    // Batch all state updates together to prevent jitter
    // First, update local state (visual changes)
    const newNoSchedule = new Set(noScheduleHabits);
    newNoSchedule.add(habitId);
    setNoScheduleHabits(newNoSchedule);
    
    // Collapse the schedule
    const newCollapsed = new Set(collapsedHabits);
    newCollapsed.add(habitId);
    setCollapsedHabits(newCollapsed);
    
    // Then update data (triggers parent re-render)
    const newFrequencies = { ...habitFrequencies };
    newFrequencies[habitId] = [false, false, false, false, false, false, false];
    onChange({ selectedHabits, habitFrequencies: newFrequencies, isPremium });
  };

  const collapseSchedule = (habitId: string) => {
    const newCollapsed = new Set(collapsedHabits);
    newCollapsed.add(habitId);
    setCollapsedHabits(newCollapsed);
    // Hide the buttons after confirming schedule
    const newNoSchedule = new Set(noScheduleHabits);
    newNoSchedule.add(habitId);
    setNoScheduleHabits(newNoSchedule);
  };

  const togglePremium = () => {
    const newIsPremium = !isPremium;
    let newSelected = [...selectedHabits];
    let newFrequencies = { ...habitFrequencies };

    if (!newIsPremium) {
      // Switching to free: remove premium habits, add focus & update_goal
      newSelected = newSelected.filter(id => {
        const habit = ALL_HABITS.find(h => h.id === id);
        return !habit?.isPremium || habit.id === 'reflect'; // Keep reflect (free for now)
      });
      
      // Add focus and update_goal if not present
      if (!newSelected.includes('focus')) {
        newSelected.push('focus');
      }
      if (!newSelected.includes('update_goal')) {
        newSelected.push('update_goal');
      }
    }

    onChange({ selectedHabits: newSelected, habitFrequencies: newFrequencies, isPremium: newIsPremium });
  };

  const hasFrequency = (habitId: string) => {
    return habitFrequencies[habitId] && habitFrequencies[habitId].some(day => day);
  };

  const getDayCount = (habitId: string) => {
    const freq = habitFrequencies[habitId];
    return freq ? freq.filter(day => day).length : 0;
  };

  const isValidFrequency = (habitId: string) => {
    if (FIXED_FREQUENCY_HABITS.includes(habitId)) {
      return true; // Fixed habits are always valid (7 days)
    }
    // Check if at least one day is selected (for the tick icon to turn green)
    const dayCount = getDayCount(habitId);
    return dayCount > 0;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        Your new journey begins here
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Select at least 3 core habits and customise the schedule
      </Text>

      <View style={styles.habitsContainer}>
        {ALL_HABITS
          .sort((a, b) => {
            // Put compulsory habits first
            const aIsCompulsory = COMPULSORY_HABITS.includes(a.id);
            const bIsCompulsory = COMPULSORY_HABITS.includes(b.id);
            if (aIsCompulsory && !bIsCompulsory) return -1;
            if (!aIsCompulsory && bIsCompulsory) return 1;
            // Keep original order for non-compulsory habits
            return 0;
          })
          .map((habit) => {
          const isSelected = selectedHabits.includes(habit.id);
          const isFixed = FIXED_FREQUENCY_HABITS.includes(habit.id);
          const isCompulsory = COMPULSORY_HABITS.includes(habit.id);
          const isCollapsed = collapsedHabits.has(habit.id);
          const shouldExpand = isSelected && !isFixed && !isCollapsed;
          const currentFrequency = habitFrequencies[habit.id] || [false, false, false, false, false, false, false];
          const dayCount = getDayCount(habit.id);
          const isValid = isValidFrequency(habit.id);

          return (
            <View key={habit.id}>
              <View
                style={[
                  styles.habitCard,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : 'rgba(128, 128, 128, 0.1)',
                  }
                ]}
              >
                <View style={styles.habitHeader}>
                  <TouchableOpacity 
                    style={styles.habitInfo}
                    onPress={() => handleHabitClick(habit.id)}
                  >
                    <Text style={styles.habitIcon}>{habit.icon}</Text>
                    <Text style={[styles.habitName, { color: isSelected ? '#FFFFFF' : theme.textPrimary }]}>
                      {habit.name}
                    </Text>
                    {habit.isPremium && habit.id !== 'reflect' && (
                      <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                        <Text style={styles.badgeText}>PRO</Text>
                      </View>
                    )}
                    {isCompulsory && (
                      <View style={[styles.badge, { backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : '#FF6B6B' }]}>
                        <Text style={[styles.badgeText, { color: isSelected ? '#FFFFFF' : '#FFFFFF' }]}>
                          Compulsory
                        </Text>
                      </View>
                    )}
                    {isSelected && isFixed && (
                      <View style={[styles.fixedBadge, { backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : theme.primary }]}>
                        <Text style={[styles.fixedBadgeText, { color: isSelected ? '#FFFFFF' : theme.textPrimary }]}>
                          7 days/week
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => handleTickClick(habit.id)}
                    disabled={isCompulsory && isSelected}
                    style={{ opacity: isCompulsory && isSelected ? 0.5 : 1 }}
                  >
                    <Ionicons
                      name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                      size={24}
                      color={isSelected ? '#FFFFFF' : theme.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Schedule buttons - show when habit is selected and schedule is collapsed, but not if user chose "No Schedule" */}
              {isSelected && !shouldExpand && !isFixed && !noScheduleHabits.has(habit.id) && (
                <View style={[styles.scheduleButtonsContainer, { backgroundColor: 'rgba(128, 128, 128, 0.05)', borderColor: theme.borderSecondary }]}>
                  <TouchableOpacity
                    style={[styles.scheduleButton, { backgroundColor: '#4B5563' }]}
                    onPress={() => handleSetSchedule(habit.id)}
                  >
                    <Text style={[styles.scheduleButtonText, { color: '#FFFFFF' }]}>
                      Set Schedule
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.scheduleButton, { backgroundColor: '#4B5563' }]}
                    onPress={() => handleNoSchedule(habit.id)}
                  >
                    <Text style={[styles.scheduleButtonText, { color: '#FFFFFF' }]}>
                      No Schedule
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Inline schedule selector - only for non-fixed habits that are selected and not collapsed */}
              {shouldExpand && (
                <View style={[styles.inlineSchedule, { backgroundColor: 'rgba(128, 128, 128, 0.05)', borderColor: theme.borderSecondary }]}>
                  <View style={styles.daysRow}>
                    {DAYS.map((day, index) => {
                      const daySelected = currentFrequency[index];
                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.dayButton,
                            {
                              backgroundColor: daySelected
                                ? theme.primary
                                : 'transparent',
                              borderColor: daySelected
                                ? theme.primary
                                : theme.borderSecondary,
                            }
                          ]}
                          onPress={() => toggleDay(habit.id, index)}
                        >
                          <Text style={[
                            styles.dayText,
                            { color: daySelected ? '#fff' : theme.textSecondary }
                          ]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    {/* Done button - circle with checkmark */}
                    <TouchableOpacity
                      style={[
                        styles.doneButtonCircle,
                        {
                          backgroundColor: isValid ? theme.primary : 'rgba(128, 128, 128, 0.3)',
                          borderColor: isValid ? theme.primary : theme.borderSecondary,
                        }
                      ]}
                      onPress={() => collapseSchedule(habit.id)}
                    >
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={isValid ? '#FFFFFF' : theme.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* Premium toggle removed - all habits are free now */}
      {/* <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            {
              backgroundColor: isPremium ? theme.primary : 'rgba(128, 128, 128, 0.2)',
              borderColor: theme.primary,
            }
          ]}
          onPress={togglePremium}
        >
          <Text style={[styles.toggleText, { color: isPremium ? '#fff' : theme.textPrimary }]}>
            {isPremium ? '✨ Premium' : 'Free Version'}
          </Text>
        </TouchableOpacity>
      </View> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  habitsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  habitCard: {
    borderRadius: 12,
    padding: 16,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  inlineSchedule: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    justifyContent: 'center',
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  doneButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  fixedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  fixedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dayCountText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  scheduleButtonsContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    flexDirection: 'row',
    gap: 12,
  },
  scheduleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  toggleContainer: {
    marginTop: 16,
    marginBottom: 40,
  },
  toggleButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 18,
    fontWeight: '700',
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
});
