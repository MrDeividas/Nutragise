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
  { id: 'reflect', name: 'Reflect', icon: '✨', isPremium: true, isCore: false },
  { id: 'meditation', name: 'Meditation', icon: '🧘', isPremium: true, isCore: true },
  { id: 'microlearn', name: 'Microlearning', icon: '📚', isPremium: true, isCore: true },
  { id: 'gym', name: 'Gym', icon: '💪', isPremium: false, isCore: true },
  { id: 'run', name: 'Run', icon: '🏃', isPremium: false, isCore: true },
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
const FIXED_FREQUENCY_HABITS = ['sleep', 'water'];
// Habits that are compulsory and cannot be deselected
const COMPULSORY_HABITS = ['sleep', 'water', 'update_goal', 'reflect'];
// Habits that are auto-selected on mount
const AUTO_SELECTED_HABITS = ['sleep', 'water'];
const ALL_7_DAYS = [true, true, true, true, true, true, true];

export default function HabitSelectionStep({
  selectedHabits,
  habitFrequencies,
  isPremium,
  onChange
}: HabitSelectionStepProps) {
  const { theme } = useTheme();
  const [collapsedHabits, setCollapsedHabits] = useState<Set<string>>(new Set());

  // Auto-select compulsory habits (sleep and water) on mount if they're not already selected
  // Note: update_goal is compulsory but NOT auto-selected - user must select it manually
  useEffect(() => {
    const autoSelectedPresent = AUTO_SELECTED_HABITS.every(id => selectedHabits.includes(id));
    
    if (!autoSelectedPresent) {
      const newSelected = [...new Set([...selectedHabits, ...AUTO_SELECTED_HABITS])];
      const newFrequencies = { ...habitFrequencies };
      
      // Auto-set auto-selected habits to all 7 days
      AUTO_SELECTED_HABITS.forEach(habitId => {
        if (!newFrequencies[habitId]) {
          newFrequencies[habitId] = ALL_7_DAYS;
        }
      });
      
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
      } else if (habitId === 'update_goal') {
        // Update Goal requires at least 1 day, set default to Monday only
        newFrequencies[habitId] = [false, true, false, false, false, false, false]; // S, M, T, W, T, F, S
      } else if (habitId === 'reflect') {
        // Reflect requires at least 2 days, set default to Monday and Wednesday
        newFrequencies[habitId] = [false, true, false, true, false, false, false]; // S, M, T, W, T, F, S
      } else {
        // For non-fixed habits, auto-set default to 3 days (Mon, Wed, Fri)
        // This ensures validation passes immediately
        newFrequencies[habitId] = [false, true, false, true, false, true, false]; // S, M, T, W, T, F, S
      }
      
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

  const toggleHabitWithExpand = (habitId: string) => {
    // If already selected and collapsed, toggle to expand
    if (selectedHabits.includes(habitId) && collapsedHabits.has(habitId) && !FIXED_FREQUENCY_HABITS.includes(habitId)) {
      const newCollapsed = new Set(collapsedHabits);
      newCollapsed.delete(habitId);
      setCollapsedHabits(newCollapsed);
    } else {
      // Normal toggle
      toggleHabit(habitId);
    }
  };

  const collapseSchedule = (habitId: string) => {
    const newCollapsed = new Set(collapsedHabits);
    newCollapsed.add(habitId);
    setCollapsedHabits(newCollapsed);
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
    if (habitId === 'update_goal') {
      return getDayCount(habitId) >= 1; // Update Goal requires at least 1 day
    }
    if (habitId === 'reflect') {
      return getDayCount(habitId) >= 2; // Reflect requires at least 2 days
    }
    return getDayCount(habitId) >= 3; // Other habits require at least 3 days
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        Your new journey begins here
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Select at least 6 habits and customise the schedule
      </Text>

      <View style={styles.habitsContainer}>
        {ALL_HABITS.map((habit) => {
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
                    onPress={() => toggleHabitWithExpand(habit.id)}
                  >
                    <Text style={styles.habitIcon}>{habit.icon}</Text>
                    <Text style={[styles.habitName, { color: isSelected ? '#FFFFFF' : theme.textPrimary }]}>
                      {habit.name}
                    </Text>
                    {habit.isPremium && (
                      <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                        <Text style={styles.badgeText}>
                          {habit.id === 'reflect' ? 'FREE' : 'PRO'}
                        </Text>
                      </View>
                    )}
                    {habit.id === 'reflect' && (
                      <View style={[styles.badge, { backgroundColor: theme.primary, marginLeft: 4 }]}>
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
                    onPress={() => toggleHabitWithExpand(habit.id)}
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
                      disabled={!isValid}
                    >
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={isValid ? '#FFFFFF' : theme.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                  {!isValid && habit.id === 'update_goal' && (
                    <Text style={[styles.warningText, { color: '#FF6B6B' }]}>
                      Please select at least 1 day per week
                    </Text>
                  )}
                  {!isValid && habit.id === 'reflect' && (
                    <Text style={[styles.warningText, { color: '#FF6B6B' }]}>
                      Please select at least 2 days per week
                    </Text>
                  )}
                  {!isValid && habit.id !== 'update_goal' && habit.id !== 'reflect' && (
                    <Text style={[styles.warningText, { color: '#FF6B6B' }]}>
                      Please select at least 3 days per week
                    </Text>
                  )}
                  {isValid && dayCount > 0 && (
                    <Text style={[styles.dayCountText, { color: theme.textSecondary }]}>
                      {dayCount} {dayCount === 1 ? 'day' : 'days'} selected
                    </Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.toggleContainer}>
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
      </View>
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
