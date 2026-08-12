import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  StyleSheet,
  ActivityIndicator,
  findNodeHandle,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import CustomBackground from '../components/CustomBackground';
import { useGoalsStore } from '../state/goalsStore';
import { CreateGoalData } from '../types/database';

const DARK = '#1f2937';
const MUTED = '#6B7280';

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
  '12 hours',
];

const SHARING_OPTIONS = ['Private', 'Friends', 'Public'] as const;

function todayIso() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function CreateGoalScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { createGoal, loading, error } = useGoalsStore();
  const scrollRef = useRef<ScrollView>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState('');
  const [frequency, setFrequency] = useState<boolean[]>([
    false, false, false, false, false, false, false,
  ]);
  const [timeCommitment, setTimeCommitment] = useState('');
  const [sharingOption, setSharingOption] = useState<(typeof SHARING_OPTIONS)[number]>('Public');
  const [successCriteria, setSuccessCriteria] = useState('');
  const [milestoneCount, setMilestoneCount] = useState(0);
  const [milestones, setMilestones] = useState<string[]>([]);
  const [showTimeCommitments, setShowTimeCommitments] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');

  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const scrollFocusedInputIntoView = (
    event: NativeSyntheticEvent<TextInputFocusEventData>
  ) => {
    const nodeHandle = findNodeHandle(event.target);
    if (nodeHandle == null) return;

    // Wait for the keyboard animation, then scroll the field above it
    setTimeout(() => {
      const responder = (scrollRef.current as any)?.getScrollResponder?.();
      responder?.scrollResponderScrollNativeHandleToKeyboard?.(nodeHandle, 120, true);
    }, 280);
  };

  const canCreate = title.trim().length > 0 && description.trim().length > 0;

  const handleCreateGoal = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Add a short title for your goal.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Description required', 'Describe your goal and why it matters.');
      return;
    }

    const goalData: CreateGoalData = {
      title: title.trim(),
      description: description.trim() || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      frequency: frequency.some(Boolean) ? frequency : undefined,
      time_commitment: timeCommitment || undefined,
      sharing_option: sharingOption || undefined,
      success_criteria: successCriteria.trim() || undefined,
      milestone_count: milestoneCount > 0 ? milestoneCount : undefined,
      milestones:
        milestoneCount > 0 ? milestones.filter((m) => m.trim().length > 0) : undefined,
    };

    const newGoal = await createGoal(goalData);
    if (newGoal) {
      navigation.navigate('MainTabs', { screen: 'Goals' });
    } else if (error) {
      Alert.alert('Error', error);
    }
  };

  const toggleFrequencyDay = (index: number) => {
    const next = [...frequency];
    next[index] = !next[index];
    setFrequency(next);
  };

  const handleMilestoneCountChange = (count: number) => {
    if (milestoneCount === count) {
      setMilestoneCount(0);
      setMilestones([]);
    } else {
      setMilestoneCount(count);
      setMilestones(new Array(count).fill(''));
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const iso = selectedDate.toISOString().slice(0, 10);
      if (datePickerMode === 'start') setStartDate(iso);
      else setEndDate(iso);
    }
    if (Platform.OS === 'android' || event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  return (
    <CustomBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={DARK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Goal</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
        >
            <Text style={styles.sectionLabel}>Basics</Text>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Goal title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="What do you want to achieve?"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                maxLength={100}
                autoCapitalize="sentences"
                autoCorrect
                spellCheck
                onFocus={scrollFocusedInputIntoView}
              />
              <Text style={styles.charCount}>{title.length}/100</Text>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Description *</Text>
              <Text style={styles.fieldHint}>Why this matters to you</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your goal…"
                placeholderTextColor="#9CA3AF"
                style={[styles.input, styles.textArea]}
                multiline
                textAlignVertical="top"
                maxLength={500}
                autoCapitalize="sentences"
                autoCorrect
                spellCheck
                onFocus={scrollFocusedInputIntoView}
              />
              <Text style={styles.charCount}>{description.length}/500</Text>
            </View>

            <Text style={styles.sectionLabel}>Schedule</Text>
            <View style={styles.card}>
              <Text style={[styles.fieldLabel, { marginBottom: 0 }]}>Frequency</Text>
              <Text style={styles.fieldHint}>
                Optional — pick the days you want to work on this. Those days show as check-in days to remind you.
              </Text>
              <View style={styles.frequencyRow}>
                {days.map((day, index) => {
                  const selected = frequency[index];
                  return (
                    <TouchableOpacity
                      key={`${day}-${index}`}
                      style={styles.dayCol}
                      onPress={() => toggleFrequencyDay(index)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.dayLabel}>{day}</Text>
                      <View style={[styles.dayCheck, selected && styles.dayCheckSelected]}>
                        {selected ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Dates</Text>
              <Text style={styles.fieldHint}>Recommended — start defaults to today</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setDatePickerMode('start');
                    setShowDatePicker(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.dateButtonLabel}>Start</Text>
                  <Text style={styles.dateButtonValue}>
                    {startDate ? formatDate(startDate) : 'Select'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setDatePickerMode('end');
                    setShowDatePicker(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.dateButtonLabel}>End</Text>
                  <Text style={styles.dateButtonValue}>
                    {endDate ? formatDate(endDate) : 'Optional'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker ? (
                <View style={styles.datePickerBox}>
                  <DateTimePicker
                    value={
                      datePickerMode === 'start'
                        ? startDate
                          ? new Date(startDate)
                          : new Date()
                        : endDate
                          ? new Date(endDate)
                          : new Date()
                    }
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                  />
                  {Platform.OS === 'ios' ? (
                    <TouchableOpacity
                      style={styles.doneChip}
                      onPress={() => setShowDatePicker(false)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.doneChipText}>Done</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Time per session</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowTimeCommitments((v) => !v)}
                activeOpacity={0.85}
              >
                <Text style={[styles.dropdownText, !timeCommitment && styles.placeholder]}>
                  {timeCommitment || 'Optional'}
                </Text>
                <Ionicons
                  name={showTimeCommitments ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={MUTED}
                />
              </TouchableOpacity>
              {showTimeCommitments ? (
                <View style={styles.dropdownList}>
                  {TIME_COMMITMENTS.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.dropdownOption}
                      onPress={() => {
                        setTimeCommitment(option);
                        setShowTimeCommitments(false);
                      }}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          timeCommitment === option && styles.dropdownOptionSelected,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>

            <Text style={styles.sectionLabel}>Visibility</Text>
            <View style={styles.shareOptions}>
              {SHARING_OPTIONS.map((option) => {
                const selected = sharingOption === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.shareChip, selected && styles.shareChipSelected]}
                    onPress={() => setSharingOption(option)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.shareChipText, selected && styles.shareChipTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>Success</Text>
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>What will it take?</Text>
              <Text style={styles.fieldHint}>
                Optional — what you’ll do or give up to make this happen
              </Text>
              <TextInput
                value={successCriteria}
                onChangeText={setSuccessCriteria}
                placeholder="e.g. Train 4× a week, cut late nights…"
                placeholderTextColor="#9CA3AF"
                style={[styles.input, styles.textArea]}
                multiline
                textAlignVertical="top"
                maxLength={200}
                autoCapitalize="sentences"
                autoCorrect
                spellCheck
                onFocus={scrollFocusedInputIntoView}
              />
              <Text style={styles.charCount}>{successCriteria.length}/200</Text>
            </View>

            <Text style={styles.sectionLabel}>Milestones</Text>
            <View style={styles.card}>
              <Text style={styles.fieldHint}>Optional — break the goal into steps</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.milestoneCountRow}
              >
                {[...Array(10)].map((_, index) => {
                  const count = index + 1;
                  const selected = milestoneCount === count;
                  return (
                    <TouchableOpacity
                      key={count}
                      style={[styles.milestoneCountBtn, selected && styles.milestoneCountBtnSelected]}
                      onPress={() => handleMilestoneCountChange(count)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.milestoneCountText,
                          selected && styles.milestoneCountTextSelected,
                        ]}
                      >
                        {count}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {milestoneCount > 0 ? (
                <View style={styles.milestoneInputs}>
                  {milestones.map((milestone, index) => (
                    <View key={index} style={styles.milestoneInputWrap}>
                      <Text style={styles.fieldLabel}>Milestone {index + 1}</Text>
                      <TextInput
                        value={milestone}
                        onChangeText={(text) => {
                          const next = [...milestones];
                          next[index] = text;
                          setMilestones(next);
                        }}
                        placeholder={`Enter milestone ${index + 1}…`}
                        placeholderTextColor="#9CA3AF"
                        style={styles.input}
                        maxLength={100}
                        autoCapitalize="sentences"
                        autoCorrect
                        spellCheck
                        onFocus={scrollFocusedInputIntoView}
                      />
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TouchableOpacity
            style={[styles.submitButton, (!canCreate || loading) && styles.submitDisabled]}
            onPress={handleCreateGoal}
            activeOpacity={0.85}
            disabled={!canCreate || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>Create goal</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </CustomBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: DARK,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    marginBottom: 22,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
    marginBottom: 6,
  },
  recommendedBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
    letterSpacing: 0.2,
  },
  fieldHint: {
    fontSize: 12,
    fontWeight: '500',
    color: MUTED,
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    backgroundColor: '#F8F9FB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: DARK,
    fontWeight: '500',
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: 6,
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  frequencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayCol: {
    alignItems: 'center',
    gap: 6,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: MUTED,
  },
  dayCheck: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#F8F9FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCheckSelected: {
    backgroundColor: DARK,
    borderColor: DARK,
  },
  scheduleHint: {
    fontSize: 12,
    lineHeight: 17,
    color: MUTED,
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8F9FB',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateButtonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: MUTED,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dateButtonValue: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
  },
  datePickerBox: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8F9FB',
    overflow: 'hidden',
  },
  doneChip: {
    alignSelf: 'flex-end',
    margin: 10,
    backgroundColor: DARK,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  doneChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8F9FB',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '500',
    color: DARK,
  },
  placeholder: {
    color: '#9CA3AF',
  },
  dropdownList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: DARK,
  },
  dropdownOptionSelected: {
    fontWeight: '700',
  },
  shareOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 22,
  },
  shareChip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareChipSelected: {
    borderColor: DARK,
    backgroundColor: '#F8FAFC',
  },
  shareChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED,
  },
  shareChipTextSelected: {
    color: DARK,
    fontWeight: '700',
  },
  milestoneCountRow: {
    gap: 8,
    paddingVertical: 4,
  },
  milestoneCountBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F8F9FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneCountBtnSelected: {
    backgroundColor: DARK,
    borderColor: DARK,
  },
  milestoneCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: MUTED,
  },
  milestoneCountTextSelected: {
    color: '#FFFFFF',
  },
  milestoneInputs: {
    marginTop: 14,
    gap: 12,
  },
  milestoneInputWrap: {
    gap: 0,
  },
  errorBox: {
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FCFAF9',
  },
  submitButton: {
    backgroundColor: DARK,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: {
    opacity: 0.55,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
