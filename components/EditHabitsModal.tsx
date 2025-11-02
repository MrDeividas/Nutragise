import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useTheme } from '../state/themeStore';
import { useAuthStore } from '../state/authStore';
import { dailyHabitsService } from '../lib/dailyHabitsService';
import { AVAILABLE_HABITS } from './DailyHabitsSummary';

interface EditHabitsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
}

const EditHabitsModal: React.FC<EditHabitsModalProps> = ({
  visible,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [habitSchedules, setHabitSchedules] = useState<Record<string, boolean[]>>({});
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);
  const [tempSchedule, setTempSchedule] = useState<boolean[]>(new Array(7).fill(false));
  const [pendingSchedules, setPendingSchedules] = useState<Record<string, boolean[]>>({});
  const [isLocked, setIsLocked] = useState(false);
  const [lockDaysRemaining, setLockDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (visible && user) {
      checkLockStatus();
      loadUserHabits();
    } else if (!visible) {
      // Clear pending schedules when modal closes
      setPendingSchedules({});
      setExpandedHabit(null);
      setIsLocked(false);
      setLockDaysRemaining(null);
    }
  }, [visible, user]);

  const checkLockStatus = async () => {
    if (!user) return;
    const lockStatus = await dailyHabitsService.areHabitsLocked(user.id);
    setIsLocked(lockStatus.locked);
    setLockDaysRemaining(lockStatus.daysRemaining || null);
  };

  const loadUserHabits = async () => {
    if (!user) return;
    
    setInitialLoading(true);
    try {
      const [habits, schedules] = await Promise.all([
        dailyHabitsService.getSelectedHabits(user.id),
        dailyHabitsService.getHabitSchedules(user.id)
      ]);
      setSelectedHabits(habits);
      setHabitSchedules(schedules);
    } catch (error) {
      console.error('Error loading habits:', error);
      Alert.alert('Error', 'Failed to load habits');
    } finally {
      setInitialLoading(false);
    }
  };

  const toggleHabit = (habitId: string) => {
    setSelectedHabits(prev => {
      if (prev.includes(habitId)) {
        // Deselecting - remove from pending schedules and selected habits
        setPendingSchedules(prevSchedules => {
          const newSchedules = { ...prevSchedules };
          delete newSchedules[habitId];
          return newSchedules;
        });
        return prev.filter(h => h !== habitId);
      } else {
        // Selecting - always add to selected habits first
        const newSelected = [...prev, habitId];
        
        // Check if it's a new habit (no existing schedule)
        const wasPreviouslySelected = habitSchedules[habitId];
        if (!wasPreviouslySelected) {
          // New habit - show inline schedule picker
          setExpandedHabit(habitId);
          // Default to today only
          const today = new Date().getDay();
          const defaultDays = new Array(7).fill(false);
          defaultDays[today] = true;
          setTempSchedule(defaultDays);
        }
        
        return newSelected; // Always add the habit
      }
    });
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Double-check lock status before saving (safety check)
    if (isLocked) {
      const daysText = lockDaysRemaining === 1 ? 'day' : 'days';
      Alert.alert(
        'Habits Locked',
        `Your habits are locked for 6 weeks to help you build consistency. You can edit them again in ${lockDaysRemaining} ${daysText}.`,
        [
          { text: 'OK', style: 'default' },
          { 
            text: 'Premium', 
            style: 'default',
            onPress: () => Alert.alert('Premium', 'Coming soon')
          }
        ]
      );
      return;
    }
    
    if (selectedHabits.length < 6) {
      Alert.alert('Error', 'Please select at least 6 habits');
      return;
    }

    setLoading(true);
    try {
      // Save selected habits
      await dailyHabitsService.updateSelectedHabits(user.id, selectedHabits);
      
      // Save all pending schedules to database
      const schedulePromises = Object.entries(pendingSchedules).map(([habitId, schedule]) =>
        dailyHabitsService.updateHabitSchedule(user.id, habitId, schedule)
      );
      
      await Promise.all(schedulePromises);
      
      // Notify parent to refresh schedules
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving habits:', error);
      Alert.alert('Error', 'Failed to save habits');
    } finally {
      setLoading(false);
    }
  };

  const handleInlineScheduleSave = async (habitId: string) => {
    if (!user) return;

    try {
      // Save schedule locally (not to database yet)
      setPendingSchedules(prev => ({
        ...prev,
        [habitId]: tempSchedule
      }));
      
      // Habit is already in selectedHabits from toggleHabit, so no need to add again
      
      // Close the inline picker
      setExpandedHabit(null);
    } catch (error) {
      console.error('Error saving habit schedule:', error);
      Alert.alert('Error', 'Failed to save habit schedule');
    }
  };

  const handleInlineScheduleCancel = () => {
    const habitId = expandedHabit;
    setExpandedHabit(null);
    
    // Remove the habit from selectedHabits since user cancelled
    if (habitId) {
      setSelectedHabits(prev => prev.filter(h => h !== habitId));
      
      // Clear any pending schedule for this habit
      setPendingSchedules(prevSchedules => {
        const newSchedules = { ...prevSchedules };
        delete newSchedules[habitId];
        return newSchedules;
      });
    }
  };

  const toggleDay = (dayIndex: number) => {
    setTempSchedule(prev => {
      const newSchedule = [...prev];
      newSchedule[dayIndex] = !newSchedule[dayIndex];
      return newSchedule;
    });
  };

  const isSaveDisabled = selectedHabits.length < 6 || loading || isLocked;

  if (initialLoading) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.textPrimary }]}>Loading habits...</Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Edit Habits</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[
              styles.saveButton, 
              { 
                backgroundColor: isSaveDisabled ? theme.borderSecondary : theme.primary,
                opacity: isSaveDisabled ? 0.5 : 1,
              }
            ]}
            disabled={isSaveDisabled}
          >
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.countContainer}>
          <Text style={[styles.countText, { color: theme.textPrimary }]}>
            {selectedHabits.length}/11 selected
          </Text>
          {isLocked && lockDaysRemaining !== null && (
            <View style={styles.lockContainer}>
              <Ionicons name="lock-closed" size={16} color="#FF6B6B" />
              <Text style={[styles.lockText, { color: '#FF6B6B' }]}>
                Habits locked for {lockDaysRemaining} {lockDaysRemaining === 1 ? 'day' : 'days'}
              </Text>
            </View>
          )}
          {!isLocked && selectedHabits.length < 6 && (
            <Text style={[styles.minText, { color: '#FF6B6B' }]}>
              Minimum 6 habits required
            </Text>
          )}
        </View>

        <ScrollView style={styles.content}>
          <Text style={[styles.subtitle, { color: theme.textPrimary }]}>
            Select the habits you want to track daily:
          </Text>

          {AVAILABLE_HABITS.map((habit) => {
            const isSelected = selectedHabits.includes(habit.id);
            const isExpanded = expandedHabit === habit.id;
            const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
            
            return (
              <View key={habit.id}>
                <TouchableOpacity
                  style={[
                    styles.habitItem,
                    {
                      backgroundColor: isSelected
                        ? theme.primary + '20'
                        : theme.cardBackground,
                      borderColor: isSelected ? theme.primary : theme.borderSecondary,
                      borderWidth: isSelected ? 2 : 1,
                      opacity: isLocked ? 0.5 : 1,
                    },
                  ]}
                  onPress={() => {
                    if (isLocked) {
                      const daysText = lockDaysRemaining === 1 ? 'day' : 'days';
                      Alert.alert(
                        'Habits Locked',
                        `Your habits are locked for 6 weeks. You can edit them again in ${lockDaysRemaining} ${daysText}.`,
                        [
                          { text: 'OK', style: 'default' },
                          { 
                            text: 'Premium', 
                            style: 'default',
                            onPress: () => Alert.alert('Premium', 'Coming soon')
                          }
                        ]
                      );
                      return;
                    }
                    toggleHabit(habit.id);
                  }}
                  disabled={isLocked}
                >
                  <View style={styles.habitContent}>
                    <FontAwesome5
                      name={habit.icon.name}
                      size={24}
                      color={isSelected ? theme.primary : theme.textPrimary}
                      solid={habit.icon.solid}
                    />
                    <Text
                      style={[
                        styles.habitName,
                        {
                          color: isSelected ? theme.primary : theme.textPrimary,
                          fontWeight: isSelected ? '600' : '500',
                        },
                      ]}
                    >
                      {habit.name}
                    </Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                  )}
                </TouchableOpacity>

                {/* Inline Schedule Picker */}
                {isExpanded && (
                  <View style={[styles.schedulePicker, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
                    <Text style={[styles.scheduleTitle, { color: theme.textPrimary }]}>
                      Select days for {habit.name}:
                    </Text>
                    
                    <View style={styles.daysRow}>
                      {dayNames.map((dayName, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.dayCheckboxContainer}
                          onPress={() => toggleDay(index)}
                        >
                          <View style={[
                            styles.dayCheckbox,
                            {
                              backgroundColor: tempSchedule[index] ? theme.primary : 'transparent',
                              borderColor: tempSchedule[index] ? theme.primary : '#CCCCCC',
                            }
                          ]}>
                            {tempSchedule[index] && (
                              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                            )}
                          </View>
                          <Text style={[styles.dayLabel, { color: theme.textPrimary }]}>
                            {dayName}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={styles.scheduleActions}>
                      <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: theme.borderSecondary }]}
                        onPress={handleInlineScheduleCancel}
                      >
                        <Text style={[styles.cancelButtonText, { color: theme.textPrimary }]}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.doneButton, { backgroundColor: theme.primary }]}
                        onPress={() => handleInlineScheduleSave(habit.id)}
                      >
                        <Text style={styles.doneButtonText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  countContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
  },
  minText: {
    fontSize: 12,
    marginTop: 2,
  },
  lockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    gap: 4,
  },
  lockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  habitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    marginLeft: 12,
  },
  schedulePicker: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  dayCheckboxContainer: {
    alignItems: 'center',
  },
  dayCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditHabitsModal;
