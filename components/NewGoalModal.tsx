import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGoalsStore } from '../state/goalsStore';
import { CreateGoalData } from '../types/database';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../state/themeStore';

interface NewGoalModalProps {
  visible: boolean;
  onClose: () => void;
  onGoalCreated: (goalId: string) => void;
}

const CATEGORIES = [
  'Health',
  'Learning', 
  'Productivity',
  'Finance',
  'Relationships',
  'Fitness',
  'Gym',
  'Nutrition',
  'Habits',
  'Career',
  'Personal Growth',
  'Other'
];

const TIME_COMMITMENTS = [
  '10 minutes',
  '15 minutes',
  '30 minutes',
  '45 minutes',
  '1 hour',
  '1.5 hours',
  '2 hours',
  '3 hours',
  '4 hours',
  '6 hours',
  '8 hours',
  '12 hours'
];

const CHECK_IN_SCHEDULES = [
  'Daily at 6pm',
  'Daily at 9am',
  'Every Monday',
  'Every Friday',
  'Twice a week',
  'Weekly',
  'Bi-weekly',
  'Monthly'
];

const SHARING_OPTIONS = [
  'Private',
  'Friends',
  'Public'
];

export default function NewGoalModal({ visible, onClose, onGoalCreated }: NewGoalModalProps) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');

  const handleTitleChange = (text: string) => {
    if (text.length > 0) {
      setTitle(text.charAt(0).toUpperCase() + text.slice(1));
    } else {
      setTitle(text);
    }
  };
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [endDate, setEndDate] = useState('');
  const [frequency, setFrequency] = useState<boolean[]>([false, false, false, false, false, false, false]); // S,M,T,W,T,F,S
  const [timeCommitment, setTimeCommitment] = useState('');
  const [checkInSchedule, setCheckInSchedule] = useState('');
  const [sharingOption, setSharingOption] = useState('Public');
  const [successCriteria, setSuccessCriteria] = useState('');
  const [milestoneCount, setMilestoneCount] = useState(0);
  const [milestones, setMilestones] = useState<string[]>([]);

  const [showCategories, setShowCategories] = useState(false);
  const [showTimeCommitments, setShowTimeCommitments] = useState(false);
  const [showCheckInSchedules, setShowCheckInSchedules] = useState(false);
  const [showSharingOptions, setShowSharingOptions] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');

  const { createGoal, loading, error } = useGoalsStore();

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Validation for UI state (no alerts)
  const isFormValidForUI = () => {
    return (
      title.trim().length > 0 &&
      category.trim().length > 0 &&
      description.trim().length > 0 &&
      startDate.trim().length > 0 &&
      endDate.trim().length > 0 &&
      frequency.some(Boolean) &&
      sharingOption.trim().length > 0 &&
      successCriteria.trim().length > 0
    );
  };

  // Validation for form submission (with alerts)
  const isFormValid = () => {
    const hasFrequencyDays = frequency.some(Boolean);
    
    if (!hasFrequencyDays) {
      Alert.alert('Frequency Required', 'Please select at least one day of the week to work on your goal.');
      return false;
    }
    
    return (
      title.trim().length > 0 &&
      category.trim().length > 0 &&
      description.trim().length > 0 &&
      startDate.trim().length > 0 &&
      endDate.trim().length > 0 &&
      hasFrequencyDays &&
      sharingOption.trim().length > 0 &&
      successCriteria.trim().length > 0
    );
  };

  const handleCreateGoal = async () => {
    if (!isFormValid()) {
      Alert.alert('Missing Information', 'Please fill in all fields before creating your goal.');
      return;
    }

    const goalData: CreateGoalData = {
      title: title.trim(),
      description: description.trim() || undefined,
      category: category || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      frequency: frequency,
      time_commitment: timeCommitment || undefined,
      sharing_option: sharingOption || undefined,
      success_criteria: successCriteria.trim() || undefined,
      milestone_count: milestoneCount > 0 ? milestoneCount : undefined,
      milestones: milestoneCount > 0 ? milestones.filter(m => m.trim().length > 0) : undefined,
    };

    const newGoal = await createGoal(goalData);
    if (newGoal) {
      Alert.alert(
        'Goal Created!', 
        'Your goal has been created successfully. Would you like to share your progress with a daily post?',
        [
          { 
            text: 'Skip', 
            style: 'cancel',
            onPress: () => {
              onGoalCreated(newGoal.id);
              onClose();
              resetForm();
            }
          },
          { 
            text: 'Share Progress', 
            onPress: () => {
              onGoalCreated(newGoal.id);
              onClose();
              resetForm();
            }
          }
        ]
      );
    } else if (error) {
      Alert.alert('Error', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setDescription('');
    setStartDate(() => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    });
    setEndDate('');
    setFrequency([false, false, false, false, false, false, false]);
    setTimeCommitment('');
    setCheckInSchedule('');
    setSharingOption('Public');
    setSuccessCriteria('');
    setMilestoneCount(0);
    setMilestones([]);
    setShowCategories(false);
    setShowTimeCommitments(false);
    setShowCheckInSchedules(false);
    setShowSharingOptions(false);
    setShowDatePicker(false);
  };

  const toggleFrequencyDay = (index: number) => {
    const newFrequency = [...frequency];
    newFrequency[index] = !newFrequency[index];
    setFrequency(newFrequency);
  };

  const handleMilestoneCountChange = (count: number) => {
    if (milestoneCount === count) {
      // If clicking the same number, untick it
      setMilestoneCount(0);
      setMilestones([]);
    } else {
      // If clicking a different number, set it
      setMilestoneCount(count);
      setMilestones(new Array(count).fill(''));
    }
  };

  const updateMilestone = (index: number, text: string) => {
    const newMilestones = [...milestones];
    newMilestones[index] = text;
    setMilestones(newMilestones);
  };

  // Helper to format date as readable string
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Handler for date picker
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const iso = selectedDate.toISOString().slice(0, 10);
      if (datePickerMode === 'start') {
        setStartDate(iso);
      } else {
        setEndDate(iso);
      }
    }
    
    // Close picker on Android or when dismissed
    if (Platform.OS === 'android' || event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const DropdownSection = ({ 
    title, 
    value, 
    placeholder, 
    options, 
    onSelect, 
    showDropdown, 
    setShowDropdown,
    required = false 
  }: {
    title: string;
    value: string;
    placeholder: string;
    options: string[];
    onSelect: (value: string) => void;
    showDropdown: boolean;
    setShowDropdown: (show: boolean) => void;
    required?: boolean;
  }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
        {title}{required && ' *'}
      </Text>
      <TouchableOpacity
        onPress={() => setShowDropdown(!showDropdown)}
        style={[styles.dropdown, { backgroundColor: 'rgba(128, 128, 128, 0.15)', borderColor: theme.borderSecondary }]}
      >
        <Text style={[styles.dropdownText, { color: theme.textPrimary }, !value && { color: theme.textTertiary }]}>
          {value || placeholder}
        </Text>
        <Ionicons 
          name={showDropdown ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={theme.textSecondary} 
        />
      </TouchableOpacity>
      
      {showDropdown && (
        <View style={[styles.dropdownOptions, { backgroundColor: 'rgba(128, 128, 128, 0.15)', borderColor: theme.borderSecondary }]}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={option}
              onPress={() => {
                onSelect(option);
                setShowDropdown(false);
              }}
              style={[
                styles.dropdownOption,
                index < options.length - 1 && [styles.dropdownOptionBorder, { borderBottomColor: theme.borderSecondary }]
              ]}
            >
              <Text style={[
                styles.dropdownOptionText,
                { color: theme.textPrimary },
                value === option && [styles.selectedOptionText, { color: theme.primary }]
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={() => {}}>
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            {/* Header */}
            <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 60 : 16 }]}>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>New Goal</Text>
              <TouchableOpacity
                style={[
                  styles.createButton,
                  { backgroundColor: isFormValidForUI() ? '#ffffff' : 'rgba(128, 128, 128, 0.15)' },
                  (loading || !isFormValidForUI()) && styles.createButtonDisabled
                ]}
                onPress={handleCreateGoal}
                disabled={loading || !isFormValidForUI()}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.createButtonText,
                  { color: isFormValidForUI() ? '#000000' : '#ffffff' },
                  (loading || !isFormValidForUI()) && styles.createButtonTextDisabled
                ]}>
                  {loading ? 'Creating...' : 'Create Goal'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.scrollView} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Goal Title */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Goal Title *</Text>
                <TextInput
                  value={title}
                  onChangeText={handleTitleChange}
                  placeholder="What do you want to achieve?"
                  placeholderTextColor={theme.textTertiary}
                  style={[styles.textInput, { backgroundColor: 'rgba(128, 128, 128, 0.15)', color: theme.textPrimary, borderColor: theme.borderSecondary }]}
                  maxLength={100}
                  autoCorrect={true}
                  autoCapitalize="words"
                  textContentType="none"
                  autoComplete="off"
                />
                <Text style={[styles.characterCount, { color: theme.textSecondary }]}>{title.length}/100 characters</Text>
              </View>

              {/* Goal Category */}
              <DropdownSection
                title="Goal Category"
                value={category}
                placeholder="Select a category"
                options={CATEGORIES}
                onSelect={setCategory}
                showDropdown={showCategories}
                setShowDropdown={setShowCategories}
                required
              />

              {/* Description */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Description / Why this matters</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Powerful for motivation</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe your goal and why it's important to you..."
                  placeholderTextColor={theme.textTertiary}
                  style={[styles.textInput, styles.textAreaInput, { backgroundColor: 'rgba(128, 128, 128, 0.15)', color: theme.textPrimary, borderColor: theme.borderSecondary }]}
                  multiline
                  textAlignVertical="top"
                  maxLength={500}
                />
                <Text style={[styles.characterCount, { color: theme.textSecondary }]}>{description.length}/500 characters</Text>
              </View>

              {/* Frequency */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Frequency</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Select days to work on this goal</Text>
                <View style={[styles.frequencyContainer, { backgroundColor: 'rgba(128, 128, 128, 0.15)', borderColor: theme.borderSecondary }]}>
                  {days.map((day, index) => (
                    <View key={index} style={styles.dayContainer}>
                      <Text style={[styles.dayLabel, { color: theme.textSecondary }]}>{day}</Text>
                      <TouchableOpacity
                        onPress={() => toggleFrequencyDay(index)}
                        style={[
                          styles.checkbox,
                          { borderColor: theme.borderSecondary },
                          frequency[index] && [styles.checkboxSelected, { backgroundColor: theme.primary, borderColor: theme.primary }]
                        ]}
                      >
                        {frequency[index] && (
                          <Ionicons name="checkmark" size={16} color="#ffffff" />
                        )}
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>

              {/* Check-in Schedule Info */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Check-in Schedule</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                  Your goal will appear on the calendar on the selected days above
                </Text>
                <View style={[styles.checkinInfoContainer, { backgroundColor: 'rgba(128, 128, 128, 0.1)', borderColor: theme.borderSecondary }]}>
                  <View style={styles.checkinInfoRow}>
                    <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                    <Text style={[styles.checkinInfoText, { color: theme.textSecondary }]}>
                      {frequency.filter(Boolean).length > 0 
                        ? `Check-ins available ${frequency.filter(Boolean).length} days per week`
                        : 'Select frequency days above to enable check-ins'
                      }
                    </Text>
                  </View>
                  {frequency.some(Boolean) && (
                    <>
                      <View style={styles.checkinInfoRow}>
                        <Ionicons name="checkmark-circle-outline" size={20} color={theme.primary} />
                        <Text style={[styles.checkinInfoText, { color: theme.textSecondary }]}>
                          Selected days: {days.filter((_, index) => frequency[index]).join(', ')}
                        </Text>
                      </View>
                      <View style={styles.checkinInfoRow}>
                        <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
                        <Text style={[styles.checkinInfoText, { color: theme.textSecondary }]}>
                          Check-ins will appear on these days in your weekly calendar
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>

              {/* Time Commitment */}
              <DropdownSection
                title="Time Commitment per Session"
                value={timeCommitment}
                placeholder="Select time commitment (optional)"
                options={TIME_COMMITMENTS}
                onSelect={setTimeCommitment}
                showDropdown={showTimeCommitments}
                setShowDropdown={setShowTimeCommitments}
              />

              {/* Start and End Dates */}
              <View style={styles.section}>
                <View style={styles.dateRow}>
                  {/* Start Date */}
                  <View style={styles.dateColumn}>
                    <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Start Date</Text>
                    <TouchableOpacity
                      style={[
                        styles.datePickerButton, 
                        { backgroundColor: 'rgba(128, 128, 128, 0.15)', borderColor: theme.borderSecondary }
                      ]}
                      onPress={() => {
                        setDatePickerMode('start');
                        setShowDatePicker(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.datePickerText, { color: startDate ? theme.textPrimary : theme.textTertiary }]}>
                        {startDate ? formatDate(startDate) : 'Select start date'}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {/* End Date */}
                  <View style={styles.dateColumn}>
                    <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>End Date</Text>
                    <TouchableOpacity
                      style={[
                        styles.datePickerButton, 
                        { backgroundColor: 'rgba(128, 128, 128, 0.15)', borderColor: theme.borderSecondary }
                      ]}
                      onPress={() => {
                        setDatePickerMode('end');
                        setShowDatePicker(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.datePickerText, { color: endDate ? theme.textPrimary : theme.textTertiary }]}>
                        {endDate ? formatDate(endDate) : 'Select end date'}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Date Picker */}
              {showDatePicker && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={
                      datePickerMode === 'start'
                        ? (startDate ? new Date(startDate) : new Date())
                        : (endDate ? new Date(endDate) : new Date())
                    }
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={[styles.doneButton, { backgroundColor: theme.primary }]}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Buddy or Public Sharing */}
              <DropdownSection
                title="Buddy or Public Sharing?"
                value={sharingOption}
                placeholder="Choose sharing level"
                options={SHARING_OPTIONS}
                onSelect={setSharingOption}
                showDropdown={showSharingOptions}
                setShowDropdown={setShowSharingOptions}
                required
              />

              {/* Success Criteria */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>What does success look like?</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>e.g. "Lose 5kg", "Finish reading 3 books"</Text>
                <TextInput
                  value={successCriteria}
                  onChangeText={setSuccessCriteria}
                  placeholder="Define your success criteria..."
                  placeholderTextColor={theme.textTertiary}
                  style={[styles.textInput, styles.textAreaInput, { backgroundColor: 'rgba(128, 128, 128, 0.15)', color: theme.textPrimary, borderColor: theme.borderSecondary }]}
                  multiline
                  textAlignVertical="top"
                  maxLength={200}
                />
                <Text style={[styles.characterCount, { color: theme.textSecondary }]}>{successCriteria.length}/200 characters</Text>
              </View>

              {/* Milestones */}
              <View style={[styles.section, styles.lastSection]}>
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Milestones</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>Optional: break goal into smaller steps</Text>
                
                {/* Milestone Count Selection */}
                <Text style={[styles.milestoneCountLabel, { color: theme.textPrimary }]}>How many milestones?</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.milestoneCountScrollContainer}>
                  {[...Array(10)].map((_, index) => {
                    const count = index + 1;
                    const isSelected = milestoneCount === count;
                    return (
                      <TouchableOpacity
                        key={count}
                        onPress={() => handleMilestoneCountChange(count)}
                        style={[
                          styles.milestoneCountButton,
                          { backgroundColor: 'rgba(128, 128, 128, 0.15)', borderColor: theme.borderSecondary },
                          isSelected && [styles.milestoneCountButtonSelected, { backgroundColor: theme.primary, borderColor: theme.primary }]
                        ]}
                      >
                        <Text style={[
                          styles.milestoneCountButtonText,
                          { color: theme.textSecondary },
                          isSelected && [styles.milestoneCountButtonTextSelected, { color: '#ffffff' }]
                        ]}>
                          {count}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Dynamic Milestone Inputs */}
                {milestoneCount > 0 && (
                  <View style={styles.milestonesInputContainer}>
                    {milestones.map((milestone, index) => (
                      <View key={index} style={styles.milestoneInputWrapper}>
                        <Text style={[styles.milestoneInputLabel, { color: theme.textPrimary }]}>
                          Milestone {index + 1}
                        </Text>
                        <TextInput
                          value={milestone}
                          onChangeText={(text) => updateMilestone(index, text)}
                          placeholder={`Enter milestone ${index + 1}...`}
                          placeholderTextColor={theme.textTertiary}
                          style={[styles.textInput, { backgroundColor: 'rgba(128, 128, 128, 0.15)', color: theme.textPrimary, borderColor: theme.borderSecondary }]}
                          maxLength={100}
                        />
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Error Message */}
              {error && (
                <View style={[styles.errorContainer, { backgroundColor: 'rgba(220, 38, 38, 0.1)' }]}>
                  <Text style={[styles.errorText, { color: '#dc2626' }]}>{error}</Text>
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonDisabled: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  createButtonTextDisabled: {
    color: 'rgba(0, 0, 0, 0.3)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  lastSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textAreaInput: {
    minHeight: 80,
    maxHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'right',
  },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1f2937',
  },
  placeholderText: {
    color: '#9ca3af',
  },
  dropdownOptions: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownOptionBorder: {
    borderBottomWidth: 1,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#1f2937',
  },
  selectedOptionText: {
    color: '#129490',
    fontWeight: '600',
  },
  frequencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dayContainer: {
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#129490',
    borderColor: '#129490',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    fontSize: 14,
  },
  milestoneCountLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 12,
    marginTop: 8,
  },
  milestoneCountContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  milestoneCountButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneCountButtonSelected: {
    backgroundColor: '#129490',
    borderColor: '#129490',
  },
  milestoneCountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  milestoneCountButtonTextSelected: {
    color: '#ffffff',
  },
  milestonesInputContainer: {
    gap: 16,
  },
  milestoneInputWrapper: {
    gap: 8,
  },
  milestoneInputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  milestoneCountScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  dateColumn: {
    flex: 1,
  },
  datePickerButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 2,
    marginBottom: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerText: {
    fontSize: 16,
    flex: 1,
  },
  datePickerContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
  },
  doneButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  checkinInfoContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 12,
  },
  checkinInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  checkinInfoText: {
    fontSize: 14,
    flex: 1,
  },
});