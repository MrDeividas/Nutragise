import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGoalsStore } from '../state/goalsStore';
import { useAuthStore } from '../state/authStore';
import { Goal } from '../types/database';
import GoalItem from '../components/GoalItem';
import { useTheme } from '../state/themeStore';
import { useBottomNavPadding } from '../components/CustomTabBar';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import NewGoalModal from '../components/NewGoalModal';
import CreatePostModal from '../components/CreatePostModal';
import CustomBackground from '../components/CustomBackground';
import { workoutService } from '../lib/workoutService';
import { workoutSplitService } from '../lib/workoutSplitService';
import { workoutExerciseLogService } from '../lib/workoutExerciseLogService';
import { supabase } from '../lib/supabase';
import { getExerciseSetsReps } from '../lib/workoutSplitsData';
import { Animated } from 'react-native';
import { WorkoutSplit, WorkoutSplitDay, CreateWorkoutExerciseLogData } from '../types/database';

interface GoalsScreenProps {
  navigation?: any;
}

export const EXERCISE_DATA = {
  "Chest": {
    "Compound": [
      "Bench Press (Barbell)",
      "Dumbbell Bench Press",
      "Incline Bench Press",
      "Decline Bench Press",
      "Chest Press Machine",
      "Push-Ups",
      "Weighted Push-Ups",
      "Dips (Chest-Leaning)"
    ],
    "Isolation": [
      "Dumbbell Flyes",
      "Cable Flyes",
      "Incline Cable Flyes",
      "Pec Deck Machine",
      "Low-to-High Cable Fly",
      "High-to-Low Cable Fly",
      "Squeeze Press (DB)"
    ]
  },
  "Shoulders": {
    "Compound": [
      "Overhead Press (Barbell)",
      "Dumbbell Shoulder Press",
      "Arnold Press",
      "Machine Shoulder Press",
      "Push Press",
      "Handstand Push-Ups"
    ],
    "Isolation": [
      "Lateral Raises (DB)",
      "Cable Lateral Raises",
      "Machine Lateral Raises",
      "Front Raises (DB/Plate/Cable)",
      "Rear Delt Flyes (DB)",
      "Reverse Pec Deck",
      "Face Pulls",
      "Cable Rear Delt Pulls",
      "Upright Row (DB/Barbell/Cable)"
    ]
  },
  "Back": {
    "Compound": [
      "Deadlift (Barbell)",
      "Sumo Deadlift",
      "Romanian Deadlift",
      "Lat Pulldown",
      "Pull-Ups",
      "Chin-Ups",
      "Bent-Over Row (Barbell)",
      "Dumbbell Row",
      "T-Bar Row",
      "Seated Row Machine",
      "Cable Row",
      "Meadows Row",
      "Inverted Row"
    ],
    "Isolation": [
      "Straight-Arm Pulldown",
      "Cable Pullover",
      "Hyperextensions / Back Extensions",
      "Reverse Hyperextensions"
    ]
  },
  "Arms": {
    "Biceps": [
      "Barbell Curl",
      "Dumbbell Curl",
      "Hammer Curl",
      "Preacher Curl",
      "Concentration Curl",
      "Cable Curl",
      "Machine Curl",
      "Incline Dumbbell Curl",
      "EZ-Bar Curl"
    ],
    "Triceps": [
      "Tricep Pushdown (Rope/Bar)",
      "Overhead Tricep Extension (DB or Cable)",
      "Skull Crushers (EZ-bar)",
      "Close-Grip Bench Press",
      "Dips (Triceps-Focused)",
      "Tricep Kickback",
      "Machine Tricep Extension"
    ],
    "Forearms": [
      "Wrist Curls",
      "Reverse Wrist Curls",
      "Farmer's Carry",
      "Reverse Curls"
    ]
  },
  "Legs": {
    "Quads": [
      "Squats (Barbell Back Squat)",
      "Front Squats",
      "Goblet Squat",
      "Leg Press",
      "Lunges (All Variations)",
      "Split Squat",
      "Bulgarian Split Squat",
      "Step-Ups",
      "Sissy Squats",
      "Leg Extensions"
    ],
    "Hamstrings": [
      "Romanian Deadlift",
      "Stiff-Leg Deadlift",
      "Good Mornings",
      "Hamstring Curl (Seated or Lying)",
      "Nordic Curl"
    ],
    "Glutes": [
      "Hip Thrusts",
      "Glute Bridge",
      "Banded Glute Work",
      "Cable Kickbacks",
      "Smith Machine Glute Exercises"
    ],
    "Calves": [
      "Standing Calf Raise",
      "Seated Calf Raise",
      "Leg Press Calf Push"
    ]
  }
};

export default function GoalsScreen({ navigation: navigationProp }: GoalsScreenProps) {
  const nav = useNavigation<any>();
  const navigation = navigationProp || nav;
  const { user } = useAuthStore();
  const bottomNavPadding = useBottomNavPadding();
  const { goals, loading, error, fetchGoals, toggleGoalCompletion, deleteGoal } = useGoalsStore();
  const { theme } = useTheme();
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [newlyCreatedGoalId, setNewlyCreatedGoalId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'goals' | 'workout'>('goals');
  const [exerciseBoxExpanded, setExerciseBoxExpanded] = useState(false);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [currentWeight, setCurrentWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [goalWeight, setGoalWeight] = useState('');
  const [activeSplit, setActiveSplit] = useState<WorkoutSplit | null>(null);
  const [nextWorkout, setNextWorkout] = useState<{ day: WorkoutSplitDay; dayIndex: number } | null>(null);
  const [loadingSplit, setLoadingSplit] = useState(false);
  const [nextWorkoutExpanded, setNextWorkoutExpanded] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [editingExercise, setEditingExercise] = useState<string | null>(null);
  const [exerciseData, setExerciseData] = useState<Record<string, Array<{
    id: string; // Unique ID for each row
    weight: string;
    sets: string;
    reps: string;
    goalWeight?: number | null;
    prevWeight?: number | null;
    prevReps?: number | null;
  }>>>({});
  const [completionId, setCompletionId] = useState<string | null>(null);
  const saveTimeoutRef = React.useRef<Record<string, NodeJS.Timeout>>({});

  // Only fetch on first load, not on every focus
  useEffect(() => {
    if (user && goals.length === 0) {
      fetchGoals(user.id);
    }
  }, [user]);

  // Load active split and next workout when on workout tab
  useEffect(() => {
    if (user && activeTab === 'workout') {
      loadActiveSplit();
    }
  }, [user, activeTab]);

  // Reload split when screen comes into focus (e.g., after selecting a split)
  useFocusEffect(
    useCallback(() => {
      if (user && activeTab === 'workout') {
        loadActiveSplit();
      }
    }, [user, activeTab])
  );

  const loadActiveSplit = async () => {
    if (!user) return;
    setLoadingSplit(true);
    try {
      const split = await workoutSplitService.getActiveSplit(user.id);
      setActiveSplit(split);
      if (split) {
        const next = await workoutSplitService.getNextWorkout(user.id);
        setNextWorkout(next);
        
        // Load previous exercise data for each exercise in the next workout
        if (next) {
          const exerciseDataMap: Record<string, Array<{
            id: string;
            weight: string;
            sets: string;
            reps: string;
            goalWeight?: number | null;
            prevWeight?: number | null;
            prevReps?: number | null;
          }>> = {};
          
          // Check if completion already exists for today
          const today = new Date().toISOString().split('T')[0];
          const { data: existingCompletion } = await supabase
            .from('workout_completions')
            .select('*')
            .eq('user_id', user.id)
            .eq('split_id', split.id)
            .eq('day_index', next.dayIndex)
            .eq('completed_date', today)
            .single();
          
          if (existingCompletion) {
            setCompletionId(existingCompletion.id);
            // Load existing exercise logs
            const logs = await workoutExerciseLogService.getExerciseLogsForCompletion(existingCompletion.id);
            const logsByExercise: Record<string, any[]> = {};
            logs.forEach(log => {
              if (!logsByExercise[log.exercise_name]) {
                logsByExercise[log.exercise_name] = [];
              }
              logsByExercise[log.exercise_name].push(log);
            });
            
            for (const exercise of next.day.exercises) {
              const exerciseName = typeof exercise === 'string' ? exercise : (exercise as any).name;
              const previousData = await workoutExerciseLogService.getPreviousExerciseData(user.id, exerciseName);
              const highestWeightData = await workoutExerciseLogService.getHighestWeightAndReps(user.id, exerciseName);
              const existingLogs = logsByExercise[exerciseName] || [];
              
              if (existingLogs.length > 0) {
                exerciseDataMap[exerciseName] = existingLogs.map((log, index) => ({
                  id: `log_${log.id}`,
                  weight: log.weight?.toString() || '',
                  sets: log.sets?.toString() || '',
                  reps: log.reps?.toString() || '',
                  goalWeight: log.goal_weight ?? previousData.goal_weight ?? null,
                  prevWeight: index === 0 ? (highestWeightData.weight ?? null) : null, // Only show prev on first row
                  prevReps: index === 0 ? (highestWeightData.reps ?? null) : null, // Only show prev on first row
                }));
              } else {
                // No existing logs, create rows based on recommended sets
                const recommendedSetsReps = typeof exercise === 'object' && (exercise as any).sets && (exercise as any).reps
                  ? { sets: (exercise as any).sets, reps: (exercise as any).reps }
                  : getExerciseSetsReps(exerciseName);
                
                const initialRows = [];
                for (let i = 0; i < recommendedSetsReps.sets; i++) {
                  initialRows.push({
                    id: `row_${Date.now()}_${exerciseName}_${i}`,
                    weight: '',
                    sets: '',
                    reps: '',
                    goalWeight: previousData.goal_weight ?? null,
                    prevWeight: i === 0 ? (highestWeightData.weight ?? null) : null, // Only first row shows previous
                    prevReps: i === 0 ? (highestWeightData.reps ?? null) : null, // Only first row shows previous
                  });
                }
                exerciseDataMap[exerciseName] = initialRows;
              }
            }
          } else {
            setCompletionId(null);
            for (const exercise of next.day.exercises) {
              const exerciseName = typeof exercise === 'string' ? exercise : (exercise as any).name;
              const previousData = await workoutExerciseLogService.getPreviousExerciseData(user.id, exerciseName);
              const highestWeightData = await workoutExerciseLogService.getHighestWeightAndReps(user.id, exerciseName);
              
              // Get recommended sets to initialize rows
              const recommendedSetsReps = typeof exercise === 'object' && (exercise as any).sets && (exercise as any).reps
                ? { sets: (exercise as any).sets, reps: (exercise as any).reps }
                : getExerciseSetsReps(exerciseName);
              
              // Initialize with recommended number of sets
              const initialRows = [];
              for (let i = 0; i < recommendedSetsReps.sets; i++) {
                initialRows.push({
                  id: `row_${Date.now()}_${exerciseName}_${i}`,
                  weight: '',
                  sets: '',
                  reps: '',
                  goalWeight: previousData.goal_weight ?? null,
                  prevWeight: i === 0 ? (highestWeightData.weight ?? null) : null, // Only first row shows previous
                  prevReps: i === 0 ? (highestWeightData.reps ?? null) : null, // Only first row shows previous
                });
              }
              exerciseDataMap[exerciseName] = initialRows;
            }
          }
          
          setExerciseData(exerciseDataMap);
        } else {
          setExerciseData({});
          setCompletionId(null);
        }
      } else {
        setNextWorkout(null);
        setExerciseData({});
      }
    } catch (error) {
      console.error('Error loading active split:', error);
    } finally {
      setLoadingSplit(false);
    }
  };

  const handleAddExerciseRow = (exerciseName: string) => {
    setExerciseData(prev => {
      const currentRows = prev[exerciseName] || [];
      const lastRow = currentRows[currentRows.length - 1];
      return {
        ...prev,
        [exerciseName]: [
          ...currentRows,
          {
            id: `row_${Date.now()}_${exerciseName}`,
            weight: '',
            sets: '',
            reps: '',
            goalWeight: lastRow?.goalWeight ?? null,
            prevWeight: null, // Only first row shows previous
            prevReps: null, // Only first row shows previous
          },
        ],
      };
    });
  };

  const handleRemoveExerciseRow = async (exerciseName: string, rowId: string, isEditMode: boolean = false) => {
    if (!user) return;
    
    // If this is an existing log, delete it from the database
    if (rowId.startsWith('log_')) {
      const logId = rowId.replace('log_', '');
      try {
        await workoutExerciseLogService.deleteExerciseLog(user.id, logId);
      } catch (error) {
        console.error('Error deleting exercise log:', error);
      }
    }
    
    setExerciseData(prev => {
      const currentRows = prev[exerciseName] || [];
      // In edit mode, allow removing any row (but keep at least 1)
      // Otherwise, respect the recommended minimum
      if (!isEditMode) {
        const recommendedSets = getExerciseSetsReps(exerciseName).sets;
        if (currentRows.length <= recommendedSets) return prev;
      } else {
        // In edit mode, allow removing but keep at least 1 row
        if (currentRows.length <= 1) return prev;
      }
      return {
        ...prev,
        [exerciseName]: currentRows.filter(row => row.id !== rowId),
      };
    });
    
    // Exit edit mode after removing a set
    if (isEditMode) {
      setEditingExercise(null);
    }
  };

  // Auto-save exercise data with debounce
  const handleExerciseDataChange = useCallback(async (
    exerciseName: string,
    rowId: string,
    field: 'weight' | 'sets' | 'reps',
    value: string
  ) => {
    if (!user || !activeSplit || !nextWorkout) return;

    // Update local state immediately
    setExerciseData(prev => ({
      ...prev,
      [exerciseName]: (prev[exerciseName] || []).map(row =>
        row.id === rowId ? { ...row, [field]: value } : row
      ),
    }));

    // Clear existing timeout for this exercise row
    const timeoutKey = `${exerciseName}_${rowId}`;
    if (saveTimeoutRef.current[timeoutKey]) {
      clearTimeout(saveTimeoutRef.current[timeoutKey]);
    }

    // Set new timeout for auto-save (1 second debounce)
    saveTimeoutRef.current[timeoutKey] = setTimeout(async () => {
      try {
        const currentRows = exerciseData[exerciseName] || [];
        const currentRow = currentRows.find(r => r.id === rowId);
        if (!currentRow) return;
        
        const updatedRow = { ...currentRow, [field]: value };
        
        // Create completion if it doesn't exist
        let currentCompletionId = completionId;
        if (!currentCompletionId && activeSplit && nextWorkout) {
          const today = new Date().toISOString().split('T')[0];
          const { data: newCompletion, error } = await supabase
            .from('workout_completions')
            .insert({
              user_id: user.id,
              split_id: activeSplit.id,
              day_index: nextWorkout.dayIndex,
              completed_date: today,
            })
            .select('*')
            .single();
          
          if (error && error.code !== '23505') { // Ignore duplicate key error
            throw error;
          }
          
          if (newCompletion) {
            currentCompletionId = newCompletion.id;
            setCompletionId(newCompletion.id);
          } else {
            // Completion already exists, fetch it
            const { data: existing } = await supabase
              .from('workout_completions')
              .select('*')
              .eq('user_id', user.id)
              .eq('split_id', activeSplit.id)
              .eq('day_index', nextWorkout.dayIndex)
              .eq('completed_date', today)
              .single();
            
            if (existing) {
              currentCompletionId = existing.id;
              setCompletionId(existing.id);
            }
          }
        }
        
        // Save exercise log if we have a completion ID
        if (currentCompletionId) {
          // Check if this row already has a log ID (from existing logs)
          const existingLogId = currentRow.id.startsWith('log_') ? currentRow.id.replace('log_', '') : null;
          
          const savedLog = await workoutExerciseLogService.saveExerciseLog(user.id, {
            completion_id: currentCompletionId,
            exercise_name: exerciseName,
            weight: updatedRow.weight ? parseFloat(updatedRow.weight) : null,
            sets: updatedRow.sets ? parseInt(updatedRow.sets, 10) : null,
            reps: updatedRow.reps ? parseInt(updatedRow.reps, 10) : null,
            goal_weight: updatedRow.goalWeight ?? null,
            logId: existingLogId || undefined,
          });
          
          // Update the row ID if this was a new log
          if (!existingLogId && savedLog) {
            setExerciseData(prev => ({
              ...prev,
              [exerciseName]: (prev[exerciseName] || []).map(row =>
                row.id === rowId ? { ...row, id: `log_${savedLog.id}` } : row
              ),
            }));
          }
        }
      } catch (error) {
        console.error('Error auto-saving exercise data:', error);
      }
    }, 1000);
  }, [user, activeSplit, nextWorkout, exerciseData, completionId]);

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

  const activeGoals = React.useMemo(() => goals.filter(goal => !goal.completed), [goals]);
  const completedGoals = React.useMemo(() => goals.filter(goal => goal.completed), [goals]);


  return (
    <CustomBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomNavPadding }}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
          }
        >
        {/* Header */}
        <View style={styles.header}>
          {activeTab === 'workout' ? (
            <TouchableOpacity
              onPress={() => {
                try {
                  if (navigation && navigation.navigate) {
                    navigation.navigate('WorkoutHistory');
                  } else {
                    console.error('Navigation not available', navigation);
                  }
                } catch (error) {
                  console.error('Error navigating to WorkoutHistory:', error);
                }
              }}
              style={styles.headerLeftButton}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerLeftSpacer} />
          )}
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            {activeTab === 'goals' ? 'My Goals' : 'My Workout'}
          </Text>
          <View style={styles.headerRightButtons}>
            <TouchableOpacity
              onPress={() => setActiveTab(activeTab === 'goals' ? 'workout' : 'goals')}
              style={styles.toggleButton}
            >
              <Ionicons 
                name={activeTab === 'goals' ? "barbell-outline" : "list-outline"} 
                size={24} 
                color={theme.textPrimary} 
              />
            </TouchableOpacity>
            {activeTab === 'goals' && (
              <TouchableOpacity
                onPress={() => setShowNewGoalModal(true)}
                style={styles.newGoalButton}
              >
                <Ionicons name="add" size={28} color={theme.textPrimary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {activeTab === 'goals' ? (
          <>
            {/* Stats Section */}
            <View style={styles.keepTrackSection}>
              <Text style={[styles.keepTrackTitle, { color: theme.textPrimary }]}>Progress</Text>
              <View style={styles.weeklyTrackerCard}>
                <View style={styles.statsContainer}>
                  <View style={styles.statBox}>
                    <Text style={[styles.statNumber, { color: theme.textPrimary }]}>{activeGoals.length}</Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Active</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statNumber, styles.completedStatNumber, { color: theme.textPrimary }]}>{completedGoals.length}</Text>
                    <Text style={[styles.statLabel, styles.completedStatLabel, { color: theme.textSecondary }]}>Completed</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statNumber, styles.totalStatNumber, { color: theme.textPrimary }]}>{goals.length}</Text>
                    <Text style={[styles.statLabel, styles.totalStatLabel, { color: theme.textSecondary }]}>Total</Text>
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
                  {[...activeGoals, ...completedGoals].map(goal => (
                    <GoalItem
                      key={goal.id}
                      goal={goal}
                      theme={theme}
                      navigation={navigation}
                      onToggle={handleToggleCompletion}
                      onDelete={handleDeleteGoal}
                      styles={styles}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        ) : (
          /* Workout Content */
          <View style={styles.keepTrackSection}>
            {/* Current Split Box */}
            <TouchableOpacity
              onPress={() => navigation.navigate('WorkoutSplit')}
              style={[styles.exerciseBox, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}
              activeOpacity={0.7}
            >
              <View style={styles.exerciseBoxHeader}>
                <Text style={[styles.exerciseBoxTitle, { color: theme.textPrimary }]}>
                  Current Split: {activeSplit ? activeSplit.split_name : 'None'}
                </Text>
                <Ionicons name="add" size={24} color={theme.textPrimary} />
              </View>
            </TouchableOpacity>

            {/* Next Workout Box */}
            <View style={[styles.weeklyTrackerCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
              <TouchableOpacity
                onPress={() => setNextWorkoutExpanded(!nextWorkoutExpanded)}
                activeOpacity={0.7}
                disabled={!nextWorkout || loadingSplit}
              >
                <View style={styles.nextWorkoutHeader}>
                  <Text style={[styles.keepTrackTitle, { color: theme.textPrimary }]}>
                    Next Workout: {nextWorkout ? (nextWorkout.day.focus || nextWorkout.day.day) : ''}
                  </Text>
                  {nextWorkout && !loadingSplit && (
                    <Ionicons
                      name={nextWorkoutExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={theme.textSecondary}
                    />
                  )}
                </View>
              </TouchableOpacity>
              {loadingSplit ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateTitle, { color: theme.textSecondary }]}>Loading...</Text>
                </View>
              ) : nextWorkout ? (
                <>
                  {!nextWorkoutExpanded ? (
                    /* Collapsed View - Exercise Preview */
                    <View style={styles.exercisePreview}>
                      {nextWorkout.day.exercises.map((exercise, exerciseIndex) => {
                        const exerciseName = typeof exercise === 'string' ? exercise : (exercise as any).name;
                        const recommendedSetsReps = typeof exercise === 'object' && (exercise as any).sets && (exercise as any).reps
                          ? { sets: (exercise as any).sets, reps: (exercise as any).reps }
                          : getExerciseSetsReps(exerciseName);
                        return (
                          <View key={exerciseIndex} style={styles.exercisePreviewItem}>
                            <Text style={[styles.exercisePreviewName, { color: theme.textPrimary }]}>
                              {exerciseName}
                            </Text>
                            <Text style={[styles.exercisePreviewSetsReps, { color: theme.textSecondary }]}>
                              {recommendedSetsReps.sets} sets × {recommendedSetsReps.reps} reps
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    /* Expanded View - Full Details */
                    <View style={styles.nextWorkoutContent}>
                      <View style={styles.nextWorkoutExercises}>
                        {nextWorkout.day.exercises.map((exercise, exerciseIndex) => {
                      // Handle both string and object exercise formats
                      const exerciseName = typeof exercise === 'string' ? exercise : (exercise as any).name;
                      const exerciseRows = exerciseData[exerciseName] || [{
                        id: `row_${Date.now()}_${exerciseName}`,
                        weight: '',
                        sets: '',
                        reps: '',
                        goalWeight: null,
                        prevWeight: null,
                        prevReps: null,
                      }];
                      const firstRow = exerciseRows[0];
                      
                      // Get recommended sets and reps
                      const recommendedSetsReps = typeof exercise === 'object' && (exercise as any).sets && (exercise as any).reps
                        ? { sets: (exercise as any).sets, reps: (exercise as any).reps }
                        : getExerciseSetsReps(exerciseName);
                      
                      return (
                        <View key={exerciseIndex} style={styles.exerciseItem}>
                          {exerciseIndex > 0 && (
                            <View style={styles.exerciseDivider} />
                          )}
                          <View style={styles.exerciseCardHeader}>
                            <View style={styles.exerciseNameContainer}>
                              <View style={styles.exerciseNameRow}>
                                <Text style={[styles.exerciseCardName, { color: theme.textPrimary }]}>
                                  {exerciseName}
                                </Text>
                                <Text style={[styles.exerciseSetsReps, { color: theme.textSecondary }]}>
                                  {recommendedSetsReps.sets} sets × {recommendedSetsReps.reps} reps
                                </Text>
                              </View>
                            </View>
                            {editingExercise === exerciseName ? (
                              <View style={styles.editButtonsContainer}>
                                <TouchableOpacity
                                  onPress={() => {
                                    handleAddExerciseRow(exerciseName);
                                    setEditingExercise(null);
                                  }}
                                  style={[styles.editButton, { backgroundColor: theme.primary }]}
                                >
                                  <Ionicons name="add" size={18} color="#FFFFFF" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => {
                                    Alert.alert(
                                      'Remove Exercise',
                                      `Are you sure you want to remove "${exerciseName}" from this workout?`,
                                      [
                                        { text: 'Cancel', style: 'cancel' },
                                        {
                                          text: 'Remove',
                                          style: 'destructive',
                                          onPress: async () => {
                                            if (!user || !activeSplit || !nextWorkout) return;
                                            try {
                                              const updatedDays = [...activeSplit.days];
                                              const currentDay = updatedDays[nextWorkout.dayIndex];
                                              
                                              // Remove the exercise from the day
                                              const currentExercisesList = currentDay.exercises
                                                .map(ex => typeof ex === 'string' ? ex : (typeof ex === 'object' ? (ex as any).name : String(ex)))
                                                .filter(ex => ex !== exerciseName);
                                              
                                              updatedDays[nextWorkout.dayIndex] = {
                                                ...currentDay,
                                                exercises: currentExercisesList,
                                              };
                                              
                                              // Update the split in the database
                                              await workoutSplitService.updateSplit(user.id, activeSplit.id, {
                                                days: updatedDays,
                                              });
                                              
                                              // Reload the active split to show the updated workout
                                              await loadActiveSplit();
                                              setEditingExercise(null);
                                            } catch (error: any) {
                                              console.error('Error removing exercise:', error);
                                              alert(error.message || 'Failed to remove exercise');
                                            }
                                          },
                                        },
                                      ]
                                    );
                                  }}
                                  style={[styles.editButton, { backgroundColor: '#EF4444' }]}
                                >
                                  <Ionicons name="remove" size={18} color="#FFFFFF" />
                                </TouchableOpacity>
                              </View>
                            ) : (
                              <TouchableOpacity
                                onPress={() => setEditingExercise(exerciseName)}
                                style={styles.editIconButton}
                              >
                                <Ionicons name="create-outline" size={20} color={theme.textSecondary} />
                              </TouchableOpacity>
                            )}
                          </View>
                          
                          {/* Labels row - shown once at the top */}
                          <View style={styles.exerciseLabelsRow}>
                            <View style={styles.setLabelGroup} />
                            <View style={styles.exerciseLabelGroup}>
                              <Text style={[styles.exerciseInputLabel, { color: theme.textSecondary }]}>
                                Weight
                                {firstRow?.prevWeight !== null && firstRow?.prevWeight !== undefined && (
                                  <Text style={[styles.previousValue, { color: theme.textSecondary }]}>
                                    {' '}Prev: {firstRow.prevWeight}kg
                                  </Text>
                                )}
                              </Text>
                            </View>
                            <View style={styles.exerciseLabelGroup}>
                              <Text style={[styles.exerciseInputLabel, { color: theme.textSecondary }]}>
                                Reps
                                {firstRow?.prevReps !== null && firstRow?.prevReps !== undefined && (
                                  <Text style={[styles.previousValue, { color: theme.textSecondary }]}>
                                    {' '}Prev: {firstRow.prevReps}
                                  </Text>
                                )}
                              </Text>
                            </View>
                          </View>

                          {/* Input rows - Set number, Weight, and Reps */}
                          {exerciseRows.map((row, rowIndex) => (
                            <View key={row.id} style={styles.exerciseRowContainer}>
                              <View style={styles.exerciseInputsRow}>
                                <View style={styles.setLabelGroup}>
                                  <Text style={[styles.setNumberLabel, { color: theme.textSecondary }]}>
                                    Set {rowIndex + 1}
                                  </Text>
                                </View>
                                <View style={styles.exerciseInputGroup}>
                                  <TextInput
                                    style={[styles.exerciseInput, { 
                                      backgroundColor: '#F9FAFB',
                                      borderColor: '#E5E7EB',
                                      color: theme.textPrimary 
                                    }]}
                                    placeholder="0"
                                    placeholderTextColor={theme.textTertiary}
                                    value={row.weight}
                                    onChangeText={(value) => handleExerciseDataChange(exerciseName, row.id, 'weight', value)}
                                    keyboardType="decimal-pad"
                                  />
                                </View>

                                <View style={styles.exerciseInputGroup}>
                                  <TextInput
                                    style={[styles.exerciseInput, { 
                                      backgroundColor: '#F9FAFB',
                                      borderColor: '#E5E7EB',
                                      color: theme.textPrimary 
                                    }]}
                                    placeholder="0"
                                    placeholderTextColor={theme.textTertiary}
                                    value={row.reps}
                                    onChangeText={(value) => handleExerciseDataChange(exerciseName, row.id, 'reps', value)}
                                    keyboardType="number-pad"
                                  />
                                </View>
                                
                                {editingExercise === exerciseName && (
                                  <TouchableOpacity
                                    onPress={() => handleRemoveExerciseRow(exerciseName, row.id, true)}
                                    style={styles.removeRowButton}
                                  >
                                    <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          ))}
                        </View>
                      );
                    })}
                  </View>
                  
                  {/* Add Exercise Button */}
                  <TouchableOpacity
                    onPress={() => {
                      if (!user || !activeSplit || !nextWorkout) return;
                      setShowAddExerciseModal(true);
                      setExerciseSearchQuery('');
                      setCustomExerciseName('');
                    }}
                    style={[styles.addExerciseButton, { 
                      backgroundColor: '#F9FAFB',
                      borderColor: '#E5E7EB',
                      borderWidth: 1,
                    }]}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.addExerciseButtonText, { color: theme.primary }]}>Add Exercise</Text>
                  </TouchableOpacity>
                  
                      {/* Mark as Complete Button */}
                      <TouchableOpacity
                        onPress={async () => {
                          if (!user || !activeSplit || !nextWorkout) return;
                          try {
                            // Ensure completion exists (it should already exist from auto-save, but check)
                            let currentCompletionId = completionId;
                            if (!currentCompletionId) {
                              const completion = await workoutSplitService.completeWorkout(user.id, activeSplit.id, nextWorkout.dayIndex);
                              currentCompletionId = completion.id;
                              setCompletionId(completion.id);
                            }
                            
                            // Save all exercise logs (in case any weren't auto-saved)
                            if (currentCompletionId) {
                              for (const exercise of nextWorkout.day.exercises) {
                                const exerciseName = typeof exercise === 'string' ? exercise : (exercise as any).name;
                                const exerciseRows = exerciseData[exerciseName] || [];
                                for (const row of exerciseRows) {
                                  if (row.weight || row.sets || row.reps) {
                                    const existingLogId = row.id.startsWith('log_') ? row.id.replace('log_', '') : undefined;
                                    await workoutExerciseLogService.saveExerciseLog(user.id, {
                                      completion_id: currentCompletionId,
                                      exercise_name: exerciseName,
                                      weight: row.weight ? parseFloat(row.weight) : null,
                                      sets: row.sets ? parseInt(row.sets, 10) : null,
                                      reps: row.reps ? parseInt(row.reps, 10) : null,
                                      goal_weight: row.goalWeight ?? null,
                                      logId: existingLogId,
                                    });
                                  }
                                }
                              }
                            }
                            
                            await loadActiveSplit(); // Reload to get next workout
                          } catch (error: any) {
                            console.error('Error completing workout:', error);
                            alert(error.message || 'Failed to complete workout');
                          }
                        }}
                        style={[styles.completeWorkoutButton, { backgroundColor: theme.primary }]}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.completeWorkoutButtonText}>Mark as Complete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="barbell-outline" size={64} color="#d1d5db" />
                  <Text style={styles.emptyStateTitle}>
                    No Workout Scheduled
                  </Text>
                  <Text style={styles.emptyStateSubtitle}>
                    {activeSplit ? 'All workouts completed for today' : 'Select a split to get started'}
                  </Text>
                </View>
              )}
            </View>

            {/* My Exercises Box */}
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('MyExercises');
              }}
              style={[styles.exerciseBox, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}
              activeOpacity={0.7}
            >
              <View style={styles.exerciseBoxHeader}>
                <Text style={[styles.exerciseBoxTitle, { color: theme.textPrimary }]}>My Exercises</Text>
                <Ionicons name="chevron-forward" size={24} color={theme.textPrimary} />
              </View>
            </TouchableOpacity>
          </View>
        )}
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

      {/* Exercise Modal */}
      <Modal
        visible={showExerciseModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowExerciseModal(false);
          setSelectedExercise(null);
          setCurrentWeight('');
          setSets('');
          setReps('');
          setGoalWeight('');
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.exerciseModalContent, { backgroundColor: '#FFFFFF' }]}>
                  <View style={styles.exerciseModalHeader}>
                    <Text style={[styles.exerciseModalTitle, { color: theme.textPrimary }]}>
                      {selectedExercise}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowExerciseModal(false);
                        setSelectedExercise(null);
                        setCurrentWeight('');
                        setSets('');
                        setReps('');
                        setGoalWeight('');
                      }}
                      style={styles.closeButton}
                    >
                      <Ionicons name="close" size={24} color={theme.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.exerciseModalBody} showsVerticalScrollIndicator={false}>
                    <View style={styles.exerciseFormField}>
                      <Text style={[styles.exerciseFormLabel, { color: theme.textSecondary }]}>
                        Current Weight (kg)
                      </Text>
                      <TextInput
                        style={[styles.exerciseFormInput, { 
                          backgroundColor: '#F9FAFB',
                          borderColor: '#E5E7EB',
                          color: theme.textPrimary 
                        }]}
                        placeholder="Enter current weight"
                        placeholderTextColor={theme.textTertiary}
                        value={currentWeight}
                        onChangeText={setCurrentWeight}
                        keyboardType="decimal-pad"
                      />
                    </View>

                    <View style={styles.exerciseFormField}>
                      <Text style={[styles.exerciseFormLabel, { color: theme.textSecondary }]}>
                        Sets
                      </Text>
                      <TextInput
                        style={[styles.exerciseFormInput, { 
                          backgroundColor: '#F9FAFB',
                          borderColor: '#E5E7EB',
                          color: theme.textPrimary 
                        }]}
                        placeholder="Enter number of sets"
                        placeholderTextColor={theme.textTertiary}
                        value={sets}
                        onChangeText={setSets}
                        keyboardType="number-pad"
                      />
                    </View>

                    <View style={styles.exerciseFormField}>
                      <Text style={[styles.exerciseFormLabel, { color: theme.textSecondary }]}>
                        Reps
                      </Text>
                      <TextInput
                        style={[styles.exerciseFormInput, { 
                          backgroundColor: '#F9FAFB',
                          borderColor: '#E5E7EB',
                          color: theme.textPrimary 
                        }]}
                        placeholder="Enter number of reps"
                        placeholderTextColor={theme.textTertiary}
                        value={reps}
                        onChangeText={setReps}
                        keyboardType="number-pad"
                      />
                    </View>

                    <View style={styles.exerciseFormField}>
                      <Text style={[styles.exerciseFormLabel, { color: theme.textSecondary }]}>
                        Goal Weight (kg)
                      </Text>
                      <TextInput
                        style={[styles.exerciseFormInput, { 
                          backgroundColor: '#F9FAFB',
                          borderColor: '#E5E7EB',
                          color: theme.textPrimary 
                        }]}
                        placeholder="Enter goal weight"
                        placeholderTextColor={theme.textTertiary}
                        value={goalWeight}
                        onChangeText={setGoalWeight}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </ScrollView>

                  <View style={styles.exerciseModalFooter}>
                    <TouchableOpacity
                      onPress={async () => {
                        if (!user || !selectedExercise) return;

                        try {
                          await workoutService.createExercise(user.id, {
                            exercise_name: selectedExercise,
                            muscle_group: selectedMuscleGroup || null,
                            sub_category: selectedSubCategory || null,
                            current_weight: currentWeight ? parseFloat(currentWeight) : null,
                            sets: sets ? parseInt(sets, 10) : null,
                            reps: reps ? parseInt(reps, 10) : null,
                            goal_weight: goalWeight ? parseFloat(goalWeight) : null,
                          });

                          Alert.alert('Success', 'Exercise added to your workout!');
                          setShowExerciseModal(false);
                          setSelectedExercise(null);
                          setCurrentWeight('');
                          setSets('');
                          setReps('');
                          setGoalWeight('');
                        } catch (error: any) {
                          console.error('Error saving exercise:', error);
                          Alert.alert('Error', error.message || 'Failed to save exercise. Please try again.');
                        }
                      }}
                      style={[styles.saveButton, { backgroundColor: theme.primary }]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.saveButtonText}>Add Exercise</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

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
        <SafeAreaView style={[styles.addExerciseModalContainer, { backgroundColor: theme.background }]}>
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
              const currentExercises = nextWorkout?.day.exercises.map(ex => 
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
                  <View style={styles.addExerciseEmptyState}>
                    <Ionicons name="barbell-outline" size={48} color={theme.textTertiary} />
                    <Text style={[styles.addExerciseEmptyStateText, { color: theme.textSecondary }]}>
                      {exerciseSearchQuery ? 'No exercises found' : 'No exercises available'}
                    </Text>
                  </View>
                );
              }

              return (
                <>
                  {hasCustomExercise && (
                    <TouchableOpacity
                      style={[styles.addExerciseModalItem, {
                        backgroundColor: theme.cardBackground,
                        borderColor: theme.borderSecondary,
                      }]}
                      onPress={async () => {
                        if (!user || !activeSplit || !nextWorkout) return;
                        try {
                          const exerciseName = customExerciseName.trim();
                          const updatedDays = [...activeSplit.days];
                          const currentDay = updatedDays[nextWorkout.dayIndex];
                          const currentExercisesList = currentDay.exercises.map(ex => 
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
                      }}
                    >
                      <Text style={[styles.addExerciseModalItemText, { color: theme.textPrimary }]}>
                        {customExerciseName.trim()} (Custom)
                      </Text>
                      <Ionicons name="add-circle" size={24} color={theme.primary} />
                    </TouchableOpacity>
                  )}
                  {filteredExercises.map((exercise, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.addExerciseModalItem, {
                        backgroundColor: theme.cardBackground,
                        borderColor: theme.borderSecondary,
                      }]}
                      onPress={async () => {
                        if (!user || !activeSplit || !nextWorkout) return;
                        try {
                          const updatedDays = [...activeSplit.days];
                          const currentDay = updatedDays[nextWorkout.dayIndex];
                          const currentExercisesList = currentDay.exercises.map(ex => 
                            typeof ex === 'string' ? ex : (typeof ex === 'object' ? (ex as any).name : String(ex))
                          );
                          currentExercisesList.push(exercise);
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
                      }}
                    >
                      <Text style={[styles.addExerciseModalItemText, { color: theme.textPrimary }]}>
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
    paddingTop: 10,
    paddingBottom: 20,
    position: 'relative',
  },
  headerLeftContainer: {
    width: 40,
    height: 40,
    zIndex: 10,
  },
  headerLeftSpacer: {
    width: 40,
    height: 40,
    zIndex: 1,
  },
  headerLeftButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: 0,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
  },
  toggleButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  newGoalButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepTrackSection: {
    paddingHorizontal: 24,
    paddingVertical: 4,
  },
  keepTrackTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  weeklyTrackerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    paddingVertical: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  completedStatNumber: {
  },
  completedStatLabel: {
  },
  totalStatNumber: {
  },
  totalStatLabel: {
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
  exerciseBox: {
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  exerciseBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseBoxTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  exerciseBoxContent: {
    marginTop: 16,
  },
  muscleGroupContainer: {
    gap: 8,
  },
  muscleGroupButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  muscleGroupText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  subCategoryContainer: {
    gap: 8,
  },
  subCategoryButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  subCategoryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseCardItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  exerciseItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  exerciseModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  exerciseModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  exerciseModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  exerciseModalBody: {
    padding: 20,
  },
  exerciseFormField: {
    marginBottom: 20,
  },
  exerciseFormLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  exerciseFormInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  exerciseModalFooter: {
    padding: 20,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  saveButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exercisePreview: {
    marginTop: 8,
    gap: 8,
  },
  exercisePreviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  exercisePreviewName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  exercisePreviewSetsReps: {
    fontSize: 13,
    marginLeft: 12,
  },
  nextWorkoutContent: {
    marginTop: 0,
  },
  nextWorkoutFocus: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  nextWorkoutExercises: {
    gap: 8,
    marginBottom: 16,
  },
  nextWorkoutExerciseItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#F9FAFB',
  },
  nextWorkoutExerciseText: {
    fontSize: 15,
    fontWeight: '500',
  },
  addExerciseButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    flexDirection: 'row',
  },
  addExerciseButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  completeWorkoutButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  completeWorkoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseItem: {
    paddingTop: 16,
    paddingBottom: 4,
  },
  exerciseDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginBottom: 16,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  exerciseNameContainer: {
    flex: 1,
    marginRight: 8,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  exerciseCardName: {
    fontSize: 16,
    fontWeight: '700',
  },
  exerciseSetsReps: {
    fontSize: 14,
    fontWeight: '500',
  },
  addRowButton: {
    padding: 4,
  },
  editIconButton: {
    padding: 4,
  },
  editButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseCardRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  exerciseRowContainer: {
    marginBottom: 8,
  },
  removeRowButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseCardPrev: {
    fontSize: 13,
    fontWeight: '500',
  },
  exerciseCardGoal: {
    fontSize: 13,
    fontWeight: '500',
  },
  exerciseLabelsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    marginTop: 8,
  },
  setLabelGroup: {
    width: 60,
    justifyContent: 'center',
  },
  exerciseLabelGroup: {
    flex: 1,
  },
  exerciseInputsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  exerciseInputGroup: {
    flex: 1,
  },
  setNumberLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  previousValue: {
    fontSize: 11,
    fontWeight: '400',
    fontStyle: 'italic',
  },
  exerciseInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  historyButton: {
    padding: 4,
  },
  addExerciseModalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  customExerciseContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  customExerciseLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  customExerciseInput: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  exerciseListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  addExerciseModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  addExerciseModalItemText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  addExerciseEmptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  addExerciseEmptyStateText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
}); 