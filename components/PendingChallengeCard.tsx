import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Challenge } from '../types/challenges';
import { useTheme } from '../state/themeStore';

interface PendingChallengeCardProps {
  challenge: Challenge;
  onPress: (challenge: Challenge) => void;
}

export default function PendingChallengeCard({ challenge, onPress }: PendingChallengeCardProps) {
  const { theme } = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatEntryFee = (fee: number) => {
    if (fee === 0) return 'Free';
    return `£${fee}`;
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
      onPress={() => onPress(challenge)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.textPrimary }]} numberOfLines={2}>
            {challenge.title}
          </Text>
          <View style={styles.badgeContainer}>
            <View style={[styles.pendingBadge, { backgroundColor: '#F59E0B20' }]}>
              <Text style={[styles.pendingText, { color: '#F59E0B' }]}>Pending Review</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Ended: {formatDate(challenge.end_date)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            {challenge.participant_count || 0} participants
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="cash-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            {formatEntryFee(challenge.entry_fee)} entry • £{(challenge.participant_count || 0) * challenge.entry_fee} pot
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'flex-end',
  },
});

