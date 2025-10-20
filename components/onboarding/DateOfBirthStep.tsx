import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../state/themeStore';

interface DateOfBirthStepProps {
  value: string;
  onChange: (value: string) => void;
}

export default function DateOfBirthStep({ value, onChange }: DateOfBirthStepProps) {
  const { theme } = useTheme();
  const [date, setDate] = useState(value ? new Date(value) : new Date(2000, 0, 1));
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    
    if (selectedDate) {
      setDate(selectedDate);
      onChange(selectedDate.toISOString().split('T')[0]);
    }
  };

  const showDatePicker = () => {
    setShowPicker(true);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.question, { color: theme.textPrimary }]}>
        When's your birthday?
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        We use this to personalize your experience
      </Text>

      {Platform.OS === 'android' && (
        <TouchableOpacity
          style={[styles.dateButton, { backgroundColor: theme.background, borderColor: theme.borderSecondary }]}
          onPress={showDatePicker}
        >
          <Text style={[styles.dateText, { color: theme.textPrimary }]}>
            {date.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
      )}

      {(showPicker || Platform.OS === 'ios') && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
            textColor={theme.textPrimary}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: 'center',
  },
  dateButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    alignItems: 'center',
    minWidth: 200,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
  },
  pickerContainer: {
    alignItems: 'center',
  },
});

