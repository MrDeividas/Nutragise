import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Modal,
  Switch,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRemindersStore } from '../state/remindersStore';

interface NewReminderModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function NewReminderModal({ visible, onClose }: NewReminderModalProps) {
  const { theme } = useTheme();
  const { addReminder } = useRemindersStore();

  const [title, setTitle] = useState('');
  const [hasNotification, setHasNotification] = useState(false);
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly'>('none');
  
  // Default to today, an hour from now
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
    d.setSeconds(0);
    return d;
  });

  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const handleTitleChange = (text: string) => {
    if (text.length > 0) {
      setTitle(text.charAt(0).toUpperCase() + text.slice(1));
    } else {
      setTitle(text);
    }
  };

  const isFormValid = () => {
    return title.trim().length > 0;
  };

  const handleCreateReminder = async () => {
    if (!isFormValid() || isSaving) return;

    if (hasNotification && date < new Date() && repeat === 'none') {
      Alert.alert('Invalid Time', 'Please select a future time for the one-off notification.');
      return;
    }

    setIsSaving(true);
    try {
      await addReminder({
        title: title.trim(),
        time: hasNotification ? date.toISOString() : null,
        hasNotification,
        repeat: hasNotification ? repeat : 'none',
      });

      resetForm();
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Failed to save reminder.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setHasNotification(false);
    setRepeat('none');
    const d = new Date();
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
    d.setSeconds(0);
    setDate(d);
    setActivePicker(null);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setActivePicker(null);
    }
    if (selectedDate) {
      const newDate = new Date(date);
      newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setDate(newDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setActivePicker(null);
    }
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0);
      setDate(newDate);
    }
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isExpanded = hasNotification || activePicker !== null;
  const maxScrollHeight = Math.min(Dimensions.get('window').height * 0.45, 360);

  const formContent = (
    <>
      <View style={styles.sectionCompact}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>What do you need to do?</Text>
        <TextInput
          value={title}
          onChangeText={handleTitleChange}
          placeholder="e.g. Drink water, Take vitamins..."
          placeholderTextColor={theme.textTertiary}
          style={[styles.textInput, { backgroundColor: 'rgba(128, 128, 128, 0.15)', color: theme.textPrimary, borderColor: theme.borderSecondary }]}
          maxLength={100}
          autoCapitalize="sentences"
          autoCorrect={true}
        />
      </View>

      <View style={styles.toggleRow}>
        <View style={styles.toggleLeft}>
          <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>Remind me with a notification</Text>
        </View>
        <Switch
          value={hasNotification}
          onValueChange={(value) => {
            setHasNotification(value);
            if (!value) {
              setActivePicker(null);
            }
          }}
          trackColor={{ false: 'rgba(128, 128, 128, 0.15)', true: theme.primary }}
          thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : hasNotification ? '#FFFFFF' : '#f4f3f4'}
        />
      </View>

      {hasNotification && (
        <>
          <View style={styles.sectionExpanded}>
            <Text style={[styles.sectionTitleSmall, { color: theme.textPrimary }]}>Repeat</Text>
            <View style={styles.repeatRow}>
              {(['none', 'daily', 'weekly'] as const).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.repeatButton,
                    { borderColor: theme.borderSecondary },
                    repeat === opt && { backgroundColor: theme.primary, borderColor: theme.primary }
                  ]}
                  onPress={() => setRepeat(opt)}
                >
                  <Text style={[
                    styles.repeatText,
                    { color: theme.textPrimary },
                    repeat === opt && { color: '#FFFFFF', fontWeight: '600' }
                  ]}>
                    {opt === 'none' ? 'One-off' : opt === 'daily' ? 'Daily' : 'Weekly'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.sectionExpanded}>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[
                  styles.dateTimeButton,
                  { backgroundColor: 'rgba(128, 128, 128, 0.15)', borderColor: theme.borderSecondary },
                  activePicker === 'date' && { borderColor: theme.primary, borderWidth: 2 }
                ]}
                onPress={() => setActivePicker(activePicker === 'date' ? null : 'date')}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                <Text style={[styles.dateTimeText, { color: theme.textPrimary }]}>{formatDate(date)}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dateTimeButton,
                  { backgroundColor: 'rgba(128, 128, 128, 0.15)', borderColor: theme.borderSecondary },
                  activePicker === 'time' && { borderColor: theme.primary, borderWidth: 2 }
                ]}
                onPress={() => setActivePicker(activePicker === 'time' ? null : 'time')}
              >
                <Ionicons name="time-outline" size={20} color={theme.primary} />
                <Text style={[styles.dateTimeText, { color: theme.textPrimary }]}>{formatTime(date)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {Platform.OS === 'ios' && activePicker && (
            <View style={styles.pickerContainer}>
              <Text style={[styles.pickerLabel, { color: theme.textSecondary }]}>
                {activePicker === 'date' ? 'Select date' : 'Select time'}
              </Text>
              <View style={styles.pickerControlWrapper}>
                <DateTimePicker
                  value={date}
                  mode={activePicker}
                  display="compact"
                  themeVariant="light"
                  onChange={activePicker === 'date' ? handleDateChange : handleTimeChange}
                  style={styles.dateTimePickerCompact}
                />
              </View>
              <TouchableOpacity onPress={() => setActivePicker(null)} style={styles.pickerDoneTouchable}>
                <Text style={{ color: theme.primary, fontWeight: '600' }}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          {Platform.OS === 'android' && activePicker && (
            <DateTimePicker
              value={date}
              mode={activePicker}
              display="default"
              onChange={activePicker === 'date' ? handleDateChange : handleTimeChange}
            />
          )}
        </>
      )}
    </>
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoiding}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <View style={[styles.modalContainer, { backgroundColor: '#FFFFFF' }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <TouchableOpacity onPress={() => { resetForm(); onClose(); }}>
                  <Ionicons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.headerCenter}>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Add Reminder</Text>
              </View>
              <View style={styles.headerRight} />
            </View>

            {isExpanded ? (
              <ScrollView
                style={[styles.scrollView, { maxHeight: maxScrollHeight }]}
                contentContainerStyle={styles.contentExpanded}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                nestedScrollEnabled
              >
                {formContent}
              </ScrollView>
            ) : (
              <View style={styles.contentCompact}>
                {formContent}
              </View>
            )}
            
            {/* Create Button */}
            <View style={[styles.bottomButtonContainer, { borderTopColor: theme.borderSecondary }]}>
              <TouchableOpacity
                style={[
                  styles.createButton,
                  { backgroundColor: isFormValid() && !isSaving ? theme.primary : 'rgba(128, 128, 128, 0.3)' }
                ]}
                onPress={handleCreateReminder}
                disabled={!isFormValid() || isSaving}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.createButtonText,
                  { color: isFormValid() && !isSaving ? '#ffffff' : 'rgba(0, 0, 0, 0.3)' }
                ]}>
                  {isSaving ? 'Saving...' : 'Save Reminder'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  keyboardAvoiding: {
    flex: 1,
    width: '100%',
    maxWidth: 400,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    flexShrink: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  headerLeft: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flexGrow: 0,
    flexShrink: 1,
  },
  contentCompact: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  contentExpanded: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionCompact: {
    marginBottom: 12,
  },
  sectionExpanded: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionTitleSmall: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleLeft: {
    flex: 1,
    paddingRight: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  toggleDescription: {
    fontSize: 14,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  dateTimeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  repeatRow: {
    flexDirection: 'row',
    gap: 8,
  },
  repeatButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  repeatText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pickerContainer: {
    backgroundColor: 'rgba(128, 128, 128, 0.08)',
    borderRadius: 12,
    marginBottom: 8,
    paddingTop: 12,
    paddingBottom: 8,
    alignItems: 'center',
    width: '100%',
  },
  pickerLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  pickerControlWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTimePickerCompact: {
    alignSelf: 'center',
  },
  pickerDoneTouchable: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  bottomButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    flexShrink: 0,
  },
  createButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
