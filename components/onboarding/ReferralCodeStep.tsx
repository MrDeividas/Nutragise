import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../state/themeStore';

interface ReferralCodeStepProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
}

export default function ReferralCodeStep({ value, onChange, onNext }: ReferralCodeStepProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.question, { color: theme.textPrimary }]}>
        Do you have a referral code?
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        If someone referred you, enter their code below
      </Text>

      <TextInput
        style={[styles.input, {
          backgroundColor: 'rgba(128, 128, 128, 0.15)',
          borderColor: theme.borderSecondary,
          color: theme.textPrimary
        }]}
        placeholder="Enter referral code (optional)"
        placeholderTextColor={theme.textTertiary}
        value={value}
        onChangeText={onChange}
        autoCapitalize="characters"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={[styles.skipButton, { backgroundColor: 'transparent' }]}
        onPress={onNext}
      >
        <Text style={[styles.skipText, { color: theme.textSecondary }]}>
          Skip for now
        </Text>
      </TouchableOpacity>
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

