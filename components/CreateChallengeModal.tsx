import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  TextInput,
  Alert,
  ActivityIndicator,
  Clipboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../state/themeStore';
import { CreateChallengeData } from '../types/challenges';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateChallengeData, type: 'private' | 'public') => Promise<void>;
  editMode?: boolean;
  initialData?: Partial<CreateChallengeData>;
}

export default function CreateChallengeModal({ visible, onClose, onSubmit, editMode = false, initialData }: Props) {
  const { theme } = useTheme();
  const [step, setStep] = useState(1);
  const [challengeType, setChallengeType] = useState<'private' | 'public'>('private');
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || 'fitness');
  const [durationDays, setDurationDays] = useState<number>(7);
  const [entryFee, setEntryFee] = useState<number>(10);
  const [requirementText, setRequirementText] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleReset = () => {
    setStep(1);
    setChallengeType('private');
    setTitle('');
    setDescription('');
    setCategory('fitness');
    setDurationDays(7);
    setEntryFee(10);
    setRequirementText('');
    setFrequency('daily');
    setStartDate(new Date());
    setShowDatePicker(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const validateStep2 = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a challenge title');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a challenge description');
      return false;
    }
    if (!requirementText.trim()) {
      Alert.alert('Error', 'Please enter at least one requirement');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      // Use selected start date, set to start of day (midnight)
      const selectedStart = new Date(startDate);
      selectedStart.setHours(0, 0, 0, 0);
      const startDateISO = selectedStart.toISOString();
      
      // Calculate end date: midnight on the day AFTER the last day
      // This gives users the full duration without the challenge ending mid-day
      const endDate = new Date(selectedStart.getTime() + durationDays * 24 * 60 * 60 * 1000);
      endDate.setHours(0, 0, 0, 0); // Midnight on the next day
      const endDateISO = endDate.toISOString();

      const challengeData: CreateChallengeData = {
        title,
        description,
        category,
        duration_weeks: Math.ceil(durationDays / 7),
        entry_fee: entryFee,
        verification_type: 'photo',
        start_date: startDateISO,
        end_date: endDateISO,
        visibility: challengeType,
        requirements: [
          {
            requirement_text: requirementText,
            frequency,
            target_count: frequency === 'daily' ? durationDays : Math.ceil(durationDays / 7),
          },
        ],
      };

      await onSubmit(challengeData, challengeType);
      handleClose();
    } catch (error) {
      console.error('Error creating challenge:', error);
      Alert.alert('Error', 'Failed to create challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Choose Challenge Type</Text>
      <Text style={[styles.stepDescription, { color: theme.textSecondary }]}>
        Select whether you want to create a private challenge for friends or request a public challenge
      </Text>

      <TouchableOpacity
        style={[
          styles.typeOption,
          { backgroundColor: theme.cardBackground, borderColor: challengeType === 'private' ? theme.primary : theme.border },
        ]}
        onPress={() => setChallengeType('private')}
      >
        <View style={styles.typeIconContainer}>
          <Ionicons
            name="lock-closed"
            size={32}
            color={challengeType === 'private' ? theme.primary : theme.textSecondary}
          />
        </View>
        <View style={styles.typeTextContainer}>
          <Text style={[styles.typeTitle, { color: theme.textPrimary }]}>Private Challenge</Text>
          <Text style={[styles.typeDescription, { color: theme.textSecondary }]}>
            Create a challenge with a join code. Share with friends to compete together.
          </Text>
        </View>
        {challengeType === 'private' && (
          <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.typeOption,
          { backgroundColor: theme.cardBackground, borderColor: challengeType === 'public' ? theme.primary : theme.border },
        ]}
        onPress={() => setChallengeType('public')}
      >
        <View style={styles.typeIconContainer}>
          <Ionicons
            name="globe"
            size={32}
            color={challengeType === 'public' ? theme.primary : theme.textSecondary}
          />
        </View>
        <View style={styles.typeTextContainer}>
          <Text style={[styles.typeTitle, { color: theme.textPrimary }]}>Public Challenge Request</Text>
          <Text style={[styles.typeDescription, { color: theme.textSecondary }]}>
            Request a new public challenge. Our team will review and potentially add it to the app.
          </Text>
        </View>
        {challengeType === 'public' && (
          <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.nextButton, { backgroundColor: theme.primary }]}
        onPress={() => setStep(2)}
      >
        <Text style={styles.nextButtonText}>Next</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <ScrollView 
      style={styles.stepContentScrollView}
      contentContainerStyle={styles.stepContentContainer}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Challenge Details</Text>

      {/* Title */}
      <Text style={[styles.label, { color: theme.textPrimary }]}>Title *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.textPrimary, borderColor: theme.border }]}
        placeholder="Enter challenge title"
        placeholderTextColor={theme.textSecondary}
        value={title}
        onChangeText={setTitle}
      />

      {/* Description */}
      <Text style={[styles.label, { color: theme.textPrimary }]}>Description *</Text>
      <TextInput
        style={[styles.textArea, { backgroundColor: theme.cardBackground, color: theme.textPrimary, borderColor: theme.border }]}
        placeholder="Describe your challenge..."
        placeholderTextColor={theme.textSecondary}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      {/* Start Date */}
      <Text style={[styles.label, { color: theme.textPrimary }]}>Start Date</Text>
      <TouchableOpacity
        style={[styles.datePickerButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar-outline" size={20} color={theme.primary} />
        <Text style={[styles.datePickerText, { color: theme.textPrimary }]}>
          {startDate.toLocaleDateString('en-GB', { 
            weekday: 'short', 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          })}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}
      {Platform.OS === 'ios' && showDatePicker && (
        <TouchableOpacity
          style={[styles.datePickerDoneButton, { backgroundColor: theme.primary }]}
          onPress={() => setShowDatePicker(false)}
        >
          <Text style={styles.datePickerDoneText}>Done</Text>
        </TouchableOpacity>
      )}

      {/* Duration */}
      <Text style={[styles.label, { color: theme.textPrimary }]}>Duration</Text>
      <View style={styles.durationRow}>
        {[3, 7, 14, 30].map((days) => (
          <TouchableOpacity
            key={days}
            style={[
              styles.durationButton,
              { 
                backgroundColor: theme.cardBackground, 
                borderColor: durationDays === days ? theme.primary : theme.border,
                borderWidth: 2,
              },
            ]}
            onPress={() => setDurationDays(days)}
          >
            <Text style={[styles.durationLabel, { color: durationDays === days ? theme.primary : theme.textSecondary, fontWeight: durationDays === days ? '700' : '500' }]}>
              {days} days
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Entry Fee */}
      <Text style={[styles.label, { color: theme.textPrimary }]}>Entry Fee</Text>
      <View style={styles.entryFeeRow}>
        {[10, 20, 30, 40, 50].map((fee) => (
          <TouchableOpacity
            key={fee}
            style={[
              styles.entryFeeButton,
              { 
                backgroundColor: theme.cardBackground, 
                borderColor: entryFee === fee ? theme.primary : theme.border,
                borderWidth: 2,
              },
            ]}
            onPress={() => setEntryFee(fee)}
          >
            <Text style={[styles.entryFeeLabel, { color: entryFee === fee ? theme.primary : theme.textSecondary, fontWeight: entryFee === fee ? '700' : '500' }]}>
              £{fee}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Platform Fee Warning */}
      {entryFee > 0 && (
        <View style={[styles.warningBox, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
          <Ionicons name="warning" size={20} color="#F59E0B" />
          <Text style={styles.warningText}>
            Note: Platform takes 30% fee from non-PRO members who lose challenges with entry fees.
          </Text>
        </View>
      )}

      {/* Requirement */}
      <Text style={[styles.label, { color: theme.textPrimary }]}>Requirement *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.cardBackground, color: theme.textPrimary, borderColor: theme.border }]}
        placeholder="e.g., Walk 10,000 steps"
        placeholderTextColor={theme.textSecondary}
        value={requirementText}
        onChangeText={setRequirementText}
      />

      {/* Frequency */}
      <Text style={[styles.label, { color: theme.textPrimary }]}>Frequency</Text>
      <View style={styles.frequencyRow}>
        <TouchableOpacity
          style={[
            styles.frequencyButton,
            { backgroundColor: theme.cardBackground, borderColor: frequency === 'daily' ? theme.primary : theme.border },
          ]}
          onPress={() => setFrequency('daily')}
        >
          <Text style={[styles.frequencyLabel, { color: frequency === 'daily' ? theme.primary : theme.textSecondary }]}>
            Daily
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.frequencyButton,
            { backgroundColor: theme.cardBackground, borderColor: frequency === 'weekly' ? theme.primary : theme.border },
          ]}
          onPress={() => setFrequency('weekly')}
        >
          <Text style={[styles.frequencyLabel, { color: frequency === 'weekly' ? theme.primary : theme.textSecondary }]}>
            Weekly
          </Text>
        </TouchableOpacity>
      </View>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
          onPress={() => setStep(1)}
        >
          <Ionicons name="arrow-back" size={20} color={theme.textPrimary} />
          <Text style={[styles.backButtonText, { color: theme.textPrimary }]}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: theme.primary }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.createButtonText}>
                {challengeType === 'private' ? 'Create Challenge' : 'Send Request'}
              </Text>
              <Ionicons name="checkmark" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                  <Ionicons name="trophy" size={24} color={theme.primary} />
                  <Text style={[styles.title, { color: theme.textPrimary }]}>
                    {editMode ? 'Edit Challenge' : 'Create Challenge'}
                  </Text>
                </View>
                <View style={styles.closeButton}>
                  <View style={{ width: 32 }} />
                </View>
              </View>

              {/* Step Indicator */}
              <View style={styles.stepIndicator}>
                <View style={styles.stepDot}>
                  <View style={[styles.stepDotInner, { backgroundColor: step >= 1 ? theme.primary : theme.border }]} />
                  <Text style={[styles.stepLabel, { color: step >= 1 ? theme.primary : theme.textSecondary }]}>Type</Text>
                </View>
                <View style={[styles.stepLine, { backgroundColor: step >= 2 ? theme.primary : theme.border }]} />
                <View style={styles.stepDot}>
                  <View style={[styles.stepDotInner, { backgroundColor: step >= 2 ? theme.primary : theme.border }]} />
                  <Text style={[styles.stepLabel, { color: step >= 2 ? theme.primary : theme.textSecondary }]}>Details</Text>
                </View>
              </View>

              {/* Content */}
              {step === 1 ? renderStep1() : renderStep2()}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  stepDot: {
    alignItems: 'center',
    gap: 6,
  },
  stepDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 10,
  },
  stepContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stepContentScrollView: {
    flexGrow: 1,
  },
  stepContentContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 40,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  typeIconContainer: {
    marginRight: 12,
  },
  typeTextContainer: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationLabel: {
    fontSize: 13,
  },
  entryFeeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  entryFeeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryFeeLabel: {
    fontSize: 13,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  frequencyLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    gap: 10,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  datePickerDoneButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});

