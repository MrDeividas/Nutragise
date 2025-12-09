import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../state/authStore';

interface DateNavigatorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onViewHistory: () => void;
  onHabitPress: (habitType: string, habitsData: any) => void;
  onShowProgress?: () => void;
  dailyHabitsData: any; // This will always be today's data from global state
}

export default function DateNavigator({ selectedDate, onDateChange, onViewHistory, onHabitPress, onShowProgress, dailyHabitsData }: DateNavigatorProps) {
  const { theme, isDark } = useTheme();
  const { user } = useAuthStore();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickDay, setPickDay] = useState<number>(new Date(selectedDate).getDate());
  const [pickMonth, setPickMonth] = useState<number>(new Date(selectedDate).getMonth() + 1); // 1-12
  const [pickYear, setPickYear] = useState<number>(new Date(selectedDate).getFullYear());
  
  // Local state for selected date's habits data (separate from global dailyHabits)
  const [selectedDateHabits, setSelectedDateHabits] = useState<any>(null);
  const [pointsData, setPointsData] = useState<any>(null);
  const [loadingSelectedDate, setLoadingSelectedDate] = useState(false);
  const lastLoadedDateRef = useRef<string | null>(null);
  const lastLoadedDataRef = useRef<any>(null);

  // Function to load habits data for selected date
  const loadSelectedDateHabits = useCallback(async (date: string) => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch points data for meditation/microlearn/screen_time
    const { data: points } = await supabase
      .from('user_points_daily')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .single();
    
    setPointsData(points);
    
    if (date === today) {
      // If it's today, use the global data - always update when dailyHabitsData changes
      setSelectedDateHabits(dailyHabitsData);
      lastLoadedDateRef.current = date;
      lastLoadedDataRef.current = dailyHabitsData;
      return;
    }
    
    // Don't reload if we already have data for this date
    if (lastLoadedDateRef.current === date && lastLoadedDataRef.current && lastLoadedDataRef.current.date === date) {
      setSelectedDateHabits(lastLoadedDataRef.current);
      return;
    }
    
    // Add a small delay to prevent loading state from flashing for quick loads
    const loadingTimeout = setTimeout(() => setLoadingSelectedDate(true), 100);
    
    try {
      // Import the service here to avoid circular dependencies
      const { dailyHabitsService } = await import('../lib/dailyHabitsService');
      const { useAuthStore } = await import('../state/authStore');
      const { user } = useAuthStore.getState();
      
      if (user) {
        const habits = await dailyHabitsService.getDailyHabits(user.id, date);
        setSelectedDateHabits(habits);
        lastLoadedDateRef.current = date;
        lastLoadedDataRef.current = habits;
      }
    } catch (error) {
      console.error('Error loading selected date habits:', error);
      setSelectedDateHabits(null);
      lastLoadedDateRef.current = null;
      lastLoadedDataRef.current = null;
    } finally {
      clearTimeout(loadingTimeout);
      setLoadingSelectedDate(false);
    }
  }, [dailyHabitsData]);

  useEffect(() => {
    const d = new Date(selectedDate);
    setPickDay(d.getDate());
    setPickMonth(d.getMonth() + 1);
    setPickYear(d.getFullYear());
    
    // Load habits data for the selected date
    loadSelectedDateHabits(selectedDate);
  }, [selectedDate, loadSelectedDateHabits]);

  const monthNames = useMemo(() => (
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  ), []);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    const start = current - 20;
    const list: number[] = [];
    for (let y = current; y >= start; y--) list.push(y);
    return list;
  }, []);

  const daysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
  const days = useMemo(() => {
    const dim = daysInMonth(pickYear, pickMonth);
    return Array.from({ length: dim }, (_, i) => i + 1);
  }, [pickYear, pickMonth]);

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const goToPreviousDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    onDateChange(currentDate.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    const today = new Date();
    
    // Don't allow going to future dates
    if (currentDate <= today) {
      onDateChange(currentDate.toISOString().split('T')[0]);
    }
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const onConfirmPick = () => {
    // Clamp day if user had a higher day than the month supports
    const clampedDay = Math.min(pickDay, daysInMonth(pickYear, pickMonth));
    const newDate = new Date(pickYear, pickMonth - 1, clampedDay);
    const today = new Date();
    if (newDate > today) {
      // Do not allow future dates
      setPickerVisible(false);
      return;
    }
    onDateChange(newDate.toISOString().split('T')[0]);
    setPickerVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.dateNavigation}>
        <TouchableOpacity
          style={[styles.navButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]}
          onPress={goToPreviousDay}
        >
          <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.dateDisplay, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]}
          onPress={() => setPickerVisible(true)}
        >
          <Text style={[styles.dateText, { color: theme.textPrimary }]}>
            {formatDisplayDate(selectedDate)}
          </Text>
          <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton, 
            { 
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6',
              opacity: isToday(selectedDate) ? 0.5 : 1
            }
          ]}
          onPress={goToNextDay}
          disabled={isToday(selectedDate)}
        >
          <Ionicons name="chevron-forward" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

            {/* Scheduled Habits Summary */}
      <View style={styles.summarySection}>
        <Text style={[styles.summaryTitle, { color: theme.textPrimary }]}>
          Today's Scheduled Habits Summary - {formatDisplayDate(selectedDate)}
        </Text>
        
        {/* Always render the habits list structure to prevent jitter */}
        <View style={styles.habitsList}>
          {[
            { type: 'sleep', label: 'Sleep', icon: 'moon', hasData: !!selectedDateHabits?.sleep_hours },
            { type: 'water', label: 'Water', icon: 'water', hasData: !!selectedDateHabits?.water_intake },
            { type: 'run', label: 'Run', icon: 'walk', hasData: !!selectedDateHabits?.run_day_type },
            { type: 'gym', label: 'Gym', icon: 'barbell', hasData: !!selectedDateHabits?.gym_day_type },
            { type: 'reflect', label: 'Reflect', icon: 'sparkles', hasData: !!selectedDateHabits?.reflect_mood },
            { type: 'cold_shower', label: 'Cold Shower', icon: 'snow', hasData: !!selectedDateHabits?.cold_shower_completed },
            { type: 'focus', label: 'Focus', icon: 'flash', hasData: !!(selectedDateHabits?.focus_completed || selectedDateHabits?.focus_duration) },
            { type: 'meditation', label: 'Meditation', icon: 'leaf', hasData: !!pointsData?.meditation_completed },
            { type: 'microlearn', label: 'Microlearn', icon: 'book', hasData: !!pointsData?.microlearn_completed },
            { type: 'screen_time', label: 'Screen Time', icon: 'phone-portrait', hasData: !!pointsData?.screen_time_completed }
          ].map((habit) => (
            <TouchableOpacity
              key={habit.type}
              style={[
                styles.habitRow,
                loadingSelectedDate && styles.habitRowLoading,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6' }
              ]}
              onPress={() => !loadingSelectedDate && onHabitPress(habit.type, selectedDateHabits)}
              activeOpacity={loadingSelectedDate ? 1 : 0.7}
              disabled={loadingSelectedDate}
            >
              <View style={[
                styles.habitIcon, 
                { 
                  backgroundColor: habit.hasData 
                    ? 'rgba(16,185,129,0.15)' 
                    : theme.cardBackground,
                  opacity: loadingSelectedDate ? 0.5 : 1
                }
              ]}>
                <Ionicons 
                  name={habit.icon as any} 
                  size={16} 
                  color={habit.hasData ? '#10B981' : theme.textSecondary} 
                />
              </View>
              <Text style={[
                styles.habitLabel, 
                { 
                  color: theme.textPrimary,
                  opacity: loadingSelectedDate ? 0.5 : 1
                }
              ]}>
                {habit.label}
              </Text>
              <Text style={[
                styles.habitStatus, 
                { 
                  color: habit.hasData ? '#10B981' : theme.textSecondary,
                  opacity: loadingSelectedDate ? 0.5 : 1
                }
              ]}>
                {loadingSelectedDate 
                  ? 'Loading...' 
                  : (habit.hasData ? 'Recorded' : 'Not recorded')
                }
              </Text>
              <Ionicons 
                name="chevron-forward" 
                size={16} 
                color={theme.textSecondary} 
                style={[styles.chevron, { opacity: loadingSelectedDate ? 0.3 : 1 }]} 
              />
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Show empty state only when not loading and no data */}
        {!loadingSelectedDate && !selectedDateHabits && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={24} color={theme.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No data for this date yet</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Tap any habit to view details</Text>
          </View>
        )}
      </View>



      {/* Scrollable Day/Month/Year Picker */}
      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}> 
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Select Date</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerRow}>
              {/* Day column */}
              <ScrollView style={styles.pickerColumn} showsVerticalScrollIndicator={false}>
                {days.map((d) => (
                  <TouchableOpacity
                    key={`d-${d}`}
                    style={[styles.pickerItem, d === pickDay && styles.pickerItemSelected]}
                    onPress={() => setPickDay(d)}
                  >
                    <Text style={[styles.pickerItemText, d === pickDay && styles.pickerItemTextSelected]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Month column */}
              <ScrollView style={styles.pickerColumn} showsVerticalScrollIndicator={false}>
                {monthNames.map((m, idx) => (
                  <TouchableOpacity
                    key={`m-${idx + 1}`}
                    style={[styles.pickerItem, (idx + 1) === pickMonth && styles.pickerItemSelected]}
                    onPress={() => setPickMonth(idx + 1)}
                  >
                    <Text style={[styles.pickerItemText, (idx + 1) === pickMonth && styles.pickerItemTextSelected]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Year column */}
              <ScrollView style={styles.pickerColumn} showsVerticalScrollIndicator={false}>
                {years.map((y) => (
                  <TouchableOpacity
                    key={`y-${y}`}
                    style={[styles.pickerItem, y === pickYear && styles.pickerItemSelected]}
                    onPress={() => setPickYear(y)}
                  >
                    <Text style={[styles.pickerItemText, y === pickYear && styles.pickerItemTextSelected]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f5f5f5' }]} onPress={() => setPickerVisible(false)}>
                <Text style={[styles.actionText, { color: '#666' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10B981' }]} onPress={onConfirmPick}>
                <Text style={[styles.actionText, { color: '#fff' }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDisplay: {
    flex: 1,
    marginHorizontal: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  pickerColumn: {
    flex: 1,
    maxHeight: 240,
  },
  pickerItem: {
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#666',
  },
  pickerItemTextSelected: {
    color: '#10B981',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  summarySection: {
    marginTop: 8,
    paddingTop: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  habitsList: {
    gap: 8,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  habitRowLoading: {
    opacity: 0.7,
  },
  habitIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  habitLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  habitStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 8,
  },
  chevron: {
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.8,
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.6,
  },

  loadingState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.7,
  },
}); 