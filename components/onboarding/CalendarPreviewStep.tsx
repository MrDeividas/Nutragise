import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../state/themeStore';

interface CalendarPreviewStepProps {
  selectedHabits: string[];
}

export default function CalendarPreviewStep({ selectedHabits }: CalendarPreviewStepProps) {
  const { theme } = useTheme();
  const startDate = new Date();
  const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        Your Next 90 Days 📅
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Starting {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
      </Text>

      <View style={[styles.weekCard, { backgroundColor: 'rgba(128, 128, 128, 0.1)', borderColor: theme.borderSecondary }]}>
        <Text style={[styles.weekTitle, { color: theme.textPrimary }]}>Week 1 Tasks</Text>
        <Text style={[styles.weekDescription, { color: theme.textSecondary }]}>
          You'll be working on {selectedHabits.length} habits daily:
        </Text>
        <View style={styles.habitsList}>
          {selectedHabits.slice(0, 6).map((habit, index) => (
            <Text key={index} style={[styles.habitItem, { color: theme.textPrimary }]}>
              • {habit.charAt(0).toUpperCase() + habit.slice(1).replace('_', ' ')}
            </Text>
          ))}
        </View>
      </View>

      <View style={[styles.infoCard, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
        <Text style={[styles.infoText, { color: theme.textPrimary }]}>
          💡 Consistency is key! Focus on building these habits day by day.
        </Text>
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
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  weekCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  weekTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  weekDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  habitsList: {
    gap: 8,
  },
  habitItem: {
    fontSize: 16,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
});

