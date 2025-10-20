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
  { id: 'meditation', name: 'Meditation', icon: '🧘', isPremium: true, isCore: true },
  { id: 'microlearn', name: 'Microlearning', icon: '📚', isPremium: true, isCore: true },
  { id: 'gym', name: 'Gym', icon: '💪', isPremium: false, isCore: true },
  { id: 'run', name: 'Run', icon: '🏃', isPremium: false, isCore: true },
  { id: 'screen_time', name: 'Screen Time Limit', icon: '📱', isPremium: false, isCore: true },
  { id: 'water', name: 'Water', icon: '💧', isPremium: false, isCore: true },
  { id: 'focus', name: 'Focus', icon: '🎯', isPremium: false, isCore: false },
  { id: 'update_goal', name: 'Update Goal', icon: '📝', isPremium: false, isCore: false },
  { id: 'reflect', name: 'Reflect', icon: '✨', isPremium: true, isCore: false },
  { id: 'cold_shower', name: 'Cold Shower', icon: '🚿', isPremium: false, isCore: false },
  { id: 'sleep', name: 'Sleep', icon: '😴', isPremium: false, isCore: false },
];

interface HabitSelectionStepProps {
  selectedHabits: string[];
  habitFrequencies: Record<string, boolean[]>;
  isPremium: boolean;
  onChange: (data: { selectedHabits: string[]; habitFrequencies: Record<string, boolean[]>; isPremium: boolean }) => void;
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function HabitSelectionStep({
  selectedHabits,
  habitFrequencies,
  isPremium,
  onChange
}: HabitSelectionStepProps) {
  const { theme } = useTheme();
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);
  const [tempFrequency, setTempFrequency] = useState<boolean[]>([]);

  // Initialize with NO habits preselected, just show recommended tags
  useEffect(() => {
    if (selectedHabits.length === 0) {
      // Don't preselect any habits, just show recommended tags
      onChange({ selectedHabits: [], habitFrequencies: {}, isPremium: false });
    }
  }, []);

  const toggleHabit = (habitId: string) => {
    if (selectedHabits.includes(habitId)) {
      // If already selected, open frequency picker
      openFrequencyPicker(habitId);
    } else {
      // Select - add to selected and immediately open frequency picker
      const newSelected = [...selectedHabits, habitId];
      
      // Auto-switch to premium if selecting premium habit
      const habit = ALL_HABITS.find(h => h.id === habitId);
      const newIsPremium = isPremium || habit?.isPremium;
      
      onChange({ selectedHabits: newSelected, habitFrequencies, isPremium: newIsPremium });
      
      // Immediately open frequency picker for the new habit
      openFrequencyPicker(habitId);
    }
  };

  const deselectHabit = (habitId: string) => {
    console.log('🗑️ Deselecting habit:', habitId);
    // Deselect - remove from selected and remove frequency
    const newSelected = selectedHabits.filter(id => id !== habitId);
    const newFrequencies = { ...habitFrequencies };
    delete newFrequencies[habitId];
    setExpandedHabit(null);
    
    // Auto-switch premium if needed
    const newIsPremium = newSelected.some(id => {
      const habit = ALL_HABITS.find(h => h.id === id);
      return habit?.isPremium;
    });
    
    console.log('📊 New selected habits:', newSelected);
    onChange({ selectedHabits: newSelected, habitFrequencies: newFrequencies, isPremium: newIsPremium });
  };

  const openFrequencyPicker = (habitId: string) => {
    setExpandedHabit(habitId);
    // Load existing frequency or default to empty
    setTempFrequency(habitFrequencies[habitId] || [false, false, false, false, false, false, false]);
  };

  const toggleDay = (dayIndex: number) => {
    const newFreq = [...tempFrequency];
    newFreq[dayIndex] = !newFreq[dayIndex];
    setTempFrequency(newFreq);
  };

  const saveFrequency = () => {
    if (expandedHabit && tempFrequency.some(day => day)) {
      const newFrequencies = { ...habitFrequencies, [expandedHabit]: tempFrequency };
      onChange({ selectedHabits, habitFrequencies: newFrequencies, isPremium });
      setExpandedHabit(null);
      setTempFrequency([]);
    }
  };

  const cancelFrequency = () => {
    setExpandedHabit(null);
    setTempFrequency([]);
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

  const needsFrequency = (habitId: string) => {
    return selectedHabits.includes(habitId) && !hasFrequency(habitId);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        Great! We're here to help you! 🎉
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Select habits and set their weekly schedule
      </Text>

      <View style={styles.habitsContainer}>
        {ALL_HABITS.map((habit) => {
          const isSelected = selectedHabits.includes(habit.id);
          const isExpanded = expandedHabit === habit.id;
          const needsFreq = needsFrequency(habit.id);

          return (
            <View key={habit.id}>
              <View
                style={[
                  styles.habitCard,
                  {
                    backgroundColor: isSelected
                      ? theme.primary // Use theme primary color for consistency
                      : 'rgba(128, 128, 128, 0.1)',
                    // Remove border completely
                  }
                ]}
              >
                <View style={styles.habitHeader}>
                  <TouchableOpacity 
                    style={styles.habitInfo}
                    onPress={() => toggleHabit(habit.id)}
                  >
                    <Text style={styles.habitIcon}>{habit.icon}</Text>
                    <Text style={[styles.habitName, { color: isSelected ? '#FFFFFF' : theme.textPrimary }]}>
                      {habit.name}
                    </Text>
                    {habit.isCore && !isSelected && (
                      <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                        <Text style={styles.badgeText}>Recommended</Text>
                      </View>
                    )}
                    {habit.isPremium && (
                      <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                        <Text style={styles.badgeText}>
                          {habit.id === 'reflect' ? 'FREE' : 'PRO'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <View style={styles.habitActions}>
                    {needsFreq && (
                      <TouchableOpacity
                        onPress={() => openFrequencyPicker(habit.id)}
                        style={styles.warningButton}
                      >
                        <Ionicons name="warning" size={20} color="#FF6B6B" />
                      </TouchableOpacity>
                    )}
                    {isSelected && hasFrequency(habit.id) && (
                      <TouchableOpacity
                        onPress={() => openFrequencyPicker(habit.id)}
                        style={styles.editButton}
                      >
                        <Ionicons name="create-outline" size={20} color={theme.textSecondary} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => deselectHabit(habit.id)}>
                      <Ionicons
                        name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                        size={24}
                        color={isSelected ? '#FFFFFF' : theme.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {isExpanded && (
                <View style={[styles.frequencyPicker, { backgroundColor: 'rgba(128, 128, 128, 0.1)', borderColor: theme.borderSecondary }]}>
                  <Text style={[styles.frequencyLabel, { color: theme.textPrimary }]}>
                    Select days for {habit.name}:
                  </Text>
                  <View style={styles.daysRow}>
                    {DAYS.map((day, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dayButton,
                          {
                            backgroundColor: tempFrequency[index]
                              ? theme.primary
                              : 'transparent',
                            borderColor: tempFrequency[index]
                              ? theme.primary
                              : theme.borderSecondary,
                          }
                        ]}
                        onPress={() => toggleDay(index)}
                      >
                        <Text style={[
                          styles.dayText,
                          { color: tempFrequency[index] ? '#fff' : theme.textSecondary }
                        ]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.pickerActions}>
                    <TouchableOpacity
                      style={[styles.cancelButton, { borderColor: theme.borderSecondary }]}
                      onPress={cancelFrequency}
                    >
                      <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.doneButton,
                        {
                          backgroundColor: tempFrequency.some(d => d) ? theme.primary : 'rgba(128, 128, 128, 0.3)',
                        }
                      ]}
                      onPress={saveFrequency}
                      disabled={!tempFrequency.some(d => d)}
                    >
                      <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                  </View>
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
  habitActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  warningButton: {
    padding: 4,
  },
  editButton: {
    padding: 4,
  },
  frequencyPicker: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
  },
  frequencyLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pickerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
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
});
