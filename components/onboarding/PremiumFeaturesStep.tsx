import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../state/themeStore';

export default function PremiumFeaturesStep() {
  const { theme } = useTheme();

  const features = [
    {
      icon: '🧘',
      title: 'Meditation',
      description: 'Guided meditation sessions with progress tracking and variety of techniques',
    },
    {
      icon: '📚',
      title: 'Microlearning',
      description: 'Daily bite-sized lessons to expand your knowledge and skills',
    },
    {
      icon: '✨',
      title: 'Reflect',
      description: 'Deep reflection prompts and mood tracking (Free for now!)',
      isFree: true,
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>
        ✨ Premium Features
      </Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Unlock your full potential with these powerful habits
      </Text>

      {features.map((feature, index) => (
        <View
          key={index}
          style={[styles.featureCard, { backgroundColor: 'rgba(128, 128, 128, 0.1)', borderColor: theme.borderSecondary }]}
        >
          <Text style={styles.featureIcon}>{feature.icon}</Text>
          <View style={styles.featureContent}>
            <View style={styles.featureHeader}>
              <Text style={[styles.featureTitle, { color: theme.textPrimary }]}>
                {feature.title}
              </Text>
              {feature.isFree && (
                <View style={[styles.freeBadge, { backgroundColor: '#10B981' }]}>
                  <Text style={styles.freeBadgeText}>FREE</Text>
                </View>
              )}
            </View>
            <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
              {feature.description}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 40,
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
    marginBottom: 32,
  },
  featureCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  freeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  freeBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});

