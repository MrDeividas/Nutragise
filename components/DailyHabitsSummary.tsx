import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { DailyHabits } from '../types/database';

interface Props {
  data: DailyHabits | null;
  onHabitPress: (habitType: string) => void;
}

const rows: Array<{ key: keyof DailyHabits | 'gym_training_types' | 'cold_shower_completed'; label: string; habitType: string; isCompleted: (d: DailyHabits) => boolean; icon: any }>= [
  { key: 'sleep_hours', label: 'Sleep', habitType: 'sleep', isCompleted: d => d.sleep_hours != null, icon: 'moon' },
  { key: 'water_intake', label: 'Water', habitType: 'water', isCompleted: d => d.water_intake != null, icon: 'water' },
  { key: 'run_day_type', label: 'Run', habitType: 'run', isCompleted: d => d.run_day_type != null, icon: 'walk' },
  { key: 'gym_day_type', label: 'Gym', habitType: 'gym', isCompleted: d => d.gym_day_type != null, icon: 'barbell' },
  { key: 'reflect_mood', label: 'Reflect', habitType: 'reflect', isCompleted: d => d.reflect_mood != null, icon: 'sparkles' },
  { key: 'cold_shower_completed', label: 'Cold Shower', habitType: 'cold_shower', isCompleted: d => d.cold_shower_completed === true, icon: 'snow' },
];

export default function DailyHabitsSummary({ data, onHabitPress }: Props) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { borderColor: theme.borderSecondary, backgroundColor: theme.cardBackground }]}> 
      <Text style={[styles.title, { color: theme.textPrimary }]}>Daily Habits Summary</Text>
      {rows.map((row) => {
        const completed = data ? row.isCompleted(data) : false;
        return (
          <TouchableOpacity 
            key={row.label} 
            style={styles.itemRow}
            onPress={() => onHabitPress(row.habitType)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, { backgroundColor: completed ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)' }]}>
              <Ionicons name={row.icon as any} size={16} color={completed ? '#10B981' : theme.textSecondary} />
            </View>
            <Text style={[styles.itemLabel, { color: theme.textPrimary }]}>{row.label}</Text>
            <Text style={[styles.itemStatus, { color: completed ? '#10B981' : theme.textSecondary }]}>
              {completed ? 'Completed' : 'Not recorded'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} style={styles.chevron} />
          </TouchableOpacity>
        );
      })}
      {!data && (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={24} color={theme.textSecondary} />
          <Text style={[styles.emptyHint, { color: theme.textSecondary }]}>No data for this date yet</Text>
          <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Tap any habit to start recording</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  itemStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptySubtext: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
  chevron: {
    marginLeft: 8,
  }
}); 