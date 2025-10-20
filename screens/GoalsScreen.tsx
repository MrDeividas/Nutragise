import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGoalsStore } from '../state/goalsStore';
import { useAuthStore } from '../state/authStore';
import { Goal } from '../types/database';
import { useTheme } from '../state/themeStore';
import NewGoalModal from '../components/NewGoalModal';
import CreatePostModal from '../components/CreatePostModal';
import CustomBackground from '../components/CustomBackground';

interface GoalsScreenProps {
  navigation: any;
}

export default function GoalsScreen({ navigation }: GoalsScreenProps) {
  const { user } = useAuthStore();
  const { goals, loading, error, fetchGoals, toggleGoalCompletion, deleteGoal } = useGoalsStore();
  const { theme } = useTheme();
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [newlyCreatedGoalId, setNewlyCreatedGoalId] = useState<string | null>(null);

  // Only fetch on first load, not on every focus
  useEffect(() => {
    if (user && goals.length === 0) {
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

  const renderGoalItem = React.useCallback((goal: Goal) => {
    const daysUntilTarget = goal.end_date ? getDaysUntilTarget(goal.end_date) : null;
    
    return (
      <View key={goal.id} style={[styles.goalCard, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}>
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
                onPress={() => handleToggleCompletion(goal.id)}
                style={[styles.checkboxContainer, goal.completed && styles.checkboxCompleted]}
              >
                {goal.completed && (
                  <Ionicons name="checkmark-outline" size={16} color="#ffffff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteGoal(goal)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={18} color="#ffffff" />
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
  }, [theme]);

  const activeGoals = React.useMemo(() => goals.filter(goal => !goal.completed), [goals]);
  const completedGoals = React.useMemo(() => goals.filter(goal => goal.completed), [goals]);


  return (
    <CustomBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
          }
        >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Goals</Text>
          <TouchableOpacity
            onPress={() => setShowNewGoalModal(true)}
            style={[styles.newGoalButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
          >
            <Ionicons name="add-outline" size={20} color="#ffffff" />
            <Text style={styles.newGoalButtonText}>New Goal</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Section */}
        <View style={styles.keepTrackSection}>
          <Text style={[styles.keepTrackTitle, { color: theme.textPrimary }]}>Progress</Text>
          <View style={[styles.weeklyTrackerCard, { backgroundColor: 'rgba(128, 128, 128, 0.15)' }]}>
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
                <Ionicons name="locate-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyStateTitle}>
                  No Goals Yet
                </Text>
                <Text style={styles.emptyStateSubtitle}>
                  Start your journey by creating your first goal
                </Text>
                <TouchableOpacity
                  onPress={() => setShowNewGoalModal(true)}
                  style={styles.createFirstGoalButton}
                >
                  <Text style={styles.createFirstGoalButtonText}>Create Your First Goal</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              {[...activeGoals, ...completedGoals].map(renderGoalItem)}
            </View>
          )}
        </View>
        </ScrollView>
      </SafeAreaView>
      
      {/* New Goal Modal */}
      <NewGoalModal
        visible={showNewGoalModal}
        onClose={() => setShowNewGoalModal(false)}
        onGoalCreated={(goalId) => {
          setNewlyCreatedGoalId(goalId);
          setShowNewGoalModal(false);
          // Open CreatePostModal with the new goal pre-selected
          setShowCreatePostModal(true);
          // Refresh goals after creation
          if (user) {
            fetchGoals(user.id);
          }
        }}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        visible={showCreatePostModal}
        onClose={() => {
          setShowCreatePostModal(false);
          setNewlyCreatedGoalId(null); // Clear the pre-selected goal
        }}
        onPostCreated={() => {
          setShowCreatePostModal(false);
          setNewlyCreatedGoalId(null); // Clear the pre-selected goal
          // Refresh goals after creation
          if (user) {
            fetchGoals(user.id);
          }
        }}
        userGoals={goals.filter(goal => !goal.completed)}
        preSelectedGoal={newlyCreatedGoalId || undefined}
      />
    </CustomBackground>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  newGoalButton: {
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
    paddingVertical: 4,
    backgroundColor: 'transparent',
  },
  keepTrackTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  weeklyTrackerCard: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 8,
  },
  goalCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 8,
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
    paddingVertical: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  completedStatNumber: {
    color: '#ffffff',
  },
  completedStatLabel: {
    color: '#ffffff',
  },
  totalStatNumber: {
    color: '#ffffff',
  },
  totalStatLabel: {
    color: '#ffffff',
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