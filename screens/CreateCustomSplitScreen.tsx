import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import { useBottomNavPadding } from '../components/CustomTabBar';
import CustomBackground from '../components/CustomBackground';
import { workoutSplitService } from '../lib/workoutSplitService';
import { useAuthStore } from '../state/authStore';
import { WorkoutSplitDay } from '../types/database';
import { EXERCISE_DATA } from './GoalsScreen';

interface CreateCustomSplitScreenProps {
  navigation: any;
}

export default function CreateCustomSplitScreen({ navigation }: CreateCustomSplitScreenProps) {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const bottomNavPadding = useBottomNavPadding();
  const [splitName, setSplitName] = useState('');
  const [days, setDays] = useState<WorkoutSplitDay[]>([]);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [exerciseInputMode, setExerciseInputMode] = useState<'select' | 'custom'>('select');
  const [saving, setSaving] = useState(false);

  const handleAddDay = () => {
    setDays([...days, { day: `Day ${days.length + 1}`, focus: '', exercises: [] }]);
  };

  const handleUpdateDay = (index: number, field: 'day' | 'focus', value: string) => {
    const updatedDays = [...days];
    updatedDays[index] = { ...updatedDays[index], [field]: value };
    setDays(updatedDays);
  };

  const handleOpenExerciseModal = (dayIndex: number) => {
    setSelectedDayIndex(dayIndex);
    setShowExerciseModal(true);
    setSelectedMuscleGroup(null);
    setSelectedSubCategory(null);
    setCustomExerciseName('');
    setExerciseInputMode('select');
  };

  const handleAddExerciseFromList = (exercise: string) => {
    if (selectedDayIndex === null) return;

    const updatedDays = [...days];
    if (!updatedDays[selectedDayIndex].exercises.includes(exercise)) {
      updatedDays[selectedDayIndex].exercises.push(exercise);
      setDays(updatedDays);
    }
    setShowExerciseModal(false);
    setSelectedDayIndex(null);
    setSelectedMuscleGroup(null);
    setSelectedSubCategory(null);
  };

  const handleAddCustomExercise = () => {
    if (selectedDayIndex === null || !customExerciseName.trim()) return;

    const updatedDays = [...days];
    if (!updatedDays[selectedDayIndex].exercises.includes(customExerciseName.trim())) {
      updatedDays[selectedDayIndex].exercises.push(customExerciseName.trim());
      setDays(updatedDays);
    }
    setShowExerciseModal(false);
    setSelectedDayIndex(null);
    setCustomExerciseName('');
  };

  const handleRemoveExercise = (dayIndex: number, exerciseIndex: number) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].exercises.splice(exerciseIndex, 1);
    setDays(updatedDays);
  };

  const handleRemoveDay = (index: number) => {
    const updatedDays = days.filter((_, i) => i !== index);
    setDays(updatedDays);
  };

  const handleSave = async () => {
    if (!user || !splitName.trim()) {
      alert('Please enter a split name');
      return;
    }

    if (days.length === 0) {
      alert('Please add at least one day');
      return;
    }

    try {
      setSaving(true);
      await workoutSplitService.createSplit(user.id, {
        split_name: splitName.trim(),
        split_type: 'custom',
        days: days,
      });
      navigation.goBack();
    } catch (error: any) {
      console.error('Error saving split:', error);
      alert(error.message || 'Failed to save split');
    } finally {
      setSaving(false);
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
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Create Custom Split</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveButton}
            disabled={saving || !splitName.trim() || days.length === 0}
          >
            <Text
              style={[
                styles.saveButtonText,
                {
                  color: saving || !splitName.trim() || days.length === 0
                    ? theme.textTertiary
                    : theme.primary,
                },
              ]}
            >
              Save
            </Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: bottomNavPadding + 24 }}
          >
            {/* Split Name Input */}
            <View style={[styles.inputCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Split Name</Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: '#E5E7EB' }]}
                placeholder="Enter split name"
                placeholderTextColor={theme.textTertiary}
                value={splitName}
                onChangeText={setSplitName}
                autoCapitalize="sentences"
                autoCorrect={true}
              />
            </View>

            {/* Days List */}
            <View style={styles.daysContainer}>
              {days.map((day, dayIndex) => (
                <View
                  key={dayIndex}
                  style={[styles.dayCard, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}
                >
                  <View style={styles.dayHeader}>
                    <TextInput
                      style={[styles.dayNameInput, { color: theme.textPrimary }]}
                      placeholder="Day name"
                      placeholderTextColor={theme.textTertiary}
                      value={day.day}
                      onChangeText={(value) => handleUpdateDay(dayIndex, 'day', value)}
                      autoCapitalize="sentences"
                      autoCorrect={true}
                    />
                    <TouchableOpacity
                      onPress={() => handleRemoveDay(dayIndex)}
                      style={styles.removeDayButton}
                    >
                      <Ionicons name="close" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={[styles.focusInput, { color: theme.textSecondary, borderColor: '#E5E7EB' }]}
                    placeholder="Focus area (optional)"
                    placeholderTextColor={theme.textTertiary}
                    value={day.focus}
                    onChangeText={(value) => handleUpdateDay(dayIndex, 'focus', value)}
                    autoCapitalize="sentences"
                    autoCorrect={true}
                  />

                  <View style={styles.exercisesContainer}>
                    {day.exercises.map((exercise, exerciseIndex) => (
                      <View key={exerciseIndex} style={styles.exerciseTag}>
                        <Text style={[styles.exerciseTagText, { color: theme.textPrimary }]}>
                          {exercise}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveExercise(dayIndex, exerciseIndex)}
                          style={styles.removeExerciseButton}
                        >
                          <Ionicons name="close" size={16} color={theme.textSecondary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity
                      onPress={() => handleOpenExerciseModal(dayIndex)}
                      style={[styles.addExerciseButton, { borderColor: '#E5E7EB' }]}
                    >
                      <Ionicons name="add" size={20} color={theme.primary} />
                      <Text style={[styles.addExerciseText, { color: theme.primary }]}>
                        Add Exercise
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                onPress={handleAddDay}
                style={[styles.addDayButton, { borderColor: '#E5E7EB' }]}
              >
                <Ionicons name="add" size={24} color={theme.primary} />
                <Text style={[styles.addDayText, { color: theme.primary }]}>Add Day</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Exercise Selection Modal */}
        <Modal
          visible={showExerciseModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => {
            setShowExerciseModal(false);
            setSelectedDayIndex(null);
            setSelectedMuscleGroup(null);
            setSelectedSubCategory(null);
            setCustomExerciseName('');
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
                        Add Exercise
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setShowExerciseModal(false);
                          setSelectedDayIndex(null);
                          setSelectedMuscleGroup(null);
                          setSelectedSubCategory(null);
                          setCustomExerciseName('');
                        }}
                        style={styles.closeButton}
                      >
                        <Ionicons name="close" size={24} color={theme.textPrimary} />
                      </TouchableOpacity>
                    </View>

                    {/* Mode Toggle */}
                    <View style={styles.modeToggle}>
                      <TouchableOpacity
                        onPress={() => setExerciseInputMode('select')}
                        style={[
                          styles.modeButton,
                          exerciseInputMode === 'select' && { backgroundColor: theme.primary },
                        ]}
                      >
                        <Text
                          style={[
                            styles.modeButtonText,
                            { color: exerciseInputMode === 'select' ? '#FFFFFF' : theme.textPrimary },
                          ]}
                        >
                          From List
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setExerciseInputMode('custom')}
                        style={[
                          styles.modeButton,
                          exerciseInputMode === 'custom' && { backgroundColor: theme.primary },
                        ]}
                      >
                        <Text
                          style={[
                            styles.modeButtonText,
                            { color: exerciseInputMode === 'custom' ? '#FFFFFF' : theme.textPrimary },
                          ]}
                        >
                          Custom
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.exerciseModalBody} showsVerticalScrollIndicator={false}>
                      {exerciseInputMode === 'select' ? (
                        <>
                          {!selectedMuscleGroup ? (
                            <View style={styles.muscleGroupContainer}>
                              {Object.keys(EXERCISE_DATA).map((muscleGroup) => (
                                <TouchableOpacity
                                  key={muscleGroup}
                                  onPress={() => setSelectedMuscleGroup(muscleGroup)}
                                  style={[
                                    styles.muscleGroupButton,
                                    { backgroundColor: theme.cardBackground, borderColor: '#E5E7EB' },
                                  ]}
                                  activeOpacity={0.7}
                                >
                                  <Text style={[styles.muscleGroupText, { color: theme.textPrimary }]}>
                                    {muscleGroup}
                                  </Text>
                                  <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                                </TouchableOpacity>
                              ))}
                            </View>
                          ) : !selectedSubCategory ? (
                            <View>
                              <TouchableOpacity
                                onPress={() => {
                                  setSelectedMuscleGroup(null);
                                  setSelectedSubCategory(null);
                                }}
                                style={styles.backButton}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
                                <Text style={[styles.backButtonText, { color: theme.textPrimary }]}>
                                  {selectedMuscleGroup}
                                </Text>
                              </TouchableOpacity>
                              <View style={styles.subCategoryContainer}>
                                {Object.keys(
                                  EXERCISE_DATA[selectedMuscleGroup as keyof typeof EXERCISE_DATA]
                                ).map((subCategory) => (
                                  <TouchableOpacity
                                    key={subCategory}
                                    onPress={() => setSelectedSubCategory(subCategory)}
                                    style={[
                                      styles.subCategoryButton,
                                      { backgroundColor: theme.cardBackground, borderColor: '#E5E7EB' },
                                    ]}
                                    activeOpacity={0.7}
                                  >
                                    <Text style={[styles.subCategoryText, { color: theme.textPrimary }]}>
                                      {subCategory}
                                    </Text>
                                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>
                          ) : (
                            <View>
                              <TouchableOpacity
                                onPress={() => {
                                  setSelectedSubCategory(null);
                                }}
                                style={styles.backButton}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
                                <Text style={[styles.backButtonText, { color: theme.textPrimary }]}>
                                  {selectedSubCategory}
                                </Text>
                              </TouchableOpacity>
                              <View>
                                {(() => {
                                  const muscleGroup =
                                    EXERCISE_DATA[selectedMuscleGroup as keyof typeof EXERCISE_DATA];
                                  const exercises =
                                    muscleGroup && selectedSubCategory
                                      ? (muscleGroup as any)[selectedSubCategory]
                                      : [];
                                  return exercises.map((exercise: string, index: number) => (
                                    <TouchableOpacity
                                      key={index}
                                      onPress={() => handleAddExerciseFromList(exercise)}
                                      style={[styles.exerciseItem, { borderColor: '#E5E7EB' }]}
                                      activeOpacity={0.7}
                                    >
                                      <Text style={[styles.exerciseItemText, { color: theme.textPrimary }]}>
                                        {exercise}
                                      </Text>
                                    </TouchableOpacity>
                                  ));
                                })()}
                              </View>
                            </View>
                          )}
                        </>
                      ) : (
                        <View style={styles.customExerciseContainer}>
                          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                            Exercise Name
                          </Text>
                          <TextInput
                            style={[styles.input, { color: theme.textPrimary, borderColor: '#E5E7EB' }]}
                            placeholder="Enter exercise name"
                            placeholderTextColor={theme.textTertiary}
                            value={customExerciseName}
                            onChangeText={setCustomExerciseName}
                            autoCapitalize="sentences"
                            autoCorrect={true}
                          />
                          <TouchableOpacity
                            onPress={handleAddCustomExercise}
                            style={[styles.addCustomButton, { backgroundColor: theme.primary }]}
                            disabled={!customExerciseName.trim()}
                          >
                            <Text style={styles.addCustomButtonText}>Add Exercise</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </ScrollView>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
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
  saveButton: {
    padding: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  inputCard: {
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  daysContainer: {
    padding: 24,
    gap: 16,
  },
  dayCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayNameInput: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  removeDayButton: {
    padding: 4,
  },
  focusInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  exercisesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  exerciseTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  exerciseTagText: {
    fontSize: 14,
  },
  removeExerciseButton: {
    padding: 2,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  addExerciseText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  addDayText: {
    fontSize: 16,
    fontWeight: '600',
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
  },
  closeButton: {
    padding: 4,
  },
  modeToggle: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  modeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseModalBody: {
    padding: 20,
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
  exerciseItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  exerciseItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  customExerciseContainer: {
    gap: 12,
  },
  addCustomButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  addCustomButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

