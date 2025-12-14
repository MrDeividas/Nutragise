import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useBottomNavPadding } from '../components/CustomTabBar';
import CustomBackground from '../components/CustomBackground';
import { useAuthStore } from '../state/authStore';
import { workoutSplitService } from '../lib/workoutSplitService';
import { workoutExerciseLogService } from '../lib/workoutExerciseLogService';
import { supabase } from '../lib/supabase';
// Import EXERCISE_DATA from GoalsScreen (it's exported there)
import { EXERCISE_DATA } from './GoalsScreen';

interface MyExercisesScreenProps {
  navigation: any;
  route?: any;
}

export default function MyExercisesScreen({ navigation }: MyExercisesScreenProps) {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const bottomNavPadding = useBottomNavPadding();
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [activeSplit, setActiveSplit] = useState<any>(null);
  const [nextWorkout, setNextWorkout] = useState<any>(null);
  const [loggedExercises, setLoggedExercises] = useState<Array<{ name: string; maxWeight: number | null; maxReps: number | null }>>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);

  useEffect(() => {
    if (user) {
      loadActiveSplit();
      loadLoggedExercises();
    }
  }, [user]);

  const loadActiveSplit = async () => {
    if (!user) return;
    try {
      const split = await workoutSplitService.getActiveSplit(user.id);
      setActiveSplit(split);
      if (split) {
        const next = await workoutSplitService.getNextWorkout(user.id);
        setNextWorkout(next);
      }
    } catch (error) {
      console.error('Error loading active split:', error);
    }
  };

  const loadLoggedExercises = async () => {
    if (!user) return;
    setLoadingExercises(true);
    try {
      // Get all exercise logs for the user
      const { data: logs, error } = await supabase
        .from('workout_exercise_logs')
        .select('exercise_name')
        .eq('user_id', user.id)
        .not('exercise_name', 'is', null);

      if (error) {
        console.error('Error loading exercise logs:', error);
        return;
      }

      // Get unique exercise names
      const uniqueExercises = Array.from(new Set(logs?.map(log => log.exercise_name) || []));

      // Get max weight and reps for each exercise
      const exercisesWithMax = await Promise.all(
        uniqueExercises.map(async (exerciseName) => {
          const maxData = await workoutExerciseLogService.getHighestWeightAndReps(user.id, exerciseName);
          return {
            name: exerciseName,
            maxWeight: maxData.weight ?? null,
            maxReps: maxData.reps ?? null,
          };
        })
      );

      // Sort by exercise name
      exercisesWithMax.sort((a, b) => a.name.localeCompare(b.name));

      setLoggedExercises(exercisesWithMax);
    } catch (error) {
      console.error('Error loading logged exercises:', error);
    } finally {
      setLoadingExercises(false);
    }
  };

  const handleAddExercise = async (exerciseName: string) => {
    if (!user || !activeSplit || !nextWorkout) return;
    try {
      const updatedDays = [...activeSplit.days];
      const currentDay = updatedDays[nextWorkout.dayIndex];
      const currentExercisesList = currentDay.exercises.map((ex: any) => 
        typeof ex === 'string' ? ex : (typeof ex === 'object' ? (ex as any).name : String(ex))
      );
      currentExercisesList.push(exerciseName);
      updatedDays[nextWorkout.dayIndex] = {
        ...currentDay,
        exercises: currentExercisesList,
      };
      await workoutSplitService.updateSplit(user.id, activeSplit.id, {
        days: updatedDays,
      });
      await loadActiveSplit();
      setShowAddExerciseModal(false);
      setExerciseSearchQuery('');
      setCustomExerciseName('');
    } catch (error: any) {
      console.error('Error adding exercise:', error);
      alert(error.message || 'Failed to add exercise');
    }
  };

  return (
    <CustomBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Exercises</Text>
          <View style={styles.headerRightSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomNavPadding + 24 }}
        >
          <View style={styles.content}>
            {/* Add Exercise Button */}
            <TouchableOpacity
              onPress={() => {
                if (!user || !activeSplit || !nextWorkout) {
                  alert('Please select a workout split first');
                  return;
                }
                setShowAddExerciseModal(true);
                setExerciseSearchQuery('');
                setCustomExerciseName('');
              }}
              style={[styles.addExerciseButton, { 
                backgroundColor: theme.primary,
                borderColor: theme.primary,
              }]}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={[styles.addExerciseButtonText, { color: '#FFFFFF' }]}>Add Exercise</Text>
            </TouchableOpacity>

            {loadingExercises ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>Loading exercises...</Text>
              </View>
            ) : loggedExercises.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="barbell-outline" size={64} color={theme.textTertiary} />
                <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                  No exercises logged yet
                </Text>
              </View>
            ) : (
              <View style={styles.exercisesList}>
                {loggedExercises.map((exercise, index) => (
                  <View key={index} style={[styles.exerciseItem, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
                    <View style={styles.exerciseItemContent}>
                      <Text style={[styles.exerciseItemText, { color: theme.textPrimary }]}>{exercise.name}</Text>
                      <View style={styles.exerciseStats}>
                        {exercise.maxWeight !== null && (
                          <Text style={[styles.exerciseStatText, { color: theme.textSecondary }]}>
                            Max: {exercise.maxWeight}kg
                          </Text>
                        )}
                        {exercise.maxReps !== null && (
                          <Text style={[styles.exerciseStatText, { color: theme.textSecondary }]}>
                            {exercise.maxReps} reps
                          </Text>
                        )}
                        {exercise.maxWeight === null && exercise.maxReps === null && (
                          <Text style={[styles.exerciseStatText, { color: theme.textTertiary }]}>
                            No data
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Add Exercise Modal */}
        <Modal
          visible={showAddExerciseModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => {
            setShowAddExerciseModal(false);
            setExerciseSearchQuery('');
            setCustomExerciseName('');
          }}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setShowAddExerciseModal(false);
                setExerciseSearchQuery('');
                setCustomExerciseName('');
              }} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Add Exercise</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color={theme.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { 
                  color: theme.textPrimary,
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.borderSecondary,
                }]}
                placeholder="Search exercises..."
                placeholderTextColor={theme.textTertiary}
                value={exerciseSearchQuery}
                onChangeText={setExerciseSearchQuery}
              />
            </View>

            {/* Custom Exercise Input */}
            <View style={styles.customExerciseContainer}>
              <Text style={[styles.customExerciseLabel, { color: theme.textSecondary }]}>Or add custom exercise:</Text>
              <TextInput
                style={[styles.customExerciseInput, { 
                  color: theme.textPrimary,
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.borderSecondary,
                }]}
                placeholder="Enter exercise name"
                placeholderTextColor={theme.textTertiary}
                value={customExerciseName}
                onChangeText={setCustomExerciseName}
              />
            </View>

            {/* Exercise List */}
            <ScrollView style={styles.exerciseListContainer} showsVerticalScrollIndicator={false}>
              {(() => {
                // Get all available exercises
                const allExercises: string[] = [];
                Object.values(EXERCISE_DATA).forEach(category => {
                  Object.values(category).forEach(subCategory => {
                    if (Array.isArray(subCategory)) {
                      allExercises.push(...subCategory);
                    }
                  });
                });

                // Filter out exercises already in the workout
                const currentExercises = nextWorkout?.day.exercises.map((ex: any) => 
                  typeof ex === 'string' ? ex : (ex as any).name
                ) || [];
                const availableExercises = allExercises.filter(ex => !currentExercises.includes(ex));

                // Filter by search query
                const filteredExercises = availableExercises.filter(ex => 
                  ex.toLowerCase().includes(exerciseSearchQuery.toLowerCase())
                );

                // Show custom exercise option if there's a custom name
                const hasCustomExercise = customExerciseName.trim().length > 0 && 
                  !currentExercises.includes(customExerciseName.trim()) &&
                  customExerciseName.trim().toLowerCase().includes(exerciseSearchQuery.toLowerCase());

                if (filteredExercises.length === 0 && !hasCustomExercise) {
                  return (
                    <View style={styles.emptyState}>
                      <Ionicons name="barbell-outline" size={48} color={theme.textTertiary} />
                      <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                        {exerciseSearchQuery ? 'No exercises found' : 'No exercises available'}
                      </Text>
                    </View>
                  );
                }

                return (
                  <>
                    {hasCustomExercise && (
                      <TouchableOpacity
                        style={[styles.exerciseModalItem, {
                          backgroundColor: theme.cardBackground,
                          borderColor: theme.borderSecondary,
                        }]}
                        onPress={() => handleAddExercise(customExerciseName.trim())}
                      >
                        <Text style={[styles.exerciseModalItemText, { color: theme.textPrimary }]}>
                          {customExerciseName.trim()} (Custom)
                        </Text>
                        <Ionicons name="add-circle" size={24} color={theme.primary} />
                      </TouchableOpacity>
                    )}
                    {filteredExercises.map((exercise, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.exerciseModalItem, {
                          backgroundColor: theme.cardBackground,
                          borderColor: theme.borderSecondary,
                        }]}
                        onPress={() => handleAddExercise(exercise)}
                      >
                        <Text style={[styles.exerciseModalItemText, { color: theme.textPrimary }]}>
                          {exercise}
                        </Text>
                        <Ionicons name="add-circle" size={24} color={theme.primary} />
                      </TouchableOpacity>
                    ))}
                  </>
                );
              })()}
            </ScrollView>
          </SafeAreaView>
        </Modal>
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
    gap: 16,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  addExerciseButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  exercisesList: {
    gap: 12,
  },
  exerciseItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  exerciseItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseItemText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  exerciseStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 12,
  },
  exerciseStatText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  customExerciseContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  customExerciseLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  customExerciseInput: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  exerciseListContainer: {
    flex: 1,
  },
  exerciseModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 24,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  exerciseModalItemText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
});

