import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Challenge } from '../types/challenges';
import { getChallengeDisplayTitle } from '../lib/challengeTitleUtils';

const DARK = '#1f2937';
const MUTED = '#6B7280';

interface PendingChallengeCardProps {
  challenge: Challenge;
  onPress: (challenge: Challenge) => void;
}

export default function PendingChallengeCard({ challenge, onPress }: PendingChallengeCardProps) {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatEntryFee = (fee: number) => (fee === 0 ? 'Free' : `£${fee}`);

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(challenge)} activeOpacity={0.85}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {getChallengeDisplayTitle(challenge.title)}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Flagged</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={16} color={MUTED} />
        <Text style={styles.infoText}>Ended {formatDate(challenge.end_date)}</Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="people-outline" size={16} color={MUTED} />
        <Text style={styles.infoText}>{challenge.participant_count || 0} participants</Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="cash-outline" size={16} color={MUTED} />
        <Text style={styles.infoText}>
          {formatEntryFee(challenge.entry_fee)} entry · £
          {(challenge.participant_count || 0) * challenge.entry_fee} pot
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Review submissions</Text>
        <Ionicons name="chevron-forward" size={18} color={MUTED} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
  },
  badge: {
    backgroundColor: '#FEF2F2',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    color: MUTED,
  },
  footer: {
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK,
  },
});
