import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal } from '../types/database';

interface GoalItemProps {
  goal: Goal;
  theme: any;
  navigation: any;
  onToggle: (id: string) => void;
  onDelete: (goal: Goal) => void;
  styles: any;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getDaysUntilTarget = (endDate: string) => {
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

const GoalItem = React.memo(({ goal, theme, navigation, onToggle, onDelete, styles }: GoalItemProps) => {
  const daysUntilTarget = goal.end_date ? getDaysUntilTarget(goal.end_date) : null;
  
  return (
    <View style={styles.goalCard}>
      <TouchableOpacity
        onPress={() => {
          navigation.navigate('GoalDetail', { goal });
        }}
        activeOpacity={0.85}
      >
        <View>
          <View style={styles.goalHeader}>
            <View style={styles.goalTitleContainer}>
              <Text style={[styles.goalTitle, { color: theme.textPrimary }, goal.completed && styles.completedGoalTitle]}>
                {goal.title}
              </Text>
              {goal.category && (
                <Text style={[styles.goalCategory, { color: theme.primary }]}>
                  {goal.category}
                </Text>
              )}
            </View>
            <View style={styles.goalActions}>
              <TouchableOpacity
                onPress={() => onToggle(goal.id)}
                style={[styles.checkboxContainer, goal.completed && styles.checkboxCompleted]}
              >
                {goal.completed && (
                  <Ionicons name="checkmark-outline" size={16} color="#ffffff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDelete(goal)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {goal.description && (
            <Text style={[styles.goalDescription, { color: theme.textSecondary }]}>
              {goal.description}
            </Text>
          )}

          <View style={styles.goalDateContainer}>
            <Text style={styles.goalDate}>
              Started: {goal.start_date ? formatDate(goal.start_date) : 'Not set'}
            </Text>
            {goal.end_date && (
              <Text style={[
                styles.goalDate,
                styles.goalTargetDate,
                daysUntilTarget !== null && daysUntilTarget < 0 && styles.overdue,
                daysUntilTarget !== null && daysUntilTarget <= 7 && daysUntilTarget >= 0 && styles.dueSoon
              ]}>
                {daysUntilTarget !== null && daysUntilTarget < 0 
                  ? `${Math.abs(daysUntilTarget)} days overdue`
                  : daysUntilTarget !== null && daysUntilTarget === 0
                  ? 'Due today'
                  : daysUntilTarget !== null && daysUntilTarget === 1
                  ? '1 day left'
                  : daysUntilTarget !== null
                  ? `${daysUntilTarget} days left`
                  : 'No target date'
                }
              </Text>
            )}
          </View>

          {goal.completed && (
            <View style={styles.completedIndicator}>
              <Text style={styles.completedText}>
                ✅ Completed
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
});

export default GoalItem;

