import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../state/themeStore';
import SignatureScreen from 'react-native-signature-canvas';

interface AffirmationStepProps {
  value: boolean;
  onChange: (signed: boolean) => void;
}

const AFFIRMATIONS = [
  '🌟 "I am capable of achieving my goals, one step at a time."',
  '💪 "I have the strength and discipline to create positive change."',
  '🧠 "Every day, I grow wiser, stronger, and more focused."',
  '❤️ "I choose to embrace gratitude, positivity, and self-love today."',
  '🎯 "I am in control of my actions, and I move forward with purpose."',
];

export default function AffirmationStep({ value, onChange }: AffirmationStepProps) {
  const { theme } = useTheme();
  const [selectedAffirmation] = useState(AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
  const signatureRef = useRef<any>();

  const handleEnd = () => {
    onChange(true);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    onChange(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        Your Daily Affirmation
      </Text>

      <View style={[styles.affirmationCard, { backgroundColor: 'rgba(128, 128, 128, 0.1)', borderColor: theme.borderSecondary }]}>
        <Text style={[styles.affirmationText, { color: theme.textPrimary }]}>
          {selectedAffirmation}
        </Text>
      </View>

      <Text style={[styles.signatureLabel, { color: theme.textPrimary }]}>
        Sign below to commit:
      </Text>

      <View style={[styles.signatureContainer, { borderColor: theme.borderSecondary }]}>
        <SignatureScreen
          ref={signatureRef}
          onEnd={handleEnd}
          webStyle={`.m-signature-pad {box-shadow: none; border: none;} .m-signature-pad--body {border: none;}`}
        />
      </View>

      <TouchableOpacity
        style={[styles.clearButton, { backgroundColor: 'rgba(128, 128, 128, 0.2)' }]}
        onPress={handleClear}
      >
        <Text style={[styles.clearButtonText, { color: theme.textPrimary }]}>Clear</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    // Prevent any scroll interference
    overflow: 'hidden',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 32,
  },
  affirmationCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  affirmationText: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'center',
    fontWeight: '500',
  },
  signatureLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  signatureContainer: {
    height: 200,
    borderWidth: 2,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  clearButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

