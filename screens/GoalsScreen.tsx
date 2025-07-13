import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGoalsStore } from '../state/goalsStore';
import { useAuthStore } from '../state/authStore';
import { Goal } from '../types/database';

interface GoalsScreenProps {
  navigation: any;
}

export default function GoalsScreen({ navigation }: GoalsScreenProps) {
  const { user } = useAuthStore();
  const { goals, loading, error, fetchGoals, toggleGoalCompletion, deleteGoal } = useGoalsStore();

  useEffect(() => {
    if (user) {
      fetchGoals(user.id);
    }
  }, [user]);

  const handleRefresh = () => {
    if (user) {
      fetchGoals(user.id);
    }
  };

  const handleToggleCompletion = async (goalId: string) => {
    await toggleGoalCompletion(goalId);
  };

  const handleDeleteGoal = (goal: Goal) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteGoal(goal.id)
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getDaysUntilTarget = (endDate: string) => {
    const target = new Date(endDate);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderGoalItem = ({ item: goal }: { item: Goal }) => {
    const daysUntilTarget = goal.end_date ? getDaysUntilTarget(goal.end_date) : null;
    
    return (
      <View style={styles.weeklyTrackerCard}>
        <View style={styles.goalHeader}>
          <View style={styles.goalTitleContainer}>
            <Text style={[styles.goalTitle, goal.completed && styles.completedGoalTitle]}>
              {goal.title}
            </Text>
            {goal.category && (
              <Text style={styles.goalCategory}>
                {goal.category}
              </Text>
            )}
          </View>
          <View style={styles.goalActions}>
            <TouchableOpacity
              onPress={() => handleToggleCompletion(goal.id)}
              style={[styles.checkboxContainer, goal.completed && styles.checkboxCompleted]}
            >
              {goal.completed && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteGoal(goal)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {goal.description && (
          <Text style={styles.goalDescription}>
            {goal.description}
          </Text>
        )}

        <View style={styles.goalDateContainer}>
          <Text style={styles.goalDate}>
            Started: {formatDate(goal.start_date)}
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
    );
  };

  const activeGoals = goals.filter(goal => !goal.completed);
  const completedGoals = goals.filter(goal => goal.completed);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Goals</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('NewGoal')}
            style={styles.newGoalButton}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.newGoalButtonText}>New Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.keepTrackSection}>
          <Text style={styles.keepTrackTitle}>Progress</Text>
          <View style={styles.weeklyTrackerCard}>
            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{activeGoals.length}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, styles.completedStatNumber]}>{completedGoals.length}</Text>
                <Text style={[styles.statLabel, styles.completedStatLabel]}>Completed</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNumber, styles.totalStatNumber]}>{goals.length}</Text>
                <Text style={[styles.statLabel, styles.totalStatLabel]}>Total</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.keepTrackSection}>
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </View>
        )}

        {/* Goals List */}
        <View style={styles.keepTrackSection}>
          <Text style={styles.keepTrackTitle}>Goals</Text>
          {goals.length === 0 ? (
            <View style={styles.weeklyTrackerCard}>
              <View style={styles.emptyState}>
                <Ionicons name="trophy-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyStateTitle}>
                  No Goals Yet
                </Text>
                <Text style={styles.emptyStateSubtitle}>
                  Start your journey by creating your first goal
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('NewGoal')}
                  style={styles.createFirstGoalButton}
                >
                  <Text style={styles.createFirstGoalButtonText}>Create Your First Goal</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <FlatList
              data={[...activeGoals, ...completedGoals]}
              keyExtractor={(item) => item.id}
              renderItem={renderGoalItem}
              scrollEnabled={false}
              refreshControl={
                <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
              }
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  newGoalButton: {
    backgroundColor: '#129490',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  newGoalButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
  },
  keepTrackSection: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  keepTrackTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  weeklyTrackerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#129490',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#129490',
    fontWeight: '500',
  },
  completedStatNumber: {
    color: '#10b981',
  },
  completedStatLabel: {
    color: '#10b981',
  },
  totalStatNumber: {
    color: '#6b7280',
  },
  totalStatLabel: {
    color: '#6b7280',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  goalTitleContainer: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  completedGoalTitle: {
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  goalCategory: {
    fontSize: 14,
    fontWeight: '500',
    color: '#129490',
  },
  goalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  deleteButton: {
    padding: 4,
  },
  goalDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  goalDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalDate: {
    fontSize: 14,
    color: '#9ca3af',
  },
  goalTargetDate: {
    fontWeight: '500',
    color: '#6b7280',
  },
  overdue: {
    color: '#ef4444',
  },
  dueSoon: {
    color: '#f59e0b',
  },
  completedIndicator: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  completedText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 16,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  createFirstGoalButton: {
    backgroundColor: '#129490',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstGoalButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
}); 