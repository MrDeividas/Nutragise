import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/themeStore';
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
    title: 'Run Information',
    icon: 'walk',
    fields: [
      { key: 'run_day_type', label: 'Day Type', format: (value: string) => value === 'active' ? 'Active Day' : 'Rest Day' },
      { key: 'run_type', label: 'Run Type', format: (value: string) => value || 'Not specified' },
      { key: 'run_distance', label: 'Distance', format: (value: number) => `${value} km` },
      { key: 'run_duration', label: 'Duration', format: (value: string) => value || 'Not recorded' },
      { key: 'run_notes', label: 'Notes', format: (value: string) => value || 'No notes' }
    ]
  },
  gym: {
    title: 'Gym Information',
    icon: 'barbell',
    fields: [
      { key: 'gym_day_type', label: 'Day Type', format: (value: string) => value === 'active' ? 'Active Day' : 'Rest Day' },
      { key: 'gym_training_types', label: 'Training Types', format: (value: string[]) => value?.join(', ') || 'None selected' },
      { key: 'gym_custom_type', label: 'Custom Type', format: (value: string) => value || 'None' }
    ]
  },
  reflect: {
    title: 'Reflection Information',
    icon: 'sparkles',
    fields: [
      { key: 'reflect_mood', label: 'Mood', format: (value: number) => `${value}/5` },
      { key: 'reflect_energy', label: 'Energy', format: (value: number) => `${value}/5` },
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
  }
};

export default function HabitInfoModal({ visible, onClose, habitType, data }: Props) {
  const { theme } = useTheme();
  const config = habitConfig[habitType as keyof typeof habitConfig];

  if (!config) return null;

  const renderField = (field: any) => {
    const value = data?.[field.key as keyof DailyHabits];
    if (value === undefined || value === null) return null;
    
    return (
      <View key={field.key} style={styles.fieldRow}>
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{field.label}</Text>
        <Text style={[styles.fieldValue, { color: theme.textPrimary }]}>{field.format(value)}</Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.cardBackground, borderColor: theme.borderSecondary }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                <Ionicons name={config.icon as any} size={24} color="#10B981" />
              </View>
              <Text style={[styles.title, { color: theme.textPrimary }]}>{config.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {data ? (
              (() => {
                const renderedFields = config.fields.map(renderField).filter(Boolean);
                return renderedFields.length > 0 ? renderedFields : (
                  <View style={styles.emptyState}>
                    <Ionicons name="information-circle-outline" size={48} color={theme.textSecondary} />
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No recorded information</Text>
                  </View>
                );
              })()
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="information-circle-outline" size={48} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No recorded information</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer - Future unlock button placeholder */}
          <View style={styles.footer}>
            <View style={[styles.unlockPlaceholder, { backgroundColor: theme.borderSecondary }]}>
              <Ionicons name="lock-closed" size={16} color={theme.textSecondary} />
              <Text style={[styles.unlockText, { color: theme.textSecondary }]}>Unlock editing (coming soon)</Text>
            </View>
          </View>
        </View>
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
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
    maxHeight: 400,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  fieldValue: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.7,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  unlockPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    opacity: 0.6,
  },
  unlockText: {
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
}); 