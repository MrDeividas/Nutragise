import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../state/themeStore';

interface Option {
  emoji: string;
  text: string;
  value: string;
}

interface OptionSelectorProps {
  question: string;
  subtitle?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}

export default function OptionSelector({ question, subtitle, options, value, onChange }: OptionSelectorProps) {
  const { theme } = useTheme();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={[styles.question, { color: theme.textPrimary }]}>
        {question}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </Text>
      )}

      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionCard,
              {
                backgroundColor: value === option.value
                  ? theme.primary + '20'
                  : 'rgba(128, 128, 128, 0.1)',
                borderColor: value === option.value
                  ? theme.primary
                  : theme.borderSecondary,
              }
            ]}
            onPress={() => onChange(option.value)}
          >
            <Text style={styles.emoji}>{option.emoji}</Text>
            <Text style={[styles.optionText, { color: theme.textPrimary }]}>
              {option.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 40,
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
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
});

