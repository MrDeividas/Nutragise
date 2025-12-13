import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useBottomNavPadding } from '../components/CustomTabBar';
import CustomBackground from '../components/CustomBackground';
import { workoutSplitService } from '../lib/workoutSplitService';
import { workoutExerciseLogService } from '../lib/workoutExerciseLogService';
import { useAuthStore } from '../state/authStore';
import { WorkoutCompletion, WorkoutSplit } from '../types/database';
import { supabase } from '../lib/supabase';

interface WorkoutHistoryScreenProps {
  navigation: any;
}

interface CompletionWithDetails extends WorkoutCompletion {
  split?: WorkoutSplit;
  exerciseLogs?: any[];
}

export default function WorkoutHistoryScreen({ navigation }: WorkoutHistoryScreenProps) {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const bottomNavPadding = useBottomNavPadding();
  const [completions, setCompletions] = useState<CompletionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCompletions, setExpandedCompletions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const allCompletions = await workoutSplitService.getAllCompletions(user.id);
      
      // Fetch split details and exercise logs for each completion
      const completionsWithDetails = await Promise.all(
        allCompletions.map(async (completion) => {
          // Get split details
          const { data: split } = await supabase
            .from<WorkoutSplit>('user_workout_splits')
            .select('*')
            .eq('id', completion.split_id)
            .single();

          // Get exercise logs
          const exerciseLogs = await workoutExerciseLogService.getExerciseLogsForCompletion(completion.id);

          return {
            ...completion,
            split: split || undefined,
            exerciseLogs,
          };
        })
      );

      setCompletions(completionsWithDetails);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const toggleExpanded = (completionId: string) => {
    const newExpanded = new Set(expandedCompletions);
    if (newExpanded.has(completionId)) {
      newExpanded.delete(completionId);
    } else {
      newExpanded.add(completionId);
    }
    setExpandedCompletions(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Group completions by date
  const groupedCompletions = completions.reduce((acc, completion) => {
    const date = completion.completed_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(completion);
    return acc;
  }, {} as Record<string, CompletionWithDetails[]>);

  const sortedDates = Object.keys(groupedCompletions).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <CustomBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Workout History</Text>
          <View style={styles.headerRightSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomNavPadding + 24 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {loading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>Loading...</Text>
            </View>
          ) : sortedDates.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={64} color="#d1d5db" />
              <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                No workout history yet
              </Text>
            </View>
          ) : (
            <View style={styles.content}>
              {sortedDates.map((date) => (
                <View key={date} style={styles.dateGroup}>
                  <Text style={[styles.dateHeader, { color: theme.textPrimary }]}>
                    {formatDate(date)}
                  </Text>
                  {groupedCompletions[date].map((completion) => (
                    <TouchableOpacity
                      key={completion.id}
                      onPress={() => toggleExpanded(completion.id)}
                      style={[styles.completionCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}
                      activeOpacity={0.7}
                    >
                      <View style={styles.completionCardHeader}>
                        <View style={styles.completionCardInfo}>
                          <Text style={[styles.completionCardTitle, { color: theme.textPrimary }]}>
                            {completion.split?.split_name || 'Unknown Split'}
                          </Text>
                          {completion.split && completion.split.days[completion.day_index] && (
                            <Text style={[styles.completionCardDay, { color: theme.textSecondary }]}>
                              {completion.split.days[completion.day_index].day}
                              {completion.split.days[completion.day_index].focus && 
                                ` - ${completion.split.days[completion.day_index].focus}`
                              }
                            </Text>
                          )}
                        </View>
                        <Ionicons
                          name={expandedCompletions.has(completion.id) ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={theme.textSecondary}
                        />
                      </View>

                      {expandedCompletions.has(completion.id) && (
                        <View style={styles.exerciseDetails}>
                          {completion.exerciseLogs && completion.exerciseLogs.length > 0 ? (
                            completion.exerciseLogs.map((log, index) => (
                              <View key={index} style={[styles.exerciseLogItem, { borderColor: '#E5E7EB' }]}>
                                <Text style={[styles.exerciseLogName, { color: theme.textPrimary }]}>
                                  {log.exercise_name}
                                </Text>
                                <View style={styles.exerciseLogDetails}>
                                  {log.weight !== null && log.weight !== undefined && (
                                    <Text style={[styles.exerciseLogDetail, { color: theme.textSecondary }]}>
                                      Weight: {log.weight} kg
                                    </Text>
                                  )}
                                  {log.sets !== null && log.sets !== undefined && (
                                    <Text style={[styles.exerciseLogDetail, { color: theme.textSecondary }]}>
                                      Sets: {log.sets}
                                    </Text>
                                  )}
                                  {log.reps !== null && log.reps !== undefined && (
                                    <Text style={[styles.exerciseLogDetail, { color: theme.textSecondary }]}>
                                      Reps: {log.reps}
                                    </Text>
                                  )}
                                  {log.goal_weight !== null && log.goal_weight !== undefined && (
                                    <Text style={[styles.exerciseLogDetail, { color: theme.textSecondary }]}>
                                      Goal: {log.goal_weight} kg
                                    </Text>
                                  )}
                                </View>
                              </View>
                            ))
                          ) : (
                            <Text style={[styles.noExerciseLogs, { color: theme.textSecondary }]}>
                              No exercise details recorded
                            </Text>
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerRightSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 24,
  },
  dateGroup: {
    gap: 12,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  completionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 12,
  },
  completionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completionCardInfo: {
    flex: 1,
  },
  completionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  completionCardDay: {
    fontSize: 14,
    fontWeight: '500',
  },
  exerciseDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  exerciseLogItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  exerciseLogName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  exerciseLogDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  exerciseLogDetail: {
    fontSize: 13,
  },
  noExerciseLogs: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
  },
});

