import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../state/themeStore';

interface RatingsStepProps {
  value: any;
  onChange: (ratings: any) => void;
}

export default function RatingsStep({ value, onChange }: RatingsStepProps) {
  const { theme } = useTheme();
  const [showPotential, setShowPotential] = useState(false);

  const initialRatings = { physical: 45, mental: 45, social: 45, emotional: 45 };
  const potentialRatings = { physical: 85, mental: 85, social: 85, emotional: 85 };

  const handleShowPotential = () => {
    setShowPotential(true);
    onChange({
      initialRatings,
      potentialRatings,
    });
  };

  const currentRatings = showPotential ? potentialRatings : initialRatings;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        {showPotential ? 'Your Potential 🚀' : 'Your Starting Point 📊'}
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        {showPotential ? 'This is what you can achieve!' : "Here's where you are today"}
      </Text>

      <View style={styles.ratings}>
        {Object.entries(currentRatings).map(([category, value]) => (
          <View key={category} style={styles.ratingRow}>
            <Text style={[styles.ratingLabel, { color: theme.textPrimary }]}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
            <View style={[styles.progressBar, { backgroundColor: 'rgba(128, 128, 128, 0.2)' }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${value}%`,
                    backgroundColor: showPotential ? '#10B981' : theme.primary,
                  }
                ]}
              />
            </View>
            <Text style={[styles.ratingValue, { color: theme.textPrimary }]}>{value}%</Text>
          </View>
        ))}
      </View>

      {!showPotential && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleShowPotential}
        >
          <Text style={styles.buttonText}>Show Potential Rating</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  ratings: {
    gap: 24,
    marginBottom: 40,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: '600',
    width: 100,
  },
  progressBar: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginHorizontal: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '700',
    width: 50,
    textAlign: 'right',
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

