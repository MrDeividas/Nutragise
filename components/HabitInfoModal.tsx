import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DailyHabits } from '../types/database';

interface Props {
  visible: boolean;
  onClose: () => void;
  habitType: string;
  data: DailyHabits | null;
}

const habitConfig = {
  sleep: {
    title: 'Sleep Information',
    icon: 'moon',
    fields: [
      { key: 'sleep_hours', label: 'Hours Slept', format: (value: number) => `${value} hours` },
      { key: 'sleep_quality', label: 'Sleep Quality', format: (value: number) => `${value}%` },
      { key: 'sleep_notes', label: 'Notes', format: (value: string) => value || 'No notes' }
    ]
  },
  water: {
    title: 'Water Intake Information',
    icon: 'water',
    fields: [
      { key: 'water_intake', label: 'Intake', format: (value: number) => `${value} glasses` },
      { key: 'water_goal', label: 'Goal', format: (value: string) => value || 'No goal set' },
      { key: 'water_notes', label: 'Notes', format: (value: string) => value || 'No notes' }
    ]
  },
  run: {
    title: 'Exercise Information',
    icon: 'walk',
    fields: [
      { key: 'run_activity_type', label: 'Sport', format: (value: string) => {
        if (!value) return 'Not specified';
        // Map 'run' back to 'Running' for display
        if (value === 'run') return 'Running';
        // Capitalize first letter of each word
        return value.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }},
      { key: 'run_type', label: 'Run Type', format: (value: string) => value || 'Not specified' },
      { key: 'run_distance', label: 'Distance', format: (value: number) => value ? `${value} km` : 'Not recorded' },
      { key: 'run_duration', label: 'Duration', format: (value: string) => value || 'Not recorded' },
      { key: 'run_notes', label: 'Notes', format: (value: string) => value || 'No notes' }
    ]
  },
  gym: {
    title: 'Gym Information',
    icon: 'barbell',
    fields: [
      { key: 'gym_training_types', label: 'Training Types', format: (value: string[]) => value?.join(', ') || 'None selected' },
      { key: 'gym_custom_type', label: 'Custom Type', format: (value: string) => value || 'None' }
    ]
  },
  reflect: {
    title: 'Reflection Information',
    icon: 'sparkles',
    fields: [
      { key: 'reflect_mood', label: 'Mood', format: (value: number) => `${value}/5` },
      { key: 'reflect_motivation', label: 'Motivation', format: (value: number) => `${value}/5` },
      { key: 'reflect_stress', label: 'Stress', format: (value: number) => `${value}/5` },
      { key: 'reflect_what_went_well', label: 'What Went Well', format: (value: string) => value || 'Not recorded' },
      { key: 'reflect_friction', label: 'Friction Points', format: (value: string) => value || 'Not recorded' },
      { key: 'reflect_one_tweak', label: 'One Tweak', format: (value: string) => value || 'Not recorded' },
      { key: 'reflect_nothing_to_change', label: 'Nothing to Change', format: (value: boolean) => value ? 'Yes' : 'No' }
    ]
  },
  cold_shower: {
    title: 'Cold Shower Information',
    icon: 'snow',
    fields: [
      { key: 'cold_shower_completed', label: 'Completed', format: (value: boolean) => value ? 'Yes' : 'No' }
    ]
  },
  focus: {
    title: 'Focus Session Information',
    icon: 'flash',
    fields: [
      { key: 'focus_duration', label: 'Duration', format: (value: number) => value ? `${value} minutes` : 'Not recorded' },
      { key: 'focus_start_time', label: 'Start Time', format: (value: string) => {
        if (!value) return 'Not recorded';
        const date = new Date(value);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }},
      { key: 'focus_end_time', label: 'End Time', format: (value: string) => {
        if (!value) return 'Not recorded';
        const date = new Date(value);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }},
      { key: 'focus_notes', label: 'Focus Task', format: (value: string) => value || 'No task recorded' }
    ]
  }
};

export default function HabitInfoModal({ visible, onClose, habitType, data }: Props) {
  const config = habitConfig[habitType as keyof typeof habitConfig];

  if (!config) return null;

  const renderField = (field: any) => {
    const value = data?.[field.key as keyof DailyHabits];
    if (value === undefined || value === null) return null;
    
    return (
      <View key={field.key} style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{field.label}</Text>
        <Text style={styles.fieldValue}>{field.format(value)}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.titleContainer}>
                  <View style={styles.iconContainer}>
                    <Ionicons name={config.icon as any} size={24} color="#10B981" />
                  </View>
                  <Text style={styles.title}>{config.title}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {data ? (
                  (() => {
                    const renderedFields = config.fields.map(renderField).filter(Boolean);
                    return renderedFields.length > 0 ? renderedFields : (
                      <View style={styles.emptyState}>
                        <Ionicons name="information-circle-outline" size={48} color="#999" />
                        <Text style={styles.emptyText}>No recorded information</Text>
                      </View>
                    );
                  })()
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="information-circle-outline" size={48} color="#999" />
                    <Text style={styles.emptyText}>No recorded information</Text>
                  </View>
                )}
              </ScrollView>

              {/* Footer - Future unlock button placeholder */}
              <View style={styles.footer}>
                <View style={styles.unlockPlaceholder}>
                  <Ionicons name="lock-closed" size={16} color="#999" />
                  <Text style={styles.unlockText}>Unlock editing (coming soon)</Text>
                </View>
              </View>
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
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 20,
    backgroundColor: 'white',
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    maxHeight: 400,
    backgroundColor: 'white',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    color: '#666',
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    color: '#999',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  unlockPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    opacity: 0.6,
  },
  unlockText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
    color: '#999',
  },
});
