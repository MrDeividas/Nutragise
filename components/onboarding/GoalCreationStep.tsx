import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../../state/themeStore';

interface GoalCreationStepProps {
  value: any[];
  onChange: (goals: any[]) => void;
}

export default function GoalCreationStep({ value, onChange }: GoalCreationStepProps) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const addGoal = () => {
    if (title.trim()) {
      const newGoal = {
        title: title.trim(),
        description: description.trim(),
        category: 'Personal',
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
        milestones: [],
      };
      onChange([...value, newGoal]);
      setTitle('');
      setDescription('');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          Set Your First Goal 🎯
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          What do you want to achieve? (You need at least 1 goal)
        </Text>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, {
              backgroundColor: 'rgba(128, 128, 128, 0.15)',
              borderColor: theme.borderSecondary,
              color: theme.textPrimary
            }]}
            placeholder="Goal title (e.g., 'Lose 10 pounds')"
            placeholderTextColor={theme.textTertiary}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
            blurOnSubmit={false}
          />

          <TextInput
            style={[styles.input, styles.textArea, {
              backgroundColor: 'rgba(128, 128, 128, 0.15)',
              borderColor: theme.borderSecondary,
              color: theme.textPrimary
            }]}
            placeholder="Description (optional)"
            placeholderTextColor={theme.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={Keyboard.dismiss}
          />

          {value.length === 0 && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={addGoal}
            >
              <Text style={styles.addButtonText}>Add Goal</Text>
            </TouchableOpacity>
          )}
        </View>

        {value.length > 0 && (
          <View style={styles.goalsList}>
            {value.map((goal, index) => (
              <View key={index} style={[styles.goalCard, { backgroundColor: 'rgba(128, 128, 128, 0.1)', borderColor: theme.borderSecondary }]}>
                <Text style={[styles.goalTitle, { color: theme.textPrimary }]}>{goal.title}</Text>
                {goal.description && (
                  <Text style={[styles.goalDescription, { color: theme.textSecondary }]}>{goal.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  addButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  goalsList: {
    gap: 12,
  },
  goalCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 14,
  },
});

